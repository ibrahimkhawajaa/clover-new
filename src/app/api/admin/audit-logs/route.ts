import { count, desc } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs } from "@/db/schema";
import { handleRouteError, jsonOk } from "@/lib/api";
import { requireUser } from "@/lib/auth/session";

export async function GET(req: Request) {
  try {
    await requireUser(["admin"]);
    const url = new URL(req.url);
    const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
    const pageSize = Math.min(100, Number(url.searchParams.get("pageSize") ?? 50));
    const offset = (page - 1) * pageSize;

    const [items, total] = await Promise.all([
      db
        .select()
        .from(auditLogs)
        .orderBy(desc(auditLogs.createdAt))
        .limit(pageSize)
        .offset(offset),
      db.select({ c: count() }).from(auditLogs),
    ]);

    return jsonOk({ items, total: Number(total[0]?.c ?? 0), page, pageSize });
  } catch (err) {
    return handleRouteError(err);
  }
}
