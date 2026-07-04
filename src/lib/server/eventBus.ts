// ============================================================================
// Event Bus — the "what happens between the vendor, the customer, the rider
// and the admin" layer.
//
// Every meaningful thing that happens on the platform (order placed, vendor
// confirms, rider assigned, item picked up, delivered, cancelled, product
// changed, payout released, registration submitted...) is emitted as one
// EVENT here. One event write fans out to:
//   1. olimart_events        — permanent, queryable event log (admin monitoring feed)
//   2. olimart_notifications — real SMS/WhatsApp/Email to the humans who need to know
//   3. olimart_admin_logs    — a human-readable admin timeline entry
//
// This mirrors how Jumia (and every serious multi-vendor marketplace) works
// under the hood: nobody polls for status — the order-service publishes an
// event, and every interested party (seller center, rider app, ops console,
// customer notifications) reacts to it independently. Nothing here is
// "simulated" — dispatch() always goes through notificationService, which
// truthfully reports sent/failed/not_configured.
// ============================================================================
import type pg from "pg";
import { dispatch } from "./notificationService";

export type OlimartEventType =
  | "order.placed"
  | "order.vendor_confirmed"
  | "order.packed"
  | "order.rider_assigned"
  | "order.picked_up"
  | "order.out_for_delivery"
  | "order.delivered"
  | "order.cancelled"
  | "order.return_requested"
  | "order.returned"
  | "payment.captured"
  | "payout.requested"
  | "payout.approved"
  | "product.created"
  | "product.updated"
  | "product.removed"
  | "vendor.registered"
  | "vendor.approved"
  | "rider.registered"
  | "rider.approved"
  | "customer.registered"
  | "settlement_account.updated";

export interface OlimartEvent {
  type: OlimartEventType;
  actorId?: string;          // who caused it (user id / vendor id / rider id)
  actorRole?: string;
  orderId?: string;
  orderItemId?: string;
  vendorId?: string;
  riderId?: string;
  customerPhone?: string;
  customerEmail?: string;
  vendorPhone?: string;
  vendorEmail?: string;
  riderPhone?: string;
  payload?: Record<string, unknown>;
}

export const EVENT_LOG_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS olimart_events (
    id VARCHAR(100) PRIMARY KEY,
    type VARCHAR(80) NOT NULL,
    actor_id VARCHAR(100),
    actor_role VARCHAR(50),
    order_id VARCHAR(100),
    order_item_id VARCHAR(100),
    vendor_id VARCHAR(100),
    rider_id VARCHAR(100),
    payload JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS idx_olimart_events_order ON olimart_events(order_id);
  CREATE INDEX IF NOT EXISTS idx_olimart_events_type ON olimart_events(type);
`;

// Who gets told what, in plain language, for each event. The admin ALWAYS
// gets an entry (that's the "every change on the system is monitored by the
// admin" requirement) — the block below only decides who else is notified
// and what they're told.
function buildRecipientMessages(evt: OlimartEvent): Array<{ to: string; channel: "sms" | "email"; message: string; subject?: string }> {
  const out: Array<{ to: string; channel: "sms" | "email"; message: string; subject?: string }> = [];
  const orderRef = evt.orderId ? `order #${evt.orderId}` : "your order";

  switch (evt.type) {
    case "order.placed":
      if (evt.customerPhone) out.push({ to: evt.customerPhone, channel: "sms", message: `Olimart: We've received ${orderRef} and notified the seller. You'll get an SMS at every stage.` });
      if (evt.vendorPhone) out.push({ to: evt.vendorPhone, channel: "sms", message: `Olimart: New order for ${orderRef}. Please confirm or reject within 24 hours from your Seller Center.` });
      break;
    case "order.vendor_confirmed":
      if (evt.customerPhone) out.push({ to: evt.customerPhone, channel: "sms", message: `Olimart: The seller confirmed ${orderRef} and is preparing it for dispatch.` });
      break;
    case "order.rider_assigned":
      if (evt.customerPhone) out.push({ to: evt.customerPhone, channel: "sms", message: `Olimart: A rider has been assigned to deliver ${orderRef}.` });
      if (evt.riderPhone) out.push({ to: evt.riderPhone, channel: "sms", message: `Olimart: You've been assigned ${orderRef}. Check the Rider App for pickup details.` });
      break;
    case "order.picked_up":
      if (evt.customerPhone) out.push({ to: evt.customerPhone, channel: "sms", message: `Olimart: Your package for ${orderRef} has been picked up from the seller.` });
      break;
    case "order.out_for_delivery":
      if (evt.customerPhone) out.push({ to: evt.customerPhone, channel: "sms", message: `Olimart: ${orderRef} is out for delivery. Your rider will contact you shortly.` });
      break;
    case "order.delivered":
      if (evt.customerPhone) out.push({ to: evt.customerPhone, channel: "sms", message: `Olimart: ${orderRef} has been delivered. Thank you for shopping with us!` });
      if (evt.vendorPhone) out.push({ to: evt.vendorPhone, channel: "sms", message: `Olimart: ${orderRef} was delivered and confirmed. Your earnings have been credited to your seller balance.` });
      break;
    case "order.cancelled":
      if (evt.customerPhone) out.push({ to: evt.customerPhone, channel: "sms", message: `Olimart: ${orderRef} was cancelled.` });
      if (evt.vendorPhone) out.push({ to: evt.vendorPhone, channel: "sms", message: `Olimart: ${orderRef} was cancelled.` });
      break;
    case "vendor.registered":
      if (evt.vendorEmail) out.push({ to: evt.vendorEmail, channel: "email", subject: "Olimart Seller Application Received", message: `Thanks for applying to sell on Olimart. Our team is reviewing your business details and will notify you once approved.` });
      break;
    case "vendor.approved":
      if (evt.vendorPhone) out.push({ to: evt.vendorPhone, channel: "sms", message: `Olimart: Congratulations — your seller account has been approved. You can now list products.` });
      break;
    case "rider.approved":
      if (evt.riderPhone) out.push({ to: evt.riderPhone, channel: "sms", message: `Olimart: Your rider application has been approved. You can now accept deliveries.` });
      break;
  }
  return out;
}

/**
 * emitEvent — call this at every step of the order lifecycle (and at every
 * registration, product-moderation, and payout action). It:
 *   1. Writes an immutable row to olimart_events (the admin's live monitoring feed).
 *   2. Notifies whichever of customer/vendor/rider is relevant, over real
 *      SMS/email channels (never simulated).
 *   3. Writes a plain-English line to olimart_admin_logs so admins have a
 *      human-readable timeline, not just raw JSON.
 */
export async function emitEvent(pool: pg.Pool | null, evt: OlimartEvent): Promise<void> {
  const id = `evt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  if (pool) {
    try {
      await pool.query(
        `INSERT INTO olimart_events (id, type, actor_id, actor_role, order_id, order_item_id, vendor_id, rider_id, payload)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [id, evt.type, evt.actorId || null, evt.actorRole || null, evt.orderId || null, evt.orderItemId || null,
          evt.vendorId || null, evt.riderId || null, JSON.stringify(evt.payload || {})]
      );
    } catch (err) {
      console.error("Failed to write event log row:", err);
    }
  }

  // Fan out real notifications to the humans who need to act or be informed.
  const recipients = buildRecipientMessages(evt);
  for (const r of recipients) {
    await dispatch(pool, { channel: r.channel, to: r.to, message: r.message, subject: r.subject, eventType: evt.type });
  }

  // Admin always sees a plain-English timeline entry — this is what makes
  // "every change on the system monitored by the admin" true rather than
  // aspirational.
  if (pool) {
    try {
      await pool.query(
        `INSERT INTO olimart_admin_logs (id, data) VALUES ($1, $2)`,
        [
          `log-${id}`,
          JSON.stringify({
            timestamp: new Date().toISOString(),
            type: evt.type,
            actorId: evt.actorId,
            actorRole: evt.actorRole,
            orderId: evt.orderId,
            orderItemId: evt.orderItemId,
            vendorId: evt.vendorId,
            riderId: evt.riderId,
            summary: describeEvent(evt),
          }),
        ]
      );
    } catch (err) {
      console.error("Failed to write admin timeline entry:", err);
    }
  }
}

function describeEvent(evt: OlimartEvent): string {
  switch (evt.type) {
    case "order.placed": return `Customer placed order ${evt.orderId}.`;
    case "order.vendor_confirmed": return `Vendor ${evt.vendorId} confirmed order item ${evt.orderItemId}.`;
    case "order.rider_assigned": return `Rider ${evt.riderId} assigned to order item ${evt.orderItemId}.`;
    case "order.picked_up": return `Rider ${evt.riderId} picked up order item ${evt.orderItemId}.`;
    case "order.out_for_delivery": return `Order item ${evt.orderItemId} is out for delivery.`;
    case "order.delivered": return `Order item ${evt.orderItemId} delivered and confirmed.`;
    case "order.cancelled": return `Order item ${evt.orderItemId} cancelled.`;
    case "product.created": return `Product created (actor ${evt.actorId}).`;
    case "product.updated": return `Product updated (actor ${evt.actorId}).`;
    case "product.removed": return `Product removed by admin (actor ${evt.actorId}).`;
    case "vendor.registered": return `New vendor application: ${evt.vendorId}.`;
    case "vendor.approved": return `Vendor ${evt.vendorId} approved.`;
    case "rider.registered": return `New rider application: ${evt.riderId}.`;
    case "rider.approved": return `Rider ${evt.riderId} approved.`;
    case "customer.registered": return `New customer registered: ${evt.actorId}.`;
    case "settlement_account.updated": return `Platform settlement account updated by ${evt.actorId}.`;
    default: return `${evt.type}`;
  }
}
