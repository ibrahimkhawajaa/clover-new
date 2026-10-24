import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requirePageUser } from "@/lib/auth/guards";
import { listSessionsForAdmin } from "@/lib/services/chat";
import { elapsedSecondsSince, formatDuration } from "@/lib/utils";

export default async function AdminSessionsPage() {
  await requirePageUser(["admin"]);
  const rows = await listSessionsForAdmin({ page: 1, pageSize: 50 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-on-surface">Chat sessions</h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          Operational session durations for monitoring — not billable time.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent sessions</CardTitle>
          <CardDescription>Up to 50 most recent chat sessions</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-outline-variant/50 bg-surface-container text-on-surface-variant">
              <tr>
                <th className="px-4 py-3 font-medium">Ticket</th>
                <th className="px-4 py-3 font-medium">Assistant</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Started</th>
                <th className="px-4 py-3 font-medium">Ended</th>
                <th className="px-4 py-3 font-medium">Duration</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-on-surface-variant">
                    No chat sessions yet.
                  </td>
                </tr>
              )}
              {rows.map(({ session, ticketNumber, assistantName }) => {
                const seconds =
                  session.durationSeconds ??
                  (session.status === "active"
                    ? elapsedSecondsSince(session.startedAt)
                    : elapsedSecondsSince(session.startedAt, session.endedAt));
                return (
                  <tr
                    key={session.id}
                    className="border-b border-outline-variant/40 last:border-0 hover:bg-surface-container/60"
                  >
                    <td className="px-4 py-3 font-medium">{ticketNumber}</td>
                    <td className="px-4 py-3">{assistantName}</td>
                    <td className="px-4 py-3">
                      <StatusBadge value={session.status} />
                    </td>
                    <td className="px-4 py-3 text-on-surface-variant">{session.startedAt}</td>
                    <td className="px-4 py-3 text-on-surface-variant">
                      {session.endedAt ?? "—"}
                    </td>
                    <td className="px-4 py-3 font-mono tabular-nums">
                      {formatDuration(seconds)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
