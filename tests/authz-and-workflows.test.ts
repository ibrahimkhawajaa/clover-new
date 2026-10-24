import { beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { execSync } from "child_process";
import { createClient } from "@libsql/client";
import { db, resetDbSingleton } from "@/db";
import * as schema from "@/db/schema";
import { hashPassword, isStrongPassword } from "@/lib/crypto";
import { newId } from "@/lib/ids";
import { utcNow } from "@/lib/utils";
import { assertCanViewTicket, assertCanSendMessage } from "@/lib/authz/tickets";
import { AuthError, type SessionUser } from "@/lib/auth/session";
import { assignTicket, createTicket, updateTicketStatus } from "@/lib/services/tickets";
import {
  endChatSession,
  getActiveSessionForTicket,
  listMessages,
  sendMessage,
  startChatSession,
} from "@/lib/services/chat";
import { DRAFT_POLICIES } from "@/lib/legal/policies";

const url = process.env.TURSO_DATABASE_URL ?? "file:./data/clover-test.db";

function asUser(
  u: typeof schema.users.$inferSelect,
  role = u.role
): SessionUser {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role,
    accountStatus: u.accountStatus,
  };
}

describe("Clover portal core workflows", () => {
  let admin: typeof schema.users.$inferSelect;
  let clientA: typeof schema.users.$inferSelect;
  let clientB: typeof schema.users.$inferSelect;
  let assistantA: typeof schema.users.$inferSelect;
  let assistantB: typeof schema.users.$inferSelect;

  beforeAll(async () => {
    resetDbSingleton();
    const client = createClient({ url });
    const tables = [
      "policy_acceptances",
      "policy_versions",
      "login_attempts",
      "password_reset_tokens",
      "user_sessions",
      "audit_logs",
      "chat_sessions",
      "chat_messages",
      "ticket_assignments",
      "tickets",
      "support_categories",
      "assistant_profiles",
      "client_profiles",
      "portal_settings",
      "users",
    ];
    for (const t of tables) {
      try {
        await client.execute(`DROP TABLE IF EXISTS \`${t}\``);
      } catch {
        /* ignore */
      }
    }
    client.close();

    execSync("npx drizzle-kit push --force", {
      env: { ...process.env, TURSO_DATABASE_URL: url },
      stdio: "pipe",
    });
    resetDbSingleton();

    const now = utcNow();
    const pw = await hashPassword("StrongPass1!");

    const mkUser = async (
      role: "admin" | "client" | "assistant",
      email: string,
      name: string
    ) => {
      const id = newId("usr");
      await db.insert(schema.users).values({
        id,
        name,
        email,
        passwordHash: pw,
        role,
        accountStatus: "active",
        createdAt: now,
        updatedAt: now,
      });
      if (role === "client") {
        await db.insert(schema.clientProfiles).values({
          id: newId("cprof"),
          userId: id,
          createdAt: now,
          updatedAt: now,
        });
      }
      if (role === "assistant") {
        await db.insert(schema.assistantProfiles).values({
          id: newId("aprof"),
          userId: id,
          createdAt: now,
          updatedAt: now,
        });
      }
      return (await db.query.users.findFirst({ where: eq(schema.users.id, id) }))!;
    };

    admin = await mkUser("admin", "admin@test.local", "Admin");
    clientA = await mkUser("client", "clienta@test.local", "Client A");
    clientB = await mkUser("client", "clientb@test.local", "Client B");
    assistantA = await mkUser("assistant", "assa@test.local", "Assistant A");
    assistantB = await mkUser("assistant", "assb@test.local", "Assistant B");
  }, 180_000);

  it("requires strong passwords", () => {
    expect(isStrongPassword("weak")).toBe(false);
    expect(isStrongPassword("StrongPass1!")).toBe(true);
  });

  it("client can create a ticket", async () => {
    const created = await createTicket({
      clientId: clientA.id,
      title: "Need help with portal login",
      description: "I cannot reset my password from the portal.",
      category: "Account Access",
      priority: "medium",
    });
    expect(created.ticketNumber).toMatch(/^CLV-/);
    const ticket = await db.query.tickets.findFirst({
      where: eq(schema.tickets.id, created.id),
    });
    expect(ticket?.status).toBe("open");
    expect(ticket?.assignedAssistantId).toBeNull();
  });

  it("client cannot view another client's ticket", async () => {
    const t = await createTicket({
      clientId: clientA.id,
      title: "Private ticket",
      description: "Sensitive support request details here.",
      category: "General Inquiry",
      priority: "low",
    });
    const ticket = (await db.query.tickets.findFirst({
      where: eq(schema.tickets.id, t.id),
    }))!;
    expect(() => assertCanViewTicket(asUser(clientB), ticket)).toThrow(AuthError);
  });

  it("assistant cannot access unassigned or other assistant tickets", async () => {
    const t = await createTicket({
      clientId: clientA.id,
      title: "Unassigned",
      description: "Waiting for admin assignment now.",
      category: "Technical Support",
      priority: "high",
    });
    const ticket = (await db.query.tickets.findFirst({
      where: eq(schema.tickets.id, t.id),
    }))!;
    expect(() => assertCanViewTicket(asUser(assistantA), ticket)).toThrow(AuthError);

    await assignTicket({
      ticketId: ticket.id,
      assistantId: assistantB.id,
      adminId: admin.id,
    });
    const reassigned = (await db.query.tickets.findFirst({
      where: eq(schema.tickets.id, t.id),
    }))!;
    expect(() => assertCanViewTicket(asUser(assistantA), reassigned)).toThrow(AuthError);
  });

  it("admin can assign; assigned assistant can access and chat", async () => {
    const t = await createTicket({
      clientId: clientA.id,
      title: "Assignable",
      description: "Please assign this ticket to an assistant.",
      category: "Appointment Support",
      priority: "medium",
    });
    await assignTicket({
      ticketId: t.id,
      assistantId: assistantA.id,
      adminId: admin.id,
    });
    const ticket = (await db.query.tickets.findFirst({
      where: eq(schema.tickets.id, t.id),
    }))!;
    expect(ticket.assignedAssistantId).toBe(assistantA.id);

    assertCanViewTicket(asUser(assistantA), ticket);
    assertCanSendMessage(asUser(assistantA), ticket);

    await sendMessage(asUser(assistantA), ticket.id, "Hello, how can I help?");
    const messages = await listMessages(asUser(clientA), ticket.id);
    expect(messages.length).toBeGreaterThan(0);

    await expect(listMessages(asUser(clientB), ticket.id)).rejects.toBeInstanceOf(AuthError);
  });

  it("chat timer records start/end; refresh keeps start; duplicates prevented", async () => {
    const t = await createTicket({
      clientId: clientA.id,
      title: "Timer ticket",
      description: "Chat session timing verification ticket.",
      category: "Technical Support",
      priority: "medium",
    });
    await assignTicket({
      ticketId: t.id,
      assistantId: assistantA.id,
      adminId: admin.id,
    });

    const s1 = await startChatSession(asUser(assistantA), t.id);
    const s2 = await startChatSession(asUser(assistantA), t.id);
    expect(s1.id).toBe(s2.id);

    const again = await getActiveSessionForTicket(t.id);
    expect(again?.startedAt).toBe(s1.startedAt);

    await new Promise((r) => setTimeout(r, 1100));
    const ended = await endChatSession(asUser(assistantA), s1.id, "ended");
    expect(ended.status).toBe("ended");
    expect((ended.durationSeconds ?? 0) >= 1).toBe(true);
    expect(await getActiveSessionForTicket(t.id)).toBeFalsy();
  });

  it("assistant cannot set forbidden ticket statuses", async () => {
    const t = await createTicket({
      clientId: clientA.id,
      title: "Status rules",
      description: "Testing assistant status permissions carefully.",
      category: "General Inquiry",
      priority: "low",
    });
    await assignTicket({
      ticketId: t.id,
      assistantId: assistantA.id,
      adminId: admin.id,
    });
    await expect(
      updateTicketStatus({
        ticketId: t.id,
        status: "closed",
        actor: asUser(assistantA),
      })
    ).rejects.toBeInstanceOf(AuthError);
  });

  it("policy acceptance records are saved", async () => {
    const terms = DRAFT_POLICIES.find((p) => p.policyType === "terms")!;
    await db.insert(schema.policyAcceptances).values({
      id: newId("pac"),
      userId: clientA.id,
      policyType: "terms",
      policyVersion: terms.version,
      acceptedAt: utcNow(),
      consentDetails: "test acceptance",
    });
    const row = await db.query.policyAcceptances.findFirst({
      where: eq(schema.policyAcceptances.userId, clientA.id),
    });
    expect(row?.policyVersion).toBe(terms.version);
  });

  it("deactivated account status is persisted for session guards", async () => {
    await db
      .update(schema.users)
      .set({ accountStatus: "deactivated", updatedAt: utcNow() })
      .where(eq(schema.users.id, clientB.id));
    const u = await db.query.users.findFirst({ where: eq(schema.users.id, clientB.id) });
    expect(u?.accountStatus).toBe("deactivated");
  });
});
