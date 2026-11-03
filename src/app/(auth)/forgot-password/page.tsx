"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ResetStep = "request" | "sent" | "reset";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<ResetStep>("request");
  const [resetToken, setResetToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");
    if (token) {
      setResetToken(token);
      setStep("reset");
    }
  }, []);

  async function requestReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const formData = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/auth/password-reset/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.get("email") }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not request a reset");

      if (data.devToken) {
        setResetToken(data.devToken);
        setStep("reset");
        toast.success("Development reset token ready");
      } else {
        setStep("sent");
        toast.success(data.message ?? "Check your email for reset instructions");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not request a reset");
    } finally {
      setLoading(false);
    }
  }

  async function confirmReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/password-reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: resetToken, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not reset password");

      toast.success("Password updated. Sign in with your new password.");
      router.replace("/login");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not reset password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      mode="reset"
      title="Reset password"
      description="We’ll help you securely get back into your Clover account."
    >
      {step === "request" && (
        <form className="space-y-4" onSubmit={requestReset}>
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
          <Button
            className="h-12 w-full rounded-full bg-[#c9ef5b] text-sm font-bold text-[#1c2911] transition hover:bg-[#bfe64d] focus-visible:ring-[#9fc83c]"
            disabled={loading}
          >
            {loading ? "Sending…" : "Send reset instructions"}
          </Button>
          <p className="text-center text-xs leading-5 text-[#777b72]">
            If an account exists for this address, you’ll receive reset instructions.
          </p>
        </form>
      )}

      {step === "sent" && (
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#eef5df] text-2xl text-[#627a34]">
            ✓
          </div>
          <div>
            <h2 className="font-bold text-[#30372b]">Check your inbox</h2>
            <p className="mt-2 text-sm leading-6 text-[#777b72]">
              If your email is associated with an account, reset instructions are on their way.
              The link expires in one hour.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setStep("request")}
            className="text-sm font-semibold text-[#53672b] underline-offset-4 hover:underline"
          >
            Try another email
          </button>
        </div>
      )}

      {step === "reset" && (
        <form className="space-y-4" onSubmit={confirmReset}>
          {resetToken && (
            <div className="space-y-2">
              <Label htmlFor="token" className="text-sm font-semibold text-[#41483d]">
                Reset token
              </Label>
              <Input
                id="token"
                name="token"
                required
                value={resetToken}
                onChange={(event) => setResetToken(event.target.value)}
                className="h-12 rounded-2xl border-[#e3e6dc] bg-white px-4 text-sm focus-visible:ring-[#c9ef5b]"
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-semibold text-[#41483d]">
              New password
            </Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                minLength={10}
                maxLength={200}
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
            <p className="text-xs leading-5 text-[#777b72]">
              Include upper- and lowercase letters, a number, and a symbol.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm font-semibold text-[#41483d]">
              Confirm new password
            </Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type={showPassword ? "text" : "password"}
              required
              minLength={10}
              maxLength={200}
              autoComplete="new-password"
              placeholder="Enter your new password again"
              className="h-12 rounded-2xl border-[#e3e6dc] bg-white px-4 text-[15px] focus-visible:ring-[#c9ef5b]"
            />
          </div>
          <Button
            className="h-12 w-full rounded-full bg-[#c9ef5b] text-sm font-bold text-[#1c2911] transition hover:bg-[#bfe64d] focus-visible:ring-[#9fc83c]"
            disabled={loading || !resetToken}
          >
            {loading ? "Updating password…" : "Update password"}
          </Button>
        </form>
      )}

      <p className="mt-5 text-center text-xs text-[#777b72]">
        Remembered your password?{" "}
        <Link
          href="/login"
          className="font-semibold text-[#53672b] underline-offset-4 hover:underline"
        >
          Log in
        </Link>
      </p>
    </AuthShell>
  );
}
