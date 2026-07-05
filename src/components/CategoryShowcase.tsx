import React, { useState, useEffect } from 'react';
import { ArrowRight, Store, Layers } from 'lucide-react';
import { PRODUCTS } from '../data';
import { getDokanCategories, DokanCategory } from '../lib/dokanStore';
import { getIconByName } from '../lib/iconRegistry';

interface CategoryShowcaseProps {
  onSelectCategory: (catId: string) => void;
}

export default function CategoryShowcase({ onSelectCategory }: CategoryShowcaseProps) {
  const [categories, setCategories] = useState<DokanCategory[]>([]);

  // Load categories from the admin-managed store, and keep them live:
  // any category the admin creates/edits will show up here without a code change.
  useEffect(() => {
    const load = () => setCategories(getDokanCategories());
    load();
    window.addEventListener('storage', load);
    return () => window.removeEventListener('storage', load);
  }, []);

  const topLevel = categories.filter((c) => !c.parentId);
  const subcategories = categories.filter((c) => !!c.parentId);

  // Fallback image for admin-created categories that didn't set one
  const FALLBACK_IMG = 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=500&q=80';

  const tiles = topLevel.map((cat) => ({
    ...cat,
    count: PRODUCTS.filter((p) => p.category === cat.id).length,
  }));

  const scrollToCatalog = () => {
    const section =
      document.getElementById('shop-catalog-section') ||
      document.getElementById('jumia-horizontal-category-products');
    if (section) section.scrollIntoView({ behavior: 'smooth' });
  };

  const handlePick = (id: string) => {
    onSelectCategory(id);
    scrollToCatalog();
  };

  return (
    <section className="max-w-7xl mx-auto px-4 my-4" id="category-showcase-section">
      <div className="flex items-end justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-4 bg-[#EA6A0C] rounded-xs" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Storefronts &amp; Departments</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Shop by Category
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Browse top departments from verified vendors across Uganda
          </p>
        </div>
        <button
          onClick={scrollToCatalog}
          className="hidden sm:flex items-center gap-1 text-xs font-black text-[#EA6A0C] hover:text-[#C2560A] transition-colors uppercase tracking-wide cursor-pointer flex-shrink-0"
        >
          See All Departments <ArrowRight size={14} />
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {tiles.map((tile) => (
          <button
            key={tile.id}
            onClick={() => handlePick(tile.id)}
            className="group relative rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-xs hover:shadow-lg transition-all duration-300 aspect-[4/5] text-left cursor-pointer"
            title={`Shop ${tile.name}`}
          >
            <img
              src={tile.imageUrl || FALLBACK_IMG}
              alt={tile.name}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/25 to-transparent" />

            <span className="absolute top-2 left-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs text-slate-800 dark:text-slate-100 text-[8px] sm:text-[9px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
              <Store size={9} className="text-[#EA6A0C]" />
              {tile.count}+ items
            </span>

            <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
              <h3 className="text-white font-black text-xs sm:text-sm leading-tight drop-shadow-sm">
                {tile.name}
              </h3>
              <span className="text-[9px] sm:text-[10px] font-bold text-white/80 flex items-center gap-1 mt-0.5 group-hover:text-[#ffb84d] transition-colors">
                Shop now <ArrowRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          </button>
        ))}

        {tiles.length === 0 && (
          <div className="col-span-full text-center text-xs text-slate-400 font-semibold py-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
            No departments published yet. Categories created in the Admin panel will appear here automatically.
          </div>
        )}
      </div>

      {/* Subcategories, published by admin, grouped under their parent department */}
      {subcategories.length > 0 && (
        <div className="mt-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center gap-1.5 mb-3">
            <Layers size={13} className="text-[#EA6A0C]" />
            <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
              Shop by Subcategory
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {subcategories.map((sub) => {
              const Icon = getIconByName(sub.icon);
              const parent = topLevel.find((t) => t.id === sub.parentId);
              return (
                <button
                  key={sub.id}
                  onClick={() => handlePick(sub.id)}
                  title={parent ? `${sub.name} — under ${parent.name}` : sub.name}
                  className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-[#EA6A0C]/10 border border-slate-150 dark:border-slate-700 hover:border-[#EA6A0C] text-slate-700 dark:text-slate-300 hover:text-[#EA6A0C] text-[11px] font-bold px-3 py-1.5 rounded-full transition-colors cursor-pointer"
                >
                  <Icon size={12} />
                  {sub.name}
                  {parent && (
                    <span className="text-[9px] font-black uppercase text-slate-400 group-hover:text-[#EA6A0C]">
                      &bull; {parent.name}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
