import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { handleRouteError, jsonOk } from "@/lib/api";
import { requireUser } from "@/lib/auth/session";
import { assertCanViewTicket, getTicketOrThrow } from "@/lib/authz/tickets";
import { updateTicketStatus } from "@/lib/services/tickets";
import { updateTicketPrioritySchema, updateTicketStatusSchema } from "@/lib/validations";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await ctx.params;
    const ticket = await getTicketOrThrow(id);
    assertCanViewTicket(user, ticket);

    const client = await db.query.users.findFirst({ where: eq(users.id, ticket.clientId) });
    const assistant = ticket.assignedAssistantId
      ? await db.query.users.findFirst({
          where: eq(users.id, ticket.assignedAssistantId),
        })
      : null;

    return jsonOk({
      ticket,
      client: client
        ? { id: client.id, name: client.name, email: user.role === "admin" || user.role === "assistant" ? client.email : undefined }
        : null,
      assistant: assistant ? { id: assistant.id, name: assistant.name } : null,
    });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await ctx.params;
    const body = await req.json();

    if (body.status) {
      const parsed = updateTicketStatusSchema.parse(body);
      await updateTicketStatus({ ticketId: id, status: parsed.status, actor: user });
    }

    if (body.priority) {
      const parsed = updateTicketPrioritySchema.parse(body);
      if (user.role !== "admin") {
        const { AuthError } = await import("@/lib/auth/session");
        throw new AuthError("Only admins can change priority", 403);
      }
      const { tickets } = await import("@/db/schema");
      const { utcNow } = await import("@/lib/utils");
      const { writeAuditLog } = await import("@/lib/audit");
      await db
        .update(tickets)
        .set({ priority: parsed.priority, updatedAt: utcNow() })
        .where(eq(tickets.id, id));
      await writeAuditLog({
        actorUserId: user.id,
        action: "ticket.priority_updated",
        entityType: "ticket",
        entityId: id,
        metadata: { priority: parsed.priority },
      });
    }

    const ticket = await getTicketOrThrow(id);
    assertCanViewTicket(user, ticket);
    return jsonOk({ ticket });
  } catch (err) {
    return handleRouteError(err);
  }
}
