import { createClient, type Client } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "./schema";

export type Database = LibSQLDatabase<typeof schema>;

let _client: Client | null = null;
let _db: Database | null = null;

function resolveDbUrl() {
  const url = process.env.TURSO_DATABASE_URL ?? process.env.DATABASE_URL;
  if (
    process.env.VERCEL &&
    (!url || url.startsWith("file:") || !process.env.TURSO_AUTH_TOKEN)
  ) {
    throw new Error(
      "A persistent database is required on Vercel. Set TURSO_DATABASE_URL to your Turso/libSQL URL and TURSO_AUTH_TOKEN to its authentication token."
    );
  }
  return url ?? "file:./data/clover.db";
}

export function getDb(): Database {
  if (_db) return _db;
  _client = createClient({
    url: resolveDbUrl(),
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  _db = drizzle(_client, { schema });
  return _db;
}

/** @deprecated prefer getDb() for testability; kept for existing imports */
export const db = new Proxy({} as Database, {
  get(_target, prop, receiver) {
    const real = getDb();
    const value = Reflect.get(real, prop, receiver);
    return typeof value === "function" ? value.bind(real) : value;
  },
});

export function resetDbSingleton() {
  _client?.close();
  _client = null;
  _db = null;
}
