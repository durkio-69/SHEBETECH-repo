export interface ProductVariation {
  name: string; // e.g., "Storage" or "Size" or "Color"
  options: string[]; // e.g., ["128GB", "256GB"]
  priceModifiers?: Record<string, number>; // Extra price for each option, e.g., {"256GB": 150000}
}

export interface ProductVendor {
  id: string;
  name: string;
  price: number;
  rating: number; // Customer rating on vendor
  reviewsCount: number;
  deliveryTime: string;
  deliveryRating?: number; // Customer rating on delivery
  shippingFee: number;
  isOfficial: boolean;
  location: string;
}

export interface ProductReview {
  name: string;
  location: string;
  rating: number;
  text: string;
  date: string;
  likes: number;
}

export interface PriceTier {
  minQty: number;
  discountPercent: number; // WooCommerce Dynamic Pricing-style bulk discount
}

export interface Product {
  id: string;
  title: string;
  price: number; // in UGX
  originalPrice?: number; // in UGX, for discounts
  category: string;
  image: string;
  rating: number;
  reviewsCount: number;
  discountBadge?: string; // e.g. "-25%"
  brand: string;
  isFlashSale: boolean;
  isOfficial: boolean; // Official verified seller badge
  freeDelivery: boolean;
  payOnDelivery: boolean;
  inStock: boolean;
  variations?: ProductVariation[];
  vendors?: ProductVendor[];
  reviews?: ProductReview[];
  tags?: string[];

  // --- Inventory (WooCommerce-style stock management) ---
  stockQuantity?: number;
  allowBackorder?: boolean;   // sellable while stockQuantity is 0, fulfilled once restocked
  lowStockThreshold?: number;

  // --- Attributes, beyond the free-text `brand` field ---
  attributes?: Record<string, string[]>; // e.g. { "Color": ["Black","Blue"], "Material": ["Cotton"] }

  // --- Dynamic pricing (WooCommerce Dynamic Pricing) ---
  priceTiers?: PriceTier[];

  // --- Description of record ---
  // The vendor who lists the product must always provide it; the admin can
  // add or override a moderated description without erasing what the
  // vendor originally wrote — both are kept and visible to every
  // stakeholder that touches the order.
  vendorId?: string;
  vendorDescription?: string;
  adminDescription?: string;
  descriptionUpdatedBy?: string;
  descriptionUpdatedAt?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedVariation?: Record<string, string>; // e.g., {"Storage": "256GB", "Color": "Lunar Frost"}
  selectedVendor?: string; // vendor name
  customPrice?: number; // vendor-specific price
}

export interface Category {
  id: string;
  name: string;
  icon: string; // lucide icon name
  imageUrl: string; // fallback image
  parentId?: string; // set for subcategories (Dokan Pro category tree)
}

// --- Vendor storefront branding + SEO (Dokan Pro "Store Customizer") ---
export interface VendorStorefront {
  vendorId: string;
  bannerUrl?: string;
  logoUrl?: string;
  storeSlug: string;          // e.g. olimart.ug/store/{storeSlug}
  seoTitle?: string;
  seoDescription?: string;
  aboutText?: string;
  socialLinks?: Record<string, string>;
}

export interface PromoBanner {
  id: string;
  title: string;
  subtitle: string;
  ctaText: string;
  imageUrl: string;
  bgColor: string;
  accentColor: string;
}

export interface FilterState {
  searchQuery: string;
  category: string;
  priceRange: [number, number];
  brand: string[];
  minRating: number;
  deliveryOption: 'all' | 'free' | 'payOnDelivery';
  sortBy: 'popularity' | 'priceLowToHigh' | 'priceHighToLow' | 'discount';
}
