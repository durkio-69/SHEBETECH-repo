// ============================================================================
// Refund & Return Management — Dokan Pro's Refund Request module. Builds on
// top of the order state machine's existing return_requested/returned
// states (orderStateMachine.ts) by adding the actual money-movement and
// approval record: a customer or admin opens a request with a reason, an
// admin (support_admin/finance_admin/super_admin) approves or rejects it,
// and only approval writes the refund_reversal ledger entry that claws the
// vendor's earning back and reverses the platform's commission.
// ============================================================================
import type pg from "pg";
import crypto from "crypto";
import { writeLedgerEntries } from "./commissionEngine";

export type RefundStatus = "requested" | "approved" | "rejected" | "refunded";

export const REFUND_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS olimart_refund_requests (
    id VARCHAR(100) PRIMARY KEY,
    order_item_id VARCHAR(100) NOT NULL REFERENCES olimart_order_items(id) ON DELETE CASCADE,
    vendor_id VARCHAR(100) NOT NULL,
    customer_id VARCHAR(100),
    reason VARCHAR(50) NOT NULL,      -- 'damaged' | 'wrong_item' | 'not_as_described' | 'changed_mind' | 'other'
    detail TEXT,
    evidence_url TEXT,
    amount NUMERIC NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'requested',
    reviewed_by VARCHAR(100),
    reviewed_at TIMESTAMP,
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS idx_refunds_order_item ON olimart_refund_requests(order_item_id);
`;

export async function openRefundRequest(
  pool: pg.Pool,
  args: { orderItemId: string; vendorId: string; customerId?: string; reason: string; detail?: string; evidenceUrl?: string; amount: number }
): Promise<string> {
  const id = `rfd-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
  await pool.query(
    `INSERT INTO olimart_refund_requests (id, order_item_id, vendor_id, customer_id, reason, detail, evidence_url, amount, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'requested')`,
    [id, args.orderItemId, args.vendorId, args.customerId || null, args.reason, args.detail || null, args.evidenceUrl || null, args.amount]
  );
  return id;
}

export async function reviewRefundRequest(
  pool: pg.Pool,
  refundId: string,
  decision: "approved" | "rejected",
  reviewerId: string,
  rejectionReason?: string
) {
  const result = await pool.query("SELECT * FROM olimart_refund_requests WHERE id = $1", [refundId]);
  if (!result.rows.length) throw new Error("Refund request not found");
  const req = result.rows[0];
  if (req.status !== "requested") throw new Error(`Refund request is already ${req.status}`);

  if (decision === "approved") {
    // Reverse the vendor's earning; the platform absorbs its own commission
    // reversal implicitly since it's tracked as a negative-facing entry.
    await writeLedgerEntries(pool, [
      {
        id: `txn-${Date.now()}-refund`,
        orderItemId: req.order_item_id,
        vendorId: req.vendor_id,
        type: "refund_reversal",
        amount: Number(req.amount),
        note: `Refund approved for order item ${req.order_item_id} (reason: ${req.reason})`,
      },
    ]);
    await pool.query(
      `UPDATE olimart_refund_requests SET status = 'refunded', reviewed_by = $1, reviewed_at = NOW() WHERE id = $2`,
      [reviewerId, refundId]
    );
  } else {
    await pool.query(
      `UPDATE olimart_refund_requests SET status = 'rejected', reviewed_by = $1, reviewed_at = NOW(), rejection_reason = $2 WHERE id = $3`,
      [reviewerId, rejectionReason || null, refundId]
    );
  }
  return req;
}

export async function listRefundRequests(pool: pg.Pool, filter: { vendorId?: string; status?: RefundStatus } = {}) {
  const clauses: string[] = [];
  const params: unknown[] = [];
  if (filter.vendorId) { params.push(filter.vendorId); clauses.push(`vendor_id = $${params.length}`); }
  if (filter.status) { params.push(filter.status); clauses.push(`status = $${params.length}`); }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const result = await pool.query(`SELECT * FROM olimart_refund_requests ${where} ORDER BY created_at DESC`, params);
  return result.rows;
}
