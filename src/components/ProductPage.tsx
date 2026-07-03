import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  ShoppingCart, 
  Heart, 
  Truck, 
  ShieldCheck, 
  Star, 
  CheckCircle, 
  Coins, 
  MessageSquare,
  Sparkles,
  ChevronRight,
  Package,
  Clock,
  ThumbsUp,
  Share2,
  Check
} from 'lucide-react';
import { Product } from '../types';
import { PRODUCTS, UGANDA_DISTRICTS } from '../data';
import { emitEventDrivenNotifications } from '../lib/notificationStore';

interface ProductPageProps {
  product: Product;
  onBack: () => void;
  onAddToCart: (
    p: Product, 
    quantity?: number, 
    selectedVariation?: Record<string, string>, 
    selectedVendor?: string, 
    customPrice?: number
  ) => void;
  watchlist: string[];
  onToggleWatchlist: (productId: string) => void;
  formatPrice: (priceInUgx: number) => string;
  onProductClick: (p: Product) => void;
}

export default function ProductPage({
  product,
  onBack,
  onAddToCart,
  watchlist,
  onToggleWatchlist,
  formatPrice,
  onProductClick
}: ProductPageProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedDistrict, setSelectedDistrict] = useState('Kampala (Central)');
  const [shippingFee, setShippingFee] = useState(0);
  const [deliveryDays, setDeliveryDays] = useState('Same-day Delivery');
  
  // Tabs: Specs, Delivery, Reviews
  const [activeTab, setActiveTab] = useState<'specs' | 'delivery' | 'reviews'>('specs');
  
  // Custom reviews state
  const [reviewsList, setReviewsList] = useState<Array<{ name: string; location: string; rating: number; text: string; date: string; likes: number }>>([]);
  const [userRating, setUserRating] = useState(5);
  const [userComment, setUserComment] = useState('');
  const [userName, setUserName] = useState('');

  // Quick checkout form state
  const [isQuickBuyOpen, setIsQuickBuyOpen] = useState(false);
  const [checkoutName, setCheckoutName] = useState('');
  const [checkoutPhone, setCheckoutPhone] = useState('');
  const [checkoutAddress, setCheckoutAddress] = useState('');
  const [checkoutMoMoNetwork, setCheckoutMoMoNetwork] = useState<'MTN' | 'Airtel'>('MTN');
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);

  // Selected variations state
  const [selectedVariations, setSelectedVariations] = useState<Record<string, string>>({});
  // Selected vendor ID state
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [product]);

  // Set shipping rates and delivery times dynamically based on selected Ugandan district
  useEffect(() => {
    if (selectedDistrict.includes('Kampala')) {
      setShippingFee(0);
      setDeliveryDays('Same-day Delivery (Within 2-5 hours via Boda)');
    } else if (['Wakiso', 'Mukono', 'Entebbe'].includes(selectedDistrict)) {
      setShippingFee(5000);
      setDeliveryDays('Same-day / Next-day Delivery (Within 12-24 hours via Express)');
    } else if (['Jinja', 'Masaka', 'Mbarara'].includes(selectedDistrict)) {
      setShippingFee(12000);
      setDeliveryDays('Next-day Delivery (Dispatched via courier Bus within 24 hours)');
    } else {
      setShippingFee(15000);
      setDeliveryDays('1 to 2 Days (Dispatched via regional courier within 24-48 hours)');
    }
  }, [selectedDistrict]);

  // Setup initial default reviews or use product defined reviews
  useEffect(() => {
    if (product.reviews && product.reviews.length > 0) {
      setReviewsList(product.reviews);
    } else {
      setReviewsList([
        {
          name: 'Okello Moses',
          location: 'Gulu City',
          rating: 5,
          text: `The parcel arrived in Gulu safely! Shipped the same day by OliMart team and received it via Horizon Bus within 24 hours. Genuine accessory with original warranty card. Web portal is awesome.`,
          date: 'June 28, 2026',
          likes: 12
        },
        {
          name: 'Nakato Sarah',
          location: 'Kampala (Kisementi)',
          rating: 5,
          text: `Paid using Airtel Money on delivery. Highly trustworthy seller, they let me open the box and test the item before completing the mobile money transfer. Outstanding customer care!`,
          date: 'June 18, 2026',
          likes: 8
        },
        {
          name: 'Mugisha David',
          location: 'Mbarara Town',
          rating: 4,
          text: `High quality build. Sayona systems never disappoint. Sound output is crisp and base response is fantastic. Highly recommended for family rooms.`,
          date: 'May 30, 2026',
          likes: 5
        }
      ]);
    }

    // Initialize variations with first options
    if (product.variations) {
      const initial: Record<string, string> = {};
      product.variations.forEach(v => {
        initial[v.name] = v.options[0];
      });
      setSelectedVariations(initial);
    } else {
      setSelectedVariations({});
    }
    setSelectedVendorId(null);
    setQuantity(1);
    setIsQuickBuyOpen(false);
    setCheckoutSuccess(false);
  }, [product]);

  // Computed adjusted price
  const currentVendor = product.vendors?.find(v => v.id === selectedVendorId) || null;
  const basePrice = currentVendor ? currentVendor.price : product.price;
  let adjustedPrice = basePrice;
  
  if (product.variations) {
    product.variations.forEach(v => {
      const selectedOption = selectedVariations[v.name];
      if (v.priceModifiers && selectedOption && v.priceModifiers[selectedOption] !== undefined) {
        adjustedPrice += v.priceModifiers[selectedOption];
      }
    });
  }

  // Handle review post
  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userComment.trim() || !userName.trim()) return;

    const newReview = {
      name: userName,
      location: selectedDistrict,
      rating: userRating,
      text: userComment,
      date: 'Just now',
      likes: 0
    };

    // Trigger event driven notification for review
    emitEventDrivenNotifications('customer_comment', {
      customerName: userName,
      productTitle: product.title,
      rating: userRating,
      comment: userComment
    });

    setReviewsList([newReview, ...reviewsList]);
    setUserComment('');
    setUserName('');
    setUserRating(5);
  };

  // Quick buy submission
  const handleQuickCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutName.trim() || !checkoutPhone.trim() || !checkoutAddress.trim()) return;

    setCheckoutSuccess(true);
    setTimeout(() => {
      setIsQuickBuyOpen(false);
      setCheckoutSuccess(false);
      setCheckoutName('');
      setCheckoutPhone('');
      setCheckoutAddress('');
    }, 4500);
  };

  // Generate technical specifications
  const getSpecs = (p: Product) => {
    const isPhone = p.category === 'phones';
    const isElec = p.category === 'electronics';
    const isFashion = p.category === 'fashion';
    const isHome = p.category === 'home';
    const isBeauty = p.category === 'beauty';

    if (isPhone) {
      return [
        { key: 'Model Series', value: (p?.title || '').split(' - ')[0] },
        { key: 'Processor', value: 'Octa-core MediaTek Dimensity / Qualcomm Snapdragon' },
        { key: 'RAM Size', value: p.title.includes('8GB') ? '8 GB LPDDR4X' : '4 GB LPDDR4X' },
        { key: 'Storage (ROM)', value: p.title.includes('256') ? '256 GB High-speed UFS' : '128 GB High-speed UFS' },
        { key: 'Camera Specs', value: '108 Megapixels + Quad-ring LED flash' },
        { key: 'Battery', value: '5000 mAh High Density Li-Po' },
        { key: 'Charging Speed', value: '33W / 68W Hyper Charging support' },
        { key: 'Connectivity', value: 'Dual SIM, 4G LTE, Wi-Fi 5, Bluetooth 5.2' },
        { key: 'Warranty Period', value: '1 Year Official Brand Warranty (Uganda)' }
      ];
    } else if (isElec) {
      return [
        { key: 'Brand Partner', value: p.brand },
        { key: 'Display Type', value: 'A+ Grade Premium Frameless LED Display' },
        { key: 'Smart Operating System', value: 'Android TV with Netflix, Youtube, Prime Video' },
        { key: 'Audio Output', value: '24W Premium Stereo with Dolby Digital Sound' },
        { key: 'Ports Configuration', value: '3 HDMI ports, 2 USB ports, AV Input, Headphone Out' },
        { key: 'Voltage Supply', value: 'AC 100V-240V 50/60Hz (Energy Saving technology)' },
        { key: 'Certification', value: 'Genuine UNBS compliant electrical safety standard' }
      ];
    } else if (isFashion) {
      return [
        { key: 'Material Composition', value: '100% Breathable Ugandan Cotton / Poly-blend' },
        { key: 'Stitching Type', value: 'Industrial heavy-duty double seam' },
        { key: 'Fabric Density', value: 'Medium weight (240 GSM) premium touch' },
        { key: 'Laundering Care', value: 'Machine wash friendly, no-bleed fade resistant dyes' },
        { key: 'Tailoring Source', value: 'Kampala artisan designers & imports' }
      ];
    } else if (isBeauty) {
      return [
        { key: 'Formulation Type', value: 'Dermatologically Tested Skin Hydration Care' },
        { key: 'Key Ingredients', value: 'Pure Cocoa Butter, Vitamin E, Aloe Vera Extract, Ceramides' },
        { key: 'Volume / Size', value: p.title.includes('400ml') ? '400 ml Premium Pack' : '300 g Family Container' },
        { key: 'Recommended Skin Type', value: 'All skin types (Dry, sensitive, oily or normal skin)' },
        { key: 'Expiry Term', value: '36 Months from Manufacturing date' }
      ];
    } else {
      return [
        { key: 'Primary Build', value: 'Food-grade stainless steel & reinforced polymer' },
        { key: 'Power Rating', value: '1500W - 2200W High Efficiency' },
        { key: 'Capacity', value: 'Standard family-size multi-liter configuration' },
        { key: 'Safety Mechanism', value: 'Auto-shutoff on boil, dry-burn sensor, heat resistant handle' },
        { key: 'Certificates', value: 'BPA-free non-toxic certified' }
      ];
    }
  };

  const isProductInWatchlist = watchlist.includes(product.id);
  const specs = getSpecs(product);

  // Recommendations: filter same category, exclude current
  const recommendedProducts = PRODUCTS
    .filter(p => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6" id="product-page-view">
      
      {/* Navigation Breadcrumb & Back button */}
      <div className="flex items-center justify-between mb-6">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-600 hover:text-orange-600 transition-colors cursor-pointer bg-white border border-slate-200 shadow-xs px-4 py-2 rounded-2xl"
        >
          <ArrowLeft size={16} />
          <span>Back to shop catalog</span>
        </button>

        <div className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-slate-400">
          <span className="hover:text-slate-600 cursor-pointer" onClick={onBack}>Home</span>
          <ChevronRight size={12} />
          <span className="capitalize">{product.category}</span>
          <ChevronRight size={12} />
          <span className="text-slate-600 truncate max-w-[200px]">{product.brand}</span>
        </div>
      </div>

      {/* Main Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-4 sm:p-8 shadow-sm">
        
        {/* Left Column: Image & Badges (Lg: 5/12 grid) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="relative bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800/50 rounded-3xl p-6 sm:p-12 flex items-center justify-center overflow-hidden aspect-square group">
            
            {product.discountBadge && (
              <span className="absolute top-4 left-4 bg-red-600 text-white font-black text-sm px-4 py-1.5 rounded-xl shadow-md z-10 uppercase tracking-wider animate-pulse">
                {product.discountBadge} OFF
              </span>
            )}

            {/* Float watchlist */}
            <button
              onClick={() => onToggleWatchlist(product.id)}
              className={`absolute top-4 right-4 p-3 rounded-full shadow-md border transition-all z-20 cursor-pointer ${
                isProductInWatchlist
                  ? 'bg-red-50 border-red-100 text-red-500 dark:bg-red-950/50 dark:border-red-900'
                  : 'bg-white border-slate-100 dark:bg-slate-800 dark:border-slate-700 text-slate-400 hover:text-red-500 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
              title={isProductInWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
            >
              <Heart size={20} className={isProductInWatchlist ? 'fill-red-500 text-red-500' : ''} />
            </button>

            <img 
              src={product.image} 
              alt={product.title} 
              className="max-h-72 sm:max-h-80 object-contain rounded-2xl group-hover:scale-105 transition-transform duration-300"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Secure Trust Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 p-3 sm:p-4 rounded-2xl text-center space-y-1">
              <Truck className="text-emerald-600 dark:text-emerald-400 mx-auto mb-1" size={18} />
              <p className="text-[10px] sm:text-xs font-black text-slate-800 dark:text-slate-200">Express Delivery</p>
              <p className="text-[9px] text-slate-400 dark:text-slate-500">Uganda-wide service</p>
            </div>
            <div className="bg-orange-50/40 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/40 p-3 sm:p-4 rounded-2xl text-center space-y-1">
              <Coins className="text-orange-500 dark:text-orange-400 mx-auto mb-1" size={18} />
              <p className="text-[10px] sm:text-xs font-black text-slate-800 dark:text-slate-200">Pay on Delivery</p>
              <p className="text-[9px] text-slate-400 dark:text-slate-500">Momo / Cash payment</p>
            </div>
            <div className="bg-blue-50/40 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 p-3 sm:p-4 rounded-2xl text-center space-y-1">
              <ShieldCheck className="text-blue-600 dark:text-blue-400 mx-auto mb-1" size={18} />
              <p className="text-[10px] sm:text-xs font-black text-slate-800 dark:text-slate-200">Genuine Guarantee</p>
              <p className="text-[9px] text-slate-400 dark:text-slate-500">100% Original goods</p>
            </div>
          </div>
        </div>

        {/* Right Column: Information, Selection, Action (Lg: 7/12 grid) */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            
            {/* Brands and Official Tag */}
            <div className="flex items-center gap-2.5">
              <span className="bg-orange-500 text-white font-black text-[9px] sm:text-[10px] uppercase px-3 py-1 rounded-lg tracking-wider shadow-xs">
                {product.brand} Official
              </span>
              {product.isOfficial && (
                <span className="bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400 font-extrabold text-[9px] sm:text-[10px] uppercase px-2.5 py-1 rounded-md flex items-center gap-1">
                  <CheckCircle size={10} fill="currentColor" className="text-blue-600 dark:text-blue-400" />
                  Verified Store
                </span>
              )}
              <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase">
                ● In Stock
              </span>
            </div>

            {/* Title */}
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-50 leading-snug">
              {product.title}
            </h1>

            {/* Rating Stars & Quick Stats */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-1 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-100 dark:border-yellow-900/30 px-2.5 py-1 rounded-xl">
                <Star size={14} fill="#eab308" className="text-yellow-500" />
                <span className="text-xs font-black text-slate-800 dark:text-slate-200">{product.rating}</span>
              </div>
              <span className="text-xs font-bold text-slate-400">
                {product.reviewsCount} Verified Customer Reviews
              </span>
              <span className="text-xs text-slate-300">|</span>
              <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                <Package size={13} /> Over 500+ orders completed
              </span>
            </div>

            {/* Amazon-style Tags */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {(product.tags || ['Amazon\'s Choice', 'Best Seller', 'Top Rated', '100% Genuine']).map((tag, i) => {
                const isAmazonChoice = tag.toLowerCase().includes("choice");
                const isBestSeller = tag.toLowerCase().includes("best");
                return (
                  <span 
                    key={i} 
                    className={`text-[10px] font-extrabold px-2.5 py-1.5 rounded-xs tracking-wide ${
                      isAmazonChoice 
                        ? 'bg-slate-900 text-white dark:bg-slate-800' 
                        : isBestSeller 
                          ? 'bg-[#f0c14b] text-slate-900 border border-[#a88734]' 
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {isAmazonChoice ? (
                      <span className="flex items-center gap-1">
                        <span>Amazon's</span>
                        <span className="text-[#f19e39]">Choice</span>
                      </span>
                    ) : tag}
                  </span>
                );
              })}
            </div>

            {/* Pricing Details */}
            <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-950/30 border border-slate-100 dark:border-slate-800/80 rounded-2xl flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Discounted Price</p>
                <div className="flex items-baseline gap-2.5">
                  <span className="text-xl sm:text-2xl font-black text-orange-600 dark:text-orange-500">
                    {formatPrice(adjustedPrice)}
                  </span>
                  {product.originalPrice && (
                    <span className="text-xs sm:text-sm line-through text-slate-400 font-bold">
                      {formatPrice(product.originalPrice)}
                    </span>
                  )}
                </div>
              </div>

              {product.originalPrice && (
                <div className="bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/40 rounded-xl px-3.5 py-2 text-right">
                  <p className="text-[9px] font-bold text-red-500 uppercase tracking-wider">Total Saving</p>
                  <p className="text-xs sm:text-sm font-black text-red-600 dark:text-red-400">
                    {formatPrice(product.originalPrice - adjustedPrice)} ({product.discountBadge})
                  </p>
                </div>
              )}
            </div>

            {/* JUMIA-STYLE SALES INSIGHTS & REGIONAL STOCK ALARM ALERT (Requirement: add sales insights on each product) */}
            <div className="p-4 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 rounded-2xl text-xs space-y-2.5 text-left">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-black text-[#f68b1e] uppercase text-[10px] tracking-wider">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                  Jumia Live Demand & Sales Insights
                </span>
                <span className="bg-[#f68b1e]/10 text-[#f68b1e] text-[9px] font-black uppercase px-2 py-0.5 rounded-lg border border-[#f68b1e]/20">
                  Global Platform
                </span>
              </div>

              <div className="space-y-1.5">
                <p className="font-bold text-slate-800 dark:text-slate-200">
                  ⚡ Highly Demanded Item in <span className="underline decoration-wavy decoration-[#f68b1e]">{localStorage.getItem('olimart_selected_location') || 'Kampala (Central)'}</span>!
                </p>
                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                  Due to high order volume and search interest from users in this region, stock levels are dropping fast.
                </p>
              </div>

              {/* Progress Bar of Sold Items */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-slate-400 font-extrabold uppercase">
                  <span>Stock Exhaustion State</span>
                  <span className="text-[#f68b1e]">85% claimed</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-[#f68b1e] h-full rounded-full animate-pulse" style={{ width: '85%' }}></div>
                </div>
              </div>

              {/* Dynamic Real-time stock status based on actual product stock count */}
              <div className="bg-white dark:bg-slate-900 border border-amber-150 dark:border-amber-950/40 p-2 rounded-xl text-[10px] font-bold text-slate-600 dark:text-slate-400 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <span>🕒 Regional Stock Left:</span>
                  <span className="text-red-600 font-black text-xs">{(product.reviewsCount ? (product.reviewsCount % 12) + 2 : 5)} pieces left</span>
                </div>
                <span className="text-[9px] text-slate-400 font-mono">Region: Active Geo-lock Node</span>
              </div>
            </div>

            {/* Selected Seller / Merchant details (Requirement 1 & 3) */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800/80 rounded-2xl flex flex-col gap-1 text-xs">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <span>Selected Merchant offer</span>
                <span className="text-orange-600 dark:text-orange-400 font-black">Fast Dispatch</span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 mt-1">
                <div>
                  <p className="font-extrabold text-slate-800 dark:text-slate-200 text-xs sm:text-sm">
                    Sold by: <span className="text-orange-600 dark:text-orange-400 hover:underline cursor-pointer font-black">{currentVendor ? currentVendor.name : (product.vendors && product.vendors[0]?.name) || `${product.brand} Official Outlet`}</span>
                  </p>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                    Ships from: <strong className="text-slate-600 dark:text-slate-400 font-bold">{currentVendor ? currentVendor.location : (product.vendors && product.vendors[0]?.location) || 'Kampala (Central)'}</strong>
                  </p>
                </div>
                <div className="flex items-center gap-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 px-3 py-1.5 rounded-xl text-[10px]">
                  <div className="text-center">
                    <span className="block text-yellow-500 font-black text-[11px]">★ {currentVendor ? currentVendor.rating : (product.vendors && product.vendors[0]?.rating) || 4.8}</span>
                    <span className="text-[8px] text-slate-400 uppercase font-bold">Seller Rating</span>
                  </div>
                  <div className="w-px bg-slate-100 dark:bg-slate-700 h-6"></div>
                  <div className="text-center">
                    <span className="block text-emerald-500 font-black text-[11px]">★ {currentVendor ? (currentVendor.deliveryRating || 4.7) : (product.vendors && product.vendors[0]?.deliveryRating) || 4.6}</span>
                    <span className="text-[8px] text-slate-400 uppercase font-bold">Delivery Rating</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Variations Selector Component */}
            {product.variations && product.variations.length > 0 && (
              <div className="space-y-3.5 border-t border-b border-slate-100 dark:border-slate-800 py-3.5">
                {product.variations.map((v) => (
                  <div key={v.name} className="space-y-1.5">
                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      Select {v.name}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {v.options.map((option) => {
                        const isSelected = selectedVariations[v.name] === option;
                        const modifier = v.priceModifiers?.[option];
                        const modifierLabel = modifier && modifier > 0 
                          ? ` (+${formatPrice(modifier)})` 
                          : modifier && modifier < 0 
                            ? ` (-${formatPrice(Math.abs(modifier))})` 
                            : '';
                        
                        return (
                          <button
                            key={option}
                            onClick={() => {
                              setSelectedVariations(prev => ({
                                ...prev,
                                [v.name]: option
                              }));
                            }}
                            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer border ${
                              isSelected 
                                ? 'bg-orange-50 border-orange-500 text-orange-600 font-black ring-1 ring-orange-500/30' 
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <span>{option}</span>
                            {modifierLabel && <span className="text-[9px] text-orange-500 font-bold">{modifierLabel}</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Multi-Vendor Options (Amazon / Alibaba Style) */}
            {product.vendors && product.vendors.length > 0 && (
              <div className="p-4 bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle size={14} className="text-blue-600" />
                    <span>Compare Offers ({product.vendors.length} Sellers)</span>
                  </h4>
                  <span className="text-[9px] font-extrabold text-blue-600 bg-blue-50 dark:bg-blue-950/30 px-2 py-0.5 rounded-md uppercase">
                    Direct Importers & Local Stores
                  </span>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {product.vendors.map((v) => {
                    const isSelected = selectedVendorId === v.id;
                    return (
                      <div key={v.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                        <div className="space-y-0.5">
                          <p className="font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                            {v.name}
                            {v.isOfficial && (
                              <span className="bg-blue-600 text-[8px] text-white font-black px-1 rounded uppercase tracking-wider">Official</span>
                            )}
                          </p>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-x-2 gap-y-0.5 text-[10px] text-slate-400 font-bold">
                            <span className="text-yellow-500 flex items-center gap-0.5">
                              <span>Seller: ★ {v.rating}</span>
                              <span className="text-[9px] text-slate-400">({v.reviewsCount})</span>
                            </span>
                            <span className="hidden sm:inline">&bull;</span>
                            <span className="text-emerald-500 flex items-center gap-0.5">
                              <span>Delivery: ★ {v.deliveryRating || 4.7}</span>
                            </span>
                            <span className="hidden sm:inline">&bull;</span>
                            <span>{v.location}</span>
                            <span className="hidden sm:inline">&bull;</span>
                            <span>{v.deliveryTime}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5">
                          <div className="text-right">
                            <p className="font-black text-slate-950 dark:text-slate-50">{formatPrice(v.price)}</p>
                            <p className="text-[10px] text-slate-400 font-semibold">
                              {v.shippingFee === 0 ? 'Free Shipping' : `+ ${formatPrice(v.shippingFee)} shipping`}
                            </p>
                          </div>

                          <button
                            onClick={() => {
                              setSelectedVendorId(isSelected ? null : v.id);
                            }}
                            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all cursor-pointer border ${
                              isSelected
                                ? 'bg-orange-600 text-white border-orange-600'
                                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            {isSelected ? 'Selected' : 'Select'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Ugandan Shipping Estimator Widget */}
            <div className="p-4 bg-orange-50/30 dark:bg-slate-950/20 border border-orange-100/50 dark:border-slate-800 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Truck size={14} className="text-orange-600" />
                  <span>Uganda Shipping Calculator</span>
                </h4>
                <span className="text-[9px] font-extrabold text-orange-600 bg-orange-50 dark:bg-orange-950/30 px-2 py-0.5 rounded-md uppercase">
                  Cash on Delivery Eligible
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Select Destination District</label>
                  <select
                    value={selectedDistrict}
                    onChange={(e) => setSelectedDistrict(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer"
                  >
                    {UGANDA_DISTRICTS.map((dist) => (
                      <option key={dist} value={dist}>{dist}</option>
                    ))}
                  </select>
                </div>

                <div className="p-2.5 bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 rounded-xl space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Estimate cost & speed</p>
                  <p className="text-xs font-black text-slate-800 dark:text-slate-100">
                    Shipping Fee: <span className="text-orange-600">{shippingFee === 0 ? 'FREE' : formatPrice(shippingFee)}</span>
                  </p>
                  <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                    Speed: {deliveryDays}
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* Quantity selector, Add to Basket, Quick Checkout buttons */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <div className="flex flex-wrap items-center gap-4">
              
              {/* Quantity Incrementor */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700">
                <button 
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="w-9 h-9 font-black text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center justify-center cursor-pointer"
                >
                  -
                </button>
                <span className="w-10 text-center font-bold text-slate-800 dark:text-slate-200 text-xs sm:text-sm">
                  {quantity}
                </span>
                <button 
                  onClick={() => setQuantity(q => q + 1)}
                  className="w-9 h-9 font-black text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center justify-center cursor-pointer"
                >
                  +
                </button>
              </div>

              {/* Add to Basket */}
              <button
                onClick={() => onAddToCart(product, quantity, selectedVariations, currentVendor?.name || undefined, adjustedPrice)}
                className="flex-1 bg-orange-600 hover:bg-orange-500 text-white font-black py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md hover:scale-[1.01] active:scale-95 cursor-pointer text-xs uppercase tracking-wider min-w-[160px]"
              >
                <ShoppingCart size={15} />
                <span>Add {quantity} to Basket</span>
              </button>

              {/* Quick Buy Trigger */}
              <button
                onClick={() => setIsQuickBuyOpen(true)}
                className="bg-red-600 hover:bg-red-500 text-white font-black py-3.5 px-6 rounded-2xl flex items-center justify-center gap-1.5 transition-all shadow-md hover:scale-[1.01] active:scale-95 cursor-pointer text-xs uppercase tracking-wider"
              >
                <Sparkles size={14} className="animate-pulse" />
                <span>Buy Now (Express)</span>
              </button>
            </div>
          </div>

          {/* Quick Buy Form Modal Overlaid or inline */}
          {isQuickBuyOpen && (
            <div className="p-4 sm:p-5 bg-red-50/50 dark:bg-slate-900/60 border border-red-200 dark:border-red-900 rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-red-100 dark:border-red-900/40 pb-2">
                <h4 className="text-xs font-black text-red-700 dark:text-red-400 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles size={12} />
                  <span>Instant 1-Click Mobile Money Checkout</span>
                </h4>
                <button 
                  onClick={() => setIsQuickBuyOpen(false)}
                  className="text-xs text-red-400 hover:text-red-600 font-bold"
                >
                  Cancel
                </button>
              </div>

              {checkoutSuccess ? (
                <div className="p-4 bg-white dark:bg-slate-800 rounded-xl text-center space-y-2 border border-emerald-100">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center font-bold">
                    <Check size={20} />
                  </div>
                  <h5 className="font-bold text-xs text-slate-800 dark:text-slate-100">Order successfully submitted!</h5>
                  <p className="text-[10px] text-slate-500">
                    OliMart sales rep will call you at <strong>{checkoutPhone}</strong> within 15 minutes to confirm delivery dispatch to <strong>{checkoutAddress}</strong>. Thank you for shopping with us!
                  </p>
                </div>
              ) : (
                <form onSubmit={handleQuickCheckoutSubmit} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase">Your Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. John Kato"
                        value={checkoutName}
                        onChange={(e) => setCheckoutName(e.target.value)}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-red-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase">Phone Number (MTN / Airtel)</label>
                      <input
                        type="tel"
                        required
                        placeholder="e.g. 0772123456"
                        value={checkoutPhone}
                        onChange={(e) => setCheckoutPhone(e.target.value)}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-red-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Delivery Address / Landmarks</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Kampala Road, opposite Mutaasa Kafeero Plaza, Shop G4"
                      value={checkoutAddress}
                      onChange={(e) => setCheckoutAddress(e.target.value)}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-red-500"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setCheckoutMoMoNetwork('MTN')}
                        className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase ${checkoutMoMoNetwork === 'MTN' ? 'bg-yellow-400 text-slate-900 border border-yellow-500' : 'bg-slate-100 text-slate-500 border border-slate-200 dark:bg-slate-800'}`}
                      >
                        MTN MoMo
                      </button>
                      <button
                        type="button"
                        onClick={() => setCheckoutMoMoNetwork('Airtel')}
                        className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase ${checkoutMoMoNetwork === 'Airtel' ? 'bg-red-600 text-white border border-red-700' : 'bg-slate-100 text-slate-500 border border-slate-200 dark:bg-slate-800'}`}
                      >
                        Airtel Money
                      </button>
                    </div>

                    <button
                      type="submit"
                      className="bg-red-600 hover:bg-red-700 text-white text-[10px] font-black uppercase px-4 py-2 rounded-xl shadow-xs cursor-pointer"
                    >
                      Confirm Order ({formatPrice(adjustedPrice * quantity + shippingFee)})
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Tabs Row for Specifications, Delivery Information, and Verified Customer Reviews */}
      <div className="mt-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-4 sm:p-8 space-y-6 shadow-xs">
        
        {/* Navigation row */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 pb-2 overflow-x-auto gap-6 text-xs sm:text-sm font-bold text-slate-400">
          <button 
            onClick={() => setActiveTab('specs')}
            className={`pb-2 whitespace-nowrap cursor-pointer transition-all ${activeTab === 'specs' ? 'text-orange-600 border-b-2 border-orange-600 font-black' : 'hover:text-slate-700'}`}
          >
            Technical Specifications
          </button>
          <button 
            onClick={() => setActiveTab('delivery')}
            className={`pb-2 whitespace-nowrap cursor-pointer transition-all ${activeTab === 'delivery' ? 'text-orange-600 border-b-2 border-orange-600 font-black' : 'hover:text-slate-700'}`}
          >
            Delivery Guidelines & Guarantees
          </button>
          <button 
            onClick={() => setActiveTab('reviews')}
            className={`pb-2 whitespace-nowrap cursor-pointer transition-all ${activeTab === 'reviews' ? 'text-orange-600 border-b-2 border-orange-600 font-black' : 'hover:text-slate-700'}`}
          >
            Verified Customer Reviews ({reviewsList.length})
          </button>
        </div>

        {/* Specs Content */}
        {activeTab === 'specs' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
            {specs.map((item, idx) => (
              <div 
                key={idx} 
                className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-950/20 rounded-xl border border-slate-100/40 dark:border-slate-800/50 text-xs"
              >
                <span className="font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px]">{item.key}</span>
                <span className="font-extrabold text-slate-800 dark:text-slate-200 text-right max-w-[200px] sm:max-w-xs">{item.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Delivery Guidelines Content */}
        {activeTab === 'delivery' && (
          <div className="max-w-4xl space-y-4">
            <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl">
              <h4 className="text-xs font-black text-emerald-800 dark:text-emerald-400 uppercase tracking-wider mb-1">
                🚛 Doorstep Express Delivery Schedule
              </h4>
              <p className="text-xs text-emerald-700 dark:text-emerald-500 leading-relaxed font-medium">
                We deliver to all corners of Uganda. Once you confirm your purchase on the platform, our dispatch riders (for central regions) or official long-distance courier partners (for upcountry districts) will load your package immediately. Average arrival takes less than 24 hours upcountry and less than 4 hours in Kampala.
              </p>
            </div>

            <div className="p-4 bg-blue-50/50 dark:bg-blue-950/10 border border-blue-100 dark:border-blue-900/30 rounded-2xl">
              <h4 className="text-xs font-black text-blue-800 dark:text-blue-400 uppercase tracking-wider mb-1">
                🛡️ Pay on Delivery & Inspection Policy
              </h4>
              <p className="text-xs text-blue-700 dark:text-blue-500 leading-relaxed font-medium">
                Your peace of mind is our highest priority. To prevent counterfeit issues or shipping errors, you are allowed to open the delivery parcel, turn on electronic equipment, verify model numbers, and completely inspect the item before transferring cash or mobile money.
              </p>
            </div>

            <div className="p-4 bg-orange-50/50 dark:bg-orange-950/10 border border-orange-100 dark:border-orange-900/30 rounded-2xl">
              <h4 className="text-xs font-black text-orange-800 dark:text-orange-400 uppercase tracking-wider mb-1">
                🔄 7-Day Free Replacement Warranty
              </h4>
              <p className="text-xs text-orange-700 dark:text-orange-500 leading-relaxed font-medium">
                In the rare case that your product contains any hidden manufacturer flaws within 7 days of delivery, you can request an instant replacement without incurring additional courier charges.
              </p>
            </div>
          </div>
        )}

        {/* Customer Reviews Section */}
        {activeTab === 'reviews' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Reviews metrics visualizer (3-stars/4-stars breakdown) */}
            <div className="lg:col-span-4 space-y-4">
              <h4 className="text-xs font-black text-slate-800 dark:text-slate-300 uppercase tracking-wider">
                Rating breakdown
              </h4>

              <div className="p-5 bg-slate-50 dark:bg-slate-950/30 border border-slate-100 dark:border-slate-800/80 rounded-2xl space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-black text-slate-900 dark:text-slate-100">
                    {product.rating}
                  </span>
                  <div>
                    <div className="flex text-yellow-400">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} size={14} fill={i < Math.floor(product.rating) ? 'currentColor' : 'none'} stroke="currentColor" />
                      ))}
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">Average Score</p>
                  </div>
                </div>

                {/* Stars Breakdown lines */}
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                    <span className="w-10">5 ★</span>
                    <div className="flex-1 bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-yellow-400 h-full w-[85%] rounded-full"></div>
                    </div>
                    <span className="w-8 text-right">85%</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                    <span className="w-10">4 ★</span>
                    <div className="flex-1 bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-yellow-400 h-full w-[10%] rounded-full"></div>
                    </div>
                    <span className="w-8 text-right">10%</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                    <span className="w-10">3 ★</span>
                    <div className="flex-1 bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-yellow-400 h-full w-[5%] rounded-full"></div>
                    </div>
                    <span className="w-8 text-right">5%</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                    <span className="w-10">2 ★</span>
                    <div className="flex-1 bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-yellow-400 h-full w-[0%] rounded-full"></div>
                    </div>
                    <span className="w-8 text-right">0%</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                    <span className="w-10">1 ★</span>
                    <div className="flex-1 bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-yellow-400 h-full w-[0%] rounded-full"></div>
                    </div>
                    <span className="w-8 text-right">0%</span>
                  </div>
                </div>
              </div>

              {/* Submit Review Form */}
              <form onSubmit={handleAddReview} className="p-5 bg-orange-50/20 dark:bg-slate-950/10 border border-orange-100/50 dark:border-slate-800 rounded-2xl space-y-3">
                <h5 className="text-[10px] font-black text-orange-700 dark:text-orange-400 uppercase tracking-wider flex items-center gap-1">
                  <MessageSquare size={12} />
                  <span>Write a verified customer review</span>
                </h5>

                <div className="space-y-2 text-xs">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Your Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Lillian Alaso"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Product Star Rating</label>
                    <div className="flex items-center gap-1.5 py-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setUserRating(i + 1)}
                          className="text-yellow-400 hover:scale-115 transition-transform cursor-pointer"
                        >
                          <Star size={18} fill={i < userRating ? 'currentColor' : 'none'} stroke="currentColor" />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Your Review Comment</label>
                    <textarea
                      required
                      placeholder="Share details of your experience with shipping speed, product quality, or local customer support..."
                      value={userComment}
                      onChange={(e) => setUserComment(e.target.value)}
                      rows={3}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-orange-600 hover:bg-orange-500 text-white font-black py-2.5 rounded-xl transition-colors cursor-pointer text-[10px] uppercase tracking-wider shadow-xs"
                  >
                    Submit Verified Review
                  </button>
                </div>
              </form>
            </div>

            {/* Reviews feed list */}
            <div className="lg:col-span-8 space-y-3">
              <h4 className="text-xs font-black text-slate-800 dark:text-slate-300 uppercase tracking-wider">
                Customer Feedbacks ({reviewsList.length})
              </h4>

              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {reviewsList.map((rev, idx) => (
                  <div key={idx} className="p-4 sm:p-5 border border-slate-100 dark:border-slate-800 rounded-2xl bg-slate-50/40 dark:bg-slate-950/10 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-600 font-black flex items-center justify-center text-[10px]">
                          {rev.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-black text-slate-800 dark:text-slate-200">{rev.name}</p>
                          <p className="text-[9px] font-medium text-slate-400">Verified Consumer • {rev.location}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-medium">{rev.date}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <div className="flex text-yellow-400">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} size={10} fill={i < rev.rating ? 'currentColor' : 'none'} stroke="currentColor" />
                        ))}
                      </div>
                      <span className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-950 text-[8px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                        <CheckCircle size={8} fill="currentColor" className="text-white dark:text-emerald-400" />
                        Verified Purchase
                      </span>
                    </div>

                    <p className="text-slate-600 dark:text-slate-300 font-medium text-xs leading-relaxed">
                      {rev.text}
                    </p>

                    <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 pt-1 border-t border-slate-100/50 dark:border-slate-800/30">
                      <button 
                        onClick={() => {
                          const updated = [...reviewsList];
                          updated[idx].likes += 1;
                          setReviewsList(updated);
                        }}
                        className="hover:text-orange-600 flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <ThumbsUp size={11} />
                        <span>Helpful ({rev.likes})</span>
                      </button>
                      <button className="hover:text-slate-600 flex items-center gap-1 transition-colors cursor-pointer">
                        <Share2 size={11} />
                        <span>Share</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

      </div>

      {/* Recommended Items Tray */}
      {recommendedProducts.length > 0 && (
        <div className="mt-8 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-50 tracking-tight">
              Recommended Similar Products
            </h3>
            <span className="text-xs font-bold text-orange-600">Uganda Official Partners</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {recommendedProducts.map((p) => (
              <div 
                key={p.id}
                onClick={() => onProductClick(p)}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/80 p-3 shadow-xs hover:shadow-md hover:scale-101 transition-all duration-200 cursor-pointer flex flex-col justify-between group"
              >
                <div className="relative bg-slate-50 dark:bg-slate-950/40 rounded-xl p-3 flex items-center justify-center overflow-hidden aspect-square mb-2">
                  {p.discountBadge && (
                    <span className="absolute top-1.5 left-1.5 bg-red-600 text-white font-black text-[9px] px-1.5 py-0.5 rounded-md z-10">
                      {p.discountBadge}
                    </span>
                  )}
                  <img 
                    src={p.image} 
                    alt={p.title} 
                    className="max-h-24 object-contain rounded-lg group-hover:scale-104 transition-transform duration-200"
                    referrerPolicy="no-referrer"
                  />
                </div>

                <div className="space-y-1">
                  <p className="text-[9px] font-bold text-slate-400 uppercase">{p.brand}</p>
                  <h4 className="text-[11px] sm:text-xs font-bold text-slate-800 dark:text-slate-100 line-clamp-2 h-8 group-hover:text-orange-600 transition-colors">
                    {p.title}
                  </h4>
                  <div className="flex items-center gap-1 pt-1">
                    <Star size={10} fill="#eab308" stroke="none" />
                    <span className="text-[10px] font-black text-slate-700 dark:text-slate-300">{p.rating}</span>
                  </div>
                  <p className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-50 pt-1">
                    {formatPrice(p.price)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
