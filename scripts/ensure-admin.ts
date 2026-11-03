import "dotenv/config";
import { eq } from "drizzle-orm";
import { db, resetDbSingleton } from "../src/db";
import { users } from "../src/db/schema";
import { hashPassword, isStrongPassword } from "../src/lib/crypto";
import { newId } from "../src/lib/ids";
import { utcNow } from "../src/lib/utils";

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME?.trim() || "Portal Administrator";

  if (!email || !password) {
    throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD before creating the administrator.");
  }
  if (!isStrongPassword(password)) {
    throw new Error(
      "ADMIN_PASSWORD must be at least 10 characters and include upper, lower, number, and special characters."
    );
  }

  const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (existing) {
    if (existing.role !== "admin") {
      throw new Error("ADMIN_EMAIL is already used by a non-administrator account.");
    }
    const passwordHash = await hashPassword(password);
    await db
      .update(users)
      .set({ passwordHash, updatedAt: utcNow() })
      .where(eq(users.id, existing.id));
    console.log(`Updated the password for administrator ${email}.`);
    return;
  }

  const now = utcNow();
  await db.insert(users).values({
    id: newId("usr"),
    name,
    email,
    passwordHash: await hashPassword(password),
    role: "admin",
    accountStatus: "active",
    createdAt: now,
    updatedAt: now,
  });
  console.log(`Created administrator ${email}.`);
}

main()
  .catch((error: unknown) => {
    console.error("Administrator setup failed:", error);
    process.exitCode = 1;
  })
  .finally(() => {
    resetDbSingleton();
  });
