import React from 'react';
import { 
  Zap, 
  Award, 
  TrendingUp, 
  ChevronRight, 
  ShoppingCart, 
  Star, 
  ArrowRight,
  Flame
} from 'lucide-react';
import { PRODUCTS } from '../data';
import { Product } from '../types';

interface AmazonShowcaseProps {
  products: Product[];
  onProductClick: (p: Product) => void;
  onAddToCart: (p: Product) => void;
  onSpecialTabSelect: (tab: 'all' | 'todays-deal' | 'flash-sales' | 'discount') => void;
  formatPrice: (priceInUgx: number) => string;
}

export default function AmazonShowcase({
  products,
  onProductClick,
  onAddToCart,
  onSpecialTabSelect,
  formatPrice
}: AmazonShowcaseProps) {
  // Extract real products for our showcase
  const techBestsellers = products.filter(p => p.category === 'phones').slice(0, 4);
  const soundBestsellers = products.filter(p => p.category === 'electronics').slice(0, 4);
  const fashionDiscounts = products.filter(p => p.category === 'fashion').slice(0, 4);
  const supermarketDeals = products.filter(p => p.category === 'supermarket').slice(0, 4);

  // General Best Sellers list with rankings (1 to 6)
  const rankedBestSellers = products.slice(4, 10); 

  // Hot Deals of the day
  const hotDeals = products.filter(p => p.originalPrice && p.originalPrice > p.price).slice(0, 4);

  return (
    <section className="max-w-7xl mx-auto px-4 py-6 space-y-8" id="amazon-showcase-section">
      
      {/* 1. AMAZON GATEWAY QUAD BENTO GRID (Requirement 3) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Quad Card 1: Today's Lightning Hot Deals */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-4 rounded-2xl flex flex-col justify-between shadow-xs">
          <div>
            <h3 className="font-black text-sm text-slate-900 dark:text-white uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
              <Flame size={15} className="text-red-600 animate-pulse" />
              <span>Hot Deals of the Day</span>
            </h3>
            <p className="text-[10px] text-slate-400 font-bold mb-3">Extreme savings available for limited times</p>
            
            <div className="grid grid-cols-2 gap-2">
              {hotDeals.map(p => (
                <div 
                  key={p.id}
                  onClick={() => onProductClick(p)}
                  className="bg-slate-50 dark:bg-slate-950 p-2 rounded-xl flex flex-col justify-between cursor-pointer border border-transparent hover:border-orange-500 transition-all group"
                >
                  <div className="aspect-square flex items-center justify-center p-1.5 overflow-hidden">
                    <img 
                      src={p.image} 
                      alt={p.title} 
                      className="max-h-16 object-contain group-hover:scale-105 transition-transform" 
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="mt-1 space-y-0.5">
                    <p className="text-[9px] font-black text-red-600 bg-red-50 dark:bg-red-950/40 px-1 py-0.5 rounded text-center inline-block">
                      {p.discountBadge || 'SAVE'}
                    </p>
                    <p className="text-[10px] font-bold text-slate-800 dark:text-slate-200 truncate">{p.title.split(' - ')[0]}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <button 
            onClick={() => onSpecialTabSelect('todays-deal')}
            className="text-xs font-bold text-[#f68b1e] hover:text-[#e07510] mt-4 flex items-center gap-1 group/btn text-left"
          >
            <span>See all Hot Deals</span>
            <ChevronRight size={14} className="group-hover/btn:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Quad Card 2: Best Sellers in Electronics */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-4 rounded-2xl flex flex-col justify-between shadow-xs">
          <div>
            <h3 className="font-black text-sm text-slate-900 dark:text-white uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
              <Award size={15} className="text-[#f68b1e]" />
              <span>Bestselling Gadgets</span>
            </h3>
            <p className="text-[10px] text-slate-400 font-bold mb-3">Top selling appliances and smart devices</p>
            
            <div className="grid grid-cols-2 gap-2">
              {soundBestsellers.map(p => (
                <div 
                  key={p.id}
                  onClick={() => onProductClick(p)}
                  className="bg-slate-50 dark:bg-slate-950 p-2 rounded-xl flex flex-col justify-between cursor-pointer border border-transparent hover:border-orange-500 transition-all group"
                >
                  <div className="aspect-square flex items-center justify-center p-1.5 overflow-hidden">
                    <img 
                      src={p.image} 
                      alt={p.title} 
                      className="max-h-16 object-contain group-hover:scale-105 transition-transform" 
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="mt-1">
                    <p className="text-[10px] font-black text-slate-900 dark:text-slate-100">{formatPrice(p.price)}</p>
                    <p className="text-[9px] text-slate-400 truncate font-semibold">{p.brand}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <button 
            onClick={() => onSpecialTabSelect('todays-deal')}
            className="text-xs font-bold text-[#f68b1e] hover:text-[#e07510] mt-4 flex items-center gap-1 group/btn text-left"
          >
            <span>Explore best sellers</span>
            <ChevronRight size={14} className="group-hover/btn:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Quad Card 3: Top Fashion Outlet Deals */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-4 rounded-2xl flex flex-col justify-between shadow-xs">
          <div>
            <h3 className="font-black text-sm text-slate-900 dark:text-white uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
              <Zap size={15} className="text-[#f68b1e]" />
              <span>Fashion & Lifestyle</span>
            </h3>
            <p className="text-[10px] text-slate-400 font-bold mb-3">Factory direct clothing, watches, and bags</p>
            
            <div className="grid grid-cols-2 gap-2">
              {fashionDiscounts.map(p => (
                <div 
                  key={p.id}
                  onClick={() => onProductClick(p)}
                  className="bg-slate-50 dark:bg-slate-950 p-2 rounded-xl flex flex-col justify-between cursor-pointer border border-transparent hover:border-orange-500 transition-all group"
                >
                  <div className="aspect-square flex items-center justify-center p-1.5 overflow-hidden">
                    <img 
                      src={p.image} 
                      alt={p.title} 
                      className="max-h-16 object-contain group-hover:scale-105 transition-transform" 
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="mt-1 space-y-0.5">
                    <p className="text-[9px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-1 py-0.5 rounded text-center inline-block">
                      {p.discountBadge || 'Save'}
                    </p>
                    <p className="text-[10px] font-bold text-slate-800 dark:text-slate-200 truncate">{p.title.split(' - ')[0]}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <button 
            onClick={() => onSpecialTabSelect('discount')}
            className="text-xs font-bold text-[#f68b1e] hover:text-[#e07510] mt-4 flex items-center gap-1 group/btn text-left"
          >
            <span>Browse fashion discounts</span>
            <ChevronRight size={14} className="group-hover/btn:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Quad Card 4: Daily Supermarket Hampers */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-4 rounded-2xl flex flex-col justify-between shadow-xs">
          <div>
            <h3 className="font-black text-sm text-slate-900 dark:text-white uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
              <TrendingUp size={15} className="text-emerald-500" />
              <span>Supermarket Staples</span>
            </h3>
            <p className="text-[10px] text-slate-400 font-bold mb-3">Fresh dairy, home, pantry essentials</p>
            
            <div className="grid grid-cols-2 gap-2">
              {supermarketDeals.map(p => (
                <div 
                  key={p.id}
                  onClick={() => onProductClick(p)}
                  className="bg-slate-50 dark:bg-slate-950 p-2 rounded-xl flex flex-col justify-between cursor-pointer border border-transparent hover:border-orange-500 transition-all group"
                >
                  <div className="aspect-square flex items-center justify-center p-1.5 overflow-hidden">
                    <img 
                      src={p.image} 
                      alt={p.title} 
                      className="max-h-16 object-contain group-hover:scale-105 transition-transform" 
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="mt-1">
                    <p className="text-[10px] font-black text-slate-950 dark:text-slate-50">{formatPrice(p.price)}</p>
                    <p className="text-[9px] text-slate-400 truncate font-semibold">{p.title.split(' - ')[0]}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <button 
            onClick={() => onSpecialTabSelect('discount')}
            className="text-xs font-bold text-[#f68b1e] hover:text-[#e07510] mt-4 flex items-center gap-1 group/btn text-left"
          >
            <span>Shop essentials</span>
            <ChevronRight size={14} className="group-hover/btn:translate-x-0.5 transition-transform" />
          </button>
        </div>

      </div>

      {/* 2. AMAZON BEST SELLERS CIRCULAR CAROUSEL (Requirement 3) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-5 rounded-2xl shadow-xs space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="space-y-0.5">
            <h2 className="font-black text-sm text-slate-900 dark:text-slate-50 uppercase tracking-wide flex items-center gap-1.5">
              <Award size={16} className="text-[#f68b1e] animate-bounce" />
              <span>Amazon Style Best Sellers in Uganda</span>
            </h2>
            <p className="text-[10px] text-slate-400 font-bold">The most popular items on OliMart based on sales volume, updated hourly.</p>
          </div>
          <span className="text-[9px] font-black text-[#f68b1e] bg-orange-50 dark:bg-orange-950/40 px-2 py-1 rounded">
            Updated Hourly
          </span>
        </div>

        {/* Carousel */}
        <div className="flex gap-6 overflow-x-auto pb-4 pt-1 scrollbar-none snap-x">
          {rankedBestSellers.map((p, idx) => {
            const rank = idx + 1;
            return (
              <div 
                key={p.id}
                onClick={() => onProductClick(p)}
                className="w-48 flex-shrink-0 relative group cursor-pointer snap-start flex gap-2"
              >
                {/* Massive overlapping ranking number just like Amazon */}
                <div className="absolute -left-3 bottom-0 text-[100px] font-black leading-none text-slate-200/90 dark:text-slate-800/70 select-none z-0 font-sans tracking-tighter">
                  {rank}
                </div>

                {/* Main product card layout, shifted right to make space for overlapping rank */}
                <div className="w-full pl-8 z-10 flex flex-col space-y-2">
                  <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-3 aspect-square flex items-center justify-center overflow-hidden border border-slate-100 dark:border-slate-800 relative shadow-xs">
                    <img 
                      src={p.image} 
                      alt={p.title} 
                      className="max-h-24 object-contain group-hover:scale-105 transition-transform duration-200" 
                      referrerPolicy="no-referrer"
                    />
                    <span className="absolute top-2 left-2 bg-slate-950 text-white text-[8px] font-black px-1.5 py-0.5 rounded">
                      Rank #{rank}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <p className="text-[8px] font-black text-[#f68b1e] uppercase tracking-wider">{p.brand}</p>
                    <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 line-clamp-1 group-hover:text-[#f68b1e] transition-colors leading-tight">
                      {p.title}
                    </h4>
                    
                    {/* Stars */}
                    <div className="flex items-center gap-0.5 text-yellow-500 text-[10px]">
                      <span>★</span>
                      <span className="text-slate-600 dark:text-slate-300 font-bold ml-0.5">{p.rating}</span>
                      <span className="text-slate-400 font-semibold text-[9px]">({p.reviewsCount})</span>
                    </div>

                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xs font-black text-slate-950 dark:text-white">{formatPrice(p.price)}</span>
                      {p.originalPrice && (
                        <span className="text-[9px] line-through text-slate-400">{formatPrice(p.originalPrice)}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
