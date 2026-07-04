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
  ChevronRight,
  TrendingUp,
  Tag,
  ShieldAlert,
  Zap,
  ShoppingBag as StoreIcon
} from 'lucide-react';
import { Category, Product } from '../types';
import { CATEGORIES } from '../data';

interface AmazonCategoryHubProps {
  categories: Category[];
  products: Product[];
  onSelectCategory: (catId: string) => void;
  fontSizeModifier: 'normal' | 'large' | 'xl';
}

// Icon mapper for categories
const getCategoryIcon = (iconName: string) => {
  switch (iconName) {
    case 'Smartphone': return <Smartphone className="text-orange-500" size={24} />;
    case 'Tv': return <Tv className="text-[#f68b1e]" size={24} />;
    case 'Shirt': return <Shirt className="text-indigo-500" size={24} />;
    case 'Home': return <Home className="text-emerald-500" size={24} />;
    case 'Sparkles': return <Sparkles className="text-pink-500" size={24} />;
    case 'ShoppingBag': return <ShoppingBag className="text-amber-500" size={24} />;
    case 'Leaf': return <Leaf className="text-lime-500" size={24} />;
    case 'Baby': return <Baby className="text-sky-500" size={24} />;
    case 'Users': return <Users className="text-teal-500" size={24} />;
    default: return <StoreIcon className="text-[#f68b1e]" size={24} />;
  }
};

const getCategoryDescription = (id: string) => {
  switch (id) {
    case 'phones': return 'Mobiles, iPads, smartwatches & local MoMo bundles.';
    case 'electronics': return 'Smart TVs, sound systems, fridges & home appliances.';
    case 'fashion': return 'Artisan Ugandan apparel, sneakers & designer accessories.';
    case 'home': return 'Ergonomic office desks, decor, beds & kitchen accessories.';
    case 'beauty': return 'Skincare creams, body sprays, hair products & local wellness.';
    case 'supermarket': return 'Sugar, soaps, household commodities & pantry hampers.';
    case 'farmers-market': return 'Fresh matooke, fruits, local vegetables & dairy packages.';
    case 'children': return 'Kids apparel, educational toys, strollers & baby accessories.';
    case 'men-women': return 'Formal wears, designer footwear, handbags & cosmetic kits.';
    default: return 'Discover hundreds of verified premium local listings.';
  }
};

export default function AmazonCategoryHub({
  categories,
  products,
  onSelectCategory,
  fontSizeModifier
}: AmazonCategoryHubProps) {

  // Helper to count products in a category
  const getProductCount = (catId: string) => {
    return products.filter(p => p.category === catId).length;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-12" id="amazon-category-hub">
      
      {/* 1. Header Branded Banner */}
      <div className="text-center max-w-3xl mx-auto space-y-3.5">
        <div className="inline-flex items-center gap-2 bg-[#f68b1e]/10 text-[#f68b1e] dark:bg-orange-950/40 dark:text-orange-400 text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full border border-[#f68b1e]/20">
          <Tag size={13} className="animate-bounce" />
          <span>Department Directory Hub</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-slate-50 tracking-tight leading-tight">
          Browse Amazon & Jumia <span className="text-orange-600 dark:text-orange-500 underline decoration-wavy decoration-[#f68b1e]/40">Departments</span>
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-2xl mx-auto">
          Choose from our carefully managed departments below. Real-time inventories sync with local merchants and express Boda Boda dispatchers instantly.
        </p>
      </div>

      {/* 2. Amazon-style Department Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {categories.map((cat) => {
          const count = getProductCount(cat.id);
          const desc = getCategoryDescription(cat.id);
          
          return (
            <div
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-xs hover:shadow-xl hover:border-[#f68b1e]/40 dark:hover:border-[#f68b1e]/40 transition-all duration-300 flex flex-col justify-between group cursor-pointer relative overflow-hidden"
            >
              {/* Top Section: Category Image (Huge and Satisfying) */}
              <div className="space-y-4">
                <div className="relative h-44 rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-950/40 flex items-center justify-center group/img">
                  {cat.imageUrl ? (
                    <img
                      src={cat.imageUrl}
                      alt={cat.name}
                      className="w-full h-full object-cover group-hover/img:scale-108 transition-transform duration-500 ease-out"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-tr from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center">
                      {getCategoryIcon(cat.icon)}
                    </div>
                  )}
                  
                  {/* Floating count tag */}
                  <span className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-black px-3 py-1 rounded-full border border-white/10">
                    {count} {count === 1 ? 'Product' : 'Products'} Listed
                  </span>
                </div>

                {/* Title & Icon Header */}
                <div className="flex items-start gap-3 pt-1">
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800/80 group-hover:bg-[#f68b1e]/10 group-hover:border-[#f68b1e]/20 transition-colors">
                    {getCategoryIcon(cat.icon)}
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-100 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                      {cat.name}
                    </h3>
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold leading-relaxed">
                      {desc}
                    </p>
                  </div>
                </div>
              </div>

              {/* Bottom Action Section */}
              <div className="mt-6 pt-3.5 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-slate-400 group-hover:text-orange-600 transition-colors">
                  Explore Department
                </span>
                <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80 group-hover:bg-[#f68b1e] group-hover:border-[#f68b1e] group-hover:text-white flex items-center justify-center transition-all">
                  <ChevronRight size={16} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Secure Trust Guarantees on Landing Page */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl grid grid-cols-1 md:grid-cols-3 gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-start gap-4 text-left">
          <div className="p-3 bg-orange-600/20 text-[#f68b1e] rounded-2xl border border-[#f68b1e]/20">
            <Zap size={22} className="animate-pulse" />
          </div>
          <div className="space-y-1">
            <h4 className="font-black text-sm uppercase tracking-wide text-orange-500">Instant Express Dispatch</h4>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              We leverage real-time delivery channels to dispatch your order with verified Boda Boda riders in Kampala within 2 to 5 hours maximum!
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4 text-left">
          <div className="p-3 bg-blue-600/20 text-blue-400 rounded-2xl border border-blue-500/20">
            <ShieldAlert size={22} />
          </div>
          <div className="space-y-1">
            <h4 className="font-black text-sm uppercase tracking-wide text-blue-400">Escrow Protected Wallets</h4>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              Payment is held safely in our central platform vault. Vendors are only paid after the customer inspects, tests, and signs off on the physical product.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4 text-left">
          <div className="p-3 bg-emerald-600/20 text-emerald-400 rounded-2xl border border-emerald-500/20">
            <TrendingUp size={22} />
          </div>
          <div className="space-y-1">
            <h4 className="font-black text-sm uppercase tracking-wide text-emerald-400">Verified Ugandan Merchants</h4>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              OliMart works closely with UNBS and registered local manufacturers to source genuine consumer items. Zero counterfeit tolerances.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
