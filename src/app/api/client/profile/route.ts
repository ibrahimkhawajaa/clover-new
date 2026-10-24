import { eq } from "drizzle-orm";
import { db } from "@/db";
import { clientProfiles, users } from "@/db/schema";
import { handleRouteError, jsonOk } from "@/lib/api";
import { requireUser } from "@/lib/auth/session";
import { newId } from "@/lib/ids";
import { utcNow } from "@/lib/utils";
import { profileUpdateSchema } from "@/lib/validations";

export async function GET() {
  try {
    const user = await requireUser(["client"]);
    const profile = await db.query.clientProfiles.findFirst({
      where: eq(clientProfiles.userId, user.id),
    });
    return jsonOk({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        accountStatus: user.accountStatus,
      },
      profile: profile ?? null,
    });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await requireUser(["client"]);
    const body = profileUpdateSchema.parse(await req.json());
    const now = utcNow();

    if (body.name) {
      await db
        .update(users)
        .set({ name: body.name.trim(), updatedAt: now })
        .where(eq(users.id, user.id));
    }

    const existing = await db.query.clientProfiles.findFirst({
      where: eq(clientProfiles.userId, user.id),
    });

    if (existing) {
      await db
        .update(clientProfiles)
        .set({
          phone: body.phone !== undefined ? body.phone || null : existing.phone,
          province: body.province !== undefined ? body.province || null : existing.province,
          preferredLanguage:
            body.preferredLanguage !== undefined
              ? body.preferredLanguage
              : existing.preferredLanguage,
          updatedAt: now,
        })
        .where(eq(clientProfiles.userId, user.id));
    } else {
      await db.insert(clientProfiles).values({
        id: newId("cprof"),
        userId: user.id,
        phone: body.phone ?? null,
        province: body.province ?? null,
        preferredLanguage: body.preferredLanguage ?? "en",
        createdAt: now,
        updatedAt: now,
      });
    }

    return jsonOk({ ok: true });
  } catch (err) {
    return handleRouteError(err);
  }
}
