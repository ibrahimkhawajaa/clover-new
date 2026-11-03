import "dotenv/config";
import fs from "fs";
import path from "path";

const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

process.env.TURSO_DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? "file:./data/clover-test.db";
process.env.DEV_RETURN_RESET_TOKEN = "true";
