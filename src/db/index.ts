import { createClient, type Client } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "./schema";

export type Database = LibSQLDatabase<typeof schema>;

let _client: Client | null = null;
let _db: Database | null = null;

function resolveDbUrl() {
  return process.env.TURSO_DATABASE_URL ?? process.env.DATABASE_URL ?? "file:./data/clover.db";
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
