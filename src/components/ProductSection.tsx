import React, { useState } from 'react';
import { 
  Filter, 
  Star, 
  ShoppingCart, 
  Truck, 
  Coins, 
  CheckCircle, 
  ArrowUpDown, 
  X,
  Search,
  Heart,
  Eye,
  Sparkles,
  Percent,
  Zap
} from 'lucide-react';
import { PRODUCTS, POPULAR_BRANDS, CATEGORIES } from '../data';
import { Product, FilterState } from '../types';

interface ProductSectionProps {
  onAddToCart: (
    p: Product, 
    quantity?: number, 
    selectedVariation?: Record<string, string>, 
    selectedVendor?: string, 
    customPrice?: number
  ) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedSpecialTab: 'all' | 'todays-deal' | 'flash-sales' | 'discount';
  setSelectedSpecialTab: (tab: 'all' | 'todays-deal' | 'flash-sales' | 'discount') => void;
  onProductClick: (p: Product) => void;
  onQuickView: (p: Product) => void;
  watchlist: string[];
  onToggleWatchlist: (productId: string) => void;
  formatPrice: (priceInUgx: number) => string;
  products?: Product[];
}

export default function ProductSection({
  onAddToCart,
  selectedCategory,
  setSelectedCategory,
  searchQuery,
  setSearchQuery,
  selectedSpecialTab,
  setSelectedSpecialTab,
  onProductClick,
  onQuickView,
  watchlist,
  onToggleWatchlist,
  formatPrice,
  products
}: ProductSectionProps) {
  // Filters State
  const [maxPrice, setMaxPrice] = useState<number>(6000000);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [minRating, setMinRating] = useState<number>(0);
  const [deliveryFilter, setDeliveryFilter] = useState<'all' | 'free' | 'payOnDelivery'>('all');
  const [sortBy, setSortBy] = useState<'popularity' | 'priceLowToHigh' | 'priceHighToLow' | 'discount'>('popularity');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Toggle brand in filter
  const handleBrandToggle = (brand: string) => {
    setSelectedBrands(prev => 
      prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
    );
  };

  // Reset Filters
  const handleResetFilters = () => {
    setMaxPrice(6000000);
    setSelectedBrands([]);
    setMinRating(0);
    setDeliveryFilter('all');
    setSortBy('popularity');
    setSelectedCategory('all');
    setSearchQuery('');
    setSelectedSpecialTab('all');
  };

  // Filter Logic
  const dataToFilter = products || PRODUCTS;
  const filteredProducts = dataToFilter.filter(product => {
    // Search match
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchTitle = product.title.toLowerCase().includes(query);
      const matchBrand = product.brand.toLowerCase().includes(query);
      if (!matchTitle && !matchBrand) return false;
    }

    // Special Filter Tab match
    if (selectedSpecialTab === 'todays-deal' && product.rating < 4.6) {
      return false;
    }
    if (selectedSpecialTab === 'flash-sales' && !product.isFlashSale) {
      return false;
    }
    if (selectedSpecialTab === 'discount' && !product.originalPrice && !product.discountBadge) {
      return false;
    }

    // Category match
    if (selectedCategory !== 'all' && product.category !== selectedCategory) {
      return false;
    }

    // Price match
    if (product.price > maxPrice) {
      return false;
    }

    // Brand match
    if (selectedBrands.length > 0 && !selectedBrands.includes(product.brand)) {
      return false;
    }

    // Rating match
    if (product.rating < minRating) {
      return false;
    }

    // Delivery match
    if (deliveryFilter === 'free' && !product.freeDelivery) return false;
    if (deliveryFilter === 'payOnDelivery' && !product.payOnDelivery) return false;

    return true;
  });

  // Sorting Logic
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'priceLowToHigh') {
      return a.price - b.price;
    }
    if (sortBy === 'priceHighToLow') {
      return b.price - a.price;
    }
    if (sortBy === 'discount') {
      // Sort by absolute or relative discount % (descending)
      const discA = a.originalPrice ? (a.originalPrice - a.price) / a.originalPrice : 0;
      const discB = b.originalPrice ? (b.originalPrice - b.price) / b.originalPrice : 0;
      return discB - discA;
    }
    // Default popularity: fallback order
    return b.rating - a.rating;
  });

  return (
    <section className="py-6 px-4 max-w-7xl mx-auto" id="shop-catalog-section">
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* SIDEBAR FILTERS (Desktop) */}
        <aside className="w-64 flex-shrink-0 hidden lg:block space-y-6 bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
          <div className="flex justify-between items-center pb-4 border-b border-slate-100">
            <h3 className="font-black text-slate-900 flex items-center gap-2 text-sm uppercase tracking-wide">
              <Filter size={16} className="text-orange-600" /> Filters
            </h3>
            <button 
              onClick={handleResetFilters}
              className="text-[10px] font-bold text-slate-400 hover:text-orange-600 uppercase tracking-wider cursor-pointer"
            >
              Reset All
            </button>
          </div>

          {/* Category Quick Filter */}
          <div className="space-y-2">
            <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Category</h4>
            <div className="space-y-1">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`w-full text-left px-2 py-1.5 rounded-lg text-xs transition-colors flex justify-between items-center ${
                  selectedCategory === 'all' 
                    ? 'bg-orange-50 text-orange-600 font-bold' 
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>All Categories</span>
                <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full font-bold">
                  {PRODUCTS.length}
                </span>
              </button>
              {CATEGORIES.map(cat => {
                const count = PRODUCTS.filter(p => p.category === cat.id).length;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`w-full text-left px-2 py-1.5 rounded-lg text-xs transition-colors flex justify-between items-center ${
                      selectedCategory === cat.id 
                        ? 'bg-orange-50 text-orange-600 font-bold' 
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>{cat.name}</span>
                    <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full font-bold">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Price Range Filter */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Max Price</h4>
              <span className="text-xs font-black text-orange-600">Shs {maxPrice.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min={10000}
              max={6000000}
              step={10000}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-orange-600 h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-bold text-slate-400">
              <span>Shs 10,000</span>
              <span>Shs 6M</span>
            </div>
          </div>

          {/* Brands Filter */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Brands</h4>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {POPULAR_BRANDS.map(brand => (
                <label key={brand} className="flex items-center gap-2 text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedBrands.includes(brand)}
                    onChange={() => handleBrandToggle(brand)}
                    className="rounded border-slate-300 text-orange-600 focus:ring-orange-500 h-3.5 w-3.5 accent-orange-600"
                  />
                  <span>{brand}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Delivery & Value Filter */}
          <div className="space-y-2">
            <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Delivery Benefits</h4>
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer">
                <input
                  type="radio"
                  name="delivery"
                  checked={deliveryFilter === 'all'}
                  onChange={() => setDeliveryFilter('all')}
                  className="text-orange-600 focus:ring-orange-500 h-3.5 w-3.5 accent-orange-600"
                />
                <span>All Options</span>
              </label>
              <label className="flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer">
                <input
                  type="radio"
                  name="delivery"
                  checked={deliveryFilter === 'free'}
                  onChange={() => setDeliveryFilter('free')}
                  className="text-orange-600 focus:ring-orange-500 h-3.5 w-3.5 accent-orange-600"
                />
                <span>Free Delivery</span>
              </label>
              <label className="flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer">
                <input
                  type="radio"
                  name="delivery"
                  checked={deliveryFilter === 'payOnDelivery'}
                  onChange={() => setDeliveryFilter('payOnDelivery')}
                  className="text-orange-600 focus:ring-orange-500 h-3.5 w-3.5 accent-orange-600"
                />
                <span>Pay on Delivery Eligible</span>
              </label>
            </div>
          </div>

          {/* Rating Filter */}
          <div className="space-y-2">
            <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Customer Rating</h4>
            <div className="space-y-1.5">
              {[4, 3, 2, 0].map((ratingVal) => (
                <button
                  key={ratingVal}
                  onClick={() => setMinRating(ratingVal)}
                  className={`w-full flex items-center gap-2 text-xs px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                    minRating === ratingVal ? 'bg-orange-50 text-orange-600 font-bold' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {ratingVal === 0 ? (
                    <span>Any Rating</span>
                  ) : (
                    <>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star 
                            key={i} 
                            size={10} 
                            fill={i < ratingVal ? '#eab308' : 'none'} 
                            stroke={i < ratingVal ? 'none' : '#cbd5e1'} 
                          />
                        ))}
                      </div>
                      <span>& Above</span>
                    </>
                  )}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* MAIN PRODUCT CATALOG */}
        <div className="flex-1 space-y-6">
          
          {/* CATALOG HEADER WITH SORT & RESULTS */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
            <div className="text-center sm:text-left">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {selectedCategory === 'all' ? 'All Products' : CATEGORIES.find(c => c.id === selectedCategory)?.name}
              </span>
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                Found <span className="text-orange-600">{sortedProducts.length}</span> Products
                {searchQuery && <span className="text-slate-500 font-medium text-xs ml-2">for "{searchQuery}"</span>}
              </h2>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
              {/* Mobile Filter Trigger */}
              <button
                onClick={() => setIsMobileFilterOpen(true)}
                className="lg:hidden flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer"
              >
                <Filter size={14} />
                <span>Filters</span>
              </button>

              {/* Sort selector */}
              <div className="flex items-center gap-2">
                <ArrowUpDown size={14} className="text-slate-400 hidden sm:inline" />
                <span className="text-xs text-slate-500 font-bold hidden sm:inline">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
                >
                  <option value="popularity">Popularity (Rating)</option>
                  <option value="priceLowToHigh">Price: Low to High</option>
                  <option value="priceHighToLow">Price: High to Low</option>
                  <option value="discount">Biggest Discount %</option>
                </select>
              </div>
            </div>
          </div>

          {/* ACTIVE FILTER CAPSULES */}
          {(selectedCategory !== 'all' || selectedBrands.length > 0 || minRating > 0 || deliveryFilter !== 'all' || searchQuery || selectedSpecialTab !== 'all') && (
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active:</span>
              
              {selectedSpecialTab !== 'all' && (
                <span className="bg-red-50 text-red-600 border border-red-100 rounded-full px-2.5 py-0.5 text-[10px] font-bold flex items-center gap-1 uppercase tracking-wider">
                  <Sparkles size={10} className="text-red-500 animate-pulse" />
                  {selectedSpecialTab === 'todays-deal' ? "Today's Deal" : selectedSpecialTab === 'flash-sales' ? "Flash Sale" : "Discounted"}
                  <button onClick={() => setSelectedSpecialTab('all')} className="hover:text-red-600 cursor-pointer"><X size={10} /></button>
                </span>
              )}

              {selectedCategory !== 'all' && (
                <span className="bg-orange-50 text-orange-600 border border-orange-100 rounded-full px-2.5 py-0.5 text-[10px] font-bold flex items-center gap-1">
                  Cat: {CATEGORIES.find(c => c.id === selectedCategory)?.name}
                  <button onClick={() => setSelectedCategory('all')} className="hover:text-red-600 cursor-pointer"><X size={10} /></button>
                </span>
              )}

              {searchQuery && (
                <span className="bg-slate-100 text-slate-700 border border-slate-200 rounded-full px-2.5 py-0.5 text-[10px] font-bold flex items-center gap-1">
                  Query: {searchQuery}
                  <button onClick={() => setSearchQuery('')} className="hover:text-red-600 cursor-pointer"><X size={10} /></button>
                </span>
              )}

              {selectedBrands.map(brand => (
                <span key={brand} className="bg-blue-50 text-blue-600 border border-blue-100 rounded-full px-2.5 py-0.5 text-[10px] font-bold flex items-center gap-1">
                  {brand}
                  <button onClick={() => handleBrandToggle(brand)} className="hover:text-red-600 cursor-pointer"><X size={10} /></button>
                </span>
              ))}

              {minRating > 0 && (
                <span className="bg-yellow-50 text-yellow-700 border border-yellow-100 rounded-full px-2.5 py-0.5 text-[10px] font-bold flex items-center gap-1">
                  {minRating}★ & Up
                  <button onClick={() => setMinRating(0)} className="hover:text-red-600 cursor-pointer"><X size={10} /></button>
                </span>
              )}

              {deliveryFilter !== 'all' && (
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full px-2.5 py-0.5 text-[10px] font-bold flex items-center gap-1">
                  {deliveryFilter === 'free' ? 'Free Delivery' : 'Pay on Delivery'}
                  <button onClick={() => setDeliveryFilter('all')} className="hover:text-red-600 cursor-pointer"><X size={10} /></button>
                </span>
              )}

              <button 
                onClick={handleResetFilters}
                className="text-[10px] text-red-500 hover:underline font-bold cursor-pointer"
              >
                Clear all filters
              </button>
            </div>
          )}

          {/* Jumia-Style Category Row Showcase */}
          {selectedCategory !== 'all' && (
            <div className="space-y-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-5 rounded-2xl shadow-xs mb-6">
              {/* Category Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="space-y-1">
                  <h2 className="text-sm font-black text-slate-900 dark:text-slate-50 uppercase tracking-wide flex items-center gap-2">
                    <Sparkles size={16} className="text-[#f68b1e] animate-pulse" />
                    <span>Shop {CATEGORIES.find(c => c.id === selectedCategory)?.name || selectedCategory} by Brand & Variation</span>
                  </h2>
                  <p className="text-[10px] text-slate-400 font-bold">Discover direct manufacturer imports & verified local merchant variations</p>
                </div>
                <span className="text-[10px] bg-[#f68b1e]/10 text-[#f68b1e] px-2 py-1 rounded-md font-black uppercase">
                  {PRODUCTS.filter(p => p.category === selectedCategory).length} Items found
                </span>
              </div>

              {/* Dynamic Related Brands Row */}
              {Array.from(new Set(PRODUCTS.filter(p => p.category === selectedCategory).map(p => p.brand))).length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Official Brands</p>
                  <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                    {Array.from(new Set(PRODUCTS.filter(p => p.category === selectedCategory).map(p => p.brand))).map(brand => {
                      const isSelected = selectedBrands.includes(brand);
                      return (
                        <button
                          key={brand}
                          onClick={() => handleBrandToggle(brand)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap border cursor-pointer transition-all ${
                            isSelected 
                              ? 'bg-[#f68b1e] text-white border-[#f68b1e] shadow-sm' 
                              : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {brand}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Horizontal Jumia-style Row of Related Products */}
              <div className="space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Related Products & Variations (Scroll & Swipe)</p>
                <div className="flex gap-4 overflow-x-auto pb-3 pt-1 scrollbar-none snap-x">
                  {PRODUCTS.filter(p => p.category === selectedCategory).map((p) => (
                    <div
                      key={p.id}
                      onClick={() => onProductClick(p)}
                      className="w-56 flex-shrink-0 bg-slate-50/50 dark:bg-slate-950/30 border border-slate-100 dark:border-slate-800/60 p-3 rounded-xl hover:border-[#f68b1e] transition-all cursor-pointer space-y-3 snap-start relative group"
                    >
                      {/* Badge if discount */}
                      {p.discountBadge && (
                        <span className="absolute top-2 left-2 bg-red-600 text-white font-black text-[8px] px-1.5 py-0.5 rounded-sm z-10">
                          {p.discountBadge}
                        </span>
                      )}

                      <div className="bg-white dark:bg-slate-950 rounded-lg p-2 flex items-center justify-center aspect-square overflow-hidden">
                        <img
                          src={p.image}
                          alt={p.title}
                          className="max-h-24 object-contain group-hover:scale-105 transition-transform"
                          referrerPolicy="no-referrer"
                        />
                      </div>

                      <div className="space-y-1">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">{p.brand}</p>
                        <h3 className="font-bold text-xs text-slate-800 dark:text-slate-100 line-clamp-1 group-hover:text-[#f68b1e] transition-colors">
                          {p.title}
                        </h3>
                        
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black text-slate-950 dark:text-slate-50">{formatPrice(p.price)}</span>
                          {p.originalPrice && (
                            <span className="text-[10px] line-through text-slate-400 font-medium">{formatPrice(p.originalPrice)}</span>
                          )}
                        </div>

                        {/* Variations list badge (Requirement 3) */}
                        {p.variations && p.variations.length > 0 ? (
                          <div className="flex flex-wrap gap-1 pt-1.5">
                            {p.variations.map(v => (
                              <span key={v.name} className="text-[8px] font-black bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded uppercase">
                                {v.name}: {v.options.join('/')}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <div className="pt-1.5">
                            <span className="text-[8px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded">Standard pack</span>
                          </div>
                        )}

                        {/* Vendor count badge (Requirement 3) */}
                        {p.vendors && p.vendors.length > 0 && (
                          <p className="text-[8px] font-extrabold text-[#f68b1e] dark:text-[#f68b1e] pt-1">
                            &bull; {p.vendors.length + 1} Merchant Sellers Available
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* PRODUCTS GRID */}
          {sortedProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6">
              {sortedProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  watchlist={watchlist}
                  onToggleWatchlist={onToggleWatchlist}
                  onAddToCart={onAddToCart}
                  onProductClick={onProductClick}
                  onQuickView={onQuickView}
                  formatPrice={formatPrice}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center space-y-4 shadow-xs">
              <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                <Search size={28} />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="text-slate-800 font-black text-base">No products match your filters</h3>
                <p className="text-slate-400 text-xs font-medium">
                  Try clearing some criteria, typing a different keyword, or selecting a broader category.
                </p>
              </div>
              <button
                onClick={handleResetFilters}
                className="bg-orange-600 text-white hover:bg-orange-500 px-6 py-2 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          )}

        </div>

      </div>

      {/* MOBILE FILTER MODAL/DRAWER */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-end animate-fade-in">
          <div className="w-80 max-w-full bg-white h-full p-6 flex flex-col justify-between shadow-xl animate-slide-left">
            <div className="space-y-6 overflow-y-auto pb-6">
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <h3 className="font-black text-slate-900 flex items-center gap-2 text-sm uppercase tracking-wide">
                  <Filter size={16} className="text-orange-600" /> Filters
                </h3>
                <button 
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Price Range */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Max Price</h4>
                  <span className="text-xs font-black text-orange-600">Shs {maxPrice.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min={10000}
                  max={6000000}
                  step={10000}
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full accent-orange-600 h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Brands */}
              <div className="space-y-3">
                <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Brands</h4>
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {POPULAR_BRANDS.map(brand => (
                    <label key={brand} className="flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedBrands.includes(brand)}
                        onChange={() => handleBrandToggle(brand)}
                        className="rounded border-slate-300 text-orange-600 focus:ring-orange-500 h-3.5 w-3.5 accent-orange-600"
                      />
                      <span>{brand}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Delivery */}
              <div className="space-y-2">
                <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Delivery Benefits</h4>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer">
                    <input
                      type="radio"
                      name="deliveryMobile"
                      checked={deliveryFilter === 'all'}
                      onChange={() => setDeliveryFilter('all')}
                      className="text-orange-600 focus:ring-orange-500 h-3.5 w-3.5 accent-orange-600"
                    />
                    <span>All Options</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer">
                    <input
                      type="radio"
                      name="deliveryMobile"
                      checked={deliveryFilter === 'free'}
                      onChange={() => setDeliveryFilter('free')}
                      className="text-orange-600 focus:ring-orange-500 h-3.5 w-3.5 accent-orange-600"
                    />
                    <span>Free Delivery</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer">
                    <input
                      type="radio"
                      name="deliveryMobile"
                      checked={deliveryFilter === 'payOnDelivery'}
                      onChange={() => setDeliveryFilter('payOnDelivery')}
                      className="text-orange-600 focus:ring-orange-500 h-3.5 w-3.5 accent-orange-600"
                    />
                    <span>Pay on Delivery</span>
                  </label>
                </div>
              </div>

              {/* Rating */}
              <div className="space-y-2">
                <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Customer Rating</h4>
                <div className="space-y-1.5">
                  {[4, 3, 2, 0].map((ratingVal) => (
                    <button
                      key={ratingVal}
                      onClick={() => setMinRating(ratingVal)}
                      className={`w-full flex items-center gap-2 text-xs px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                        minRating === ratingVal ? 'bg-orange-50 text-orange-600 font-bold' : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {ratingVal === 0 ? (
                        <span>Any Rating</span>
                      ) : (
                        <>
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star 
                                key={i} 
                                size={10} 
                                fill={i < ratingVal ? '#eab308' : 'none'} 
                                stroke={i < ratingVal ? 'none' : '#cbd5e1'} 
                              />
                            ))}
                          </div>
                          <span>& Above</span>
                        </>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex gap-4">
              <button
                onClick={handleResetFilters}
                className="w-1/2 bg-slate-100 text-slate-700 py-3 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Reset All
              </button>
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="w-1/2 bg-orange-600 text-white hover:bg-orange-500 py-3 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

    </section>
  );
}

// ==========================================================
// AMAZON-STYLE COMPACT PRODUCT CARD WITH HEARTS INTERACTION
// ==========================================================
interface ProductCardProps {
  key?: React.Key;
  product: Product;
  watchlist: string[];
  onToggleWatchlist: (productId: string) => void;
  onAddToCart: (
    p: Product, 
    quantity?: number, 
    selectedVariation?: Record<string, string>, 
    selectedVendor?: string, 
    customPrice?: number
  ) => void;
  onProductClick: (product: Product) => void;
  onQuickView: (product: Product) => void;
  formatPrice: (price: number) => string;
}

function ProductCard({
  product,
  watchlist,
  onToggleWatchlist,
  onAddToCart,
  onProductClick,
  onQuickView,
  formatPrice
}: ProductCardProps) {
  const [hearts, setHearts] = useState<{ id: number; x: number; y: number; scale: number; angle: number }[]>([]);
  const isWatchlisted = watchlist.includes(product.id);

  const handleWatchlistTap = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onToggleWatchlist(product.id);

    // Create random floating heart particles for the interactive bubble burst
    const newHearts = Array.from({ length: 5 }).map((_, i) => ({
      id: Math.random() + i,
      x: (Math.random() - 0.5) * 80,
      y: (Math.random() - 0.5) * 30 - 15,
      scale: 0.6 + Math.random() * 0.7,
      angle: (Math.random() - 0.5) * 50
    }));

    setHearts(prev => [...prev, ...newHearts]);

    // Cleanup particles
    setTimeout(() => {
      setHearts(prev => prev.filter(h => !newHearts.find(nh => nh.id === h.id)));
    }, 1400);
  };

  return (
    <div 
      className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800/80 p-2.5 sm:p-3.5 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between group relative"
      id={`product-card-${product.id}`}
    >
      <div>
        {/* Image Container with high quality presentation */}
        <div className="relative bg-slate-50 dark:bg-slate-950/20 rounded-2xl p-4 overflow-hidden mb-3.5 flex items-center justify-center h-52 sm:h-72 md:h-80 group/image">
          {product.discountBadge && (
            <span className="absolute top-1.5 left-1.5 bg-red-600 text-white font-black text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded-sm shadow-xs z-10 uppercase tracking-wide">
              {product.discountBadge}
            </span>
          )}

          {product.isOfficial && (
            <span className="absolute top-1.5 right-1.5 bg-blue-600 text-white font-bold text-[7px] sm:text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded-sm flex items-center gap-0.5 shadow-xs z-10">
              <CheckCircle size={7} fill="white" className="text-blue-600" /> Verified
            </span>
          )}

          {/* Product Image */}
          <img
            src={product.image}
            alt={product.title}
            className="max-h-full max-w-full object-contain rounded-lg group-hover:scale-105 transition-transform duration-300 cursor-pointer"
            referrerPolicy="no-referrer"
            onClick={() => onProductClick(product)}
          />

          {/* Hover Overlay layer for premium feel and centered Quick View button */}
          <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover/image:opacity-100 transition-opacity duration-300 flex items-center justify-center z-15">
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onQuickView(product);
              }}
              className="bg-[#f68b1e] hover:bg-[#e07510] text-white text-[10px] sm:text-xs font-black uppercase tracking-wider px-3 py-1.5 sm:px-4 sm:py-2.5 rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer flex items-center gap-1.5 border border-[#ffb84d]/30"
            >
              <Eye size={12} />
              <span>Quick View</span>
            </button>
          </div>

          {/* ALWAYS VISIBLE ONE-TAP OVERLAY BUTTON FOR WATCHLIST */}
          <button
            onClick={handleWatchlistTap}
            className={`absolute top-2.5 right-2.5 p-1.5 rounded-full shadow-md border backdrop-blur-xs transition-all z-20 cursor-pointer ${
              isWatchlisted
                ? 'bg-red-500 border-red-400 text-white scale-110 animate-pulse'
                : 'bg-white/90 dark:bg-slate-900/90 border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-500 hover:scale-110'
            }`}
            title={isWatchlisted ? "Remove from watchlist" : "Add to watchlist"}
          >
            <Heart size={14} className={isWatchlisted ? "fill-white text-white" : ""} />
          </button>

          {/* Particle System Container for Floating Hearts */}
          <div className="absolute inset-0 pointer-events-none z-35 overflow-hidden">
            {hearts.map(heart => (
              <div
                key={heart.id}
                className="absolute left-1/2 top-1/2 animate-float-heart text-red-500"
                style={{
                  transform: `translate(-50%, -50%) translate(${heart.x}px, ${heart.y}px) scale(${heart.scale}) rotate(${heart.angle}deg)`,
                  position: 'absolute'
                }}
              >
                <Heart size={18} fill="currentColor" stroke="none" className="drop-shadow-md text-red-500" />
              </div>
            ))}
          </div>

          {/* Floating specifications details view trigger */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onProductClick(product);
            }}
            className="absolute bottom-1.5 left-1.5 p-1.5 rounded-full bg-white/95 dark:bg-slate-900/95 border border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-[#f68b1e] dark:hover:text-[#f68b1e] hover:bg-white shadow-xs transition-all z-20 cursor-pointer"
            title="View specifications detail modal"
          >
            <Eye size={12} />
          </button>
        </div>

        {/* Product Details Section */}
        <div className="space-y-1">
          <div className="flex justify-between items-center text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wide">
            <span>{product.brand}</span>
            {product.freeDelivery && (
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                <Truck size={9} /> Free Delivery
              </span>
            )}
          </div>

          <h3 
            onClick={() => onProductClick(product)}
            className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200 line-clamp-2 hover:text-[#f68b1e] dark:hover:text-[#f68b1e] transition-colors h-9 sm:h-10 cursor-pointer leading-tight"
          >
            {product.title}
          </h3>

          {/* Ratings & reviews count */}
          <div className="flex items-center gap-1 py-0.5 sm:py-1">
            <div className="flex items-center">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star 
                  key={i} 
                  size={10} 
                  fill={i < Math.floor(product.rating) ? '#eab308' : 'none'} 
                  stroke={i < Math.floor(product.rating) ? 'none' : '#cbd5e1'} 
                />
              ))}
            </div>
            <span className="text-[9px] sm:text-[10px] font-black text-slate-700 dark:text-slate-300">{product.rating}</span>
            <span className="text-[9px] sm:text-[10px] text-slate-400">({product.reviewsCount})</span>
          </div>
        </div>
      </div>

      {/* Price and Add-To-Cart Action Bar */}
      <div className="pt-2 sm:pt-3 border-t border-slate-50 dark:border-slate-800/80 mt-2.5 sm:mt-3 space-y-2.5 sm:space-y-3">
        <div className="flex flex-col">
          <span className="text-sm sm:text-base font-black text-slate-950 dark:text-white leading-none">
            {formatPrice(product.price)}
          </span>
          {product.originalPrice && (
            <span className="text-[10px] sm:text-xs line-through text-slate-400 font-medium mt-0.5">
              {formatPrice(product.originalPrice)}
            </span>
          )}
        </div>

        {/* Free or Pay on Delivery indicators */}
        <div className="flex flex-col gap-0.5 text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 font-medium">
          {product.payOnDelivery && (
            <span className="flex items-center gap-0.5 text-slate-600 dark:text-slate-300">
              <Coins size={10} className="text-[#f68b1e]" /> Pay on Delivery Available
            </span>
          )}
          <span className="text-slate-400">⚡ Delivered within 24-48 hours</span>
        </div>

        <button
          onClick={() => onAddToCart(product)}
          className="w-full bg-[#f68b1e] hover:bg-[#e07510] text-white py-2 sm:py-2.5 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition-all duration-200 shadow-xs hover:scale-[1.02] active:scale-95 cursor-pointer uppercase tracking-wider"
        >
          <ShoppingCart size={12} />
          <span>Add to Cart</span>
        </button>
      </div>
    </div>
  );
}
