import { and, count, desc, eq, like, or } from "drizzle-orm";
import { db } from "@/db";
import { assistantProfiles, clientProfiles, users } from "@/db/schema";
import { handleRouteError, jsonError, jsonOk } from "@/lib/api";
import { requireUser } from "@/lib/auth/session";
import { writeAuditLog } from "@/lib/audit";
import { hashPassword, isStrongPassword } from "@/lib/crypto";
import { newId } from "@/lib/ids";
import { utcNow } from "@/lib/utils";
import { createUserSchema } from "@/lib/validations";

export async function GET(req: Request) {
  try {
    await requireUser(["admin"]);
    const url = new URL(req.url);
    const role = url.searchParams.get("role");
    const search = url.searchParams.get("search");
    const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
    const pageSize = Math.min(50, Number(url.searchParams.get("pageSize") ?? 20));
    const offset = (page - 1) * pageSize;

    const conditions = [];
    if (role === "client" || role === "assistant" || role === "admin") {
      conditions.push(eq(users.role, role));
    }
    if (search) {
      const q = `%${search}%`;
      conditions.push(or(like(users.name, q), like(users.email, q))!);
    }
    const where = conditions.length ? and(...conditions) : undefined;

    const [items, total] = await Promise.all([
      db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
          accountStatus: users.accountStatus,
          createdAt: users.createdAt,
          lastLoginAt: users.lastLoginAt,
        })
        .from(users)
        .where(where)
        .orderBy(desc(users.createdAt))
        .limit(pageSize)
        .offset(offset),
      db.select({ c: count() }).from(users).where(where),
    ]);

    return jsonOk({ items, total: Number(total[0]?.c ?? 0), page, pageSize });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function POST(req: Request) {
  try {
    const admin = await requireUser(["admin"]);
    const body = createUserSchema.parse(await req.json());
    if (!isStrongPassword(body.password)) {
      return jsonError("Password does not meet strength requirements", 400);
    }
    const email = body.email.toLowerCase().trim();
    const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
    if (existing) return jsonError("Email already exists", 409);

    const id = newId("usr");
    const now = utcNow();
    await db.insert(users).values({
      id,
      name: body.name.trim(),
      email,
      passwordHash: await hashPassword(body.password),
      role: body.role,
      accountStatus: "active",
      createdAt: now,
      updatedAt: now,
    });

    if (body.role === "client") {
      await db.insert(clientProfiles).values({
        id: newId("cprof"),
        userId: id,
        createdAt: now,
        updatedAt: now,
      });
    } else {
      await db.insert(assistantProfiles).values({
        id: newId("aprof"),
        userId: id,
        availabilityStatus: "available",
        createdAt: now,
        updatedAt: now,
      });
    }

    await writeAuditLog({
      actorUserId: admin.id,
      action: "user.created",
      entityType: "user",
      entityId: id,
      metadata: { role: body.role, email },
    });

    return jsonOk({ id }, { status: 201 });
  } catch (err) {
    return handleRouteError(err);
  }
}
