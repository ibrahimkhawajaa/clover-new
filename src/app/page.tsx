import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { dashboardPathForRole } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const user = await getSessionUser();
  if (user) redirect(dashboardPathForRole(user.role));

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none fixed inset-0 opacity-30">
        <div className="absolute left-[-10%] top-[-10%] h-[40%] w-[40%] rounded-full bg-secondary-container blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[40%] w-[40%] rounded-full bg-primary-fixed blur-[100px]" />
      </div>
      <main className="relative z-10 mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 py-16 text-center">
        <Image
          src="/clover-logo.png"
          alt="Clover Community Healthcare Inc."
          width={120}
          height={120}
          className="mb-6"
          priority
        />
        <p className="text-sm font-semibold tracking-[0.2em] text-secondary">
          CLOVER COMMUNITY HEALTHCARE INC.
        </p>
        <h1 className="mt-3 max-w-2xl text-4xl font-bold tracking-tight text-primary md:text-5xl">
          Client Support Portal
        </h1>
        <p className="mt-4 max-w-xl text-lg text-on-surface-variant">
          Secure ticket support and real-time assistance for clients across Canada.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild variant="secondary" size="lg">
            <Link href="/register">Register as client</Link>
          </Button>
        </div>
        <div className="mt-10 flex flex-wrap justify-center gap-4 text-sm text-secondary">
          <Link href="/legal/terms" className="underline-offset-4 hover:underline">
            Terms
          </Link>
          <Link href="/legal/privacy" className="underline-offset-4 hover:underline">
            Privacy
          </Link>
          <Link href="/legal/acceptable-use" className="underline-offset-4 hover:underline">
            Acceptable use
          </Link>
          <Link href="/legal/disclaimer" className="underline-offset-4 hover:underline">
            Disclaimer
          </Link>
        </div>
      </main>
    </div>
  );
}
