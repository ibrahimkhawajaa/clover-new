import { and, count, eq } from "drizzle-orm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/db";
import { tickets } from "@/db/schema";
import { requirePageUser } from "@/lib/auth/guards";

export default async function AssistantWorkloadPage() {
  const user = await requirePageUser(["assistant"]);

  const [assigned, inProgress, resolved] = await Promise.all([
    db
      .select({ c: count() })
      .from(tickets)
      .where(eq(tickets.assignedAssistantId, user.id)),
    db
      .select({ c: count() })
      .from(tickets)
      .where(
        and(eq(tickets.assignedAssistantId, user.id), eq(tickets.status, "in_progress"))
      ),
    db
      .select({ c: count() })
      .from(tickets)
      .where(and(eq(tickets.assignedAssistantId, user.id), eq(tickets.status, "resolved"))),
  ]);

  const stats = [
    {
      label: "Assigned (all)",
      value: Number(assigned[0]?.c ?? 0),
      hint: "Total tickets currently assigned to you",
    },
    {
      label: "In progress",
      value: Number(inProgress[0]?.c ?? 0),
      hint: "Active work in progress",
    },
    {
      label: "Resolved",
      value: Number(resolved[0]?.c ?? 0),
      hint: "Resolved while assigned to you",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-on-surface">Workload</h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          Summary of tickets assigned to {user.name}.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader className="pb-2">
              <CardDescription>{s.label}</CardDescription>
              <CardTitle className="text-3xl tabular-nums text-primary">{s.value}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-on-surface-variant">{s.hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
