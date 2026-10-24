import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requirePageUser } from "@/lib/auth/guards";
import { PasswordForm } from "./password-form";

export default async function ClientSettingsPage() {
  await requirePageUser(["client"]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-primary">Settings</h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          Security, preferences, and legal documents.
        </p>
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>Change the password for your client account.</CardDescription>
        </CardHeader>
        <CardContent>
          <PasswordForm />
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Update name, phone, and language on your profile page.</CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            href="/client/profile"
            className="text-sm font-semibold text-primary underline-offset-4 hover:underline"
          >
            Edit profile →
          </Link>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Legal & privacy</CardTitle>
          <CardDescription>Draft policies for this portal (Canada).</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm">
          <Link href="/legal/terms" className="text-primary underline-offset-4 hover:underline">
            Terms and Conditions
          </Link>
          <Link href="/legal/privacy" className="text-primary underline-offset-4 hover:underline">
            Privacy Policy
          </Link>
          <Link
            href="/legal/acceptable-use"
            className="text-primary underline-offset-4 hover:underline"
          >
            Acceptable Use Policy
          </Link>
          <Link href="/legal/disclaimer" className="text-primary underline-offset-4 hover:underline">
            Support Service Disclaimer
          </Link>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Help</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-on-surface-variant">
          <p>
            For account issues, open a ticket from{" "}
            <Link href="/client/tickets/new" className="font-medium text-primary underline">
              New ticket
            </Link>
            . This portal is not for medical emergencies — call local emergency services if needed.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
