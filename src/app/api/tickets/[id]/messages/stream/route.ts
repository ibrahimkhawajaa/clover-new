import { requireUser } from "@/lib/auth/session";
import { AuthError } from "@/lib/auth/session";
import { listMessages } from "@/lib/services/chat";
import { assertCanViewTicket, getTicketOrThrow } from "@/lib/authz/tickets";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Server-Sent Events stream for ticket chat (Vercel-friendly alternative to WebSockets). */
export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await ctx.params;
    const ticket = await getTicketOrThrow(id);
    assertCanViewTicket(user, ticket);

    let lastCursor =
      new URL(req.url).searchParams.get("after") ??
      new Date(0).toISOString().replace("T", " ").substring(0, 19);
    let closed = false;

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        const send = (event: string, data: unknown) => {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
          );
        };

        send("ready", { ticketId: id });

        const poll = async () => {
          while (!closed) {
            try {
              const messages = await listMessages(user, id, lastCursor);
              if (messages.length) {
                send("messages", { messages });
                lastCursor = messages[messages.length - 1]!.createdAt;
              } else {
                send("ping", { t: Date.now() });
              }
            } catch {
              send("error", { message: "stream_error" });
            }
            await new Promise((r) => setTimeout(r, 2000));
          }
        };

        poll();
        req.signal.addEventListener("abort", () => {
          closed = true;
          try {
            controller.close();
          } catch {
            /* ignore */
          }
        });
      },
      cancel() {
        closed = true;
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    const status = err instanceof AuthError ? err.status : 500;
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }
}
