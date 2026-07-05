// ============================================================================
// Commerce Engine — the WooCommerce-Pro-equivalent feature set: quantity/
// role-based dynamic pricing, a real advanced-coupon validator (not just a
// client-side percentage-off), wishlists, back-in-stock alerts, an
// immutable customer loyalty-points ledger (mirrors the vendor commission
// ledger pattern — never a mutable "points" column), abandoned-cart
// recovery, and deposit/partial-payment support.
// ============================================================================
import type pg from "pg";
import crypto from "crypto";
import { dispatch } from "./notificationService";

// ---------------------------------------------------------------------------
// Dynamic pricing — quantity price-breaks are stored on the product itself
// (Product.priceTiers in src/types.ts) and resolved server-side at checkout,
// never trusted from the client. Mirrors WooCommerce Dynamic Pricing's
// "bulk discount" rules.
// ---------------------------------------------------------------------------
export interface PriceTier {
  minQty: number;
  discountPercent: number; // e.g. 10 = 10% off unit price at this quantity or above
}

export function resolveUnitPrice(basePrice: number, quantity: number, tiers?: PriceTier[]): { unitPrice: number; appliedTier?: PriceTier } {
  if (!tiers || tiers.length === 0) return { unitPrice: basePrice };
  const applicable = tiers.filter((t) => quantity >= t.minQty).sort((a, b) => b.minQty - a.minQty)[0];
  if (!applicable) return { unitPrice: basePrice };
  return { unitPrice: Math.round(basePrice * (1 - applicable.discountPercent / 100)), appliedTier: applicable };
}

// ---------------------------------------------------------------------------
// Advanced coupons — percentage, flat, and free-shipping types; enforces
// minimum spend, global usage cap, and a real per-customer redemption cap
// backed by a redemptions table (not just a client-side "already used?"
// localStorage flag). Mirrors WooCommerce's advanced coupon rules.
// ---------------------------------------------------------------------------
export interface CouponRule {
  code: string;
  type: "percentage" | "flat" | "free_shipping";
  value: number;              // percent (0-100) or flat UGX amount; ignored for free_shipping
  minSpend?: number;
  maxUsesTotal?: number;
  maxUsesPerCustomer?: number;
  expiresAt?: string;
  vendorId?: string;          // if set, only valid on that vendor's line items
}

export async function validateAndPriceCoupon(
  pool: pg.Pool,
  code: string,
  customerId: string,
  cartTotal: number
): Promise<{ valid: boolean; reason?: string; discount?: number; freeShipping?: boolean; coupon?: CouponRule }> {
  const result = await pool.query(`SELECT data FROM olimart_coupons WHERE id = $1 OR data->>'code' = $1`, [code]);
  if (!result.rows.length) return { valid: false, reason: "Coupon not found" };
  const coupon = result.rows[0].data as CouponRule;

  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) return { valid: false, reason: "Coupon expired" };
  if (coupon.minSpend && cartTotal < coupon.minSpend) return { valid: false, reason: `Minimum spend of UGX ${coupon.minSpend.toLocaleString()} required` };

  if (coupon.maxUsesTotal) {
    const totalUses = await pool.query(`SELECT COUNT(*) FROM olimart_coupon_redemptions WHERE code = $1`, [code]);
    if (Number(totalUses.rows[0].count) >= coupon.maxUsesTotal) return { valid: false, reason: "Coupon has reached its usage limit" };
  }
  if (coupon.maxUsesPerCustomer) {
    const customerUses = await pool.query(`SELECT COUNT(*) FROM olimart_coupon_redemptions WHERE code = $1 AND customer_id = $2`, [code, customerId]);
    if (Number(customerUses.rows[0].count) >= coupon.maxUsesPerCustomer) return { valid: false, reason: "You have already used this coupon the maximum number of times" };
  }

  if (coupon.type === "free_shipping") return { valid: true, freeShipping: true, discount: 0, coupon };
  const discount = coupon.type === "percentage" ? Math.round(cartTotal * (coupon.value / 100)) : coupon.value;
  return { valid: true, discount: Math.min(discount, cartTotal), coupon };
}

export async function recordCouponRedemption(pool: pg.Pool, code: string, customerId: string, orderId: string) {
  await pool.query(
    `INSERT INTO olimart_coupon_redemptions (code, customer_id, order_id) VALUES ($1,$2,$3)`,
    [code, customerId, orderId]
  );
}

// ---------------------------------------------------------------------------
// Wishlist
// ---------------------------------------------------------------------------
export async function addToWishlist(pool: pg.Pool, customerId: string, productId: string) {
  await pool.query(
    `INSERT INTO olimart_wishlists (customer_id, product_id) VALUES ($1,$2) ON CONFLICT (customer_id, product_id) DO NOTHING`,
    [customerId, productId]
  );
}
export async function removeFromWishlist(pool: pg.Pool, customerId: string, productId: string) {
  await pool.query(`DELETE FROM olimart_wishlists WHERE customer_id = $1 AND product_id = $2`, [customerId, productId]);
}
export async function getWishlist(pool: pg.Pool, customerId: string): Promise<string[]> {
  const result = await pool.query(`SELECT product_id FROM olimart_wishlists WHERE customer_id = $1`, [customerId]);
  return result.rows.map((r) => r.product_id);
}

// ---------------------------------------------------------------------------
// Back-in-stock alerts — a customer subscribes to an out-of-stock product;
// when a vendor/admin restocks it, everyone subscribed gets a real SMS/email
// (not a "notify me" button that does nothing).
// ---------------------------------------------------------------------------
export async function subscribeBackInStock(pool: pg.Pool, customerId: string, customerPhone: string, productId: string) {
  await pool.query(
    `INSERT INTO olimart_stock_alerts (customer_id, customer_phone, product_id, notified) VALUES ($1,$2,$3,FALSE)
     ON CONFLICT (customer_id, product_id) DO NOTHING`,
    [customerId, customerPhone, productId]
  );
}

export async function notifyBackInStock(pool: pg.Pool, productId: string, productTitle: string) {
  const subs = await pool.query(`SELECT customer_phone FROM olimart_stock_alerts WHERE product_id = $1 AND notified = FALSE`, [productId]);
  for (const row of subs.rows) {
    await dispatch(pool, { channel: "sms", to: row.customer_phone, message: `Olimart: "${productTitle}" is back in stock! Order now before it sells out again.`, eventType: "back_in_stock" });
  }
  await pool.query(`UPDATE olimart_stock_alerts SET notified = TRUE WHERE product_id = $1`, [productId]);
}

// ---------------------------------------------------------------------------
// Loyalty points — an immutable ledger, same design principle as the vendor
// commission ledger: points are never a mutable column that can drift, only
// SUM()'d from signed entries. 1 point per UGX 1,000 spent, earned only once
// an order is actually delivered (not just placed).
// ---------------------------------------------------------------------------
const POINTS_PER_UGX = 1 / 1000;

export async function creditLoyaltyPoints(pool: pg.Pool, customerId: string, orderId: string, orderTotal: number) {
  const points = Math.floor(orderTotal * POINTS_PER_UGX);
  if (points <= 0) return 0;
  await pool.query(
    `INSERT INTO olimart_loyalty_ledger (id, customer_id, type, points, order_id) VALUES ($1,$2,'earned',$3,$4)`,
    [`pts-${Date.now()}-${crypto.randomUUID().slice(0, 6)}`, customerId, points, orderId]
  );
  return points;
}

export async function redeemLoyaltyPoints(pool: pg.Pool, customerId: string, points: number, orderId: string) {
  const balance = await getLoyaltyBalance(pool, customerId);
  if (points > balance) throw new Error("Insufficient loyalty points");
  await pool.query(
    `INSERT INTO olimart_loyalty_ledger (id, customer_id, type, points, order_id) VALUES ($1,$2,'redeemed',$3,$4)`,
    [`pts-${Date.now()}-${crypto.randomUUID().slice(0, 6)}`, customerId, points, orderId]
  );
}

export async function getLoyaltyBalance(pool: pg.Pool, customerId: string): Promise<number> {
  const result = await pool.query(
    `SELECT type, COALESCE(SUM(points),0) AS total FROM olimart_loyalty_ledger WHERE customer_id = $1 GROUP BY type`,
    [customerId]
  );
  let earned = 0, redeemed = 0;
  for (const row of result.rows) {
    if (row.type === "earned") earned += Number(row.total);
    if (row.type === "redeemed") redeemed += Number(row.total);
  }
  return earned - redeemed;
}

// ---------------------------------------------------------------------------
// Abandoned cart recovery — the frontend snapshots the cart on every change;
// a scheduled job (or an admin-triggered sweep) finds carts idle past the
// threshold with no completed order and sends one real reminder.
// ---------------------------------------------------------------------------
export async function saveCartSnapshot(pool: pg.Pool, customerId: string, customerPhone: string, items: unknown[]) {
  await pool.query(
    `INSERT INTO olimart_cart_snapshots (customer_id, customer_phone, items, updated_at) VALUES ($1,$2,$3,NOW())
     ON CONFLICT (customer_id) DO UPDATE SET customer_phone = EXCLUDED.customer_phone, items = EXCLUDED.items, updated_at = NOW(), reminder_sent_at = NULL`,
    [customerId, customerPhone, JSON.stringify(items)]
  );
}

export async function sweepAbandonedCarts(pool: pg.Pool, idleMinutes = 60): Promise<number> {
  const idle = await pool.query(
    `SELECT * FROM olimart_cart_snapshots
     WHERE updated_at < NOW() - INTERVAL '${idleMinutes} minutes'
       AND reminder_sent_at IS NULL
       AND jsonb_array_length(items) > 0`
  );
  for (const cart of idle.rows) {
    await dispatch(pool, {
      channel: "sms",
      to: cart.customer_phone,
      message: `Olimart: You left items in your cart! Complete your order before they sell out.`,
      eventType: "cart_abandoned",
    });
    await pool.query(`UPDATE olimart_cart_snapshots SET reminder_sent_at = NOW() WHERE customer_id = $1`, [cart.customer_id]);
  }
  return idle.rows.length;
}

// ---------------------------------------------------------------------------
// Deposits / partial payments
// ---------------------------------------------------------------------------
export async function recordPartialPayment(pool: pg.Pool, orderId: string, amountPaid: number) {
  const result = await pool.query(
    `UPDATE olimart_orders_v2 SET amount_paid = COALESCE(amount_paid,0) + $1,
     payment_status = CASE WHEN COALESCE(amount_paid,0) + $1 >= grand_total THEN 'paid' ELSE 'partial' END
     WHERE id = $2 RETURNING grand_total, amount_paid, payment_status`,
    [amountPaid, orderId]
  );
  if (!result.rows.length) throw new Error("Order not found");
  const row = result.rows[0];
  return { balanceDue: Number(row.grand_total) - Number(row.amount_paid), status: row.payment_status };
}

export const COMMERCE_ENGINE_TABLE_SQL = `
  ALTER TABLE olimart_orders_v2 ADD COLUMN IF NOT EXISTS amount_paid NUMERIC DEFAULT 0;

  CREATE TABLE IF NOT EXISTS olimart_coupon_redemptions (
    id SERIAL PRIMARY KEY,
    code VARCHAR(100) NOT NULL,
    customer_id VARCHAR(100) NOT NULL,
    order_id VARCHAR(100),
    redeemed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS olimart_wishlists (
    customer_id VARCHAR(100) NOT NULL,
    product_id VARCHAR(100) NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (customer_id, product_id)
  );

  CREATE TABLE IF NOT EXISTS olimart_stock_alerts (
    customer_id VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(100) NOT NULL,
    product_id VARCHAR(100) NOT NULL,
    notified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (customer_id, product_id)
  );

  CREATE TABLE IF NOT EXISTS olimart_loyalty_ledger (
    id VARCHAR(100) PRIMARY KEY,
    customer_id VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('earned','redeemed')),
    points INTEGER NOT NULL,
    order_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS idx_loyalty_customer ON olimart_loyalty_ledger(customer_id);

  CREATE TABLE IF NOT EXISTS olimart_cart_snapshots (
    customer_id VARCHAR(100) PRIMARY KEY,
    customer_phone VARCHAR(100) NOT NULL,
    items JSONB NOT NULL DEFAULT '[]',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reminder_sent_at TIMESTAMP
  );
`;
