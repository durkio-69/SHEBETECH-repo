// ============================================================================
// Order State Machine — replaces the free-text `status` string that any
// screen could set to anything. Each vendor sub-order moves through a
// fixed sequence, exactly like Amazon splits a multi-seller cart into
// per-seller shipments with independently tracked statuses.
// ============================================================================

export type OrderItemStatus =
  | "placed"
  | "vendor_confirmed"
  | "packed"
  | "assigned_to_rider"
  | "picked_up"
  | "out_for_delivery"
  | "delivered"
  | "cancelled"
  | "return_requested"
  | "returned";

// Allowed forward transitions. "cancelled" is reachable from any
// pre-delivery state (customers/vendors can cancel before it ships).
const TRANSITIONS: Record<OrderItemStatus, OrderItemStatus[]> = {
  placed: ["vendor_confirmed", "cancelled"],
  vendor_confirmed: ["packed", "cancelled"],
  packed: ["assigned_to_rider", "cancelled"],
  assigned_to_rider: ["picked_up", "cancelled"],
  picked_up: ["out_for_delivery", "cancelled"],
  out_for_delivery: ["delivered", "cancelled"],
  delivered: ["return_requested"],
  return_requested: ["returned"],
  returned: [],
  cancelled: [],
};

export class InvalidTransitionError extends Error {
  constructor(from: OrderItemStatus, to: OrderItemStatus) {
    super(`Cannot move order item from "${from}" to "${to}"`);
    this.name = "InvalidTransitionError";
  }
}

export function canTransition(from: OrderItemStatus, to: OrderItemStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransition(from: OrderItemStatus, to: OrderItemStatus): void {
  if (!canTransition(from, to)) throw new InvalidTransitionError(from, to);
}

// "delivered" additionally requires proof — either a matching OTP the rider
// collected from the customer, or an uploaded photo reference. This is what
// stops a store/rider from just self-declaring an order delivered.
export interface DeliveryProof {
  method: "otp" | "photo";
  otpVerified?: boolean;
  photoUrl?: string;
}

export function canMarkDelivered(proof: DeliveryProof): boolean {
  if (proof.method === "otp") return proof.otpVerified === true;
  if (proof.method === "photo") return !!proof.photoUrl;
  return false;
}

export const ORDER_TABLES_SQL = `
  -- One row per customer checkout (payment + shipping address level info)
  CREATE TABLE IF NOT EXISTS olimart_orders_v2 (
    id VARCHAR(100) PRIMARY KEY,
    customer_id VARCHAR(100),
    customer_name VARCHAR(255),
    customer_phone VARCHAR(100),
    delivery_address TEXT,
    payment_method VARCHAR(50),
    payment_status VARCHAR(50) DEFAULT 'pending', -- pending | paid | failed | refunded
    grand_total NUMERIC NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- One row per vendor "sub-order" within a checkout — this is the unit
  -- that actually has a fulfillment status, mirroring Amazon's per-seller
  -- shipment split.
  CREATE TABLE IF NOT EXISTS olimart_order_items (
    id VARCHAR(100) PRIMARY KEY,
    order_id VARCHAR(100) NOT NULL REFERENCES olimart_orders_v2(id) ON DELETE CASCADE,
    vendor_id VARCHAR(100) NOT NULL REFERENCES olimart_vendors(id),
    product_id VARCHAR(100) NOT NULL,
    product_title VARCHAR(255),
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price NUMERIC NOT NULL,
    commission_rate NUMERIC NOT NULL,      -- resolved rate at time of sale, e.g. 0.15
    status VARCHAR(50) NOT NULL DEFAULT 'placed',
    rider_id VARCHAR(100) REFERENCES olimart_riders(id),
    delivery_otp_hash VARCHAR(255),
    delivery_proof_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- Full audit trail: who moved this sub-order from one status to another
  CREATE TABLE IF NOT EXISTS olimart_order_status_history (
    id SERIAL PRIMARY KEY,
    order_item_id VARCHAR(100) NOT NULL REFERENCES olimart_order_items(id) ON DELETE CASCADE,
    from_status VARCHAR(50),
    to_status VARCHAR(50) NOT NULL,
    changed_by VARCHAR(100),
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`;
