import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Sparkles, 
  Percent, 
  ChevronRight, 
  ArrowLeft, 
  ShoppingCart, 
  Heart, 
  Share2, 
  Flame, 
  Timer, 
  TrendingUp, 
  Award,
  Filter,
  ArrowUpDown
} from 'lucide-react';
import { PRODUCTS, CATEGORIES } from '../data';
import { Product } from '../types';

interface DealsPageProps {
  type: 'todays-deal' | 'flash-sales' | 'discount';
  onBack: () => void;
  onAddToCart: (
    p: Product, 
    quantity?: number, 
    selectedVariation?: Record<string, string>, 
    selectedVendor?: string, 
    customPrice?: number
  ) => void;
  onProductClick: (p: Product) => void;
  watchlist: string[];
  onToggleWatchlist: (productId: string) => void;
  formatPrice: (priceInUgx: number) => string;
}

export default function DealsPage({
  type,
  onBack,
  onAddToCart,
  onProductClick,
  watchlist,
  onToggleWatchlist,
  formatPrice
}: DealsPageProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'discount' | 'priceLowToHigh' | 'priceHighToLow'>('discount');
  const [timeLeft, setTimeLeft] = useState({ hours: 8, minutes: 24, seconds: 15 });

  // Countdown clock simulation
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 23, minutes: 59, seconds: 59 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Filter products based on page type
  const dealProducts = PRODUCTS.filter(p => {
    // Category filter
    if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;

    if (type === 'todays-deal') {
      // Must have discount, higher original price
      return p.originalPrice && p.originalPrice > p.price;
    } else if (type === 'flash-sales') {
      // isFlashSale property
      return p.isFlashSale;
    } else if (type === 'discount') {
      // Must have substantial discount badge or high discount percentage
      if (!p.discountBadge) return false;
      const num = parseInt(p.discountBadge.replace(/[^0-9]/g, ''));
      return num >= 15; // At least 15% off
    }
    return true;
  });

  // Sort products
  const sortedProducts = [...dealProducts].sort((a, b) => {
    if (sortBy === 'priceLowToHigh') return a.price - b.price;
    if (sortBy === 'priceHighToLow') return b.price - a.price;
    
    // Sort by discount percentage descending
    const getDisc = (p: Product) => {
      if (!p.originalPrice) return 0;
      return ((p.originalPrice - p.price) / p.originalPrice) * 100;
    };
    return getDisc(b) - getDisc(a);
  });

  // Dynamic Page Configuration
  const getPageConfig = () => {
    switch (type) {
      case 'todays-deal':
        return {
          title: "Today's Gold Box Deals",
          subtitle: "Up to 60% off exciting deals from top-tier brands, updated every 24 hours.",
          bgColor: "from-amber-500 to-orange-600",
          icon: <Sparkles className="text-yellow-300 animate-pulse" size={24} />,
          badge: "Featured Savings",
          timerLabel: "Ends in"
        };
      case 'flash-sales':
        return {
          title: "MoMo Thunder Flash Sales",
          subtitle: "Extreme discounts in short bursts. Grab your item before it sells out!",
          bgColor: "from-red-600 to-yellow-600",
          icon: <Zap className="text-yellow-300 animate-bounce" size={24} />,
          badge: "Limited Stock Left",
          timerLabel: "Refreshes in"
        };
      case 'discount':
        return {
          title: "Super Saver Discount Outlet",
          subtitle: "Direct importer clearance prices. Factory outlet items with official warranties.",
          bgColor: "from-emerald-600 to-teal-800",
          icon: <Percent className="text-green-300" size={24} />,
          badge: "100% Genuine Imports",
          timerLabel: "Next batch arrives in"
        };
    }
  };

  const config = getPageConfig();

  // Mock static claim percentages to simulate live high-velocity buying (Requirement 1 & Jumia style)
  const getClaimedPercentage = (productId: string) => {
    if (!productId) return 55;
    const sum = productId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return 40 + (sum % 48); // range 40% to 88%
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 space-y-6" id={`deals-page-${type}`}>
      {/* Breadcrumbs Navigation */}
      <div className="flex items-center gap-2 text-xs text-slate-400 font-bold">
        <button onClick={onBack} className="hover:text-[#f68b1e] cursor-pointer flex items-center gap-1">
          <ArrowLeft size={12} />
          <span>Back to Home</span>
        </button>
        <ChevronRight size={10} />
        <span className="text-slate-600 dark:text-slate-300 capitalize">{type.replace('-', ' ')}</span>
      </div>

      {/* High-Impact Hero Deal Banner */}
      <div className={`p-6 sm:p-10 rounded-3xl bg-gradient-to-r ${config.bgColor} text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6`}>
        {/* Decorative background grid */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1),transparent)] pointer-events-none" />
        
        <div className="space-y-3 z-10 max-w-xl">
          <span className="bg-white/20 text-white font-black text-[10px] tracking-widest uppercase px-3 py-1 rounded-full border border-white/10">
            {config.badge}
          </span>
          <div className="flex items-center gap-2.5">
            {config.icon}
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight">{config.title}</h1>
          </div>
          <p className="text-xs sm:text-sm text-white/95 font-medium leading-relaxed">
            {config.subtitle}
          </p>
        </div>

        {/* Live Timer Countdown Frame */}
        <div className="bg-slate-950/80 backdrop-blur-md p-4 rounded-2xl border border-white/10 z-10 flex flex-col items-center justify-center text-center flex-shrink-0">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1 justify-center">
            <Timer size={11} className="text-red-500 animate-pulse" />
            <span>{config.timerLabel}</span>
          </p>
          <div className="flex items-center gap-2 font-mono">
            <div className="bg-white/10 text-white px-2.5 py-1.5 rounded-lg text-lg font-black min-w-[38px]">
              {String(timeLeft.hours).padStart(2, '0')}
            </div>
            <span className="text-slate-400 font-bold">:</span>
            <div className="bg-white/10 text-white px-2.5 py-1.5 rounded-lg text-lg font-black min-w-[38px]">
              {String(timeLeft.minutes).padStart(2, '0')}
            </div>
            <span className="text-slate-400 font-bold">:</span>
            <div className="bg-white/10 text-white px-2.5 py-1.5 rounded-lg text-lg font-black min-w-[38px] text-orange-400">
              {String(timeLeft.seconds).padStart(2, '0')}
            </div>
          </div>
        </div>
      </div>

      {/* Category Pills & Controls row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl shadow-xs">
        {/* Category filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer border transition-all ${
              selectedCategory === 'all'
                ? 'bg-[#f68b1e] border-[#f68b1e] text-white'
                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
            }`}
          >
            All Categories
          </button>
          {CATEGORIES.map(c => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer border transition-all ${
                selectedCategory === c.id
                  ? 'bg-[#f68b1e] border-[#f68b1e] text-white'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Sort dropdown */}
        <div className="flex items-center gap-2 justify-end">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wide flex items-center gap-1">
            <ArrowUpDown size={11} />
            <span>Sort:</span>
          </span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="discount">Biggest Discount %</option>
            <option value="priceLowToHigh">Price: Low to High</option>
            <option value="priceHighToLow">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Main Deals Grid (Mobile responsive 2-column or desktop 4-column) */}
      {sortedProducts.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {sortedProducts.map((p) => {
            const claimed = getClaimedPercentage(p.id);
            const isWatchlisted = watchlist.includes(p.id);
            
            return (
              <div
                key={p.id}
                className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-3 flex flex-col justify-between hover:shadow-md hover:border-[#f68b1e] transition-all cursor-pointer relative group/card overflow-hidden"
              >
                {/* Save Badges */}
                {p.discountBadge && (
                  <span className="absolute top-2.5 left-2.5 bg-red-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-md z-10 shadow-xs animate-pulse">
                    {p.discountBadge} OFF
                  </span>
                )}

                {/* Watchlist Quick Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleWatchlist(p.id);
                  }}
                  className={`absolute top-2.5 right-2.5 p-1.5 rounded-full z-10 transition-all shadow-xs ${
                    isWatchlisted 
                      ? 'bg-red-50 text-red-500' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-red-500'
                  }`}
                >
                  <Heart size={14} className={isWatchlisted ? 'fill-red-500' : ''} />
                </button>

                {/* Image Showcase */}
                <div 
                  onClick={() => onProductClick(p)}
                  className="bg-slate-50 dark:bg-slate-950 rounded-xl p-3 flex items-center justify-center aspect-square overflow-hidden mb-3 relative group"
                >
                  <img
                    src={p.image}
                    alt={p.title}
                    className="max-h-32 sm:max-h-36 object-contain group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                  {p.isOfficial && (
                    <span className="absolute bottom-2 left-2 bg-blue-600 text-white font-black text-[7px] px-1.5 py-0.5 rounded uppercase tracking-wider shadow-xs">
                      Official Brand
                    </span>
                  )}
                </div>

                {/* Info block */}
                <div className="space-y-2 flex-1 flex flex-col justify-between" onClick={() => onProductClick(p)}>
                  <div className="space-y-1">
                    <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">{p.brand}</p>
                    <h3 className="font-bold text-xs text-slate-800 dark:text-slate-100 line-clamp-2 leading-snug group-hover/card:text-[#f68b1e] transition-colors">
                      {p.title}
                    </h3>

                    {/* Ratings */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-yellow-500 text-xs">★</span>
                      <span className="text-[10px] font-black text-slate-700 dark:text-slate-200">{p.rating}</span>
                      <span className="text-[9px] text-slate-400">({p.reviewsCount})</span>
                    </div>
                  </div>

                  {/* Pricing and Limited Bar */}
                  <div className="space-y-2 pt-1.5 border-t border-slate-50 dark:border-slate-800/50">
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-black text-orange-600 dark:text-orange-500">
                        {formatPrice(p.price)}
                      </span>
                      {p.originalPrice && (
                        <span className="text-[10px] line-through text-slate-400 font-bold">
                          {formatPrice(p.originalPrice)}
                        </span>
                      )}
                    </div>

                    {/* Amazon/Jumia Live Claim Progress indicator (Requirement 1 & 2) */}
                    {(type === 'flash-sales' || type === 'todays-deal') && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-[8px] font-black text-slate-500">
                          <span>{claimed}% Claimed</span>
                          <span className="text-red-500">Hurry! Only few left</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-red-500 to-orange-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${claimed}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Quick cart addition */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddToCart(p);
                      }}
                      className="w-full bg-slate-950 dark:bg-slate-800 hover:bg-[#f68b1e] hover:text-white dark:hover:bg-[#f68b1e] text-white py-2 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer mt-1"
                    >
                      <ShoppingCart size={11} />
                      <span>Buy Now</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 space-y-3">
          <p className="text-slate-400 font-extrabold text-sm uppercase tracking-wide">No active deals found in this category</p>
          <p className="text-xs text-slate-400 max-w-md mx-auto">Please select a different category pill above or clear active filters to discover our premium discount products.</p>
          <button 
            onClick={() => setSelectedCategory('all')} 
            className="bg-[#f68b1e] text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-orange-500 cursor-pointer"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
}
