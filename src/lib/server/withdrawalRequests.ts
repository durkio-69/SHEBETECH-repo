// ============================================================================
// Withdrawal Requests — Dokan Pro's "Withdraw" module: a vendor requests a
// payout of their AVAILABLE ledger balance (never more than they've
// actually earned), an admin (finance_admin/super_admin) approves or
// rejects it, and only on approval does a payout_debit ledger entry get
// written and money actually move to the vendor's registered payout
// account. Nothing here lets a vendor grant themselves money.
// ============================================================================
import type pg from "pg";
import crypto from "crypto";
import { getVendorBalance, writeLedgerEntries } from "./commissionEngine";

export type WithdrawalStatus = "pending" | "approved" | "rejected" | "paid";

export const WITHDRAWAL_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS olimart_withdrawal_requests (
    id VARCHAR(100) PRIMARY KEY,
    vendor_id VARCHAR(100) NOT NULL REFERENCES olimart_vendors(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    method VARCHAR(30) NOT NULL,          -- 'bank' | 'mtn_momo' | 'airtel_money' | 'paypal'
    destination_account VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_by VARCHAR(100),
    reviewed_at TIMESTAMP,
    rejection_reason TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_withdrawals_vendor ON olimart_withdrawal_requests(vendor_id);
`;

export async function requestWithdrawal(
  pool: pg.Pool,
  vendorId: string,
  amount: number,
  method: string,
  destinationAccount: string
) {
  const balance = await getVendorBalance(pool, vendorId);
  if (amount <= 0) throw new Error("Withdrawal amount must be greater than zero");
  if (amount > balance.available) {
    throw new Error(`Requested amount (UGX ${amount.toLocaleString()}) exceeds available balance (UGX ${balance.available.toLocaleString()})`);
  }
  const id = `wd-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
  await pool.query(
    `INSERT INTO olimart_withdrawal_requests (id, vendor_id, amount, method, destination_account, status)
     VALUES ($1,$2,$3,$4,$5,'pending')`,
    [id, vendorId, amount, method, destinationAccount]
  );
  return id;
}

export async function reviewWithdrawal(
  pool: pg.Pool,
  withdrawalId: string,
  decision: "approved" | "rejected",
  reviewerId: string,
  rejectionReason?: string
) {
  const result = await pool.query("SELECT * FROM olimart_withdrawal_requests WHERE id = $1", [withdrawalId]);
  if (!result.rows.length) throw new Error("Withdrawal request not found");
  const req = result.rows[0];
  if (req.status !== "pending") throw new Error(`Withdrawal is already ${req.status}`);

  if (decision === "approved") {
    // Re-check balance at approval time too — a vendor could have multiple
    // pending requests that together exceed their balance.
    const balance = await getVendorBalance(pool, req.vendor_id);
    if (Number(req.amount) > balance.available) {
      throw new Error("Vendor's available balance is no longer sufficient for this withdrawal");
    }
    await writeLedgerEntries(pool, [
      {
        id: `txn-${Date.now()}-payout`,
        vendorId: req.vendor_id,
        type: "payout_debit",
        amount: Number(req.amount),
        note: `Payout for withdrawal request ${withdrawalId} via ${req.method} to ${req.destination_account}`,
      },
    ]);
    await pool.query(
      `UPDATE olimart_withdrawal_requests SET status = 'paid', reviewed_by = $1, reviewed_at = NOW() WHERE id = $2`,
      [reviewerId, withdrawalId]
    );
  } else {
    await pool.query(
      `UPDATE olimart_withdrawal_requests SET status = 'rejected', reviewed_by = $1, reviewed_at = NOW(), rejection_reason = $2 WHERE id = $3`,
      [reviewerId, rejectionReason || null, withdrawalId]
    );
  }
  return req;
}

export async function listWithdrawals(pool: pg.Pool, filter: { vendorId?: string; status?: WithdrawalStatus } = {}) {
  const clauses: string[] = [];
  const params: unknown[] = [];
  if (filter.vendorId) { params.push(filter.vendorId); clauses.push(`vendor_id = $${params.length}`); }
  if (filter.status) { params.push(filter.status); clauses.push(`status = $${params.length}`); }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const result = await pool.query(`SELECT * FROM olimart_withdrawal_requests ${where} ORDER BY requested_at DESC`, params);
  return result.rows;
}
