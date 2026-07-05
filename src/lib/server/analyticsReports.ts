// ============================================================================
// Analytics & Reports — Dokan Pro's vendor Sales/Orders/Withdrawals
// dashboard, and WooCommerce's admin Reports screen. Every number here is
// derived live from the same ledger, order, and product tables the rest of
// the platform writes to — nothing is a separately-maintained counter that
// can drift out of sync.
// ============================================================================
import type pg from "pg";

export interface VendorDashboardStats {
  totalSales: number;
  totalOrders: number;
  pendingOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  availableBalance: number;
  totalEarned: number;
  totalPaidOut: number;
  pendingWithdrawals: number;
  averageRating: number;
  reviewCount: number;
}

export async function getVendorDashboard(pool: pg.Pool, vendorId: string): Promise<VendorDashboardStats> {
  const [orderStats, ledgerStats, withdrawalStats, ratingStats] = await Promise.all([
    pool.query(
      `SELECT
         COUNT(*) AS total_orders,
         COUNT(*) FILTER (WHERE status IN ('placed','vendor_confirmed','packed','assigned_to_rider','picked_up','out_for_delivery')) AS pending_orders,
         COUNT(*) FILTER (WHERE status = 'delivered') AS delivered_orders,
         COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled_orders,
         COALESCE(SUM(unit_price * quantity) FILTER (WHERE status = 'delivered'), 0) AS total_sales
       FROM olimart_order_items WHERE vendor_id = $1`,
      [vendorId]
    ),
    pool.query(
      `SELECT type, COALESCE(SUM(amount),0) AS total FROM olimart_transactions WHERE vendor_id = $1 GROUP BY type`,
      [vendorId]
    ),
    pool.query(
      `SELECT COALESCE(SUM(amount),0) AS total FROM olimart_withdrawal_requests WHERE vendor_id = $1 AND status = 'pending'`,
      [vendorId]
    ),
    pool.query(
      `SELECT COALESCE(AVG(rating),0) AS average, COUNT(*) AS count FROM olimart_store_reviews WHERE vendor_id = $1`,
      [vendorId]
    ),
  ]);

  let totalEarned = 0, totalPaidOut = 0, totalReversed = 0;
  for (const row of ledgerStats.rows) {
    if (row.type === "sale_credit") totalEarned += Number(row.total);
    if (row.type === "payout_debit") totalPaidOut += Number(row.total);
    if (row.type === "refund_reversal") totalReversed += Number(row.total);
  }

  const o = orderStats.rows[0];
  return {
    totalSales: Number(o.total_sales),
    totalOrders: Number(o.total_orders),
    pendingOrders: Number(o.pending_orders),
    deliveredOrders: Number(o.delivered_orders),
    cancelledOrders: Number(o.cancelled_orders),
    availableBalance: totalEarned - totalPaidOut - totalReversed,
    totalEarned,
    totalPaidOut,
    pendingWithdrawals: Number(withdrawalStats.rows[0].total),
    averageRating: Number(ratingStats.rows[0].average),
    reviewCount: Number(ratingStats.rows[0].count),
  };
}

export interface PlatformReport {
  gmv: number;               // gross merchandise value, delivered orders only
  platformCommissionEarned: number;
  totalVendors: number;
  activeVendors: number;     // placed at least one delivered order
  totalOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  refundedAmount: number;
  topVendorsBySales: Array<{ vendorId: string; sales: number }>;
}

export async function getPlatformReport(pool: pg.Pool, sinceDays = 30): Promise<PlatformReport> {
  const [gmvRow, commissionRow, vendorCounts, orderCounts, refundRow, topVendors] = await Promise.all([
    pool.query(
      `SELECT COALESCE(SUM(unit_price * quantity),0) AS gmv FROM olimart_order_items
       WHERE status = 'delivered' AND updated_at > NOW() - INTERVAL '${sinceDays} days'`
    ),
    pool.query(
      `SELECT COALESCE(SUM(amount),0) AS total FROM olimart_transactions
       WHERE type = 'commission_debit' AND created_at > NOW() - INTERVAL '${sinceDays} days'`
    ),
    pool.query(`SELECT COUNT(*) AS total FROM olimart_vendors WHERE status = 'approved'`),
    pool.query(
      `SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status = 'delivered') AS delivered, COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled
       FROM olimart_order_items WHERE created_at > NOW() - INTERVAL '${sinceDays} days'`
    ),
    pool.query(
      `SELECT COALESCE(SUM(amount),0) AS total FROM olimart_transactions
       WHERE type = 'refund_reversal' AND created_at > NOW() - INTERVAL '${sinceDays} days'`
    ),
    pool.query(
      `SELECT vendor_id, SUM(unit_price * quantity) AS sales FROM olimart_order_items
       WHERE status = 'delivered' AND updated_at > NOW() - INTERVAL '${sinceDays} days'
       GROUP BY vendor_id ORDER BY sales DESC LIMIT 10`
    ),
  ]);

  const activeVendors = await pool.query(
    `SELECT COUNT(DISTINCT vendor_id) AS total FROM olimart_order_items
     WHERE status = 'delivered' AND updated_at > NOW() - INTERVAL '${sinceDays} days'`
  );

  return {
    gmv: Number(gmvRow.rows[0].gmv),
    platformCommissionEarned: Number(commissionRow.rows[0].total),
    totalVendors: Number(vendorCounts.rows[0].total),
    activeVendors: Number(activeVendors.rows[0].total),
    totalOrders: Number(orderCounts.rows[0].total),
    deliveredOrders: Number(orderCounts.rows[0].delivered),
    cancelledOrders: Number(orderCounts.rows[0].cancelled),
    refundedAmount: Number(refundRow.rows[0].total),
    topVendorsBySales: topVendors.rows.map((r) => ({ vendorId: r.vendor_id, sales: Number(r.sales) })),
  };
}
