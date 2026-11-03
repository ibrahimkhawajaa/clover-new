import { NextResponse } from "next/server";
import { AuthError } from "@/lib/auth/session";
import { ZodError } from "zod";

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export function handleRouteError(err: unknown) {
  if (err instanceof AuthError) {
    return jsonError(err.message, err.status);
  }
  if (err instanceof ZodError) {
    return jsonError(err.issues[0]?.message ?? "Validation failed", 400);
  }
  console.error("Unhandled route error:", err instanceof Error ? err.name : "unknown");
  return jsonError("Internal server error", 500);
}
