import { handleRouteError, jsonOk } from "@/lib/api";
import { requireUser } from "@/lib/auth/session";
import { listSessionsForAdmin } from "@/lib/services/chat";

export async function GET(req: Request) {
  try {
    await requireUser(["admin"]);
    const url = new URL(req.url);
    const items = await listSessionsForAdmin({
      assistantId: url.searchParams.get("assistantId") ?? undefined,
      page: Number(url.searchParams.get("page") ?? 1),
      pageSize: Number(url.searchParams.get("pageSize") ?? 20),
    });
    return jsonOk({
      items: items.map((r) => ({
        ...r.session,
        ticketNumber: r.ticketNumber,
        assistantName: r.assistantName,
      })),
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
