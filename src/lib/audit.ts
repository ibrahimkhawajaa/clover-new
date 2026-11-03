import { db } from "@/db";
import { auditLogs } from "@/db/schema";
import { newId } from "@/lib/ids";
import { utcNow } from "@/lib/utils";

export async function writeAuditLog(params: {
  actorUserId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  // Never store message bodies or PHI in audit metadata
  const safeMeta = params.metadata
    ? JSON.stringify(sanitizeMetadata(params.metadata))
    : null;

  await db.insert(auditLogs).values({
    id: newId("aud"),
    actorUserId: params.actorUserId ?? null,
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId ?? null,
    metadataJson: safeMeta,
    createdAt: utcNow(),
  });
}

function sanitizeMetadata(meta: Record<string, unknown>): Record<string, unknown> {
  const blocked = new Set([
    "password",
    "passwordHash",
    "messageBody",
    "message",
    "content",
    "token",
  ]);
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(meta)) {
    if (blocked.has(k)) continue;
    out[k] = v;
  }
  return out;
}
