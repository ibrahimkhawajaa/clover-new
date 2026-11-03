import { handleRouteError, jsonOk } from "@/lib/api";
import { requireUser } from "@/lib/auth/session";
import { listMessages, sendMessage } from "@/lib/services/chat";
import { z } from "zod";

const postSchema = z.object({
  messageBody: z.string().max(4000).optional().default(""),
  messageType: z.enum(["text", "image", "voice"]).optional().default("text"),
  attachmentPath: z.string().max(500).optional().nullable(),
});

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await ctx.params;
    const after = new URL(req.url).searchParams.get("after") ?? undefined;
    const messages = await listMessages(user, id, after);
    return jsonOk({ messages });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await ctx.params;
    const body = postSchema.parse(await req.json());
    const message = await sendMessage(user, id, body.messageBody ?? "", {
      messageType: body.messageType,
      attachmentPath: body.attachmentPath,
    });
    return jsonOk({ message }, { status: 201 });
  } catch (err) {
    return handleRouteError(err);
  }
}
