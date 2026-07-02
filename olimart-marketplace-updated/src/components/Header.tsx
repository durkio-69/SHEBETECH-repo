import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  ShoppingCart, 
  User, 
  MapPin, 
  HelpCircle, 
  Phone, 
  ChevronDown, 
  Menu, 
  X,
  Sparkles,
  Heart,
  Sun,
  Moon,
  Globe,
  Percent,
  Zap,
  Trash2,
  ShoppingBag,
  Smartphone,
  Tv,
  Shirt,
  Home
} from 'lucide-react';
import { CATEGORIES, UGANDA_DISTRICTS, PRODUCTS } from '../data';
import { Product } from '../types';

interface HeaderProps {
  cartItemsCount: number;
  onCartClick: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  selectedLocation: string;
  setSelectedLocation: (loc: string) => void;
  // New props for Requirement 1
  currency: string;
  setCurrency: (c: string) => void;
  language: string;
  setLanguage: (l: string) => void;
  isDarkMode: boolean;
  setIsDarkMode: (dark: boolean) => void;
  watchlist: string[];
  onWatchlistToggle: (productId: string) => void;
  onProductClick: (p: Product) => void;
  formatPrice: (priceInUgx: number) => string;
  // New props for Requirement 2
  selectedSpecialTab: 'all' | 'todays-deal' | 'flash-sales' | 'discount';
  setSelectedSpecialTab: (tab: 'all' | 'todays-deal' | 'flash-sales' | 'discount') => void;
  onAccountClick: () => void;
}

export default function Header({
  cartItemsCount,
  onCartClick,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  selectedLocation,
  setSelectedLocation,
  currency,
  setCurrency,
  language,
  setLanguage,
  isDarkMode,
  setIsDarkMode,
  watchlist,
  onWatchlistToggle,
  onProductClick,
  formatPrice,
  selectedSpecialTab,
  setSelectedSpecialTab,
  onAccountClick
}: HeaderProps) {
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isWatchlistOpen, setIsWatchlistOpen] = useState(false);
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const trimmedQuery = searchQuery.trim().toLowerCase();
  
  const suggestedProducts = trimmedQuery
    ? PRODUCTS.filter(p => 
        p.title.toLowerCase().includes(trimmedQuery) || 
        p.brand.toLowerCase().includes(trimmedQuery) ||
        (p.category && p.category.toLowerCase().includes(trimmedQuery))
      ).slice(0, 5)
    : [];

  const suggestedCategories = trimmedQuery
    ? CATEGORIES.filter(c => 
        c.name.toLowerCase().includes(trimmedQuery) ||
        c.id.toLowerCase().includes(trimmedQuery)
      ).slice(0, 3)
    : [];

  return (
    <header className="w-full bg-white shadow-xs sticky top-0 z-40" id="main-header">
      {/* Top Utility Bar */}
      <div className="hidden md:block bg-gradient-to-r from-[#10131a] via-[#161a22] to-[#10131a] text-slate-300 text-[11px] py-1.5 px-4 border-b border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-2">
          {/* Left Side: Delivery, Sell option & Watchlist */}
          <div className="flex items-center gap-4 flex-wrap justify-center md:justify-start">
            {/* Location Picker */}
            <div className="relative">
              <button 
                onClick={() => setIsLocationOpen(!isLocationOpen)}
                className="flex items-center gap-1 hover:opacity-90 font-medium transition-colors cursor-pointer text-white"
                id="location-picker-btn"
              >
                <MapPin size={13} className="text-white" />
                <span>Deliver to: <strong className="font-bold underline">{selectedLocation}</strong></span>
                <ChevronDown size={11} />
              </button>

              {isLocationOpen && (
                <div className="absolute left-0 mt-2 w-56 bg-white border border-slate-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto py-1 text-slate-800">
                  <div className="p-2 border-b border-slate-100 bg-slate-50 sticky top-0">
                    <p className="font-semibold text-slate-800">Select Delivery District</p>
                  </div>
                  {UGANDA_DISTRICTS.map((district) => (
                    <button
                      key={district}
                      onClick={() => {
                        setSelectedLocation(district);
                        setIsLocationOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 hover:bg-orange-50 hover:text-orange-600 text-xs transition-colors ${
                        selectedLocation === district ? 'bg-orange-50 text-orange-600 font-medium' : 'text-slate-700'
                      }`}
                    >
                      {district}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <span className="opacity-40">|</span>

            {/* Option for selling */}
            <a href="#sell-section" className="font-bold uppercase hover:underline transition-all flex items-center gap-1">
              <Sparkles size={11} />
              <span>Sell on OliMart</span>
            </a>

            <span className="opacity-40">|</span>

            {/* Watchlist Dropdown */}
            <div className="relative">
              <button 
                onClick={() => {
                  setIsWatchlistOpen(!isWatchlistOpen);
                  setIsCurrencyOpen(false);
                  setIsLanguageOpen(false);
                }}
                className="font-bold uppercase hover:underline transition-all flex items-center gap-1 cursor-pointer text-white"
              >
                <Heart size={12} className={`${watchlist.length > 0 ? 'fill-white text-white' : ''}`} />
                <span>Watchlist ({watchlist.length})</span>
                <ChevronDown size={10} />
              </button>

              {isWatchlistOpen && (
                <div className="absolute left-0 mt-2 w-72 bg-white border border-slate-200 rounded-lg shadow-xl z-50 text-slate-800 p-2 max-h-80 overflow-y-auto">
                  <div className="flex justify-between items-center p-2 border-b border-slate-100 bg-slate-50 font-bold text-xs sticky top-0 text-slate-800">
                    <span>Watchlisted Products</span>
                    <button onClick={() => setIsWatchlistOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={12} /></button>
                  </div>
                  {watchlist.length === 0 ? (
                    <div className="py-4 text-center text-slate-400 text-[10px]">
                      Your watchlist is empty. Add products to track them!
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {PRODUCTS.filter(p => watchlist.includes(p.id)).map(product => (
                        <div key={product.id} className="flex gap-2 py-2 items-center text-left">
                          <img 
                            src={product.image} 
                            alt={product.title} 
                            className="w-10 h-10 object-contain bg-slate-50 rounded" 
                          />
                          <div className="flex-1 min-w-0">
                            <p 
                              className="text-[10px] font-bold text-slate-800 truncate hover:text-orange-500 cursor-pointer" 
                              onClick={() => { 
                                onProductClick(product); 
                                setIsWatchlistOpen(false); 
                              }}
                            >
                              {product.title}
                            </p>
                            <p className="text-[10px] font-black text-orange-600">{formatPrice(product.price)}</p>
                          </div>
                          <button 
                            onClick={() => onWatchlistToggle(product.id)}
                            className="text-slate-300 hover:text-red-500 p-1"
                            title="Remove from watchlist"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Side: Currency Exchanger, Language Exchanger, Dark Mode Toggle */}
          <div className="flex items-center gap-4 flex-wrap justify-center md:justify-end">
            {/* Language Exchanger */}
            <div className="relative">
              <button 
                onClick={() => { 
                  setIsLanguageOpen(!isLanguageOpen); 
                  setIsCurrencyOpen(false); 
                  setIsWatchlistOpen(false);
                }}
                className="flex items-center gap-1 hover:opacity-90 font-bold uppercase transition-colors cursor-pointer text-white"
              >
                <Globe size={12} />
                <span>Lang: <strong className="underline">{language === 'EN' ? 'EN' : language === 'LG' ? 'LG' : language === 'SW' ? 'SW' : 'FR'}</strong></span>
                <ChevronDown size={10} />
              </button>

              {isLanguageOpen && (
                <div className="absolute right-0 mt-2 w-32 bg-white border border-slate-200 rounded-lg shadow-lg z-50 py-1 text-slate-800 text-[10px]">
                  {[
                    { code: 'EN', name: 'English 🇺🇸' },
                    { code: 'LG', name: 'Luganda 🇺🇬' },
                    { code: 'SW', name: 'Swahili 🇹🇿' },
                    { code: 'FR', name: 'French 🇫🇷' }
                  ].map(lang => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setLanguage(lang.code);
                        setIsLanguageOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 hover:bg-orange-50 hover:text-orange-600 font-bold transition-colors ${
                        language === lang.code ? 'bg-orange-50 text-orange-600' : 'text-slate-700'
                      }`}
                    >
                      {lang.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <span className="opacity-40">|</span>

            {/* Currency Exchanger */}
            <div className="relative">
              <button 
                onClick={() => { 
                  setIsCurrencyOpen(!isCurrencyOpen); 
                  setIsLanguageOpen(false); 
                  setIsWatchlistOpen(false);
                }}
                className="flex items-center gap-1 hover:opacity-90 font-bold uppercase transition-colors cursor-pointer text-white"
              >
                <Percent size={12} />
                <span>Curr: <strong className="underline">{currency}</strong></span>
                <ChevronDown size={10} />
              </button>

              {isCurrencyOpen && (
                <div className="absolute right-0 mt-2 w-32 bg-white border border-slate-200 rounded-lg shadow-lg z-50 py-1 text-slate-800 text-[10px]">
                  {[
                    { code: 'UGX', label: 'UGX (Shs)' },
                    { code: 'USD', label: 'USD ($)' },
                    { code: 'EUR', label: 'EUR (€)' },
                    { code: 'KES', label: 'KES (KSh)' }
                  ].map(curr => (
                    <button
                      key={curr.code}
                      onClick={() => {
                        setCurrency(curr.code);
                        setIsCurrencyOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 hover:bg-orange-50 hover:text-orange-600 font-bold transition-colors ${
                        currency === curr.code ? 'bg-orange-50 text-orange-600' : 'text-slate-700'
                      }`}
                    >
                      {curr.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <span className="opacity-40">|</span>

            {/* Dark Mode Toggle */}
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="flex items-center gap-1 hover:opacity-90 font-bold uppercase transition-colors cursor-pointer text-white"
              title="Toggle theme mode"
            >
              {isDarkMode ? (
                <>
                  <Sun size={12} className="text-yellow-300 animate-spin-slow" />
                  <span>Light</span>
                </>
              ) : (
                <>
                  <Moon size={12} className="text-slate-200" />
                  <span>Dark</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Header Row */}
      <div className="bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 py-3.5 px-4 border-b border-gray-200 dark:border-slate-800 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-4 justify-between">
          <div className="flex justify-between items-center w-full md:w-auto">
            {/* Mobile menu toggle */}
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-1 text-gray-700 dark:text-slate-200 hover:text-orange-600 transition-colors"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Logo */}
            <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => {
              setSelectedCategory('all');
              setSearchQuery('');
              setSelectedSpecialTab('all');
            }}>
              <div className="bg-[#EA6A0C] p-1.5 rounded-lg mr-1 flex items-center justify-center shadow-xs">
                <ShoppingBag size={15} className="text-white fill-white" />
              </div>
              <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white select-none">
                Oli<span className="text-[#EA6A0C]">Mart</span>
              </span>
            </div>

            {/* Mobile Cart */}
            <button 
              onClick={onCartClick} 
              className="md:hidden relative p-2 bg-[#EA6A0C] rounded-lg hover:bg-[#C2560A] text-white transition-colors animate-pulse"
            >
              <ShoppingCart size={18} />
              {cartItemsCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center shadow-md">
                  {cartItemsCount}
                </span>
              )}
            </button>
          </div>

          {/* Search bar */}
          <div ref={searchRef} className="w-full md:flex-1 max-w-2xl flex items-center relative" id="header-search-container">
            <div className="flex w-full rounded-lg overflow-hidden bg-white dark:bg-slate-800 border-2 border-[#EA6A0C] relative shadow-xs">
              {/* Category selector */}
              <div className="hidden lg:block relative border-r border-slate-200 dark:border-slate-700">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold h-full px-3 pr-8 focus:outline-none cursor-pointer appearance-none"
                  style={{ backgroundImage: 'url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23475569\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpath d=\'m6 9 6 6 6-6\'/%3E%3C/svg%3E")', backgroundPosition: 'right 8px center', backgroundSize: '14px', backgroundRepeat: 'no-repeat' }}
                >
                  <option value="all">All Categories</option>
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Input */}
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder="Search products, brands and categories"
                  className="w-full py-2 pl-4 pr-16 bg-white dark:bg-slate-800 focus:outline-none text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                />
                {searchQuery && (
                  <button 
                    onClick={() => {
                      setSearchQuery('');
                      setShowSuggestions(false);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded uppercase font-bold"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Search button */}
              <button className="bg-[#EA6A0C] text-white px-7 font-black hover:bg-[#C2560A] transition-colors uppercase text-xs tracking-wider flex items-center gap-1.5 cursor-pointer">
                <Search size={14} strokeWidth={3} />
                <span className="hidden sm:inline">Search</span>
              </button>
            </div>

            {/* Live Search Suggestions Dropdown */}
            {showSuggestions && trimmedQuery && (
              <div 
                className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl z-50 p-3 max-h-[400px] overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-150"
                id="search-suggestions-dropdown"
              >
                {suggestedCategories.length === 0 && suggestedProducts.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400 dark:text-slate-500 font-semibold">
                    <p className="font-bold mb-1 text-slate-600 dark:text-slate-400">No direct matches found</p>
                    <p className="text-[10px]">Press Enter or click search to browse all matching items.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Category matches */}
                    {suggestedCategories.length > 0 && (
                      <div>
                        <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-2 mb-1.5 flex items-center gap-1">
                          <span>Matched Categories</span>
                        </div>
                        <div className="space-y-0.5">
                          {suggestedCategories.map((cat) => (
                            <button
                              key={cat.id}
                              onClick={() => {
                                setSelectedCategory(cat.id);
                                setSearchQuery('');
                                setShowSuggestions(false);
                              }}
                              className="w-full text-left px-2 py-2 rounded-lg text-xs font-extrabold hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-between group transition-colors"
                            >
                              <span className="flex items-center gap-2">
                                <span className="text-[#EA6A0C] group-hover:scale-110 transition-transform">
                                  {cat.id === 'phones' ? <Smartphone size={13} /> :
                                   cat.id === 'electronics' ? <Tv size={13} /> :
                                   cat.id === 'fashion' ? <Shirt size={13} /> :
                                   cat.id === 'home' ? <Home size={13} /> :
                                   cat.id === 'beauty' ? <Sparkles size={13} /> :
                                   <ShoppingBag size={13} />}
                                </span>
                                <span>{cat.name}</span>
                              </span>
                              <span className="text-[9px] bg-orange-50 dark:bg-orange-950/40 text-[#EA6A0C] px-2 py-0.5 rounded-md uppercase font-black opacity-0 group-hover:opacity-100 transition-all">
                                Go to Department
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {suggestedCategories.length > 0 && suggestedProducts.length > 0 && (
                      <div className="h-px bg-slate-100 dark:bg-slate-800/60" />
                    )}

                    {/* Product matches */}
                    {suggestedProducts.length > 0 && (
                      <div>
                        <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-2 mb-1.5 flex items-center justify-between">
                          <span>Suggested Products</span>
                          <span className="text-[9px] text-[#EA6A0C] lowercase font-bold">matching "{searchQuery}"</span>
                        </div>
                        <div className="space-y-1">
                          {suggestedProducts.map((p) => (
                            <div
                              key={p.id}
                              onClick={() => {
                                onProductClick(p);
                                setShowSuggestions(false);
                              }}
                              className="w-full text-left p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent hover:border-slate-100 dark:hover:border-slate-800 flex gap-3 items-center cursor-pointer transition-all group"
                            >
                              <div className="w-10 h-10 bg-white dark:bg-slate-950 rounded-lg p-1 flex items-center justify-center overflow-hidden border border-slate-100 dark:border-slate-800 flex-shrink-0 group-hover:scale-105 transition-transform">
                                <img
                                  src={p.image}
                                  alt={p.title}
                                  className="max-h-full max-w-full object-contain"
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-1.5">
                                  <p className="font-extrabold text-slate-800 dark:text-slate-200 text-xs truncate group-hover:text-[#EA6A0C] transition-colors">
                                    {p.title}
                                  </p>
                                  <span className="text-[10px] text-orange-600 dark:text-orange-400 font-black flex-shrink-0">
                                    {formatPrice(p.price)}
                                  </span>
                                </div>
                                <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5 flex items-center gap-1">
                                  <span className="text-slate-500 dark:text-slate-400">{p.brand}</span>
                                  <span>&bull;</span>
                                  <span className="text-yellow-500">★ {p.rating}</span>
                                  {p.isOfficial && (
                                    <>
                                      <span>&bull;</span>
                                      <span className="text-blue-500 text-[8px] font-black uppercase">Official</span>
                                    </>
                                  )}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action links */}
          <div className="hidden md:flex items-center gap-4">
            {/* Account Jumia-Style Hover Dropdown */}
            <div className="relative group/account">
              <button 
                onClick={onAccountClick} 
                className="flex items-center gap-1 py-1 px-2.5 hover:text-[#EA6A0C] dark:hover:text-[#EA6A0C] transition-colors font-bold text-xs text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                <User size={18} className="text-slate-600 dark:text-slate-300 group-hover/account:text-[#EA6A0C]" />
                <span className="uppercase tracking-wide">Account</span>
                <ChevronDown size={11} className="transition-transform group-hover/account:rotate-180" />
              </button>

              {/* Jumia Style Account Dropdown Panel */}
              <div className="absolute right-0 mt-1 w-60 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-xl py-3 px-3.5 hidden group-hover/account:block z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <button 
                  onClick={onAccountClick}
                  className="w-full bg-[#EA6A0C] hover:bg-[#C2560A] text-white py-2 rounded-lg text-xs font-black uppercase tracking-wider text-center block mb-2.5 shadow-sm transition-all"
                >
                  Sign In / Register
                </button>
                <div className="h-px bg-slate-100 dark:bg-slate-800 my-2" />
                <div className="space-y-2 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  <button onClick={onAccountClick} className="w-full text-left py-1 hover:text-[#EA6A0C] flex items-center gap-2">
                    <User size={13} /> <span>My Profile & Settings</span>
                  </button>
                  <button onClick={onAccountClick} className="w-full text-left py-1 hover:text-[#EA6A0C] flex items-center gap-2">
                    <ShoppingBag size={13} /> <span>My Orders & Returns</span>
                  </button>
                  <button onClick={() => { setSelectedCategory('all'); setSelectedSpecialTab('flash-sales'); }} className="w-full text-left py-1 hover:text-[#EA6A0C] flex items-center gap-2">
                    <Heart size={13} /> <span>Saved Items / Watchlist</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Help Jumia-Style Hover Dropdown */}
            <div className="relative group/help">
              <button className="flex items-center gap-1 py-1 px-2.5 hover:text-[#EA6A0C] dark:hover:text-[#EA6A0C] transition-colors font-bold text-xs text-slate-700 dark:text-slate-200 cursor-pointer">
                <HelpCircle size={18} className="text-slate-600 dark:text-slate-300" />
                <span className="uppercase tracking-wide">Help</span>
                <ChevronDown size={11} className="transition-transform group-hover/help:rotate-180" />
              </button>

              {/* Help Dropdown Panel */}
              <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-xl py-2 px-3 hidden group-hover/help:block z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="space-y-2 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  <button onClick={onAccountClick} className="w-full text-left py-1 hover:text-[#EA6A0C]">Help Center</button>
                  <button onClick={onAccountClick} className="w-full text-left py-1 hover:text-[#EA6A0C]">Place an order</button>
                  <button onClick={onAccountClick} className="w-full text-left py-1 hover:text-[#EA6A0C]">Payment options</button>
                  <button onClick={onAccountClick} className="w-full text-left py-1 hover:text-[#EA6A0C]">Delivery timelines</button>
                </div>
              </div>
            </div>

            {/* Desktop Cart */}
            <div 
              onClick={onCartClick} 
              className="flex flex-col items-center cursor-pointer relative group px-2 py-1"
            >
              {cartItemsCount > 0 && (
                <span className="absolute -top-1.5 -right-1 bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] h-[18px] flex items-center justify-center shadow-sm animate-pulse">
                  {cartItemsCount}
                </span>
              )}
              <div className="text-slate-700 dark:text-slate-300 group-hover:text-[#EA6A0C] transition-colors">
                <ShoppingCart size={20} />
              </div>
              <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 group-hover:text-[#EA6A0C] mt-0.5 uppercase tracking-wide">Cart</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Navigation Bar */}
      <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-xs hidden md:block">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center divide-x divide-slate-100 dark:divide-slate-800">
            {/* All Categories / Products */}
            <button 
              onClick={() => {
                setSelectedCategory('all');
                setSelectedSpecialTab('all');
                onProductClick({} as Product); // Back to listings
              }}
              className={`py-3 px-4 font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer ${
                selectedCategory === 'all' && selectedSpecialTab === 'all' ? 'text-[#EA6A0C] bg-[#EA6A0C]/5' : 'text-slate-800 dark:text-slate-200 hover:text-[#EA6A0C]'
              }`}
            >
              <Menu size={14} />
              <span>All Products</span>
            </button>

            {/* Today's Deal */}
            <button
              onClick={() => {
                setSelectedSpecialTab('todays-deal');
                setSelectedCategory('all');
              }}
              className={`py-3 px-5 text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedSpecialTab === 'todays-deal'
                  ? 'text-red-600 border-b-2 border-red-600 bg-red-50/30 font-black' 
                  : 'text-slate-700 dark:text-slate-300 hover:text-red-600 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold'
              }`}
            >
              <Sparkles size={13} className="text-red-500 animate-pulse" />
              <span>Today's Deal</span>
            </button>

            {/* Flash Sales */}
            <button
              onClick={() => {
                setSelectedSpecialTab('flash-sales');
                setSelectedCategory('all');
              }}
              className={`py-3 px-5 text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedSpecialTab === 'flash-sales'
                  ? 'text-[#EA6A0C] border-b-2 border-[#EA6A0C] bg-[#EA6A0C]/5 font-black' 
                  : 'text-slate-700 dark:text-slate-300 hover:text-[#EA6A0C] hover:bg-slate-50 dark:hover:bg-slate-800 font-bold'
              }`}
            >
              <Zap size={13} className="text-[#EA6A0C]" />
              <span>Flash Sales</span>
            </button>

            {/* Discount */}
            <button
              onClick={() => {
                setSelectedSpecialTab('discount');
                setSelectedCategory('all');
              }}
              className={`py-3 px-5 text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedSpecialTab === 'discount'
                  ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50/30 font-black' 
                  : 'text-slate-700 dark:text-slate-300 hover:text-emerald-600 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold'
              }`}
            >
              <Percent size={13} className="text-emerald-500" />
              <span>Discount</span>
            </button>
          </div>

          <div className="hidden lg:flex items-center gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span className="text-orange-600 animate-pulse font-bold bg-orange-50 dark:bg-orange-950/20 px-2 py-1 rounded">
              ★ MoMo Flash Sales Daily!
            </span>
            <span className="h-4 w-px bg-slate-200 dark:bg-slate-800"></span>
            <button 
              onClick={onAccountClick}
              className="hover:text-slate-800 dark:hover:text-white hover:underline transition-all cursor-pointer"
            >
              Sell on OliMart
            </button>
            <button 
              onClick={onAccountClick}
              className="hover:text-slate-800 dark:hover:text-white hover:underline transition-all cursor-pointer"
            >
              Help Center
            </button>
          </div>
        </div>
      </nav>

      {/* JUMIA-STYLE LEFT SLIDING MOBILE DRAWER WITH BACKDROP (Requirement 4 & 5) */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex" id="mobile-menu-overlay">
          {/* Backdrop blur overlay */}
          <div 
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-slate-950/65 backdrop-blur-xs transition-opacity duration-300"
          />

          {/* Left slide drawer panel */}
          <div className="relative flex flex-col w-[295px] max-w-[85vw] h-full bg-white dark:bg-slate-950 shadow-2xl z-10 animate-slide-right overflow-y-auto text-slate-800 dark:text-slate-100 flex-shrink-0">
            {/* Drawer Header (Jumia VIP Banner Theme) */}
            <div className="bg-gradient-to-r from-[#EA6A0C] to-orange-600 text-white p-5 space-y-3.5">
              <div className="flex justify-between items-center">
                <span className="text-lg font-black tracking-tight select-none">
                  Oli<span className="text-yellow-300">Mart</span>
                </span>
                <button 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-white hover:text-orange-100 p-1 bg-white/10 rounded-full cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>
              <div>
                <p className="text-[10px] font-bold text-orange-100 uppercase tracking-wide">Welcome to Uganda's Marketplace</p>
                <button 
                  onClick={() => {
                    onAccountClick();
                    setIsMobileMenuOpen(false);
                  }}
                  className="mt-2 w-full bg-slate-950 hover:bg-slate-900 text-white py-2 rounded-lg text-xs font-black uppercase tracking-wider shadow-sm transition-all text-center flex items-center justify-center gap-1.5"
                >
                  <User size={13} className="fill-white" />
                  <span>Sign In / Create Account</span>
                </button>
              </div>
            </div>

            {/* Drawer Content */}
            <div className="p-4 space-y-4 flex-1">
              {/* Special Deals Quick Links */}
              <div className="space-y-1.5">
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-2">Marketplace Hotspots</p>
                <div className="space-y-1">
                  <button
                    onClick={() => {
                      setSelectedSpecialTab('todays-deal');
                      setSelectedCategory('all');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between ${
                      selectedSpecialTab === 'todays-deal' ? 'bg-red-50 text-red-600' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900/40'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Sparkles size={14} className="text-red-500" />
                      <span>Today's Deal</span>
                    </span>
                    <span className="bg-red-600 text-white font-black text-[8px] px-1.5 rounded uppercase">NEW</span>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedSpecialTab('flash-sales');
                      setSelectedCategory('all');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between ${
                      selectedSpecialTab === 'flash-sales' ? 'bg-orange-50 text-[#EA6A0C]' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900/40'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Zap size={14} className="text-[#EA6A0C]" />
                      <span>Flash Sales</span>
                    </span>
                    <span className="bg-orange-600 text-white font-black text-[8px] px-1.5 rounded uppercase animate-pulse">LIVELY</span>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedSpecialTab('discount');
                      setSelectedCategory('all');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between ${
                      selectedSpecialTab === 'discount' ? 'bg-emerald-50 text-emerald-600' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900/40'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Percent size={14} className="text-emerald-500" />
                      <span>Super Savings</span>
                    </span>
                    <span className="text-[10px] text-emerald-500 font-extrabold">-50%</span>
                  </button>
                </div>
              </div>

              <div className="h-px bg-slate-100 dark:bg-slate-800" />

              {/* Browse Category Departments list */}
              <div className="space-y-1.5">
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-2">Our Departments</p>
                <div className="space-y-1">
                  <button
                    onClick={() => {
                      setSelectedCategory('all');
                      setSelectedSpecialTab('all');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2.5 ${
                      selectedCategory === 'all' && selectedSpecialTab === 'all' ? 'bg-orange-50 text-orange-600' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <Menu size={14} className="text-slate-400" />
                    <span>All Products</span>
                  </button>
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setSelectedCategory(cat.id);
                        setSelectedSpecialTab('all');
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2.5 ${
                        selectedCategory === cat.id && selectedSpecialTab === 'all' ? 'bg-orange-50 text-orange-600' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-slate-400">
                        {cat.id === 'phones' ? <Smartphone size={14} /> :
                         cat.id === 'electronics' ? <Tv size={14} /> :
                         cat.id === 'fashion' ? <Shirt size={14} /> :
                         cat.id === 'home' ? <Home size={14} /> :
                         cat.id === 'beauty' ? <Sparkles size={14} /> :
                         <ShoppingBag size={14} />}
                      </span>
                      <span>{cat.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-px bg-slate-100 dark:bg-slate-800" />

              {/* Kampala services / hotline */}
              <div className="space-y-2">
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-2">Support & Settings</p>
                <button 
                  onClick={() => {
                    setIsLocationOpen(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-2.5 hover:bg-slate-50"
                >
                  <MapPin size={14} className="text-[#EA6A0C]" />
                  <span>Deliver to: {selectedLocation}</span>
                </button>

                {/* Dark Mode Toggle */}
                <button 
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className="w-full text-left px-3 py-2 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-2.5 hover:bg-slate-50"
                >
                  {isDarkMode ? <Sun size={14} className="text-yellow-500" /> : <Moon size={14} className="text-slate-400" />}
                  <span>Theme: {isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
                </button>

                {/* Currency Quick-change */}
                <div className="px-3 py-1 text-xs">
                  <p className="text-[10px] font-bold text-slate-400 mb-1">Select Currency:</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {['UGX', 'USD', 'EUR', 'KES'].map(curr => (
                      <button
                        key={curr}
                        onClick={() => setCurrency(curr)}
                        className={`px-2 py-1 rounded text-[10px] font-black ${
                          currency === curr 
                            ? 'bg-[#EA6A0C] text-white' 
                            : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {curr}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Language Quick-change */}
                <div className="px-3 py-1 text-xs">
                  <p className="text-[10px] font-bold text-slate-400 mb-1">Select Language:</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {[
                      { code: 'EN', name: 'EN 🇺🇸' },
                      { code: 'LG', name: 'LG 🇺🇬' },
                      { code: 'SW', name: 'SW 🇹🇿' },
                      { code: 'FR', name: 'FR 🇫🇷' }
                    ].map(lang => (
                      <button
                        key={lang.code}
                        onClick={() => setLanguage(lang.code)}
                        className={`px-2 py-1 rounded text-[10px] font-black ${
                          language === lang.code 
                            ? 'bg-orange-600 text-white' 
                            : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {lang.name}
                      </button>
                    ))}
                  </div>
                </div>

                <a 
                  href="tel:0200804020"
                  className="block text-left px-3 py-2 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-2.5 hover:bg-slate-50"
                >
                  <Phone size={14} className="text-emerald-500" />
                  <span>Kampala Hotline: 0200 804 020</span>
                </a>
              </div>
            </div>

            {/* Drawer Footer info */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800 text-center space-y-1">
              <p className="text-[10px] font-black text-slate-400">OLIMART UGANDA MARKETPLACE</p>
              <p className="text-[9px] text-slate-400">MoMo Cash On Delivery Secured</p>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
