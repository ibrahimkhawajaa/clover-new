import Link from "next/link";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Headphones,
  MessageSquare,
  Ticket,
  UserRound,
  Users,
} from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { db } from "@/db";
import { tickets, users } from "@/db/schema";
import { requirePageUser } from "@/lib/auth/guards";
import { getAdminDashboardStats } from "@/lib/services/tickets";
import { cn } from "@/lib/utils";

function priorityTagClass(priority: string) {
  if (priority === "urgent") return "bg-coral text-on-coral";
  if (priority === "high") return "bg-tertiary-fixed text-on-tertiary-fixed";
  if (priority === "medium") return "bg-secondary-container text-on-secondary-container";
  return "bg-surface-container text-on-surface-variant";
}

export default async function AdminDashboardPage() {
  const admin = await requirePageUser(["admin"]);
  const stats = await getAdminDashboardStats();

  const [unassignedRows, assistantLoad] = await Promise.all([
    db
      .select({
        ticket: tickets,
        clientName: users.name,
      })
      .from(tickets)
      .leftJoin(users, eq(tickets.clientId, users.id))
      .where(and(eq(tickets.status, "open"), isNull(tickets.assignedAssistantId)))
      .orderBy(desc(tickets.createdAt))
      .limit(8),
    db
      .select({
        id: users.id,
        name: users.name,
        ticketCount: sql<number>`cast(count(${tickets.id}) as integer)`,
      })
      .from(users)
      .leftJoin(
        tickets,
        and(
          eq(tickets.assignedAssistantId, users.id),
          sql`${tickets.status} not in ('resolved', 'closed')`
        )
      )
      .where(and(eq(users.role, "assistant"), eq(users.accountStatus, "active")))
      .groupBy(users.id)
      .orderBy(desc(sql`count(${tickets.id})`)),
  ]);

  const metrics = [
    {
      label: "Total tickets",
      value: stats.totalTickets,
      icon: <Ticket className="h-5 w-5" />,
      tone: "default" as const,
    },
    {
      label: "Unassigned",
      value: stats.unassignedTickets,
      icon: <Clock className="h-5 w-5" />,
      tone: "urgent" as const,
    },
    {
      label: "Active assistants",
      value: stats.totalAssistants,
      icon: <Headphones className="h-5 w-5" />,
      tone: "mint" as const,
    },
    {
      label: "Active chats",
      value: stats.activeChatSessions,
      icon: <MessageSquare className="h-5 w-5" />,
      tone: "default" as const,
    },
    {
      label: "Clients",
      value: stats.totalClients,
      icon: <Users className="h-5 w-5" />,
      tone: "default" as const,
    },
    {
      label: "Resolved",
      value: stats.resolvedTickets,
      icon: <CheckCircle2 className="h-5 w-5" />,
      tone: "mint" as const,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-secondary">
            Operational overview
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-primary">Owner Dashboard</h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            Signed in as {admin.name}. Monitor queue health and assign work.
          </p>
        </div>
        <Button asChild className="rounded-xl">
          <Link href="/admin/tickets">
            View all tickets <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {metrics.map((m) => (
          <div
            key={m.label}
            className={cn(
              "rounded-2xl p-5 shadow-soft",
              m.tone === "urgent" && "bg-coral text-on-coral",
              m.tone === "mint" && "bg-secondary-container text-on-secondary-container",
              m.tone === "default" && "bg-surface-container-lowest text-on-surface"
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <p
                className={cn(
                  "text-xs font-semibold uppercase tracking-wide",
                  m.tone === "urgent" && "text-on-coral/85",
                  m.tone === "mint" && "text-on-secondary-container/80",
                  m.tone === "default" && "text-on-surface-variant"
                )}
              >
                {m.label}
              </p>
              <span
                className={cn(
                  "rounded-xl p-2",
                  m.tone === "urgent" && "bg-black/10",
                  m.tone === "mint" && "bg-primary/10 text-primary",
                  m.tone === "default" && "bg-surface-container text-primary"
                )}
              >
                {m.icon}
              </span>
            </div>
            <p className="mt-3 text-4xl font-bold tabular-nums">{m.value}</p>
          </div>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl bg-surface-container-lowest p-6 shadow-card">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-on-surface">Unassigned tickets</h2>
            <Link
              href="/admin/tickets"
              className="text-xs font-semibold text-secondary underline-offset-2 hover:underline"
            >
              See all
            </Link>
          </div>
          {unassignedRows.length === 0 ? (
            <p className="py-8 text-center text-sm text-on-surface-variant">
              No unassigned open tickets.
            </p>
          ) : (
            <ul className="space-y-3">
              {unassignedRows.map(({ ticket: t, clientName }) => (
                <li
                  key={t.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-surface-container-low/80 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-on-surface">{t.title}</p>
                    <p className="text-xs text-on-surface-variant">
                      {t.ticketNumber}
                      {clientName ? ` · ${clientName}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                        priorityTagClass(t.priority)
                      )}
                    >
                      {t.priority}
                    </span>
                    <Button asChild size="sm" variant="secondary" className="rounded-xl">
                      <Link href={`/admin/tickets/${t.id}`}>Assign</Link>
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl bg-surface-container-lowest p-6 shadow-card">
          <h2 className="mb-4 text-lg font-semibold text-on-surface">Team load</h2>
          {assistantLoad.length === 0 ? (
            <p className="py-8 text-center text-sm text-on-surface-variant">
              No active assistants yet.
            </p>
          ) : (
            <ul className="space-y-3">
              {assistantLoad.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center justify-between gap-3 rounded-xl bg-surface-container-low/80 px-4 py-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="rounded-xl bg-primary-container p-2 text-secondary-container">
                      <UserRound className="h-4 w-4" />
                    </span>
                    <p className="truncate font-medium text-on-surface">{a.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold tabular-nums text-primary">
                      {Number(a.ticketCount ?? 0)}
                    </p>
                    <p className="text-[10px] uppercase tracking-wide text-on-surface-variant">
                      active
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="rounded-2xl bg-primary-container p-6 text-on-primary-container shadow-card">
        <h2 className="text-lg font-semibold text-secondary-container">Quick stats</h2>
        <p className="mt-1 text-sm text-on-primary-container/75">
          Average times when session data is available.
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-white/10 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-on-primary-container/70">
              Avg. response time
            </p>
            <p className="mt-2 text-2xl font-bold text-secondary-container">
              {stats.averageResponseTimeMinutes != null
                ? `${stats.averageResponseTimeMinutes} min`
                : "—"}
            </p>
          </div>
          <div className="rounded-xl bg-white/10 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-on-primary-container/70">
              Avg. handling time
            </p>
            <p className="mt-2 text-2xl font-bold text-secondary-container">
              {stats.averageHandlingTimeMinutes != null
                ? `${stats.averageHandlingTimeMinutes} min`
                : "—"}
            </p>
          </div>
        </div>
        {stats.inProgressTickets > 0 ? (
          <p className="mt-4 flex items-center gap-2 text-sm">
            <StatusBadge value="in_progress" />
            <span className="text-on-primary-container/80">
              {stats.inProgressTickets} ticket{stats.inProgressTickets === 1 ? "" : "s"} currently
              in progress
            </span>
          </p>
        ) : null}
      </section>
    </div>
  );
}
