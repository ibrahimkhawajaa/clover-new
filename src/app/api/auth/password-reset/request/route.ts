import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { passwordResetTokens, users } from "@/db/schema";
import { handleRouteError, jsonError, jsonOk } from "@/lib/api";
import { generateToken, hashToken } from "@/lib/crypto";
import { newId } from "@/lib/ids";
import { utcNow } from "@/lib/utils";
import { passwordResetRequestSchema } from "@/lib/validations";

/**
 * Returns the same response for existing and unknown accounts to avoid email enumeration.
 * In development, the reset token is returned when DEV_RETURN_RESET_TOKEN=true.
 */
export async function POST(req: Request) {
  try {
    const body = passwordResetRequestSchema.parse(await req.json());
    const email = body.email.toLowerCase().trim();

    const resendApiKey = process.env.RESEND_API_KEY?.trim();
    const fromEmail = process.env.RESEND_FROM_EMAIL?.trim();
    const configuredAppUrl = process.env.APP_URL?.trim();
    let appUrl: URL | undefined;
    try {
      if (configuredAppUrl) appUrl = new URL(configuredAppUrl);
      else if (process.env.NODE_ENV !== "production") appUrl = new URL(req.url);
    } catch {
      appUrl = undefined;
    }
    if (
      appUrl &&
      (appUrl.username ||
        appUrl.password ||
        (process.env.NODE_ENV === "production" && appUrl.protocol !== "https:"))
    ) {
      appUrl = undefined;
    }
    const canSendEmail = Boolean(resendApiKey && fromEmail && appUrl);
    const canReturnDevToken =
      process.env.NODE_ENV !== "production" && process.env.DEV_RETURN_RESET_TOKEN === "true";

    if (!canSendEmail && !canReturnDevToken) {
      return jsonError("Password reset is not configured. Please contact support.", 503);
    }

    const user = await db.query.users.findFirst({
      where: and(eq(users.email, email), eq(users.accountStatus, "active")),
    });

    let devToken: string | undefined;
    if (user && (user.role === "client" || user.role === "assistant")) {
      const token = generateToken(32);
      const expires = new Date(Date.now() + 60 * 60 * 1000);
      const tokenId = newId("prt");
      await db
        .delete(passwordResetTokens)
        .where(eq(passwordResetTokens.userId, user.id));
      await db.insert(passwordResetTokens).values({
        id: tokenId,
        userId: user.id,
        tokenHash: hashToken(token),
        expiresAt: expires.toISOString().replace("T", " ").substring(0, 19),
        createdAt: utcNow(),
      });

      if (canSendEmail) {
        const resetUrl = new URL("/forgot-password", appUrl);
        resetUrl.searchParams.set("token", token);
        const safeName = user.name.replace(/[&<>"']/g, (character) => {
          const entities: Record<string, string> = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
          };
          return entities[character];
        });
        let response: Response;
        try {
          response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${resendApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: fromEmail,
              to: [user.email],
              subject: "Reset your Clover password",
              text: `Hello ${user.name},\n\nUse this link within one hour to reset your Clover password:\n${resetUrl.toString()}\n\nIf you did not request this, you can ignore this email.`,
              html: `<p>Hello ${safeName},</p><p>Use the link below within one hour to reset your Clover password.</p><p><a href="${resetUrl.toString()}">Reset your password</a></p><p>If you did not request this, you can ignore this email.</p>`,
            }),
            cache: "no-store",
          });
        } catch (error) {
          await db.delete(passwordResetTokens).where(eq(passwordResetTokens.id, tokenId));
          console.error(
            "Password reset email delivery failed:",
            error instanceof Error ? error.name : "unknown"
          );
          return jsonError("Could not send reset instructions. Please try again later.", 502);
        }

        if (!response.ok) {
          await db
            .delete(passwordResetTokens)
            .where(eq(passwordResetTokens.id, tokenId));
          console.error("Password reset email delivery failed:", response.status);
          return jsonError("Could not send reset instructions. Please try again later.", 502);
        }
      } else if (canReturnDevToken) {
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
