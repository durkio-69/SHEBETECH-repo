import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { fileURLToPath } from "url";
import { PRODUCTS } from "./src/data";
import pg from "pg";
import dotenv from "dotenv";
import crypto from "crypto";
import { ROLES_TABLE_SQL, attachAuth, requirePermission, requireOwnResourceOrAdmin, type AuthedRequest } from "./src/lib/server/rbac";
import { dispatch, generateOtp, hashOtp, OTP_TABLE_SQL } from "./src/lib/server/notificationService";
import { ORDER_TABLES_SQL, canTransition, canMarkDelivered, type OrderItemStatus } from "./src/lib/server/orderStateMachine";
import { TRANSACTIONS_TABLE_SQL, computeSaleSplit, writeLedgerEntries, getVendorBalance } from "./src/lib/server/commissionEngine";
import { EVENT_LOG_TABLE_SQL, emitEvent } from "./src/lib/server/eventBus";
import { AUDIT_TABLE_SQL, writeAudit, readAuditLog } from "./src/lib/server/auditLog";
import { REGISTRATION_SCHEMA, validateRegistration, hashPassword, verifyPassword, isEmailOrPhoneTaken, type StakeholderRole } from "./src/lib/server/registration";
import { getSettlementAccount, setSettlementAccount, type SettlementAccount } from "./src/lib/server/settlementAccounts";

// Load environment variables
dotenv.config();

const { Pool } = pg;

// Handle ES Module / CommonJS path resolution safely
const getFilename = () => {
  try {
    if (typeof import.meta !== "undefined" && import.meta.url) {
      return fileURLToPath(import.meta.url);
    }
  } catch (e) {
    // ignore
  }
  return typeof __filename !== "undefined" ? __filename : "";
};

const getDirname = () => {
  try {
    if (typeof import.meta !== "undefined" && import.meta.url) {
      return path.dirname(fileURLToPath(import.meta.url));
    }
  } catch (e) {
    // ignore
  }
  return typeof __dirname !== "undefined" ? __dirname : "";
};

const __filename = getFilename();
const __dirname = getDirname();

// Initialize Neon PostgreSQL Database Connection
const NEON_CONN = process.env.NEON_DATABASE_URL || "postgresql://neondb_owner:npg_HSLBzv9ym8bT@ep-blue-dream-athg991l-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

let pool: pg.Pool | null = null;
try {
  pool = new Pool({
    connectionString: NEON_CONN,
    ssl: { rejectUnauthorized: false } // Required for AWS-hosted Neon PostgreSQL
  });
  console.log("🟢 Neon PostgreSQL database pool successfully created.");
} catch (err) {
  console.error("🔴 Failed to initialize Neon database pool:", err);
}

// Database tables initialization
async function initDb() {
  if (!pool) {
    console.warn("⚠️ Database pool is null, skipping table initialization.");
    return;
  }
  try {
    const client = await pool.connect();
    console.log("⚡ Connected to Neon PostgreSQL. Checking/creating tables...");
    
    // Create vendors table
    await client.query(`
      CREATE TABLE IF NOT EXISTS olimart_vendors (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255),
        owner_name VARCHAR(255),
        email VARCHAR(255),
        phone VARCHAR(100),
        location VARCHAR(255),
        category VARCHAR(100),
        status VARCHAR(50),
        balance NUMERIC DEFAULT 0,
        total_sales NUMERIC DEFAULT 0,
        payment_details TEXT,
        business_name VARCHAR(255),
        store_logo TEXT,
        store_banner TEXT,
        business_specifications TEXT,
        bank_account_number VARCHAR(100),
        momo_number VARCHAR(100),
        paypal_account VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create riders/couriers table
    await client.query(`
      CREATE TABLE IF NOT EXISTS olimart_riders (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255),
        phone VARCHAR(100),
        email VARCHAR(255),
        id_card VARCHAR(100),
        driving_permit VARCHAR(100),
        picture_url TEXT,
        motorcycle_plate VARCHAR(100),
        location VARCHAR(255),
        completed_deliveries INTEGER DEFAULT 0,
        earnings NUMERIC DEFAULT 0,
        transport_means VARCHAR(100),
        helmet_or_hub VARCHAR(100),
        cargo_volume VARCHAR(100),
        license_tonnage VARCHAR(100),
        status VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create generic JSON-document tables for products, orders, comments, withdrawals.
    // These entities have rich/nested shapes on the frontend (items[], reviews[], vendors[], etc.)
    // so we store the full object as JSONB alongside a few indexed columns for querying.
    await client.query(`
      CREATE TABLE IF NOT EXISTS olimart_products (
        id VARCHAR(100) PRIMARY KEY,
        category VARCHAR(100),
        price NUMERIC,
        data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS olimart_orders (
        id VARCHAR(100) PRIMARY KEY,
        status VARCHAR(50),
        data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS olimart_comments (
        id VARCHAR(100) PRIMARY KEY,
        data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS olimart_withdrawals (
        id VARCHAR(100) PRIMARY KEY,
        status VARCHAR(50),
        data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Categories, admin logs, and notifications are also id-keyed JSON documents.
    await client.query(`
      CREATE TABLE IF NOT EXISTS olimart_categories (
        id VARCHAR(100) PRIMARY KEY,
        data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS olimart_admin_logs (
        id VARCHAR(100) PRIMARY KEY,
        data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS olimart_notifications (
        id VARCHAR(100) PRIMARY KEY,
        data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Dokan Pro feature parity: vendor coupons, refund requests, and
    // per-vendor shipping zones are also id-keyed JSON documents.
    await client.query(`
      CREATE TABLE IF NOT EXISTS olimart_coupons (
        id VARCHAR(100) PRIMARY KEY,
        status VARCHAR(50),
        data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS olimart_refunds (
        id VARCHAR(100) PRIMARY KEY,
        status VARCHAR(50),
        data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS olimart_shipping_zones (
        id VARCHAR(100) PRIMARY KEY,
        data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Generic key-value store for small singleton settings that aren't
    // arrays of id-keyed records: brand list, tag list, admin commission
    // settings, etc. One row per logical key, whole value replaced on save.
    await client.query(`
      CREATE TABLE IF NOT EXISTS olimart_settings (
        key VARCHAR(100) PRIMARY KEY,
        value JSONB NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // --- New normalized domain tables (roles, orders, transactions, OTP) ---
    // These replace: (1) the implicit single-admin model, (2) the single
    // free-text order.status field, (3) the mutable vendor.balance column,
    // and (4) the simulated-only OTP/notification flow.
    await client.query(ROLES_TABLE_SQL);
    await client.query(ORDER_TABLES_SQL);
    await client.query(TRANSACTIONS_TABLE_SQL);
    await client.query(OTP_TABLE_SQL);
    await client.query(EVENT_LOG_TABLE_SQL);
    await client.query(AUDIT_TABLE_SQL);

    // Seed a super_admin so there's always at least one account able to
    // grant the other roles through /api/admin/users.
    const userCheck = await client.query("SELECT COUNT(*) FROM olimart_users");
    if (parseInt(userCheck.rows[0].count, 10) === 0) {
      await client.query(
        `INSERT INTO olimart_users (id, name, email, phone, role) VALUES ($1,$2,$3,$4,'super_admin')`,
        ["admin-1", "Olimart Super Admin", "admin@olimart.co.ug", "0772900000"]
      );
      console.log("🌱 Seeded initial super_admin user (admin@olimart.co.ug).");
    }

    // Seed products table from the static catalog the first time only.
    const productCheck = await client.query("SELECT COUNT(*) FROM olimart_products");
    const productCount = parseInt(productCheck.rows[0].count, 10);
    if (productCount === 0 && PRODUCTS.length > 0) {
      console.log("🌱 Seeding olimart_products table from static catalog...");
      for (const p of PRODUCTS) {
        await client.query(
          `INSERT INTO olimart_products (id, category, price, data) VALUES ($1, $2, $3, $4)
           ON CONFLICT (id) DO NOTHING`,
          [p.id, p.category, p.price, JSON.stringify(p)]
        );
      }
      console.log(`🌱 olimart_products seeded with ${PRODUCTS.length} items.`);
    }

    // Check if vendors table is empty and seed if necessary
    const vendorCheck = await client.query("SELECT COUNT(*) FROM olimart_vendors");
    const vendorCount = parseInt(vendorCheck.rows[0].count, 10);
    if (vendorCount === 0) {
      console.log("🌱 Seeding olimart_vendors table with initial data...");
      await client.query(`
        INSERT INTO olimart_vendors (
          id, name, owner_name, email, phone, location, category, status, balance, total_sales, payment_details
        ) VALUES 
        ('v1', 'Mukwano Industries Online', 'Emmanuel Mukwano', 'sales@mukwano.co.ug', '0772 900100', 'Kampala Central', 'supermarket', 'approved', 850000, 1000000, 'Standard Chartered Bank - A/C 0102003004'),
        ('v2', 'Tecno Official Outlet Kampala', 'Justin Chen', 'kampala@tecno-mobile.com', '0702 456789', 'Kampala Plaza', 'phones', 'approved', 2380000, 2800000, 'MTN Mobile Money - 0772123456'),
        ('v3', 'Ssebaggala Mobiles Ltd', 'Moses Ssebaggala', 'sseba.mobiles@gmail.com', '0772 555666', 'Wandegeya', 'phones', 'pending', 0, 0, 'Airtel Money - 0702555666')
      `);
      console.log("🌱 olimart_vendors seeded successfully.");
    }

    // Check if riders table is empty and seed if necessary
    const riderCheck = await client.query("SELECT COUNT(*) FROM olimart_riders");
    const riderCount = parseInt(riderCheck.rows[0].count, 10);
    if (riderCount === 0) {
      console.log("🌱 Seeding olimart_riders table with initial data...");
      await client.query(`
        INSERT INTO olimart_riders (
          id, name, phone, email, id_card, driving_permit, picture_url, motorcycle_plate, location, completed_deliveries, earnings, transport_means, helmet_or_hub, status
        ) VALUES 
        ('r1', 'Sula Boda Boda Mukono [DKN-RDR-719]', '0772 123456', 'sula.boda@gmail.com', 'DKN-RDR-719', 'DP-MUK-9921', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=60', 'UFA 450Y', 'Mukono Town', 12, 84000, 'boda', 'HELMET-771', 'approved'),
        ('r2', 'Ronald Express Kampala [DKN-RDR-114]', '0701 987654', 'ronald.express@gmail.com', 'DKN-RDR-114', 'DP-KLA-1104', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=60', 'UEG 112Z', 'Kampala Central', 45, 320000, 'boda', 'HELMET-102', 'approved'),
        ('r3', 'Patrick Wakiso Courier [DKN-RDR-889]', '0755 456789', 'patrick.wakiso@gmail.com', 'DKN-RDR-889', 'DP-WAK-5523', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=60', 'UEX 889A', 'Wakiso Center', 8, 45500, 'van', '', 'approved')
      `);
      console.log("🌱 olimart_riders seeded successfully.");
    }

    console.log("🏁 Neon PostgreSQL database tables verified/created successfully.");

    // Seed orders (JSON-document table) with the same demo orders the
    // frontend falls back to before any real checkout has happened.
    const orderCheck = await client.query("SELECT COUNT(*) FROM olimart_orders");
    if (parseInt(orderCheck.rows[0].count, 10) === 0) {
      console.log("🌱 Seeding olimart_orders table with initial demo orders...");
      const initialOrders = [
        {
          id: "ORDER-10492", customerName: "Nakato Sarah", customerPhone: "0772 888999",
          customerAddress: "Kiwatule Rd near Shell Station", customerLocation: "Kampala (Nakawa)",
          items: [{ product: { id: "p1", title: "Tecno Spark 20 Pro - High Speed Dual SIM Smartphone", price: 685000, category: "phones", image: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=400&q=80", rating: 4.6, reviewsCount: 142, brand: "Tecno", isFlashSale: true, isOfficial: true, freeDelivery: true, payOnDelivery: true, inStock: true }, quantity: 1, selectedVendor: "Tecno Official Outlet Kampala" }],
          subtotal: 685000, deliveryFee: 9600, total: 694600, paymentMethod: "momo", paymentDetails: "0772 888999",
          status: "transit", commission: 102750, vendorEarnings: 582250, createdAt: "2026-07-01T15:20:00Z", distanceKm: 8
        },
        {
          id: "ORDER-10493", customerName: "Sempijja Ronald", customerPhone: "0702 333444",
          customerAddress: "Jinja Road opposite Nile Breweries", customerLocation: "Jinja",
          items: [{ product: { id: "p29", title: "Mukwano Laundry Bar Soap - White (Box of 10 Bars)", price: 22500, category: "supermarket", image: "https://picsum.photos/seed/soap/400/400", rating: 4.9, reviewsCount: 512, brand: "Mukwano", isFlashSale: true, isOfficial: true, freeDelivery: false, payOnDelivery: true, inStock: true }, quantity: 2, selectedVendor: "Mukwano Industries Online" }],
          subtotal: 45000, deliveryFee: 96000, total: 141000, paymentMethod: "stripe", paymentDetails: "Visa ending 4242",
          status: "placed", commission: 6750, vendorEarnings: 38250, createdAt: "2026-07-02T01:10:00Z", distanceKm: 80
        }
      ];
      for (const o of initialOrders) {
        await client.query(
          `INSERT INTO olimart_orders (id, status, data) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING`,
          [o.id, o.status, JSON.stringify(o)]
        );
      }
      console.log(`🌱 olimart_orders seeded with ${initialOrders.length} demo orders.`);
    }

    // Seed withdrawal (payout) requests
    const withdrawalCheck = await client.query("SELECT COUNT(*) FROM olimart_withdrawals");
    if (parseInt(withdrawalCheck.rows[0].count, 10) === 0) {
      console.log("🌱 Seeding olimart_withdrawals table with initial data...");
      const initialWithdrawals = [
        { id: "w1", vendorId: "v1", vendorName: "Mukwano Industries Online", amount: 250000, method: "bank", details: "Standard Chartered - Emmanuel Mukwano", status: "approved", createdAt: "2026-06-28T14:30:00Z" },
        { id: "w2", vendorId: "v2", vendorName: "Tecno Official Outlet Kampala", amount: 500000, method: "momo", details: "0772123456 (Justin Chen)", status: "pending", createdAt: "2026-07-01T10:15:00Z" }
      ];
      for (const w of initialWithdrawals) {
        await client.query(
          `INSERT INTO olimart_withdrawals (id, status, data) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING`,
          [w.id, w.status, JSON.stringify(w)]
        );
      }
      console.log(`🌱 olimart_withdrawals seeded with ${initialWithdrawals.length} requests.`);
    }

    // Seed sample customer product comments
    const commentCheck = await client.query("SELECT COUNT(*) FROM olimart_comments");
    if (parseInt(commentCheck.rows[0].count, 10) === 0) {
      console.log("🌱 Seeding olimart_comments table with initial data...");
      const initialComments = [
        { id: "c1", customerName: "Nakato Sarah", productTitle: "Tecno Spark 20 Pro - High Speed Dual SIM Smartphone", rating: 5, comment: "Authentic product, lightning-fast Boda delivery, and the e-wallet checkout options worked seamlessly. A+", date: "July 01, 2026" },
        { id: "c2", customerName: "Kato Derrick", productTitle: "Mukwano Laundry Bar Soap", rating: 4, comment: "Best laundry soap in Uganda, original box received in Mukono. Transport fee was automatically calculated, very fair.", date: "June 30, 2026" }
      ];
      for (const c of initialComments) {
        await client.query(
          `INSERT INTO olimart_comments (id, data) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING`,
          [c.id, JSON.stringify(c)]
        );
      }
      console.log(`🌱 olimart_comments seeded with ${initialComments.length} comments.`);
    }

    // Seed default marketplace categories
    const categoryCheck = await client.query("SELECT COUNT(*) FROM olimart_categories");
    if (parseInt(categoryCheck.rows[0].count, 10) === 0) {
      console.log("🌱 Seeding olimart_categories table with default categories...");
      const defaultCategories = [
        { id: "phones", name: "Phones & Tablets", icon: "Smartphone", imageUrl: "" },
        { id: "electronics", name: "Electronics", icon: "Tv", imageUrl: "" },
        { id: "fashion", name: "Fashion", icon: "Shirt", imageUrl: "" },
        { id: "home", name: "Home & Office", icon: "Home", imageUrl: "" },
        { id: "beauty", name: "Health & Beauty", icon: "Sparkles", imageUrl: "" },
        { id: "supermarket", name: "Supermarket", icon: "ShoppingBag", imageUrl: "" },
        { id: "farmers-market", name: "Farmers Market", icon: "Leaf", imageUrl: "" }
      ];
      for (const cat of defaultCategories) {
        await client.query(
          `INSERT INTO olimart_categories (id, data) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING`,
          [cat.id, JSON.stringify(cat)]
        );
      }
      console.log(`🌱 olimart_categories seeded with ${defaultCategories.length} categories.`);
    }

    // Seed the admin activity log with a boot entry
    const adminLogCheck = await client.query("SELECT COUNT(*) FROM olimart_admin_logs");
    if (parseInt(adminLogCheck.rows[0].count, 10) === 0) {
      console.log("🌱 Seeding olimart_admin_logs table with initial entries...");
      const initialLogs = [
        { id: "log-1", timestamp: new Date(Date.now() - 3600000 * 5).toISOString(), action: "SYSTEM_BOOT", details: "Olimart Dokan central database initialized on port 3000.", severity: "info", ipAddress: "127.0.0.1" },
        { id: "log-2", timestamp: new Date(Date.now() - 3600000 * 4).toISOString(), action: "VENDOR_APPROVAL", details: "Vendor store \"Mukwano Industries Online\" has been successfully approved.", severity: "success", ipAddress: "192.168.1.102" }
      ];
      for (const log of initialLogs) {
        await client.query(
          `INSERT INTO olimart_admin_logs (id, data) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING`,
          [log.id, JSON.stringify(log)]
        );
      }
      console.log(`🌱 olimart_admin_logs seeded with ${initialLogs.length} entries.`);
    }

    // Seed singleton settings: brand list, tag list, and default commission/transport rates
    const settingsToSeed: Array<{ key: string; value: any }> = [
      { key: "brands", value: ["Tecno", "Infinix", "Samsung", "Apple", "Hisense", "LG", "Mukwano", "Jesa", "Nivea", "Movit"] },
      { key: "tags", value: ["Best Seller", "Official Warranty", "Flash Deal", "Ugandan Made", "Top Brand", "Bulk Save"] },
      { key: "adminSettings", value: { bulkyCommission: 15, lightCommission: 8, bulkyTransportRate: 2800, lightTransportRate: 1200, bulkyTransportMin: 7500, lightTransportMin: 3000 } }
    ];
    for (const s of settingsToSeed) {
      const existing = await client.query("SELECT 1 FROM olimart_settings WHERE key = $1", [s.key]);
      if (existing.rows.length === 0) {
        await client.query(
          `INSERT INTO olimart_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING`,
          [s.key, JSON.stringify(s.value)]
        );
        console.log(`🌱 olimart_settings seeded key "${s.key}".`);
      }
    }

    console.log("🌱 Initial data seed check complete — every table now has a starting dataset.");
    client.release();
  } catch (err) {
    console.error("🔴 Database schema initialization error:", err);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' })); // Support base64 image uploads (store logos, rider pictures)

  // Initialize DB Tables in background
  await initDb();

  // Attach req.auth from Bearer token on every request (RBAC — see src/lib/server/rbac.ts).
  // Sensitive routes below use requirePermission(...) which reads req.auth.
  app.use(attachAuth(pool));

  // ==========================================
  // Registration — "each stakeholder's registration is unique and each
  // discloses the relevant info stated in the system" (src/lib/server/registration.ts).
  // One route per stakeholder type: customer / vendor / rider. Admin
  // accounts are never self-registered — only a super_admin can create one
  // (see /api/admin/users below) — so there's always exactly one trusted
  // path into an admin role.
  // ==========================================
  app.post("/api/auth/register/:role", async (req, res) => {
    if (!pool) return res.status(503).json({ error: "Database not connected" });
    const role = req.params.role as StakeholderRole;
    if (!REGISTRATION_SCHEMA[role]) {
      return res.status(400).json({ error: `Unknown stakeholder type "${role}". Must be customer, vendor, or rider.` });
    }
    const body = req.body || {};
    const check = validateRegistration(role, body);
    if (!check.valid) {
      return res.status(400).json({
        error: `Missing required information for ${role} registration`,
        missingFields: check.missing,
        requiredFields: REGISTRATION_SCHEMA[role].required,
      });
    }
    try {
      if (await isEmailOrPhoneTaken(pool, body.email, body.phone)) {
        return res.status(409).json({ error: "An account with this email or phone number already exists" });
      }
      const userId = `${role}-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        let vendorId: string | null = null;
        let riderId: string | null = null;

        if (role === "vendor") {
          vendorId = `v-${Date.now()}-${crypto.randomUUID().slice(0, 6)}`;
          await client.query(
            `INSERT INTO olimart_vendors (
              id, name, owner_name, email, phone, location, category, status,
              business_name, business_specifications, store_logo,
              bank_account_number, momo_number
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,'pending',$2,$8,$9,$10,$11)`,
            [
              vendorId, body.businessName, body.ownerName, body.email, body.phone, body.location, body.category,
              body.businessSpecifications || null, body.storeLogo || null,
              body.payoutMethod === "bank" ? body.payoutAccountNumber : null,
              body.payoutMethod !== "bank" ? body.payoutAccountNumber : null,
            ]
          );
        }
        if (role === "rider") {
          riderId = `r-${Date.now()}-${crypto.randomUUID().slice(0, 6)}`;
          await client.query(
            `INSERT INTO olimart_riders (
              id, name, phone, email, id_card, driving_permit, picture_url, motorcycle_plate,
              location, transport_means, helmet_or_hub, cargo_volume, license_tonnage, status
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'pending')`,
            [
              riderId, body.name, body.phone, body.email, body.idCardNumber, body.drivingPermitNumber,
              body.pictureUrl || null, body.motorcyclePlate || null, body.location, body.transportMeans,
              body.helmetOrHub || null, body.cargoVolume || null, body.licenseTonnage || null,
            ]
          );
        }

        await client.query(
          `INSERT INTO olimart_users (id, name, email, phone, password_hash, role, vendor_id, rider_id)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
          [
            userId, body.name || body.ownerName || body.businessName, body.email || null, body.phone,
            hashPassword(body.password || crypto.randomUUID()), role, vendorId, riderId,
          ]
        );
        await client.query("COMMIT");
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      } finally {
        client.release();
      }

      await writeAudit(pool, { actorId: userId, actorRole: role, action: "create", entityType: "user", entityId: userId, after: { role, ...body, password: undefined } });
      await emitEvent(pool, {
        type: role === "vendor" ? "vendor.registered" : role === "rider" ? "rider.registered" : "customer.registered",
        actorId: userId, actorRole: role, vendorId: role === "vendor" ? userId : undefined,
        vendorEmail: role === "vendor" ? body.email : undefined,
        payload: { name: body.name || body.businessName },
      });

      res.status(201).json({
        success: true,
        userId,
        role,
        status: role === "customer" ? "active" : "pending_admin_approval",
        message: role === "customer"
          ? "Registration complete. You can log in now."
          : `Registration received. An admin will review your ${role} application before you can go live.`,
      });
    } catch (err: any) {
      console.error(`Registration failed for role ${role}:`, err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    if (!pool) return res.status(503).json({ error: "Database not connected" });
    const { emailOrPhone, password } = req.body || {};
    if (!emailOrPhone || !password) return res.status(400).json({ error: "emailOrPhone and password are required" });
    try {
      const result = await pool.query(
        "SELECT * FROM olimart_users WHERE email = $1 OR phone = $1",
        [emailOrPhone]
      );
      if (!result.rows.length || !verifyPassword(password, result.rows[0].password_hash || "")) {
        return res.status(401).json({ error: "Incorrect email/phone or password" });
      }
      const user = result.rows[0];
      const token = crypto.randomUUID();
      await pool.query(
        `INSERT INTO olimart_sessions (token, user_id, expires_at) VALUES ($1, $2, NOW() + INTERVAL '7 days')`,
        [token, user.id]
      );
      res.json({ success: true, token, user: { id: user.id, name: user.name, role: user.role, vendorId: user.vendor_id, riderId: user.rider_id } });
    } catch (err: any) {
      console.error("Login failed:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // ==========================================
  // OTP — real, server-verified one-time codes (replaces the fake
  // "OTP sms confirmation" log lines that were never actually generated)
  // ==========================================
  app.post("/api/otp/send", async (req, res) => {
    if (!pool) return res.status(503).json({ error: "Database not connected" });
    const { phone, purpose, referenceId } = req.body || {};
    if (!phone || !purpose) return res.status(400).json({ error: "phone and purpose are required" });
    try {
      const code = generateOtp();
      const salt = crypto.randomBytes(8).toString("hex");
      const codeHash = `${salt}:${hashOtp(code, salt)}`;
      const id = `otp-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
      await pool.query(
        `INSERT INTO olimart_otp_codes (id, purpose, target, reference_id, code_hash, expires_at)
         VALUES ($1, $2, $3, $4, $5, NOW() + INTERVAL '5 minutes')`,
        [id, purpose, phone, referenceId || null, codeHash]
      );
      const result = await dispatch(pool, {
        channel: "sms",
        to: phone,
        message: `Olimart verification code: ${code}. Valid for 5 minutes. Do not share this code.`,
        eventType: "otp_sent",
      });
      res.json({ success: true, otpId: id, smsStatus: result.status });
    } catch (err: any) {
      console.error("Failed to send OTP:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/otp/verify", async (req, res) => {
    if (!pool) return res.status(503).json({ error: "Database not connected" });
    const { otpId, code } = req.body || {};
    if (!otpId || !code) return res.status(400).json({ error: "otpId and code are required" });
    try {
      const result = await pool.query("SELECT * FROM olimart_otp_codes WHERE id = $1", [otpId]);
      if (!result.rows.length) return res.status(404).json({ error: "OTP not found" });
      const row = result.rows[0];
      if (row.consumed_at) return res.status(409).json({ error: "OTP already used" });
      if (new Date(row.expires_at) < new Date()) return res.status(410).json({ error: "OTP expired" });
      if (row.attempts >= row.max_attempts) return res.status(429).json({ error: "Too many attempts" });

      const [salt, expectedHash] = String(row.code_hash).split(":");
      const actualHash = hashOtp(code, salt);
      const isValid = actualHash === expectedHash;

      await pool.query(
        `UPDATE olimart_otp_codes SET attempts = attempts + 1, consumed_at = CASE WHEN $2 THEN NOW() ELSE consumed_at END WHERE id = $1`,
        [otpId, isValid]
      );
      if (!isValid) return res.status(401).json({ error: "Incorrect code" });
      res.json({ success: true, purpose: row.purpose, referenceId: row.reference_id });
    } catch (err: any) {
      console.error("Failed to verify OTP:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // ==========================================
  // Notification dispatch — the single real send point. AdminApp's
  // "communication log" composer now actually calls this instead of just
  // pushing a fake row into local state.
  // ==========================================
  app.post("/api/notify/send", requirePermission("vendor.contact"), async (req: AuthedRequest, res) => {
    const { channel, to, message, subject, eventType } = req.body || {};
    if (!channel || !to || !message) return res.status(400).json({ error: "channel, to, and message are required" });
    const result = await dispatch(pool, { channel, to, message, subject, eventType });
    res.json(result);
  });

  // ==========================================
  // Checkout — the moment an order is PLACED. This is the event-driven
  // trigger point: one customer checkout fans out into one vendor
  // sub-order per seller (exactly like Jumia splits a multi-seller cart
  // into separate shipments), each starting life in "placed" status, and
  // an "order.placed" event fires immediately — notifying the customer
  // that we've got it, notifying every affected vendor that they have a
  // new sale to confirm, and logging it to the admin's live monitoring feed.
  // ==========================================
  app.post("/api/orders/checkout", async (req: AuthedRequest, res) => {
    if (!pool) return res.status(503).json({ error: "Database not connected" });
    const { customerId, customerName, customerPhone, deliveryAddress, paymentMethod, items } = req.body || {};
    if (!customerPhone || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "customerPhone and a non-empty items[] array are required" });
    }
    try {
      const orderId = `ord-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
      const grandTotal = items.reduce((sum: number, it: any) => sum + Number(it.unitPrice) * Number(it.quantity || 1), 0);
      const client = await pool.connect();
      const createdItemIds: string[] = [];
      try {
        await client.query("BEGIN");
        await client.query(
          `INSERT INTO olimart_orders_v2 (id, customer_id, customer_name, customer_phone, delivery_address, payment_method, payment_status, grand_total)
           VALUES ($1,$2,$3,$4,$5,$6,'pending',$7)`,
          [orderId, customerId || null, customerName || null, customerPhone, deliveryAddress || null, paymentMethod || "cash_on_delivery", grandTotal]
        );
        for (const it of items) {
          const itemId = `oit-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
          createdItemIds.push(itemId);
          await client.query(
            `INSERT INTO olimart_order_items (id, order_id, vendor_id, product_id, product_title, quantity, unit_price, commission_rate, status)
             VALUES ($1,$2,$3,$4,$5,$6,$7,0,'placed')`,
            [itemId, orderId, it.vendorId, it.productId, it.productTitle || null, it.quantity || 1, it.unitPrice]
          );
          await client.query(
            `INSERT INTO olimart_order_status_history (order_item_id, from_status, to_status, changed_by, note)
             VALUES ($1, NULL, 'placed', $2, 'Order placed by customer')`,
            [itemId, customerId || customerPhone]
          );
        }
        await client.query("COMMIT");
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      } finally {
        client.release();
      }

      // Confirm the order to the customer once, then tell each affected
      // vendor separately that they have a sale to confirm.
      await emitEvent(pool, { type: "order.placed", actorId: customerId, actorRole: "customer", orderId, customerPhone, payload: { grandTotal, itemCount: items.length } });
      const vendorIds = [...new Set(items.map((it: any) => it.vendorId))];
      for (const vendorId of vendorIds) {
        const v = await pool.query("SELECT phone, email FROM olimart_vendors WHERE id = $1", [vendorId]);
        await emitEvent(pool, {
          type: "order.placed", actorId: customerId, actorRole: "customer", orderId, vendorId: String(vendorId),
          vendorPhone: v.rows[0]?.phone, payload: { grandTotal },
        });
      }
      await writeAudit(pool, { actorId: customerId, actorRole: "customer", action: "create", entityType: "order", entityId: orderId, after: { items, grandTotal } });

      res.status(201).json({ success: true, orderId, orderItemIds: createdItemIds, grandTotal, status: "placed" });
    } catch (err: any) {
      console.error("Checkout failed:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // ==========================================
  // Order sub-order status transitions — enforced state machine + audit
  // trail (see src/lib/server/orderStateMachine.ts). Replaces direct writes
  // to a free-text order.status field. Every transition also fires an
  // event so the customer, vendor, rider and admin all learn about it the
  // moment it happens — this is the "event-driven system" connecting all
  // four parties end to end.
  // ==========================================
  app.post("/api/orders/items/:id/transition", async (req: AuthedRequest, res) => {
    if (!pool) return res.status(503).json({ error: "Database not connected" });
    const { id } = req.params;
    const { toStatus, deliveryProof, changedBy, riderId } = req.body || {};
    try {
      const current = await pool.query(
        `SELECT oi.*, o.customer_phone, o.id as parent_order_id, v.phone as vendor_phone, v.email as vendor_email
         FROM olimart_order_items oi
         JOIN olimart_orders_v2 o ON o.id = oi.order_id
         LEFT JOIN olimart_vendors v ON v.id = oi.vendor_id
         WHERE oi.id = $1`,
        [id]
      );
      if (!current.rows.length) return res.status(404).json({ error: "Order item not found" });
      const row = current.rows[0];
      const fromStatus = row.status as OrderItemStatus;

      if (!canTransition(fromStatus, toStatus)) {
        return res.status(409).json({ error: `Cannot move from "${fromStatus}" to "${toStatus}"` });
      }
      // Delivery requires real proof — a store/rider can no longer just
      // self-declare an order delivered with no evidence.
      if (toStatus === "delivered" && !canMarkDelivered(deliveryProof || {})) {
        return res.status(400).json({ error: "Delivery proof (verified OTP or photo) is required to mark as delivered" });
      }

      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        await client.query(
          `UPDATE olimart_order_items SET status = $1, updated_at = NOW(),
           delivery_proof_url = COALESCE($2, delivery_proof_url),
           rider_id = COALESCE($3, rider_id) WHERE id = $4`,
          [toStatus, deliveryProof?.photoUrl || null, riderId || null, id]
        );
        await client.query(
          `INSERT INTO olimart_order_status_history (order_item_id, from_status, to_status, changed_by, note)
           VALUES ($1, $2, $3, $4, $5)`,
          [id, fromStatus, toStatus, changedBy || "system", deliveryProof?.method ? `proof: ${deliveryProof.method}` : null]
        );
        await client.query("COMMIT");
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      } finally {
        client.release();
      }

      // Map the state-machine status onto a domain event and fan it out to
      // whichever of customer/vendor/rider/admin need to know.
      const eventTypeByStatus: Record<string, any> = {
        vendor_confirmed: "order.vendor_confirmed",
        assigned_to_rider: "order.rider_assigned",
        picked_up: "order.picked_up",
        out_for_delivery: "order.out_for_delivery",
        delivered: "order.delivered",
        cancelled: "order.cancelled",
        return_requested: "order.return_requested",
        returned: "order.returned",
      };
      const eventType = eventTypeByStatus[toStatus];
      if (eventType) {
        let riderPhone: string | undefined;
        if (riderId || row.rider_id) {
          const rr = await pool.query("SELECT phone FROM olimart_riders WHERE id = $1", [riderId || row.rider_id]);
          riderPhone = rr.rows[0]?.phone;
        }
        await emitEvent(pool, {
          type: eventType,
          actorId: changedBy, orderId: row.parent_order_id, orderItemId: id, vendorId: row.vendor_id,
          riderId: riderId || row.rider_id || undefined,
          customerPhone: row.customer_phone, vendorPhone: row.vendor_phone, riderPhone,
          payload: { fromStatus, toStatus },
        });
      }
      await writeAudit(pool, { actorId: changedBy, action: "update", entityType: "order_item", entityId: id, before: { status: fromStatus }, after: { status: toStatus } });

      res.json({ success: true, fromStatus, toStatus });
    } catch (err: any) {
      console.error("Order transition failed:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/orders/items/:id/history", async (req, res) => {
    if (!pool) return res.status(503).json({ error: "Database not connected" });
    const result = await pool.query(
      "SELECT * FROM olimart_order_status_history WHERE order_item_id = $1 ORDER BY created_at ASC",
      [req.params.id]
    );
    res.json(result.rows);
  });

  // ==========================================
  // Commission & vendor ledger — replaces the client-computed flat 15%
  // and the mutable vendor.balance column.
  // ==========================================
  app.post("/api/orders/items/:id/confirm-sale", requirePermission("order.view.all"), async (req: AuthedRequest, res) => {
    if (!pool) return res.status(503).json({ error: "Database not connected" });
    try {
      const item = await pool.query("SELECT * FROM olimart_order_items WHERE id = $1", [req.params.id]);
      if (!item.rows.length) return res.status(404).json({ error: "Order item not found" });
      const row = item.rows[0];
      const lineTotal = Number(row.unit_price) * Number(row.quantity);
      const split = await computeSaleSplit(pool, {
        orderItemId: row.id,
        vendorId: row.vendor_id,
        category: row.product_title || "general",
        lineTotal,
      });
      await writeLedgerEntries(pool, split.entries);
      await pool.query("UPDATE olimart_order_items SET commission_rate = $1 WHERE id = $2", [split.rate, row.id]);
      res.json(split);
    } catch (err: any) {
      console.error("Failed to confirm sale / write commission ledger:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/vendors/:id/balance", async (req: AuthedRequest, res) => {
    if (!pool) return res.status(503).json({ error: "Database not connected" });
    try {
      const balance = await getVendorBalance(pool, req.params.id);
      res.json(balance);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/payouts/:withdrawalId/approve", requirePermission("payout.approve"), async (req: AuthedRequest, res) => {
    if (!pool) return res.status(503).json({ error: "Database not connected" });
    const { vendorId, amount } = req.body || {};
    if (!vendorId || !amount) return res.status(400).json({ error: "vendorId and amount are required" });
    try {
      const balance = await getVendorBalance(pool, vendorId);
      if (amount > balance.available) {
        return res.status(400).json({ error: `Requested amount exceeds available balance (${balance.available})` });
      }
      await writeLedgerEntries(pool, [{
        id: `txn-${Date.now()}-payout`,
        vendorId,
        type: "payout_debit",
        amount,
        note: `Payout approved for withdrawal ${req.params.withdrawalId} by ${req.auth?.userId || "admin"}`,
      }]);
      res.json({ success: true, newBalance: balance.available - amount });
    } catch (err: any) {
      console.error("Failed to approve payout:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // API Route for retrieving all products from the backend
  app.get("/api/products", (req, res) => {
    res.json(PRODUCTS);
  });

  // API Route for retrieving a single product
  app.get("/api/products/:id", (req, res) => {
    const { id } = req.params;
    const product = PRODUCTS.find((p) => p.id === id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json(product);
  });

  // Health API with database connection state
  app.get("/api/health", async (req, res) => {
    let dbStatus = "disconnected";
    let dbTime = null;
    if (pool) {
      try {
        const result = await pool.query("SELECT NOW()");
        dbStatus = "connected";
        dbTime = result.rows[0].now;
      } catch (err) {
        dbStatus = "error";
      }
    }
    res.json({ 
      status: "healthy", 
      time: new Date(), 
      database: dbStatus, 
      databaseTime: dbTime,
      count: PRODUCTS.length 
    });
  });

  // NEON DB API: Get Vendors
  app.get("/api/db/vendors", async (req, res) => {
    if (!pool) {
      return res.status(503).json({ error: "Database not connected" });
    }
    try {
      const result = await pool.query("SELECT * FROM olimart_vendors ORDER BY created_at DESC");
      const vendors = result.rows.map(row => ({
        id: row.id,
        name: row.name,
        ownerName: row.owner_name,
        email: row.email,
        phone: row.phone,
        location: row.location,
        category: row.category,
        status: row.status,
        balance: Number(row.balance),
        totalSales: Number(row.total_sales),
        paymentDetails: row.payment_details,
        businessName: row.business_name,
        storeLogo: row.store_logo,
        storeBanner: row.store_banner,
        businessSpecifications: row.business_specifications,
        bankAccountNumber: row.bank_account_number,
        momoNumber: row.momo_number,
        paypalAccount: row.paypal_account,
      }));
      res.json(vendors);
    } catch (err: any) {
      console.error("Failed to query vendors from Neon DB:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // NEON DB API: Sync/Upsert Vendors
  app.post("/api/db/vendors/sync", async (req, res) => {
    if (!pool) {
      return res.status(503).json({ error: "Database not connected" });
    }
    try {
      const vendors = req.body;
      if (!Array.isArray(vendors)) {
        return res.status(400).json({ error: "Expected an array of vendors" });
      }

      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        for (const v of vendors) {
          await client.query(`
            INSERT INTO olimart_vendors (
              id, name, owner_name, email, phone, location, category, status, 
              balance, total_sales, payment_details, business_name, store_logo, 
              store_banner, business_specifications, bank_account_number, momo_number, paypal_account
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
            ON CONFLICT (id) DO UPDATE SET
              name = EXCLUDED.name,
              owner_name = EXCLUDED.owner_name,
              email = EXCLUDED.email,
              phone = EXCLUDED.phone,
              location = EXCLUDED.location,
              category = EXCLUDED.category,
              status = EXCLUDED.status,
              balance = EXCLUDED.balance,
              total_sales = EXCLUDED.total_sales,
              payment_details = EXCLUDED.payment_details,
              business_name = EXCLUDED.business_name,
              store_logo = EXCLUDED.store_logo,
              store_banner = EXCLUDED.store_banner,
              business_specifications = EXCLUDED.business_specifications,
              bank_account_number = EXCLUDED.bank_account_number,
              momo_number = EXCLUDED.momo_number,
              paypal_account = EXCLUDED.paypal_account
          `, [
            v.id, v.name || "", v.ownerName || "", v.email || "", v.phone || "", v.location || "", v.category || "", v.status || "pending",
            v.balance || 0, v.totalSales || 0, v.paymentDetails || "", v.businessName || "", v.storeLogo || "",
            v.storeBanner || "", v.businessSpecifications || "", v.bankAccountNumber || "", v.momoNumber || "", v.paypalAccount || ""
          ]);
        }
        await client.query("COMMIT");
        res.json({ success: true, count: vendors.length });
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      } finally {
        client.release();
      }
    } catch (err: any) {
      console.error("Failed to sync vendors to Neon DB:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // NEON DB API: Get Riders
  app.get("/api/db/riders", async (req, res) => {
    if (!pool) {
      return res.status(503).json({ error: "Database not connected" });
    }
    try {
      const result = await pool.query("SELECT * FROM olimart_riders ORDER BY created_at DESC");
      const riders = result.rows.map(row => ({
        id: row.id,
        name: row.name,
        phone: row.phone,
        email: row.email,
        idCard: row.id_card,
        drivingPermit: row.driving_permit,
        pictureUrl: row.picture_url,
        motorcyclePlate: row.motorcycle_plate,
        location: row.location,
        completedDeliveries: Number(row.completed_deliveries),
        earnings: Number(row.earnings),
        transportMeans: row.transport_means,
        helmetOrHub: row.helmet_or_hub,
        cargoVolume: row.cargo_volume,
        licenseTonnage: row.license_tonnage,
        status: row.status,
      }));
      res.json(riders);
    } catch (err: any) {
      console.error("Failed to query riders from Neon DB:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // NEON DB API: Sync/Upsert Riders
  app.post("/api/db/riders/sync", async (req, res) => {
    if (!pool) {
      return res.status(503).json({ error: "Database not connected" });
    }
    try {
      const riders = req.body;
      if (!Array.isArray(riders)) {
        return res.status(400).json({ error: "Expected an array of riders" });
      }

      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        for (const r of riders) {
          await client.query(`
            INSERT INTO olimart_riders (
              id, name, phone, email, id_card, driving_permit, picture_url, 
              motorcycle_plate, location, completed_deliveries, earnings, 
              transport_means, helmet_or_hub, cargo_volume, license_tonnage, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
            ON CONFLICT (id) DO UPDATE SET
              name = EXCLUDED.name,
              phone = EXCLUDED.phone,
              email = EXCLUDED.email,
              id_card = EXCLUDED.id_card,
              driving_permit = EXCLUDED.driving_permit,
              picture_url = EXCLUDED.picture_url,
              motorcycle_plate = EXCLUDED.motorcycle_plate,
              location = EXCLUDED.location,
              completed_deliveries = EXCLUDED.completed_deliveries,
              earnings = EXCLUDED.earnings,
              transport_means = EXCLUDED.transport_means,
              helmet_or_hub = EXCLUDED.helmet_or_hub,
              cargo_volume = EXCLUDED.cargo_volume,
              license_tonnage = EXCLUDED.license_tonnage,
              status = EXCLUDED.status
          `, [
            r.id, r.name || "", r.phone || "", r.email || "", r.idCard || "", r.drivingPermit || "", r.pictureUrl || "",
            r.motorcyclePlate || "", r.location || "", r.completedDeliveries || 0, r.earnings || 0,
            r.transportMeans || "boda", r.helmetOrHub || "", r.cargoVolume || "", r.licenseTonnage || "", r.status || "pending"
          ]);
        }
        await client.query("COMMIT");
        res.json({ success: true, count: riders.length });
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      } finally {
        client.release();
      }
    } catch (err: any) {
      console.error("Failed to sync riders to Neon DB:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // ==========================================
  // Generic JSON-document CRUD for products, orders, comments, withdrawals
  // ==========================================
  function registerJsonEntityRoutes(opts: {
    routeName: string;         // e.g. "products" -> /api/db/products
    table: string;             // e.g. "olimart_products"
    extraColumn?: string;      // e.g. "category" or "status" (optional indexed column)
    extraValue?: (item: any) => any;
  }) {
    const { routeName, table, extraColumn, extraValue } = opts;

    app.get(`/api/db/${routeName}`, async (req, res) => {
      if (!pool) return res.status(503).json({ error: "Database not connected" });
      try {
        const result = await pool.query(`SELECT data FROM ${table} ORDER BY created_at DESC`);
        res.json(result.rows.map((row) => row.data));
      } catch (err: any) {
        console.error(`Failed to query ${table} from Neon DB:`, err);
        res.status(500).json({ error: err.message });
      }
    });

    app.post(`/api/db/${routeName}/sync`, async (req, res) => {
      if (!pool) return res.status(503).json({ error: "Database not connected" });
      const items = req.body;
      if (!Array.isArray(items)) {
        return res.status(400).json({ error: "Expected an array" });
      }
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        for (const item of items) {
          const id = item.id || crypto.randomUUID();
          const colVal = extraColumn && extraValue ? extraValue(item) : null;
          if (extraColumn) {
            await client.query(
              `INSERT INTO ${table} (id, ${extraColumn}, data, updated_at) VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
               ON CONFLICT (id) DO UPDATE SET ${extraColumn} = EXCLUDED.${extraColumn}, data = EXCLUDED.data, updated_at = CURRENT_TIMESTAMP`,
              [id, colVal, JSON.stringify({ ...item, id })]
            );
          } else {
            await client.query(
              `INSERT INTO ${table} (id, data, updated_at) VALUES ($1, $2, CURRENT_TIMESTAMP)
               ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = CURRENT_TIMESTAMP`,
              [id, JSON.stringify({ ...item, id })]
            );
          }
        }
        await client.query("COMMIT");
        res.json({ success: true, count: items.length });
      } catch (err: any) {
        await client.query("ROLLBACK");
        console.error(`Failed to sync ${table} to Neon DB:`, err);
        res.status(500).json({ error: err.message });
      } finally {
        client.release();
      }
    });

    // Delete a single record by id (used e.g. when a vendor deletes a product)
    app.delete(`/api/db/${routeName}/:id`, async (req, res) => {
      if (!pool) return res.status(503).json({ error: "Database not connected" });
      try {
        await pool.query(`DELETE FROM ${table} WHERE id = $1`, [req.params.id]);
        res.json({ success: true });
      } catch (err: any) {
        console.error(`Failed to delete from ${table}:`, err);
        res.status(500).json({ error: err.message });
      }
    });
  }

  registerJsonEntityRoutes({
    routeName: "products",
    table: "olimart_products",
    extraColumn: "category",
    extraValue: (p) => p.category || null,
  });

  // ==========================================
  // Product moderation — "the product description should be provided by
  // all parties responsible, and the admin has the right to delete and
  // update the products." These are the permission-checked, audited
  // pathways that replace open/anonymous writes to /api/db/products.
  // ==========================================

  // Vendor creates/edits their OWN listing. vendorDescription is mandatory —
  // this is the "description provided by the party responsible" requirement.
  app.put("/api/vendor/products/:id", requireOwnResourceOrAdmin((req) => req.body?.vendorId), async (req: AuthedRequest, res) => {
    if (!pool) return res.status(503).json({ error: "Database not connected" });
    const { id } = req.params;
    const product = req.body || {};
    if (!product.vendorDescription || String(product.vendorDescription).trim().length < 10) {
      return res.status(400).json({ error: "vendorDescription is required (minimum 10 characters) — every listing must describe what's actually being sold." });
    }
    try {
      const before = await pool.query("SELECT data FROM olimart_products WHERE id = $1", [id]);
      const merged = {
        ...(before.rows[0]?.data || {}),
        ...product,
        id,
        descriptionUpdatedBy: req.auth?.userId || product.vendorId,
        descriptionUpdatedAt: new Date().toISOString(),
      };
      await pool.query(
        `INSERT INTO olimart_products (id, category, price, data, updated_at) VALUES ($1,$2,$3,$4,CURRENT_TIMESTAMP)
         ON CONFLICT (id) DO UPDATE SET category = EXCLUDED.category, price = EXCLUDED.price, data = EXCLUDED.data, updated_at = CURRENT_TIMESTAMP`,
        [id, merged.category || null, merged.price || null, JSON.stringify(merged)]
      );
      await writeAudit(pool, { actorId: req.auth?.userId || product.vendorId, actorRole: req.auth?.role || "vendor_owner", action: before.rows.length ? "update" : "create", entityType: "product", entityId: id, before: before.rows[0]?.data, after: merged });
      await emitEvent(pool, { type: before.rows.length ? "product.updated" : "product.created", actorId: req.auth?.userId || product.vendorId, actorRole: "vendor_owner", vendorId: product.vendorId, payload: { productId: id, title: merged.title } });
      res.json({ success: true, product: merged });
    } catch (err: any) {
      console.error("Vendor product update failed:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Admin edits ANY listing — can add/override an adminDescription (e.g. to
  // correct a misleading claim) without erasing the vendor's own text, or
  // change price/category/stock as part of catalog moderation.
  app.put("/api/admin/products/:id", requirePermission("product.moderate"), async (req: AuthedRequest, res) => {
    if (!pool) return res.status(503).json({ error: "Database not connected" });
    const { id } = req.params;
    try {
      const before = await pool.query("SELECT data FROM olimart_products WHERE id = $1", [id]);
      if (!before.rows.length) return res.status(404).json({ error: "Product not found" });
      const merged = {
        ...before.rows[0].data,
        ...req.body,
        id,
        descriptionUpdatedBy: req.auth?.userId,
        descriptionUpdatedAt: new Date().toISOString(),
      };
      await pool.query(
        `UPDATE olimart_products SET category = $1, price = $2, data = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4`,
        [merged.category || null, merged.price || null, JSON.stringify(merged), id]
      );
      await writeAudit(pool, { actorId: req.auth?.userId, actorRole: req.auth?.role, action: "update", entityType: "product", entityId: id, before: before.rows[0].data, after: merged });
      await emitEvent(pool, { type: "product.updated", actorId: req.auth?.userId, actorRole: req.auth?.role, vendorId: merged.vendorId, payload: { productId: id, adminEdited: true } });
      res.json({ success: true, product: merged });
    } catch (err: any) {
      console.error("Admin product update failed:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Admin removes a listing outright (counterfeit, policy violation, etc).
  app.delete("/api/admin/products/:id", requirePermission("product.remove"), async (req: AuthedRequest, res) => {
    if (!pool) return res.status(503).json({ error: "Database not connected" });
    const { id } = req.params;
    const { reason } = req.body || {};
    try {
      const before = await pool.query("SELECT data FROM olimart_products WHERE id = $1", [id]);
      if (!before.rows.length) return res.status(404).json({ error: "Product not found" });
      await pool.query("DELETE FROM olimart_products WHERE id = $1", [id]);
      await writeAudit(pool, { actorId: req.auth?.userId, actorRole: req.auth?.role, action: "delete", entityType: "product", entityId: id, before: before.rows[0].data, after: { reason } });
      await emitEvent(pool, { type: "product.removed", actorId: req.auth?.userId, actorRole: req.auth?.role, vendorId: before.rows[0].data?.vendorId, payload: { productId: id, reason } });
      res.json({ success: true });
    } catch (err: any) {
      console.error("Admin product delete failed:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // ==========================================
  // Vendor & rider approval — the admin action that turns a "pending"
  // registration into a live, trading account. Fires the approval event
  // that notifies the applicant directly.
  // ==========================================
  app.post("/api/admin/vendors/:id/approve", requirePermission("vendor.approve"), async (req: AuthedRequest, res) => {
    if (!pool) return res.status(503).json({ error: "Database not connected" });
    try {
      const before = await pool.query("SELECT * FROM olimart_vendors WHERE id = $1", [req.params.id]);
      if (!before.rows.length) return res.status(404).json({ error: "Vendor not found" });
      await pool.query("UPDATE olimart_vendors SET status = 'approved' WHERE id = $1", [req.params.id]);
      await writeAudit(pool, { actorId: req.auth?.userId, actorRole: req.auth?.role, action: "approve", entityType: "vendor", entityId: req.params.id, before: before.rows[0], after: { status: "approved" } });
      await emitEvent(pool, { type: "vendor.approved", actorId: req.auth?.userId, actorRole: req.auth?.role, vendorId: req.params.id, vendorPhone: before.rows[0].phone });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/admin/vendors/:id/reject", requirePermission("vendor.reject"), async (req: AuthedRequest, res) => {
    if (!pool) return res.status(503).json({ error: "Database not connected" });
    const { reason } = req.body || {};
    try {
      const before = await pool.query("SELECT * FROM olimart_vendors WHERE id = $1", [req.params.id]);
      if (!before.rows.length) return res.status(404).json({ error: "Vendor not found" });
      await pool.query("UPDATE olimart_vendors SET status = 'rejected' WHERE id = $1", [req.params.id]);
      await writeAudit(pool, { actorId: req.auth?.userId, actorRole: req.auth?.role, action: "reject", entityType: "vendor", entityId: req.params.id, before: before.rows[0], after: { status: "rejected", reason } });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/admin/riders/:id/approve", requirePermission("rider.approve"), async (req: AuthedRequest, res) => {
    if (!pool) return res.status(503).json({ error: "Database not connected" });
    try {
      const before = await pool.query("SELECT * FROM olimart_riders WHERE id = $1", [req.params.id]);
      if (!before.rows.length) return res.status(404).json({ error: "Rider not found" });
      await pool.query("UPDATE olimart_riders SET status = 'approved' WHERE id = $1", [req.params.id]);
      await writeAudit(pool, { actorId: req.auth?.userId, actorRole: req.auth?.role, action: "approve", entityType: "rider", entityId: req.params.id, before: before.rows[0], after: { status: "approved" } });
      await emitEvent(pool, { type: "rider.approved", actorId: req.auth?.userId, actorRole: req.auth?.role, riderId: req.params.id, riderPhone: before.rows[0].phone });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Only a super_admin can mint another admin account — the one deliberate
  // exception to "every stakeholder self-registers."
  app.post("/api/admin/users", requirePermission("*"), async (req: AuthedRequest, res) => {
    if (!pool) return res.status(503).json({ error: "Database not connected" });
    const { name, email, phone, role } = req.body || {};
    const validAdminRoles = ["super_admin", "ops_admin", "finance_admin", "catalog_admin", "support_admin"];
    if (!name || !email || !phone || !validAdminRoles.includes(role)) {
      return res.status(400).json({ error: `name, email, phone, and a valid admin role (${validAdminRoles.join(", ")}) are required` });
    }
    if (req.auth?.role !== "super_admin") return res.status(403).json({ error: "Only a super_admin can create admin accounts" });
    try {
      if (await isEmailOrPhoneTaken(pool, email, phone)) return res.status(409).json({ error: "Email or phone already in use" });
      const id = `admin-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
      const tempPassword = crypto.randomBytes(6).toString("hex");
      await pool.query(
        `INSERT INTO olimart_users (id, name, email, phone, password_hash, role) VALUES ($1,$2,$3,$4,$5,$6)`,
        [id, name, email, phone, hashPassword(tempPassword), role]
      );
      await writeAudit(pool, { actorId: req.auth?.userId, actorRole: "super_admin", action: "create", entityType: "user", entityId: id, after: { name, email, phone, role } });
      res.status(201).json({ success: true, userId: id, tempPassword, message: "Share this temporary password with the new admin over a secure channel; they should change it on first login." });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ==========================================
  // Settlement account — "all the money collected is sent to an account;
  // the admin sets those details." One platform-wide collection account,
  // manageable only by finance_admin/super_admin, fully audit-logged.
  // ==========================================
  app.get("/api/admin/settlement-account", requirePermission("settlement.manage"), async (req: AuthedRequest, res) => {
    if (!pool) return res.status(503).json({ error: "Database not connected" });
    const account = await getSettlementAccount(pool);
    res.json(account || { message: "No settlement account configured yet." });
  });

  app.put("/api/admin/settlement-account", requirePermission("settlement.manage"), async (req: AuthedRequest, res) => {
    if (!pool) return res.status(503).json({ error: "Database not connected" });
    const body = req.body as SettlementAccount;
    if (!body?.provider || !body?.accountName || !body?.accountNumber || !body?.currency) {
      return res.status(400).json({ error: "provider, accountName, accountNumber, and currency are required" });
    }
    try {
      const before = await getSettlementAccount(pool);
      const updated = await setSettlementAccount(pool, body, req.auth?.userId || "unknown");
      await writeAudit(pool, { actorId: req.auth?.userId, actorRole: req.auth?.role, action: "update", entityType: "settlement_account", entityId: "platform", before, after: updated });
      await emitEvent(pool, { type: "settlement_account.updated", actorId: req.auth?.userId, actorRole: req.auth?.role, payload: { provider: updated.provider } });
      res.json({ success: true, account: updated });
    } catch (err: any) {
      console.error("Failed to update settlement account:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // ==========================================
  // Admin monitoring — "every change on the system is monitored by the
  // admin." Two complementary feeds: the audit log (who changed what) and
  // the event stream (what happened in the business process).
  // ==========================================
  app.get("/api/admin/audit-log", requirePermission("audit.view"), async (req: AuthedRequest, res) => {
    if (!pool) return res.status(503).json({ error: "Database not connected" });
    try {
      const rows = await readAuditLog(pool, {
        entityType: req.query.entityType as string | undefined,
        entityId: req.query.entityId as string | undefined,
        actorId: req.query.actorId as string | undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
      });
      res.json(rows);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/admin/events", requirePermission("order.view.all"), async (req: AuthedRequest, res) => {
    if (!pool) return res.status(503).json({ error: "Database not connected" });
    try {
      const clauses: string[] = [];
      const params: any[] = [];
      if (req.query.orderId) { params.push(req.query.orderId); clauses.push(`order_id = $${params.length}`); }
      if (req.query.type) { params.push(req.query.type); clauses.push(`type = $${params.length}`); }
      const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
      params.push(req.query.limit ? Number(req.query.limit) : 200);
      const result = await pool.query(`SELECT * FROM olimart_events ${where} ORDER BY created_at DESC LIMIT $${params.length}`, params);
      res.json(result.rows);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
  registerJsonEntityRoutes({
    routeName: "orders",
    table: "olimart_orders",
    extraColumn: "status",
    extraValue: (o) => o.status || null,
  });
  registerJsonEntityRoutes({
    routeName: "comments",
    table: "olimart_comments",
  });
  registerJsonEntityRoutes({
    routeName: "withdrawals",
    table: "olimart_withdrawals",
    extraColumn: "status",
    extraValue: (w) => w.status || null,
  });
  registerJsonEntityRoutes({
    routeName: "categories",
    table: "olimart_categories",
  });
  registerJsonEntityRoutes({
    routeName: "adminlogs",
    table: "olimart_admin_logs",
  });
  registerJsonEntityRoutes({
    routeName: "notifications",
    table: "olimart_notifications",
  });
  registerJsonEntityRoutes({
    routeName: "coupons",
    table: "olimart_coupons",
    extraColumn: "status",
    extraValue: (c) => c.status || null,
  });
  registerJsonEntityRoutes({
    routeName: "refunds",
    table: "olimart_refunds",
    extraColumn: "status",
    extraValue: (r) => r.status || null,
  });
  registerJsonEntityRoutes({
    routeName: "shippingzones",
    table: "olimart_shipping_zones",
  });

  // ==========================================
  // Generic key-value settings store: brands, tags, admin commission
  // settings, and any other singleton value the admin console edits.
  // GET returns { key, value } or 404 if never set.
  // PUT/POST replaces the whole value for that key.
  // ==========================================
  app.get("/api/db/settings/:key", async (req, res) => {
    if (!pool) return res.status(503).json({ error: "Database not connected" });
    try {
      const result = await pool.query("SELECT value FROM olimart_settings WHERE key = $1", [req.params.key]);
      if (result.rows.length === 0) return res.status(404).json({ error: "Not found" });
      res.json({ key: req.params.key, value: result.rows[0].value });
    } catch (err: any) {
      console.error(`Failed to read setting ${req.params.key}:`, err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/db/settings/:key", async (req, res) => {
    if (!pool) return res.status(503).json({ error: "Database not connected" });
    try {
      const value = req.body?.value !== undefined ? req.body.value : req.body;
      await pool.query(
        `INSERT INTO olimart_settings (key, value, updated_at) VALUES ($1, $2, CURRENT_TIMESTAMP)
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP`,
        [req.params.key, JSON.stringify(value)]
      );
      res.json({ success: true });
    } catch (err: any) {
      console.error(`Failed to save setting ${req.params.key}:`, err);
      res.status(500).json({ error: err.message });
    }
  });

  // Vite middleware for development vs static asset serving for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
