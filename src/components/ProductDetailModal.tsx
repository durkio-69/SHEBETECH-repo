import React, { useState } from 'react';
import { 
  X, 
  ShoppingCart, 
  Heart, 
  Truck, 
  ShieldCheck, 
  Star, 
  CheckCircle, 
  Coins, 
  Sparkles, 
  Package, 
  ChevronRight, 
  MessageSquare,
  BadgePercent
} from 'lucide-react';
import { Product } from '../types';

interface ProductDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onAddToCart: (p: Product, quantity?: number) => void;
  watchlist: string[];
  onToggleWatchlist: (productId: string) => void;
  formatPrice: (priceInUgx: number) => string;
}

export default function ProductDetailModal({
  isOpen,
  onClose,
  product,
  onAddToCart,
  watchlist,
  onToggleWatchlist,
  formatPrice
}: ProductDetailModalProps) {
  if (!isOpen || !product) return null;

  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'specs' | 'delivery' | 'reviews'>('specs');
  const [userRating, setUserRating] = useState(5);
  const [userComment, setUserComment] = useState('');
  const [customReviews, setCustomReviews] = useState<Array<{ name: string; location: string; rating: number; text: string; date: string }>>([]);

  // Generate specs based on product categories
  const getSpecs = (p: Product) => {
    const isPhone = p.category === 'phones';
    const isElec = p.category === 'electronics';
    const isFashion = p.category === 'fashion';
    const isHome = p.category === 'home';

    if (isPhone) {
      return [
        { label: 'Display Size', value: '6.6 inches Full HD+ AMOLED' },
        { label: 'Storage', value: p.title.includes('256') ? '256 GB ROM' : '128 GB ROM' },
        { label: 'Memory (RAM)', value: p.title.includes('8GB') ? '8 GB RAM' : '4 GB RAM' },
        { label: 'Primary Camera', value: '108 MP Ultra Clear Dual Camera' },
        { label: 'Battery Capacity', value: '5000 mAh Li-Po with Super Charge' },
        { label: 'Operating System', value: 'Android 14 with HiOS / XOS' },
        { label: 'Connectivity', value: 'Dual SIM, 4G LTE / 5G Capable' },
        { label: 'Warranty', value: '12 Months Official Brand Warranty' }
      ];
    } else if (isElec) {
      return [
        { label: 'Screen Resolution', value: '4K Ultra HD (3840 x 2160)' },
        { label: 'Smart TV Features', value: 'Built-in Netflix, YouTube, Prime Video, Google Play Store' },
        { label: 'Audio Power', value: '24W Dolby Digital Stereo Sound' },
        { label: 'Connectivity Ports', value: '3 x HDMI, 2 x USB, Optical Audio Out, Ethernet' },
        { label: 'Wireless Connectivity', value: 'Wi-Fi Dual Band, Bluetooth 5.1' },
        { label: 'Power Rating', value: '100-240V ~ 50/60Hz energy saver' },
        { label: 'Warranty', value: '24 Months Hisense / LG Official Service Warranty' }
      ];
    } else if (isFashion) {
      return [
        { label: 'Material Composition', value: '100% Breathable Ugandan Premium Cotton Blend' },
        { label: 'Fit Type', value: 'Modern Athletic / Regular Smart Casual' },
        { label: 'Stitching Strength', value: 'Reinforced dual-seam high density' },
        { label: 'Colorfast Quality', value: 'Guaranteed no-bleed laundry resistant dyes' },
        { label: 'Care Instructions', value: 'Machine wash cold, air dry or tumble dry low' }
      ];
    } else {
      return [
        { label: 'Primary Material', value: 'Reinforced Food-grade stainless steel & polymer' },
        { label: 'Capacity / Dimensions', value: 'Family size premium utility spec' },
        { label: 'Build Quality', value: 'Impact resistant, non-stick, double-wall insulated' },
        { label: 'Safety Standards', value: 'BPA-free non-toxic premium certification' }
      ];
    }
  };

  // Pre-made local reviews from Ugandan consumers
  const defaultReviews = [
    {
      name: 'Okello Moses',
      location: 'Gulu City',
      rating: 5,
      text: `Super fast delivery to Gulu! It was shipped the same day and arrived on the Horizon bus within 24 hours. The phone is genuine and is in perfect working condition. Olimart is the absolute best.`,
      date: 'June 28, 2026'
    },
    {
      name: 'Nakato Sarah',
      location: 'Kampala (Kisementi)',
      rating: 5,
      text: `We paid on delivery via MTN MoMo, which made us feel very secure. The item is exactly as described and authentic. No hassle!`,
      date: 'June 15, 2026'
    },
    {
      name: 'Mugisha David',
      location: 'Mbarara Town',
      rating: 4,
      text: `Good packaging, original accessories included. Delivery took 36 hours but the customer service rep checked in with me periodically. 10/10 recommended.`,
      date: 'May 29, 2026'
    }
  ];

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userComment.trim()) return;
    
    const newReview = {
      name: 'Olimart Customer',
      location: 'Kampala, UG',
      rating: userRating,
      text: userComment,
      date: 'Today'
    };

    setCustomReviews([newReview, ...customReviews]);
    setUserComment('');
    setUserRating(5);
  };

  const isProductInWatchlist = watchlist.includes(product.id);
  const specs = getSpecs(product);
  const reviewsList = [...customReviews, ...defaultReviews];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        
        {/* Background Overlay */}
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" 
          aria-hidden="true"
        />

        {/* Trick to center the modal contents */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        {/* Modal Panel */}
        <div className="inline-block align-bottom bg-white rounded-3xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full border border-slate-100 animate-scale-up">
          
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
            <div className="flex items-center gap-2">
              <span className="bg-orange-500 text-white font-black text-3xs uppercase px-2.5 py-0.5 rounded-lg tracking-wider">
                Product Details
              </span>
              {product.isOfficial && (
                <span className="bg-blue-50 text-blue-600 font-bold text-3xs px-2 py-0.5 rounded-md flex items-center gap-1">
                  <CheckCircle size={10} fill="currentColor" className="text-blue-600" />
                  Official Store
                </span>
              )}
            </div>
            <button 
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8 max-h-[75vh] overflow-y-auto">
            
            {/* Left side: Images & Watchlist */}
            <div className="space-y-4">
              <div className="relative bg-slate-50 border border-slate-100 rounded-3xl p-8 flex items-center justify-center overflow-hidden aspect-square">
                {product.discountBadge && (
                  <span className="absolute top-4 left-4 bg-red-600 text-white font-black text-sm px-3.5 py-1 rounded-xl shadow-md z-10 animate-bounce">
                    {product.discountBadge}
                  </span>
                )}

                <button
                  onClick={() => onToggleWatchlist(product.id)}
                  className={`absolute top-4 right-4 p-2.5 rounded-full shadow-md border transition-all z-20 cursor-pointer ${
                    isProductInWatchlist
                      ? 'bg-red-50 border-red-100 text-red-500'
                      : 'bg-white border-slate-100 text-slate-400 hover:text-red-500 hover:bg-slate-50'
                  }`}
                >
                  <Heart size={18} className={isProductInWatchlist ? "fill-red-500 text-red-500" : ""} />
                </button>

                <img 
                  src={product.image} 
                  alt={product.title} 
                  className="max-h-64 object-contain rounded-xl hover:scale-105 transition-transform duration-300"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Badges / Guarantees */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-emerald-50/50 border border-emerald-100 p-2.5 rounded-2xl flex flex-col items-center justify-center">
                  <Truck size={16} className="text-emerald-600 mb-1" />
                  <span className="text-3xs font-black text-emerald-800 leading-tight">Free Delivery</span>
                  <span className="text-4xs text-slate-400">Uganda-wide</span>
                </div>
                <div className="bg-orange-50/50 border border-orange-100 p-2.5 rounded-2xl flex flex-col items-center justify-center">
                  <Coins size={16} className="text-orange-500 mb-1" />
                  <span className="text-3xs font-black text-orange-800 leading-tight">Pay On Delivery</span>
                  <span className="text-4xs text-slate-400">Momo / Cash</span>
                </div>
                <div className="bg-blue-50/50 border border-blue-100 p-2.5 rounded-2xl flex flex-col items-center justify-center">
                  <ShieldCheck size={16} className="text-blue-600 mb-1" />
                  <span className="text-3xs font-black text-blue-800 leading-tight">100% Genuine</span>
                  <span className="text-4xs text-slate-400">Quality Assured</span>
                </div>
              </div>
            </div>

            {/* Right side: Product purchasing logic & Tabs info */}
            <div className="flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <div className="text-slate-400 font-extrabold text-3xs uppercase tracking-wider flex items-center gap-1.5">
                  <span>{product.brand}</span>
                  <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                  <span className="text-orange-600">{product.category.toUpperCase()}</span>
                </div>

                <h2 className="text-lg md:text-xl font-black text-slate-900 leading-snug">
                  {product.title}
                </h2>

                {/* Stars and feedback */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star 
                        key={i} 
                        size={14} 
                        fill={i < Math.floor(product.rating) ? '#eab308' : 'none'} 
                        stroke={i < Math.floor(product.rating) ? 'none' : '#cbd5e1'} 
                      />
                    ))}
                  </div>
                  <span className="text-xs font-black text-slate-700">{product.rating}</span>
                  <span className="text-xs text-slate-400">({product.reviewsCount} verified reviews)</span>
                </div>

                {/* Pricing Block */}
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-baseline gap-3">
                  <span className="text-xl md:text-2xl font-black text-orange-600">
                    {formatPrice(product.price)}
                  </span>
                  {product.originalPrice && (
                    <>
                      <span className="text-xs md:text-sm line-through text-slate-400 font-bold">
                        {formatPrice(product.originalPrice)}
                      </span>
                      <span className="bg-red-100 text-red-600 text-3xs font-extrabold px-1.5 py-0.5 rounded-lg">
                        SAVE {formatPrice(product.originalPrice - product.price)}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Interactive Tabs */}
              <div className="space-y-3 flex-1">
                <div className="flex border-b border-slate-100 gap-4 text-xs font-bold text-slate-400">
                  <button 
                    onClick={() => setActiveTab('specs')}
                    className={`pb-2 transition-all cursor-pointer ${activeTab === 'specs' ? 'text-orange-600 border-b-2 border-orange-600' : 'hover:text-slate-700'}`}
                  >
                    Specifications
                  </button>
                  <button 
                    onClick={() => setActiveTab('delivery')}
                    className={`pb-2 transition-all cursor-pointer ${activeTab === 'delivery' ? 'text-orange-600 border-b-2 border-orange-600' : 'hover:text-slate-700'}`}
                  >
                    Delivery & Location Info
                  </button>
                  <button 
                    onClick={() => setActiveTab('reviews')}
                    className={`pb-2 transition-all cursor-pointer ${activeTab === 'reviews' ? 'text-orange-600 border-b-2 border-orange-600' : 'hover:text-slate-700'}`}
                  >
                    Verified Customer Reviews ({reviewsList.length})
                  </button>
                </div>

                {/* Tab content area */}
                <div className="min-h-[160px] max-h-[220px] overflow-y-auto text-xs py-1">
                  {activeTab === 'specs' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600">
                      {specs.map((spec, idx) => (
                        <div key={idx} className="flex flex-col p-2 bg-slate-50 rounded-xl border border-slate-100/50">
                          <span className="text-3xs font-bold text-slate-400 uppercase tracking-wide">{spec.label}</span>
                          <span className="text-xs font-semibold text-slate-800 mt-0.5">{spec.value}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTab === 'delivery' && (
                    <div className="space-y-3 text-slate-600 font-medium">
                      <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-2xl space-y-1">
                        <h4 className="font-extrabold text-blue-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                          <Truck size={12} /> Fast Shipping Timeline
                        </h4>
                        <p className="text-xs text-blue-800">
                          <strong>Kampala, Mukono, Wakiso, Entebbe:</strong> Same-day / 24 Hours Express Home Delivery.
                        </p>
                        <p className="text-xs text-blue-800">
                          <strong>Upcountry (Mbarara, Jinja, Gulu, Lira, Mbale, Fort Portal):</strong> Dispatched immediately via courier. Arrives within 24 to 48 hours max!
                        </p>
                      </div>

                      <div className="p-3 bg-amber-50/50 border border-amber-100 rounded-2xl space-y-1">
                        <h4 className="font-extrabold text-amber-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                          <Coins size={12} /> Mobile Money Cashless Payment
                        </h4>
                        <p className="text-xs text-amber-800">
                          We fully support <strong>MTN Mobile Money</strong> and <strong>Airtel Money</strong> on-delivery payments, cash-on-delivery, and card payments. Test your items thoroughly before making payment!
                        </p>
                      </div>
                    </div>
                  )}

                  {activeTab === 'reviews' && (
                    <div className="space-y-3">
                      {/* Write a review form */}
                      <form onSubmit={handleAddReview} className="p-3 bg-slate-50 border border-slate-100 rounded-2xl space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-3xs text-slate-500 uppercase">Share your experience</span>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => setUserRating(i + 1)}
                                className="text-yellow-400 hover:scale-110 transition-transform cursor-pointer"
                              >
                                <Star size={11} fill={i < userRating ? 'currentColor' : 'none'} stroke="currentColor" />
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={userComment}
                            onChange={(e) => setUserComment(e.target.value)}
                            placeholder="Write a quick verified product review..."
                            className="flex-1 bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
                          />
                          <button
                            type="submit"
                            className="bg-orange-600 text-white font-bold px-3 py-1.5 rounded-xl hover:bg-orange-500 transition-colors cursor-pointer text-3xs uppercase"
                          >
                            Submit
                          </button>
                        </div>
                      </form>

                      {/* List */}
                      <div className="space-y-2">
                        {reviewsList.map((rev, idx) => (
                          <div key={idx} className="p-3 border border-slate-100 rounded-2xl space-y-1 bg-white">
                            <div className="flex justify-between items-center text-3xs text-slate-400">
                              <span className="font-black text-slate-700">{rev.name} <span className="font-medium text-slate-400">({rev.location})</span></span>
                              <span>{rev.date}</span>
                            </div>
                            <div className="flex gap-0.5 text-yellow-400">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star key={i} size={8} fill={i < rev.rating ? 'currentColor' : 'none'} stroke="currentColor" />
                              ))}
                            </div>
                            <p className="text-slate-600 font-medium text-xs leading-relaxed">{rev.text}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Quantity selector & Add to cart */}
              <div className="pt-4 border-t border-slate-100 flex items-center gap-4">
                <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
                  <button 
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="w-8 h-8 font-black text-slate-600 hover:bg-white rounded-lg transition-colors flex items-center justify-center cursor-pointer"
                  >
                    -
                  </button>
                  <span className="w-8 text-center font-bold text-slate-800 text-xs">
                    {quantity}
                  </span>
                  <button 
                    onClick={() => setQuantity(q => q + 1)}
                    className="w-8 h-8 font-black text-slate-600 hover:bg-white rounded-lg transition-colors flex items-center justify-center cursor-pointer"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={() => {
                    onAddToCart(product, quantity);
                    onClose();
                  }}
                  className="flex-1 bg-orange-600 hover:bg-orange-500 text-white font-black py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md hover:scale-[1.01] active:scale-95 cursor-pointer text-xs uppercase tracking-wider"
                >
                  <ShoppingCart size={14} />
                  <span>Add {quantity} Item{quantity > 1 ? 's' : ''} to Cart</span>
                </button>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
