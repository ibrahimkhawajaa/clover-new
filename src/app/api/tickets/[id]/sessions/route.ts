import { handleRouteError, jsonError, jsonOk } from "@/lib/api";
import { requireUser } from "@/lib/auth/session";
import {
  endChatSession,
  getActiveSessionForTicket,
  getLatestSessionForTicket,
  startChatSession,
} from "@/lib/services/chat";
import { assertCanViewTicket, getTicketOrThrow } from "@/lib/authz/tickets";
import { elapsedSecondsSince } from "@/lib/utils";
import { z } from "zod";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await ctx.params;
    const ticket = await getTicketOrThrow(id);
    assertCanViewTicket(user, ticket);
    const session = await getLatestSessionForTicket(id);
    return jsonOk({
      session: session
        ? {
            ...session,
            elapsedSeconds: elapsedSecondsSince(session.startedAt, session.endedAt),
          }
        : null,
    });
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
    const body = z
      .object({ action: z.enum(["start", "end"]), sessionId: z.string().optional() })
      .parse(await req.json());

    if (body.action === "start") {
      if (user.role !== "assistant" && user.role !== "admin") {
        return jsonError("Forbidden", 403);
      }
      const session = await startChatSession(user, id);
      return jsonOk({
        session: {
          ...session,
          elapsedSeconds: elapsedSecondsSince(session.startedAt, session.endedAt),
        },
      });
    }

    // end — assistant, admin, or client on their ticket
    if (!body.sessionId) {
      const active = await getActiveSessionForTicket(id);
      if (!active) return jsonOk({ session: null });
      const ended = await endChatSession(user, active.id, "ended");
      return jsonOk({ session: ended });
    }

    const ended = await endChatSession(user, body.sessionId, "ended");
    return jsonOk({ session: ended });
  } catch (err) {
    return handleRouteError(err);
  }
}
