import { eq } from "drizzle-orm";
import { db } from "@/db";
import { tickets } from "@/db/schema";
import type { SessionUser } from "@/lib/auth/session";
import { AuthError } from "@/lib/auth/session";

export type TicketRow = typeof tickets.$inferSelect;

export async function getTicketOrThrow(ticketId: string): Promise<TicketRow> {
  const ticket = await db.query.tickets.findFirst({
    where: eq(tickets.id, ticketId),
  });
  if (!ticket) throw new AuthError("Ticket not found", 404);
  return ticket;
}

/** Server-side ownership / role check — never rely on UI alone. */
export function assertCanViewTicket(user: SessionUser, ticket: TicketRow): void {
  if (user.role === "admin") return;
  if (user.role === "client" && ticket.clientId === user.id) return;
  if (
    user.role === "assistant" &&
    ticket.assignedAssistantId === user.id
  ) {
    return;
  }
  throw new AuthError("Forbidden", 403);
}

export function assertCanSendMessage(user: SessionUser, ticket: TicketRow): void {
  assertCanViewTicket(user, ticket);
  if (ticket.status === "closed") {
    throw new AuthError("Ticket is closed", 400);
  }
}

export function assertAdmin(user: SessionUser): void {
  if (user.role !== "admin") throw new AuthError("Forbidden", 403);
}

export function assertAssistantCanUpdateStatus(
  user: SessionUser,
  ticket: TicketRow,
  nextStatus: string
): void {
  if (user.role === "admin") return;
  if (user.role !== "assistant" || ticket.assignedAssistantId !== user.id) {
    throw new AuthError("Forbidden", 403);
  }
  const allowed = ["in_progress", "waiting_for_client", "resolved"];
  if (!allowed.includes(nextStatus)) {
    throw new AuthError("Assistants cannot set this status", 403);
  }
}
