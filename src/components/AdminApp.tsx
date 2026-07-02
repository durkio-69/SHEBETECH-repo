import React, { useState, useEffect } from 'react';
import { 
  getDokanVendors, 
  saveDokanVendors, 
  getDokanWithdrawals, 
  saveDokanWithdrawals, 
  getDokanOrders, 
  saveDokanOrders, 
  getDokanCategories, 
  saveDokanCategories,
  DokanVendor, 
  WithdrawalRequest, 
  DokanOrder,
  DokanCategory
} from '../lib/dokanStore';
import { 
  ShieldAlert, 
  CheckCircle, 
  XCircle, 
  DollarSign, 
  Briefcase, 
  Users, 
  ShoppingBag, 
  FolderPlus, 
  Star, 
  Settings, 
  TrendingUp, 
  Truck, 
  MessageSquare,
  Percent,
  Check,
  X,
  Plus,
  Trash2,
  Lock,
  Compass,
  Tag
} from 'lucide-react';
import { Product } from '../types';

interface AdminAppProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  formatPrice: (priceInUgx: number) => string;
}

export default function AdminApp({ products, setProducts, formatPrice }: AdminAppProps) {
  const [vendors, setVendors] = useState<DokanVendor[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [orders, setOrders] = useState<DokanOrder[]>([]);
  const [categories, setCategories] = useState<DokanCategory[]>([]);
  const [activeTab, setActiveTab] = useState<'revenue' | 'vendors' | 'withdrawals' | 'orders' | 'catalog' | 'taxonomies' | 'reviews'>('revenue');

  // Taxonomy states
  const [newCatName, setNewCatName] = useState('');
  const [newBrand, setNewBrand] = useState('');
  const [newTag, setNewTag] = useState('');

  const [brandsList, setBrandsList] = useState<string[]>(['Tecno', 'Infinix', 'Apple', 'Samsung', 'Hisense', 'Nile Fresh']);
  const [tagsList, setTagsList] = useState<string[]>(['Dokan Pro', 'Verified', 'Bulky Cargo', 'Kampala Local', 'Discounted']);

  // Hydrate admin data
  useEffect(() => {
    setVendors(getDokanVendors());
    setWithdrawals(getDokanWithdrawals());
    setOrders(getDokanOrders());
    setCategories(getDokanCategories());
  }, []);

  // Sync state reactively
  useEffect(() => {
    const handleStorage = () => {
      setVendors(getDokanVendors());
      setWithdrawals(getDokanWithdrawals());
      setOrders(getDokanOrders());
      setCategories(getDokanCategories());
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Admin approves vendor store
  const handleApproveVendor = (vendorId: string) => {
    const updated = vendors.map(v => {
      if (v.id === vendorId) {
        return { ...v, status: 'approved' as const };
      }
      return v;
    });
    saveDokanVendors(updated);
    setVendors(updated);
    window.dispatchEvent(new Event('storage'));
    alert('Vendor profile successfully approved and published live!');
  };

  const handleRejectVendor = (vendorId: string) => {
    const updated = vendors.map(v => {
      if (v.id === vendorId) {
        return { ...v, status: 'rejected' as const };
      }
      return v;
    });
    saveDokanVendors(updated);
    setVendors(updated);
    window.dispatchEvent(new Event('storage'));
    alert('Vendor profile marked as rejected.');
  };

  // Admin approves withdrawal request
  const handleApproveWithdrawal = (reqId: string) => {
    const reqs = getDokanWithdrawals();
    const targetReq = reqs.find(r => r.id === reqId);
    if (!targetReq) return;

    targetReq.status = 'approved';
    saveDokanWithdrawals(reqs);
    setWithdrawals(reqs);
    window.dispatchEvent(new Event('storage'));
    alert('Withdrawal wire approved! Funds released to vendor coordinates.');
  };

  // Admin declines withdrawal request (returns funds back to vendor)
  const handleDeclineWithdrawal = (reqId: string) => {
    const reqs = getDokanWithdrawals();
    const targetReq = reqs.find(r => r.id === reqId);
    if (!targetReq) return;

    targetReq.status = 'rejected';
    saveDokanWithdrawals(reqs);
    setWithdrawals(reqs);

    // return funds to vendor balance
    const updatedVendors = vendors.map(v => {
      if (v.id === targetReq.vendorId) {
        return {
          ...v,
          balance: v.balance + targetReq.amount
        };
      }
      return v;
    });
    saveDokanVendors(updatedVendors);
    setVendors(updatedVendors);

    window.dispatchEvent(new Event('storage'));
    alert('Withdrawal wire declined. Funds returned to vendor account ledger.');
  };

  // Admin creates dynamic category
  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName) return;

    const newSlug = newCatName.toLowerCase().replace(/\s+/g, '-');
    const newCat: DokanCategory = {
      id: newSlug,
      name: newCatName,
      icon: 'FolderPlus',
      imageUrl: ''
    };

    const currentCats = getDokanCategories();
    const updated = [...currentCats, newCat];
    saveDokanCategories(updated);
    setCategories(updated);
    setNewCatName('');
    window.dispatchEvent(new Event('storage'));
    alert(`WooCommerce Taxonomy: Category "${newCatName}" published and sent to Vendor dashboards!`);
  };

  // Create tags & brands
  const handleCreateBrand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrand) return;
    setBrandsList([...brandsList, newBrand]);
    setNewBrand('');
    alert(`Brand "${newBrand}" registered successfully!`);
  };

  const handleCreateTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTag) return;
    setTagsList([...tagsList, newTag]);
    setNewTag('');
    alert(`Tag "${newTag}" registered successfully!`);
  };

  // Admin deletes catalog item (moderator power)
  const handleDeleteProduct = (prodId: string) => {
    if (confirm("Are you sure you want to moderate and DELETE this product from Olimart?")) {
      const filtered = products.filter(p => p.id !== prodId);
      setProducts(filtered);
    }
  };

  // Calculate global platform revenue (15% commissions accumulated)
  const platformCommissionsTotal = orders.reduce((acc, curr) => acc + (curr.commission || 0), 0);
  const totalVolumeGross = orders.reduce((acc, curr) => acc + (curr.subtotal || 0), 0);

  // Get all customer reviews across products
  const allReviews = products.flatMap(p => 
    p.reviews ? p.reviews.map(r => ({ ...r, productTitle: p.title, productImage: p.image })) : []
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6" id="dokan-admin-dashboard-root">
      
      {/* Super Admin Top Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-orange-600 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1">
              <ShieldAlert size={12} /> Super Admin Control
            </span>
            <span className="text-slate-400 text-xs font-mono">Dokan Pro Engine v3.14</span>
          </div>
          <h2 className="text-xl font-black">OliMart Central Ledger Dashboard</h2>
          <p className="text-xs text-slate-400">
            Audit store applications, monitor 15% platform commissions, evaluate escrow payouts, and manage catalog taxonomies.
          </p>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 flex gap-4">
          <div className="text-left">
            <p className="text-[10px] text-slate-400 font-bold uppercase">15% Comm. Revenue</p>
            <p className="text-lg font-mono font-black text-emerald-400">
              {formatPrice(platformCommissionsTotal)}
            </p>
          </div>
          <div className="w-[1px] bg-slate-700" />
          <div className="text-left">
            <p className="text-[10px] text-slate-400 font-bold uppercase">Escrow Gross Volume</p>
            <p className="text-lg font-mono font-black text-amber-400">
              {formatPrice(totalVolumeGross)}
            </p>
          </div>
        </div>
      </div>

      {/* Admin Navigation tabs */}
      <div className="flex items-center overflow-x-auto gap-2 border-b border-slate-200 pb-1">
        <button
          onClick={() => setActiveTab('revenue')}
          className={`px-4 py-2 text-xs font-black uppercase tracking-wider border-b-2 cursor-pointer transition-colors ${
            activeTab === 'revenue' ? 'border-orange-600 text-orange-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Commission Ledger
        </button>
        <button
          onClick={() => setActiveTab('vendors')}
          className={`px-4 py-2 text-xs font-black uppercase tracking-wider border-b-2 cursor-pointer transition-colors ${
            activeTab === 'vendors' ? 'border-orange-600 text-orange-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Vendor Approvals ({vendors.filter(v => v.status === 'pending').length} pending)
        </button>
        <button
          onClick={() => setActiveTab('withdrawals')}
          className={`px-4 py-2 text-xs font-black uppercase tracking-wider border-b-2 cursor-pointer transition-colors ${
            activeTab === 'withdrawals' ? 'border-orange-600 text-orange-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Withdrawal Requests ({withdrawals.filter(w => w.status === 'pending').length} pending)
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 text-xs font-black uppercase tracking-wider border-b-2 cursor-pointer transition-colors ${
            activeTab === 'orders' ? 'border-orange-600 text-orange-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Order Radar Tracker ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab('catalog')}
          className={`px-4 py-2 text-xs font-black uppercase tracking-wider border-b-2 cursor-pointer transition-colors ${
            activeTab === 'catalog' ? 'border-orange-600 text-orange-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Moderate Catalog ({products.length})
        </button>
        <button
          onClick={() => setActiveTab('taxonomies')}
          className={`px-4 py-2 text-xs font-black uppercase tracking-wider border-b-2 cursor-pointer transition-colors ${
            activeTab === 'taxonomies' ? 'border-orange-600 text-orange-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Add Categories, Brands & Tags
        </button>
        <button
          onClick={() => setActiveTab('reviews')}
          className={`px-4 py-2 text-xs font-black uppercase tracking-wider border-b-2 cursor-pointer transition-colors ${
            activeTab === 'reviews' ? 'border-orange-600 text-orange-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Customers Reviews ({allReviews.length})
        </button>
      </div>

      {/* TAB 1: COMMISSION LEDGER */}
      {activeTab === 'revenue' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl text-left space-y-1">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Central Escrow Collection</p>
              <p className="text-xl font-black text-slate-900 dark:text-slate-100">
                {formatPrice(totalVolumeGross + orders.reduce((acc, curr) => acc + (curr.deliveryFee || 0), 0))}
              </p>
              <p className="text-[9px] text-slate-500">Includes dynamic transport courier fees</p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl text-left space-y-1">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">15% Net Commission Revenue</p>
              <p className="text-xl font-black text-emerald-600">
                {formatPrice(platformCommissionsTotal)}
              </p>
              <p className="text-[9px] text-slate-500">Olimart Platform collected revenue</p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl text-left space-y-1">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Vendors Net Share (85%)</p>
              <p className="text-xl font-black text-amber-600">
                {formatPrice(orders.reduce((acc, curr) => acc + (curr.vendorEarnings || 0), 0))}
              </p>
              <p className="text-[9px] text-slate-500">Directly withdrawable by partners</p>
            </div>

          </div>

          {/* Payments Done History */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 text-left">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-1">
              <Percent size={14} className="text-orange-600" /> Payments Audited Ledger
            </h3>

            {orders.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">No orders completed yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-black uppercase text-slate-400 text-left">
                      <th className="pb-2">Invoice ID</th>
                      <th className="pb-2">Customer Coordinates</th>
                      <th className="pb-2">Gateway Mode</th>
                      <th className="pb-2">Total Charged</th>
                      <th className="pb-2">15% Commission Cut</th>
                      <th className="pb-2">Vendor earnings (85%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                    {orders.map(o => (
                      <tr key={o.id}>
                        <td className="py-3 font-bold text-slate-900 dark:text-slate-100">{o.id}</td>
                        <td className="py-3">
                          <p className="font-sans font-black">{o.customerName}</p>
                          <p className="text-[9px] text-slate-400">{o.customerPhone}</p>
                        </td>
                        <td className="py-3">
                          <span className="bg-slate-100 dark:bg-slate-800 text-[9px] font-bold px-2 py-0.5 rounded text-slate-700 dark:text-slate-300 uppercase">
                            {o.paymentMethod}
                          </span>
                        </td>
                        <td className="py-3 text-slate-900 dark:text-slate-200">{formatPrice(o.total)}</td>
                        <td className="py-3 text-rose-600">+{formatPrice(o.commission)}</td>
                        <td className="py-3 text-emerald-600">+{formatPrice(o.vendorEarnings)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: VENDOR APPROVALS */}
      {activeTab === 'vendors' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 text-left space-y-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-100">
            Partner Store Management & Dokan Onboarding approvals
          </h3>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {vendors.map(v => (
              <div key={v.id} className="py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-black text-slate-900 dark:text-slate-100">{v.name}</p>
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                      v.status === 'approved' 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : v.status === 'pending'
                        ? 'bg-amber-100 text-amber-800 animate-pulse'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {v.status}
                    </span>
                  </div>

                  <div className="text-[11px] font-bold text-slate-500 space-y-0.5">
                    <p>👤 Owner: <span className="text-slate-700 dark:text-slate-300">{v.ownerName}</span> &bull; ✉️ {v.email}</p>
                    <p>📞 Phone: {v.phone} &bull; 📍 Store Base: {v.location}</p>
                    <p>💳 payout Route: <span className="font-mono text-slate-800 dark:text-slate-200">{v.paymentDetails}</span></p>
                  </div>
                </div>

                <div className="flex gap-2">
                  {v.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleApproveVendor(v.id)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer"
                      >
                        <Check size={12} /> Approve Store
                      </button>
                      <button
                        onClick={() => handleRejectVendor(v.id)}
                        className="bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-black uppercase px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer"
                      >
                        <X size={12} /> Reject
                      </button>
                    </>
                  )}
                  
                  {v.status === 'approved' && (
                    <span className="text-[10px] text-emerald-600 font-extrabold flex items-center gap-1">
                      ✅ Partner Published Live
                    </span>
                  )}

                  {v.status === 'rejected' && (
                    <span className="text-[10px] text-rose-600 font-extrabold flex items-center gap-1">
                      ❌ Onboarding Denied
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: WITHDRAWAL REQUESTS */}
      {activeTab === 'withdrawals' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 text-left space-y-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-100">
            Escrow Wallet Payout Clearance Panel
          </h3>

          {withdrawals.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">No payout requests pending.</div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {withdrawals.map(w => (
                <div key={w.id} className="py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="space-y-1">
                    <p className="text-xs font-black text-slate-900 dark:text-slate-100">
                      Store: <span className="text-orange-600">{w.vendorName}</span>
                    </p>
                    <p className="text-sm font-black text-emerald-600 font-mono">
                      Requesting payout: {formatPrice(w.amount)}
                    </p>
                    <div className="text-[10px] text-slate-500 font-bold space-y-0.5">
                      <p>🏦 Wire Method: <span className="uppercase text-slate-800 dark:text-slate-200">{w.method}</span></p>
                      <p>🔑 Bank/MoMo destination: <span className="font-mono text-slate-800 dark:text-slate-200">{w.details}</span></p>
                    </div>
                  </div>

                  <div className="flex gap-2 shrink-0">
                    {w.status === 'pending' ? (
                      <>
                        <button
                          onClick={() => handleApproveWithdrawal(w.id)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer"
                        >
                          <Check size={12} /> Clear payout
                        </button>
                        <button
                          onClick={() => handleDeclineWithdrawal(w.id)}
                          className="bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-black uppercase px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer"
                        >
                          <X size={12} /> Decline
                        </button>
                      </>
                    ) : (
                      <span className={`text-[10px] font-black uppercase px-2 py-1 rounded ${
                        w.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        Cleared payout Status: {w.status.toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: ORDER RADAR TRACKER */}
      {activeTab === 'orders' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 text-left space-y-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-100">
            Uganda Boda Boda Logistics & Order Radar Tracking
          </h3>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {orders.map(o => (
              <div key={o.id} className="py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-black text-slate-950 dark:text-white">{o.id}</span>
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                      o.status === 'placed' 
                        ? 'bg-blue-100 text-blue-800' 
                        : o.status === 'dispatched' 
                        ? 'bg-amber-100 text-amber-800' 
                        : o.status === 'transit'
                        ? 'bg-purple-100 text-purple-800 animate-pulse'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      Status: {o.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="text-[11px] font-bold text-slate-500 space-y-0.5">
                    <p>👤 Client: {o.customerName} ({o.customerLocation})</p>
                    <p>🛣️ Logistics routing distance: <span className="text-orange-600 font-mono font-black">{o.distanceKm} km</span></p>
                    <p>🚚 Courier fee: <span className="text-slate-800 dark:text-slate-200">{formatPrice(o.deliveryFee)}</span></p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1 font-mono text-xs">
                  <p className="font-sans text-slate-400 text-[10px]">Total collected:</p>
                  <p className="font-black text-slate-900 dark:text-white">{formatPrice(o.total)}</p>
                  <div className="flex gap-1.5 mt-1">
                    <button
                      onClick={() => {
                        const updated = orders.map(curr => {
                          if (curr.id === o.id) {
                            return { ...curr, status: 'transit' as const };
                          }
                          return curr;
                        });
                        saveDokanOrders(updated);
                        setOrders(updated);
                        window.dispatchEvent(new Event('storage'));
                      }}
                      className="bg-purple-600 hover:bg-purple-500 text-white text-[9px] font-black uppercase px-2.5 py-1 rounded cursor-pointer"
                    >
                      Dispatch Rider
                    </button>
                    <button
                      onClick={() => {
                        const updated = orders.map(curr => {
                          if (curr.id === o.id) {
                            return { ...curr, status: 'delivered' as const };
                          }
                          return curr;
                        });
                        saveDokanOrders(updated);
                        setOrders(updated);
                        window.dispatchEvent(new Event('storage'));
                      }}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-[9px] font-black uppercase px-2.5 py-1 rounded cursor-pointer"
                    >
                      Mark Drop Delivered
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: MODERATE CATALOG */}
      {activeTab === 'catalog' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 text-left space-y-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-100">
            Catalog moderator (Moderation of products posted by ALL vendors)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {products.map(p => (
              <div key={p.id} className="border border-slate-100 dark:border-slate-800 rounded-2xl p-3.5 space-y-3 flex flex-col justify-between">
                <div className="flex gap-3">
                  <img
                    src={p.image}
                    alt={p.title}
                    className="w-12 h-12 object-contain bg-slate-50 dark:bg-slate-800 rounded-lg"
                  />
                  <div className="space-y-0.5">
                    <p className="text-xs font-black text-slate-900 dark:text-white line-clamp-2">{p.title}</p>
                    <p className="text-[10px] text-slate-400 capitalize">Category: {p.category}</p>
                    <p className="text-[11px] font-black text-slate-950 dark:text-slate-100">{formatPrice(p.price)}</p>
                  </div>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800 pt-2 flex items-center justify-between text-[10px] font-extrabold text-slate-500">
                  <span>Brand: {p.brand}</span>
                  <button
                    onClick={() => handleDeleteProduct(p.id)}
                    className="text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer font-black"
                  >
                    <Trash2 size={12} /> Moderate & Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: TAXONOMIES */}
      {activeTab === 'taxonomies' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          
          {/* Create Categories */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
              <FolderPlus size={16} className="text-orange-600" /> Create Category
            </h3>
            <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
              Every category created goes directly to the Vendors dashboard as categories available!
            </p>

            <form onSubmit={handleCreateCategory} className="space-y-3 text-xs font-semibold">
              <input
                type="text"
                required
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="e.g. Solar Energy, Agro-Cargo"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none"
              />
              <button
                type="submit"
                className="w-full bg-orange-600 hover:bg-orange-500 text-white font-black uppercase py-2 rounded-lg cursor-pointer"
              >
                Publish Category
              </button>
            </form>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Currently available categories:</p>
              <div className="flex flex-wrap gap-1.5">
                {categories.map(c => (
                  <span key={c.id} className="bg-slate-50 dark:bg-slate-800 border border-slate-150 dark:border-slate-700 text-[10px] font-black px-2 py-1 rounded-md text-slate-700 dark:text-slate-300 capitalize">
                    📁 {c.name}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Create Brands */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
              <Compass size={16} className="text-orange-600" /> Register Brand
            </h3>

            <form onSubmit={handleCreateBrand} className="space-y-3 text-xs font-semibold">
              <input
                type="text"
                required
                value={newBrand}
                onChange={(e) => setNewBrand(e.target.value)}
                placeholder="e.g. Huawei, LG"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none"
              />
              <button
                type="submit"
                className="w-full bg-orange-600 hover:bg-orange-500 text-white font-black uppercase py-2 rounded-lg cursor-pointer"
              >
                Publish Brand
              </button>
            </form>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Registered Brand Taxonomies:</p>
              <div className="flex flex-wrap gap-1.5">
                {brandsList.map((b, i) => (
                  <span key={i} className="bg-slate-50 dark:bg-slate-800 border border-slate-150 dark:border-slate-700 text-[10px] font-black px-2.5 py-1 rounded-md text-slate-700 dark:text-slate-300">
                    🏷️ {b}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Create Tags */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
              <Tag size={16} className="text-orange-600" /> Register Tag
            </h3>

            <form onSubmit={handleCreateTag} className="space-y-3 text-xs font-semibold">
              <input
                type="text"
                required
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="e.g. Bulk Discount, 1YearWarranty"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none"
              />
              <button
                type="submit"
                className="w-full bg-orange-600 hover:bg-orange-500 text-white font-black uppercase py-2 rounded-lg cursor-pointer"
              >
                Publish Tag
              </button>
            </form>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Registered Tag Taxonomies:</p>
              <div className="flex flex-wrap gap-1.5">
                {tagsList.map((t, i) => (
                  <span key={i} className="bg-slate-50 dark:bg-slate-800 border border-slate-150 dark:border-slate-700 text-[10px] font-black px-2.5 py-1 rounded-md text-slate-700 dark:text-slate-300">
                    # {t}
                  </span>
                ))}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* TAB 7: REVIEWS */}
      {activeTab === 'reviews' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 text-left space-y-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
            <MessageSquare size={16} className="text-orange-600" /> Customer Comments & Reviews Moderator
          </h3>

          {allReviews.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">No customer reviews published yet.</div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {allReviews.map((r, i) => (
                <div key={i} className="py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <img
                        src={r.productImage}
                        alt=""
                        className="w-8 h-8 object-contain bg-slate-50 rounded"
                      />
                      <div>
                        <p className="font-black text-slate-800 dark:text-slate-200">{r.productTitle}</p>
                        <p className="text-[10px] text-slate-400">Reviewer: {r.name}</p>
                      </div>
                    </div>

                    <p className="text-slate-600 dark:text-slate-300 italic font-medium leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl">
                      &ldquo;{r.text}&rdquo;
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <div className="flex text-amber-400">
                      {[...Array(5)].map((_, idx) => (
                        <Star key={idx} size={12} fill={idx < r.rating ? 'currentColor' : 'none'} />
                      ))}
                    </div>
                    <span className="text-[10px] text-slate-400">{r.date}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
