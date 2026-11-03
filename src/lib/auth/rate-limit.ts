import { and, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import { loginAttempts } from "@/db/schema";
import { newId } from "@/lib/ids";
import { utcNow } from "@/lib/utils";

const WINDOW_MINUTES = 15;
const MAX_ATTEMPTS = 5;

export async function recordLoginAttempt(params: {
  email: string;
  ipAddress?: string | null;
  success: boolean;
}) {
  await db.insert(loginAttempts).values({
    id: newId("la"),
    email: params.email.toLowerCase(),
    ipAddress: params.ipAddress ?? null,
    success: params.success,
    attemptedAt: utcNow(),
  });
}

export async function isLoginRateLimited(email: string): Promise<boolean> {
  const since = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000)
    .toISOString()
    .replace("T", " ")
    .substring(0, 19);

  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(loginAttempts)
    .where(
      and(
        eq(loginAttempts.email, email.toLowerCase()),
        eq(loginAttempts.success, false),
        gte(loginAttempts.attemptedAt, since)
      )
    );

  return Number(result[0]?.count ?? 0) >= MAX_ATTEMPTS;
}
