import React from 'react';
import { 
  Smartphone, 
  Tv, 
  Shirt, 
  Home, 
  Sparkles, 
  ShoppingBag, 
  Leaf, 
  Baby, 
  Users, 
  Flame, 
  Truck,
  Heart
} from 'lucide-react';
import { Product } from '../types';

interface JumiaCirclesBannerProps {
  onCategorySelect: (catId: string) => void;
  onSpecialTabSelect: (tab: 'all' | 'todays-deal' | 'flash-sales' | 'discount') => void;
  onShowPromotion: (promoTitle: string, promoDesc: string) => void;
  currentCategory: string;
}

export default function JumiaCirclesBanner({
  onCategorySelect,
  onSpecialTabSelect,
  onShowPromotion,
  currentCategory
}: JumiaCirclesBannerProps) {

  // Exact replication of Jumia Uganda circles (Categories with flat colorful background icons)
  const circles = [
    {
      id: 'phones',
      label: 'Phones & Tablets',
      icon: <Smartphone className="w-6 h-6 text-orange-600" />,
      action: () => onCategorySelect('phones'),
      bgColor: 'bg-orange-50 dark:bg-orange-950/40',
      borderColor: 'border-orange-200 dark:border-orange-900/60',
    },
    {
      id: 'electronics',
      label: 'TVs & Audio',
      icon: <Tv className="w-6 h-6 text-red-600" />,
      action: () => onCategorySelect('electronics'),
      bgColor: 'bg-red-50 dark:bg-red-950/40',
      borderColor: 'border-red-200 dark:border-red-900/60',
    },
    {
      id: 'supermarket',
      label: 'Supermarket',
      icon: <ShoppingBag className="w-6 h-6 text-emerald-600" />,
      action: () => onCategorySelect('supermarket'),
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/40',
      borderColor: 'border-emerald-200 dark:border-emerald-900/60',
    },
    {
      id: 'farmers-market',
      label: 'Farmers Market',
      icon: <Leaf className="w-6 h-6 text-green-600" />,
      action: () => onCategorySelect('farmers-market'),
      bgColor: 'bg-green-50 dark:bg-green-950/40',
      borderColor: 'border-green-200 dark:border-green-900/60',
    },
    {
      id: 'children',
      label: 'Children Dept',
      icon: <Baby className="w-6 h-6 text-sky-600" />,
      action: () => onCategorySelect('children'),
      bgColor: 'bg-sky-50 dark:bg-sky-950/40',
      borderColor: 'border-sky-200 dark:border-sky-900/60',
    },
    {
      id: 'men-women',
      label: 'Men & Women',
      icon: <Users className="w-6 h-6 text-purple-600" />,
      action: () => onCategorySelect('men-women'),
      bgColor: 'bg-purple-50 dark:bg-purple-950/40',
      borderColor: 'border-purple-200 dark:border-purple-900/60',
    },
    {
      id: 'fashion',
      label: 'All Fashion',
      icon: <Shirt className="w-6 h-6 text-indigo-600" />,
      action: () => onCategorySelect('fashion'),
      bgColor: 'bg-indigo-50 dark:bg-indigo-950/40',
      borderColor: 'border-indigo-200 dark:border-indigo-900/60',
    },
    {
      id: 'home',
      label: 'Home & Office',
      icon: <Home className="w-6 h-6 text-teal-600" />,
      action: () => onCategorySelect('home'),
      bgColor: 'bg-teal-50 dark:bg-teal-950/40',
      borderColor: 'border-teal-200 dark:border-teal-900/60',
    },
    {
      id: 'beauty',
      label: 'Health & Beauty',
      icon: <Sparkles className="w-6 h-6 text-pink-600" />,
      action: () => onCategorySelect('beauty'),
      bgColor: 'bg-pink-50 dark:bg-pink-950/40',
      borderColor: 'border-pink-200 dark:border-pink-900/60',
    },
    {
      id: 'flash-sales',
      label: 'Crazy Deals',
      icon: <Flame className="w-6 h-6 text-[#EA6A0C] animate-bounce" />,
      action: () => onSpecialTabSelect('flash-sales'),
      bgColor: 'bg-amber-50 dark:bg-amber-950/40',
      borderColor: 'border-amber-200 dark:border-amber-900/60',
    },
    {
      id: 'shipping',
      label: 'Free Delivery',
      icon: <Truck className="w-6 h-6 text-cyan-600 animate-pulse" />,
      action: () => onShowPromotion('Free Shipping Promo', 'Get free delivery on orders over Shs 150,000 within Kampala Central, Entebbe, and Wakiso District! Valid for payment made via MTN MoMo.'),
      bgColor: 'bg-cyan-50 dark:bg-cyan-950/40',
      borderColor: 'border-cyan-200 dark:border-cyan-900/60',
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 my-4" id="jumia-circles-section">
      {/* WHITE JUMIA-STYLE CONTAINER WITH CLEAN SHADOW */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-5 rounded-2xl shadow-xs">
        
        {/* Row Header */}
        <div className="flex flex-wrap justify-between items-center mb-5 gap-2 border-b border-slate-50 dark:border-slate-800/60 pb-3">
          <div>
            <h2 className="text-sm font-black uppercase text-slate-800 dark:text-white flex items-center gap-2">
              <span className="w-2.5 h-4 bg-[#EA6A0C] rounded-xs" />
              <span>Explore Jumia Uganda Departments</span>
            </h2>
            <p className="text-[10px] text-slate-400 font-bold mt-0.5">
              Select any circle department to view related products horizontally below
            </p>
          </div>
          <div className="flex items-center gap-1 bg-[#EA6A0C]/10 text-[#EA6A0C] text-[9px] font-black uppercase px-2.5 py-1 rounded-full">
            <span>Official Mall Stores</span>
          </div>
        </div>

        {/* Categories Circle Bubbles - Horizontal Scrollbar Friendly */}
        <div className="flex items-center gap-4 sm:gap-6 overflow-x-auto pb-2 scrollbar-none snap-x touch-pan-x justify-start lg:justify-between">
          {circles.map((circle) => {
            const isFilterActive = currentCategory === circle.id;
            return (
              <button
                key={circle.id}
                onClick={() => {
                  circle.action();
                  // Scroll to active category section
                  const section = document.getElementById('shop-catalog-section') || document.getElementById('jumia-horizontal-category-products');
                  if (section) {
                    section.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="flex flex-col items-center group cursor-pointer flex-shrink-0 snap-start"
                style={{ width: '85px' }}
                title={`Browse ${circle.label}`}
              >
                <div 
                  className={`w-14 h-14 rounded-full ${circle.bgColor} ${circle.borderColor} border flex items-center justify-center shadow-xs transition-all duration-300 group-hover:scale-110 group-active:scale-95 relative ${
                    isFilterActive ? 'ring-4 ring-[#EA6A0C]/30 border-[#EA6A0C] scale-105 bg-[#EA6A0C]/10' : 'group-hover:shadow-md'
                  }`}
                >
                  {circle.icon}
                  {isFilterActive && (
                    <span className="absolute -top-1 -right-1 bg-[#EA6A0C] text-white text-[7px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wide border border-white dark:border-slate-950">
                      On
                    </span>
                  )}
                </div>
                <span className={`text-[10px] font-black mt-2.5 text-center leading-tight transition-colors line-clamp-2 max-w-[85px] ${
                  isFilterActive ? 'text-[#EA6A0C]' : 'text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white'
                }`}>
                  {circle.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
