import { handleRouteError, jsonOk } from "@/lib/api";
import { destroySession, getSessionUser } from "@/lib/auth/session";
import { writeAuditLog } from "@/lib/audit";

export async function POST() {
  try {
    const user = await getSessionUser();
    await destroySession();
    if (user) {
      await writeAuditLog({
        actorUserId: user.id,
        action: "auth.logout",
        entityType: "user",
        entityId: user.id,
      });
    }
    return jsonOk({ ok: true });
  } catch (err) {
    return handleRouteError(err);
  }
}
