import { handleRouteError, jsonOk } from "@/lib/api";
import { requireUser } from "@/lib/auth/session";
import { submitChatFeedback } from "@/lib/services/chat";
import { chatFeedbackSchema } from "@/lib/validations";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser(["client"]);
    const { id } = await ctx.params;
    const body = chatFeedbackSchema.parse(await req.json());
    await submitChatFeedback({
      user,
      ticketId: id,
      rating: body.rating,
      comment: body.comment,
      sessionId: body.sessionId,
    });
    return jsonOk({ ok: true });
  } catch (err) {
    return handleRouteError(err);
  }
}
