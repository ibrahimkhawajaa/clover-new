import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { policyTypes, policyVersions } from "@/db/schema";
import { handleRouteError, jsonError, jsonOk } from "@/lib/api";
import { getPolicyByType } from "@/lib/legal/policies";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ type: string }> }
) {
  try {
    const { type } = await ctx.params;
    if (!policyTypes.includes(type as (typeof policyTypes)[number])) {
      return jsonError("Unknown policy", 404);
    }
    const fromDb = await db.query.policyVersions.findFirst({
      where: eq(policyVersions.policyType, type as (typeof policyTypes)[number]),
      orderBy: [desc(policyVersions.createdAt)],
    });
    if (fromDb) {
      return jsonOk({
        policyType: fromDb.policyType,
        version: fromDb.version,
        title: fromDb.title,
        contentMarkdown: fromDb.contentMarkdown,
        effectiveAt: fromDb.effectiveAt,
      });
    }
    const draft = getPolicyByType(type as (typeof policyTypes)[number]);
    return jsonOk(draft);
  } catch (err) {
    return handleRouteError(err);
  }
}
