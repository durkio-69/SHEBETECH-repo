import React, { useState } from 'react';
import { 
  X, 
  User, 
  Mail, 
  Lock, 
  CreditCard, 
  Package, 
  Gift, 
  LogOut, 
  CheckCircle, 
  Sparkles, 
  TrendingUp, 
  Truck, 
  AlertCircle,
  PhoneCall,
  Laptop,
  Briefcase,
  MapPin,
  Key
} from 'lucide-react';
import { PRODUCTS } from '../data';
import { Product } from '../types';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string) => void;
  currency: string;
  onAddToCart: (p: Product, q?: number) => void;
  activeApp?: 'customer' | 'vendor' | 'delivery' | 'admin';
  setActiveApp?: (val: 'customer' | 'vendor' | 'delivery' | 'admin') => void;
}

export default function AccountModal({ 
  isOpen, 
  onClose, 
  onShowToast, 
  currency, 
  onAddToCart,
  activeApp = 'customer',
  setActiveApp
}: AccountModalProps) {
  // Authentication tab
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'orders' | 'wallet'>('login');
  
  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // Current user mock data
  const [currentUser, setCurrentUser] = useState({
    name: 'Ivan Okello',
    email: 'ivan.okello@gmail.com',
    phone: '+256 772 123456',
    district: 'Kampala (Central)',
    balance: 85000,
    orders: [
      { id: 'OM-9482', date: '2026-06-25', total: 318000, status: 'Delivered', item: 'Samsung Galaxy A06 4G LTE' },
      { id: 'OM-8392', date: '2026-06-29', total: 129900, status: 'In Transit', item: 'Stabex Gas Full Set - 6 KG' },
    ]
  });

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      onShowToast("Please enter your email and password.");
      return;
    }
    setIsLoggedIn(true);
    setCurrentUser(prev => ({
      ...prev,
      name: name || 'Ivan Okello',
      email: email,
    }));
    onShowToast("Welcome back! Signed in successfully.");
    setActiveTab('orders');
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !phone) {
      onShowToast("Please fill in all details.");
      return;
    }
    setIsLoggedIn(true);
    setCurrentUser({
      name,
      email,
      phone,
      district: 'Kampala (Central)',
      balance: 15000, // Gift registration bonus!
      orders: []
    });
    onShowToast("Account registered! Enjoy Shs 15,000 sign-up bonus.");
    setActiveTab('orders');
  };

  const handleLogOut = () => {
    setIsLoggedIn(false);
    setEmail('');
    setPassword('');
    setName('');
    setPhone('');
    onShowToast("Logged out of your OliMart account.");
    setActiveTab('login');
  };

  const formatPrice = (priceInUgx: number | undefined | null) => {
    const val = typeof priceInUgx === 'number' && !isNaN(priceInUgx) ? priceInUgx : 0;
    if (currency === 'USD') {
      return `$${(val / 3700).toFixed(2)}`;
    } else if (currency === 'EUR') {
      return `€${(val / 4000).toFixed(2)}`;
    } else if (currency === 'KES') {
      return `KSh ${Math.round(val / 28).toLocaleString()}`;
    } else {
      return `Shs ${val.toLocaleString()}`;
    }
  };

  const handleReorder = (itemName: string, price: number) => {
    const foundProduct = PRODUCTS.find(p => 
      p.title.toLowerCase().includes(itemName.toLowerCase()) || 
      itemName.toLowerCase().includes(p.title.toLowerCase())
    );

    if (foundProduct) {
      onAddToCart(foundProduct, 1);
      onShowToast(`Re-ordered "${(foundProduct.title || '').split(' - ')[0]}"! Added to cart.`);
    } else {
      const fallbackProduct: Product = {
        id: `reorder-${Date.now()}`,
        title: itemName,
        price: price,
        category: 'electronics',
        image: 'https://picsum.photos/seed/reorder/400/400',
        rating: 4.8,
        reviewsCount: 120,
        brand: 'Genuine Partner',
        isFlashSale: false,
        isOfficial: true,
        freeDelivery: true,
        payOnDelivery: true,
        inStock: true
      };
      onAddToCart(fallbackProduct, 1);
      onShowToast(`Re-ordered "${itemName}"! Added to cart.`);
    }
  };

  const getStatusStep = (status: string) => {
    switch (status) {
      case 'Order Placed': return 0;
      case 'Processing': return 1;
      case 'In Transit': return 2;
      case 'Delivered': return 3;
      default: return 2; // default to step 2 for other active statuses
    }
  };

  const stagesList = [
    { label: 'Placed', icon: CheckCircle, fullLabel: 'Order Placed' },
    { label: 'Processing', icon: Sparkles, fullLabel: 'Processing' },
    { label: 'In Transit', icon: Truck, fullLabel: 'In Transit' },
    { label: 'Delivered', icon: Package, fullLabel: 'Delivered' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Banner Top accent */}
        <div className="bg-gradient-to-r from-[#f68b1e] to-red-600 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <User size={18} className="text-white fill-white" />
            <span className="font-black uppercase tracking-wider text-xs">
              {isLoggedIn ? `OliMart VIP Profile` : `OliMart Uganda Secure Gateway`}
            </span>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-full bg-black/20 hover:bg-black/40 transition-colors text-white cursor-pointer"
            title="Close modal"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Main Content Box */}
        <div className="p-6">
          
          {/* LOGGED IN USER VIEW */}
          {isLoggedIn ? (
            <div className="space-y-6">
              {/* Profile Card Header */}
              <div className="bg-slate-50 dark:bg-slate-950/40 rounded-2xl p-4 flex items-center justify-between border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-amber-100 dark:bg-amber-950 text-trust-price font-black text-lg rounded-full flex items-center justify-center border border-amber-200 shadow-inner">
                    {currentUser.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-trust-text-primary dark:text-slate-100 flex items-center gap-1.5">
                      {currentUser.name}
                      <span className="bg-trust-cta text-trust-text-primary text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-widest">VIP Member</span>
                    </h3>
                    <p className="text-xs text-trust-text-secondary font-medium">{currentUser.email}</p>
                    <p className="text-[10px] text-slate-500 font-bold">{currentUser.phone} | {currentUser.district}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogOut}
                  className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-600 transition-colors cursor-pointer"
                  title="Sign out"
                >
                  <LogOut size={16} />
                </button>
              </div>

              {/* Active Workspace / Role Switcher Inside Account Modal (as requested by user) */}
              <div className="bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-[11px] font-black uppercase tracking-wider text-trust-text-secondary dark:text-slate-400">
                    Switch Active Workspace Portal
                  </h4>
                  <span className="text-[9px] bg-emerald-100 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-widest animate-pulse">
                    Secure Switch
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'customer', label: 'Customer App', desc: 'Kampala Storefront', icon: <Laptop size={14} className="text-trust-link" /> },
                    { id: 'vendor', label: 'Vendor Portal', desc: 'Dokan Seller Pro', icon: <Briefcase size={14} className="text-orange-500" /> },
                    { id: 'delivery', label: 'Boda Dispatch', desc: 'Rider & Courier', icon: <MapPin size={14} className="text-zinc-600" /> },
                    { id: 'admin', label: 'Super Admin', desc: 'Console Moderation', icon: <Key size={14} className="text-red-500" /> },
                  ].map((role) => {
                    const isSelected = activeApp === role.id;
                    return (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => {
                          if (setActiveApp) {
                            setActiveApp(role.id as any);
                            onShowToast(`Workspace switched to ${role.label}!`);
                          }
                        }}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2 ${
                          isSelected
                            ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-900/40 shadow-xs ring-1 ring-amber-300'
                            : 'bg-white dark:bg-slate-900 border-slate-150 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        <div className="mt-0.5">{role.icon}</div>
                        <div>
                          <p className={`text-xs font-black uppercase tracking-wide ${
                            isSelected ? 'text-trust-text-primary dark:text-white font-extrabold' : 'text-slate-700 dark:text-slate-300'
                          }`}>
                            {role.label}
                          </p>
                          <p className="text-[9px] text-trust-text-secondary dark:text-slate-500 font-medium">
                            {role.desc}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Navigation Tabs for Account View */}
              <div className="flex border-b border-slate-100 dark:border-slate-800 pb-1">
                {[
                  { id: 'orders', label: 'My Orders', icon: <Package size={14} /> },
                  { id: 'wallet', label: 'MoMo Wallet', icon: <CreditCard size={14} /> }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-1 py-2 font-black text-xs uppercase tracking-wider border-b-2 flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                      activeTab === tab.id
                        ? 'border-[#f68b1e] text-[#f68b1e]'
                        : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                    }`}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* TAB CONTENT: MY ORDERS */}
              {activeTab === 'orders' && (
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {currentUser.orders.length === 0 ? (
                    <div className="text-center py-8 bg-slate-50 dark:bg-slate-950/20 rounded-2xl">
                      <Package size={32} className="mx-auto text-slate-300 mb-2" />
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No recent orders yet</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Start exploring our incredible products!</p>
                    </div>
                  ) : (
                    currentUser.orders.map((ord) => (
                      <div 
                        key={ord.id}
                        className="p-3 border border-slate-100 dark:border-slate-800 rounded-xl hover:border-[#f68b1e]/30 transition-all bg-slate-50/50 dark:bg-slate-950/10 space-y-2.5"
                      >
                        <div className="flex justify-between items-center text-[11px] font-bold">
                          <span className="text-slate-400">Order ID: <strong className="text-slate-800 dark:text-slate-100 font-extrabold">{ord.id}</strong></span>
                          <span className="text-slate-400">{ord.date}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-xs font-black text-slate-800 dark:text-slate-200 line-clamp-1">{ord.item}</p>
                            <p className="text-xs font-black text-red-600">{formatPrice(ord.total)}</p>
                          </div>
                          <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            ord.status === 'Delivered' 
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' 
                              : 'bg-yellow-50 text-yellow-600 border border-yellow-200 animate-pulse'
                          }`}>
                            {ord.status}
                          </span>
                        </div>

                        {/* Elegant Visual Progress Tracker Timeline Component */}
                        <div className="py-2.5 px-1 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-800/80">
                          <div className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1 mb-2">
                            Order Journey Timeline
                          </div>
                          <div className="flex items-center justify-between relative px-2">
                            {/* Inactive Line track */}
                            <div className="absolute left-[30px] right-[30px] top-[14px] h-[3px] bg-slate-200 dark:bg-slate-800 -z-0" />
                            
                            {/* Active Line track */}
                            <div 
                              className="absolute left-[30px] top-[14px] h-[3px] bg-[#f68b1e] transition-all duration-500 -z-0" 
                              style={{ 
                                width: `${(getStatusStep(ord.status) / 3) * 82}%` 
                              }} 
                            />
                            
                            {stagesList.map((stage, idx) => {
                              const activeStep = getStatusStep(ord.status);
                              const isCompleted = idx <= activeStep;
                              const isCurrent = idx === activeStep;
                              const Icon = stage.icon;
                              
                              return (
                                <div key={stage.label} className="flex flex-col items-center flex-1 relative z-10">
                                  <div 
                                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                                      isCompleted 
                                        ? 'bg-[#f68b1e] text-white shadow-xs' 
                                        : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                                    } ${isCurrent ? 'ring-4 ring-orange-100 dark:ring-orange-950/40 scale-105' : ''}`}
                                    title={stage.fullLabel}
                                  >
                                    <Icon size={12} className={isCurrent ? 'animate-pulse' : ''} />
                                  </div>
                                  <span className={`text-[8px] font-black tracking-tight mt-1.5 transition-colors ${
                                    isCurrent 
                                      ? 'text-[#f68b1e]' 
                                      : isCompleted 
                                        ? 'text-slate-800 dark:text-slate-200' 
                                        : 'text-slate-400 dark:text-slate-500'
                                  }`}>
                                    {stage.label}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        
                        {ord.status === 'In Transit' && (
                          <div className="flex items-center gap-1.5 bg-[#f68b1e]/10 p-2 rounded-lg border border-[#f68b1e]/20 text-[10px] text-slate-700 dark:text-slate-300 font-medium">
                            <Truck size={12} className="text-[#f68b1e]" />
                            <span>Dispatch Note: Currently cleared Kampala, arriving district shortly.</span>
                          </div>
                        )}

                        <div className="flex justify-between items-center pt-2.5 border-t border-slate-100 dark:border-slate-800/80">
                          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1">
                            <CheckCircle size={11} className="text-emerald-500" />
                            Ready to ship
                          </span>
                          <button
                            onClick={() => {
                              handleReorder(ord.item, ord.total);
                              onClose();
                            }}
                            className="bg-[#f68b1e] hover:bg-[#e07510] text-white text-[10px] font-black uppercase px-3 py-1.5 rounded-lg shadow-xs transition-all active:scale-95 cursor-pointer"
                          >
                            Re-order Item
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB CONTENT: MOMO WALLET */}
              {activeTab === 'wallet' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-yellow-400/10 border border-yellow-400 text-slate-900 dark:text-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-black text-amber-700 uppercase tracking-wider block">OliMart wallet balance</span>
                      <span className="text-xl font-black text-[#f68b1e]">{formatPrice(currentUser.balance)}</span>
                    </div>
                    <div className="bg-yellow-400 text-slate-950 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                      MTN MoMo Active
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs font-black text-slate-800 dark:text-slate-300 uppercase tracking-wider">Exclusive Coupons & Offers</h4>
                    <div className="p-3 bg-red-50 dark:bg-slate-950/20 border border-red-100 dark:border-red-950 rounded-xl flex items-center gap-3">
                      <Gift size={24} className="text-red-500 flex-shrink-0" />
                      <div className="text-xs">
                        <p className="font-extrabold text-red-700 dark:text-red-400">Coupon Code: <span className="font-mono bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-red-100 text-slate-800 font-black">KAMPALAMOMO</span></p>
                        <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Applies Shs 15,000 instant saving when you complete payment via MTN Mobile Money!</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Prompt Help */}
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950/20 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-500 font-semibold">
                <AlertCircle size={14} className="text-[#f68b1e]" />
                <span>Need assistance? Call toll-free <strong>0200 804 020</strong> to chat with Kampala customer care.</span>
              </div>
            </div>
          ) : (
                        /* ANONYMOUS GUEST VIEW (LOGIN & REGISTER TABS) */
            <div className="space-y-4">
              <div className="flex border-b border-slate-100 dark:border-slate-800 pb-1">
                <button
                  onClick={() => setActiveTab('login')}
                  className={`flex-1 py-2 font-black text-xs uppercase tracking-wider border-b-2 text-center cursor-pointer transition-colors ${
                    activeTab === 'login'
                      ? 'border-trust-cta text-trust-text-primary dark:text-amber-400'
                      : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                  }`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => setActiveTab('register')}
                  className={`flex-1 py-2 font-black text-xs uppercase tracking-wider border-b-2 text-center cursor-pointer transition-colors ${
                    activeTab === 'register'
                      ? 'border-trust-cta text-trust-text-primary dark:text-amber-400'
                      : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                  }`}
                >
                  New Account
                </button>
              </div>

              {/* FORM: LOGIN */}
              {activeTab === 'login' && (
                <form onSubmit={handleLogin} className="space-y-4 pt-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                      <input 
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="ivan.okello@gmail.com"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                      <input 
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                        required
                      />
                    </div>
                  </div>

                  {/* PORTAL ACCESS SELECTION ON LOGIN (As requested by user) */}
                  <div className="space-y-1.5 pt-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-trust-text-secondary dark:text-slate-400">
                      Choose Your Destination Workspace Portal
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'customer', label: 'Customer', desc: 'Shop & Checkout', icon: <Laptop size={12} className="text-trust-link" /> },
                        { id: 'vendor', label: 'Vendor Store', desc: 'Dokan Pro Seller', icon: <Briefcase size={12} className="text-orange-500" /> },
                        { id: 'delivery', label: 'Boda Dispatch', desc: 'Courier Rider', icon: <MapPin size={12} className="text-zinc-600" /> },
                        { id: 'admin', label: 'Super Admin', desc: 'Control Panel', icon: <Key size={12} className="text-red-500" /> },
                      ].map((role) => {
                        const isSelected = activeApp === role.id;
                        return (
                          <button
                            key={role.id}
                            type="button"
                            onClick={() => {
                              if (setActiveApp) setActiveApp(role.id as any);
                            }}
                            className={`p-2 rounded-xl border text-left transition-all flex items-start gap-1.5 cursor-pointer ${
                              isSelected
                                ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-900/40 text-[#111111] dark:text-white font-extrabold ring-1 ring-amber-300'
                                : 'bg-slate-50/50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                          >
                            <div className="mt-0.5">{role.icon}</div>
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-wider">{role.label}</p>
                              <p className="text-[8px] text-slate-400 dark:text-slate-500 font-medium leading-tight">{role.desc}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input type="checkbox" className="rounded text-amber-500 focus:ring-0" defaultChecked />
                      <span>Remember Me</span>
                    </label>
                    <button 
                      type="button" 
                      onClick={() => onShowToast("Reset password instruction sent to email!")}
                      className="hover:text-trust-link hover:underline text-[10px]"
                    >
                      Forgot Password?
                    </button>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-trust-cta hover:bg-trust-cta-hover text-trust-text-primary py-3 rounded-xl font-black text-xs transition-all uppercase tracking-wider shadow-md hover:scale-101 active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle size={14} />
                    <span>Sign In Securely</span>
                  </button>
                </form>
              )}

              {/* FORM: REGISTER */}
              {activeTab === 'register' && (
                <form onSubmit={handleRegister} className="space-y-3.5 pt-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                      <input 
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ivan Okello"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                      <input 
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="ivan.okello@gmail.com"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">WhatsApp / Phone Number</label>
                    <div className="relative">
                      <PhoneCall className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                      <input 
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+256 772 123456"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                      <input 
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Create strong password"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                        required
                      />
                    </div>
                  </div>

                  {/* PORTAL ACCESS SELECTION ON SIGN UP (As requested by user) */}
                  <div className="space-y-1.5 pt-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-trust-text-secondary dark:text-slate-400">
                      Choose Your Destination Workspace Portal
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'customer', label: 'Customer', desc: 'Shop & Checkout', icon: <Laptop size={12} className="text-trust-link" /> },
                        { id: 'vendor', label: 'Vendor Store', desc: 'Dokan Pro Seller', icon: <Briefcase size={12} className="text-orange-500" /> },
                        { id: 'delivery', label: 'Boda Dispatch', desc: 'Courier Rider', icon: <MapPin size={12} className="text-zinc-600" /> },
                        { id: 'admin', label: 'Super Admin', desc: 'Control Panel', icon: <Key size={12} className="text-red-500" /> },
                      ].map((role) => {
                        const isSelected = activeApp === role.id;
                        return (
                          <button
                            key={role.id}
                            type="button"
                            onClick={() => {
                              if (setActiveApp) setActiveApp(role.id as any);
                            }}
                            className={`p-2 rounded-xl border text-left transition-all flex items-start gap-1.5 cursor-pointer ${
                              isSelected
                                ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-900/40 text-[#111111] dark:text-white font-extrabold ring-1 ring-amber-300'
                                : 'bg-slate-50/50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                          >
                            <div className="mt-0.5">{role.icon}</div>
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-wider">{role.label}</p>
                              <p className="text-[8px] text-slate-400 dark:text-slate-500 font-medium leading-tight">{role.desc}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-trust-cta hover:bg-trust-cta-hover text-trust-text-primary py-3 rounded-xl font-black text-xs transition-all uppercase tracking-wider shadow-md hover:scale-101 active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Sparkles size={14} />
                    <span>Register New Account</span>
                  </button>
                </form>
              )}

              {/* Trust disclaimer */}
              <div className="text-[9px] text-slate-400 text-center font-semibold border-t border-slate-100 dark:border-slate-800 pt-3">
                🔒 Protected by Jumia SafePay & End-to-End SSL encryption.
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
