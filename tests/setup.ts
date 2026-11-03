import "dotenv/config";
import fs from "fs";
import path from "path";

const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const testDatabaseUrl = process.env.TEST_DATABASE_URL ?? "file:./data/clover-test.db";
if (!testDatabaseUrl.startsWith("file:")) {
  throw new Error(
    "TEST_DATABASE_URL must be a local file: URL because workflow tests recreate the database schema."
  );
}

process.env.TURSO_DATABASE_URL = testDatabaseUrl;
process.env.DEV_RETURN_RESET_TOKEN = "true";
