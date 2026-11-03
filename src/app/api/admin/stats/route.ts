import { handleRouteError, jsonOk } from "@/lib/api";
import { requireUser } from "@/lib/auth/session";
import { getAdminDashboardStats } from "@/lib/services/tickets";

export async function GET() {
  try {
    await requireUser(["admin"]);
    const stats = await getAdminDashboardStats();
    return jsonOk({ stats });
  } catch (err) {
    return handleRouteError(err);
  }
}
