import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { fileURLToPath } from "url";
import { PRODUCTS } from "./src/data";
import pg from "pg";
import dotenv from "dotenv";
import crypto from "crypto";

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
