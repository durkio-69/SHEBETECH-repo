/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import HeroCarousel from './components/HeroCarousel';
import CategoryGrid from './components/CategoryGrid';
import FlashSales from './components/FlashSales';
import ProductSection from './components/ProductSection';
import TrustBadges from './components/TrustBadges';
import VendorHighlight from './components/VendorHighlight';
import CartDrawer from './components/CartDrawer';
import Footer from './components/Footer';
import ProductDetailModal from './components/ProductDetailModal';
import ProductPage from './components/ProductPage';
import JumiaCirclesBanner from './components/JumiaCirclesBanner';
import AccountModal from './components/AccountModal';
import DealsPage from './components/DealsPage';
import AmazonShowcase from './components/AmazonShowcase';
import RecentSearchesSection from './components/RecentSearchesSection';
import VendorApp from './components/VendorApp';
import DeliveryApp from './components/DeliveryApp';
import AdminApp from './components/AdminApp';
import { Product, CartItem } from './types';
import { CATEGORIES, PRODUCTS } from './data';
import { CheckCircle2, Home, User, ShoppingCart, Info, X, Briefcase, MapPin, Key, Laptop, Star } from 'lucide-react';

export default function App() {
  // Global platform app state: customer, vendor, delivery, admin
  const [activeApp, setActiveApp] = useState<'customer' | 'vendor' | 'delivery' | 'admin'>('customer');

  // Dynamic Products List state (Dokan Pro synchronized)
  const [products, setProducts] = useState<Product[]>(PRODUCTS);

  // Shopping Cart state
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Filter & Navigation states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('Kampala (Central)');

  // Currency & Language settings
  const [currency, setCurrency] = useState<'UGX' | 'USD' | 'EUR' | 'KES'>('UGX');
  const [language, setLanguage] = useState<'EN' | 'LG' | 'SW' | 'FR'>('EN');
  
  // Watchlist & Special deals navigation
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [selectedSpecialTab, setSelectedSpecialTab] = useState<'all' | 'todays-deal' | 'flash-sales' | 'discount'>('all');
  
  // Dark mode integration
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Custom Promotion Alert box state
  const [activePromotion, setActivePromotion] = useState<{ title: string; desc: string } | null>(null);

  // Account Portal Modal state
  const [isAccountOpen, setIsAccountOpen] = useState(false);

  // Product specification details modal state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Dedicated product page view state
  const [activeProductPage, setActiveProductPage] = useState<Product | null>(null);

  // Recent Searched/Viewed Products
  const [recentSearches, setRecentSearches] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('olimart_recent_searches');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const addToRecentSearches = (product: Product) => {
    setRecentSearches((prev) => {
      const filtered = prev.filter((p) => p.id !== product.id);
      const updated = [product, ...filtered].slice(0, 10);
      try {
        localStorage.setItem('olimart_recent_searches', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  };

  // Auto return to listing view when user searches or filters
  useEffect(() => {
    if (searchQuery) {
      setActiveProductPage(null);
    }
  }, [searchQuery]);

  useEffect(() => {
    if (selectedCategory !== 'all') {
      setActiveProductPage(null);
    }
  }, [selectedCategory]);

  // Temporary Toast/Notification Feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    const timer = setTimeout(() => {
      setToastMessage(null);
    }, 3000);
    return () => clearTimeout(timer);
  };

  // Sync dark mode style on HTML body
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Real-time automatic location and currency detection with zero restrictions (Requirement 4)
  useEffect(() => {
    let active = true;

    // 1. IP Geolocation for immediate smart detection
    fetch('https://ipapi.co/json/')
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        if (!active) return;
        if (data.city && data.country_name) {
          setSelectedLocation(`${data.city}, ${data.country_name}`);
          showToast(`Detected location: ${data.city}, ${data.country_name}`);
        }
        if (data.currency) {
          const matchedCurrency = data.currency as any;
          if (['UGX', 'USD', 'EUR', 'KES'].includes(matchedCurrency)) {
            setCurrency(matchedCurrency);
          } else if (data.country_code === 'KE') {
            setCurrency('KES');
          } else if (data.country_code === 'UG') {
            setCurrency('UGX');
          } else if (['FR', 'DE', 'IT', 'ES', 'NL', 'BE'].includes(data.country_code)) {
            setCurrency('EUR');
          } else {
            setCurrency('USD');
          }
        }
      })
      .catch(() => {
        // 2. High-precision GPS Geolocation fallback if permitted
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              if (!active) return;
              const lat = position.coords.latitude;
              const lon = position.coords.longitude;
              setSelectedLocation(`GPS [${lat.toFixed(3)}, ${lon.toFixed(3)}]`);
              showToast("Location updated with active GPS coordinates.");
            },
            () => {}
          );
        }
      });

    return () => {
      active = false;
    };
  }, []);

  // Currency utility converter
  const formatPrice = (priceInUgx: number) => {
    if (currency === 'USD') {
      const converted = priceInUgx / 3700;
      return `$${converted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else if (currency === 'EUR') {
      const converted = priceInUgx / 4000;
      return `€${converted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else if (currency === 'KES') {
      const converted = priceInUgx / 28;
      return `KSh ${Math.round(converted).toLocaleString()}`;
    } else {
      return `Shs ${priceInUgx.toLocaleString()}`;
    }
  };

  // Watchlist addition/removal
  const handleToggleWatchlist = (productId: string) => {
    setWatchlist(prev => {
      const isAlreadyIn = prev.includes(productId);
      if (isAlreadyIn) {
        showToast("Removed product from your watchlist.");
        return prev.filter(id => id !== productId);
      } else {
        showToast("Added product to your watchlist!");
        return [...prev, productId];
      }
    });
  };

  // Click details trigger
  const handleProductClick = (product: Product) => {
    setActiveProductPage(product);
    addToRecentSearches(product);
  };

  // Quick View details trigger
  const handleQuickView = (product: Product) => {
    setSelectedProduct(product);
    setIsDetailsOpen(true);
    addToRecentSearches(product);
  };

  // Cart operations with supporting quantities
  const handleAddToCart = (
    product: Product, 
    quantity = 1, 
    selectedVariation?: Record<string, string>, 
    selectedVendor?: string, 
    customPrice?: number
  ) => {
    setCartItems((prevItems) => {
      const existing = prevItems.find((item) => {
        const sameId = item.product.id === product.id;
        const sameVendor = item.selectedVendor === selectedVendor;
        const sameVariation = JSON.stringify(item.selectedVariation) === JSON.stringify(selectedVariation);
        return sameId && sameVendor && sameVariation;
      });

      if (existing) {
        return prevItems.map((item) => {
          const sameId = item.product.id === product.id;
          const sameVendor = item.selectedVendor === selectedVendor;
          const sameVariation = JSON.stringify(item.selectedVariation) === JSON.stringify(selectedVariation);
          if (sameId && sameVendor && sameVariation) {
            return { ...item, quantity: item.quantity + quantity };
          }
          return item;
        });
      }
      return [...prevItems, { product, quantity, selectedVariation, selectedVendor, customPrice }];
    });

    // Display temporary success toast
    showToast(`"${product.title.split(' - ')[0]}" added to your basket!`);
  };

  const handleUpdateQuantity = (
    productId: string, 
    delta: number, 
    selectedVariation?: Record<string, string>, 
    selectedVendor?: string
  ) => {
    setCartItems((prevItems) => {
      return prevItems
        .map((item) => {
          const sameId = item.product.id === productId;
          const sameVendor = item.selectedVendor === selectedVendor;
          const sameVariation = JSON.stringify(item.selectedVariation) === JSON.stringify(selectedVariation);
          if (sameId && sameVendor && sameVariation) {
            const nextQty = item.quantity + delta;
            return { ...item, quantity: nextQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0);
    });
  };

  const handleRemoveItem = (
    productId: string, 
    selectedVariation?: Record<string, string>, 
    selectedVendor?: string
  ) => {
    setCartItems((prevItems) => 
      prevItems.filter((item) => {
        const sameId = item.product.id === productId;
        const sameVendor = item.selectedVendor === selectedVendor;
        const sameVariation = JSON.stringify(item.selectedVariation) === JSON.stringify(selectedVariation);
        return !(sameId && sameVendor && sameVariation);
      })
    );
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const totalCartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-slate-800 dark:bg-slate-950 dark:text-slate-100 flex flex-col justify-between font-sans transition-colors duration-200">
      
      {/* 1. Navigation Header */}
      <Header
        cartItemsCount={totalCartCount}
        onCartClick={() => setIsCartOpen(true)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        selectedLocation={selectedLocation}
        setSelectedLocation={setSelectedLocation}
        currency={currency}
        setCurrency={setCurrency}
        language={language}
        setLanguage={setLanguage}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        watchlist={watchlist}
        onWatchlistToggle={handleToggleWatchlist}
        onProductClick={handleProductClick}
        formatPrice={formatPrice}
        selectedSpecialTab={selectedSpecialTab}
        setSelectedSpecialTab={setSelectedSpecialTab}
        onAccountClick={() => setIsAccountOpen(true)}
      />

      {/* E-Commerce Multi-Portal Subheader Switcher */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800/80 sticky top-[72px] z-40 transition-colors">
        <div className="max-w-7xl mx-auto px-4 py-2.5 sm:py-3 flex flex-wrap items-center justify-between gap-3">
          
          {/* Active app portal description label */}
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#f68b1e] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#f68b1e]"></span>
            </span>
            <p className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Active Portal: <span className="text-[#f68b1e] font-extrabold">{activeApp === 'customer' ? 'Kampala Customer App' : activeApp === 'vendor' ? 'WooCommerce Dokan Pro Vendor App' : activeApp === 'delivery' ? 'Boda Boda Courier dispatch' : 'Central Super Admin Console'}</span>
            </p>
          </div>

          {/* Quick switcher buttons list */}
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => {
                setActiveApp('customer');
                setActiveProductPage(null);
                setSelectedSpecialTab('all');
              }}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                activeApp === 'customer'
                  ? 'bg-[#f68b1e] text-white shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <Laptop size={14} />
              <span className="hidden md:inline">Customer App</span>
              <span className="inline md:hidden">Customer</span>
            </button>

            <button
              onClick={() => setActiveApp('vendor')}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                activeApp === 'vendor'
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <Briefcase size={14} />
              <span className="hidden md:inline">Vendors App</span>
              <span className="inline md:hidden">Vendor</span>
            </button>

            <button
              onClick={() => setActiveApp('delivery')}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                activeApp === 'delivery'
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <MapPin size={14} />
              <span className="hidden md:inline">Boda Delivery</span>
              <span className="inline md:hidden">Delivery</span>
            </button>

            <button
              onClick={() => setActiveApp('admin')}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                activeApp === 'admin'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <Key size={14} />
              <span className="hidden md:inline">Super Admin</span>
              <span className="inline md:hidden">Admin</span>
            </button>
          </div>

        </div>
      </div>

      {/* Main Content Layout */}
      <main className="flex-1 space-y-4 pb-16 md:pb-12">
        {activeApp === 'vendor' ? (
          <VendorApp products={products} setProducts={setProducts} formatPrice={formatPrice} />
        ) : activeApp === 'delivery' ? (
          <DeliveryApp formatPrice={formatPrice} />
        ) : activeApp === 'admin' ? (
          <AdminApp products={products} setProducts={setProducts} formatPrice={formatPrice} />
        ) : (
          /* Customer App Views */
          activeProductPage ? (
          <ProductPage
            product={activeProductPage}
            onBack={() => setActiveProductPage(null)}
            onAddToCart={handleAddToCart}
            watchlist={watchlist}
            onToggleWatchlist={handleToggleWatchlist}
            formatPrice={formatPrice}
            onProductClick={(p) => setActiveProductPage(p)}
          />
        ) : selectedSpecialTab !== 'all' ? (
          <DealsPage
            type={selectedSpecialTab}
            onBack={() => setSelectedSpecialTab('all')}
            onAddToCart={handleAddToCart}
            onProductClick={handleProductClick}
            watchlist={watchlist}
            onToggleWatchlist={handleToggleWatchlist}
            formatPrice={formatPrice}
          />
        ) : (
          <div className="space-y-4">
            {/* 2. Hero Section: promo banner carousel + deal of the day */}
            <HeroCarousel 
              onAddToCart={handleAddToCart} 
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />

            {/* Jumia Circles Banner (Requirement 1 & 5) */}
            <JumiaCirclesBanner
              onCategorySelect={setSelectedCategory}
              onSpecialTabSelect={setSelectedSpecialTab}
              onShowPromotion={(title, desc) => setActivePromotion({ title, desc })}
              currentCategory={selectedCategory}
            />

            {/* 3. Browse Trending Slide Section (replacing Categories list) */}
            <CategoryGrid
              selectedCategory={selectedCategory}
              onSelectCategory={(catId) => {
                setSelectedCategory(catId);
                // Scroll down to the catalog to feel responsive
                const catalog = document.getElementById('shop-catalog-section');
                if (catalog) {
                  catalog.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              onProductClick={handleProductClick}
              onAddToCart={handleAddToCart}
              watchlist={watchlist}
              onToggleWatchlist={handleToggleWatchlist}
              formatPrice={formatPrice}
            />

            {/* Show FlashSales & Catalog Grid ONLY when a category is selected or user searches */}
            {(selectedCategory !== 'all' || searchQuery !== '') ? (
              <>
                {/* Jumia Horizontal Category Products Shelf (Requirement 3) */}
                {selectedCategory !== 'all' && (
                  <div 
                    id="jumia-horizontal-category-products" 
                    className="max-w-7xl mx-auto px-4 my-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-5 shadow-xs relative"
                  >
                    <div className="absolute top-0 left-0 right-0 h-[4px] bg-[#f68b1e] rounded-t-2xl" />
                    
                    <div className="flex justify-between items-center mb-5 border-b border-slate-100 dark:border-slate-800/60 pb-3">
                      <div>
                        <h2 className="text-base font-black uppercase text-slate-800 dark:text-white flex items-center gap-2">
                          <span className="w-2.5 h-4 bg-[#f68b1e] rounded-xs animate-pulse" />
                          <span>Featured {CATEGORIES.find(c => c.id === selectedCategory)?.name || 'Products'} Deals</span>
                        </h2>
                        <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                          Swipe horizontally to discover handpicked listings with instant Express Boda Boda dispatch
                        </p>
                      </div>
                      <button 
                        onClick={() => setSelectedCategory('all')} 
                        className="text-xs font-black uppercase text-[#f68b1e] hover:text-[#e07510]"
                      >
                        Clear Filter
                      </button>
                    </div>

                    {/* Horizontal Product Scrollbar */}
                    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none snap-x touch-pan-x">
                      {products.filter(p => p.category === selectedCategory).map((p) => {
                        const hasDiscount = p.originalPrice && p.originalPrice > p.price;
                        return (
                          <div 
                            key={`cat-horiz-${p.id}`}
                            className="w-[180px] sm:w-[220px] bg-slate-50/50 dark:bg-slate-950/20 rounded-2xl border border-slate-100 dark:border-slate-800/60 p-3 hover:shadow-md transition-all group flex-shrink-0 snap-start flex flex-col justify-between"
                          >
                            <div>
                              <div className="relative aspect-square bg-white dark:bg-slate-900 rounded-xl p-2 flex items-center justify-center overflow-hidden">
                                <img 
                                  src={p.image} 
                                  alt={p.title} 
                                  className="max-h-24 object-contain group-hover:scale-105 transition-transform cursor-pointer"
                                  onClick={() => handleProductClick(p)}
                                  referrerPolicy="no-referrer"
                                />
                                {hasDiscount && (
                                  <span className="absolute top-1.5 left-1.5 bg-red-600 text-white text-[8px] font-extrabold px-1.5 py-0.5 rounded">
                                    {p.discountBadge || 'SAVE'}
                                  </span>
                                )}
                              </div>
                              <div className="mt-3.5 space-y-1">
                                <span className="text-[9px] text-[#f68b1e] font-extrabold uppercase">{p.brand}</span>
                                <h3 
                                  onClick={() => handleProductClick(p)}
                                  className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-2 hover:text-[#f68b1e] cursor-pointer min-h-[32px] leading-tight"
                                >
                                  {p.title}
                                </h3>
                              </div>
                            </div>

                            <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between gap-1">
                              <div>
                                <span className="block text-xs font-black text-slate-900 dark:text-slate-100">
                                  {formatPrice(p.price)}
                                </span>
                                {hasDiscount && (
                                  <span className="text-[9px] text-slate-400 line-through">
                                    {formatPrice(p.originalPrice!)}
                                  </span>
                                )}
                              </div>
                              <button
                                onClick={() => handleAddToCart(p)}
                                className="bg-[#f68b1e]/10 hover:bg-[#f68b1e] text-[#f68b1e] hover:text-white p-2 rounded-xl transition-colors cursor-pointer"
                              >
                                <ShoppingCart size={13} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 4. Limited Hot Flash Sales banner */}
                <FlashSales 
                  onAddToCart={handleAddToCart}
                  onProductClick={handleProductClick}
                  watchlist={watchlist}
                  onToggleWatchlist={handleToggleWatchlist}
                  formatPrice={formatPrice}
                />

                {/* 5. Main Interactive Search & Filter Catalog */}
                <ProductSection
                  onAddToCart={handleAddToCart}
                  selectedCategory={selectedCategory}
                  setSelectedCategory={setSelectedCategory}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  selectedSpecialTab={selectedSpecialTab}
                  setSelectedSpecialTab={setSelectedSpecialTab}
                  onProductClick={handleProductClick}
                  onQuickView={handleQuickView}
                  watchlist={watchlist}
                  onToggleWatchlist={handleToggleWatchlist}
                  formatPrice={formatPrice}
                  products={products}
                />
              </>
            ) : (
              /* High-fidelity Amazon copy showcase (Hot Deals + Best Sellers in original Amazon grid displays) */
              <AmazonShowcase
                products={products}
                onProductClick={handleProductClick}
                onAddToCart={handleAddToCart}
                onSpecialTabSelect={setSelectedSpecialTab}
                formatPrice={formatPrice}
              />
            )}

            {/* Recent Searched & Personalized Related Feed Section (Requirement 2) */}
            <RecentSearchesSection
              recentSearches={recentSearches}
              onProductClick={handleProductClick}
              onAddToCart={handleAddToCart}
              onClearHistory={() => {
                setRecentSearches([]);
                try {
                  localStorage.removeItem('olimart_recent_searches');
                } catch {}
                showToast("Cleared your search and view history.");
              }}
              formatPrice={formatPrice}
              watchlist={watchlist}
              onToggleWatchlist={handleToggleWatchlist}
            />

            {/* 6. Sell on marketplace call to action banner */}
            <VendorHighlight />

            {/* 7. Values guarantees and trust badges - moved to the end of main layout */}
            <TrustBadges />
          </div>
          )
        )}
      </main>

      {/* 8. Shopping Cart Drawer slider */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
        selectedLocation={selectedLocation}
      />

      {/* 9. Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 md:bottom-6 left-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 border border-slate-800 animate-slide-up max-w-sm">
          <CheckCircle2 className="text-emerald-500 flex-shrink-0" size={18} />
          <p className="text-xs font-bold leading-normal">{toastMessage}</p>
        </div>
      )}

      {/* 10. Product Detail Modal */}
      <ProductDetailModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        product={selectedProduct}
        onAddToCart={handleAddToCart}
        watchlist={watchlist}
        onToggleWatchlist={handleToggleWatchlist}
        formatPrice={formatPrice}
      />

      {/* 11. Secure Account VIP Portal Modal */}
      <AccountModal
        isOpen={isAccountOpen}
        onClose={() => setIsAccountOpen(false)}
        onShowToast={showToast}
        currency={currency}
        onAddToCart={handleAddToCart}
      />

      {/* 12. Custom Interactive Promotion Modal */}
      {activePromotion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setActivePromotion(null)} 
              className="absolute right-4 top-4 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-400 cursor-pointer"
            >
              <X size={16} />
            </button>
            <div className="flex items-center gap-3 mb-4 text-[#f68b1e]">
              <Info size={24} />
              <h3 className="font-black uppercase tracking-wider text-sm text-slate-900 dark:text-slate-100">
                {activePromotion.title}
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed mb-4">
              {activePromotion.desc}
            </p>
            <button 
              onClick={() => setActivePromotion(null)}
              className="w-full bg-[#f68b1e] hover:bg-[#e07510] text-white py-2.5 rounded-xl font-bold text-xs transition-all uppercase tracking-wider shadow-sm cursor-pointer"
            >
              Understood, Great!
            </button>
          </div>
        </div>
      )}

      {/* 13. Mobile Bottom Navigation Bar (Requirement 3) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-2.5 px-3 flex justify-around items-center z-40 shadow-xl">
        <button 
          onClick={() => {
            setSelectedCategory('all');
            setSelectedSpecialTab('all');
            setActiveProductPage(null);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }} 
          className="flex flex-col items-center text-slate-500 hover:text-[#f68b1e] transition-colors cursor-pointer"
        >
          <Home size={18} className={selectedCategory === 'all' && !activeProductPage && selectedSpecialTab === 'all' ? 'text-[#f68b1e]' : 'text-slate-500 dark:text-slate-400'} />
          <span className={`text-[9px] font-bold mt-0.5 ${selectedCategory === 'all' && !activeProductPage && selectedSpecialTab === 'all' ? 'text-[#f68b1e]' : 'text-slate-500 dark:text-slate-400'}`}>Home</span>
        </button>
        
        <button 
          onClick={() => {
            setSelectedSpecialTab('flash-sales');
            setActiveProductPage(null);
            const element = document.getElementById('flash-sales-section');
            if (element) {
              element.scrollIntoView({ behavior: 'smooth' });
            }
          }} 
          className="flex flex-col items-center text-slate-500 hover:text-[#f68b1e] transition-colors cursor-pointer"
        >
          <span className="relative">
            <CheckCircle2 size={18} className={selectedSpecialTab === 'flash-sales' ? 'text-[#f68b1e]' : 'text-slate-500 dark:text-slate-400'} />
            <span className="absolute -top-1 -right-1.5 bg-red-600 text-white text-[7px] font-black px-1 rounded-full uppercase scale-75 animate-pulse">Hot</span>
          </span>
          <span className={`text-[9px] font-bold mt-0.5 ${selectedSpecialTab === 'flash-sales' ? 'text-[#f68b1e]' : 'text-slate-500 dark:text-slate-400'}`}>Flash Deals</span>
        </button>

        <button 
          onClick={() => setIsAccountOpen(true)} 
          className="flex flex-col items-center text-slate-500 hover:text-[#f68b1e] transition-colors cursor-pointer"
        >
          <User size={18} className={isAccountOpen ? 'text-[#f68b1e]' : 'text-slate-500 dark:text-slate-400'} />
          <span className={`text-[9px] font-bold mt-0.5 ${isAccountOpen ? 'text-[#f68b1e]' : 'text-slate-500 dark:text-slate-400'}`}>Account</span>
        </button>

        <button 
          onClick={() => setIsCartOpen(true)} 
          className="flex flex-col items-center text-slate-500 hover:text-[#f68b1e] transition-colors relative cursor-pointer"
        >
          {totalCartCount > 0 && (
            <span className="absolute -top-1.5 -right-2 bg-red-600 text-white font-black text-[8px] w-4.5 h-4.5 rounded-full flex items-center justify-center shadow-md animate-pulse">
              {totalCartCount}
            </span>
          )}
          <ShoppingCart size={18} className={isCartOpen ? 'text-[#f68b1e]' : 'text-slate-500 dark:text-slate-400'} />
          <span className={`text-[9px] font-bold mt-0.5 ${isCartOpen ? 'text-[#f68b1e]' : 'text-slate-500 dark:text-slate-400'}`}>Cart</span>
        </button>
      </div>

      {/* 14. Marketplace footer with helpful contacts & downloads */}
      <Footer />
    </div>
  );
}

