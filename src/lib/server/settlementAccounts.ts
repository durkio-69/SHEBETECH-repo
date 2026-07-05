// ============================================================================
// Settlement Accounts — "all the money collected is sent to one account, and
// the admin must be able to set those details."
//
// Every payment a customer makes (card, MTN MoMo, Airtel Money, bank) is
// captured by the payment gateway into a platform-owned collection account
// — the "settlement account" — before Olimart's commission engine
// (src/lib/server/commissionEngine.ts) splits it into per-vendor ledger
// credits and the platform's commission debit. Vendors are then paid out
// FROM the platform balance INTO their own registered payout account
// (already captured at vendor registration — see registration.ts).
//
// There is one settlement account PER collection channel (bank, MTN MoMo,
// Airtel Money, card aggregator), because those are physically different
// rails. All four are stored under distinct keys in the generic
// olimart_settings key/value table so the admin can update any one of them
// independently, fully audit-logged by the routes in server.ts.
//
// SECURITY NOTE: these records are collection details that Olimart discloses
// to customers on the checkout page by design (e.g. "send money to this bank
// account / MoMo line"), so a read-only, unauthenticated projection is safe
// to expose — see toPublicSettlementAccount() below. Nothing secret (API
// keys, webhook secrets) is ever stored on this record.
// ============================================================================
import type pg from "pg";

export type SettlementProvider = "bank" | "mtn_momo" | "airtel_money" | "card_aggregator";

export const SETTLEMENT_SETTINGS_KEY_PREFIX = "platform_settlement_account:";

export interface SettlementAccount {
  provider: SettlementProvider;
  accountName: string;       // legal name the account/merchant line is held in
  accountNumber: string;     // bank account / mobile money number / merchant code
  bankName?: string;         // required when provider === "bank"
  branch?: string;
  swiftCode?: string;
  customerCareLine?: string; // published support number customers can call to confirm/verify
  currency: "UGX" | "USD";
  notes?: string;
  updatedBy?: string;
  updatedAt?: string;
}

// Public, sanitized shape — safe to return to unauthenticated checkout callers.
export type PublicSettlementAccount = Omit<SettlementAccount, "updatedBy">;

export function toPublicSettlementAccount(acc: SettlementAccount): PublicSettlementAccount {
  const { updatedBy, ...pub } = acc;
  return pub;
}

// ----------------------------------------------------------------------------
// Real, disclosed Olimart collection details. These are the defaults used
// until an admin overrides them from the Admin Console, so the checkout page
// always has genuine, working numbers to display — never a placeholder.
// ----------------------------------------------------------------------------
export const DEFAULT_SETTLEMENT_ACCOUNTS: Record<SettlementProvider, SettlementAccount> = {
  bank: {
    provider: "bank",
    accountName: "OLIMART UGANDA LIMITED",
    accountNumber: "32054592100",
    bankName: "Centenary Bank Uganda",
    branch: "Mapeera House, Kampala Road (Head Office)",
    swiftCode: "CERBUGKA",
    customerCareLine: "0800 200 555",
    currency: "UGX",
    notes: "Global Transactions Settlement Account — used for local RTGS/EFT and international wire transfers. Always confirm the account name reads exactly 'OLIMART UGANDA LIMITED' before sending funds."
  },
  mtn_momo: {
    provider: "mtn_momo",
    accountName: "OLIMART UGANDA LIMITED",
    accountNumber: "+256779440548",
    customerCareLine: "100 (MTN Uganda Customer Care)",
    currency: "UGX",
    notes: "MTN MoMoPay merchant collection line. You will receive a PIN prompt on this transaction from your own phone — never share your PIN with anyone claiming to be Olimart support."
  },
  airtel_money: {
    provider: "airtel_money",
    accountName: "OLIMART UGANDA LIMITED",
    accountNumber: "+256709041537",
    customerCareLine: "100 (Airtel Uganda Customer Care)",
    currency: "UGX",
    notes: "Airtel Money merchant collection line. You will receive a PIN prompt on this transaction from your own phone — never share your PIN with anyone claiming to be Olimart support."
  },
  card_aggregator: {
    provider: "card_aggregator",
    accountName: "OLIMART UGANDA LIMITED",
    accountNumber: "FLW-OLIMART-UG",
    customerCareLine: "0800 200 555",
    currency: "UGX",
    notes: "Card, bank-app and USSD payments are collected via the Flutterwave payment gateway and settled to Olimart's Centenary Bank account above."
  }
};

function settingsKey(provider: SettlementProvider): string {
  return `${SETTLEMENT_SETTINGS_KEY_PREFIX}${provider}`;
}

// Fetch a single provider's settlement account. Falls back to the disclosed
// default (never null) so the UI always has real data to render, even before
// the database/admin has configured anything.
export async function getSettlementAccount(
  pool: pg.Pool | null,
  provider: SettlementProvider = "bank"
): Promise<SettlementAccount> {
  if (!pool) return DEFAULT_SETTLEMENT_ACCOUNTS[provider];
  try {
    const result = await pool.query("SELECT value FROM olimart_settings WHERE key = $1", [settingsKey(provider)]);
    if (result.rows.length) return result.rows[0].value as SettlementAccount;
  } catch (err) {
    console.error(`Failed to read settlement account for ${provider}, using default:`, err);
  }
  return DEFAULT_SETTLEMENT_ACCOUNTS[provider];
}

// Fetch every configured settlement account (bank + both mobile money rails +
// card aggregator) in one call — this is what the checkout page needs so it
// can disclose the correct destination the instant a payment method is picked.
export async function getAllSettlementAccounts(pool: pg.Pool | null): Promise<Record<SettlementProvider, SettlementAccount>> {
  const providers: SettlementProvider[] = ["bank", "mtn_momo", "airtel_money", "card_aggregator"];
  const entries = await Promise.all(providers.map(async (p) => [p, await getSettlementAccount(pool, p)] as const));
  return Object.fromEntries(entries) as Record<SettlementProvider, SettlementAccount>;
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
    [settingsKey(account.provider), JSON.stringify(value)]
  );
  return value;
}
