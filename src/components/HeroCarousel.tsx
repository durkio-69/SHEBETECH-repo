import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Timer, 
  ArrowRight, 
  Zap, 
  ShoppingCart,
  Smartphone,
  Tv,
  Shirt,
  Home as HomeIcon,
  Sparkles,
  ShoppingBag,
  Store,
  Tag,
  Gift,
  Flame,
  Award,
  ChevronRightSquare
} from 'lucide-react';
import { PROMO_BANNERS, PRODUCTS, CATEGORIES } from '../data';
import { Product } from '../types';

interface HeroCarouselProps {
  onAddToCart: (p: Product) => void;
  selectedCategory?: string;
  onSelectCategory?: (catId: string) => void;
}

export default function HeroCarousel({ 
  onAddToCart, 
  selectedCategory = 'all', 
  onSelectCategory 
}: HeroCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [timeLeft, setTimeLeft] = useState({ hours: 14, minutes: 45, seconds: 30 });

  // Carousel Auto-Play
  useEffect(() => {
    const slideInterval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % PROMO_BANNERS.length);
    }, 5000);
    return () => clearInterval(slideInterval);
  }, []);

  // Countdown Timer
  useEffect(() => {
    const countdownInterval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else {
          return { hours: 23, minutes: 59, seconds: 59 };
        }
      });
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, []);

  const handleNext = () => {
    setCurrentSlide((prev) => (prev + 1) % PROMO_BANNERS.length);
  };

  const handlePrev = () => {
    setCurrentSlide((prev) => (prev - 1 + PROMO_BANNERS.length) % PROMO_BANNERS.length);
  };

  // Find a special product for "Deal of the Day"
  const dealProduct = PRODUCTS.find(p => p.id === 'p1') || PRODUCTS[0];

  // Helper to map category id to standard Lucide icons
  const getCategoryIcon = (id: string) => {
    switch (id) {
      case 'phones':
        return <Smartphone size={15} />;
      case 'electronics':
        return <Tv size={15} />;
      case 'fashion':
        return <Shirt size={15} />;
      case 'home':
        return <HomeIcon size={15} />;
      case 'beauty':
        return <Sparkles size={15} />;
      case 'supermarket':
        return <ShoppingBag size={15} />;
      default:
        return <ShoppingBag size={15} />;
    }
  };

  const handleCategoryClick = (id: string) => {
    if (onSelectCategory) {
      onSelectCategory(id);
      // Scroll to the catalog
      const catalog = document.getElementById('shop-catalog-section');
      if (catalog) {
        catalog.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <section className="py-4 px-4 max-w-7xl mx-auto" id="hero-section">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        
        {/* LEFT SIDEBAR: Category Directory Menu (Jumia Classic Sidebar with Flyout Mega-menu) */}
        <div className="hidden lg:flex flex-col bg-white dark:bg-slate-900 rounded-xl shadow-xs border border-slate-100 dark:border-slate-800 p-2 justify-between relative group/sidebar">
          <div className="space-y-0.5">
            <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 rounded-lg mb-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Store size={11} className="text-[#f68b1e]" />
                <span>Olimart Categories</span>
              </span>
            </div>
            
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat.id;
              
              // Custom Submenu Brand Data for High-Fidelity Jumia Flyout Menu
              const flyoutData: Record<string, { title: string; brands: string[]; subcats: string[] }> = {
                phones: {
                  title: "Phones & Tablets Hotspot",
                  brands: ["Tecno Mobile", "Infinix Premium", "Samsung Galaxy", "Apple iPhone", "Xiaomi Redmi"],
                  subcats: ["Dual SIM Smartphones", "Android Smart Tablets", "Bluetooth Chargers", "Original Glass Protectors"]
                },
                electronics: {
                  title: "Sound & Smart Home Screen",
                  brands: ["Hisense Frameless", "Sayona Sound", "Sony Systems", "LG Home", "Samsung Screens"],
                  subcats: ["Built-in Receiver TVs", "Heavy Bass Subwoofers", "Frameless Smart Displays", "Home Soundbars"]
                },
                fashion: {
                  title: "Men & Women Wardrobes",
                  brands: ["Kiyembe Tailors", "Adidas Sports", "Nike Footwear", "Zara Styles"],
                  subcats: ["Slim-Fit Men's Shirts", "Sneakers & Canvas", "Leather Luxury Wallets", "Trending Sports Wear"]
                },
                home: {
                  title: "Modern Home & Office Essentials",
                  brands: ["Mukwano Plastics", "Sayona Kitchen", "Hisense Fridge", "Kampala Desks"],
                  subcats: ["Office Swivel Chairs", "Kitchen Glass Blenders", "Electric Warm Kettles", "Pantry Storage Boxes"]
                },
                beauty: {
                  title: "Health & Organic Cosmetics",
                  brands: ["Nivea Care", "Garnier Fresh", "Kampala Cosmetics", "Shea Butter Uganda"],
                  subcats: ["Organic Body Lotions", "Acne Spot Cleansers", "Fresh Fragrance Oils", "Daily Hair Creams"]
                },
                supermarket: {
                  title: "Kampala Daily Staples Pantry",
                  brands: ["Mukwano Oil", "Jesa Farm Dairy", "Maggi Spices", "Kakira Sugar"],
                  subcats: ["Refined Cooking Oils", "Fresh Pasteurised Milk", "Washing Bar Soaps", "Daily Breakfast Hampers"]
                }
              };

              const menuInfo = flyoutData[cat.id] || { title: cat.name, brands: ["Official Outlet", "Standard Brands"], subcats: ["Trending Items"] };

              return (
                <div key={cat.id} className="relative group/menuitem">
                  <button
                    onClick={() => handleCategoryClick(cat.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all group cursor-pointer ${
                      isActive 
                        ? 'bg-[#f68b1e]/10 text-[#f68b1e]' 
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-[#f68b1e]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`transition-transform group-hover/menuitem:scale-110 ${isActive ? 'text-[#f68b1e]' : 'text-slate-400 group-hover/menuitem:text-[#f68b1e]'}`}>
                        {getCategoryIcon(cat.id)}
                      </span>
                      <span>{cat.name}</span>
                    </div>
                    <ChevronRight size={12} className="opacity-40 group-hover/menuitem:opacity-100 transition-all text-slate-400 group-hover/menuitem:text-[#f68b1e] group-hover/menuitem:translate-x-0.5" />
                  </button>

                  {/* FLYOUT HOVER SUBMENU mega-panel (Exactly like Jumia) */}
                  <div className="absolute left-[100%] top-0 ml-2.5 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-4 hidden group-hover/menuitem:block z-50 animate-in fade-in slide-in-from-left-2 duration-150">
                    <p className="text-[10px] font-black text-[#f68b1e] uppercase tracking-wider mb-2 pb-1 border-b border-slate-100 dark:border-slate-800">
                      {menuInfo.title}
                    </p>
                    
                    <div className="space-y-3">
                      {/* Sub-item categories */}
                      <div className="space-y-1">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Trending Subcategories</p>
                        <div className="space-y-0.5">
                          {menuInfo.subcats.map((sc, sidx) => (
                            <button
                              key={sidx}
                              onClick={() => handleCategoryClick(cat.id)}
                              className="w-full text-left text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:text-[#f68b1e] py-0.5"
                            >
                              &bull; {sc}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Famous Brands */}
                      <div className="space-y-1">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Official Store Brands</p>
                        <div className="flex flex-wrap gap-1 pt-1">
                          {menuInfo.brands.map((br, bidx) => (
                            <span 
                              key={bidx}
                              className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded font-bold"
                            >
                              {br}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleCategoryClick(cat.id)}
                      className="mt-3.5 w-full bg-[#f68b1e]/10 hover:bg-[#f68b1e] hover:text-white text-[#f68b1e] py-1 text-[10px] font-black uppercase tracking-wider rounded-md text-center transition-all"
                    >
                      Shop Department &rarr;
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Extra Jumia Uganda Inspired Links */}
            <div className="h-px bg-slate-100 dark:bg-slate-800 my-2" />
            
            <button
              onClick={() => handleCategoryClick('all')}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-[#f68b1e] cursor-pointer"
            >
              <Award size={15} className="text-[#f68b1e]" />
              <span>Official Stores</span>
            </button>
            <button
              onClick={() => handleCategoryClick('all')}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-[#f68b1e] cursor-pointer"
            >
              <Flame size={15} className="text-red-500 animate-pulse" />
              <span>Super saving Deals</span>
            </button>
          </div>

          <div className="bg-[#f68b1e]/5 rounded-lg p-3 text-center border border-[#f68b1e]/10">
            <p className="text-[10px] font-black text-[#f68b1e] uppercase tracking-wider">Fast Shipping</p>
            <p className="text-[9px] text-slate-500 font-medium">To Kampala & beyond</p>
          </div>
        </div>

        {/* CENTER COLUMN: Main Slider (2/4 width on large screen, full width on smaller screen) */}
        <div className="lg:col-span-2 relative rounded-xl overflow-hidden bg-slate-900 shadow-xs h-[300px] sm:h-[350px] lg:h-full min-h-[300px] lg:min-h-[380px] group">
          {PROMO_BANNERS.map((banner, index) => (
            <div
              key={banner.id}
              className={`absolute inset-0 w-full h-full bg-gradient-to-r ${banner.bgColor} transition-opacity duration-700 flex flex-col md:flex-row items-center justify-between p-6 sm:p-10 ${
                index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
              }`}
            >
              <div className="text-white max-w-sm z-20 space-y-3.5">
                <span className={`inline-block text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full ${banner.accentColor}`}>
                  Kampala Shopping Fest
                </span>
                <h1 className="text-xl sm:text-3xl font-black tracking-tight leading-none text-white">
                  {banner.title}
                </h1>
                <p className="text-xs sm:text-sm text-slate-100 opacity-90 font-medium">
                  {banner.subtitle}
                </p>
                <div className="pt-1.5">
                  <button className="bg-white text-slate-950 hover:bg-[#f68b1e] hover:text-white px-5 py-2.5 rounded-lg font-black text-xs transition-all duration-200 shadow-sm hover:shadow-md hover:scale-102 active:scale-95 cursor-pointer uppercase tracking-wider">
                    {banner.ctaText}
                  </button>
                </div>
              </div>

              {/* Banner Asset Image */}
              <div className="relative w-full md:w-1/2 h-36 md:h-full flex items-center justify-center mt-3 md:mt-0">
                <img
                  src={banner.imageUrl}
                  alt={banner.title}
                  className="rounded-lg object-cover w-full h-full max-h-[140px] md:max-h-[250px] shadow-sm border border-white/10"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          ))}

          {/* Navigation Arrows */}
          <button
            onClick={handlePrev}
            className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/25 hover:bg-black/50 text-white p-1.5 rounded-full z-20 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/25 hover:bg-black/50 text-white p-1.5 rounded-full z-20 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          >
            <ChevronRight size={18} />
          </button>

          {/* Dot indicators */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
            {PROMO_BANNERS.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
                  index === currentSlide ? 'bg-[#f68b1e] w-4' : 'bg-white/40 hover:bg-white'
                }`}
              />
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN: Deal of the Day (1/4 width, hidden on mobile in some layouts, but beautifully styled here) */}
        <div className="bg-[#f68b1e] rounded-xl p-5 shadow-xs flex flex-col justify-between text-slate-900 border border-amber-500 relative overflow-hidden" id="deal-of-the-day-card">
          {/* Decorative Flash */}
          <div className="absolute -right-8 -top-8 text-amber-600/10 rotate-12">
            <Zap size={140} />
          </div>

          <div className="relative z-10">
            <div className="flex justify-between items-center mb-3">
              <span className="bg-red-600 text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full flex items-center gap-1 animate-pulse">
                <Zap size={9} fill="white" /> Deal of the Day
              </span>
              <div className="flex items-center gap-1 text-[10px] font-black text-slate-950">
                <Timer size={12} />
                <span>Ends In:</span>
              </div>
            </div>

            {/* Countdown Clock (Polished Compact) */}
            <div className="grid grid-cols-3 gap-1.5 text-center mb-4">
              <div className="bg-slate-950 text-white rounded-lg py-1.5 px-1 shadow-xs">
                <span className="block text-sm font-black">{String(timeLeft.hours).padStart(2, '0')}</span>
                <span className="text-[8px] uppercase tracking-wider text-slate-400 font-bold">Hrs</span>
              </div>
              <div className="bg-slate-950 text-white rounded-lg py-1.5 px-1 shadow-xs">
                <span className="block text-sm font-black">{String(timeLeft.minutes).padStart(2, '0')}</span>
                <span className="text-[8px] uppercase tracking-wider text-slate-400 font-bold">Mins</span>
              </div>
              <div className="bg-slate-950 text-white rounded-lg py-1.5 px-1 shadow-xs">
                <span className="block text-sm font-black text-[#f68b1e]">{String(timeLeft.seconds).padStart(2, '0')}</span>
                <span className="text-[8px] uppercase tracking-wider text-slate-400 font-bold">Secs</span>
              </div>
            </div>

            {/* Product Feature */}
            <div className="bg-white rounded-xl p-3.5 shadow-sm border border-amber-300 flex items-center gap-3 hover:shadow-md transition-shadow">
              <div className="w-1/3 relative flex-shrink-0">
                <img
                  src={dealProduct.image}
                  alt={dealProduct.title}
                  className="w-full h-16 object-contain rounded"
                  referrerPolicy="no-referrer"
                />
                <span className="absolute -top-2 -left-2 bg-red-600 text-white text-[8px] font-black px-1 py-0.5 rounded">
                  {dealProduct.discountBadge}
                </span>
              </div>
              <div className="flex-1 min-w-0 space-y-0.5">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wide">
                  {dealProduct.brand}
                </span>
                <h3 className="font-extrabold text-[11px] text-slate-950 line-clamp-2 leading-tight">
                  {dealProduct.title}
                </h3>
                
                {/* Price Display */}
                <div className="flex items-baseline gap-1 pt-0.5">
                  <span className="text-xs font-black text-red-600">
                    Shs {dealProduct.price.toLocaleString()}
                  </span>
                  {dealProduct.originalPrice && (
                    <span className="text-[9px] line-through text-slate-400">
                      Shs {dealProduct.originalPrice.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 relative z-10">
            <button
              onClick={() => onAddToCart(dealProduct)}
              className="w-full bg-slate-950 text-white hover:bg-slate-900 py-2.5 rounded-lg font-black text-xs flex items-center justify-center gap-1.5 transition-all duration-200 active:scale-95 shadow-sm cursor-pointer uppercase tracking-wider"
            >
              <ShoppingCart size={13} />
              <span>Claim Offer</span>
              <ArrowRight size={13} />
            </button>
            <p className="text-[9px] text-center text-slate-900/80 font-black mt-1.5 uppercase tracking-wide">
              ⚡ Cash on delivery in Uganda
            </p>
          </div>
        </div>

      </div>

      {/* JUMIA UGANDA-STYLE QUICK SERVICES BAR */}
      <div className="mt-6 bg-white dark:bg-slate-900 rounded-xl shadow-xs border border-slate-100 dark:border-slate-800 p-4">
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 text-center">
          {[
            { id: 'all', label: 'Official Stores', icon: <Award className="w-5 h-5 text-[#f68b1e]" />, badge: '100% Brand' },
            { id: 'phones', label: 'Phones & Tablets', icon: <Smartphone className="w-5 h-5 text-[#f68b1e]" />, badge: 'Best Price' },
            { id: 'electronics', label: 'TV & Audio', icon: <Tv className="w-5 h-5 text-[#f68b1e]" />, badge: 'Warranty' },
            { id: 'supermarket', label: 'Supermarket', icon: <ShoppingBag className="w-5 h-5 text-[#f68b1e]" />, badge: 'Daily Stock' },
            { id: 'all', label: 'MoMo Deals', icon: <Zap className="w-5 h-5 text-red-500 fill-red-500 animate-bounce" />, badge: 'Extra 10% Off' },
            { id: 'all', label: 'Free Delivery', icon: <Gift className="w-5 h-5 text-emerald-500" />, badge: 'Kampala Only' }
          ].map((item, idx) => (
            <button
              key={idx}
              onClick={() => handleCategoryClick(item.id)}
              className="flex flex-col items-center group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center border border-slate-100 dark:border-slate-700 group-hover:bg-[#f68b1e]/10 group-hover:border-[#f68b1e]/30 transition-all duration-200 shadow-xs relative">
                {item.icon}
                {item.badge && (
                  <span className="absolute -top-1.5 -right-1 bg-slate-900 text-white text-[7px] font-black px-1 py-0.5 rounded-xs scale-90 sm:scale-100">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] font-black text-slate-800 dark:text-slate-200 group-hover:text-[#f68b1e] mt-2 transition-colors">
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
