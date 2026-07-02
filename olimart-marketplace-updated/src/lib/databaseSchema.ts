// Olimart Dokan Multi-Vendor E-Commerce System
// Comprehensive Production-Ready Database Schema Definition
// Supports both PostgreSQL (SQL) and Firestore (NoSQL) models

export interface DBTable {
  name: string;
  description: string;
  type: 'sql' | 'nosql';
  columns: DBColumn[];
  sqlCode: string;
}

export interface DBColumn {
  name: string;
  type: string;
  constraints?: string;
  description: string;
  isPrimaryKey?: boolean;
  isForeignKey?: boolean;
  references?: string;
}

export const RELATIONAL_TABLES: DBTable[] = [
  {
    name: 'vendors',
    description: 'Dokan certified vendor stores onboarding details, contact records, and wallet balance.',
    type: 'sql',
    columns: [
      { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY DEFAULT gen_random_uuid()', description: 'Unique identifier for the vendor store', isPrimaryKey: true },
      { name: 'name', type: 'VARCHAR(255)', constraints: 'NOT NULL UNIQUE', description: 'Public registered store brand name' },
      { name: 'owner_name', type: 'VARCHAR(255)', constraints: 'NOT NULL', description: 'Full legal name of the store proprietor' },
      { name: 'email', type: 'VARCHAR(255)', constraints: 'NOT NULL UNIQUE', description: 'Official email address for digital order alerts' },
      { name: 'phone', type: 'VARCHAR(50)', constraints: 'NOT NULL', description: 'Mobile money registered line or WhatsApp number' },
      { name: 'location', type: 'VARCHAR(255)', constraints: 'NOT NULL', description: 'Physical location coordinates / base market hub' },
      { name: 'category', type: 'VARCHAR(100)', constraints: 'NOT NULL', description: 'Primary inventory taxonomy (e.g. phones, fashion)' },
      { name: 'status', type: 'VARCHAR(50)', constraints: 'DEFAULT \'pending\'', description: 'Onboarding approval state (pending, approved, rejected)' },
      { name: 'balance', type: 'BIGINT', constraints: 'DEFAULT 0', description: 'Withdrawable wallet funds (85% earnings share) in UGX' },
      { name: 'total_sales', type: 'BIGINT', constraints: 'DEFAULT 0', description: 'Cumulative gross sales transacted through Olimart in UGX' },
      { name: 'payment_details', type: 'TEXT', constraints: 'NOT NULL', description: 'Bank coordinates or mobile money payout routing address' },
      { name: 'created_at', type: 'TIMESTAMP', constraints: 'DEFAULT NOW()', description: 'Onboarding submission timestamp' }
    ],
    sqlCode: `CREATE TABLE vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  owner_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(50) NOT NULL,
  location VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  balance BIGINT DEFAULT 0,
  total_sales BIGINT DEFAULT 0,
  payment_details TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);`
  },
  {
    name: 'products',
    description: 'E-commerce marketplace items, linked to their respective certified vendor.',
    type: 'sql',
    columns: [
      { name: 'id', type: 'VARCHAR(100)', constraints: 'PRIMARY KEY', description: 'Unique alphanumeric product code', isPrimaryKey: true },
      { name: 'title', type: 'VARCHAR(500)', constraints: 'NOT NULL', description: 'Full product listing title' },
      { name: 'price', type: 'INTEGER', constraints: 'NOT NULL', description: 'Unit selling price in UGX' },
      { name: 'category', type: 'VARCHAR(100)', constraints: 'NOT NULL', description: 'Marketplace taxonomy slug' },
      { name: 'image', type: 'VARCHAR(1000)', constraints: 'NOT NULL', description: 'Secure HTTPS photo hosting URL' },
      { name: 'brand', type: 'VARCHAR(100)', constraints: 'NOT NULL', description: 'Manufacturer brand name' },
      { name: 'vendor_id', type: 'UUID', constraints: 'REFERENCES vendors(id) ON DELETE CASCADE', description: 'The publishing vendor proprietor', isForeignKey: true, references: 'vendors.id' },
      { name: 'is_flash_sale', type: 'BOOLEAN', constraints: 'DEFAULT FALSE', description: 'Eligible for high-velocity limited price drop countdown' },
      { name: 'is_official', type: 'BOOLEAN', constraints: 'DEFAULT FALSE', description: 'Verified official brand store listing' },
      { name: 'free_delivery', type: 'BOOLEAN', constraints: 'DEFAULT FALSE', description: 'Waiver of standard logistics courier fee' },
      { name: 'pay_on_delivery', type: 'BOOLEAN', constraints: 'DEFAULT TRUE', description: 'Eligible for cash-on-delivery and MoMo on arrival' },
      { name: 'in_stock', type: 'BOOLEAN', constraints: 'DEFAULT TRUE', description: 'Active availability state' },
      { name: 'rating', type: 'NUMERIC(3,2)', constraints: 'DEFAULT 5.00', description: 'Average customer feedback rating' },
      { name: 'reviews_count', type: 'INTEGER', constraints: 'DEFAULT 0', description: 'Total review comment count' }
    ],
    sqlCode: `CREATE TABLE products (
  id VARCHAR(100) PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  price INTEGER NOT NULL CHECK (price >= 0),
  category VARCHAR(100) NOT NULL,
  image VARCHAR(1000) NOT NULL,
  brand VARCHAR(100) NOT NULL,
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  is_flash_sale BOOLEAN DEFAULT FALSE,
  is_official BOOLEAN DEFAULT FALSE,
  free_delivery BOOLEAN DEFAULT FALSE,
  pay_on_delivery BOOLEAN DEFAULT TRUE,
  in_stock BOOLEAN DEFAULT TRUE,
  rating NUMERIC(3,2) DEFAULT 5.00,
  reviews_count INTEGER DEFAULT 0
);`
  },
  {
    name: 'orders',
    description: 'Central orders ledger tracking customer details, payment gateway and transaction values.',
    type: 'sql',
    columns: [
      { name: 'id', type: 'VARCHAR(100)', constraints: 'PRIMARY KEY', description: 'Unique invoice identifier', isPrimaryKey: true },
      { name: 'customer_name', type: 'VARCHAR(255)', constraints: 'NOT NULL', description: 'Name of customer placing order' },
      { name: 'customer_phone', type: 'VARCHAR(50)', constraints: 'NOT NULL', description: 'Contact phone for delivery coordination and MoMo checkouts' },
      { name: 'customer_address', type: 'TEXT', constraints: 'NOT NULL', description: 'Physical dropping address / landmark coordinates' },
      { name: 'customer_location', type: 'VARCHAR(255)', constraints: 'NOT NULL', description: 'Designated delivery district inside Uganda' },
      { name: 'subtotal', type: 'INTEGER', constraints: 'NOT NULL', description: 'Sum of inventory prices in UGX' },
      { name: 'delivery_fee', type: 'INTEGER', constraints: 'NOT NULL', description: 'Automated distance-calculated logistics fee' },
      { name: 'total', type: 'INTEGER', constraints: 'NOT NULL', description: 'Grand final total charged to customer' },
      { name: 'payment_method', type: 'VARCHAR(50)', constraints: 'NOT NULL', description: 'Selected gateway mode (momo, airtel, cash, paypal, stripe, etc.)' },
      { name: 'payment_details', type: 'TEXT', constraints: 'NOT NULL', description: 'Card digits, transaction code or pay account string' },
      { name: 'status', type: 'VARCHAR(50)', constraints: 'DEFAULT \'placed\'', description: 'Order stepper status (placed, dispatched, transit, delivered)' },
      { name: 'commission', type: 'INTEGER', constraints: 'NOT NULL', description: '15% marketplace commission revenue in UGX' },
      { name: 'vendor_earnings', type: 'INTEGER', constraints: 'NOT NULL', description: '85% payout earnings allocated to vendor wallets' },
      { name: 'assigned_rider_id', type: 'UUID', constraints: 'REFERENCES riders(id)', description: 'Boda dispatch assigned courier rider', isForeignKey: true, references: 'riders.id' },
      { name: 'distance_km', type: 'NUMERIC(6,2)', constraints: 'NOT NULL', description: 'Logistics road distance from vendor store base to customer' },
      { name: 'created_at', type: 'TIMESTAMP', constraints: 'DEFAULT NOW()', description: 'Order creation and payment checkout timestamp' }
    ],
    sqlCode: `CREATE TABLE orders (
  id VARCHAR(100) PRIMARY KEY,
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50) NOT NULL,
  customer_address TEXT NOT NULL,
  customer_location VARCHAR(255) NOT NULL,
  subtotal INTEGER NOT NULL,
  delivery_fee INTEGER NOT NULL,
  total INTEGER NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  payment_details TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'placed' CHECK (status IN ('placed', 'dispatched', 'transit', 'delivered')),
  commission INTEGER NOT NULL,
  vendor_earnings INTEGER NOT NULL,
  assigned_rider_id UUID REFERENCES riders(id),
  distance_km NUMERIC(6,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);`
  },
  {
    name: 'order_items',
    description: 'Relational mapping resolving multiple items and matching vendors within a single order invoice.',
    type: 'sql',
    columns: [
      { name: 'id', type: 'BIGSERIAL', constraints: 'PRIMARY KEY', description: 'Unique record index', isPrimaryKey: true },
      { name: 'order_id', type: 'VARCHAR(100)', constraints: 'REFERENCES orders(id) ON DELETE CASCADE', description: 'Invoice ID of the parent order', isForeignKey: true, references: 'orders.id' },
      { name: 'product_id', type: 'VARCHAR(100)', constraints: 'REFERENCES products(id)', description: 'Marketplace product SKU identifier', isForeignKey: true, references: 'products.id' },
      { name: 'quantity', type: 'INTEGER', constraints: 'NOT NULL CHECK (quantity > 0)', description: 'Item count ordered' },
      { name: 'selected_vendor_id', type: 'UUID', constraints: 'REFERENCES vendors(id)', description: 'Specific vendor store that fulfills this item', isForeignKey: true, references: 'vendors.id' },
      { name: 'price_applied', type: 'INTEGER', constraints: 'NOT NULL', description: 'Active unit price in UGX when transaction occurred' }
    ],
    sqlCode: `CREATE TABLE order_items (
  id BIGSERIAL PRIMARY KEY,
  order_id VARCHAR(100) REFERENCES orders(id) ON DELETE CASCADE,
  product_id VARCHAR(100) REFERENCES products(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  selected_vendor_id UUID REFERENCES vendors(id),
  price_applied INTEGER NOT NULL
);`
  },
  {
    name: 'withdrawals',
    description: 'Tracks vendor balance payout disbursement audits from Olimart Escrow to their bank/mobile wallets.',
    type: 'sql',
    columns: [
      { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY DEFAULT gen_random_uuid()', description: 'Transaction withdrawal ID', isPrimaryKey: true },
      { name: 'vendor_id', type: 'UUID', constraints: 'REFERENCES vendors(id) ON DELETE CASCADE', description: 'Vendor requesting payment clearance', isForeignKey: true, references: 'vendors.id' },
      { name: 'amount', type: 'BIGINT', constraints: 'NOT NULL CHECK (amount > 0)', description: 'Requested payout amount in UGX' },
      { name: 'method', type: 'VARCHAR(50)', constraints: 'NOT NULL', description: 'Selected payout route (paypal, stripe, bank, momo)' },
      { name: 'details', type: 'TEXT', constraints: 'NOT NULL', description: 'Receiver phone number or banking routing details' },
      { name: 'status', type: 'VARCHAR(50)', constraints: 'DEFAULT \'pending\'', description: 'Clearance audit state (pending, approved, rejected)' },
      { name: 'created_at', type: 'TIMESTAMP', constraints: 'DEFAULT NOW()', description: 'Withdrawal submission timestamp' }
    ],
    sqlCode: `CREATE TABLE withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  amount BIGINT NOT NULL CHECK (amount > 0),
  method VARCHAR(50) NOT NULL CHECK (method IN ('paypal', 'stripe', 'mastercard', 'bank', 'momo')),
  details TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP DEFAULT NOW()
);`
  },
  {
    name: 'riders',
    description: 'Registered boda/delivery couriers dispatch registry.',
    type: 'sql',
    columns: [
      { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY DEFAULT gen_random_uuid()', description: 'Unique courier rider identifier', isPrimaryKey: true },
      { name: 'name', type: 'VARCHAR(255)', constraints: 'NOT NULL', description: 'Courier driver name' },
      { name: 'phone', type: 'VARCHAR(50)', constraints: 'NOT NULL', description: 'Assigned mobile contact number' },
      { name: 'motorcycle_plate', type: 'VARCHAR(50)', constraints: 'NOT NULL', description: 'Ugandan license plate number' },
      { name: 'location', type: 'VARCHAR(255)', constraints: 'NOT NULL', description: 'Primary active dispatch district / boda stage' },
      { name: 'completed_deliveries', type: 'INTEGER', constraints: 'DEFAULT 0', description: 'Completed logistics jobs' },
      { name: 'earnings', type: 'INTEGER', constraints: 'DEFAULT 0', description: 'Accumulated transport wages in UGX' },
      { name: 'transport_means', type: 'VARCHAR(50)', constraints: 'DEFAULT \'boda\'', description: 'Logistics asset model (boda, bicycle, van, truck)' }
    ],
    sqlCode: `CREATE TABLE riders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  motorcycle_plate VARCHAR(50) NOT NULL,
  location VARCHAR(255) NOT NULL,
  completed_deliveries INTEGER DEFAULT 0,
  earnings INTEGER DEFAULT 0,
  transport_means VARCHAR(50) DEFAULT 'boda'
);`
  },
  {
    name: 'comments_reviews',
    description: 'Public customer feedback comments and rating recommendations.',
    type: 'sql',
    columns: [
      { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY DEFAULT gen_random_uuid()', description: 'Unique feedback rating identifier', isPrimaryKey: true },
      { name: 'customer_name', type: 'VARCHAR(255)', constraints: 'NOT NULL', description: 'Name of reviewer' },
      { name: 'product_id', type: 'VARCHAR(100)', constraints: 'REFERENCES products(id) ON DELETE SET NULL', description: 'Associated marketplace item', isForeignKey: true, references: 'products.id' },
      { name: 'rating', type: 'INTEGER', constraints: 'NOT NULL CHECK (rating BETWEEN 1 AND 5)', description: 'Rating score out of 5 stars' },
      { name: 'comment', type: 'TEXT', constraints: 'NOT NULL', description: 'Verbatim feedback testimonial' },
      { name: 'created_at', type: 'TIMESTAMP', constraints: 'DEFAULT NOW()', description: 'Submission timestamp' }
    ],
    sqlCode: `CREATE TABLE comments_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name VARCHAR(255) NOT NULL,
  product_id VARCHAR(100) REFERENCES products(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);`
  },
  {
    name: 'notifications',
    description: 'Sent event-driven messages, routing communications to vendors, customers, or admins.',
    type: 'sql',
    columns: [
      { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY DEFAULT gen_random_uuid()', description: 'Unique notification log ID', isPrimaryKey: true },
      { name: 'timestamp', type: 'TIMESTAMP', constraints: 'DEFAULT NOW()', description: 'Log dispatch timestamp' },
      { name: 'event_type', type: 'VARCHAR(100)', constraints: 'NOT NULL', description: 'System trigger (order_placed, order_delivered, withdrawal_request, customer_comment)' },
      { name: 'channel', type: 'VARCHAR(50)', constraints: 'NOT NULL', description: 'Routing pipeline channel (sms, email, whatsapp)' },
      { name: 'recipient', type: 'VARCHAR(255)', constraints: 'NOT NULL', description: 'Name of notified entity' },
      { name: 'recipient_contact', type: 'VARCHAR(255)', constraints: 'NOT NULL', description: 'Target email, phone, or account address' },
      { name: 'message', type: 'TEXT', constraints: 'NOT NULL', description: 'The exact dispatched alert message' },
      { name: 'status', type: 'VARCHAR(50)', constraints: 'DEFAULT \'sent\'', description: 'Transmission status (sent, delivered)' }
    ],
    sqlCode: `CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMP DEFAULT NOW(),
  event_type VARCHAR(100) NOT NULL,
  channel VARCHAR(50) NOT NULL CHECK (channel IN ('sms', 'email', 'whatsapp')),
  recipient VARCHAR(255) NOT NULL,
  recipient_contact VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'sent'
);`
  }
];
