import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { TicketChat } from "@/components/chat/ticket-chat";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requirePageUser } from "@/lib/auth/guards";
import { AuthError } from "@/lib/auth/session";
import { assertCanViewTicket, getTicketOrThrow } from "@/lib/authz/tickets";
import { CloseTicketButton } from "./close-ticket-button";

export default async function ClientTicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requirePageUser(["client"]);
  const { id } = await params;

  let ticket;
  try {
    ticket = await getTicketOrThrow(id);
    assertCanViewTicket(user, ticket);
  } catch (e) {
    if (e instanceof AuthError && (e.status === 404 || e.status === 403)) notFound();
    throw e;
  }

  const assistant = ticket.assignedAssistantId
    ? await db.query.users.findFirst({ where: eq(users.id, ticket.assignedAssistantId) })
    : null;

  const canClose = ticket.status !== "closed";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/client"
            className="text-sm text-secondary underline-offset-4 hover:underline"
          >
            ← Dashboard
          </Link>
          <h1 className="mt-3 text-2xl font-semibold text-on-surface">{ticket.title}</h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            {ticket.ticketNumber} · {ticket.category}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge value={ticket.status} />
          <StatusBadge value={ticket.priority} />
          <CloseTicketButton ticketId={ticket.id} disabled={!canClose} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
          <CardDescription>
            Assistant: {assistant?.name ?? "Pending assignment by an administrator"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="whitespace-pre-wrap">{ticket.description}</p>
          <dl className="grid gap-2 border-t border-outline-variant/40 pt-3 sm:grid-cols-2">
            <div>
              <dt className="text-on-surface-variant">Created</dt>
              <dd>{ticket.createdAt}</dd>
            </div>
            <div>
              <dt className="text-on-surface-variant">Last updated</dt>
              <dd>{ticket.updatedAt}</dd>
            </div>
          </dl>
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
