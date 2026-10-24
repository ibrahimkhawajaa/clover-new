import { desc } from "drizzle-orm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/db";
import { auditLogs } from "@/db/schema";
import { requirePageUser } from "@/lib/auth/guards";

export default async function AdminAuditPage() {
  await requirePageUser(["admin"]);

  const items = await db.query.auditLogs.findMany({
    orderBy: [desc(auditLogs.createdAt)],
    limit: 100,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-on-surface">Audit log</h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          Recent administrative and system actions for compliance review.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Events</CardTitle>
          <CardDescription>Showing the 100 most recent entries</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="border-b border-outline-variant/50 bg-surface-container text-on-surface-variant">
              <tr>
                <th className="px-4 py-3 font-medium">When</th>
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium">Entity</th>
                <th className="px-4 py-3 font-medium">Actor</th>
                <th className="px-4 py-3 font-medium">Metadata</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-on-surface-variant">
                    No audit events yet.
                  </td>
                </tr>
              )}
              {items.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-outline-variant/40 last:border-0 hover:bg-surface-container/60"
                >
                  <td className="px-4 py-3 whitespace-nowrap text-on-surface-variant">
                    {row.createdAt}
                  </td>
                  <td className="px-4 py-3 font-medium">{row.action}</td>
                  <td className="px-4 py-3">
                    {row.entityType}
                    {row.entityId ? (
                      <span className="block text-xs text-on-surface-variant">{row.entityId}</span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-on-surface-variant">
                    {row.actorUserId ?? "system"}
                  </td>
                  <td className="max-w-[280px] truncate px-4 py-3 font-mono text-xs text-on-surface-variant">
                    {row.metadataJson ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
