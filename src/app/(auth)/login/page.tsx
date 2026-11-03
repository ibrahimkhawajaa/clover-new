"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
      const next = params.get("next");
      const rolePrefix =
        data.user.role === "admin"
          ? "/admin"
          : data.user.role === "assistant"
            ? "/assistant"
            : "/client";
      const safeNext =
        next?.startsWith(`${rolePrefix}/`) || next === rolePrefix
          ? next
          : null;
      router.replace(safeNext ?? data.redirectTo ?? "/");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="space-y-4 sm:space-y-5" onSubmit={onSubmit}>
      <div className="space-y-1.5 sm:space-y-2">
        <Label htmlFor="email" className="text-sm font-semibold text-[#41483d]">
          Email address
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          className="h-11 rounded-2xl border-[#e3e6dc] bg-white px-4 text-[15px] focus-visible:ring-[#c9ef5b] sm:h-12"
        />
      </div>
      <div className="space-y-1.5 sm:space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password" className="text-sm font-semibold text-[#41483d]">
            Password
          </Label>
          <Link
            href="/forgot-password"
            className="text-xs font-medium text-[#687747] underline-offset-4 transition hover:text-[#34451c] hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            placeholder="Enter your password"
            className="h-11 rounded-2xl border-[#e3e6dc] bg-white px-4 pr-12 text-[15px] focus-visible:ring-[#c9ef5b] sm:h-12"
          />
          <button
            type="button"
            aria-label={showPassword ? "Hide password" : "Show password"}
            onClick={() => setShowPassword((visible) => !visible)}
            className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-[#777d70] transition hover:text-[#252c20]"
          >
            {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </div>
      </div>
      <Button
        className="h-12 w-full rounded-full bg-[#c9ef5b] text-base font-bold text-[#1c2911] shadow-[0_7px_18px_rgba(166,205,64,0.20)] transition hover:bg-[#bfe64d] focus-visible:ring-[#9fc83c] sm:h-14"
        disabled={loading}
      >
        {loading ? "Logging in…" : "Log in"}
      </Button>
      <p className="pt-0 text-center text-xs text-[#777b72] sm:pt-1">
        New to Clover?{" "}
        <Link
          href="/register"
          className="font-semibold text-[#53672b] underline-offset-4 transition hover:underline"
        >
          Create an account
        </Link>
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <AuthShell
      mode="login"
      title="Welcome back"
      description="Log in to access your Clover support account."
    >
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
