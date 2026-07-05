// ============================================================================
// Shipping Rules — Dokan Pro's "Shipping by Vendor" + WooCommerce Shipping
// Zones: each vendor defines their own delivery fee per zone (district or
// region in the Uganda context), with an optional free-shipping threshold.
// Resolved server-side at checkout, never trusted from the client cart.
// ============================================================================
import type pg from "pg";
import crypto from "crypto";

export interface ShippingRule {
  id: string;
  vendorId: string;
  zoneName: string;        // e.g. "Kampala", "Wakiso", "Upcountry"
  fee: number;              // flat fee in UGX
  freeShippingThreshold?: number; // order subtotal (from this vendor) above which shipping is free
  estimatedDays: number;
}

export const SHIPPING_RULES_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS olimart_shipping_rules (
    id VARCHAR(100) PRIMARY KEY,
    vendor_id VARCHAR(100) NOT NULL REFERENCES olimart_vendors(id) ON DELETE CASCADE,
    zone_name VARCHAR(100) NOT NULL,
    fee NUMERIC NOT NULL,
    free_shipping_threshold NUMERIC,
    estimated_days INTEGER NOT NULL DEFAULT 2,
    UNIQUE (vendor_id, zone_name)
  );
`;

export async function setShippingRule(pool: pg.Pool, rule: Omit<ShippingRule, "id">): Promise<string> {
  const id = `ship-${Date.now()}-${crypto.randomUUID().slice(0, 6)}`;
  await pool.query(
    `INSERT INTO olimart_shipping_rules (id, vendor_id, zone_name, fee, free_shipping_threshold, estimated_days)
     VALUES ($1,$2,$3,$4,$5,$6)
     ON CONFLICT (vendor_id, zone_name) DO UPDATE SET fee = EXCLUDED.fee,
       free_shipping_threshold = EXCLUDED.free_shipping_threshold, estimated_days = EXCLUDED.estimated_days
     RETURNING id`,
    [id, rule.vendorId, rule.zoneName, rule.fee, rule.freeShippingThreshold ?? null, rule.estimatedDays]
  );
  return id;
}

export async function getShippingRulesForVendor(pool: pg.Pool, vendorId: string): Promise<ShippingRule[]> {
  const result = await pool.query("SELECT * FROM olimart_shipping_rules WHERE vendor_id = $1 ORDER BY zone_name", [vendorId]);
  return result.rows.map((r) => ({
    id: r.id, vendorId: r.vendor_id, zoneName: r.zone_name, fee: Number(r.fee),
    freeShippingThreshold: r.free_shipping_threshold ? Number(r.free_shipping_threshold) : undefined,
    estimatedDays: r.estimated_days,
  }));
}

/** Resolves the real shipping fee for one vendor's line items in a cart, server-side. */
export async function resolveShippingFee(pool: pg.Pool, vendorId: string, zoneName: string, vendorSubtotal: number): Promise<{ fee: number; estimatedDays: number }> {
  const result = await pool.query(
    "SELECT * FROM olimart_shipping_rules WHERE vendor_id = $1 AND zone_name = $2",
    [vendorId, zoneName]
  );
  if (!result.rows.length) return { fee: 0, estimatedDays: 3 }; // no rule configured -> free (vendor hasn't set one up yet)
  const rule = result.rows[0];
  const free = rule.free_shipping_threshold && vendorSubtotal >= Number(rule.free_shipping_threshold);
  return { fee: free ? 0 : Number(rule.fee), estimatedDays: rule.estimated_days };
}
