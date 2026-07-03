import { Product, CartItem } from '../types';

export interface DokanVendor {
  id: string;
  name: string;
  ownerName: string;
  email: string;
  phone: string;
  location: string;
  category: string;
  status: 'pending' | 'approved' | 'rejected';
  balance: number; // 85% of their total sales
  totalSales: number;
  paymentDetails: string;
  trustBadges?: string[];
  reviews?: { id: string; customerName: string; rating: number; comment: string; date: string }[];
  suspended?: boolean;
}

export interface WithdrawalRequest {
  id: string;
  vendorId: string;
  vendorName: string;
  amount: number;
  method: 'paypal' | 'stripe' | 'mastercard' | 'bank' | 'momo';
  details: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface DokanOrder {
  id: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerLocation: string; // District name
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentMethod: 'momo' | 'airtel' | 'cash' | 'paypal' | 'stripe' | 'mastercard' | 'bank';
  paymentDetails?: string; // payment account, email or card number
  status: 'placed' | 'dispatched' | 'transit' | 'delivered'; // Stepper steps
  commission: number; // 15%
  vendorEarnings: number; // 85%
  createdAt: string;
  assignedRider?: string;
  distanceKm: number;
}

export interface CustomerComment {
  id: string;
  customerName: string;
  productTitle: string;
  rating: number;
  comment: string;
  date: string;
}

export interface DokanCategory {
  id: string;
  name: string;
  icon: string;
  imageUrl: string;
}

// Bulky product verification
export function isProductBulky(category: string): boolean {
  const c = category.toLowerCase();
  return c === 'electronics' || c === 'home' || c === 'farmers-market';
}

// Distance estimator based on Uganda district grid
export function estimateDistance(vendorLoc: string, deliveryDist: string): number {
  const v = (vendorLoc || 'Kampala Central').toLowerCase();
  const d = (deliveryDist || 'Kampala (Central)').toLowerCase();
  
  if (d.includes('entebbe')) return 40;
  if (d.includes('wakiso')) return 15;
  if (d.includes('mukono')) return 22;
  if (d.includes('jinja')) return 80;
  if (d.includes('mbarara')) return 260;
  if (d.includes('gulu')) return 330;
  if (d.includes('arua')) return 480;
  if (d.includes('mbale')) return 220;
  if (d.includes('masaka')) return 130;
  if (d.includes('fort portal')) return 300;
  if (d.includes('lira')) return 340;
  if (d.includes('kabale')) return 410;
  
  // Local Kampala districts
  if (d.includes('nakawa')) return 8;
  if (d.includes('kawempe')) return 9;
  if (d.includes('makindye')) return 6;
  if (d.includes('rubaga')) return 7;
  
  return 5; // Default within central Kampala
}

// Dynamic smart transport pricing calculator based on categories and distance (km)
export function calculateDynamicDeliveryFee(items: CartItem[], deliveryDist: string): {
  fee: number;
  distanceKm: number;
  hasBulkyItem: boolean;
  ratePerKm: number;
  explanation: string;
} {
  if (items.length === 0) {
    return { fee: 0, distanceKm: 0, hasBulkyItem: false, ratePerKm: 0, explanation: 'Cart is empty' };
  }

  // Find representative vendor location or default
  const firstItem = items[0];
  const vendorLoc = firstItem.product.vendors && firstItem.product.vendors[0]
    ? firstItem.product.vendors[0].location
    : 'Kampala Central';

  const distanceKm = estimateDistance(vendorLoc, deliveryDist);
  
  // Detect if there are any bulky products in the cart
  const hasBulkyItem = items.some(item => isProductBulky(item.product.category));
  
  // Dynamic tariffs
  // Bulky categories: Shs 2,800/km (min 7,500 Shs)
  // Standard categories: Shs 1,200/km (min 3,000 Shs)
  const ratePerKm = hasBulkyItem ? 2800 : 1200;
  const minFee = hasBulkyItem ? 7500 : 3000;
  
  let calculated = distanceKm * ratePerKm;
  if (calculated < minFee) {
    calculated = minFee;
  }
  
  // Cap extreme distance courier costs to remain affordable
  const maxFee = hasBulkyItem ? 95000 : 45000;
  if (calculated > maxFee) {
    calculated = maxFee;
  }

  // Rounded to nearest 500 Shs for Ugandan standards
  const finalFee = Math.round(calculated / 500) * 500;

  const explanation = hasBulkyItem 
    ? `Bulky cargo rate (Shs ${ratePerKm.toLocaleString()}/km) for ${distanceKm} km.`
    : `Standard courier rate (Shs ${ratePerKm.toLocaleString()}/km) for ${distanceKm} km.`;

  return {
    fee: finalFee,
    distanceKm,
    hasBulkyItem,
    ratePerKm,
    explanation
  };
}

// Initial hydration datasets
const INITIAL_VENDORS: DokanVendor[] = [
  {
    id: 'v1',
    name: 'Mukwano Industries Online',
    ownerName: 'Emmanuel Mukwano',
    email: 'sales@mukwano.co.ug',
    phone: '0772 900100',
    location: 'Kampala Central',
    category: 'supermarket',
    status: 'approved',
    balance: 850000,
    totalSales: 1000000,
    paymentDetails: 'Standard Chartered Bank - A/C 0102003004',
    trustBadges: ['Authentic Products', 'Verified Business'],
    reviews: [
      { id: 'rev-v1-1', customerName: 'Sempijja Ronald', rating: 5, comment: 'High quality Mukwano soaps directly from factory!', date: '2026-06-29T12:00:00Z' }
    ]
  },
  {
    id: 'v2',
    name: 'Tecno Official Outlet Kampala',
    ownerName: 'Justin Chen',
    email: 'kampala@tecno-mobile.com',
    phone: '0702 456789',
    location: 'Kampala Plaza',
    category: 'phones',
    status: 'approved',
    balance: 2380000,
    totalSales: 2800000,
    paymentDetails: 'MTN Mobile Money - 0772123456',
    trustBadges: ['Highly Recommended', 'Speedy Processing'],
    reviews: [
      { id: 'rev-v2-1', customerName: 'Nakato Sarah', rating: 5, comment: 'Incredible speed in packaging and very responsive support!', date: '2026-07-01T15:20:00Z' }
    ]
  },
  {
    id: 'v3',
    name: 'Ssebaggala Mobiles Ltd',
    ownerName: 'Moses Ssebaggala',
    email: 'sseba.mobiles@gmail.com',
    phone: '0772 555666',
    location: 'Wandegeya',
    category: 'phones',
    status: 'pending', // Temporary Gate trigger
    balance: 0,
    totalSales: 0,
    paymentDetails: 'Airtel Money - 0702555666',
    trustBadges: [],
    reviews: []
  }
];

const INITIAL_WITHDRAWALS: WithdrawalRequest[] = [
  {
    id: 'w1',
    vendorId: 'v1',
    vendorName: 'Mukwano Industries Online',
    amount: 250000,
    method: 'bank',
    details: 'Standard Chartered - Emmanuel Mukwano',
    status: 'approved',
    createdAt: '2026-06-28T14:30:00Z'
  },
  {
    id: 'w2',
    vendorId: 'v2',
    vendorName: 'Tecno Official Outlet Kampala',
    amount: 500000,
    method: 'momo',
    details: '0772123456 (Justin Chen)',
    status: 'pending',
    createdAt: '2026-07-01T10:15:00Z'
  }
];

const INITIAL_ORDERS: DokanOrder[] = [
  {
    id: 'ORDER-10492',
    customerName: 'Nakato Sarah',
    customerPhone: '0772 888999',
    customerAddress: 'Kiwatule Rd near Shell Station',
    customerLocation: 'Kampala (Nakawa)',
    items: [
      {
        product: {
          id: 'p1',
          title: 'Tecno Spark 20 Pro - High Speed Dual SIM Smartphone',
          price: 685000,
          category: 'phones',
          image: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=400&q=80',
          rating: 4.6,
          reviewsCount: 142,
          brand: 'Tecno',
          isFlashSale: true,
          isOfficial: true,
          freeDelivery: true,
          payOnDelivery: true,
          inStock: true
        },
        quantity: 1,
        selectedVendor: 'Tecno Official Outlet Kampala'
      }
    ],
    subtotal: 685000,
    deliveryFee: 9600, // calculated standard rate
    total: 694600,
    paymentMethod: 'momo',
    paymentDetails: '0772 888999',
    status: 'transit',
    commission: 102750, // 15%
    vendorEarnings: 582250, // 85%
    createdAt: '2026-07-01T15:20:00Z',
    distanceKm: 8
  },
  {
    id: 'ORDER-10493',
    customerName: 'Sempijja Ronald',
    customerPhone: '0702 333444',
    customerAddress: 'Jinja Road opposite Nile Breweries',
    customerLocation: 'Jinja',
    items: [
      {
        product: {
          id: 'p29',
          title: 'Mukwano Laundry Bar Soap - White (Box of 10 Bars)',
          price: 22500,
          category: 'supermarket',
          image: 'https://picsum.photos/seed/soap/400/400',
          rating: 4.9,
          reviewsCount: 512,
          brand: 'Mukwano',
          isFlashSale: true,
          isOfficial: true,
          freeDelivery: false,
          payOnDelivery: true,
          inStock: true
        },
        quantity: 2,
        selectedVendor: 'Mukwano Industries Online'
      }
    ],
    subtotal: 45000,
    deliveryFee: 96000, // Far & heavy package
    total: 141000,
    paymentMethod: 'stripe',
    paymentDetails: 'Visa ending 4242',
    status: 'placed',
    commission: 6750,
    vendorEarnings: 38250,
    createdAt: '2026-07-02T01:10:00Z',
    distanceKm: 80
  }
];

const INITIAL_COMMENTS: CustomerComment[] = [
  {
    id: 'c1',
    customerName: 'Nakato Sarah',
    productTitle: 'Tecno Spark 20 Pro - High Speed Dual SIM Smartphone',
    rating: 5,
    comment: 'Authentic product, lightning-fast Boda delivery, and the e-wallet checkout options worked seamlessly. A+',
    date: 'July 01, 2026'
  },
  {
    id: 'c2',
    customerName: 'Kato Derrick',
    productTitle: 'Mukwano Laundry Bar Soap',
    rating: 4,
    comment: 'Best laundry soap in Uganda, original box received in Mukono. Transport fee was automatically calculated, very fair.',
    date: 'June 30, 2026'
  }
];

const INITIAL_BRANDS = ['Tecno', 'Infinix', 'Samsung', 'Apple', 'Hisense', 'LG', 'Mukwano', 'Jesa', 'Nivea', 'Movit'];
const INITIAL_TAGS = ['Best Seller', 'Official Warranty', 'Flash Deal', 'Ugandan Made', 'Top Brand', 'Bulk Save'];

// Getters and Setters from localStorage
export function getDokanVendors(): DokanVendor[] {
  const saved = localStorage.getItem('dokan_vendors');
  if (saved) return JSON.parse(saved);
  localStorage.setItem('dokan_vendors', JSON.stringify(INITIAL_VENDORS));
  return INITIAL_VENDORS;
}

export function saveDokanVendors(vendors: DokanVendor[]) {
  localStorage.setItem('dokan_vendors', JSON.stringify(vendors));
}

export function getDokanWithdrawals(): WithdrawalRequest[] {
  const saved = localStorage.getItem('dokan_withdrawals');
  if (saved) return JSON.parse(saved);
  localStorage.setItem('dokan_withdrawals', JSON.stringify(INITIAL_WITHDRAWALS));
  return INITIAL_WITHDRAWALS;
}

export function saveDokanWithdrawals(withdrawals: WithdrawalRequest[]) {
  localStorage.setItem('dokan_withdrawals', JSON.stringify(withdrawals));
}

export function getDokanOrders(): DokanOrder[] {
  const saved = localStorage.getItem('dokan_orders');
  if (saved) return JSON.parse(saved);
  localStorage.setItem('dokan_orders', JSON.stringify(INITIAL_ORDERS));
  return INITIAL_ORDERS;
}

export function saveDokanOrders(orders: DokanOrder[]) {
  localStorage.setItem('dokan_orders', JSON.stringify(orders));
}

export function getDokanComments(): CustomerComment[] {
  const saved = localStorage.getItem('dokan_comments');
  if (saved) return JSON.parse(saved);
  localStorage.setItem('dokan_comments', JSON.stringify(INITIAL_COMMENTS));
  return INITIAL_COMMENTS;
}

export function saveDokanComments(comments: CustomerComment[]) {
  localStorage.setItem('dokan_comments', JSON.stringify(comments));
}

export function getDokanCategories(): DokanCategory[] {
  const saved = localStorage.getItem('dokan_categories');
  if (saved) return JSON.parse(saved);
  const defCats = [
    { id: 'phones', name: 'Phones & Tablets', icon: 'Smartphone', imageUrl: '' },
    { id: 'electronics', name: 'Electronics', icon: 'Tv', imageUrl: '' },
    { id: 'fashion', name: 'Fashion', icon: 'Shirt', imageUrl: '' },
    { id: 'home', name: 'Home & Office', icon: 'Home', imageUrl: '' },
    { id: 'beauty', name: 'Health & Beauty', icon: 'Sparkles', imageUrl: '' },
    { id: 'supermarket', name: 'Supermarket', icon: 'ShoppingBag', imageUrl: '' },
    { id: 'farmers-market', name: 'Farmers Market', icon: 'Leaf', imageUrl: '' },
  ];
  localStorage.setItem('dokan_categories', JSON.stringify(defCats));
  return defCats;
}

export function saveDokanCategories(cats: DokanCategory[]) {
  localStorage.setItem('dokan_categories', JSON.stringify(cats));
}

export function getDokanBrands(): string[] {
  const saved = localStorage.getItem('dokan_brands');
  if (saved) return JSON.parse(saved);
  localStorage.setItem('dokan_brands', JSON.stringify(INITIAL_BRANDS));
  return INITIAL_BRANDS;
}

export function saveDokanBrands(brands: string[]) {
  localStorage.setItem('dokan_brands', JSON.stringify(brands));
}

export function getDokanTags(): string[] {
  const saved = localStorage.getItem('dokan_tags');
  if (saved) return JSON.parse(saved);
  localStorage.setItem('dokan_tags', JSON.stringify(INITIAL_TAGS));
  return INITIAL_TAGS;
}

export function saveDokanTags(tags: string[]) {
  localStorage.setItem('dokan_tags', JSON.stringify(tags));
}

export interface DokanRider {
  id: string;
  name: string;
  phone: string;
  motorcyclePlate: string;
  location: string;
  completedDeliveries: number;
  earnings: number;
  transportMeans: 'boda' | 'bicycle' | 'van' | 'truck';
  helmetOrHub?: string;
  cargoVolume?: string;
  licenseTonnage?: string;
  trustBadges?: string[];
  reviews?: { id: string; customerName: string; rating: number; comment: string; date: string }[];
}

const INITIAL_RIDERS: DokanRider[] = [
  { id: 'r1', name: 'Sula Boda Boda Mukono [DKN-RDR-719]', phone: '0772 123456', motorcyclePlate: 'UFA 450Y', location: 'Mukono Town', completedDeliveries: 12, earnings: 84000, transportMeans: 'boda', helmetOrHub: 'HELMET-771', trustBadges: ['Safe Rider', 'Rainproof Box'], reviews: [{ id: 'rev-r1-1', customerName: 'Kato Derrick', rating: 5, comment: 'Delivered in heavy rain, but package stayed 100% dry inside his rainproof carrier box!', date: '2026-06-30T10:00:00Z' }] },
  { id: 'r2', name: 'Ronald Express Kampala [DKN-RDR-114]', phone: '0701 987654', motorcyclePlate: 'UEG 112Z', location: 'Kampala Central', completedDeliveries: 45, earnings: 320000, transportMeans: 'boda', helmetOrHub: 'HELMET-102', trustBadges: ['Always Punctual', 'Safe Rider'], reviews: [{ id: 'rev-r2-1', customerName: 'Nakato Sarah', rating: 5, comment: 'Extremely fast Boda Boda, very polite and professional driver.', date: '2026-07-01T15:20:00Z' }] },
  { id: 'r3', name: 'Patrick Wakiso Courier [DKN-RDR-889]', phone: '0755 456789', motorcyclePlate: 'UEX 889A', location: 'Wakiso Center', completedDeliveries: 8, earnings: 45500, transportMeans: 'van', cargoVolume: '15 Cubic Meters', trustBadges: ['Excellent Communication'], reviews: [] }
];

export function getDokanRiders(): DokanRider[] {
  const saved = localStorage.getItem('dokan_riders');
  if (saved) return JSON.parse(saved);
  localStorage.setItem('dokan_riders', JSON.stringify(INITIAL_RIDERS));
  return INITIAL_RIDERS;
}

export function saveDokanRiders(riders: DokanRider[]) {
  localStorage.setItem('dokan_riders', JSON.stringify(riders));
}

export interface AdminLog {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  severity: 'info' | 'warning' | 'critical' | 'success';
  ipAddress: string;
}

export function getAdminLogs(): AdminLog[] {
  const saved = localStorage.getItem('dokan_admin_logs');
  if (saved) return JSON.parse(saved);
  const initialLogs: AdminLog[] = [
    {
      id: 'log-1',
      timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
      action: 'SYSTEM_BOOT',
      details: 'Olimart Dokan central database initialized on port 3000.',
      severity: 'info',
      ipAddress: '127.0.0.1'
    },
    {
      id: 'log-2',
      timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
      action: 'VENDOR_APPROVAL',
      details: 'Vendor store "Mukwano Industries Online" has been successfully approved.',
      severity: 'success',
      ipAddress: '192.168.1.102'
    }
  ];
  localStorage.setItem('dokan_admin_logs', JSON.stringify(initialLogs));
  return initialLogs;
}

export function saveAdminLogs(logs: AdminLog[]) {
  localStorage.setItem('dokan_admin_logs', JSON.stringify(logs));
}

export function addAdminLog(action: string, details: string, severity: 'info' | 'warning' | 'critical' | 'success' = 'info') {
  const logs = getAdminLogs();
  const newLog: AdminLog = {
    id: `log-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    action,
    details,
    severity,
    ipAddress: `197.156.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`
  };
  logs.unshift(newLog);
  saveAdminLogs(logs);
  window.dispatchEvent(new Event('storage'));
}

