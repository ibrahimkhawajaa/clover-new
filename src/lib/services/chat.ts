import { and, asc, desc, eq, gt, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  chatFeedback,
  chatMessages,
  chatSessions,
  tickets,
  users,
  type MessageType,
} from "@/db/schema";
import { writeAuditLog } from "@/lib/audit";
import { AuthError, type SessionUser } from "@/lib/auth/session";
import {
  assertCanSendMessage,
  assertCanViewTicket,
  getTicketOrThrow,
} from "@/lib/authz/tickets";
import { newId } from "@/lib/ids";
import { elapsedSecondsSince, utcNow } from "@/lib/utils";

const MESSAGE_RATE_WINDOW_MS = 10_000;
const MESSAGE_RATE_MAX = 8;
const messageBuckets = new Map<string, number[]>();

function checkMessageRateLimit(userId: string) {
  const now = Date.now();
  const bucket = (messageBuckets.get(userId) ?? []).filter(
    (t) => now - t < MESSAGE_RATE_WINDOW_MS
  );
  if (bucket.length >= MESSAGE_RATE_MAX) {
    throw new AuthError("Too many messages. Please wait.", 429);
  }
  bucket.push(now);
  messageBuckets.set(userId, bucket);
}

export async function listMessages(user: SessionUser, ticketId: string, after?: string) {
  const ticket = await getTicketOrThrow(ticketId);
  assertCanViewTicket(user, ticket);

  const conditions = [eq(chatMessages.ticketId, ticketId)];
  if (after) conditions.push(gt(chatMessages.createdAt, after));

  const rows = await db
    .select({
      id: chatMessages.id,
      ticketId: chatMessages.ticketId,
      senderId: chatMessages.senderId,
      messageBody: chatMessages.messageBody,
      messageType: chatMessages.messageType,
      attachmentPath: chatMessages.attachmentPath,
      createdAt: chatMessages.createdAt,
      readAt: chatMessages.readAt,
      senderName: users.name,
      senderRole: users.role,
    })
    .from(chatMessages)
    .innerJoin(users, eq(chatMessages.senderId, users.id))
    .where(and(...conditions))
    .orderBy(asc(chatMessages.createdAt))
    .limit(500);

  return rows;
}

export async function sendMessage(
  user: SessionUser,
  ticketId: string,
  messageBody: string,
  opts?: { messageType?: MessageType; attachmentPath?: string | null }
) {
  checkMessageRateLimit(user.id);
  const ticket = await getTicketOrThrow(ticketId);
  assertCanSendMessage(user, ticket);

  if (user.role === "assistant" && ticket.assignedAssistantId !== user.id) {
    throw new AuthError("Forbidden", 403);
  }
  if (user.role === "client" && ticket.clientId !== user.id) {
    throw new AuthError("Forbidden", 403);
  }

  const messageType = opts?.messageType ?? "text";
  if (messageType === "text" && !messageBody.trim()) {
    throw new AuthError("Message required", 400);
  }

  const id = newId("msg");
  const now = utcNow();
  await db.insert(chatMessages).values({
    id,
    ticketId,
    senderId: user.id,
    messageBody: messageBody || (messageType === "image" ? "[image]" : "[voice]"),
    messageType,
    attachmentPath: opts?.attachmentPath ?? null,
    createdAt: now,
  });

  await db.update(tickets).set({ updatedAt: now }).where(eq(tickets.id, ticketId));

  return {
    id,
    ticketId,
    senderId: user.id,
    messageBody: messageBody || (messageType === "image" ? "[image]" : "[voice]"),
    messageType,
    attachmentPath: opts?.attachmentPath ?? null,
    createdAt: now,
    senderName: user.name,
    senderRole: user.role,
  };
}

export async function submitChatFeedback(params: {
  user: SessionUser;
  ticketId: string;
  rating: number;
  comment?: string;
  sessionId?: string;
}) {
  if (params.user.role !== "client") throw new AuthError("Only clients can submit feedback", 403);
  if (params.rating < 1 || params.rating > 5) throw new AuthError("Rating must be 1–5", 400);

  const ticket = await getTicketOrThrow(params.ticketId);
  if (ticket.clientId !== params.user.id) throw new AuthError("Forbidden", 403);

  const id = newId("fb");
  const now = utcNow();
  try {
    await db.insert(chatFeedback).values({
      id,
      ticketId: params.ticketId,
      sessionId: params.sessionId ?? null,
      clientId: params.user.id,
      rating: params.rating,
      comment: params.comment ?? null,
      createdAt: now,
    });
  } catch {
    await db
      .update(chatFeedback)
      .set({
        rating: params.rating,
        comment: params.comment ?? null,
        sessionId: params.sessionId ?? null,
        createdAt: now,
      })
      .where(
        and(
          eq(chatFeedback.ticketId, params.ticketId),
          eq(chatFeedback.clientId, params.user.id)
        )
      );
  }

  await writeAuditLog({
    actorUserId: params.user.id,
    action: "chat.feedback",
    entityType: "ticket",
    entityId: params.ticketId,
    metadata: { rating: params.rating },
  });

  return { ok: true };
}

/**
 * Start a chat session for an assigned assistant.
 * Prevents duplicate active sessions for the same ticket (race-safe via unique active check in transaction).
 */
export async function startChatSession(user: SessionUser, ticketId: string) {
  if (user.role !== "assistant" && user.role !== "admin") {
    throw new AuthError("Only assistants can start chat sessions", 403);
  }

  const ticket = await getTicketOrThrow(ticketId);
  if (user.role === "assistant") {
    if (ticket.assignedAssistantId !== user.id) throw new AuthError("Forbidden", 403);
  }

  const assistantId =
    user.role === "assistant" ? user.id : ticket.assignedAssistantId;
  if (!assistantId) throw new AuthError("Ticket has no assigned assistant", 400);

  const existing = await db.query.chatSessions.findFirst({
    where: and(eq(chatSessions.ticketId, ticketId), eq(chatSessions.status, "active")),
  });
  if (existing) {
    return existing;
  }

  const id = newId("chs");
  const now = utcNow();

  try {
    await db.insert(chatSessions).values({
      id,
      ticketId,
      clientId: ticket.clientId,
      assistantId,
      startedAt: now,
      status: "active",
    });
  } catch {
    // Race: another session started — return the active one
    const raced = await db.query.chatSessions.findFirst({
      where: and(eq(chatSessions.ticketId, ticketId), eq(chatSessions.status, "active")),
    });
    if (raced) return raced;
    throw new AuthError("Could not start chat session", 500);
  }

  if (ticket.status === "assigned") {
    await db
      .update(tickets)
      .set({ status: "in_progress", updatedAt: now })
      .where(eq(tickets.id, ticketId));
  }

  await writeAuditLog({
    actorUserId: user.id,
    action: "chat_session.started",
    entityType: "chat_session",
    entityId: id,
    metadata: { ticketId },
  });

  return {
    id,
    ticketId,
    clientId: ticket.clientId,
    assistantId,
    startedAt: now,
    endedAt: null,
    durationSeconds: null,
    status: "active" as const,
  };
}

export async function endChatSession(
  user: SessionUser,
  sessionId: string,
  status: "ended" | "interrupted" = "ended"
) {
  const session = await db.query.chatSessions.findFirst({
    where: eq(chatSessions.id, sessionId),
  });
  if (!session) throw new AuthError("Session not found", 404);

  if (user.role === "assistant" && session.assistantId !== user.id) {
    throw new AuthError("Forbidden", 403);
  }
  if (user.role === "client" && session.clientId !== user.id) {
    throw new AuthError("Forbidden", 403);
  }
  if (session.status !== "active") return session;

  const now = utcNow();
  const durationSeconds = elapsedSecondsSince(session.startedAt, now);

  await db
    .update(chatSessions)
    .set({
      endedAt: now,
      durationSeconds,
      status,
    })
    .where(and(eq(chatSessions.id, sessionId), eq(chatSessions.status, "active")));

  await writeAuditLog({
    actorUserId: user.id,
    action: "chat_session.ended",
    entityType: "chat_session",
    entityId: sessionId,
    metadata: { durationSeconds, status },
  });

  return {
    ...session,
    endedAt: now,
    durationSeconds,
    status,
  };
}

export async function getActiveSessionForTicket(ticketId: string) {
  return db.query.chatSessions.findFirst({
    where: and(eq(chatSessions.ticketId, ticketId), eq(chatSessions.status, "active")),
  });
}

export async function getLatestSessionForTicket(ticketId: string) {
  const active = await getActiveSessionForTicket(ticketId);
  if (active) return active;
  return db.query.chatSessions.findFirst({
    where: eq(chatSessions.ticketId, ticketId),
    orderBy: [desc(chatSessions.startedAt)],
  });
}

export async function listSessionsForAdmin(filters: {
  assistantId?: string;
  page?: number;
  pageSize?: number;
}) {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(50, filters.pageSize ?? 20);
  const offset = (page - 1) * pageSize;

  const conditions = [];
  if (filters.assistantId) {
    conditions.push(eq(chatSessions.assistantId, filters.assistantId));
  }
  const where = conditions.length ? and(...conditions) : undefined;

  return db
    .select({
      session: chatSessions,
      ticketNumber: tickets.ticketNumber,
      assistantName: users.name,
    })
    .from(chatSessions)
    .innerJoin(tickets, eq(chatSessions.ticketId, tickets.id))
    .innerJoin(users, eq(chatSessions.assistantId, users.id))
    .where(where)
    .orderBy(desc(chatSessions.startedAt))
    .limit(pageSize)
    .offset(offset);
}

void sql;
