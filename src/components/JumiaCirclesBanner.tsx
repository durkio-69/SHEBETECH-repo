import React, { useState, useEffect } from 'react';
import { Flame, Truck } from 'lucide-react';
import { getDokanCategories, DokanCategory } from '../lib/dokanStore';
import { getIconByName, getCategoryTheme } from '../lib/iconRegistry';

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
  const [categories, setCategories] = useState<DokanCategory[]>([]);

  // Pull departments live from the admin-managed category store, so any
  // category the admin creates shows up here automatically, no code edit needed.
  useEffect(() => {
    const load = () => setCategories(getDokanCategories());
    load();
    window.addEventListener('storage', load);
    return () => window.removeEventListener('storage', load);
  }, []);

  const departments = categories.filter((c) => !c.parentId);

  return (
    <div className="max-w-7xl mx-auto px-4 my-4" id="jumia-circles-section">
      {/* WHITE JUMIA-STYLE CONTAINER WITH CLEAN SHADOW */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-5 rounded-2xl shadow-xs">
        
        {/* Row Header */}
        <div className="flex flex-wrap justify-between items-center mb-5 gap-2 border-b border-slate-50 dark:border-slate-800/60 pb-3">
          <div>
            <h2 className="text-sm font-black uppercase text-slate-800 dark:text-white flex items-center gap-2">
              <span className="w-2.5 h-4 bg-[#EA6A0C] rounded-xs" />
              <span>Explore Olimart Departments</span>
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
          {departments.map((dept, i) => {
            const isFilterActive = currentCategory === dept.id;
            const theme = getCategoryTheme(i);
            const Icon = getIconByName(dept.icon);
            return (
              <button
                key={dept.id}
                onClick={() => {
                  onCategorySelect(dept.id);
                  const section = document.getElementById('shop-catalog-section') || document.getElementById('jumia-horizontal-category-products');
                  if (section) section.scrollIntoView({ behavior: 'smooth' });
                }}
                className="flex flex-col items-center group cursor-pointer flex-shrink-0 snap-start"
                style={{ width: '85px' }}
                title={`Browse ${dept.name}`}
              >
                <div 
                  className={`w-14 h-14 rounded-full ${theme.bg} ${theme.border} border flex items-center justify-center shadow-xs transition-all duration-300 group-hover:scale-110 group-active:scale-95 relative ${
                    isFilterActive ? 'ring-4 ring-[#EA6A0C]/30 border-[#EA6A0C] scale-105 bg-[#EA6A0C]/10' : 'group-hover:shadow-md'
                  }`}
                >
                  <Icon className={`w-6 h-6 ${theme.icon}`} />
                  {isFilterActive && (
                    <span className="absolute -top-1 -right-1 bg-[#EA6A0C] text-white text-[7px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wide border border-white dark:border-slate-950">
                      On
                    </span>
                  )}
                </div>
                <span className={`text-[10px] font-black mt-2.5 text-center leading-tight transition-colors line-clamp-2 max-w-[85px] ${
                  isFilterActive ? 'text-[#EA6A0C]' : 'text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white'
                }`}>
                  {dept.name}
                </span>
              </button>
            );
          })}

          {/* Fixed promo shortcuts, always shown after the dynamic departments */}
          <button
            onClick={() => {
              onSpecialTabSelect('flash-sales');
              const section = document.getElementById('shop-catalog-section') || document.getElementById('jumia-horizontal-category-products');
              if (section) section.scrollIntoView({ behavior: 'smooth' });
            }}
            className="flex flex-col items-center group cursor-pointer flex-shrink-0 snap-start"
            style={{ width: '85px' }}
            title="Browse Crazy Deals"
          >
            <div className="w-14 h-14 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-center justify-center shadow-xs transition-all duration-300 group-hover:scale-110 group-active:scale-95 group-hover:shadow-md">
              <Flame className="w-6 h-6 text-[#EA6A0C] animate-bounce" />
            </div>
            <span className="text-[10px] font-black mt-2.5 text-center leading-tight text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white line-clamp-2 max-w-[85px]">
              Crazy Deals
            </span>
          </button>

          <button
            onClick={() => onShowPromotion('Free Shipping Promo', 'Get free delivery on orders over Shs 150,000 within Kampala Central, Entebbe, and Wakiso District! Valid for payment made via MTN MoMo.')}
            className="flex flex-col items-center group cursor-pointer flex-shrink-0 snap-start"
            style={{ width: '85px' }}
            title="Free Delivery Info"
          >
            <div className="w-14 h-14 rounded-full bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-900/60 flex items-center justify-center shadow-xs transition-all duration-300 group-hover:scale-110 group-active:scale-95 group-hover:shadow-md">
              <Truck className="w-6 h-6 text-cyan-600 animate-pulse" />
            </div>
            <span className="text-[10px] font-black mt-2.5 text-center leading-tight text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white line-clamp-2 max-w-[85px]">
              Free Delivery
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
