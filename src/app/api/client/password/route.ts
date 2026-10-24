import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import { handleRouteError, jsonError, jsonOk } from "@/lib/api";
import { requireUser } from "@/lib/auth/session";
import { hashPassword, isStrongPassword, verifyPassword } from "@/lib/crypto";
import { utcNow } from "@/lib/utils";

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(10).max(200),
});

export async function POST(req: Request) {
  try {
    const user = await requireUser(["client"]);
    const body = schema.parse(await req.json());
    if (!isStrongPassword(body.newPassword)) {
      return jsonError(
        "New password must be at least 10 characters with upper, lower, number, and special character",
        400
      );
    }

    const row = await db.query.users.findFirst({ where: eq(users.id, user.id) });
    if (!row) return jsonError("User not found", 404);

    const ok = await verifyPassword(body.currentPassword, row.passwordHash);
    if (!ok) return jsonError("Current password is incorrect", 400);

    await db
      .update(users)
      .set({
        passwordHash: await hashPassword(body.newPassword),
        updatedAt: utcNow(),
      })
      .where(eq(users.id, user.id));

    return jsonOk({ ok: true });
  } catch (err) {
    return handleRouteError(err);
  }
}
