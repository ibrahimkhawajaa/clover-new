import "dotenv/config";
import { defineConfig } from "drizzle-kit";

const url = process.env.TURSO_DATABASE_URL ?? process.env.DATABASE_URL ?? "file:./data/clover.db";
const common = {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
};

export default url.startsWith("file:")
  ? defineConfig({
      ...common,
      dialect: "sqlite",
      dbCredentials: { url },
    })
  : defineConfig({
      ...common,
      dialect: "turso",
      dbCredentials: {
        url,
        authToken: process.env.TURSO_AUTH_TOKEN,
      },
    });
