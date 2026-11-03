import { handleRouteError, jsonOk } from "@/lib/api";
import { requireUser } from "@/lib/auth/session";
import { assignTicket } from "@/lib/services/tickets";
import { assignTicketSchema } from "@/lib/validations";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireUser(["admin"]);
    const { id } = await ctx.params;
    const body = assignTicketSchema.parse(await req.json());
    await assignTicket({
      ticketId: id,
      assistantId: body.assistantId,
      adminId: admin.id,
      reason: body.reason,
    });
    return jsonOk({ ok: true });
  } catch (err) {
    return handleRouteError(err);
  }
}
