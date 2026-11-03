import { relations, sql } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const userRoles = ["admin", "client", "assistant"] as const;
export type UserRole = (typeof userRoles)[number];

export const accountStatuses = ["active", "deactivated", "pending"] as const;
export type AccountStatus = (typeof accountStatuses)[number];

export const ticketPriorities = ["low", "medium", "high", "urgent"] as const;
export type TicketPriority = (typeof ticketPriorities)[number];

export const ticketStatuses = [
  "open",
  "assigned",
  "in_progress",
  "waiting_for_client",
  "resolved",
  "closed",
] as const;
export type TicketStatus = (typeof ticketStatuses)[number];

export const chatSessionStatuses = [
  "active",
  "ended",
  "interrupted",
] as const;
export type ChatSessionStatus = (typeof chatSessionStatuses)[number];

export const availabilityStatuses = [
  "available",
  "busy",
  "offline",
] as const;
export type AvailabilityStatus = (typeof availabilityStatuses)[number];

export const policyTypes = [
  "terms",
  "privacy",
  "acceptable_use",
  "disclaimer",
] as const;
export type PolicyType = (typeof policyTypes)[number];

export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    role: text("role", { enum: userRoles }).notNull(),
    accountStatus: text("account_status", { enum: accountStatuses })
      .notNull()
      .default("active"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`(datetime('now'))`),
    lastLoginAt: text("last_login_at"),
  },
  (t) => [uniqueIndex("users_email_uq").on(t.email), index("users_role_idx").on(t.role)]
);

export const clientProfiles = sqliteTable(
  "client_profiles",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    phone: text("phone"),
    province: text("province"),
    preferredLanguage: text("preferred_language").default("en"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (t) => [uniqueIndex("client_profiles_user_uq").on(t.userId)]
);

export const assistantProfiles = sqliteTable(
  "assistant_profiles",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    availabilityStatus: text("availability_status", {
      enum: availabilityStatuses,
    })
      .notNull()
      .default("available"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (t) => [uniqueIndex("assistant_profiles_user_uq").on(t.userId)]
);

export const supportCategories = sqliteTable("support_categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const tickets = sqliteTable(
  "tickets",
  {
    id: text("id").primaryKey(),
    ticketNumber: text("ticket_number").notNull(),
    clientId: text("client_id")
      .notNull()
      .references(() => users.id),
    assignedAssistantId: text("assigned_assistant_id").references(() => users.id),
    title: text("title").notNull(),
    description: text("description").notNull(),
    category: text("category").notNull(),
    priority: text("priority", { enum: ticketPriorities }).notNull().default("medium"),
    status: text("status", { enum: ticketStatuses }).notNull().default("open"),
    /** JSON string of patient intake questionnaire (no SIN/SSN collected). */
    intakeJson: text("intake_json"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`(datetime('now'))`),
    assignedAt: text("assigned_at"),
    resolvedAt: text("resolved_at"),
    closedAt: text("closed_at"),
  },
  (t) => [
    uniqueIndex("tickets_number_uq").on(t.ticketNumber),
    index("tickets_client_idx").on(t.clientId),
    index("tickets_assistant_idx").on(t.assignedAssistantId),
    index("tickets_status_idx").on(t.status),
    index("tickets_priority_idx").on(t.priority),
  ]
);

export const ticketAssignments = sqliteTable(
  "ticket_assignments",
  {
    id: text("id").primaryKey(),
    ticketId: text("ticket_id")
      .notNull()
      .references(() => tickets.id, { onDelete: "cascade" }),
    assistantId: text("assistant_id")
      .notNull()
      .references(() => users.id),
    assignedByAdminId: text("assigned_by_admin_id")
      .notNull()
      .references(() => users.id),
    assignedAt: text("assigned_at")
      .notNull()
      .default(sql`(datetime('now'))`),
    unassignedAt: text("unassigned_at"),
    reassignmentReason: text("reassignment_reason"),
  },
  (t) => [
    index("ticket_assignments_ticket_idx").on(t.ticketId),
    index("ticket_assignments_assistant_idx").on(t.assistantId),
  ]
);

export const messageTypes = ["text", "image", "voice"] as const;
export type MessageType = (typeof messageTypes)[number];

export const chatMessages = sqliteTable(
  "chat_messages",
  {
    id: text("id").primaryKey(),
    ticketId: text("ticket_id")
      .notNull()
      .references(() => tickets.id, { onDelete: "cascade" }),
    senderId: text("sender_id")
      .notNull()
      .references(() => users.id),
    messageBody: text("message_body").notNull().default(""),
    messageType: text("message_type", { enum: messageTypes })
      .notNull()
      .default("text"),
    attachmentPath: text("attachment_path"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
    editedAt: text("edited_at"),
    readAt: text("read_at"),
  },
  (t) => [
    index("chat_messages_ticket_idx").on(t.ticketId),
    index("chat_messages_created_idx").on(t.createdAt),
  ]
);

export const chatSessions = sqliteTable(
  "chat_sessions",
  {
    id: text("id").primaryKey(),
    ticketId: text("ticket_id")
      .notNull()
      .references(() => tickets.id, { onDelete: "cascade" }),
    clientId: text("client_id")
      .notNull()
      .references(() => users.id),
    assistantId: text("assistant_id")
      .notNull()
      .references(() => users.id),
    startedAt: text("started_at")
      .notNull()
      .default(sql`(datetime('now'))`),
    endedAt: text("ended_at"),
    durationSeconds: integer("duration_seconds"),
    status: text("status", { enum: chatSessionStatuses }).notNull().default("active"),
  },
  (t) => [
    index("chat_sessions_ticket_idx").on(t.ticketId),
    index("chat_sessions_assistant_idx").on(t.assistantId),
    index("chat_sessions_status_idx").on(t.status),
  ]
);

export const chatFeedback = sqliteTable(
  "chat_feedback",
  {
    id: text("id").primaryKey(),
    ticketId: text("ticket_id")
      .notNull()
      .references(() => tickets.id, { onDelete: "cascade" }),
    sessionId: text("session_id").references(() => chatSessions.id),
    clientId: text("client_id")
      .notNull()
      .references(() => users.id),
    rating: integer("rating").notNull(),
    comment: text("comment"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (t) => [
    index("chat_feedback_ticket_idx").on(t.ticketId),
    uniqueIndex("chat_feedback_ticket_client_uq").on(t.ticketId, t.clientId),
  ]
);

export const auditLogs = sqliteTable(
  "audit_logs",
  {
    id: text("id").primaryKey(),
    actorUserId: text("actor_user_id").references(() => users.id),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id"),
    metadataJson: text("metadata_json"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (t) => [
    index("audit_logs_actor_idx").on(t.actorUserId),
    index("audit_logs_created_idx").on(t.createdAt),
  ]
);

export const userSessions = sqliteTable(
  "user_sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    sessionTokenHash: text("session_token_hash").notNull(),
    expiresAt: text("expires_at").notNull(),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (t) => [
    uniqueIndex("user_sessions_token_uq").on(t.sessionTokenHash),
    index("user_sessions_user_idx").on(t.userId),
  ]
);

export const passwordResetTokens = sqliteTable(
  "password_reset_tokens",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: text("expires_at").notNull(),
    usedAt: text("used_at"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (t) => [uniqueIndex("password_reset_token_uq").on(t.tokenHash)]
);

export const loginAttempts = sqliteTable(
  "login_attempts",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    ipAddress: text("ip_address"),
    attemptedAt: text("attempted_at")
      .notNull()
      .default(sql`(datetime('now'))`),
    success: integer("success", { mode: "boolean" }).notNull().default(false),
  },
  (t) => [
    index("login_attempts_email_idx").on(t.email),
    index("login_attempts_time_idx").on(t.attemptedAt),
  ]
);

export const policyVersions = sqliteTable(
  "policy_versions",
  {
    id: text("id").primaryKey(),
    policyType: text("policy_type", { enum: policyTypes }).notNull(),
    version: text("version").notNull(),
    title: text("title").notNull(),
    contentMarkdown: text("content_markdown").notNull(),
    effectiveAt: text("effective_at")
      .notNull()
      .default(sql`(datetime('now'))`),
    requiresRenewedAcceptance: integer("requires_renewed_acceptance", {
      mode: "boolean",
    })
      .notNull()
      .default(true),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (t) => [
    uniqueIndex("policy_versions_type_version_uq").on(t.policyType, t.version),
  ]
);

export const policyAcceptances = sqliteTable(
  "policy_acceptances",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    policyType: text("policy_type", { enum: policyTypes }).notNull(),
    policyVersion: text("policy_version").notNull(),
    acceptedAt: text("accepted_at")
      .notNull()
      .default(sql`(datetime('now'))`),
    consentDetails: text("consent_details"),
  },
  (t) => [
    index("policy_acceptances_user_idx").on(t.userId),
    uniqueIndex("policy_acceptances_user_type_version_uq").on(
      t.userId,
      t.policyType,
      t.policyVersion
    ),
  ]
);

export const portalSettings = sqliteTable("portal_settings", {
  id: text("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const usersRelations = relations(users, ({ one, many }) => ({
  clientProfile: one(clientProfiles, {
    fields: [users.id],
    references: [clientProfiles.userId],
  }),
  assistantProfile: one(assistantProfiles, {
    fields: [users.id],
    references: [assistantProfiles.userId],
  }),
  ticketsAsClient: many(tickets, { relationName: "clientTickets" }),
  ticketsAsAssistant: many(tickets, { relationName: "assistantTickets" }),
  sessions: many(userSessions),
}));

export const ticketsRelations = relations(tickets, ({ one, many }) => ({
  client: one(users, {
    fields: [tickets.clientId],
    references: [users.id],
    relationName: "clientTickets",
  }),
  assignedAssistant: one(users, {
    fields: [tickets.assignedAssistantId],
    references: [users.id],
    relationName: "assistantTickets",
  }),
  messages: many(chatMessages),
  chatSessions: many(chatSessions),
  assignments: many(ticketAssignments),
}));
