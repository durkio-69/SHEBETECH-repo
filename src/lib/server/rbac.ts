// ============================================================================
// Role-Based Access Control (RBAC)
// Replaces the single implicit "admin" with real least-privilege roles,
// the way Amazon Seller Central / Ops separates Catalog, Finance, and
// Trust & Safety teams instead of one god-mode account.
// ============================================================================
import type { Request, Response, NextFunction } from "express";
import type pg from "pg";

export type Role =
  | "super_admin"
  | "ops_admin"
  | "finance_admin"
  | "catalog_admin"
  | "support_admin"
  | "vendor_owner"
  | "vendor_staff"
  | "rider"
  | "customer";

// What each role is allowed to do. Kept as a static capability map so
// permission checks are explicit and auditable, not scattered ad-hoc
// `if (isAdmin)` checks across the codebase.
export const ROLE_PERMISSIONS: Record<Role, string[]> = {
  super_admin: ["*"],
  ops_admin: [
    "vendor.approve", "vendor.reject", "rider.approve", "rider.reject",
    "category.manage", "order.view.all", "order.escalate", "audit.view",
  ],
  finance_admin: [
    "payout.approve", "payout.reject", "transaction.view.all",
    "commission.manage", "order.view.all", "settlement.manage", "audit.view",
  ],
  catalog_admin: [
    "product.moderate", "product.remove", "coupon.manage", "audit.view",
  ],
  support_admin: [
    "order.view.all", "refund.manage", "vendor.contact", "customer.contact", "audit.view",
  ],
  vendor_owner: ["store.manage.own", "product.manage.own", "order.view.own", "payout.request.own"],
  vendor_staff: ["order.view.own", "product.manage.own"],
  rider: ["delivery.view.own", "delivery.update.own"],
  customer: ["order.view.self", "order.place"],
};

export interface AuthedRequest extends Request {
  auth?: {
    userId: string;
    role: Role;
    vendorId?: string;
    riderId?: string;
  };
}

export function hasPermission(role: Role, permission: string): boolean {
  const perms = ROLE_PERMISSIONS[role] || [];
  return perms.includes("*") || perms.includes(permission);
}

/**
 * Express middleware factory. Usage:
 *   app.post("/api/admin/vendors/:id/approve", requirePermission("vendor.approve"), handler)
 *
 * Reads the identity attached by `attachAuth` (below) — a real deployment
 * should replace the token decoding in `attachAuth` with proper session/JWT
 * validation, but the important architectural fix is that every sensitive
 * route now runs through *some* server-side permission check instead of
 * trusting whatever the React admin UI decided to render.
 */
export function requirePermission(permission: string) {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    const auth = req.auth;
    if (!auth) return res.status(401).json({ error: "Not authenticated" });
    if (!hasPermission(auth.role, permission)) {
      return res.status(403).json({ error: `Missing permission: ${permission}` });
    }
    next();
  };
}

/** Vendors/riders may only act on their own resources unless they're an admin role. */
export function requireOwnResourceOrAdmin(getResourceOwnerId: (req: Request) => string) {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    const auth = req.auth;
    if (!auth) return res.status(401).json({ error: "Not authenticated" });
    if (hasPermission(auth.role, "*") || auth.role.endsWith("_admin")) return next();
    const ownerId = getResourceOwnerId(req);
    if (auth.vendorId === ownerId || auth.riderId === ownerId || auth.userId === ownerId) return next();
    return res.status(403).json({ error: "Not your resource" });
  };
}

/**
 * Minimal auth attachment. Expects `Authorization: Bearer <token>` where the
 * token is a session id issued at login and looked up in `sessions`.
 * Swap this for real JWT/session validation in production — the point of
 * this file is establishing *that a check happens at all*, server-side.
 */
export function attachAuth(pool: pg.Pool | null) {
  return async (req: AuthedRequest, _res: Response, next: NextFunction) => {
    try {
      const header = req.header("authorization") || "";
      const token = header.startsWith("Bearer ") ? header.slice(7) : null;
      if (!token || !pool) return next();
      const result = await pool.query(
        `SELECT s.user_id, u.role, u.vendor_id, u.rider_id
         FROM olimart_sessions s JOIN olimart_users u ON u.id = s.user_id
         WHERE s.token = $1 AND s.expires_at > NOW()`,
        [token]
      );
      if (result.rows.length) {
        const row = result.rows[0];
        req.auth = { userId: row.user_id, role: row.role, vendorId: row.vendor_id, riderId: row.rider_id };
      }
    } catch (err) {
      console.error("attachAuth failed:", err);
    }
    next();
  };
}

export const ROLES_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS olimart_users (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(100),
    password_hash TEXT,
    role VARCHAR(50) NOT NULL DEFAULT 'customer',
    vendor_id VARCHAR(100) REFERENCES olimart_vendors(id) ON DELETE SET NULL,
    rider_id VARCHAR(100) REFERENCES olimart_riders(id) ON DELETE SET NULL,
    is_phone_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS olimart_sessions (
    token VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL REFERENCES olimart_users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL
  );
`;
