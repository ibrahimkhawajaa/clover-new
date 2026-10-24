import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { handleRouteError, jsonError, jsonOk } from "@/lib/api";
import { isLoginRateLimited, recordLoginAttempt } from "@/lib/auth/rate-limit";
import { createSession } from "@/lib/auth/session";
import { writeAuditLog } from "@/lib/audit";
import { verifyPassword } from "@/lib/crypto";
import { dashboardPathForRole, utcNow } from "@/lib/utils";
import { loginSchema } from "@/lib/validations";

export async function POST(req: Request) {
  try {
    const body = loginSchema.parse(await req.json());
    const email = body.email.toLowerCase().trim();
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

    if (await isLoginRateLimited(email)) {
      return jsonError("Too many login attempts. Try again later.", 429);
    }

    const user = await db.query.users.findFirst({ where: eq(users.email, email) });
    const valid =
      user && user.accountStatus === "active"
        ? await verifyPassword(body.password, user.passwordHash)
        : false;

    await recordLoginAttempt({ email, ipAddress: ip, success: Boolean(valid) });

    if (!user || !valid) {
      return jsonError("Invalid email or password", 401);
    }

    await createSession(user.id);
    await db
      .update(users)
      .set({ lastLoginAt: utcNow(), updatedAt: utcNow() })
      .where(eq(users.id, user.id));

    await writeAuditLog({
      actorUserId: user.id,
      action: "auth.login",
      entityType: "user",
      entityId: user.id,
    });

    return jsonOk({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      redirectTo: dashboardPathForRole(user.role),
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
