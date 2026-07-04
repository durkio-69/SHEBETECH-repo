// ============================================================================
// Commission Engine — resolves the real commission rate for a sale and
// writes it as immutable ledger rows, instead of a hard-coded 15% computed
// in the browser (src/lib/dokanStore.ts:calculateCommission).
// ============================================================================
import type pg from "pg";

const PLATFORM_DEFAULT_RATE = 0.15;

// category -> rate overrides (kept in olimart_settings under key
// "commission_policy" so admins can edit it without a deploy)
export interface CommissionPolicy {
  defaultRate: number;
  categoryRates: Record<string, number>;
  vendorOverrides: Record<string, number>; // vendorId -> rate, highest priority
}

export async function getCommissionPolicy(pool: pg.Pool): Promise<CommissionPolicy> {
  const result = await pool.query("SELECT value FROM olimart_settings WHERE key = 'commission_policy'");
  if (result.rows.length) return result.rows[0].value as CommissionPolicy;
  return { defaultRate: PLATFORM_DEFAULT_RATE, categoryRates: {}, vendorOverrides: {} };
}

export function resolveRate(policy: CommissionPolicy, vendorId: string, category: string): number {
  if (policy.vendorOverrides?.[vendorId] !== undefined) return policy.vendorOverrides[vendorId];
  if (policy.categoryRates?.[category] !== undefined) return policy.categoryRates[category];
  return policy.defaultRate ?? PLATFORM_DEFAULT_RATE;
}

export interface LedgerEntry {
  id: string;
  orderItemId?: string;
  vendorId: string;
  type: "sale_credit" | "commission_debit" | "payout_debit" | "refund_reversal";
  amount: number; // always positive; sign is implied by `type`
  note?: string;
}

/**
 * Given a line item total, resolves the commission rate and returns the two
 * ledger entries that must be written atomically: the vendor's earned share
 * and the platform's commission cut. Called once, server-side, at order
 * confirmation — never recomputed client-side.
 */
export async function computeSaleSplit(
  pool: pg.Pool,
  args: { orderItemId: string; vendorId: string; category: string; lineTotal: number }
): Promise<{ rate: number; vendorEarning: number; platformCommission: number; entries: LedgerEntry[] }> {
  const policy = await getCommissionPolicy(pool);
  const rate = resolveRate(policy, args.vendorId, args.category);
  const platformCommission = Math.round(args.lineTotal * rate);
  const vendorEarning = args.lineTotal - platformCommission;

  const entries: LedgerEntry[] = [
    {
      id: `txn-${Date.now()}-credit`,
      orderItemId: args.orderItemId,
      vendorId: args.vendorId,
      type: "sale_credit",
      amount: vendorEarning,
      note: `Sale credit for order item ${args.orderItemId} at ${(100 - rate * 100).toFixed(1)}% payout rate`,
    },
    {
      id: `txn-${Date.now()}-commission`,
      orderItemId: args.orderItemId,
      vendorId: args.vendorId,
      type: "commission_debit",
      amount: platformCommission,
      note: `Platform commission (${(rate * 100).toFixed(1)}%) on order item ${args.orderItemId}`,
    },
  ];
  return { rate, vendorEarning, platformCommission, entries };
}

export async function writeLedgerEntries(pool: pg.Pool, entries: LedgerEntry[]): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const e of entries) {
      await client.query(
        `INSERT INTO olimart_transactions (id, order_item_id, vendor_id, type, amount, note)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [e.id, e.orderItemId || null, e.vendorId, e.type, e.amount, e.note || null]
      );
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

/** Vendor balance is now DERIVED from the ledger, never a mutated column. */
export async function getVendorBalance(pool: pg.Pool, vendorId: string): Promise<{ available: number; totalEarned: number; totalPaidOut: number }> {
  const result = await pool.query(
    `SELECT type, COALESCE(SUM(amount),0) AS total FROM olimart_transactions WHERE vendor_id = $1 GROUP BY type`,
    [vendorId]
  );
  let totalEarned = 0, totalPaidOut = 0, totalReversed = 0;
  for (const row of result.rows) {
    if (row.type === "sale_credit") totalEarned += Number(row.total);
    if (row.type === "payout_debit") totalPaidOut += Number(row.total);
    if (row.type === "refund_reversal") totalReversed += Number(row.total);
  }
  return { available: totalEarned - totalPaidOut - totalReversed, totalEarned, totalPaidOut };
}

export const TRANSACTIONS_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS olimart_transactions (
    id VARCHAR(100) PRIMARY KEY,
    order_item_id VARCHAR(100),
    vendor_id VARCHAR(100) NOT NULL REFERENCES olimart_vendors(id),
    type VARCHAR(50) NOT NULL CHECK (type IN ('sale_credit','commission_debit','payout_debit','refund_reversal')),
    amount NUMERIC NOT NULL,
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS idx_transactions_vendor ON olimart_transactions(vendor_id);
`;
