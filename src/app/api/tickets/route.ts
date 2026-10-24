import { handleRouteError, jsonOk } from "@/lib/api";
import { requireUser } from "@/lib/auth/session";
import { intakeSchema } from "@/lib/intake";
import { createTicket, listTicketsForUser } from "@/lib/services/tickets";
import { createTicketSchema } from "@/lib/validations";

export async function GET(req: Request) {
  try {
    const user = await requireUser();
    const url = new URL(req.url);
    const result = await listTicketsForUser(user, {
      status: url.searchParams.get("status") ?? undefined,
      priority: url.searchParams.get("priority") ?? undefined,
      search: url.searchParams.get("search") ?? undefined,
      page: Number(url.searchParams.get("page") ?? 1),
      pageSize: Number(url.searchParams.get("pageSize") ?? 20),
      assistantId: url.searchParams.get("assistantId") ?? undefined,
      clientId: url.searchParams.get("clientId") ?? undefined,
    });
    return jsonOk(result);
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser(["client"]);
    const body = createTicketSchema.parse(await req.json());
    let intakeJson: string | null = null;
    if (body.intake != null) {
      const intake = intakeSchema.parse(body.intake);
      intakeJson = JSON.stringify(intake);
    }
    const created = await createTicket({
      clientId: user.id,
      title: body.title,
      description: body.description,
      category: body.category,
      priority: body.priority ?? "medium",
      intakeJson,
    });
    return jsonOk(created, { status: 201 });
  } catch (err) {
    return handleRouteError(err);
  }
}
