import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { requirePageUser } from "@/lib/auth/guards";
import { listTicketsForUser } from "@/lib/services/tickets";
import { cn } from "@/lib/utils";

function priorityTagClass(priority: string) {
  if (priority === "urgent") return "bg-coral text-on-coral";
  if (priority === "high") return "bg-tertiary-fixed text-on-tertiary-fixed";
  if (priority === "medium") return "bg-secondary-container text-on-secondary-container";
  return "bg-surface-container text-on-surface-variant";
}

export default async function ClientTicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string }>;
}) {
  const user = await requirePageUser(["client"]);
  const params = await searchParams;
  const status = params.status && params.status !== "all" ? params.status : undefined;
  const search = params.search?.trim() || undefined;

  const { items, total } = await listTicketsForUser(user, {
    status,
    search,
    pageSize: 50,
  });

  const filters = [
    { value: "all", label: "All" },
    { value: "open", label: "Open" },
    { value: "assigned", label: "Assigned" },
    { value: "in_progress", label: "In progress" },
    { value: "waiting_for_client", label: "Waiting" },
    { value: "resolved", label: "Resolved" },
    { value: "closed", label: "Closed" },
  ];

  const activeFilter = params.status ?? "all";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary">My tickets</h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            {total} ticket{total === 1 ? "" : "s"}
            {status ? ` · filtered` : ""}
          </p>
        </div>
        <Link
          href="/client/tickets/new"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary shadow-soft transition hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> New ticket
        </Link>
      </div>

      <form className="flex gap-2" action="/client/tickets" method="get">
        {status ? <input type="hidden" name="status" value={status} /> : null}
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
          <input
            name="search"
            defaultValue={search ?? ""}
            placeholder="Search by title or ticket number…"
            className="h-11 w-full rounded-xl border border-outline-variant/60 bg-surface-container-lowest pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-[#ff835e]/40"
          />
        </div>
        <button
          type="submit"
          className="rounded-xl bg-secondary-container px-4 text-sm font-semibold text-on-secondary-container"
        >
          Search
        </button>
      </form>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {filters.map((f) => {
          const href =
            f.value === "all"
              ? search
                ? `/client/tickets?search=${encodeURIComponent(search)}`
                : "/client/tickets"
              : `/client/tickets?status=${f.value}${search ? `&search=${encodeURIComponent(search)}` : ""}`;
          const active = activeFilter === f.value;
          return (
            <Link
              key={f.value}
              href={href}
              className={cn(
                "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition",
                active
                  ? "bg-primary text-on-primary"
                  : "bg-surface-container text-on-surface-variant hover:bg-secondary-container/50"
              )}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-outline-variant/70 bg-surface-container-lowest px-6 py-14 text-center shadow-soft">
          <p className="text-sm text-on-surface-variant">No tickets match this view.</p>
          <Link
            href="/client/tickets/new"
            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary underline-offset-4 hover:underline"
          >
            Create a ticket
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((t) => (
            <li key={t.id}>
              <Link
                href={`/client/tickets/${t.id}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-surface-container-lowest p-4 shadow-soft transition hover:shadow-card"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-on-surface">{t.title}</p>
                  <p className="mt-0.5 text-xs text-on-surface-variant">
                    {t.ticketNumber} · {t.category} · {t.createdAt}
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
    </div>
  );
}
