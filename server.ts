import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { fileURLToPath } from "url";
import { PRODUCTS } from "./src/data";
import pg from "pg";
import dotenv from "dotenv";

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
// NOTE: never hardcode a real connection string as a fallback here — if
// NEON_DATABASE_URL is missing we want the app to tell you loudly, not
// silently fall back to some other database (and not leak credentials
// in source control).
const NEON_CONN = process.env.NEON_DATABASE_URL;

if (!NEON_CONN) {
  console.error(
    "🔴 NEON_DATABASE_URL is not set. Create a .env file (see .env.example) " +
    "with your Neon connection string. The server will still start, but " +
    "every /api/db/* route will return 503 until this is fixed."
  );
}

let pool: pg.Pool | null = null;
try {
  if (NEON_CONN) {
    pool = new Pool({
      connectionString: NEON_CONN,
      // Neon's pooled connection string already specifies sslmode=require,
      // so just let pg negotiate TLS normally instead of forcing
      // rejectUnauthorized:false (which conflicts with channel_binding=require
      // and throws a pg-connection-string deprecation warning).
      ssl: true,
      // Fail fast instead of hanging forever if Neon is unreachable, asleep,
      // or the credentials/IP allowlist are wrong. This is the single most
      // important setting here — without it, a bad DB connection can hang
      // the whole app (see initDb below).
      connectionTimeoutMillis: 8000,
      idleTimeoutMillis: 30000,
      max: 10,
    });

    // Without this handler, an idle client error (e.g. Neon closing a
    // connection due to inactivity) throws an *uncaught* error and can
    // crash the whole Node process.
    pool.on("error", (err) => {
      console.error("🔴 Unexpected error on idle Neon client:", err.message);
    });

    console.log("🟢 Neon PostgreSQL database pool successfully created.");
  }
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

    // Create orders table (items stored as JSONB since each order embeds
    // full product snapshots, matching the DokanOrder shape used by the frontend)
    await client.query(`
      CREATE TABLE IF NOT EXISTS olimart_orders (
        id VARCHAR(100) PRIMARY KEY,
        customer_name VARCHAR(255),
        customer_phone VARCHAR(100),
        customer_address TEXT,
        customer_location VARCHAR(255),
        items JSONB,
        subtotal NUMERIC DEFAULT 0,
        delivery_fee NUMERIC DEFAULT 0,
        total NUMERIC DEFAULT 0,
        payment_method VARCHAR(50),
        payment_details TEXT,
        status VARCHAR(50) DEFAULT 'placed',
        commission NUMERIC DEFAULT 0,
        vendor_earnings NUMERIC DEFAULT 0,
        distance_km NUMERIC DEFAULT 0,
        vendor_status VARCHAR(50),
        vendor_approved_at TIMESTAMP,
        rider_status VARCHAR(50),
        assigned_rider_id VARCHAR(100),
        assigned_rider_name VARCHAR(255),
        assigned_rider_phone VARCHAR(100),
        assigned_rider_plate VARCHAR(100),
        assigned_rider_pic TEXT,
        assigned_rider_means VARCHAR(100),
        rider_accepted_at TIMESTAMP,
        rider_transaction_ref VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create withdrawals table
    await client.query(`
      CREATE TABLE IF NOT EXISTS olimart_withdrawals (
        id VARCHAR(100) PRIMARY KEY,
        vendor_id VARCHAR(100),
        vendor_name VARCHAR(255),
        amount NUMERIC DEFAULT 0,
        method VARCHAR(50),
        details TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create customer comments/reviews table
    await client.query(`
      CREATE TABLE IF NOT EXISTS olimart_comments (
        id VARCHAR(100) PRIMARY KEY,
        customer_name VARCHAR(255),
        product_title VARCHAR(500),
        rating INTEGER,
        comment TEXT,
        date VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Generic key-value store for smaller shared platform state:
    // categories, brands, tags, admin commission settings, admin logs.
    // Avoids a bespoke table + migration for every simple list/blob.
    await client.query(`
      CREATE TABLE IF NOT EXISTS olimart_kv (
        key VARCHAR(100) PRIMARY KEY,
        value JSONB,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

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

  // Initialize DB tables, but NEVER let a slow/unreachable database block
  // the server from starting. All non-DB routes (like /api/products) must
  // keep working even if Neon is completely down. We fire-and-forget this
  // instead of awaiting it.
  initDb().catch((err) => {
    console.error("🔴 Background DB initialization failed:", err);
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

  // NEON DB API: Get Orders
  app.get("/api/db/orders", async (req, res) => {
    if (!pool) return res.status(503).json({ error: "Database not connected" });
    try {
      const result = await pool.query("SELECT * FROM olimart_orders ORDER BY created_at DESC");
      const orders = result.rows.map(row => ({
        id: row.id,
        customerName: row.customer_name,
        customerPhone: row.customer_phone,
        customerAddress: row.customer_address,
        customerLocation: row.customer_location,
        items: row.items || [],
        subtotal: Number(row.subtotal),
        deliveryFee: Number(row.delivery_fee),
        total: Number(row.total),
        paymentMethod: row.payment_method,
        paymentDetails: row.payment_details,
        status: row.status,
        commission: Number(row.commission),
        vendorEarnings: Number(row.vendor_earnings),
        distanceKm: Number(row.distance_km),
        vendorStatus: row.vendor_status,
        vendorApprovedAt: row.vendor_approved_at,
        riderStatus: row.rider_status,
        assignedRiderId: row.assigned_rider_id,
        assignedRiderName: row.assigned_rider_name,
        assignedRiderPhone: row.assigned_rider_phone,
        assignedRiderPlate: row.assigned_rider_plate,
        assignedRiderPic: row.assigned_rider_pic,
        assignedRiderMeans: row.assigned_rider_means,
        riderAcceptedAt: row.rider_accepted_at,
        riderTransactionRef: row.rider_transaction_ref,
        createdAt: row.created_at,
      }));
      res.json(orders);
    } catch (err: any) {
      console.error("Failed to query orders from Neon DB:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // NEON DB API: Sync/Upsert Orders
  app.post("/api/db/orders/sync", async (req, res) => {
    if (!pool) return res.status(503).json({ error: "Database not connected" });
    try {
      const orders = req.body;
      if (!Array.isArray(orders)) {
        return res.status(400).json({ error: "Expected an array of orders" });
      }
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        for (const o of orders) {
          await client.query(`
            INSERT INTO olimart_orders (
              id, customer_name, customer_phone, customer_address, customer_location, items,
              subtotal, delivery_fee, total, payment_method, payment_details, status, commission,
              vendor_earnings, distance_km, vendor_status, vendor_approved_at, rider_status,
              assigned_rider_id, assigned_rider_name, assigned_rider_phone, assigned_rider_plate,
              assigned_rider_pic, assigned_rider_means, rider_accepted_at, rider_transaction_ref, created_at
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,
              COALESCE($27, CURRENT_TIMESTAMP))
            ON CONFLICT (id) DO UPDATE SET
              customer_name = EXCLUDED.customer_name,
              customer_phone = EXCLUDED.customer_phone,
              customer_address = EXCLUDED.customer_address,
              customer_location = EXCLUDED.customer_location,
              items = EXCLUDED.items,
              subtotal = EXCLUDED.subtotal,
              delivery_fee = EXCLUDED.delivery_fee,
              total = EXCLUDED.total,
              payment_method = EXCLUDED.payment_method,
              payment_details = EXCLUDED.payment_details,
              status = EXCLUDED.status,
              commission = EXCLUDED.commission,
              vendor_earnings = EXCLUDED.vendor_earnings,
              distance_km = EXCLUDED.distance_km,
              vendor_status = EXCLUDED.vendor_status,
              vendor_approved_at = EXCLUDED.vendor_approved_at,
              rider_status = EXCLUDED.rider_status,
              assigned_rider_id = EXCLUDED.assigned_rider_id,
              assigned_rider_name = EXCLUDED.assigned_rider_name,
              assigned_rider_phone = EXCLUDED.assigned_rider_phone,
              assigned_rider_plate = EXCLUDED.assigned_rider_plate,
              assigned_rider_pic = EXCLUDED.assigned_rider_pic,
              assigned_rider_means = EXCLUDED.assigned_rider_means,
              rider_accepted_at = EXCLUDED.rider_accepted_at,
              rider_transaction_ref = EXCLUDED.rider_transaction_ref
          `, [
            o.id, o.customerName || "", o.customerPhone || "", o.customerAddress || "", o.customerLocation || "",
            JSON.stringify(o.items || []), o.subtotal || 0, o.deliveryFee || 0, o.total || 0, o.paymentMethod || "",
            o.paymentDetails || "", o.status || "placed", o.commission || 0, o.vendorEarnings || 0, o.distanceKm || 0,
            o.vendorStatus || null, o.vendorApprovedAt || null, o.riderStatus || null, o.assignedRiderId || null,
            o.assignedRiderName || null, o.assignedRiderPhone || null, o.assignedRiderPlate || null,
            o.assignedRiderPic || null, o.assignedRiderMeans || null, o.riderAcceptedAt || null,
            o.riderTransactionRef || null, o.createdAt || null
          ]);
        }
        await client.query("COMMIT");
        res.json({ success: true, count: orders.length });
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      } finally {
        client.release();
      }
    } catch (err: any) {
      console.error("Failed to sync orders to Neon DB:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // NEON DB API: Get Withdrawals
  app.get("/api/db/withdrawals", async (req, res) => {
    if (!pool) return res.status(503).json({ error: "Database not connected" });
    try {
      const result = await pool.query("SELECT * FROM olimart_withdrawals ORDER BY created_at DESC");
      const withdrawals = result.rows.map(row => ({
        id: row.id,
        vendorId: row.vendor_id,
        vendorName: row.vendor_name,
        amount: Number(row.amount),
        method: row.method,
        details: row.details,
        status: row.status,
        createdAt: row.created_at,
      }));
      res.json(withdrawals);
    } catch (err: any) {
      console.error("Failed to query withdrawals from Neon DB:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // NEON DB API: Sync/Upsert Withdrawals
  app.post("/api/db/withdrawals/sync", async (req, res) => {
    if (!pool) return res.status(503).json({ error: "Database not connected" });
    try {
      const withdrawals = req.body;
      if (!Array.isArray(withdrawals)) {
        return res.status(400).json({ error: "Expected an array of withdrawals" });
      }
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        for (const w of withdrawals) {
          await client.query(`
            INSERT INTO olimart_withdrawals (id, vendor_id, vendor_name, amount, method, details, status, created_at)
            VALUES ($1,$2,$3,$4,$5,$6,$7, COALESCE($8, CURRENT_TIMESTAMP))
            ON CONFLICT (id) DO UPDATE SET
              vendor_id = EXCLUDED.vendor_id,
              vendor_name = EXCLUDED.vendor_name,
              amount = EXCLUDED.amount,
              method = EXCLUDED.method,
              details = EXCLUDED.details,
              status = EXCLUDED.status
          `, [
            w.id, w.vendorId || "", w.vendorName || "", w.amount || 0, w.method || "bank",
            w.details || "", w.status || "pending", w.createdAt || null
          ]);
        }
        await client.query("COMMIT");
        res.json({ success: true, count: withdrawals.length });
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      } finally {
        client.release();
      }
    } catch (err: any) {
      console.error("Failed to sync withdrawals to Neon DB:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // NEON DB API: Get Comments/Reviews
  app.get("/api/db/comments", async (req, res) => {
    if (!pool) return res.status(503).json({ error: "Database not connected" });
    try {
      const result = await pool.query("SELECT * FROM olimart_comments ORDER BY created_at DESC");
      const comments = result.rows.map(row => ({
        id: row.id,
        customerName: row.customer_name,
        productTitle: row.product_title,
        rating: Number(row.rating),
        comment: row.comment,
        date: row.date,
      }));
      res.json(comments);
    } catch (err: any) {
      console.error("Failed to query comments from Neon DB:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // NEON DB API: Sync/Upsert Comments/Reviews
  app.post("/api/db/comments/sync", async (req, res) => {
    if (!pool) return res.status(503).json({ error: "Database not connected" });
    try {
      const comments = req.body;
      if (!Array.isArray(comments)) {
        return res.status(400).json({ error: "Expected an array of comments" });
      }
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        for (const c of comments) {
          await client.query(`
            INSERT INTO olimart_comments (id, customer_name, product_title, rating, comment, date)
            VALUES ($1,$2,$3,$4,$5,$6)
            ON CONFLICT (id) DO UPDATE SET
              customer_name = EXCLUDED.customer_name,
              product_title = EXCLUDED.product_title,
              rating = EXCLUDED.rating,
              comment = EXCLUDED.comment,
              date = EXCLUDED.date
          `, [c.id, c.customerName || "", c.productTitle || "", c.rating || 5, c.comment || "", c.date || ""]);
        }
        await client.query("COMMIT");
        res.json({ success: true, count: comments.length });
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      } finally {
        client.release();
      }
    } catch (err: any) {
      console.error("Failed to sync comments to Neon DB:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // NEON DB API: Generic key-value store (categories, brands, tags, admin settings, admin logs)
  app.get("/api/db/kv/:key", async (req, res) => {
    if (!pool) return res.status(503).json({ error: "Database not connected" });
    try {
      const result = await pool.query("SELECT value FROM olimart_kv WHERE key = $1", [req.params.key]);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Key not found" });
      }
      res.json({ value: result.rows[0].value });
    } catch (err: any) {
      console.error("Failed to read kv from Neon DB:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/db/kv/:key", async (req, res) => {
    if (!pool) return res.status(503).json({ error: "Database not connected" });
    try {
      const { value } = req.body;
      await pool.query(`
        INSERT INTO olimart_kv (key, value, updated_at) VALUES ($1, $2, CURRENT_TIMESTAMP)
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP
      `, [req.params.key, JSON.stringify(value)]);
      res.json({ success: true });
    } catch (err: any) {
      console.error("Failed to write kv to Neon DB:", err);
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
