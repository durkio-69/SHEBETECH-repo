import React, { useState, useEffect } from 'react';
import { ArrowRight, Megaphone } from 'lucide-react';
import { getDokanBanners, DokanBanner } from '../lib/dokanStore';

interface MidPageBannerProps {
  onSelectCategory?: (catId: string) => void;
}

// Renders admin-editable advert banner(s) in the middle of the landing page.
// Admins manage these from Admin > Banners — no code changes required.
export default function MidPageBanner({ onSelectCategory }: MidPageBannerProps) {
  const [banners, setBanners] = useState<DokanBanner[]>([]);

  useEffect(() => {
    const load = () => {
      const active = getDokanBanners()
        .filter((b) => b.position === 'mid-page' && b.active)
        .sort((a, b) => a.order - b.order);
      setBanners(active);
    };
    load();
    window.addEventListener('storage', load);
    return () => window.removeEventListener('storage', load);
  }, []);

  if (banners.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 my-6 space-y-4" id="mid-page-advert-section">
      {banners.map((banner) => (
        <div
          key={banner.id}
          className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${banner.bgColor} shadow-lg`}
        >
          <img
            src={banner.imageUrl}
            alt={banner.title}
            className="absolute inset-0 w-full h-full object-cover opacity-25 mix-blend-overlay"
            referrerPolicy="no-referrer"
          />
          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-6 sm:py-8">
            <div className="text-center sm:text-left">
              <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-white/70 mb-1.5">
                <Megaphone size={11} /> Sponsored
              </span>
              <h3 className="text-white font-black text-lg sm:text-2xl tracking-tight leading-tight">
                {banner.title}
              </h3>
              <p className="text-white/85 text-xs sm:text-sm font-medium mt-1 max-w-xl">
                {banner.subtitle}
              </p>
            </div>
            <button
              onClick={() => {
                if (banner.linkCategory && onSelectCategory) {
                  onSelectCategory(banner.linkCategory);
                }
                const section = document.getElementById('shop-catalog-section');
                if (section) section.scrollIntoView({ behavior: 'smooth' });
              }}
              className={`flex-shrink-0 flex items-center gap-1.5 font-black text-xs sm:text-sm uppercase tracking-wide px-5 py-2.5 rounded-xl shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer ${banner.accentColor}`}
            >
              {banner.ctaText} <ArrowRight size={14} />
            </button>
          </div>
        </div>
      ))}
    </section>
  );
}
