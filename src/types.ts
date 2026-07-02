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
