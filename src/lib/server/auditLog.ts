// ============================================================================
// Audit Log — "every change that goes on the system must be monitored by the
// admin." This is deliberately separate from olimart_events (the customer/
// vendor/rider-facing lifecycle feed): the audit log exists purely for
// accountability — who changed what, from what, to what, and when — for
// every write to a sensitive table (products, orders, vendors, riders,
// users, settings, settlement accounts, commission rates).
// ============================================================================
import type pg from "pg";

export const AUDIT_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS olimart_audit_log (
    id SERIAL PRIMARY KEY,
    actor_id VARCHAR(100),
    actor_role VARCHAR(50),
    action VARCHAR(50) NOT NULL,        -- 'create' | 'update' | 'delete' | 'approve' | 'reject'
    entity_type VARCHAR(50) NOT NULL,   -- 'product' | 'order_item' | 'vendor' | 'rider' | 'user' | 'settings' | 'settlement_account'
    entity_id VARCHAR(100) NOT NULL,
    before_state JSONB,
    after_state JSONB,
    ip_address VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS idx_olimart_audit_entity ON olimart_audit_log(entity_type, entity_id);
  CREATE INDEX IF NOT EXISTS idx_olimart_audit_actor ON olimart_audit_log(actor_id);
`;

export interface AuditEntry {
  actorId?: string;
  actorRole?: string;
  action: "create" | "update" | "delete" | "approve" | "reject";
  entityType: string;
  entityId: string;
  before?: unknown;
  after?: unknown;
  ipAddress?: string;
}

/**
 * writeAudit — call this from every admin-privileged mutation (product
 * delete/update, vendor approve/reject, settings change, settlement account
 * change, commission rate change, user role change). Never overwritten,
 * never deletable through the API — it's the record the admin (and, if
 * needed, a dispute investigation) relies on.
 */
export async function writeAudit(pool: pg.Pool | null, entry: AuditEntry): Promise<void> {
  if (!pool) return;
  try {
    await pool.query(
      `INSERT INTO olimart_audit_log (actor_id, actor_role, action, entity_type, entity_id, before_state, after_state, ip_address)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        entry.actorId || null,
        entry.actorRole || null,
        entry.action,
        entry.entityType,
        entry.entityId,
        entry.before !== undefined ? JSON.stringify(entry.before) : null,
        entry.after !== undefined ? JSON.stringify(entry.after) : null,
        entry.ipAddress || null,
      ]
    );
  } catch (err) {
    console.error("Failed to write audit log entry:", err);
  }
}

export interface AuditQuery {
  entityType?: string;
  entityId?: string;
  actorId?: string;
  limit?: number;
}

export async function readAuditLog(pool: pg.Pool | null, q: AuditQuery = {}) {
  if (!pool) return [];
  const clauses: string[] = [];
  const params: unknown[] = [];
  if (q.entityType) { params.push(q.entityType); clauses.push(`entity_type = $${params.length}`); }
  if (q.entityId) { params.push(q.entityId); clauses.push(`entity_id = $${params.length}`); }
  if (q.actorId) { params.push(q.actorId); clauses.push(`actor_id = $${params.length}`); }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  params.push(q.limit || 200);
  const result = await pool.query(
    `SELECT * FROM olimart_audit_log ${where} ORDER BY created_at DESC LIMIT $${params.length}`,
    params
  );
  return result.rows;
}
