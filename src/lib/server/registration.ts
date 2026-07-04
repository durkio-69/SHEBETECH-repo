// ============================================================================
// Registration — "the registration for each stakeholder should be unique and
// each should disclose the relevant info stated in the system."
//
// Customers, vendors, riders, and admins are NOT one generic sign-up form.
// Each has its own disclosure requirements, matching what a real Uganda
// e-commerce marketplace (Jumia UG included) actually asks for at KYC time.
// This module is the single source of truth for "what must this stakeholder
// tell us before they can transact" — server.ts's /api/auth/register/:role
// routes call validateRegistration() before writing anything to the DB.
// ============================================================================
import crypto from "crypto";
import type pg from "pg";

export type StakeholderRole = "customer" | "vendor" | "rider";

// The disclosure contract per role. Anything in `required` must be present
// and non-empty or registration is rejected with the specific missing
// fields — never a generic "invalid form" error.
export const REGISTRATION_SCHEMA: Record<StakeholderRole, { required: string[]; optional: string[]; description: string }> = {
  customer: {
    required: ["name", "phone", "password"],
    optional: ["email", "deliveryAddress"],
    description: "Shoppers disclose only identity + contact info needed to place and track orders.",
  },
  vendor: {
    required: [
      "businessName", "ownerName", "email", "phone", "location", "category",
      "nationalIdNumber", "payoutMethod", "payoutAccountNumber",
    ],
    optional: ["businessSpecifications", "storeLogo", "tinNumber"],
    description:
      "Sellers disclose full business identity (who legally owns the store, where it operates, what it sells) " +
      "plus the exact account commissions will be paid out to — because Olimart is handling their money.",
  },
  rider: {
    required: ["name", "phone", "email", "idCardNumber", "drivingPermitNumber", "transportMeans", "location"],
    optional: ["motorcyclePlate", "pictureUrl", "helmetOrHub", "cargoVolume", "licenseTonnage"],
    description:
      "Riders disclose verifiable identity documents (national ID, driving permit) because they are trusted " +
      "with customers' goods and, at delivery, with confirming payment collection.",
  },
};

export interface ValidationResult {
  valid: boolean;
  missing: string[];
}

export function validateRegistration(role: StakeholderRole, body: Record<string, unknown>): ValidationResult {
  const schema = REGISTRATION_SCHEMA[role];
  const missing = schema.required.filter((field) => {
    const v = body[field];
    return v === undefined || v === null || String(v).trim() === "";
  });
  return { valid: missing.length === 0, missing };
}

// Simple, dependency-free password hashing (PBKDF2). Swap for bcrypt/argon2
// in production if you want — the important part architecturally is that a
// password is never stored or compared in plaintext.
export function hashPassword(password: string, salt = crypto.randomBytes(16).toString("hex")): string {
  const hash = crypto.pbkdf2Sync(password, salt, 100_000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = crypto.pbkdf2Sync(password, salt, 100_000, 64, "sha512").toString("hex");
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(candidate, "hex"));
}

/** Uniqueness check — a phone or email can only ever back ONE account, full stop. */
export async function isEmailOrPhoneTaken(pool: pg.Pool, email?: string, phone?: string): Promise<boolean> {
  if (!email && !phone) return false;
  const result = await pool.query(
    `SELECT id FROM olimart_users WHERE ($1::text IS NOT NULL AND email = $1) OR ($2::text IS NOT NULL AND phone = $2) LIMIT 1`,
    [email || null, phone || null]
  );
  return result.rows.length > 0;
}
