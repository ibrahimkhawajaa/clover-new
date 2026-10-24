"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: fd.get("email"),
          password: fd.get("password"),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Login failed");
      toast.success("Welcome back");
      router.push(params.get("next") || data.redirectTo || "/");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={onSubmit}>
      <div className="space-y-2">
        <Label htmlFor="email" className="text-on-surface">
          Email
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="h-11 rounded-xl border-outline-variant/60 bg-white/80 transition focus-visible:ring-coral"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password" className="text-on-surface">
          Password
        </Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="h-11 rounded-xl border-outline-variant/60 bg-white/80 transition focus-visible:ring-coral"
        />
      </div>
      <Button
        className="h-11 w-full rounded-xl transition-transform duration-200 hover:scale-[1.01] active:scale-[0.99]"
        disabled={loading}
      >
        {loading ? "Signing in…" : "Sign in"}
      </Button>
      <p className="text-center text-sm text-on-surface-variant">
        <Link
          href="/forgot-password"
          className="text-secondary underline-offset-4 transition hover:underline"
        >
          Forgot password?
        </Link>
      </p>
      <p className="text-center text-sm text-on-surface-variant">
        New client?{" "}
        <Link
          href="/register"
          className="font-semibold text-primary underline-offset-4 transition hover:underline"
        >
          Create an account
        </Link>
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-surface p-4">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-secondary-container/70 blur-3xl transition-opacity" />
        <div className="absolute -bottom-32 -right-16 h-96 w-96 rounded-full bg-primary-fixed/60 blur-3xl" />
        <div className="absolute left-1/3 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-coral/15 blur-3xl" />
      </div>

      <div className="glass-card relative z-10 w-full max-w-md rounded-2xl p-8 transition-shadow duration-300 hover:shadow-card md:p-10">
        <div className="mb-8 flex flex-col items-center text-center">
          <Image
            src="/clover-logo.png"
            alt="Clover"
            width={72}
            height={72}
            className="mb-4 h-[72px] w-[72px] object-contain drop-shadow-sm"
            priority
          />
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-secondary">
            Clover Community
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-primary md:text-3xl">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-on-surface-variant">
            Sign in to your secure support dashboard
          </p>
        </div>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
