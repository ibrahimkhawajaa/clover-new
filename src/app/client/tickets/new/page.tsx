import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requirePageUser } from "@/lib/auth/guards";
import { NewTicketForm } from "./new-ticket-form";

export default async function NewTicketPage() {
  await requirePageUser(["client"]);

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-8">
      <div>
        <Link href="/client" className="text-sm text-secondary underline-offset-4 hover:underline">
          ← Dashboard
        </Link>
        <h1 className="mt-3 text-2xl font-semibold text-on-surface">New support ticket</h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          Complete the multi-step intake (based on Clover patient forms). Government ID / SIN numbers
          are not collected in this portal. For emergencies, call local emergency services.
        </p>
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Intake & request</CardTitle>
          <CardDescription>
            Your answers are visible to assigned assistants and administrators only.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NewTicketForm />
        </CardContent>
      </Card>
    </div>
  );
}
