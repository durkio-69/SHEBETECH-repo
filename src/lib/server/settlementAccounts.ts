// ============================================================================
// Settlement Accounts — "all the money collected is sent to one account, and
// the admin must be able to set those details."
//
// Every payment a customer makes (card, MTN MoMo, Airtel Money, bank) is
// captured by the payment gateway into ONE platform-owned collection
// account — the "settlement account" — before Olimart's commission engine
// (src/lib/server/commissionEngine.ts) splits it into per-vendor ledger
// credits and the platform's commission debit. Vendors are then paid out
// FROM the platform balance INTO their own registered payout account
// (already captured at vendor registration — see registration.ts).
//
// This file is deliberately thin: it reuses the existing generic
// olimart_settings key/value table (one JSON blob per logical setting)
// rather than inventing a new table, and every read/write is
// permission-gated + audit-logged by the routes in server.ts.
// ============================================================================
import type pg from "pg";

export const SETTLEMENT_SETTINGS_KEY = "platform_settlement_account";

export interface SettlementAccount {
  provider: "bank" | "mtn_momo" | "airtel_money" | "card_aggregator";
  accountName: string;       // legal name the account is held in
  accountNumber: string;     // bank account / mobile money number / merchant code
  bankName?: string;         // required when provider === "bank"
  branch?: string;
  swiftCode?: string;
  currency: "UGX" | "USD";
  notes?: string;
  updatedBy?: string;
  updatedAt?: string;
}

export async function getSettlementAccount(pool: pg.Pool | null): Promise<SettlementAccount | null> {
  if (!pool) return null;
  const result = await pool.query("SELECT value FROM olimart_settings WHERE key = $1", [SETTLEMENT_SETTINGS_KEY]);
  return result.rows.length ? result.rows[0].value : null;
}

export async function setSettlementAccount(
  pool: pg.Pool,
  account: SettlementAccount,
  updatedBy: string
): Promise<SettlementAccount> {
  const value: SettlementAccount = { ...account, updatedBy, updatedAt: new Date().toISOString() };
  await pool.query(
    `INSERT INTO olimart_settings (key, value, updated_at) VALUES ($1, $2, CURRENT_TIMESTAMP)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP`,
    [SETTLEMENT_SETTINGS_KEY, JSON.stringify(value)]
  );
  return value;
}
