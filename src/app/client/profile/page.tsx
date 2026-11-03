import { eq } from "drizzle-orm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/db";
import { clientProfiles } from "@/db/schema";
import { requirePageUser } from "@/lib/auth/guards";
import { ProfileForm } from "./profile-form";

export default async function ClientProfilePage() {
  const user = await requirePageUser(["client"]);
  const profile = await db.query.clientProfiles.findFirst({
    where: eq(clientProfiles.userId, user.id),
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-primary">Profile</h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          Keep your contact details up to date for support.
        </p>
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Your details</CardTitle>
          <CardDescription>Visible to your assigned assistant and administrators.</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm
            initial={{
              name: user.name,
              email: user.email,
              phone: profile?.phone ?? "",
              province: profile?.province ?? "",
              preferredLanguage: profile?.preferredLanguage ?? "en",
            }}
          />
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          <dl className="grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-on-surface-variant">Status</dt>
              <dd className="mt-1 font-medium capitalize">{user.accountStatus}</dd>
            </div>
            <div>
              <dt className="text-on-surface-variant">Role</dt>
              <dd className="mt-1 font-medium">Client</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
