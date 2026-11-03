"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (!fd.get("acceptTerms") || !fd.get("acceptPrivacy")) {
      toast.error("You must accept the Terms and Privacy Policy");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fd.get("name"),
          email: fd.get("email"),
          password: fd.get("password"),
          phone: fd.get("phone") || undefined,
          province: fd.get("province") || undefined,
          acceptTerms: true,
          acceptPrivacy: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Registration failed");
      toast.success("Account created");
      router.push("/client");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      mode="register"
      title="Get started"
      description="Create an account to get support from the Clover team."
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-semibold text-[#41483d]">
            Full name
          </Label>
          <Input
            id="name"
            name="name"
            required
            minLength={2}
            autoComplete="name"
            placeholder="Your full name"
            className="h-12 rounded-2xl border-[#e3e6dc] bg-white px-4 text-[15px] focus-visible:ring-[#c9ef5b]"
          />
        </div>
        <div className="space-y-2">
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
            className="h-12 rounded-2xl border-[#e3e6dc] bg-white px-4 text-[15px] focus-visible:ring-[#c9ef5b]"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-semibold text-[#41483d]">
              Phone <span className="font-normal text-[#8a8e84]">(optional)</span>
            </Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              placeholder="Phone number"
              className="h-12 rounded-2xl border-[#e3e6dc] bg-white px-4 text-[15px] focus-visible:ring-[#c9ef5b]"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="province" className="text-sm font-semibold text-[#41483d]">
              Province <span className="font-normal text-[#8a8e84]">(optional)</span>
            </Label>
            <Input
              id="province"
              name="province"
              placeholder="e.g. ON"
              className="h-12 rounded-2xl border-[#e3e6dc] bg-white px-4 text-[15px] focus-visible:ring-[#c9ef5b]"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-semibold text-[#41483d]">
            Create password
          </Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              minLength={10}
              autoComplete="new-password"
              placeholder="At least 10 characters"
              className="h-12 rounded-2xl border-[#e3e6dc] bg-white px-4 pr-12 text-[15px] focus-visible:ring-[#c9ef5b]"
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
          <p className="text-[11px] leading-4 text-[#777b72]">
            Use at least 10 characters, including upper- and lowercase letters, a number, and a
            symbol.
          </p>
        </div>
        <div className="space-y-3 rounded-2xl bg-[#f7f8f4] p-3.5">
          <label className="flex items-start gap-2.5 text-xs leading-5 text-[#555b50]">
            <input
              type="checkbox"
              name="acceptTerms"
              className="mt-1 h-4 w-4 shrink-0 accent-[#789d30]"
              required
            />
            <span>
              I accept the{" "}
              <Link
                href="/legal/terms"
                className="font-semibold text-[#53672b] underline-offset-4 hover:underline"
                target="_blank"
              >
                Terms and Conditions
              </Link>
            </span>
          </label>
          <label className="flex items-start gap-2.5 text-xs leading-5 text-[#555b50]">
            <input
              type="checkbox"
              name="acceptPrivacy"
              className="mt-1 h-4 w-4 shrink-0 accent-[#789d30]"
              required
            />
            <span>
              I accept the{" "}
              <Link
                href="/legal/privacy"
                className="font-semibold text-[#53672b] underline-offset-4 hover:underline"
                target="_blank"
              >
                Privacy Policy
              </Link>
            </span>
          </label>
        </div>
        <Button
          className="h-14 w-full rounded-full bg-[#c9ef5b] text-base font-bold text-[#1c2911] shadow-[0_7px_18px_rgba(166,205,64,0.20)] transition hover:bg-[#bfe64d] focus-visible:ring-[#9fc83c]"
          disabled={loading}
        >
          {loading ? "Creating account…" : "Sign up"}
        </Button>
        <p className="pt-1 text-center text-xs text-[#777b72]">
          Assistants are created by administrators.
        </p>
      </form>
    </AuthShell>
  );
}
