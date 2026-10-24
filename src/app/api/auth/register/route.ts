import { eq } from "drizzle-orm";
import { db } from "@/db";
import { clientProfiles, policyAcceptances, users } from "@/db/schema";
import { handleRouteError, jsonError, jsonOk } from "@/lib/api";
import { createSession } from "@/lib/auth/session";
import { writeAuditLog } from "@/lib/audit";
import { hashPassword, isStrongPassword } from "@/lib/crypto";
import { newId } from "@/lib/ids";
import { DRAFT_POLICIES } from "@/lib/legal/policies";
import { utcNow } from "@/lib/utils";
import { registerClientSchema } from "@/lib/validations";

export async function POST(req: Request) {
  try {
    const body = registerClientSchema.parse(await req.json());
    if (!isStrongPassword(body.password)) {
      return jsonError(
        "Password must be at least 10 characters and include upper, lower, number, and special character",
        400
      );
    }

    const email = body.email.toLowerCase().trim();
    const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
    if (existing) return jsonError("Email already registered", 409);

    const id = newId("usr");
    const now = utcNow();
    const passwordHash = await hashPassword(body.password);

    await db.insert(users).values({
      id,
      name: body.name.trim(),
      email,
      passwordHash,
      role: "client",
      accountStatus: "active",
      createdAt: now,
      updatedAt: now,
    });

    await db.insert(clientProfiles).values({
      id: newId("cprof"),
      userId: id,
      phone: body.phone ?? null,
      province: body.province ?? null,
      preferredLanguage: "en",
      createdAt: now,
      updatedAt: now,
    });

    const terms = DRAFT_POLICIES.find((p) => p.policyType === "terms")!;
    const privacy = DRAFT_POLICIES.find((p) => p.policyType === "privacy")!;

    await db.insert(policyAcceptances).values([
      {
        id: newId("pac"),
        userId: id,
        policyType: "terms",
        policyVersion: terms.version,
        acceptedAt: now,
        consentDetails: "Accepted during registration",
      },
      {
        id: newId("pac"),
        userId: id,
        policyType: "privacy",
        policyVersion: privacy.version,
        acceptedAt: now,
        consentDetails: "Accepted during registration",
      },
    ]);

    await createSession(id);
    await writeAuditLog({
      actorUserId: id,
      action: "auth.register",
      entityType: "user",
      entityId: id,
    });

    return jsonOk({
      user: { id, name: body.name, email, role: "client" as const },
      redirectTo: "/client",
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
