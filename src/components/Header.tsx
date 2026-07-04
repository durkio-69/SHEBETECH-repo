import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  ShoppingCart,
  User,
  MapPin,
  HelpCircle,
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
  selectedSpecialTab: 'all' | 'todays-deal' | 'flash-sales' | 'discount';
  setSelectedSpecialTab: (tab: 'all' | 'todays-deal' | 'flash-sales' | 'discount') => void;
  onAccountClick: () => void;
  fontSize: 'normal' | 'large' | 'xl';
  setFontSize: (size: 'normal' | 'large' | 'xl') => void;
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
  onAccountClick,
  fontSize,
  setFontSize
}: HeaderProps) {
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
      if (accountRef.current && !accountRef.current.contains(event.target as Node)) {
        setIsAccountOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const closeAllDropdowns = () => {
    setIsLocationOpen(false);
    setIsCurrencyOpen(false);
    setIsLanguageOpen(false);
    setIsAccountOpen(false);
  };

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

  const getCategoryIcon = (id: string, size = 13) => {
    switch (id) {
      case 'phones': return <Smartphone size={size} />;
      case 'electronics': return <Tv size={size} />;
      case 'fashion': return <Shirt size={size} />;
      case 'home': return <Home size={size} />;
      case 'beauty': return <Sparkles size={size} />;
      default: return <ShoppingBag size={size} />;
    }
  };

  return (
    <header className="w-full sticky top-0 z-40" id="main-header">
      {/* ============ TIER 1: Primary navy bar — logo, deliver-to, search, account, cart ============ */}
      <div className="bg-az-navy text-white">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 flex items-center gap-2 sm:gap-4">
          {/* Mobile menu toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-1.5 -ml-1 text-white hover:border hover:border-white rounded-xs cursor-pointer"
            aria-label="Open menu"
          >
            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          {/* Logo */}
          <button
            className="flex flex-col items-start leading-none flex-shrink-0 cursor-pointer border border-transparent hover:border-white rounded-xs px-1.5 py-1 -ml-1.5"
            onClick={() => {
              setSelectedCategory('all');
              setSearchQuery('');
              setSelectedSpecialTab('all');
            }}
          >
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-white select-none">
              Oli<span className="text-az-orange">Mart</span>
            </span>
            <span className="hidden sm:block text-[10px] text-slate-300 font-medium -mt-1">Uganda's Marketplace</span>
          </button>

          {/* Deliver to — desktop only */}
          <div className="relative hidden lg:block flex-shrink-0">
            <button
              onClick={() => { closeAllDropdowns(); setIsLocationOpen(!isLocationOpen); }}
              className="flex flex-col items-start justify-center px-2 py-1 border border-transparent hover:border-white rounded-xs cursor-pointer text-left"
            >
              <span className="text-[11px] text-slate-300 leading-none">Deliver to</span>
              <span className="flex items-center gap-1 text-xs font-bold text-white leading-tight mt-0.5">
                <MapPin size={13} />
                <span className="max-w-[110px] truncate">{selectedLocation}</span>
                <ChevronDown size={11} />
              </span>
            </button>

            {isLocationOpen && (
              <div className="absolute left-0 mt-1 w-64 bg-white border border-slate-200 rounded shadow-xl z-50 max-h-72 overflow-y-auto py-1 text-slate-800">
                <div className="p-2.5 border-b border-slate-100 bg-slate-50 sticky top-0">
                  <p className="font-bold text-slate-800 text-sm">Choose your delivery district</p>
                </div>
                {UGANDA_DISTRICTS.map((district) => (
                  <button
                    key={district}
                    onClick={() => {
                      setSelectedLocation(district);
                      setIsLocationOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 hover:bg-slate-50 text-sm transition-colors ${
                      selectedLocation === district ? 'text-az-link font-bold' : 'text-slate-700'
                    }`}
                  >
                    {district}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Search bar */}
          <div ref={searchRef} className="flex-1 min-w-0 flex items-center relative" id="header-search-container">
            <div className="flex w-full rounded overflow-hidden bg-white relative">
              {/* Category selector */}
              <div className="hidden md:block relative border-r border-slate-300">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-slate-100 text-slate-700 text-xs font-medium h-full px-2.5 pr-7 focus:outline-none cursor-pointer appearance-none"
                  style={{ backgroundImage: 'url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23475569\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpath d=\'m6 9 6 6 6-6\'/%3E%3C/svg%3E")', backgroundPosition: 'right 6px center', backgroundSize: '12px', backgroundRepeat: 'no-repeat' }}
                >
                  <option value="all">All Departments</option>
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Input */}
              <div className="flex-1 relative min-w-0">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder="Search OliMart"
                  className="w-full py-2 pl-3 pr-10 bg-white focus:outline-none text-sm text-slate-800 placeholder-slate-400"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setShowSuggestions(false);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded uppercase font-bold"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Search button */}
              <button className="bg-az-orange hover:bg-az-orange-hover text-az-navy px-4 sm:px-5 font-bold transition-colors flex items-center justify-center cursor-pointer flex-shrink-0">
                <Search size={18} strokeWidth={2.5} />
              </button>
            </div>

            {/* Live Search Suggestions Dropdown */}
            {showSuggestions && trimmedQuery && (
              <div
                className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded shadow-2xl z-50 p-3 max-h-[400px] overflow-y-auto text-slate-800"
                id="search-suggestions-dropdown"
              >
                {suggestedCategories.length === 0 && suggestedProducts.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400 font-semibold">
                    <p className="font-bold mb-1 text-slate-600">No direct matches found</p>
                    <p className="text-[10px]">Press Enter or click search to browse all matching items.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {suggestedCategories.length > 0 && (
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-1.5">
                          Matched Categories
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
                              className="w-full text-left px-2 py-2 rounded text-sm font-semibold hover:bg-slate-50 text-slate-700 flex items-center justify-between group transition-colors"
                            >
                              <span className="flex items-center gap-2">
                                <span className="text-az-link">{getCategoryIcon(cat.id)}</span>
                                <span>{cat.name}</span>
                              </span>
                              <span className="text-[9px] bg-slate-100 text-az-link px-2 py-0.5 rounded uppercase font-bold opacity-0 group-hover:opacity-100 transition-all">
                                Go to Department
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {suggestedCategories.length > 0 && suggestedProducts.length > 0 && (
                      <div className="h-px bg-slate-100" />
                    )}

                    {suggestedProducts.length > 0 && (
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-1.5 flex items-center justify-between">
                          <span>Suggested Products</span>
                          <span className="text-[9px] text-az-link lowercase font-bold">matching "{searchQuery}"</span>
                        </div>
                        <div className="space-y-1">
                          {suggestedProducts.map((p) => (
                            <div
                              key={p.id}
                              onClick={() => {
                                onProductClick(p);
                                setShowSuggestions(false);
                              }}
                              className="w-full text-left p-2 rounded hover:bg-slate-50 border border-transparent hover:border-slate-100 flex gap-3 items-center cursor-pointer transition-all group"
                            >
                              <div className="w-10 h-10 bg-white rounded p-1 flex items-center justify-center overflow-hidden border border-slate-100 flex-shrink-0">
                                <img src={p.image} alt={p.title} className="max-h-full max-w-full object-contain" referrerPolicy="no-referrer" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-1.5">
                                  <p className="font-semibold text-slate-800 text-xs truncate group-hover:text-az-link transition-colors">
                                    {p.title}
                                  </p>
                                  <span className="text-[11px] text-az-price font-bold flex-shrink-0">
                                    {formatPrice(p.price)}
                                  </span>
                                </div>
                                <p className="text-[9px] text-slate-400 font-semibold uppercase mt-0.5 flex items-center gap-1">
                                  <span className="text-slate-500">{p.brand}</span>
                                  <span>&bull;</span>
                                  <span className="text-trust-rating">★ {p.rating}</span>
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

          {/* Right-side utility clusters — desktop */}
          <div className="hidden lg:flex items-center gap-0.5 flex-shrink-0">
            {/* Language */}
            <div className="relative">
              <button
                onClick={() => { closeAllDropdowns(); setIsLanguageOpen(!isLanguageOpen); }}
                className="flex items-center gap-1 px-2 py-1.5 border border-transparent hover:border-white rounded-xs cursor-pointer text-xs font-bold"
              >
                <Globe size={15} />
                <span>{language}</span>
                <ChevronDown size={10} />
              </button>
              {isLanguageOpen && (
                <div className="absolute right-0 mt-1 w-36 bg-white border border-slate-200 rounded shadow-xl z-50 py-1 text-slate-800 text-xs">
                  {[
                    { code: 'EN', name: 'English' },
                    { code: 'LG', name: 'Luganda' },
                    { code: 'SW', name: 'Swahili' },
                    { code: 'FR', name: 'French' }
                  ].map(lang => (
                    <button
                      key={lang.code}
                      onClick={() => { setLanguage(lang.code); setIsLanguageOpen(false); }}
                      className={`w-full text-left px-3 py-1.5 hover:bg-slate-50 font-medium transition-colors ${language === lang.code ? 'text-az-link font-bold' : 'text-slate-700'}`}
                    >
                      {lang.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Currency */}
            <div className="relative">
              <button
                onClick={() => { closeAllDropdowns(); setIsCurrencyOpen(!isCurrencyOpen); }}
                className="flex items-center gap-1 px-2 py-1.5 border border-transparent hover:border-white rounded-xs cursor-pointer text-xs font-bold"
              >
                <Percent size={13} />
                <span>{currency}</span>
                <ChevronDown size={10} />
              </button>
              {isCurrencyOpen && (
                <div className="absolute right-0 mt-1 w-32 bg-white border border-slate-200 rounded shadow-xl z-50 py-1 text-slate-800 text-xs">
                  {[
                    { code: 'UGX', label: 'UGX (Shs)' },
                    { code: 'USD', label: 'USD ($)' },
                    { code: 'EUR', label: 'EUR (€)' },
                    { code: 'KES', label: 'KES (KSh)' }
                  ].map(curr => (
                    <button
                      key={curr.code}
                      onClick={() => { setCurrency(curr.code); setIsCurrencyOpen(false); }}
                      className={`w-full text-left px-3 py-1.5 hover:bg-slate-50 font-medium transition-colors ${currency === curr.code ? 'text-az-link font-bold' : 'text-slate-700'}`}
                    >
                      {curr.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Account & Lists */}
            <div className="relative" ref={accountRef}>
              <button
                onClick={() => { closeAllDropdowns(); setIsAccountOpen(!isAccountOpen); }}
                className="flex flex-col items-start justify-center px-2 py-1 border border-transparent hover:border-white rounded-xs cursor-pointer text-left"
              >
                <span className="text-[11px] text-slate-300 leading-none">Hello, sign in</span>
                <span className="flex items-center gap-1 text-xs font-bold text-white leading-tight mt-0.5">
                  <span>Account &amp; Lists</span>
                  <ChevronDown size={11} />
                </span>
              </button>

              {isAccountOpen && (
                <div className="absolute right-0 mt-1 w-64 bg-white border border-slate-200 rounded shadow-xl py-3 px-4 z-50 text-slate-800">
                  <button
                    onClick={() => { onAccountClick(); setIsAccountOpen(false); }}
                    className="w-full bg-az-yellow hover:bg-amber-400 text-az-navy py-2 rounded text-xs font-bold text-center block mb-3 transition-all"
                  >
                    Sign In
                  </button>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1.5">
                      <p className="font-bold text-slate-500 uppercase text-[10px] tracking-wide">Your Account</p>
                      <button onClick={onAccountClick} className="block hover:text-az-link hover:underline text-left">Profile & Settings</button>
                      <button onClick={onAccountClick} className="block hover:text-az-link hover:underline text-left">Orders & Returns</button>
                    </div>
                    <div className="space-y-1.5">
                      <p className="font-bold text-slate-500 uppercase text-[10px] tracking-wide">Your Lists</p>
                      <button
                        onClick={() => { setSelectedCategory('all'); setSelectedSpecialTab('flash-sales'); }}
                        className="flex items-center gap-1 hover:text-az-link hover:underline text-left"
                      >
                        <Heart size={11} className={watchlist.length > 0 ? 'fill-red-500 text-red-500' : ''} />
                        <span>Watchlist ({watchlist.length})</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Returns & Orders */}
            <button
              onClick={onAccountClick}
              className="flex flex-col items-start justify-center px-2 py-1 border border-transparent hover:border-white rounded-xs cursor-pointer text-left"
            >
              <span className="text-[11px] text-slate-300 leading-none">Returns</span>
              <span className="text-xs font-bold text-white leading-tight mt-0.5">&amp; Orders</span>
            </button>

            {/* Cart */}
            <button
              onClick={onCartClick}
              className="flex items-end gap-1 px-2 py-1.5 border border-transparent hover:border-white rounded-xs cursor-pointer relative"
            >
              <span className="relative">
                <ShoppingCart size={26} />
                <span className="absolute -top-1.5 left-3.5 bg-az-orange text-az-navy font-bold text-[11px] w-5 h-5 rounded-full flex items-center justify-center">
                  {cartItemsCount > 99 ? '99+' : cartItemsCount}
                </span>
              </span>
              <span className="text-xs font-bold hidden xl:inline">Cart</span>
            </button>
          </div>

          {/* Mobile: cart + account only */}
          <div className="flex lg:hidden items-center gap-1 flex-shrink-0">
            <button onClick={onAccountClick} className="p-1.5 text-white cursor-pointer" aria-label="Account">
              <User size={20} />
            </button>
            <button onClick={onCartClick} className="relative p-1.5 text-white cursor-pointer" aria-label="Cart">
              <ShoppingCart size={22} />
              {cartItemsCount > 0 && (
                <span className="absolute -top-0.5 right-0 bg-az-orange text-az-navy font-bold text-[10px] w-4.5 h-4.5 min-w-[18px] px-0.5 rounded-full flex items-center justify-center">
                  {cartItemsCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ============ TIER 2: Secondary navy-light bar — department nav ============ */}
      <nav className="bg-az-navy-light text-white hidden lg:block">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between text-xs font-semibold">
          <div className="flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="py-2 px-3 flex items-center gap-1.5 hover:bg-az-navy-hover transition-colors cursor-pointer border border-transparent hover:border-white"
            >
              <Menu size={15} />
              <span>All Departments</span>
            </button>

            <button
              onClick={() => { setSelectedSpecialTab('todays-deal'); setSelectedCategory('all'); }}
              className={`py-2 px-3 transition-colors cursor-pointer border border-transparent hover:border-white ${selectedSpecialTab === 'todays-deal' ? 'text-az-orange' : 'hover:bg-az-navy-hover'}`}
            >
              Today's Deals
            </button>

            <button
              onClick={() => { setSelectedSpecialTab('flash-sales'); setSelectedCategory('all'); }}
              className={`py-2 px-3 transition-colors cursor-pointer border border-transparent hover:border-white flex items-center gap-1 ${selectedSpecialTab === 'flash-sales' ? 'text-az-orange' : 'hover:bg-az-navy-hover'}`}
            >
              <Zap size={12} />
              <span>Flash Sales</span>
            </button>

            <button
              onClick={() => { setSelectedSpecialTab('discount'); setSelectedCategory('all'); }}
              className={`py-2 px-3 transition-colors cursor-pointer border border-transparent hover:border-white ${selectedSpecialTab === 'discount' ? 'text-az-orange' : 'hover:bg-az-navy-hover'}`}
            >
              Super Savings
            </button>

            {CATEGORIES.slice(0, 4).map((cat) => (
              <button
                key={cat.id}
                onClick={() => { setSelectedCategory(cat.id); setSelectedSpecialTab('all'); }}
                className={`py-2 px-3 transition-colors cursor-pointer border border-transparent hover:border-white ${selectedCategory === cat.id && selectedSpecialTab === 'all' ? 'text-az-orange' : 'hover:bg-az-navy-hover'}`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onAccountClick}
              className="py-2 px-3 hover:bg-az-navy-hover transition-colors cursor-pointer border border-transparent hover:border-white"
            >
              Sell on OliMart
            </button>
            <button
              onClick={onAccountClick}
              className="py-2 px-3 hover:bg-az-navy-hover transition-colors cursor-pointer border border-transparent hover:border-white flex items-center gap-1"
            >
              <HelpCircle size={12} />
              <span>Help</span>
            </button>
          </div>
        </div>
      </nav>

      {/* ============ MOBILE SLIDE-OUT DRAWER ============ */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex" id="mobile-menu-overlay">
          <div
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-slate-950/60 transition-opacity duration-300"
          />

          <div className="relative flex flex-col w-[300px] max-w-[85vw] h-full bg-white shadow-2xl z-10 animate-slide-right overflow-y-auto text-slate-800 flex-shrink-0">
            {/* Drawer Header */}
            <div className="bg-az-navy text-white p-4 space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <User size={22} />
                  <span className="text-sm font-bold">Hello, sign in</span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="text-white p-1 cursor-pointer" aria-label="Close menu">
                  <X size={18} />
                </button>
              </div>
              <button
                onClick={() => { onAccountClick(); setIsMobileMenuOpen(false); }}
                className="w-full bg-az-yellow hover:bg-amber-400 text-az-navy py-2 rounded text-xs font-bold uppercase tracking-wide text-center transition-all"
              >
                Sign In / Create Account
              </button>
            </div>

            {/* Drawer Content */}
            <div className="p-4 space-y-4 flex-1">
              <div className="space-y-1.5">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-1">Trending</p>
                <div className="space-y-0.5">
                  <button
                    onClick={() => { setSelectedSpecialTab('todays-deal'); setSelectedCategory('all'); setIsMobileMenuOpen(false); }}
                    className={`w-full text-left px-2.5 py-2 rounded text-sm font-semibold flex items-center gap-2.5 ${selectedSpecialTab === 'todays-deal' ? 'bg-slate-100 text-az-link' : 'text-slate-700 hover:bg-slate-50'}`}
                  >
                    <Sparkles size={15} className="text-az-orange" />
                    <span>Today's Deal</span>
                  </button>
                  <button
                    onClick={() => { setSelectedSpecialTab('flash-sales'); setSelectedCategory('all'); setIsMobileMenuOpen(false); }}
                    className={`w-full text-left px-2.5 py-2 rounded text-sm font-semibold flex items-center gap-2.5 ${selectedSpecialTab === 'flash-sales' ? 'bg-slate-100 text-az-link' : 'text-slate-700 hover:bg-slate-50'}`}
                  >
                    <Zap size={15} className="text-az-orange" />
                    <span>Flash Sales</span>
                  </button>
                  <button
                    onClick={() => { setSelectedSpecialTab('discount'); setSelectedCategory('all'); setIsMobileMenuOpen(false); }}
                    className={`w-full text-left px-2.5 py-2 rounded text-sm font-semibold flex items-center gap-2.5 ${selectedSpecialTab === 'discount' ? 'bg-slate-100 text-az-link' : 'text-slate-700 hover:bg-slate-50'}`}
                  >
                    <Percent size={15} className="text-emerald-600" />
                    <span>Super Savings</span>
                  </button>
                </div>
              </div>

              <div className="h-px bg-slate-100" />

              <div className="space-y-1.5">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-1">Shop by Department</p>
                <div className="space-y-0.5">
                  <button
                    onClick={() => { setSelectedCategory('all'); setSelectedSpecialTab('all'); setIsMobileMenuOpen(false); }}
                    className={`w-full text-left px-2.5 py-2 rounded text-sm font-semibold flex items-center gap-2.5 ${selectedCategory === 'all' && selectedSpecialTab === 'all' ? 'bg-slate-100 text-az-link' : 'text-slate-700 hover:bg-slate-50'}`}
                  >
                    <Menu size={15} className="text-slate-400" />
                    <span>All Products</span>
                  </button>
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => { setSelectedCategory(cat.id); setSelectedSpecialTab('all'); setIsMobileMenuOpen(false); }}
                      className={`w-full text-left px-2.5 py-2 rounded text-sm font-semibold flex items-center gap-2.5 ${selectedCategory === cat.id && selectedSpecialTab === 'all' ? 'bg-slate-100 text-az-link' : 'text-slate-700 hover:bg-slate-50'}`}
                    >
                      <span className="text-slate-400">{getCategoryIcon(cat.id, 15)}</span>
                      <span>{cat.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-px bg-slate-100" />

              <div className="space-y-2">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-1">Settings</p>
                <button
                  onClick={() => { setIsLocationOpen(true); setIsMobileMenuOpen(false); }}
                  className="w-full text-left px-2.5 py-2 text-slate-700 font-semibold text-sm flex items-center gap-2.5 hover:bg-slate-50 rounded"
                >
                  <MapPin size={15} className="text-az-orange" />
                  <span>Deliver to: {selectedLocation}</span>
                </button>

                <button
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className="w-full text-left px-2.5 py-2 text-slate-700 font-semibold text-sm flex items-center gap-2.5 hover:bg-slate-50 rounded"
                >
                  {isDarkMode ? <Sun size={15} className="text-yellow-500" /> : <Moon size={15} className="text-slate-400" />}
                  <span>Theme: {isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
                </button>

                <div className="px-2.5 py-1 text-xs">
                  <p className="text-[10px] font-bold text-slate-400 mb-1">Currency</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {['UGX', 'USD', 'EUR', 'KES'].map(curr => (
                      <button
                        key={curr}
                        onClick={() => setCurrency(curr)}
                        className={`px-2 py-1 rounded text-[10px] font-bold ${currency === curr ? 'bg-az-orange text-white' : 'bg-slate-100 text-slate-700'}`}
                      >
                        {curr}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="px-2.5 py-1 text-xs">
                  <p className="text-[10px] font-bold text-slate-400 mb-1">Language</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {[
                      { code: 'EN', name: 'EN' },
                      { code: 'LG', name: 'LG' },
                      { code: 'SW', name: 'SW' },
                      { code: 'FR', name: 'FR' }
                    ].map(lang => (
                      <button
                        key={lang.code}
                        onClick={() => setLanguage(lang.code)}
                        className={`px-2 py-1 rounded text-[10px] font-bold ${language === lang.code ? 'bg-az-orange text-white' : 'bg-slate-100 text-slate-700'}`}
                      >
                        {lang.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 text-center space-y-1">
              <p className="text-[10px] font-bold text-slate-400">OLIMART UGANDA MARKETPLACE</p>
              <p className="text-[9px] text-slate-400">MoMo Cash On Delivery Secured</p>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
