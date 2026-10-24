import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** UTC timestamp as `YYYY-MM-DD HH:MM:SS` (no millis) for consistent SQLite compares. */
export function utcNow(): string {
  return new Date().toISOString().replace("T", " ").substring(0, 19);
}

export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(s / 3600)
    .toString()
    .padStart(2, "0");
  const minutes = Math.floor((s % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (s % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

export function parseSqliteUtc(value: string): Date {
  // Stored as UTC "YYYY-MM-DD HH:MM:SS" or ISO
  if (value.includes("T")) {
    return new Date(value.endsWith("Z") ? value : `${value}Z`);
  }
  return new Date(`${value.replace(" ", "T")}Z`);
}

export function elapsedSecondsSince(startedAt: string, endedAt?: string | null): number {
  const start = parseSqliteUtc(startedAt).getTime();
  const end = endedAt ? parseSqliteUtc(endedAt).getTime() : Date.now();
  return Math.max(0, Math.floor((end - start) / 1000));
}

export function dashboardPathForRole(role: "admin" | "client" | "assistant"): string {
  switch (role) {
    case "admin":
      return "/admin";
    case "assistant":
      return "/assistant";
    default:
      return "/client";
  }
}
