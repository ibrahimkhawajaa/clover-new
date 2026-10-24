import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { passwordResetTokens, users } from "@/db/schema";
import { handleRouteError, jsonOk } from "@/lib/api";
import { generateToken, hashToken } from "@/lib/crypto";
import { newId } from "@/lib/ids";
import { utcNow } from "@/lib/utils";
import { passwordResetRequestSchema } from "@/lib/validations";

/**
 * Always returns success to avoid email enumeration.
 * In development, the reset token is returned when DEV_RETURN_RESET_TOKEN=true.
 */
export async function POST(req: Request) {
  try {
    const body = passwordResetRequestSchema.parse(await req.json());
    const email = body.email.toLowerCase().trim();
    const user = await db.query.users.findFirst({
      where: and(eq(users.email, email), eq(users.accountStatus, "active")),
    });

    let devToken: string | undefined;
    if (user && (user.role === "client" || user.role === "assistant")) {
      const token = generateToken(32);
      const expires = new Date(Date.now() + 60 * 60 * 1000);
      await db.insert(passwordResetTokens).values({
        id: newId("prt"),
        userId: user.id,
        tokenHash: hashToken(token),
        expiresAt: expires.toISOString().replace("T", " ").substring(0, 19),
        createdAt: utcNow(),
      });
      // Integration boundary: plug in email provider here. Never log the token.
      if (process.env.DEV_RETURN_RESET_TOKEN === "true") {
        devToken = token;
      }
    }

    return jsonOk({
      ok: true,
      message: "If an account exists, reset instructions will be sent.",
      ...(devToken ? { devToken } : {}),
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
