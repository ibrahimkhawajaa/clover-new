import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { TicketChat } from "@/components/chat/ticket-chat";
import { StatusBadge } from "@/components/status-badge";
import { IntakeViewer } from "@/components/tickets/intake-viewer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requirePageUser } from "@/lib/auth/guards";
import { assertCanViewTicket, getTicketOrThrow } from "@/lib/authz/tickets";
import { AuthError } from "@/lib/auth/session";
import { AssignForm } from "./assign-form";
import { TicketControls } from "./ticket-controls";

export default async function AdminTicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requirePageUser(["admin"]);
  const { id } = await params;

  let ticket;
  try {
    ticket = await getTicketOrThrow(id);
    assertCanViewTicket(user, ticket);
  } catch (e) {
    if (e instanceof AuthError && e.status === 404) notFound();
    throw e;
  }

  const [client, assistant] = await Promise.all([
    db.query.users.findFirst({ where: eq(users.id, ticket.clientId) }),
    ticket.assignedAssistantId
      ? db.query.users.findFirst({ where: eq(users.id, ticket.assignedAssistantId) })
      : Promise.resolve(null),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/tickets"
          className="text-sm text-secondary underline-offset-4 hover:underline"
        >
          ← All tickets
        </Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-on-surface">{ticket.title}</h1>
            <p className="mt-1 text-sm text-on-surface-variant">
              {ticket.ticketNumber} · {ticket.category}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge value={ticket.status} />
            <StatusBadge value={ticket.priority} />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
            <CardDescription>Ticket metadata and parties</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="whitespace-pre-wrap text-on-surface">{ticket.description}</p>
            <dl className="grid gap-2 border-t border-outline-variant/40 pt-3">
              <div className="flex justify-between gap-4">
                <dt className="text-on-surface-variant">Client</dt>
                <dd className="text-right font-medium">
                  {client?.name ?? "—"}
                  {client?.email ? (
                    <span className="block text-xs font-normal text-on-surface-variant">
                      {client.email}
                    </span>
                  ) : null}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-on-surface-variant">Assigned assistant</dt>
                <dd className="text-right font-medium">{assistant?.name ?? "Unassigned"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-on-surface-variant">Created</dt>
                <dd>{ticket.createdAt}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-on-surface-variant">Updated</dt>
                <dd>{ticket.updatedAt}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Assignment</CardTitle>
            <CardDescription>
              Assign or reassign an assistant. Clients cannot pick their own assistant.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AssignForm
              ticketId={ticket.id}
              currentAssistantId={ticket.assignedAssistantId}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Status & priority</CardTitle>
        </CardHeader>
        <CardContent>
          <TicketControls
            ticketId={ticket.id}
            status={ticket.status}
            priority={ticket.priority}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Patient intake</CardTitle>
          <CardDescription>Questionnaire submitted with this ticket (SIN/SSN not collected).</CardDescription>
        </CardHeader>
        <CardContent>
          <IntakeViewer intakeJson={ticket.intakeJson} />
        </CardContent>
      </Card>

      <TicketChat
        ticketId={ticket.id}
        currentUserId={user.id}
        role={user.role}
        ticketLabel={ticket.ticketNumber}
      />
    </div>
  );
}
