import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { requirePageUser } from "@/lib/auth/guards";
import { listTicketsForUser } from "@/lib/services/tickets";
import { ticketPriorities, ticketStatuses } from "@/db/schema";

export default async function AdminTicketsPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    priority?: string;
    search?: string;
    page?: string;
  }>;
}) {
  const user = await requirePageUser(["admin"]);
  const params = await searchParams;
  const page = Number(params.page ?? 1);

  const { items, total, pageSize } = await listTicketsForUser(user, {
    status: params.status || undefined,
    priority: params.priority || undefined,
    search: params.search || undefined,
    page,
  });

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-on-surface">Tickets</h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          Filter and assign support requests. Open a ticket to assign an assistant — assignment is
          only available from the ticket detail page.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            {total} ticket{total === 1 ? "" : "s"} matching current filters
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-end" method="get">
            <div className="min-w-[200px] flex-1 space-y-1.5">
              <label htmlFor="search" className="text-sm font-medium">
                Search
              </label>
              <Input
                id="search"
                name="search"
                placeholder="Title, number, or description"
                defaultValue={params.search ?? ""}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="status" className="text-sm font-medium">
                Status
              </label>
              <select
                id="status"
                name="status"
                defaultValue={params.status ?? ""}
                className="flex h-10 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 text-sm md:w-44"
              >
                <option value="">All</option>
                {ticketStatuses.map((s) => (
                  <option key={s} value={s}>
                    {s.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="priority" className="text-sm font-medium">
                Priority
              </label>
              <select
                id="priority"
                name="priority"
                defaultValue={params.priority ?? ""}
                className="flex h-10 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 text-sm md:w-40"
              >
                <option value="">All</option>
                {ticketPriorities.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit">Apply</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-outline-variant/50 bg-surface-container text-on-surface-variant">
              <tr>
                <th className="px-4 py-3 font-medium">Number</th>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Client</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Priority</th>
                <th className="px-4 py-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-on-surface-variant">
                    No tickets found.
                  </td>
                </tr>
              )}
              {items.map((t) => (
                <tr
                  key={t.id}
                  className="border-b border-outline-variant/40 last:border-0 hover:bg-surface-container/60"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/tickets/${t.id}`}
                      className="font-medium text-primary underline-offset-2 hover:underline"
                    >
                      {t.ticketNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3 max-w-[240px] truncate">{t.title}</td>
                  <td className="px-4 py-3">{t.clientName ?? "—"}</td>
                  <td className="px-4 py-3">
                    <StatusBadge value={t.status} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge value={t.priority} />
                  </td>
                  <td className="px-4 py-3 text-on-surface-variant">{t.createdAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-on-surface-variant">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Button asChild variant="outline" size="sm">
                <Link
                  href={`/admin/tickets?${new URLSearchParams({
                    ...(params.search ? { search: params.search } : {}),
                    ...(params.status ? { status: params.status } : {}),
                    ...(params.priority ? { priority: params.priority } : {}),
                    page: String(page - 1),
                  }).toString()}`}
                >
                  Previous
                </Link>
              </Button>
            )}
            {page < totalPages && (
              <Button asChild variant="outline" size="sm">
                <Link
                  href={`/admin/tickets?${new URLSearchParams({
                    ...(params.search ? { search: params.search } : {}),
                    ...(params.status ? { status: params.status } : {}),
                    ...(params.priority ? { priority: params.priority } : {}),
                    page: String(page + 1),
                  }).toString()}`}
                >
                  Next
                </Link>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
