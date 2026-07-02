import React from 'react';
import { Product } from '../types';
import { PRODUCTS } from '../data';
import { 
  Eye, 
  Sparkles, 
  ChevronRight, 
  ShoppingCart, 
  Trash2, 
  TrendingUp, 
  Heart,
  ArrowRight
} from 'lucide-react';

interface RecentSearchesSectionProps {
  recentSearches: Product[];
  onProductClick: (p: Product) => void;
  onAddToCart: (p: Product) => void;
  onClearHistory: () => void;
  formatPrice: (price: number) => string;
  watchlist: string[];
  onToggleWatchlist: (productId: string) => void;
}

export default function RecentSearchesSection({
  recentSearches,
  onProductClick,
  onAddToCart,
  onClearHistory,
  formatPrice,
  watchlist,
  onToggleWatchlist
}: RecentSearchesSectionProps) {

  // Get related products based on categories in recent searches
  const getRelatedProducts = () => {
    if (recentSearches.length === 0) {
      // Fallback: Show premium trending products if they haven't searched/viewed anything yet
      return PRODUCTS.filter(p => p.rating >= 4.8).slice(0, 6);
    }

    const categories = recentSearches.map(p => p.category);
    const viewedIds = recentSearches.map(p => p.id);

    // Find other products in those categories, excluding the already viewed ones
    const matches = PRODUCTS.filter(p => 
      categories.includes(p.category) && !viewedIds.includes(p.id)
    );

    // If matches are low, pad with highly rated items
    if (matches.length < 4) {
      const extra = PRODUCTS.filter(p => !viewedIds.includes(p.id) && !matches.map(m => m.id).includes(p.id));
      return [...matches, ...extra].slice(0, 8);
    }

    return matches.slice(0, 8);
  };

  const relatedProducts = getRelatedProducts();

  return (
    <div className="max-w-7xl mx-auto px-4 my-8 space-y-8" id="recent-searches-and-related-section">
      
      {/* 1. RELATED PRODUCTS SECTION */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-5 shadow-xs relative overflow-hidden">
        
        {/* Purple gradient top bar highlight */}
        <div className="absolute top-0 left-0 right-0 h-[4px] bg-gradient-to-r from-[#f68b1e] via-orange-500 to-amber-500" />

        <div className="flex flex-wrap justify-between items-center mb-5 gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-black uppercase text-slate-800 dark:text-white flex items-center gap-2 tracking-tight">
              <Sparkles className="text-[#f68b1e] animate-pulse" size={18} />
              <span>{recentSearches.length > 0 ? "Inspired by Your Recent Searches" : "Recommended Deals For You"}</span>
            </h2>
            <p className="text-slate-400 dark:text-slate-500 text-[11px] font-bold">
              {recentSearches.length > 0 
                ? "Handpicked related items based on your shopping interests in Kampala" 
                : "Top rated local listings with instant dispatch & pay on delivery"}
            </p>
          </div>
          <span className="text-[10px] uppercase font-black tracking-widest bg-orange-50 dark:bg-orange-950/40 text-[#f68b1e] px-2.5 py-1 rounded-md">
            Personalized Feed
          </span>
        </div>

        {/* Horizontal scroll of related items */}
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none snap-x touch-pan-x">
          {relatedProducts.map((p) => {
            const hasDiscount = p.originalPrice && p.originalPrice > p.price;
            const isFavorite = watchlist.includes(p.id);
            return (
              <div 
                key={`related-${p.id}`}
                className="w-[180px] sm:w-[220px] bg-white dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800/60 p-3 hover:shadow-md transition-all group flex-shrink-0 snap-start flex flex-col justify-between"
              >
                <div>
                  {/* Card Header image & badges */}
                  <div className="relative aspect-square bg-slate-50 dark:bg-slate-900 rounded-xl p-2 flex items-center justify-center overflow-hidden">
                    <img 
                      src={p.image} 
                      alt={p.title} 
                      className="max-h-28 object-contain group-hover:scale-105 transition-transform" 
                      onClick={() => onProductClick(p)}
                      referrerPolicy="no-referrer"
                    />
                    
                    {/* Discount badge */}
                    {hasDiscount && (
                      <span className="absolute top-2 left-2 bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase">
                        {p.discountBadge || 'SAVE'}
                      </span>
                    )}

                    {/* Favorite button */}
                    <button 
                      onClick={() => onToggleWatchlist(p.id)}
                      className={`absolute top-2 right-2 p-1.5 rounded-full bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-700 shadow-xs transition-colors cursor-pointer text-slate-400 hover:text-red-500 ${isFavorite ? 'text-red-500' : ''}`}
                    >
                      <Heart size={12} fill={isFavorite ? '#ef4444' : 'none'} />
                    </button>
                  </div>

                  {/* Product details */}
                  <div className="mt-3.5 space-y-1">
                    <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide">
                      {p.brand}
                    </p>
                    <h3 
                      onClick={() => onProductClick(p)}
                      className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-2 hover:text-[#f68b1e] cursor-pointer min-h-[32px] leading-snug transition-colors"
                    >
                      {p.title}
                    </h3>

                    {/* Ratings */}
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold">
                      <span className="text-yellow-500">★ {p.rating}</span>
                      <span>({p.reviewsCount})</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-3.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-1.5">
                  <div>
                    <span className="block text-xs font-black text-slate-900 dark:text-slate-100">
                      {formatPrice(p.price)}
                    </span>
                    {hasDiscount && (
                      <span className="text-[10px] text-slate-400 line-through">
                        {formatPrice(p.originalPrice!)}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => onAddToCart(p)}
                    className="bg-[#f68b1e]/10 hover:bg-[#f68b1e] text-[#f68b1e] hover:text-white p-2 rounded-xl transition-all cursor-pointer active:scale-95 flex-shrink-0"
                    title="Add to Basket"
                  >
                    <ShoppingCart size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. RECENTLY SEARCHED/VIEWED SECTION */}
      {recentSearches.length > 0 && (
        <div className="bg-slate-100/50 dark:bg-slate-950/20 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-5 shadow-xs">
          <div className="flex flex-wrap justify-between items-center mb-4 gap-3">
            <div>
              <h2 className="text-sm font-black uppercase text-slate-800 dark:text-slate-200 flex items-center gap-1.5 tracking-tight">
                <Eye className="text-slate-500 dark:text-slate-400" size={16} />
                <span>Recently Searched & Viewed Items</span>
              </h2>
              <p className="text-slate-400 dark:text-slate-500 text-[10px] font-bold">
                Your absolute recent product history. Safely stored locally.
              </p>
            </div>
            <button
              onClick={onClearHistory}
              className="text-[10px] text-slate-500 hover:text-red-500 font-black uppercase flex items-center gap-1 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-red-50 hover:border-red-200 px-3 py-1.5 rounded-lg transition-all active:scale-95 cursor-pointer"
            >
              <Trash2 size={11} />
              <span>Clear History</span>
            </button>
          </div>

          {/* Grid row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {recentSearches.map((p) => (
              <div
                key={`recent-${p.id}`}
                onClick={() => onProductClick(p)}
                className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-2.5 rounded-xl flex items-center gap-3 cursor-pointer hover:border-[#f68b1e]/40 hover:shadow-xs transition-all group"
              >
                <div className="w-10 h-10 bg-slate-50 dark:bg-slate-950 p-1 flex items-center justify-center rounded-lg flex-shrink-0 border border-slate-100 dark:border-slate-800/80 group-hover:scale-105 transition-transform">
                  <img 
                    src={p.image} 
                    alt={p.title} 
                    className="max-h-full max-w-full object-contain" 
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-extrabold text-slate-800 dark:text-slate-200 truncate group-hover:text-[#f68b1e] transition-colors">
                    {p.title.split(' - ')[0]}
                  </p>
                  <p className="text-[10px] font-black text-slate-500 mt-0.5">
                    {formatPrice(p.price)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
