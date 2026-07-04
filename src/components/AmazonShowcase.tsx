import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Award, 
  TrendingUp, 
  ChevronRight, 
  ShoppingCart, 
  Star, 
  Flame,
  Timer,
  ShieldCheck,
  Truck,
  RotateCcw,
  Sparkles
} from 'lucide-react';
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
  // Live Countdown Timer for Lightning Deals
  const [timeLeft, setTimeLeft] = useState({ hours: 4, minutes: 21, seconds: 45 });

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else {
          return { hours: 11, minutes: 59, seconds: 59 };
        }
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTimerString = () => {
    const h = String(timeLeft.hours).padStart(2, '0');
    const m = String(timeLeft.minutes).padStart(2, '0');
    const s = String(timeLeft.seconds).padStart(2, '0');
    return `${h}h : ${m}m : ${s}s`;
  };

  // Extract products dynamically
  const phonesList = products.filter(p => p.category === 'phones').slice(0, 4);
  const electronicsList = products.filter(p => p.category === 'electronics').slice(0, 4);
  const fashionList = products.filter(p => p.category === 'fashion').slice(0, 4);
  const supermarketList = products.filter(p => p.category === 'supermarket').slice(0, 4);

  // Rankings
  const rankedBestSellers = products.slice(0, 6);

  // Lightning deals claim metrics simulated using stable hashes of product IDs
  const getClaimedPercent = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs((hash % 45) + 40); // Generates stable claimed rate between 40% and 85%
  };

  return (
    <section className="bg-[#eaeded] dark:bg-slate-950 -mx-4 px-4 py-8 space-y-8" id="amazon-showcase-section">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* 1. AMAZON GATEWAY QUAD BENTO GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          
          {/* Card 1: Today's Lightning Hot Deals */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 p-5 rounded-sm flex flex-col justify-between shadow-xs">
            <div>
              <h3 className="font-extrabold text-lg text-slate-900 dark:text-white tracking-tight mb-1 flex items-center gap-1.5">
                <Flame size={18} className="text-red-600 animate-pulse" />
                <span>Today's Hot Deals</span>
              </h3>
              <p className="text-[10px] text-slate-400 font-bold mb-4">Limited-time extreme markdowns</p>
              
              <div className="grid grid-cols-2 gap-3">
                {phonesList.map(p => {
                  const discount = p.originalPrice ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100) : 15;
                  return (
                    <div 
                      key={`quad-phone-${p.id}`}
                      onClick={() => onProductClick(p)}
                      className="bg-slate-50 dark:bg-slate-950 p-2 rounded-xs flex flex-col justify-between cursor-pointer hover:shadow-sm transition-all group border border-slate-100 dark:border-slate-800 hover:border-orange-500/40"
                    >
                      <div className="aspect-square flex items-center justify-center p-1 bg-white dark:bg-slate-900 rounded-sm overflow-hidden">
                        <img 
                          src={p.image} 
                          alt={p.title} 
                          className="max-h-16 object-contain group-hover:scale-105 transition-transform" 
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="mt-2 text-left">
                        <span className="text-[9px] font-black text-red-600 bg-red-50 dark:bg-red-950/40 px-1.5 py-0.5 rounded">
                          -{discount}%
                        </span>
                        <p className="text-[10px] font-bold text-slate-800 dark:text-slate-200 mt-1 truncate">{(p?.title || '').split(' - ')[0]}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <button 
              onClick={() => onSpecialTabSelect('todays-deal')}
              className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:text-orange-500 hover:underline mt-4 text-left flex items-center gap-0.5 self-start"
            >
              <span>See all deals</span>
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Card 2: Electronics & Sound */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 p-5 rounded-sm flex flex-col justify-between shadow-xs">
            <div>
              <h3 className="font-extrabold text-lg text-slate-900 dark:text-white tracking-tight mb-1 flex items-center gap-1.5">
                <Award size={18} className="text-[#f68b1e]" />
                <span>Bestselling Gadgets</span>
              </h3>
              <p className="text-[10px] text-slate-400 font-bold mb-4">Highly rated smart appliances</p>
              
              <div className="grid grid-cols-2 gap-3">
                {electronicsList.map(p => (
                  <div 
                    key={`quad-elec-${p.id}`}
                    onClick={() => onProductClick(p)}
                    className="bg-slate-50 dark:bg-slate-950 p-2 rounded-xs flex flex-col justify-between cursor-pointer hover:shadow-sm transition-all group border border-slate-100 dark:border-slate-800 hover:border-orange-500/40"
                  >
                    <div className="aspect-square flex items-center justify-center p-1 bg-white dark:bg-slate-900 rounded-sm overflow-hidden">
                      <img 
                        src={p.image} 
                        alt={p.title} 
                        className="max-h-16 object-contain group-hover:scale-105 transition-transform" 
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="mt-2 text-left">
                      <p className="text-[10px] font-black text-slate-900 dark:text-slate-100">{formatPrice(p.price)}</p>
                      <p className="text-[9px] text-slate-400 font-bold truncate">{(p?.title || '').split(' - ')[0]}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <button 
              onClick={() => onSpecialTabSelect('todays-deal')}
              className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:text-orange-500 hover:underline mt-4 text-left flex items-center gap-0.5 self-start"
            >
              <span>Explore top selling</span>
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Card 3: Top Fashion Outlet Deals */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 p-5 rounded-sm flex flex-col justify-between shadow-xs">
            <div>
              <h3 className="font-extrabold text-lg text-slate-900 dark:text-white tracking-tight mb-1 flex items-center gap-1.5">
                <Sparkles size={18} className="text-[#f68b1e]" />
                <span>Trendy Fashion Deals</span>
              </h3>
              <p className="text-[10px] text-slate-400 font-bold mb-4">Wardrobe updates & luxury watches</p>
              
              <div className="grid grid-cols-2 gap-3">
                {fashionList.map(p => (
                  <div 
                    key={`quad-fashion-${p.id}`}
                    onClick={() => onProductClick(p)}
                    className="bg-slate-50 dark:bg-slate-950 p-2 rounded-xs flex flex-col justify-between cursor-pointer hover:shadow-sm transition-all group border border-slate-100 dark:border-slate-800 hover:border-orange-500/40"
                  >
                    <div className="aspect-square flex items-center justify-center p-1 bg-white dark:bg-slate-900 rounded-sm overflow-hidden">
                      <img 
                        src={p.image} 
                        alt={p.title} 
                        className="max-h-16 object-contain group-hover:scale-105 transition-transform" 
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="mt-2 text-left">
                      <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded">
                        Save Deal
                      </span>
                      <p className="text-[10px] font-bold text-slate-800 dark:text-slate-200 mt-1 truncate">{(p?.title || '').split(' - ')[0]}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <button 
              onClick={() => onSpecialTabSelect('discount')}
              className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:text-orange-500 hover:underline mt-4 text-left flex items-center gap-0.5 self-start"
            >
              <span>See more fashion</span>
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Card 4: Daily Supermarket Staples */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 p-5 rounded-sm flex flex-col justify-between shadow-xs">
            <div>
              <h3 className="font-extrabold text-lg text-slate-900 dark:text-white tracking-tight mb-1 flex items-center gap-1.5">
                <TrendingUp size={18} className="text-emerald-500" />
                <span>Groceries & Staples</span>
              </h3>
              <p className="text-[10px] text-slate-400 font-bold mb-4">Pantry milk, oil and soap packages</p>
              
              <div className="grid grid-cols-2 gap-3">
                {supermarketList.map(p => (
                  <div 
                    key={`quad-staples-${p.id}`}
                    onClick={() => onProductClick(p)}
                    className="bg-slate-50 dark:bg-slate-950 p-2 rounded-xs flex flex-col justify-between cursor-pointer hover:shadow-sm transition-all group border border-slate-100 dark:border-slate-800 hover:border-orange-500/40"
                  >
                    <div className="aspect-square flex items-center justify-center p-1 bg-white dark:bg-slate-900 rounded-sm overflow-hidden">
                      <img 
                        src={p.image} 
                        alt={p.title} 
                        className="max-h-16 object-contain group-hover:scale-105 transition-transform" 
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="mt-2 text-left">
                      <p className="text-[10px] font-black text-slate-950 dark:text-slate-50">{formatPrice(p.price)}</p>
                      <p className="text-[9px] text-slate-400 font-bold truncate">{(p?.title || '').split(' - ')[0]}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <button 
              onClick={() => onSpecialTabSelect('discount')}
              className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:text-orange-500 hover:underline mt-4 text-left flex items-center gap-0.5 self-start"
            >
              <span>Shop breakfast essentials</span>
              <ChevronRight size={14} />
            </button>
          </div>

        </div>

        {/* 2. REALTIME LIGHTNING DEALS SHELF WITH PROGRESS BARS */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 p-6 rounded-sm shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="font-extrabold text-xl text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <Zap size={20} className="text-amber-500 animate-bounce" />
                <span>Today's Lightning Deals</span>
              </h2>
              <div className="flex items-center gap-1.5 bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 px-2.5 py-1 rounded-md text-xs font-black uppercase">
                <Timer size={13} />
                <span>Deals end in: {formatTimerString()}</span>
              </div>
            </div>
            <button 
              onClick={() => onSpecialTabSelect('flash-sales')}
              className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:text-orange-500 hover:underline"
            >
              See all lightning offers &rarr;
            </button>
          </div>

          <div className="flex gap-5 overflow-x-auto pb-4 pt-2 scrollbar-none snap-x">
            {products.filter(p => p.isFlashSale).slice(0, 6).map(p => {
              const claimed = getClaimedPercent(p.id);
              const discountPercent = p.originalPrice ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100) : 25;
              return (
                <div 
                  key={`lightning-deal-${p.id}`}
                  className="w-52 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-sm p-4 flex flex-col justify-between flex-shrink-0 snap-start relative group"
                >
                  <div>
                    {/* Discount Pill */}
                    <span className="absolute top-3 left-3 bg-red-600 text-white text-[9px] font-black px-2 py-0.5 rounded-sm">
                      -{discountPercent}% OFF
                    </span>

                    {/* Image */}
                    <div 
                      onClick={() => onProductClick(p)}
                      className="aspect-square bg-white dark:bg-slate-900 rounded-sm p-3 flex items-center justify-center overflow-hidden border border-slate-100 dark:border-slate-800 cursor-pointer"
                    >
                      <img 
                        src={p.image} 
                        alt={p.title} 
                        className="max-h-28 object-contain group-hover:scale-105 transition-transform" 
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    {/* Metadata */}
                    <div className="mt-3 space-y-1.5 text-left">
                      <h4 
                        onClick={() => onProductClick(p)}
                        className="font-bold text-xs text-slate-800 dark:text-slate-200 line-clamp-1 hover:text-[#f68b1e] cursor-pointer"
                      >
                        {p.title}
                      </h4>
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-black text-slate-900 dark:text-white">
                          {formatPrice(p.price)}
                        </span>
                        {p.originalPrice && (
                          <span className="text-[10px] text-slate-400 line-through">
                            {formatPrice(p.originalPrice)}
                          </span>
                        )}
                      </div>

                      {/* Dynamic Claimed Progress Bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                          <span>{claimed}% claimed</span>
                          <span className="text-amber-600">Hurry up!</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-amber-500 h-full rounded-full transition-all duration-1000" 
                            style={{ width: `${claimed}%` }} 
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onAddToCart(p)}
                    className="w-full mt-4 bg-amber-400 hover:bg-amber-500 text-slate-900 py-2 rounded-md font-extrabold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                  >
                    <ShoppingCart size={13} />
                    <span>Add to Basket</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. AMAZON STYLE OVERLAPPING RANK BEST SELLERS */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 p-6 rounded-sm shadow-xs space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="space-y-0.5">
              <h2 className="font-extrabold text-lg text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
                <Award size={18} className="text-[#f68b1e]" />
                <span>OliMart Best Sellers in Uganda</span>
              </h2>
              <p className="text-[11px] text-slate-400 font-bold">Uganda's hourly top sellers. Based on dynamic sales and fast boda dispatches.</p>
            </div>
            <span className="text-[10px] font-black text-[#f68b1e] bg-orange-50 dark:bg-orange-950/40 px-2.5 py-1 rounded-sm border border-orange-100 dark:border-orange-900/30">
              ⚡ LIVE SALES
            </span>
          </div>

          <div className="flex gap-6 overflow-x-auto pb-6 pt-2 scrollbar-none snap-x">
            {rankedBestSellers.map((p, idx) => {
              const rank = idx + 1;
              return (
                <div 
                  key={`best-ranked-${p.id}`}
                  onClick={() => onProductClick(p)}
                  className="w-56 flex-shrink-0 relative group cursor-pointer snap-start flex gap-2"
                >
                  {/* Huge overlapping rank number exactly like real amazon */}
                  <div className="absolute -left-4 bottom-0 text-[120px] font-black leading-none text-slate-200/80 dark:text-slate-800/50 select-none z-0 tracking-tighter select-none pointer-events-none font-sans italic">
                    {rank}
                  </div>

                  <div className="w-full pl-12 z-10 flex flex-col space-y-2">
                    <div className="bg-white dark:bg-slate-950 rounded-sm p-4 aspect-square flex items-center justify-center overflow-hidden border border-slate-100 dark:border-slate-800 relative shadow-xs">
                      <img 
                        src={p.image} 
                        alt={p.title} 
                        className="max-h-24 object-contain group-hover:scale-105 transition-transform duration-200" 
                        referrerPolicy="no-referrer"
                      />
                      <span className="absolute top-2 left-2 bg-slate-900 text-white text-[9px] font-black px-2 py-0.5 rounded-sm">
                        Rank #{rank}
                      </span>
                    </div>

                    <div className="space-y-1 text-left">
                      <p className="text-[9px] font-bold text-orange-500 uppercase tracking-wider">{p.brand}</p>
                      <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 line-clamp-2 group-hover:text-[#f68b1e] transition-colors leading-tight min-h-[32px]">
                        {p.title}
                      </h4>
                      
                      {/* Rating Stars */}
                      <div className="flex items-center gap-0.5 text-yellow-500 text-xs">
                        <span>★</span>
                        <span className="text-slate-600 dark:text-slate-300 font-bold ml-0.5">{p.rating}</span>
                        <span className="text-slate-400 font-bold text-[10px]">({p.reviewsCount})</span>
                      </div>

                      <div className="flex items-baseline gap-1.5">
                        <span className="text-xs font-black text-slate-950 dark:text-white">{formatPrice(p.price)}</span>
                        {p.originalPrice && (
                          <span className="text-[10px] line-through text-slate-400">{formatPrice(p.originalPrice)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. AMAZON-STYLE VALUE PROPOSITIONS BANNER */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 p-5 rounded-sm flex items-start gap-4">
            <div className="p-3 bg-orange-50 dark:bg-orange-950/30 text-orange-600 rounded-sm">
              <Truck size={20} />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider">Fast Courier Delivery</h4>
              <p className="text-[11px] text-slate-400 font-semibold mt-1 leading-normal">
                Order lightweight or bulky items and enjoy transparent dispatch via local boda-bodas straight to your doorstep.
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 p-5 rounded-sm flex items-start gap-4">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 rounded-sm">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider">Pay on Delivery Guarantee</h4>
              <p className="text-[11px] text-slate-400 font-semibold mt-1 leading-normal">
                Inspect items on pickup. Accept or reject instantly without payment risk. Supporting MTN MoMo & Airtel Money.
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 p-5 rounded-sm flex items-start gap-4">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 rounded-sm">
              <RotateCcw size={20} />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider">Hassle-Free Returns</h4>
              <p className="text-[11px] text-slate-400 font-semibold mt-1 leading-normal">
                Wrong size or incorrect description? Hand back the package immediately to the dispatch rider for prompt full refund.
              </p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
