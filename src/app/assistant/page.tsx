import Link from "next/link";
import { Clock3, MessageSquare, Ticket } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { requirePageUser } from "@/lib/auth/guards";
import { listTicketsForUser } from "@/lib/services/tickets";
import { cn } from "@/lib/utils";

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || name;
}

function priorityTagClass(priority: string) {
  if (priority === "urgent") return "bg-coral text-on-coral";
  if (priority === "high") return "bg-tertiary-fixed text-on-tertiary-fixed";
  if (priority === "medium") return "bg-secondary-container text-on-secondary-container";
  return "bg-surface-container text-on-surface-variant";
}

export default async function AssistantWorkspacePage() {
  const user = await requirePageUser(["assistant"]);
  const { items } = await listTicketsForUser(user, { pageSize: 50 });

  const active = items.filter((t) => !["resolved", "closed"].includes(t.status));
  const inProgress = items.filter((t) => t.status === "in_progress").length;
  const resolved = items.filter((t) => t.status === "resolved" || t.status === "closed").length;
  const firstTicket = active[0] ?? items[0];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">
          Hello, {firstName(user.name)}
        </h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          Here is your support workspace for today.
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-primary-container p-6 text-on-primary-container shadow-card sm:col-span-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-on-primary-container/80">Active tickets</p>
              <p className="mt-2 text-5xl font-bold tabular-nums text-secondary-container">
                {active.length}
              </p>
              <p className="mt-2 text-sm text-on-primary-container/70">
                Assigned to you and still open
              </p>
            </div>
            <span className="rounded-xl bg-white/10 p-3">
              <Ticket className="h-6 w-6 text-secondary-container" />
            </span>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="rounded-2xl bg-secondary-container p-5 shadow-soft">
            <p className="text-xs font-semibold uppercase tracking-wide text-on-secondary-container/80">
              In progress
            </p>
            <p className="mt-2 text-3xl font-bold tabular-nums text-primary">{inProgress}</p>
          </div>
          <div className="rounded-2xl bg-surface-container-lowest p-5 shadow-soft">
            <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
              Resolved
            </p>
            <p className="mt-2 text-3xl font-bold tabular-nums text-primary">{resolved}</p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-on-surface-variant">
          Quick actions
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {firstTicket ? (
            <Link
              href={`/assistant/tickets/${firstTicket.id}`}
              className="flex items-center gap-3 rounded-2xl bg-surface-container-lowest p-4 shadow-soft transition hover:shadow-card"
            >
              <span className="rounded-xl bg-secondary-container p-3 text-on-secondary-container">
                <MessageSquare className="h-5 w-5" />
              </span>
              <div>
                <p className="font-semibold text-on-surface">Message</p>
                <p className="text-xs text-on-surface-variant">
                  Open chat on {firstTicket.ticketNumber}
                </p>
              </div>
            </Link>
          ) : (
            <div className="flex items-center gap-3 rounded-2xl bg-surface-container p-4 opacity-70">
              <span className="rounded-xl bg-surface-container-lowest p-3">
                <MessageSquare className="h-5 w-5 text-on-surface-variant" />
              </span>
              <div>
                <p className="font-semibold text-on-surface">Message</p>
                <p className="text-xs text-on-surface-variant">No assigned tickets yet</p>
              </div>
            </div>
          )}
          <Link
            href="/assistant/workload"
            className="flex items-center gap-3 rounded-2xl bg-surface-container-lowest p-4 shadow-soft transition hover:shadow-card"
          >
            <span className="rounded-xl bg-primary-fixed p-3 text-on-primary-fixed">
              <Clock3 className="h-5 w-5" />
            </span>
            <div>
              <p className="font-semibold text-on-surface">Log hours</p>
              <p className="text-xs text-on-surface-variant">Update your workload</p>
            </div>
          </Link>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-on-surface-variant">
          Assigned tickets
        </h2>
        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-outline-variant/70 bg-surface-container-lowest px-6 py-12 text-center shadow-soft">
            <p className="text-sm text-on-surface-variant">
              When an admin assigns a ticket, it will appear here.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {items.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/assistant/tickets/${t.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-surface-container-lowest p-4 shadow-soft transition hover:shadow-card"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-on-surface">{t.title}</p>
                    <p className="mt-0.5 text-xs text-on-surface-variant">
                      {t.ticketNumber}
                      {t.clientName ? ` · ${t.clientName}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                        priorityTagClass(t.priority)
                      )}
                    >
                      {t.priority}
                    </span>
                    <StatusBadge value={t.status} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
