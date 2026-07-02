import React, { useRef } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Star, 
  TrendingUp, 
  Heart, 
  Eye, 
  ShoppingCart, 
  Sparkles,
  Flame,
  CheckCircle2
} from 'lucide-react';
import { PRODUCTS } from '../data';
import { Product } from '../types';

interface CategoryGridProps {
  selectedCategory: string;
  onSelectCategory: (catId: string) => void;
  onProductClick: (p: Product) => void;
  onAddToCart: (p: Product) => void;
  watchlist: string[];
  onToggleWatchlist: (productId: string) => void;
  formatPrice: (priceInUgx: number) => string;
}

export default function CategoryGrid({ 
  selectedCategory, 
  onSelectCategory,
  onProductClick,
  onAddToCart,
  watchlist,
  onToggleWatchlist,
  formatPrice
}: CategoryGridProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Define trending products as ones with exceptionally high ratings (>= 4.7)
  const trendingProducts = PRODUCTS.filter(p => p.rating >= 4.7).slice(0, 10);

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -280, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 280, behavior: 'smooth' });
    }
  };

  return (
    <section className="py-8 px-4 max-w-7xl mx-auto" id="categories-section">
      {/* Header of Trending Section */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-[#f68b1e]/10 text-[#f68b1e] dark:bg-orange-950/40 dark:text-orange-400 font-extrabold text-[9px] uppercase tracking-wider px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Flame size={10} className="fill-orange-500 animate-pulse text-orange-600" />
              <span> Kampala Hot Trend</span>
            </span>
            <span className="text-[10px] text-slate-400 font-bold uppercase">• Best Sellers</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            Trending Products in Uganda
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Highly rated and most sought-after products by shoppers this week
          </p>
        </div>

        {/* Scroll Buttons */}
        <div className="flex items-center gap-1.5">
          <button 
            onClick={scrollLeft}
            className="p-2 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-full shadow-xs text-slate-600 dark:text-slate-300 hover:bg-orange-50 dark:hover:bg-slate-700 hover:text-orange-600 transition-colors cursor-pointer"
            title="Slide left"
          >
            <ChevronLeft size={16} />
          </button>
          <button 
            onClick={scrollRight}
            className="p-2 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-full shadow-xs text-slate-600 dark:text-slate-300 hover:bg-orange-50 dark:hover:bg-slate-700 hover:text-orange-600 transition-colors cursor-pointer"
            title="Slide right"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Horizontal Tray */}
      <div 
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-4 pt-1 snap-x scrollbar-none scroll-smooth"
      >
        {trendingProducts.map((p) => {
          const isLiked = watchlist.includes(p.id);

          return (
            <div 
              key={p.id}
              className="w-[240px] sm:w-[260px] flex-shrink-0 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 shadow-xs hover:shadow-md transition-all duration-200 snap-start flex flex-col justify-between relative group"
            >
              {/* Image & Floating Buttons */}
              <div className="relative mb-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl p-3 flex items-center justify-center overflow-hidden aspect-square">
                {/* Floating "Trending" Badge */}
                <span className="absolute top-2 left-2 bg-gradient-to-r from-[#f68b1e] to-red-600 text-white font-black text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-lg shadow-xs z-10 flex items-center gap-0.5">
                  <TrendingUp size={8} /> Trending
                </span>

                {p.discountBadge && (
                  <span className="absolute top-2 right-2 bg-red-600 text-white font-black text-[9px] px-1.5 py-0.5 rounded-md z-10">
                    {p.discountBadge}
                  </span>
                )}

                <img
                  src={p.image}
                  alt={p.title}
                  onClick={() => onProductClick(p)}
                  className="max-h-32 object-contain rounded-lg group-hover:scale-104 transition-transform duration-200 cursor-pointer"
                  referrerPolicy="no-referrer"
                />

                {/* Floating Action Buttons */}
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onProductClick(p);
                    }}
                    className="p-1.5 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-lg text-slate-500 hover:text-[#f68b1e] shadow-sm cursor-pointer"
                    title="Quick Details"
                  >
                    <Eye size={12} />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleWatchlist(p.id);
                    }}
                    className={`p-1.5 rounded-lg border shadow-sm cursor-pointer ${
                      isLiked 
                        ? 'bg-red-50 border-red-100 text-red-500' 
                        : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400 hover:text-red-500'
                    }`}
                    title={isLiked ? "Remove from watchlist" : "Add to watchlist"}
                  >
                    <Heart size={12} className={isLiked ? "fill-red-500" : ""} />
                  </button>
                </div>
              </div>

              {/* Text Info */}
              <div className="space-y-1 text-left flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{p.brand}</span>
                  {p.isOfficial && (
                    <span className="text-[7px] font-black text-blue-600 bg-blue-50 px-1 py-0.2 rounded-md flex items-center gap-0.5 uppercase tracking-wider">
                      <CheckCircle2 size={6} fill="currentColor" className="text-white" /> Official
                    </span>
                  )}
                </div>

                <h3 
                  onClick={() => onProductClick(p)}
                  className="font-bold text-[11px] sm:text-xs text-slate-800 dark:text-slate-100 line-clamp-2 h-8 hover:text-[#f68b1e] transition-colors cursor-pointer leading-tight"
                >
                  {p.title}
                </h3>

                <div className="flex items-center gap-1 pt-1">
                  <div className="flex text-yellow-400">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star 
                        key={i} 
                        size={8} 
                        fill={i < Math.floor(p.rating) ? 'currentColor' : 'none'} 
                        stroke="currentColor" 
                      />
                    ))}
                  </div>
                  <span className="text-[9px] font-black text-slate-600 dark:text-slate-400">{p.rating}</span>
                </div>

                {/* Price tag */}
                <div className="flex items-baseline gap-1.5 pt-1.5 justify-between">
                  <div>
                    <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-50">
                      {formatPrice(p.price)}
                    </span>
                    {p.originalPrice && (
                      <span className="text-[9px] line-through text-slate-400 font-medium block leading-none">
                        {formatPrice(p.originalPrice)}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => onAddToCart(p)}
                    className="p-1.5 sm:p-2 bg-[#f68b1e] hover:bg-[#e07510] text-white rounded-lg transition-colors cursor-pointer flex items-center justify-center shadow-xs"
                    title="Add to basket"
                  >
                    <ShoppingCart size={11} />
                  </button>
                </div>

              </div>

            </div>
          );
        })}
      </div>
    </section>
  );
}
