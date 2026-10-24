import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { userSessions, users, type UserRole } from "@/db/schema";
import { generateToken, hashToken } from "@/lib/crypto";
import { newId } from "@/lib/ids";
import { parseSqliteUtc, utcNow } from "@/lib/utils";

export const SESSION_COOKIE = "clover_session";
const SESSION_DAYS = 7;

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  accountStatus: string;
};

export async function createSession(userId: string): Promise<string> {
  const token = generateToken(32);
  const tokenHash = hashToken(token);
  const expires = new Date();
  expires.setUTCDate(expires.getUTCDate() + SESSION_DAYS);

  await db.insert(userSessions).values({
    id: newId("sess"),
    userId,
    sessionTokenHash: tokenHash,
    expiresAt: expires.toISOString().replace("T", " ").substring(0, 19),
    createdAt: utcNow(),
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires,
  });

  return token;
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await db
      .delete(userSessions)
      .where(eq(userSessions.sessionTokenHash, hashToken(token)));
  }
  cookieStore.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function invalidateAllUserSessions(userId: string): Promise<void> {
  await db.delete(userSessions).where(eq(userSessions.userId, userId));
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const tokenHash = hashToken(token);

  const row = await db
    .select({
      sessionId: userSessions.id,
      userId: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      accountStatus: users.accountStatus,
      expiresAt: userSessions.expiresAt,
    })
    .from(userSessions)
    .innerJoin(users, eq(userSessions.userId, users.id))
    .where(eq(userSessions.sessionTokenHash, tokenHash))
    .limit(1)
    .then((r) => r[0] ?? null);

  if (!row) return null;

  // Compare as real dates (avoid string/millis mismatch false negatives)
  if (parseSqliteUtc(row.expiresAt).getTime() <= Date.now()) {
    await db.delete(userSessions).where(eq(userSessions.id, row.sessionId));
    return null;
  }

  if (row.accountStatus !== "active") {
    await db.delete(userSessions).where(eq(userSessions.id, row.sessionId));
    return null;
  }

  return {
    id: row.userId,
    name: row.name,
    email: row.email,
    role: row.role,
    accountStatus: row.accountStatus,
  };
}

export async function requireUser(roles?: UserRole[]): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    throw new AuthError("Unauthorized", 401);
  }
  if (roles && !roles.includes(user.role)) {
    throw new AuthError("Forbidden", 403);
  }
  return user;
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}
