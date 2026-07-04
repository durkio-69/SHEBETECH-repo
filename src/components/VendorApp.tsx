import React, { useState, useEffect } from 'react';
import { 
  getDokanVendors, 
  saveDokanVendors, 
  getDokanWithdrawals, 
  saveDokanWithdrawals, 
  getDokanOrders, 
  saveDokanOrders, 
  getDokanCategories, 
  getDokanRiders,
  saveDokanRiders,
  DokanVendor, 
  WithdrawalRequest,
  DokanOrder,
  DokanRider,
  getAdminSettings,
  isItemBulky
} from '../lib/dokanStore';
import { emitEventDrivenNotifications } from '../lib/notificationStore';
import { 
  Building2, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Plus, 
  CheckCircle, 
  Clock, 
  XCircle, 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  PlusCircle, 
  History, 
  Send, 
  Check, 
  X, 
  ListOrdered,
  PackageCheck,
  Tag,
  Store,
  ArrowUpRight
} from 'lucide-react';
import { Product } from '../types';

interface VendorAppProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  formatPrice: (priceInUgx: number) => string;
}

export default function VendorApp({ products, setProducts, formatPrice }: VendorAppProps) {
  const activeAdminSettings = getAdminSettings();
  // Current session vendor (we simulate vendor logs)
  const [currentVendor, setCurrentVendor] = useState<DokanVendor | null>(null);
  const [allVendors, setAllVendors] = useState<DokanVendor[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [orders, setOrders] = useState<DokanOrder[]>([]);
  const [riders, setRiders] = useState<DokanRider[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'orders' | 'wallet'>('dashboard');
  const [assigningRiderOrderId, setAssigningRiderOrderId] = useState<string | null>(null);

  // Registration states
  const [ownerName, setOwnerName] = useState('');
  const [storeName, setStoreName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('Kampala Central');
  const [businessCategory, setBusinessCategory] = useState('phones');
  const [paymentDetails, setPaymentDetails] = useState('');

  // Multi-option registration role selection states (Requirement 2)
  const [regRole, setRegRole] = useState<'vendor' | 'delivery' | 'customer'>('vendor');
  
  // Rider/Courier registration states
  const [riderName, setRiderName] = useState('');
  const [riderPhone, setRiderPhone] = useState('');
  const [riderEmail, setRiderEmail] = useState('');
  const [riderIdCard, setRiderIdCard] = useState('');
  const [riderDrivingPermit, setRiderDrivingPermit] = useState('');
  const [riderPictureUrl, setRiderPictureUrl] = useState('');
  const [riderLocation, setRiderLocation] = useState('Kampala Central');
  const [transportMeans, setTransportMeans] = useState<'boda' | 'bicycle' | 'van' | 'truck'>('boda');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [helmetOrHub, setHelmetOrHub] = useState('');
  const [cargoVolume, setCargoVolume] = useState('');
  const [licenseTonnage, setLicenseTonnage] = useState('');

  // Customer registration states
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [custDistrict, setCustDistrict] = useState('Kampala Central');

  // Add product states
  const [prodTitle, setProdTitle] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodCategory, setProdCategory] = useState('');
  const [prodBrand, setProdBrand] = useState('Tecno');
  const [prodImage, setProdImage] = useState('');
  const [prodTags, setProdTags] = useState('Best Seller, Verified');
  const [prodType, setProdType] = useState<'light' | 'bulky'>('light');

  // Withdrawal form states
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState<'paypal' | 'stripe' | 'mastercard' | 'bank' | 'momo'>('momo');
  const [withdrawDetails, setWithdrawDetails] = useState('');

  // Update product price and stock state
  const [editingProdId, setEditingProdId] = useState<string | null>(null);
  const [editingPrice, setEditingPrice] = useState('');
  const [editingStock, setEditingStock] = useState('');
  const [editingDemand, setEditingDemand] = useState<boolean>(true);
  const [stockFilter, setStockFilter] = useState<'all' | 'low'>('all');

  // New product stock states
  const [prodStockCount, setProdStockCount] = useState('15');
  const [prodIsTrending, setProdIsTrending] = useState<boolean>(true);

  // Hydrate Dokan States
  useEffect(() => {
    const vList = getDokanVendors();
    setAllVendors(vList);
    setWithdrawals(getDokanWithdrawals());
    setOrders(getDokanOrders());
    setRiders(getDokanRiders());

    // Try auto logging-in as the first approved vendor "Tecno Official Outlet Kampala"
    const autoLog = vList.find(v => v.id === 'v2');
    if (autoLog) {
      setCurrentVendor(autoLog);
    }
  }, []);

  // Listen to cross-storage modifications
  useEffect(() => {
    const handleStorageChange = () => {
      const vList = getDokanVendors();
      setAllVendors(vList);
      setWithdrawals(getDokanWithdrawals());
      setOrders(getDokanOrders());
      setRiders(getDokanRiders());
      
      if (currentVendor) {
        const refreshed = vList.find(v => v.id === currentVendor.id);
        if (refreshed) {
          setCurrentVendor(refreshed);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [currentVendor]);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (regRole === 'vendor') {
      if (!storeName || !ownerName || !email || !phone) return;
      // System automatically attaches a unique store ID like Dokan Pro (Requirement 2)
      const uniqueSystemId = `DKN-VND-${Math.floor(1000 + Math.random() * 9000)}`;
      const storeNameWithId = `${storeName} [${uniqueSystemId}]`;

      const newVendor: DokanVendor = {
        id: `v-${Date.now()}`,
        name: storeNameWithId,
        ownerName,
        email,
        phone,
        location,
        category: businessCategory,
        status: 'pending', // Temporary dashboard gating
        balance: 0,
        totalSales: 0,
        paymentDetails
      };

      const updated = [...allVendors, newVendor];
      saveDokanVendors(updated);
      setAllVendors(updated);
      setCurrentVendor(newVendor);
      alert(`🎉 Registration Successful!\nYour store was registered with Unique System ID: ${uniqueSystemId}\nStore Name: ${storeNameWithId}\nAwaiting admin onboarding approval.`);
    } 
    else if (regRole === 'delivery') {
      if (!riderName || !riderPhone || !riderIdCard) {
        alert("Please fill in your Full Name, Phone Number, and National ID Card — these fields are required.");
        return;
      }
      const uniqueRdrId = `DKN-RDR-${Math.floor(100 + Math.random() * 900)}`;
      const fullRiderName = `${riderName} [${uniqueRdrId}]`;
      
      const newRider: DokanRider = {
        id: `r-${Date.now()}`,
        name: fullRiderName,
        phone: riderPhone,
        email: riderEmail || `${riderName.toLowerCase().replace(/\s+/g, '')}@olimart-courier.ug`,
        idCard: riderIdCard,
        drivingPermit: riderDrivingPermit || 'PERMIT-PENDING',
        pictureUrl: riderPictureUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=60',
        motorcyclePlate: vehiclePlate || 'UPB 221X',
        location: riderLocation,
        completedDeliveries: 0,
        earnings: 0,
        transportMeans,
        helmetOrHub: helmetOrHub || 'HELMET-PENDING',
        cargoVolume: cargoVolume || undefined,
        licenseTonnage: licenseTonnage || undefined,
        status: 'pending' // Gated waiting for admin approval
      };

      const currentRiders = getDokanRiders();
      const updated = [...currentRiders, newRider];
      saveDokanRiders(updated);
      
      // Emit simulated email, SMS, and WhatsApp dispatch notifications
      emitEventDrivenNotifications('rider_registration', {
        riderName: fullRiderName,
        phone: riderPhone,
        email: newRider.email,
        idCard: riderIdCard,
        motorcyclePlate: newRider.motorcyclePlate,
        accessLink: `https://olimart-courier.ug/dashboard/${newRider.id}`
      });

      alert(`🏍️ Delivery Partner Registered Successfully!\n\n` +
            `• System Auto-Generated Rider ID: ${uniqueRdrId}\n` +
            `• Onboarding Status: AWAITING ADMIN APPROVAL\n\n` +
            `💬 Simulated Notification Dispatched: An SMS, WhatsApp message, and Email have been simulated with a secure link to access your Courier Dashboard once the Super Admin approves your application.`);
      
      // Reset rider registration form
      setRiderName('');
      setRiderPhone('');
      setRiderEmail('');
      setRiderIdCard('');
      setRiderDrivingPermit('');
      setRiderPictureUrl('');
      setVehiclePlate('');
      setHelmetOrHub('');
      setCargoVolume('');
      setLicenseTonnage('');
    }
    else if (regRole === 'customer') {
      if (!custName || !custPhone) return;
      const uniqueCustId = `DKN-CST-${Math.floor(1000 + Math.random() * 9000)}`;
      const customerProfile = {
        id: `c-${Date.now()}`,
        name: `${custName} [${uniqueCustId}]`,
        phone: custPhone,
        email: custEmail,
        district: custDistrict,
        balance: 100000 // Free credit for testing
      };
      localStorage.setItem('olimart_current_customer', JSON.stringify(customerProfile));
      alert(`👤 Shopper Account Created!\nName: ${custName} [${uniqueCustId}]\nDistrict: ${custDistrict}\nShs 100,000 promo credit added to your local wallet!\nUse this account to purchase items and track live deliveries!`);
      setCustName('');
      setCustPhone('');
      setCustEmail('');
    }
  };

  const handleLogSwitch = (vendorId: string) => {
    const target = allVendors.find(v => v.id === vendorId);
    if (target) {
      setCurrentVendor(target);
      setActiveTab('dashboard');
    }
  };

  // Add new product directly to the platform
  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodTitle || !prodPrice || !currentVendor) return;

    const priceNum = parseInt(prodPrice);
    if (isNaN(priceNum)) return;

    const newProd: Product = {
      id: `p-vendor-${Date.now()}`,
      title: prodTitle,
      price: priceNum,
      originalPrice: Math.round(priceNum * 1.25),
      category: prodCategory || currentVendor.category,
      image: prodImage || 'https://picsum.photos/seed/dokan-prod/400/400',
      rating: 5.0,
      reviewsCount: 0,
      brand: prodBrand,
      isFlashSale: false,
      isOfficial: true,
      freeDelivery: true,
      payOnDelivery: true,
      inStock: true,
      stockCount: parseInt(prodStockCount) || 15,
      isTrendingHigh: prodIsTrending,
      tags: (prodTags || '').split(',').map(t => t.trim()),
      productType: prodType,
      vendors: [
        {
          id: currentVendor.id,
          name: currentVendor.name,
          price: priceNum,
          rating: 5.0,
          reviewsCount: 1,
          deliveryTime: 'Same Day Delivery',
          shippingFee: 0,
          isOfficial: true,
          location: currentVendor.location
        }
      ],
      reviews: []
    };

    const updatedProducts = [newProd, ...products];
    setProducts(updatedProducts);
    
    // reset form fields
    setProdTitle('');
    setProdPrice('');
    setProdImage('');
    setProdStockCount('15');
    setProdIsTrending(true);
    setProdType('light');
    alert(`Success: "${prodTitle}" added to main catalog with ${newProd.stockCount} units in stock.`);
  };

  // Submit withdrawal request
  const handleWithdrawRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentVendor || !withdrawAmount) return;

    const amountNum = parseInt(withdrawAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert('Error: Please enter a valid amount.');
      return;
    }

    if (amountNum > currentVendor.balance) {
      alert(`Insufficient funds! Your max withdrawable balance is Shs ${currentVendor.balance.toLocaleString()}.`);
      return;
    }

    const newRequest: WithdrawalRequest = {
      id: `wreq-${Date.now()}`,
      vendorId: currentVendor.id,
      vendorName: currentVendor.name,
      amount: amountNum,
      method: withdrawMethod,
      details: withdrawDetails || currentVendor.paymentDetails,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    const currentRequests = getDokanWithdrawals();
    const updatedRequests = [newRequest, ...currentRequests];
    saveDokanWithdrawals(updatedRequests);
    setWithdrawals(updatedRequests);

    // deduct vendor's balance until approved/rejected to prevent double withdrawal attacks
    const updatedVendors = allVendors.map(v => {
      if (v.id === currentVendor.id) {
        return {
          ...v,
          balance: v.balance - amountNum
        };
      }
      return v;
    });
    saveDokanVendors(updatedVendors);
    setAllVendors(updatedVendors);

    // Trigger event driven notification for withdrawal
    emitEventDrivenNotifications('withdrawal_request', {
      vendorName: currentVendor.name,
      amount: amountNum,
      method: withdrawMethod,
      details: withdrawDetails || currentVendor.paymentDetails
    });
    
    setWithdrawAmount('');
    setWithdrawDetails('');
    alert('Withdrawal Request successfully submitted for Admin audit! Balance deducted.');
  };

  // Vendor order dispatcher status change (accept/cancel)
  const handleUpdateOrderStatus = (orderId: string, newStatus: 'dispatched' | 'placed', riderName?: string) => {
    const updated = orders.map(o => {
      if (o.id === orderId) {
        return { 
          ...o, 
          status: newStatus, 
          assignedRider: riderName || o.assignedRider 
        };
      }
      return o;
    });
    saveDokanOrders(updated);
    setOrders(updated);
    window.dispatchEvent(new Event('storage'));
  };

  // Vendor approves or rejects the order
  const handleVendorDecision = (orderId: string, decision: 'approved' | 'rejected') => {
    const updated = orders.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          vendorStatus: decision,
          vendorApprovedAt: decision === 'approved' ? new Date().toISOString() : undefined,
          // if approved, also mark status as placed so it stays active
          status: decision === 'approved' ? 'placed' as const : 'placed' as const
        };
      }
      return o;
    });
    saveDokanOrders(updated);
    setOrders(updated);
    window.dispatchEvent(new Event('storage'));

    const targetOrder = updated.find(o => o.id === orderId);
    if (targetOrder) {
      emitEventDrivenNotifications(decision === 'approved' ? 'vendor_approved' : 'vendor_rejected', {
        orderId: orderId,
        vendorName: currentVendor.name,
        customerName: targetOrder.customerName,
        customerPhone: targetOrder.customerPhone
      });
    }

    alert(`Order ${orderId} has been successfully ${decision.toUpperCase()}! notifications dispatched to Admin and Customer.`);
  };

  // Quick edit product price and stock details
  const handleUpdateProductPrice = (prodId: string) => {
    const parsedPrice = parseInt(editingPrice);
    const parsedStock = parseInt(editingStock);
    if (isNaN(parsedPrice)) return;

    const updated = products.map(p => {
      if (p.id === prodId) {
        return {
          ...p,
          price: parsedPrice,
          stockCount: isNaN(parsedStock) ? p.stockCount : parsedStock,
          inStock: isNaN(parsedStock) ? p.inStock : parsedStock > 0,
          isTrendingHigh: editingDemand,
          vendors: p.vendors ? p.vendors.map(v => {
            if (v.id === currentVendor?.id) {
              return { ...v, price: parsedPrice };
            }
            return v;
          }) : []
        };
      }
      return p;
    });

    setProducts(updated);
    setEditingProdId(null);
    setEditingPrice('');
    setEditingStock('');
  };

  const dynamicCategories = getDokanCategories();

  // If no vendor is logged in, show onboarding registration screen
  if (!currentVendor) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8" id="vendor-onboarding-panel">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          
          {/* Quick Info */}
          <div className="md:col-span-5 space-y-6">
            <div className="space-y-2">
              <span className="bg-orange-100 text-orange-800 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded">
                Olimart Seller Program
              </span>
              <h2 className="font-sans text-xl font-black text-slate-900 tracking-tight">
                Multi-Vendor Seller Portal
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                Launch your digital store on Uganda's fastest Boda Boda commerce network. Keep <strong>85%</strong> of every sale, with zero listing fees.
              </p>
            </div>

            <div className="space-y-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl">
              <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Seller Guarantees</h4>
              <ul className="space-y-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                  Flat 15% marketplace commission.
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                  Centralized escrow payout system.
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                  Next-day bank/mobile money withdrawal.
                </li>
              </ul>
            </div>

            {/* Quick Login Switcher */}
            <div className="space-y-2 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl">
              <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Or Switch Active Vendor Profiles:</p>
              <div className="grid grid-cols-1 gap-1.5">
                {allVendors.map(v => (
                  <button
                    key={v.id}
                    onClick={() => handleLogSwitch(v.id)}
                    className="w-full text-left bg-white dark:bg-slate-900 hover:border-orange-400 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl flex items-center justify-between text-xs font-bold cursor-pointer"
                  >
                    <div>
                      <p className="text-slate-800 dark:text-slate-100">{v.name}</p>
                      <p className="text-[9px] text-slate-400">Status: {v.status.toUpperCase()}</p>
                    </div>
                    <ArrowUpRight size={14} className="text-slate-400" />
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Form */}
          <div className="md:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-4">
            
            {/* 3 Options Tabs Selector */}
            <div className="flex border-b border-slate-100 dark:border-slate-800 gap-1.5 pb-2">
              <button
                type="button"
                onClick={() => setRegRole('vendor')}
                className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg cursor-pointer transition-all ${
                  regRole === 'vendor'
                    ? 'bg-orange-600 text-white shadow-sm font-black'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-slate-700'
                }`}
              >
                🏬 Vendor Partner
              </button>
              <button
                type="button"
                onClick={() => setRegRole('delivery')}
                className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg cursor-pointer transition-all ${
                  regRole === 'delivery'
                    ? 'bg-orange-600 text-white shadow-sm font-black'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-slate-700'
                }`}
              >
                🏍️ Delivery Rider
              </button>
              <button
                type="button"
                onClick={() => setRegRole('customer')}
                className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg cursor-pointer transition-all ${
                  regRole === 'customer'
                    ? 'bg-orange-600 text-white shadow-sm font-black'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-slate-700'
                }`}
              >
                👤 Customer Buyer
              </button>
            </div>

            {/* Render Vendor registration form */}
            {regRole === 'vendor' && (
              <form onSubmit={handleRegister} className="space-y-4 text-xs font-semibold">
                <div className="space-y-1">
                  <span className="text-[10px] bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-300 font-extrabold px-2 py-0.5 rounded uppercase">
                    Olimart Seller Account
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-slate-500">Store / Business Name</label>
                    <input
                      type="text"
                      required
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      placeholder="e.g. Ssebaggala Mobiles Ltd"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-500">Owner Name</label>
                    <input
                      type="text"
                      required
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      placeholder="e.g. Moses Ssebaggala"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-slate-500">E-mail Address</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="partner@ssebaggala.com"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-500">Contact Telephone Number</label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 0772 555666"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-slate-500">Store Primary Location</label>
                    <select
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none font-sans font-bold"
                    >
                      <option value="Kampala Central">Kampala Central (Wandegeya / Plaza)</option>
                      <option value="Mukono Town">Mukono Town (Ssezibwa Corridor)</option>
                      <option value="Wakiso Center">Wakiso Center</option>
                      <option value="Jinja District">Jinja District (Nile Basin)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-500">Store Primary Category</label>
                    <select
                      value={businessCategory}
                      onChange={(e) => setBusinessCategory(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none font-sans font-bold"
                    >
                      {dynamicCategories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500">Payout Credentials (Momo line or Bank Account)</label>
                  <input
                    type="text"
                    required
                    value={paymentDetails}
                    onChange={(e) => setPaymentDetails(e.target.value)}
                    placeholder="e.g. MTN Mobile Money - 0772 555666"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-black uppercase py-3.5 rounded-xl cursor-pointer transition-transform duration-250 active:scale-98 text-xs shadow-md mt-2"
                >
                  Register Store & Generate Seller ID
                </button>
              </form>
            )}

            {/* Render Delivery Rider registration form */}
            {regRole === 'delivery' && (
              <form onSubmit={handleRegister} className="space-y-4 text-xs font-semibold">
                <div className="space-y-1">
                  <span className="text-[10px] bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-300 font-extrabold px-2 py-0.5 rounded uppercase font-mono">
                    Olimart Express Courier Registration
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-slate-500">Driver / Rider Full Name</label>
                    <input
                      type="text"
                      required
                      value={riderName}
                      onChange={(e) => setRiderName(e.target.value)}
                      placeholder="e.g. Robert Musoke"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-500">Contact Telephone (WhatsApp Number)</label>
                    <input
                      type="tel"
                      required
                      value={riderPhone}
                      onChange={(e) => setRiderPhone(e.target.value)}
                      placeholder="e.g. 0772 123456"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-slate-500">Email Address</label>
                    <input
                      type="email"
                      required
                      value={riderEmail}
                      onChange={(e) => setRiderEmail(e.target.value)}
                      placeholder="e.g. robert@olimart-courier.ug"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-500 font-extrabold text-[#f68b1e]">National ID Card No (Compulsory) ⚠️</label>
                    <input
                      type="text"
                      required
                      value={riderIdCard}
                      onChange={(e) => setRiderIdCard(e.target.value)}
                      placeholder="e.g. CM84010110XP1B (Uganda ID)"
                      className="w-full bg-amber-50 dark:bg-slate-950 border border-[#f68b1e] text-slate-800 dark:text-amber-100 rounded-lg px-3 py-2 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-slate-500">Driving Permit / License Details</label>
                    <input
                      type="text"
                      required
                      value={riderDrivingPermit}
                      onChange={(e) => setRiderDrivingPermit(e.target.value)}
                      placeholder="e.g. DL-948194-KLA"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-500">Profile Picture / Headshot</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setRiderPictureUrl(reader.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="text-xs text-slate-500 block w-full file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-150"
                      />
                      {riderPictureUrl && (
                        <img src={riderPictureUrl} alt="Preview" className="w-8 h-8 rounded-full object-cover border border-orange-500" />
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-slate-500">Means of Transport</label>
                    <select
                      value={transportMeans}
                      onChange={(e) => setTransportMeans(e.target.value as any)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none font-sans font-bold"
                    >
                      <option value="boda">🏍️ Boda Boda Motorcycle</option>
                      <option value="bicycle">🚲 Bicycle Courier</option>
                      <option value="van">🚐 Mini-Van Delivery</option>
                      <option value="truck">🚚 Heavy Cargo Truck</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-500">Rider Hub / Primary Location</label>
                    <select
                      value={riderLocation}
                      onChange={(e) => setRiderLocation(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none font-sans font-bold"
                    >
                      <option value="Kampala Central">Kampala Central (Downtown Hub)</option>
                      <option value="Mukono Town">Mukono Town (Ssezibwa Corridor)</option>
                      <option value="Wakiso Center">Wakiso Center Hub</option>
                      <option value="Jinja District">Jinja District (Nile Corridor)</option>
                    </select>
                  </div>
                </div>

                {/* Conditional Fields depending on Transport Means (Requirement 2) */}
                {transportMeans === 'boda' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 animate-fade-in">
                    <div className="space-y-1">
                      <label className="text-slate-500">Motorcycle Plate Number</label>
                      <input
                        type="text"
                        required
                        value={vehiclePlate}
                        onChange={(e) => setVehiclePlate(e.target.value)}
                        placeholder="e.g. UFA 450Y"
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-500">KCCA Helmet ID Number</label>
                      <input
                        type="text"
                        required
                        value={helmetOrHub}
                        onChange={(e) => setHelmetOrHub(e.target.value)}
                        placeholder="e.g. HELMET-904"
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {transportMeans === 'bicycle' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 animate-fade-in">
                    <div className="space-y-1">
                      <label className="text-slate-500">Safety Helmet Code</label>
                      <input
                        type="text"
                        required
                        value={helmetOrHub}
                        onChange={(e) => setHelmetOrHub(e.target.value)}
                        placeholder="e.g. BIKE-SAFE-221"
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-500">Assigned Dispatcher Hub</label>
                      <input
                        type="text"
                        required
                        value={vehiclePlate}
                        onChange={(e) => setVehiclePlate(e.target.value)}
                        placeholder="e.g. Wandegeya Express Hub"
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {transportMeans === 'van' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 animate-fade-in">
                    <div className="space-y-1">
                      <label className="text-slate-500">Commercial Loading Volume</label>
                      <input
                        type="text"
                        required
                        value={cargoVolume}
                        onChange={(e) => setCargoVolume(e.target.value)}
                        placeholder="e.g. 15 Cubic Meters"
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-500">Commercial Driver License ID</label>
                      <input
                        type="text"
                        required
                        value={vehiclePlate}
                        onChange={(e) => setVehiclePlate(e.target.value)}
                        placeholder="e.g. CDL-5510-KMP"
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {transportMeans === 'truck' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 animate-fade-in">
                    <div className="space-y-1">
                      <label className="text-slate-500">Max Payload Tonnage (Tons)</label>
                      <input
                        type="text"
                        required
                        value={licenseTonnage}
                        onChange={(e) => setLicenseTonnage(e.target.value)}
                        placeholder="e.g. 12 Tons"
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-500">Transit Cargo Route Permit</label>
                      <input
                        type="text"
                        required
                        value={vehiclePlate}
                        onChange={(e) => setVehiclePlate(e.target.value)}
                        placeholder="e.g. PRMT-9941-EAS"
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-black uppercase py-3.5 rounded-xl cursor-pointer transition-transform duration-250 active:scale-98 text-xs shadow-md mt-2"
                >
                  Register Rider & Associate Transport Category
                </button>
              </form>
            )}

            {/* Render Customer registration form */}
            {regRole === 'customer' && (
              <form onSubmit={handleRegister} className="space-y-4 text-xs font-semibold">
                <div className="space-y-1">
                  <span className="text-[10px] bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-300 font-extrabold px-2 py-0.5 rounded uppercase font-mono">
                    Customer Account Creation
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-slate-500">Full Name</label>
                    <input
                      type="text"
                      required
                      value={custName}
                      onChange={(e) => setCustName(e.target.value)}
                      placeholder="e.g. Joan Nakato"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-500">Mobile Phone Number</label>
                    <input
                      type="tel"
                      required
                      value={custPhone}
                      onChange={(e) => setCustPhone(e.target.value)}
                      placeholder="e.g. 0772 999111"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-slate-500">E-mail Address</label>
                    <input
                      type="email"
                      required
                      value={custEmail}
                      onChange={(e) => setCustEmail(e.target.value)}
                      placeholder="joan@gmail.com"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-500">Default Shipping District</label>
                    <select
                      value={custDistrict}
                      onChange={(e) => setCustDistrict(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none font-sans font-bold"
                    >
                      <option value="Kampala (Central)">Kampala Central (Wandegeya / Nakasero)</option>
                      <option value="Mukono Town">Mukono Town</option>
                      <option value="Wakiso Center">Wakiso Center</option>
                      <option value="Jinja District">Jinja District</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-black uppercase py-3.5 rounded-xl cursor-pointer transition-transform duration-250 active:scale-98 text-xs shadow-md mt-2"
                >
                  Create Shopper Account & Credit 100k Ugx Wallet
                </button>
              </form>
            )}

          </div>

        </div>
      </div>
    );
  }

  // --- TEMPORARY DASHBOARD GATING SCREEN ---
  // Triggered when currentVendor.status is 'pending'
  if (currentVendor.status === 'pending' || currentVendor.status === 'rejected') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6" id="vendor-pending-sandbox">
        
        {/* Banner */}
        <div className="bg-amber-50 dark:bg-slate-900 border-2 border-amber-200/60 dark:border-slate-800 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 justify-between text-left">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
              </span>
              <p className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 font-mono">
                SELLER ID: #{currentVendor.id}
              </p>
            </div>
            <h2 className="font-sans text-lg font-black text-slate-900 dark:text-slate-100">
              Welcome to Olimart, <span className="text-orange-600">{currentVendor.name}</span>!
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed max-w-xl">
              Your store onboarding information has been saved. The Olimart Super Admin is currently evaluating your credentials, landmark, and tax compliance.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl text-center space-y-1.5 shadow-sm w-full md:w-auto">
            <p className="text-[10px] font-black uppercase text-slate-400">Evaluate Sandbox Approval</p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const updated = allVendors.map(v => {
                    if (v.id === currentVendor.id) {
                      return { ...v, status: 'approved' as const };
                    }
                    return v;
                  });
                  saveDokanVendors(updated);
                  setAllVendors(updated);
                  setCurrentVendor({ ...currentVendor, status: 'approved' });
                  alert("Sandbox Mode: Approved instantly! Welcome to the seller command center!");
                }}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase px-3 py-1.5 rounded-lg cursor-pointer"
              >
                Instant Self-Approve
              </button>
              <button
                onClick={() => {
                  setCurrentVendor(null);
                }}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] font-bold px-3 py-1.5 rounded-lg cursor-pointer"
              >
                Change Store
              </button>
            </div>
          </div>
        </div>

        {/* Temporary Waiting Timeline Stepper */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-6 flex items-center gap-1.5">
            <Clock size={16} className="text-orange-600" /> Store Evaluation Timeline
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            <div className="absolute top-[16px] left-[15px] right-[15px] h-[2px] bg-slate-100 dark:bg-slate-800 hidden md:block" />

            {/* Step 1 */}
            <div className="flex items-center md:flex-col text-left md:text-center gap-4 md:gap-2">
              <div className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs relative z-10 shadow-sm">
                <Check size={16} />
              </div>
              <div>
                <p className="text-xs font-black text-slate-800 dark:text-slate-100">Profile Saved</p>
                <p className="text-[10px] text-slate-400">Onboarding successful</p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-center md:flex-col text-left md:text-center gap-4 md:gap-2">
              <div className="w-9 h-9 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold text-xs relative z-10 shadow-md animate-pulse">
                <Clock size={16} />
              </div>
              <div>
                <p className="text-xs font-black text-orange-600">Pending Review</p>
                <p className="text-[10px] text-slate-400">Verification in progress</p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-center md:flex-col text-left md:text-center gap-4 md:gap-2">
              <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center font-bold text-xs relative z-10">
                3
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500">Super Admin Handshake</p>
                <p className="text-[10px] text-slate-400">Tax & landmark validation</p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex items-center md:flex-col text-left md:text-center gap-4 md:gap-2">
              <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center font-bold text-xs relative z-10">
                4
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500">Store Live</p>
                <p className="text-[10px] text-slate-400">Sell on Olimart Uganda</p>
              </div>
            </div>
          </div>
        </div>

        {/* Locked Sales Preview Section to meet: "while waiting to go to the main app, view the sales analysis" */}
        <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 overflow-hidden">
          
          {/* Overlay Lock */}
          <div className="absolute inset-0 bg-slate-100/70 dark:bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center text-center p-6 z-20">
            <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mb-3 shadow-md">
              <Clock size={20} className="animate-spin" />
            </div>
            <h4 className="text-sm font-black uppercase text-slate-800 dark:text-slate-100 tracking-wider">Awaiting Evaluation Handshake</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1 leading-relaxed">
              Once approved, you will have access to full live sales analysis, wallet payout history, and dynamic catalog uploads.
            </p>
          </div>

          {/* Background blurred statistics preview */}
          <div className="opacity-45 space-y-6 select-none pointer-events-none">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Store Analytics</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="border border-slate-100 p-4 rounded-2xl bg-slate-50">
                <p className="text-[10px] font-bold text-slate-400">TOTAL SALES</p>
                <p className="text-lg font-black text-slate-800">Shs 4,250,000</p>
              </div>
              <div className="border border-slate-100 p-4 rounded-2xl bg-slate-50">
                <p className="text-[10px] font-bold text-slate-400">NET EARNINGS (85%)</p>
                <p className="text-lg font-black text-slate-800">Shs 3,612,500</p>
              </div>
              <div className="border border-slate-100 p-4 rounded-2xl bg-slate-50">
                <p className="text-[10px] font-bold text-slate-400">COMMISSION CHARGED (15%)</p>
                <p className="text-lg font-black text-slate-800">Shs 637,500</p>
              </div>
            </div>
            <div className="h-24 bg-slate-50 border border-slate-150 rounded-2xl flex items-end justify-between p-3">
              <div className="w-12 h-10 bg-orange-400 rounded-lg" />
              <div className="w-12 h-16 bg-orange-400 rounded-lg" />
              <div className="w-12 h-8 bg-orange-400 rounded-lg" />
              <div className="w-12 h-20 bg-orange-400 rounded-lg" />
            </div>
          </div>
        </div>

      </div>
    );
  }

  // --- APPROVED MAIN VENDOR APP ---
  const myOrders = orders.filter(o => 
    o.items.some(item => item.selectedVendor === currentVendor.name)
  );

  const myProducts = products.filter(p => 
    p.vendors && p.vendors.some(v => v.id === currentVendor.id)
  );

  const filteredProducts = myProducts.filter(p => {
    if (stockFilter === 'low') {
      const stock = p.stockCount !== undefined ? p.stockCount : ((p.reviewsCount || 0) % 15) + 3;
      const isTrending = p.isTrendingHigh !== undefined ? p.isTrendingHigh : ((p.rating || 0) >= 4.4 || p.isFlashSale);
      return isTrending && stock <= 12;
    }
    return true;
  });

  // commission metrics
  const totalMySales = currentVendor.totalSales;
  const netEarnings = Math.round(totalMySales * 0.85);
  const totalCommissionPaid = Math.round(totalMySales * 0.15);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6" id="vendor-dashboard-approved">
      
      {/* Header Panel */}
      <div className="bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-3xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="relative">
            {currentVendor.logo ? (
              <img
                src={currentVendor.logo}
                alt="Store Logo"
                className="w-16 h-16 rounded-full object-cover border-2 border-white/80 shadow-md bg-white"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-orange-800 text-white flex items-center justify-center font-black text-xl border-2 border-white/80 shadow-md uppercase">
                {currentVendor.name.charAt(0)}
              </div>
            )}
            <label className="absolute -bottom-1 -right-1 bg-slate-900/80 hover:bg-slate-900 text-white text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full cursor-pointer transition-colors shadow-xs border border-white">
              LOGO
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      const base64 = reader.result as string;
                      const updatedVendor = { ...currentVendor, logo: base64 };
                      setCurrentVendor(updatedVendor);
                      const updatedAll = allVendors.map(v => v.id === currentVendor.id ? updatedVendor : v);
                      setAllVendors(updatedAll);
                      saveDokanVendors(updatedAll);
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                className="hidden"
              />
            </label>
          </div>
          
          <div className="space-y-1 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="bg-orange-800 text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1">
                <CheckCircle size={10} /> Verified Partner
              </span>
              <span className="text-slate-200 text-xs font-mono">Store ID: {currentVendor.id}</span>
            </div>
            <h2 className="text-xl font-black">{currentVendor.name}</h2>
            <p className="text-xs text-orange-100 flex items-center justify-center sm:justify-start gap-1.5">
              📍 Base: {currentVendor.location} &bull; owner: {currentVendor.ownerName}
            </p>
          </div>
        </div>

        {/* Change account switcher on the fly */}
        <div className="flex flex-wrap items-center gap-2 text-slate-800">
          <select
            value={currentVendor.id}
            onChange={(e) => handleLogSwitch(e.target.value)}
            className="bg-white px-3 py-2 rounded-xl text-xs font-black border border-slate-200 focus:outline-none"
          >
            {allVendors.map(v => (
              <option key={v.id} value={v.id}>{v.name} ({v.status})</option>
            ))}
          </select>

          <button
            onClick={() => {
              setCurrentVendor(null);
            }}
            className="bg-slate-900 text-white hover:bg-slate-850 px-3 py-2 rounded-xl text-xs font-black cursor-pointer"
          >
            Register New Store
          </button>
        </div>
      </div>

      {/* Navigation sub-tabs */}
      <div className="flex items-center overflow-x-auto gap-2 border-b border-slate-200 pb-1">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-4 py-2 text-xs font-black uppercase tracking-wider border-b-2 cursor-pointer transition-colors ${
            activeTab === 'dashboard' ? 'border-orange-600 text-orange-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Overview & Charts
        </button>
        <button
          onClick={() => setActiveTab('products')}
          className={`px-4 py-2 text-xs font-black uppercase tracking-wider border-b-2 cursor-pointer transition-colors ${
            activeTab === 'products' ? 'border-orange-600 text-orange-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          My Products ({myProducts.length})
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 text-xs font-black uppercase tracking-wider border-b-2 cursor-pointer transition-colors ${
            activeTab === 'orders' ? 'border-orange-600 text-orange-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Store Orders ({myOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('wallet')}
          className={`px-4 py-2 text-xs font-black uppercase tracking-wider border-b-2 cursor-pointer transition-colors ${
            activeTab === 'wallet' ? 'border-orange-600 text-orange-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Wallet & Withdrawals
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Bento grids metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl space-y-2 text-left">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Sales (Gross)</p>
              <div className="flex items-center justify-between">
                <p className="text-lg font-black text-slate-900 dark:text-slate-100">
                  {formatPrice(totalMySales)}
                </p>
                <div className="w-8 h-8 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center">
                  <TrendingUp size={16} />
                </div>
              </div>
              <p className="text-[9px] text-slate-400">100% of orders booked online</p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl space-y-2 text-left">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Net Earnings (85%)</p>
              <div className="flex items-center justify-between">
                <p className="text-lg font-black text-emerald-600">
                  {formatPrice(netEarnings)}
                </p>
                <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <DollarSign size={16} />
                </div>
              </div>
              <p className="text-[9px] text-slate-400">After Olimart platform fees</p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl space-y-2 text-left">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Commission Charged (15%)</p>
              <div className="flex items-center justify-between">
                <p className="text-lg font-black text-rose-600">
                  {formatPrice(totalCommissionPaid)}
                </p>
                <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
                  <Tag size={16} />
                </div>
              </div>
              <p className="text-[9px] text-slate-400">Flat commission tier applied</p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl space-y-2 text-left">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Withdrawable Balance</p>
              <div className="flex items-center justify-between">
                <p className="text-lg font-black text-orange-600">
                  {formatPrice(currentVendor.balance)}
                </p>
                <div className="w-8 h-8 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center">
                  <Store size={16} />
                </div>
              </div>
              <p className="text-[9px] text-slate-400">Withdrawn: {formatPrice(netEarnings - currentVendor.balance)}</p>
            </div>

          </div>

          {/* Sales Analysis Chart simulation */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 text-left">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-100 mb-4">
              Weekly Sales Performance Analysis
            </h3>
            
            {/* Visual Bar representation */}
            <div className="space-y-4 font-bold text-xs">
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span>Monday (MoMo Sales Launch)</span>
                  <span>75% Sales Vol</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-orange-500 to-amber-500 h-full rounded-full" style={{ width: '75%' }} />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span>Wednesday (Kampala Mid-Week Deals)</span>
                  <span>95% Sales Vol</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-orange-500 to-amber-500 h-full rounded-full" style={{ width: '95%' }} />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span>Weekend (Farmers Market & Grocery Bulk Cargo)</span>
                  <span>45% Sales Vol</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-orange-500 to-amber-500 h-full rounded-full" style={{ width: '45%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MY PRODUCTS */}
      {activeTab === 'products' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start text-left">
          
          {/* Add product form */}
          <div className="md:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
              <PlusCircle size={16} className="text-orange-600" /> Post Product Direct
            </h3>

            <form onSubmit={handleAddProduct} className="space-y-3.5 text-xs font-semibold">
              <div className="space-y-1">
                <label className="text-slate-500">Product Title</label>
                <input
                  type="text"
                  required
                  value={prodTitle}
                  onChange={(e) => setProdTitle(e.target.value)}
                  placeholder="e.g. Tecno Spark 30 Neo"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-slate-500">Price (Shs)</label>
                  <input
                    type="number"
                    required
                    value={prodPrice}
                    onChange={(e) => setProdPrice(e.target.value)}
                    placeholder="e.g. 500000"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500">Brand</label>
                  <input
                    type="text"
                    required
                    value={prodBrand}
                    onChange={(e) => setProdBrand(e.target.value)}
                    placeholder="e.g. Tecno"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-slate-500">Initial Stock</label>
                  <input
                    type="number"
                    required
                    value={prodStockCount}
                    onChange={(e) => setProdStockCount(e.target.value)}
                    placeholder="e.g. 15"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500">Demand level</label>
                  <select
                    value={prodIsTrending ? 'trending' : 'standard'}
                    onChange={(e) => setProdIsTrending(e.target.value === 'trending')}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none font-bold text-orange-600"
                  >
                    <option value="trending">🔥 Trending High</option>
                    <option value="standard">📊 Standard</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-500">Product Category</label>
                <select
                  value={prodCategory}
                  onChange={(e) => setProdCategory(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none"
                >
                  <option value="">Use My Default Category ({currentVendor.category})</option>
                  {dynamicCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 font-bold">Weight / Shipping Class</label>
                <select
                  value={prodType}
                  onChange={(e) => setProdType(e.target.value as 'bulky' | 'light')}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none font-bold text-orange-600"
                >
                  <option value="light">🪶 Light (Comm: {activeAdminSettings.lightCommission}%, Boda: {activeAdminSettings.lightTransportRate} Shs/km)</option>
                  <option value="bulky">📦 Bulky (Comm: {activeAdminSettings.bulkyCommission}%, Boda: {activeAdminSettings.bulkyTransportRate} Shs/km)</option>
                </select>
                <p className="text-[9px] text-slate-400">Controls checkout boda shipping tariffs & seller commissions.</p>
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 font-bold block">Product Image</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={prodImage}
                    onChange={(e) => setProdImage(e.target.value)}
                    placeholder="Paste URL or upload locally..."
                    className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none text-xs"
                  />
                  <label className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-bold cursor-pointer flex items-center justify-center gap-1">
                    <span>Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setProdImage(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
                {prodImage && (
                  <div className="mt-1.5 relative w-16 h-16 border rounded-lg overflow-hidden bg-slate-50">
                    <img src={prodImage} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setProdImage('')}
                      className="absolute top-0 right-0 bg-red-500 text-white rounded-bl p-0.5 text-[8px]"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-slate-500">Tags (comma separated)</label>
                <input
                  type="text"
                  value={prodTags}
                  onChange={(e) => setProdTags(e.target.value)}
                  placeholder="e.g. Hot Deal, 5G"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-orange-600 hover:bg-orange-500 text-white font-black uppercase py-2.5 rounded-lg cursor-pointer"
              >
                Upload to Olimart Catalog
              </button>
            </form>
          </div>

          {/* List of my products */}
          <div className="md:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                <ShoppingBag size={16} className="text-orange-600" /> Currently Posted Catalog ({myProducts.length})
              </h3>
              
              {/* Stock Filter Sub-Tabs */}
              <div className="flex gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setStockFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border cursor-pointer ${
                    stockFilter === 'all'
                      ? 'bg-slate-900 text-white border-slate-900 dark:bg-slate-100 dark:text-slate-900'
                      : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  All Items ({myProducts.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStockFilter('low')}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border flex items-center gap-1 cursor-pointer ${
                    stockFilter === 'low'
                      ? 'bg-amber-600 text-white border-amber-600 dark:bg-amber-500 dark:text-slate-950'
                      : 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/20 dark:hover:bg-amber-950/40 border-amber-200 dark:border-amber-900/50 text-amber-700 dark:text-amber-400'
                  }`}
                >
                  <span>⚠️ Low Stock Alerts</span>
                  <span className="bg-amber-700 dark:bg-amber-600 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full">
                    {myProducts.filter(p => {
                      const stock = p.stockCount !== undefined ? p.stockCount : ((p.reviewsCount || 0) % 15) + 3;
                      const isTrending = p.isTrendingHigh !== undefined ? p.isTrendingHigh : ((p.rating || 0) >= 4.4 || p.isFlashSale);
                      return isTrending && stock <= 12;
                    }).length}
                  </span>
                </button>
              </div>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                {stockFilter === 'low' 
                  ? 'Awesome! No high-demand products are currently running low in stock!' 
                  : 'No products posted by your store yet. Use the form to upload.'}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredProducts.map(p => {
                  const stock = p.stockCount !== undefined ? p.stockCount : ((p.reviewsCount || 0) % 15) + 3;
                  const isTrending = p.isTrendingHigh !== undefined ? p.isTrendingHigh : ((p.rating || 0) >= 4.4 || p.isFlashSale);
                  const isLowStock = stock <= 12;
                  const isCriticalStock = stock <= 5;
                  const isOut = stock === 0;

                  return (
                    <div key={p.id} className="border border-slate-100 dark:border-slate-800 p-3 rounded-xl flex flex-col justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/50">
                      <div className="flex gap-3">
                        <img
                          src={p.image}
                          alt={p.title}
                          className="w-14 h-14 object-contain bg-white dark:bg-slate-800 rounded-lg p-1 border border-slate-100 dark:border-slate-800"
                        />
                        <div className="flex-1 space-y-1">
                          <p className="text-xs font-black text-slate-800 dark:text-slate-100 line-clamp-1">{p.title}</p>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] text-slate-400 capitalize">Category: {p.category}</span>
                            <span className="text-slate-300 dark:text-slate-700">|</span>
                            <span className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded border ${
                              isItemBulky(p)
                                ? 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/25 dark:text-amber-300 dark:border-amber-900/40'
                                : 'bg-indigo-50 text-indigo-800 border-indigo-200 dark:bg-indigo-950/25 dark:text-indigo-300 dark:border-indigo-900/40'
                            }`}>
                              {isItemBulky(p) ? '📦 Bulky' : '🪶 Light'} ({isItemBulky(p) ? activeAdminSettings.bulkyCommission : activeAdminSettings.lightCommission}% Comm)
                            </span>
                          </div>
                          
                          {/* Low stock badge with yellow/red color coding depending on intensity */}
                          {isTrending && isLowStock && (
                            <div>
                              {isOut ? (
                                <span className="inline-flex bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/50 text-[9px] font-black px-1.5 py-0.5 rounded flex items-center gap-1">
                                  ❌ TRENDING & OUT OF STOCK
                                </span>
                              ) : isCriticalStock ? (
                                <span className="inline-flex bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 text-[9px] font-black px-1.5 py-0.5 rounded flex items-center gap-1 animate-pulse">
                                  🔥 CRITICAL STOCK: {stock} left! (High Demand)
                                </span>
                              ) : (
                                <span className="inline-flex bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50 text-[9px] font-black px-1.5 py-0.5 rounded flex items-center gap-1">
                                  📈 LOW STOCK: {stock} left (High Demand)
                                </span>
                              )}
                            </div>
                          )}
                          {!isTrending && (
                            <div className="text-[9px] font-bold text-slate-500 flex items-center gap-1">
                              <span>Stock: {stock} units</span>
                              <span className="text-slate-400 font-normal">(Standard Demand)</span>
                            </div>
                          )}
                          {isTrending && !isLowStock && (
                            <div className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                              <span>🔥 Trending High</span>
                              <span className="text-slate-300 dark:text-slate-700 font-normal">|</span>
                              <span>Stock: {stock} (Healthy)</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Editing and detail controls */}
                      <div className="border-t border-slate-100 dark:border-slate-800 pt-2 flex items-center justify-between gap-2">
                        {editingProdId === p.id ? (
                          <div className="space-y-2 p-2 bg-slate-100 dark:bg-slate-800 rounded-lg w-full text-[10px]">
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-0.5">
                                <label className="text-slate-500 block">Price (Shs)</label>
                                <input
                                  type="number"
                                  value={editingPrice}
                                  onChange={(e) => setEditingPrice(e.target.value)}
                                  placeholder={p.price.toString()}
                                  className="w-full border border-slate-200 dark:border-slate-700 rounded px-1.5 py-1 text-[11px] focus:outline-none bg-white dark:bg-slate-900 dark:text-white"
                                />
                              </div>
                              <div className="space-y-0.5">
                                <label className="text-slate-500 block">Stock Units</label>
                                <input
                                  type="number"
                                  value={editingStock}
                                  onChange={(e) => setEditingStock(e.target.value)}
                                  placeholder={stock.toString()}
                                  className="w-full border border-slate-200 dark:border-slate-700 rounded px-1.5 py-1 text-[11px] focus:outline-none bg-white dark:bg-slate-900 dark:text-white"
                                />
                              </div>
                            </div>
                            <div className="space-y-0.5">
                              <label className="text-slate-500 block">Demand Index</label>
                              <select
                                value={editingDemand ? 'trending' : 'standard'}
                                onChange={(e) => setEditingDemand(e.target.value === 'trending')}
                                className="w-full border border-slate-200 dark:border-slate-700 rounded px-1 py-1 text-[11px] focus:outline-none bg-white dark:bg-slate-900 dark:text-white font-bold"
                              >
                                <option value="trending">🔥 Trending High</option>
                                <option value="standard">📊 Standard</option>
                              </select>
                            </div>
                            <div className="flex gap-1.5 justify-end pt-1">
                              <button
                                type="button"
                                onClick={() => handleUpdateProductPrice(p.id)}
                                className="bg-emerald-600 text-white font-black text-[9px] px-2.5 py-1 rounded-md flex items-center gap-1 hover:bg-emerald-500 cursor-pointer"
                              >
                                <Check size={10} /> Save
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingProdId(null)}
                                className="bg-slate-300 text-slate-800 font-black text-[9px] px-2.5 py-1 rounded-md flex items-center gap-1 hover:bg-slate-400 cursor-pointer"
                              >
                                <X size={10} /> Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <span className="text-xs font-black text-slate-900 dark:text-slate-200">
                              {formatPrice(p.price)}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingProdId(p.id);
                                setEditingPrice(p.price.toString());
                                setEditingStock(stock.toString());
                                setEditingDemand(isTrending);
                              }}
                              className="text-[10px] bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 font-black border border-orange-200/50 dark:border-orange-900/50 px-2 py-1 rounded-lg hover:bg-orange-100/50 dark:hover:bg-orange-900/40 cursor-pointer flex items-center gap-1"
                            >
                              Edit Stock & Price
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}

      {/* TAB 3: STORE ORDERS */}
      {activeTab === 'orders' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl space-y-4 text-left">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
            <ListOrdered size={16} className="text-orange-600" /> Store Order Queue ({myOrders.length})
          </h3>

          {myOrders.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No orders placed for your products yet. They will appear here in real-time.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {myOrders.map(o => (
                <div key={o.id} className="py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-900 dark:text-slate-100">{o.id}</span>
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                        o.status === 'placed' 
                          ? 'bg-blue-100 text-blue-800' 
                          : o.status === 'dispatched' 
                          ? 'bg-amber-100 text-amber-800 animate-pulse'
                          : o.status === 'transit'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        Status: {o.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="text-[11px] font-bold text-slate-600 dark:text-slate-400 space-y-1">
                      <p>📍 Deliver to: <span className="text-slate-850 dark:text-slate-200">{o.customerName} - {o.customerAddress} ({o.customerLocation})</span></p>
                      <p>📞 Phone: <span className="font-mono text-slate-850 dark:text-slate-200">{o.customerPhone}</span></p>
                    </div>

                    {/* Items from this seller */}
                    <div className="pl-3 border-l-2 border-orange-500 space-y-1 mt-2">
                      {o.items.map((it, idx) => (
                        <div key={idx} className="text-[11px] text-slate-700 dark:text-slate-300 font-bold flex gap-2">
                          <span className="text-orange-600">[{it.quantity}x]</span>
                          <span>{it.product.title}</span>
                        </div>
                      ))}
                    </div>

                    {o.assignedRider && (
                      <div className="mt-2 p-2 bg-indigo-50/55 dark:bg-indigo-950/25 border border-indigo-100 dark:border-indigo-900/50 rounded-xl text-[10px] text-indigo-700 dark:text-indigo-400 font-black flex items-center gap-1">
                        <span>🏍️ Dispatch Logistics Rider:</span>
                        <span className="bg-indigo-600 text-white px-2 py-0.5 rounded text-[9px] font-mono">
                          {o.assignedRider}
                        </span>
                      </div>
                    )}

                    {/* RIDER SELECTION DRAWER */}
                    {assigningRiderOrderId === o.id && (
                      <div className="mt-4 p-4 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 rounded-2xl space-y-4">
                        <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-2">
                          <div>
                            <p className="text-xs font-black uppercase text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                              <span>🏍️ Assign Nearest Delivery Agent</span>
                            </p>
                            <p className="text-[10px] text-slate-500">
                              Displaying verified couriers. Nearest options highlighted based on customer coordinates ({o.customerLocation}).
                            </p>
                          </div>
                          <button
                            onClick={() => setAssigningRiderOrderId(null)}
                            className="text-xs font-black text-rose-600 hover:text-rose-500 cursor-pointer"
                          >
                            Close
                          </button>
                        </div>

                        <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                          {riders.map((rider) => {
                            const isNear = rider.location.toLowerCase() === o.customerLocation.toLowerCase() || 
                                           rider.location.toLowerCase().includes('kampala') && o.customerLocation.toLowerCase().includes('kampala');
                            const avgRating = rider.reviews && rider.reviews.length > 0 
                              ? (rider.reviews.reduce((acc, curr) => acc + curr.rating, 0) / rider.reviews.length).toFixed(1)
                              : "5.0";

                            return (
                              <div 
                                key={rider.id} 
                                className={`p-3 border rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white dark:bg-slate-900 transition-all ${
                                  isNear 
                                    ? 'border-emerald-500 shadow-sm bg-emerald-50/10 dark:bg-emerald-950/5' 
                                    : 'border-slate-100 dark:border-slate-800 hover:border-slate-200'
                                }`}
                              >
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs font-black text-slate-800 dark:text-slate-100">{rider.name}</span>
                                    <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono text-[9px] px-1.5 py-0.5 rounded uppercase">
                                      {rider.transportMeans} • {rider.motorcyclePlate}
                                    </span>
                                    {isNear && (
                                      <span className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-0.5 animate-pulse">
                                        📍 Nearest (Within Area)
                                      </span>
                                    )}
                                  </div>

                                  <p className="text-[10px] text-slate-500 flex items-center gap-1">
                                    <span>Primary Location:</span> 
                                    <span className="font-bold text-slate-700 dark:text-slate-300">{rider.location}</span>
                                    <span>• Ph:</span>
                                    <span className="font-mono text-slate-700 dark:text-slate-300">{rider.phone}</span>
                                  </p>

                                  {/* Trust Badges */}
                                  <div className="flex gap-1 flex-wrap pt-0.5">
                                    {(rider.trustBadges || ['Safe Driver', 'Punctual']).map((badge) => (
                                      <span 
                                        key={badge} 
                                        className="bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/50 text-[8px] font-black px-1.5 py-0.5 rounded-md"
                                      >
                                        ⭐ {badge}
                                      </span>
                                    ))}
                                  </div>

                                  {/* Reviews Expander */}
                                  {rider.reviews && rider.reviews.length > 0 && (
                                    <div className="mt-1 pt-1.5 border-t border-slate-100 dark:border-slate-800 space-y-1">
                                      <p className="text-[9px] uppercase font-black tracking-wider text-indigo-500">Customer Feedback ({avgRating} ⭐):</p>
                                      {rider.reviews.map(rev => (
                                        <div key={rev.id} className="text-[9px] text-slate-500 dark:text-slate-400 italic">
                                          "{rev.comment}" — <span className="font-bold">{rev.customerName}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                <button
                                  onClick={() => {
                                    handleUpdateOrderStatus(o.id, 'dispatched', rider.name);
                                    setAssigningRiderOrderId(null);
                                    alert(`Order Assigned! 🏍️ Dispatch notice sent to courier driver "${rider.name}".`);
                                  }}
                                  className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider px-3.5 py-2 rounded-xl shrink-0 cursor-pointer text-center"
                                >
                                  Assign & Dispatch
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <p className="text-xs text-slate-400">My Net Earnings (85%):</p>
                    <p className="text-sm font-black text-emerald-600">{formatPrice(o.vendorEarnings)}</p>

                    <div className="flex flex-col items-end gap-1.5 mt-1">
                      {/* Vendor Decision Panel */}
                      {(!o.vendorStatus || o.vendorStatus === 'pending') ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleVendorDecision(o.id, 'approved')}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer shadow-sm transition-all"
                          >
                            ✔️ Approve Order
                          </button>
                          <button
                            onClick={() => {
                              if (confirm("Reject this order? This will notify the customer and admin.")) {
                                handleVendorDecision(o.id, 'rejected');
                              }
                            }}
                            className="bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-black uppercase px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer shadow-sm transition-all"
                          >
                            ❌ Reject
                          </button>
                        </div>
                      ) : (
                        <div className="text-right space-y-1.5">
                          <span className={`inline-block text-[10px] font-black uppercase px-2.5 py-1 rounded-md ${
                            o.vendorStatus === 'approved' 
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                              : 'bg-rose-100 text-rose-800 border border-rose-300'
                          }`}>
                            My Decision: {o.vendorStatus.toUpperCase()}
                          </span>

                          {o.vendorStatus === 'approved' && (
                            <div className="text-[10px] font-bold text-slate-500">
                              {o.status === 'placed' && (
                                <span className="text-orange-600 animate-pulse block">
                                  ⌛ Awaiting Super Admin Rider Assignment...
                                </span>
                              )}
                              {o.status === 'dispatched' && (
                                <span className="text-indigo-600 animate-pulse block">
                                  📦 Rider Assigned. Awaiting Rider acceptance...
                                </span>
                              )}
                              {o.status === 'transit' && (
                                <span className="text-purple-600 font-extrabold flex items-center justify-end gap-1 block">
                                  🏍️ Rider en-route to pick up products
                                </span>
                              )}
                              {o.status === 'delivered' && (
                                <span className="text-emerald-600 font-black flex items-center justify-end gap-1 block">
                                  ✅ Cargo Drop Completed & Cleared!
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                      
                      {o.status === 'dispatched' && (
                        <span className="text-[10px] text-amber-600 font-extrabold flex items-center gap-1 animate-pulse">
                          ⌛ Handed over to Courier dispatch
                        </span>
                      )}

                      {o.status === 'transit' && (
                        <span className="text-[10px] text-purple-600 font-extrabold flex items-center gap-1">
                          🏍️ Rider In Transit
                        </span>
                      )}

                      {o.status === 'delivered' && (
                        <span className="text-[10px] text-emerald-600 font-extrabold flex items-center gap-1">
                          ✅ Delivered and Cleared
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: WALLET & WITHDRAWALS */}
      {activeTab === 'wallet' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start text-left">
          
          {/* Submit withdrawal form */}
          <div className="md:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
              <Send size={16} className="text-orange-600" /> Request Withdrawal
            </h3>

            <div className="bg-orange-50 dark:bg-slate-900/60 p-3 rounded-xl border border-orange-200/50 text-[11px] font-bold text-orange-800 dark:text-orange-400">
              ⚡ Available withrawable funds are automatically held securely in Olimart central platforms accounts escrow. Once approved, funds are wired immediately.
            </div>

            <form onSubmit={handleWithdrawRequest} className="space-y-4 text-xs font-semibold">
              <div className="space-y-1">
                <label className="text-slate-500">Withdrawable Balance</label>
                <p className="text-2xl font-black text-slate-900 dark:text-slate-100">
                  {formatPrice(currentVendor.balance)}
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-slate-500">Withdrawal Amount (UGX)</label>
                <input
                  type="number"
                  required
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="e.g. 500000"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-500">Withdrawal Method</label>
                <select
                  value={withdrawMethod}
                  onChange={(e) => setWithdrawMethod(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none"
                >
                  <option value="momo">MTN Mobile Money</option>
                  <option value="stripe">Visa Card (via Stripe)</option>
                  <option value="paypal">PayPal Express</option>
                  <option value="bank">Direct Bank Account Transfer</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-500">Beneficiary Details (e.g. PayPal email / Account holder name)</label>
                <input
                  type="text"
                  value={withdrawDetails}
                  onChange={(e) => setWithdrawDetails(e.target.value)}
                  placeholder={currentVendor.paymentDetails}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-orange-600 hover:bg-orange-500 text-white font-black uppercase py-3 rounded-lg cursor-pointer"
              >
                Submit Request
              </button>
            </form>
          </div>

          {/* Withdraw history */}
          <div className="md:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
              <History size={16} className="text-orange-600" /> Withdrawal Request Ledger ({withdrawals.filter(w => w.vendorId === currentVendor.id).length})
            </h3>

            {withdrawals.filter(w => w.vendorId === currentVendor.id).length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                No withdrawals requested yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {withdrawals.filter(w => w.vendorId === currentVendor.id).map(w => (
                  <div key={w.id} className="py-3.5 flex justify-between items-center gap-3">
                    <div className="space-y-1 text-left">
                      <p className="text-xs font-black text-slate-900 dark:text-slate-100">
                        {formatPrice(w.amount)}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        via {w.method.toUpperCase()} &bull; {w.details}
                      </p>
                      <p className="text-[9px] text-slate-400">Requested: {new Date(w.createdAt).toLocaleDateString()}</p>
                    </div>

                    <span className={`text-[10px] font-black uppercase px-2 py-1 rounded ${
                      w.status === 'approved' 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : w.status === 'pending'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {w.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
