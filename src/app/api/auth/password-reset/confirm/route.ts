import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "@/db";
import { passwordResetTokens, users } from "@/db/schema";
import { handleRouteError, jsonError, jsonOk } from "@/lib/api";
import { invalidateAllUserSessions } from "@/lib/auth/session";
import { writeAuditLog } from "@/lib/audit";
import { hashPassword, hashToken, isStrongPassword } from "@/lib/crypto";
import { utcNow } from "@/lib/utils";
import { passwordResetConfirmSchema } from "@/lib/validations";

export async function POST(req: Request) {
  try {
    const body = passwordResetConfirmSchema.parse(await req.json());
    if (!isStrongPassword(body.password)) {
      return jsonError("Password does not meet strength requirements", 400);
    }

    const now = utcNow();
    const row = await db.query.passwordResetTokens.findFirst({
      where: and(
        eq(passwordResetTokens.tokenHash, hashToken(body.token)),
        isNull(passwordResetTokens.usedAt),
        gt(passwordResetTokens.expiresAt, now)
      ),
    });
    if (!row) return jsonError("Invalid or expired token", 400);

    const user = await db.query.users.findFirst({ where: eq(users.id, row.userId) });
    if (!user || user.role === "admin") {
      return jsonError("Invalid or expired token", 400);
    }

    const passwordHash = await hashPassword(body.password);
    await db
      .update(users)
      .set({ passwordHash, updatedAt: now })
      .where(eq(users.id, user.id));
    await db
      .update(passwordResetTokens)
      .set({ usedAt: now })
      .where(eq(passwordResetTokens.id, row.id));
    await invalidateAllUserSessions(user.id);

    await writeAuditLog({
      actorUserId: user.id,
      action: "auth.password_reset",
      entityType: "user",
      entityId: user.id,
    });

    return jsonOk({ ok: true });
  } catch (err) {
    return handleRouteError(err);
  }
}
