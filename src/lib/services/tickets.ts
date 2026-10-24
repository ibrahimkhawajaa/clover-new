import { and, count, desc, eq, like, or, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  chatSessions,
  ticketAssignments,
  tickets,
  users,
  type TicketPriority,
  type TicketStatus,
} from "@/db/schema";
import { writeAuditLog } from "@/lib/audit";
import { AuthError } from "@/lib/auth/session";
import type { SessionUser } from "@/lib/auth/session";
import { newId, newTicketNumber } from "@/lib/ids";
import { utcNow } from "@/lib/utils";

export async function createTicket(params: {
  clientId: string;
  title: string;
  description: string;
  category: string;
  priority: TicketPriority;
  intakeJson?: string | null;
}) {
  const id = newId("tkt");
  const ticketNumber = newTicketNumber();
  const now = utcNow();

  await db.insert(tickets).values({
    id,
    ticketNumber,
    clientId: params.clientId,
    title: params.title,
    description: params.description,
    category: params.category,
    priority: params.priority,
    status: "open",
    intakeJson: params.intakeJson ?? null,
    createdAt: now,
    updatedAt: now,
  });

  await writeAuditLog({
    actorUserId: params.clientId,
    action: "ticket.created",
    entityType: "ticket",
    entityId: id,
    metadata: { ticketNumber, category: params.category, priority: params.priority },
  });

  return { id, ticketNumber };
}

export async function assignTicket(params: {
  ticketId: string;
  assistantId: string;
  adminId: string;
  reason?: string;
}) {
  const ticket = await db.query.tickets.findFirst({
    where: eq(tickets.id, params.ticketId),
  });
  if (!ticket) throw new AuthError("Ticket not found", 404);

  const assistant = await db.query.users.findFirst({
    where: and(eq(users.id, params.assistantId), eq(users.role, "assistant")),
  });
  if (!assistant || assistant.accountStatus !== "active") {
    throw new AuthError("Invalid assistant", 400);
  }

  const now = utcNow();
  const previousAssistantId = ticket.assignedAssistantId;

  await db.transaction(async (tx) => {
    if (previousAssistantId) {
      await tx
        .update(ticketAssignments)
        .set({ unassignedAt: now, reassignmentReason: params.reason ?? "reassigned" })
        .where(
          and(
            eq(ticketAssignments.ticketId, params.ticketId),
            eq(ticketAssignments.assistantId, previousAssistantId),
            sql`${ticketAssignments.unassignedAt} is null`
          )
        );
    }

    await tx.insert(ticketAssignments).values({
      id: newId("asg"),
      ticketId: params.ticketId,
      assistantId: params.assistantId,
      assignedByAdminId: params.adminId,
      assignedAt: now,
      reassignmentReason: previousAssistantId ? params.reason ?? null : null,
    });

    await tx
      .update(tickets)
      .set({
        assignedAssistantId: params.assistantId,
        status: ticket.status === "open" ? "assigned" : ticket.status,
        assignedAt: now,
        updatedAt: now,
      })
      .where(eq(tickets.id, params.ticketId));
  });

  await writeAuditLog({
    actorUserId: params.adminId,
    action: previousAssistantId ? "ticket.reassigned" : "ticket.assigned",
    entityType: "ticket",
    entityId: params.ticketId,
    metadata: {
      assistantId: params.assistantId,
      previousAssistantId,
      reason: params.reason,
    },
  });
}

export async function updateTicketStatus(params: {
  ticketId: string;
  status: TicketStatus;
  actor: SessionUser;
}) {
  const ticket = await db.query.tickets.findFirst({
    where: eq(tickets.id, params.ticketId),
  });
  if (!ticket) throw new AuthError("Ticket not found", 404);

  if (params.actor.role === "client") {
    if (ticket.clientId !== params.actor.id) throw new AuthError("Forbidden", 403);
    if (!["closed", "open"].includes(params.status) && params.status !== "waiting_for_client") {
      // clients may close or request further help (re-open / waiting)
      if (params.status !== "closed") throw new AuthError("Forbidden", 403);
    }
  } else if (params.actor.role === "assistant") {
    if (ticket.assignedAssistantId !== params.actor.id) {
      throw new AuthError("Forbidden", 403);
    }
    if (!["in_progress", "waiting_for_client", "resolved"].includes(params.status)) {
      throw new AuthError("Assistants cannot set this status", 403);
    }
  } else if (params.actor.role !== "admin") {
    throw new AuthError("Forbidden", 403);
  }

  const now = utcNow();
  const patch: Partial<typeof tickets.$inferInsert> = {
    status: params.status,
    updatedAt: now,
  };
  if (params.status === "resolved") patch.resolvedAt = now;
  if (params.status === "closed") patch.closedAt = now;

  await db.update(tickets).set(patch).where(eq(tickets.id, params.ticketId));

  await writeAuditLog({
    actorUserId: params.actor.id,
    action: "ticket.status_updated",
    entityType: "ticket",
    entityId: params.ticketId,
    metadata: { from: ticket.status, to: params.status },
  });
}

export async function listTicketsForUser(
  user: SessionUser,
  filters: {
    status?: string;
    priority?: string;
    search?: string;
    page?: number;
    pageSize?: number;
    assistantId?: string;
    clientId?: string;
  } = {}
) {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(50, Math.max(1, filters.pageSize ?? 20));
  const offset = (page - 1) * pageSize;

  const conditions = [];

  if (user.role === "client") {
    conditions.push(eq(tickets.clientId, user.id));
  } else if (user.role === "assistant") {
    conditions.push(eq(tickets.assignedAssistantId, user.id));
  } else {
    if (filters.assistantId) conditions.push(eq(tickets.assignedAssistantId, filters.assistantId));
    if (filters.clientId) conditions.push(eq(tickets.clientId, filters.clientId));
  }

  if (filters.status) conditions.push(eq(tickets.status, filters.status as TicketStatus));
  if (filters.priority) conditions.push(eq(tickets.priority, filters.priority as TicketPriority));
  if (filters.search) {
    const q = `%${filters.search}%`;
    conditions.push(
      or(
        like(tickets.title, q),
        like(tickets.ticketNumber, q),
        like(tickets.description, q)
      )!
    );
  }

  const where = conditions.length ? and(...conditions) : undefined;

  const [rows, totalRow] = await Promise.all([
    db
      .select({
        ticket: tickets,
        clientName: users.name,
      })
      .from(tickets)
      .leftJoin(users, eq(tickets.clientId, users.id))
      .where(where)
      .orderBy(desc(tickets.createdAt))
      .limit(pageSize)
      .offset(offset),
    db.select({ c: count() }).from(tickets).where(where),
  ]);

  return {
    items: rows.map((r) => ({ ...r.ticket, clientName: r.clientName })),
    total: Number(totalRow[0]?.c ?? 0),
    page,
    pageSize,
  };
}

export async function getAdminDashboardStats() {
  const [
    clients,
    assistants,
    totalTickets,
    unassigned,
    inProgress,
    resolved,
    activeChats,
  ] = await Promise.all([
    db.select({ c: count() }).from(users).where(eq(users.role, "client")),
    db.select({ c: count() }).from(users).where(eq(users.role, "assistant")),
    db.select({ c: count() }).from(tickets),
    db
      .select({ c: count() })
      .from(tickets)
      .where(and(eq(tickets.status, "open"), sql`${tickets.assignedAssistantId} is null`)),
    db.select({ c: count() }).from(tickets).where(eq(tickets.status, "in_progress")),
    db.select({ c: count() }).from(tickets).where(eq(tickets.status, "resolved")),
    db.select({ c: count() }).from(chatSessions).where(eq(chatSessions.status, "active")),
  ]);

  return {
    totalClients: Number(clients[0]?.c ?? 0),
    totalAssistants: Number(assistants[0]?.c ?? 0),
    totalTickets: Number(totalTickets[0]?.c ?? 0),
    unassignedTickets: Number(unassigned[0]?.c ?? 0),
    inProgressTickets: Number(inProgress[0]?.c ?? 0),
    resolvedTickets: Number(resolved[0]?.c ?? 0),
    activeChatSessions: Number(activeChats[0]?.c ?? 0),
    averageResponseTimeMinutes: null as number | null,
    averageHandlingTimeMinutes: null as number | null,
  };
}
