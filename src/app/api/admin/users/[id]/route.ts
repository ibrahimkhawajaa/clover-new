import { eq } from "drizzle-orm";
import { db } from "@/db";
import { assistantProfiles, users } from "@/db/schema";
import { handleRouteError, jsonError, jsonOk } from "@/lib/api";
import { invalidateAllUserSessions, requireUser } from "@/lib/auth/session";
import { writeAuditLog } from "@/lib/audit";
import { utcNow } from "@/lib/utils";
import { updateUserSchema } from "@/lib/validations";

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireUser(["admin"]);
    const { id } = await ctx.params;
    const body = updateUserSchema.parse(await req.json());
    const user = await db.query.users.findFirst({ where: eq(users.id, id) });
    if (!user) return jsonError("User not found", 404);
    if (user.role === "admin" && body.accountStatus === "deactivated") {
      return jsonError("Cannot deactivate admin via this endpoint", 400);
    }

    const now = utcNow();
    await db
      .update(users)
      .set({
        ...(body.name ? { name: body.name } : {}),
        ...(body.accountStatus ? { accountStatus: body.accountStatus } : {}),
        updatedAt: now,
      })
      .where(eq(users.id, id));

    if (body.availabilityStatus && user.role === "assistant") {
      await db
        .update(assistantProfiles)
        .set({ availabilityStatus: body.availabilityStatus, updatedAt: now })
        .where(eq(assistantProfiles.userId, id));
    }

    if (body.accountStatus === "deactivated") {
      await invalidateAllUserSessions(id);
    }

    await writeAuditLog({
      actorUserId: admin.id,
      action: "user.updated",
      entityType: "user",
      entityId: id,
      metadata: body,
    });

    return jsonOk({ ok: true });
  } catch (err) {
    return handleRouteError(err);
  }
}
