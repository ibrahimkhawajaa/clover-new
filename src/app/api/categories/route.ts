import { eq } from "drizzle-orm";
import { db } from "@/db";
import { supportCategories } from "@/db/schema";
import { handleRouteError, jsonOk } from "@/lib/api";
import { requireUser } from "@/lib/auth/session";
import { newId } from "@/lib/ids";
import { utcNow } from "@/lib/utils";
import { z } from "zod";

export async function GET() {
  try {
    await requireUser();
    const items = await db
      .select()
      .from(supportCategories)
      .where(eq(supportCategories.isActive, true));
    return jsonOk({ items });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function POST(req: Request) {
  try {
    await requireUser(["admin"]);
    const body = z
      .object({
        name: z.string().min(2).max(100),
        description: z.string().max(500).optional(),
      })
      .parse(await req.json());
    const id = newId("cat");
    await db.insert(supportCategories).values({
      id,
      name: body.name,
      description: body.description ?? null,
      isActive: true,
      createdAt: utcNow(),
    });
    return jsonOk({ id }, { status: 201 });
  } catch (err) {
    return handleRouteError(err);
  }
}
