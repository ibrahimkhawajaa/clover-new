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
import { AuthError } from "@/lib/auth/session";
import { assertCanViewTicket, getTicketOrThrow } from "@/lib/authz/tickets";
import { AssistantStatusForm } from "./status-form";

export default async function AssistantTicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requirePageUser(["assistant"]);
  const { id } = await params;

  let ticket;
  try {
    ticket = await getTicketOrThrow(id);
    assertCanViewTicket(user, ticket);
  } catch (e) {
    if (e instanceof AuthError && (e.status === 404 || e.status === 403)) notFound();
    throw e;
  }

  const client = await db.query.users.findFirst({ where: eq(users.id, ticket.clientId) });

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/assistant"
          className="text-sm text-secondary underline-offset-4 hover:underline"
        >
          ← Workspace
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

      <Card>
        <CardHeader>
          <CardTitle>Ticket details</CardTitle>
          <CardDescription>
            Client: {client?.name ?? "—"}
            {client?.email ? ` · ${client.email}` : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p className="whitespace-pre-wrap">{ticket.description}</p>
          <AssistantStatusForm ticketId={ticket.id} currentStatus={ticket.status} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Patient intake</CardTitle>
          <CardDescription>Information the client submitted with this request.</CardDescription>
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
