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
