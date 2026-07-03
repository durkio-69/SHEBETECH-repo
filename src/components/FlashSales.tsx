import React, { useState, useEffect } from 'react';
import { Zap, Clock, ChevronLeft, ChevronRight, ShoppingCart, Star, Heart, Eye } from 'lucide-react';
import { PRODUCTS } from '../data';
import { Product } from '../types';

interface FlashSalesProps {
  onAddToCart: (p: Product) => void;
  onProductClick: (p: Product) => void;
  watchlist: string[];
  onToggleWatchlist: (productId: string) => void;
  formatPrice: (priceInUgx: number) => string;
}

export default function FlashSales({ 
  onAddToCart,
  onProductClick,
  watchlist,
  onToggleWatchlist,
  formatPrice
}: FlashSalesProps) {
  const [timeLeft, setTimeLeft] = useState({ hours: 4, minutes: 12, seconds: 45 });
  
  // Filter products that have flash sales
  const flashProducts = PRODUCTS.filter(p => p.isFlashSale);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else {
          return { hours: 8, minutes: 0, seconds: 0 }; // Reset
        }
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const scrollLeft = () => {
    const container = document.getElementById('flash-sale-scroll');
    if (container) {
      container.scrollBy({ left: -280, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    const container = document.getElementById('flash-sale-scroll');
    if (container) {
      container.scrollBy({ left: 280, behavior: 'smooth' });
    }
  };

  // Mock static "claimed progress" values for items
  const claimedProgress: Record<string, number> = {
    'p1': 78,
    'p3': 64,
    'p5': 89,
    'p8': 92,
    'p9': 50,
    'p12': 83,
    'p14': 95,
    'p16': 42,
  };

  return (
    <section className="max-w-7xl mx-auto my-6 rounded-xl overflow-hidden shadow-xs border border-red-700/10 bg-[#e61601] dark:bg-red-950/20" id="flash-sales-section">
      
      {/* JUMIA RED FLASH SALES HEADER BAR */}
      <div className="px-4 py-3.5 flex items-center justify-between flex-wrap gap-4 text-white">
        <div className="flex items-center gap-2.5">
          <div className="bg-white text-[#e61601] p-1.5 rounded-lg font-black animate-pulse shadow-sm">
            <Zap size={16} fill="#e61601" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-white">
                MoMo Flash Sales
              </h2>
              <span className="bg-yellow-400 text-slate-900 text-[8px] font-black px-1.5 py-0.5 rounded-xs uppercase tracking-wide animate-pulse">
                Live Now
              </span>
            </div>
            <p className="text-[10px] text-red-100 font-medium">
              Limited items, pay with MTN MoMo or Airtel Money for discounts!
            </p>
          </div>
        </div>

        {/* Timer & Navigation Controls */}
        <div className="flex items-center gap-4 ml-auto sm:ml-0">
          {/* Ticking Countdown Timer */}
          <div className="flex items-center gap-1.5 bg-black/20 px-3 py-1.5 rounded-lg border border-white/10">
            <Clock size={12} className="text-white" />
            <span className="text-[9px] font-bold text-red-100 uppercase tracking-wide">Ends In:</span>
            <div className="flex items-center gap-0.5 font-mono font-black text-xs text-yellow-300">
              <span>{String(timeLeft.hours).padStart(2, '0')}</span>:
              <span>{String(timeLeft.minutes).padStart(2, '0')}</span>:
              <span className="animate-pulse">{String(timeLeft.seconds).padStart(2, '0')}</span>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="hidden sm:flex items-center gap-1">
            <button 
              onClick={scrollLeft}
              className="bg-black/25 hover:bg-black/45 text-white p-1.5 rounded-full transition-colors cursor-pointer"
              title="Slide left"
            >
              <ChevronLeft size={14} />
            </button>
            <button 
              onClick={scrollRight}
              className="bg-black/25 hover:bg-black/45 text-white p-1.5 rounded-full transition-colors cursor-pointer"
              title="Slide right"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* WHITE CONTAINER NESTING FLUID SCROLL GRID */}
      <div className="bg-white p-4 dark:bg-slate-900 border-t border-red-700/15">
        <div 
          id="flash-sale-scroll"
          className="flex gap-4 overflow-x-auto pb-2 pt-1 snap-x scrollbar-none"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {flashProducts.map((product) => {
            const progress = claimedProgress[product.id] || 60;
            return (
              <div 
                key={product.id}
                className="w-[190px] sm:w-[210px] flex-shrink-0 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl p-3 shadow-xs hover:shadow-md transition-all duration-200 snap-start flex flex-col justify-between relative group"
              >
                {/* Image Area */}
                <div className="relative mb-2.5 bg-slate-50 dark:bg-slate-700/50 rounded-lg p-2 overflow-hidden flex items-center justify-center h-32">
                  <span className="absolute top-1.5 left-1.5 bg-[#e61601] text-white font-black text-[9px] px-1.5 py-0.5 rounded-sm z-10 shadow-xs">
                    {product.discountBadge}
                  </span>
                  
                  {product.isOfficial && (
                    <span className="absolute top-1.5 right-1.5 bg-blue-600 text-white font-bold text-[7px] uppercase tracking-wider px-1.5 py-0.5 rounded-xs z-10">
                      Official
                    </span>
                  )}

                  <img
                    src={product.image}
                    alt={product.title}
                    className="max-h-full max-w-full object-contain rounded-md group-hover:scale-105 transition-transform duration-300 cursor-pointer"
                    referrerPolicy="no-referrer"
                    onClick={() => onProductClick(product)}
                  />
                  
                  {/* Floating Action Details */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onProductClick(product);
                    }}
                    className="absolute bottom-1.5 left-1.5 p-1.5 rounded-full bg-white border border-slate-100 text-slate-400 hover:text-[#e61601] hover:bg-red-50 shadow-xs transition-all z-20 opacity-0 group-hover:opacity-100 cursor-pointer"
                    title="Quick specs"
                  >
                    <Eye size={11} />
                  </button>

                  {/* Watchlist Star Toggle */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleWatchlist(product.id);
                    }}
                    className={`absolute bottom-1.5 right-1.5 p-1.5 rounded-full shadow-xs border transition-all z-20 opacity-0 group-hover:opacity-100 cursor-pointer ${
                      watchlist.includes(product.id)
                        ? 'bg-red-50 border-red-100 text-red-500'
                        : 'bg-white border-slate-100 text-slate-400 hover:text-red-500 hover:bg-slate-50'
                    }`}
                    title="Toggle Watchlist"
                  >
                    <Heart size={11} className={watchlist.includes(product.id) ? "fill-red-500 text-red-500" : ""} />
                  </button>
                </div>

                {/* Info and price */}
                <div className="space-y-1">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-wide">
                    {product.brand}
                  </p>
                  <h3 
                    onClick={() => onProductClick(product)}
                    className="font-bold text-[11px] text-slate-800 dark:text-slate-200 line-clamp-2 h-7 leading-tight hover:text-[#f68b1e] transition-colors cursor-pointer"
                  >
                    {product.title}
                  </h3>

                  {/* Rating indicator */}
                  <div className="flex items-center gap-1">
                    <Star size={10} fill="#eab308" stroke="none" />
                    <span className="text-[9px] font-black text-slate-700 dark:text-slate-300">{product.rating}</span>
                    <span className="text-[9px] text-slate-400">({product.reviewsCount})</span>
                  </div>

                  {/* Price info block */}
                  <div className="flex items-baseline gap-1 pt-0.5">
                    <span className="text-xs font-black text-[#e61601]">
                      {formatPrice(product.price)}
                    </span>
                    {product.originalPrice && (
                      <span className="text-[9px] line-through text-slate-400 font-bold">
                        {formatPrice(product.originalPrice)}
                      </span>
                    )}
                  </div>

                  {/* Stock progress ticker */}
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-[8px] font-black text-slate-500">
                      <span>Sold: {progress}%</span>
                      <span className={progress > 85 ? 'text-[#e61601] animate-pulse font-black' : ''}>
                        {progress > 85 ? 'Almost Out' : 'Selling Fast'}
                      </span>
                    </div>
                    <div className="w-full h-1 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${progress > 85 ? 'bg-red-600' : 'bg-[#f68b1e]'}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* High contrast add to cart */}
                <button
                  onClick={() => onAddToCart(product)}
                  className="w-full bg-[#e61601] text-white hover:bg-[#c21000] py-2 rounded-lg text-[10px] font-black flex items-center justify-center gap-1 mt-2.5 transition-colors active:scale-95 cursor-pointer uppercase tracking-wider"
                >
                  <ShoppingCart size={11} />
                  <span>Add to Cart</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
