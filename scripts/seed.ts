import "dotenv/config";
import { and, eq } from "drizzle-orm";
import { db, resetDbSingleton } from "../src/db";
import {
  policyVersions,
  supportCategories,
  users,
} from "../src/db/schema";
import { hashPassword, isStrongPassword } from "../src/lib/crypto";
import { newId } from "../src/lib/ids";
import { DRAFT_POLICIES } from "../src/lib/legal/policies";
import { utcNow } from "../src/lib/utils";

const defaultCategories = [
  { name: "General Support", description: "General questions and support requests." },
  { name: "Care Coordination", description: "Care planning and coordination requests." },
  { name: "Billing and Insurance", description: "Billing, coverage, and insurance questions." },
  { name: "Technical Support", description: "Help with portal access and technical issues." },
];

async function seedReferenceData() {
  for (const category of defaultCategories) {
    const existing = await db.query.supportCategories.findFirst({
      where: eq(supportCategories.name, category.name),
    });
    if (!existing) {
      await db.insert(supportCategories).values({
        id: newId("cat"),
        ...category,
        isActive: true,
        createdAt: utcNow(),
      });
    }
  }

  for (const policy of DRAFT_POLICIES) {
    const existing = await db.query.policyVersions.findFirst({
      where: and(
        eq(policyVersions.policyType, policy.policyType),
        eq(policyVersions.version, policy.version)
      ),
    });
    if (!existing) {
      await db.insert(policyVersions).values({
        id: newId("pol"),
        ...policy,
        effectiveAt: utcNow(),
        requiresRenewedAcceptance: true,
        createdAt: utcNow(),
      });
    }
  }
}

async function ensureAdmin() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME?.trim() || "Portal Administrator";

  if (!email || !password) {
    throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD before seeding the administrator.");
  }
  if (!isStrongPassword(password)) {
    throw new Error(
      "ADMIN_PASSWORD must be at least 10 characters and include upper, lower, number, and special characters."
    );
  }

  const existing = await db.query.users.findFirst({
    where: eq(users.email, email),
  });
  if (existing) {
    if (existing.role !== "admin") {
      throw new Error("ADMIN_EMAIL is already used by a non-administrator account.");
    }
    console.log(`Administrator ${email} already exists; its password was not changed.`);
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

async function main() {
  await seedReferenceData();
  await ensureAdmin();
  console.log("Database reference data is ready.");
}

main()
  .catch((error: unknown) => {
    console.error("Database seeding failed:", error);
    process.exitCode = 1;
  })
  .finally(() => {
    resetDbSingleton();
  });
