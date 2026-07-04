import React, { useState, useEffect } from 'react';
import { 
  getDokanOrders, 
  saveDokanOrders, 
  DokanOrder,
  getDokanRiders,
  saveDokanRiders,
  DokanRider
} from '../lib/dokanStore';
import { 
  Truck, 
  Phone, 
  MessageSquare, 
  MapPin, 
  Navigation, 
  DollarSign, 
  Navigation2, 
  User, 
  Check, 
  X, 
  CheckSquare, 
  PhoneCall, 
  ChevronRight, 
  Smile,
  ShieldCheck,
  Locate
} from 'lucide-react';

interface DeliveryAppProps {
  formatPrice: (priceInUgx: number) => string;
}

export default function DeliveryApp({ formatPrice }: DeliveryAppProps) {
  // Hydrate from central Dokan Store
  const [riders, setRiders] = useState<DokanRider[]>(() => getDokanRiders());
  const [activeRider, setActiveRider] = useState<DokanRider>(() => {
    const list = getDokanRiders();
    // Prefer Ronald Express or fallback
    return list.find(r => r.id === 'r2') || list[0];
  });
  const [orders, setOrders] = useState<DokanOrder[]>([]);
  const [activeJob, setActiveJob] = useState<DokanOrder | null>(null);

  // Call modal state
  const [isCalling, setIsCalling] = useState(false);
  const [callingName, setCallingName] = useState('');
  const [callingPhone, setCallingPhone] = useState('');

  // Hydrate order details
  useEffect(() => {
    const list = getDokanOrders();
    setOrders(list);

    // If rider has an active transit job, lock it in activeJob
    const inTransit = list.find(o => o.status === 'transit' || o.status === 'dispatched');
    if (inTransit) {
      setActiveJob(inTransit);
    }
  }, []);

  // Sync state reactively
  useEffect(() => {
    const handleStorage = () => {
      const list = getDokanOrders();
      setOrders(list);
      
      const freshRiders = getDokanRiders();
      setRiders(freshRiders);
      setActiveRider(prev => {
        const found = freshRiders.find(r => r.id === prev.id);
        return found || prev;
      });

      if (activeJob) {
        const refreshed = list.find(o => o.id === activeJob.id);
        if (refreshed) {
          setActiveJob(refreshed);
        } else {
          setActiveJob(null);
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [activeJob]);

  // Rider accepts a job
  const handleAcceptJob = (orderId: string) => {
    const list = getDokanOrders();
    const updated = list.map(o => {
      if (o.id === orderId) {
        return { ...o, status: 'transit' as const };
      }
      return o;
    });
    saveDokanOrders(updated);
    setOrders(updated);

    const targeted = updated.find(o => o.id === orderId) || null;
    setActiveJob(targeted);
    window.dispatchEvent(new Event('storage'));
    alert('Logistics Handshake Success! Navigation coordinates loaded. Head to the vendor to pick up the cargo.');
  };

  // Rider cancels job
  const handleCancelJob = (orderId: string) => {
    const list = getDokanOrders();
    const updated = list.map(o => {
      if (o.id === orderId) {
        return { ...o, status: 'placed' as const }; // reset to vendor queue
      }
      return o;
    });
    saveDokanOrders(updated);
    setOrders(updated);
    setActiveJob(null);
    window.dispatchEvent(new Event('storage'));
    alert('Delivery job cancelled. Order has been returned to the central vendor queue.');
  };

  // Deliver order
  const handleDeliverJob = (orderId: string) => {
    const list = getDokanOrders();
    const updated = list.map(o => {
      if (o.id === orderId) {
        return { ...o, status: 'delivered' as const };
      }
      return o;
    });
    saveDokanOrders(updated);
    setOrders(updated);

    // Reward rider earnings!
    const job = list.find(o => o.id === orderId);
    if (job) {
      const feeEarned = job.deliveryFee || 6500;
      const updatedRiders = riders.map(r => {
        if (r.id === activeRider.id) {
          return {
            ...r,
            completedDeliveries: (r.completedDeliveries || 0) + 1,
            earnings: (r.earnings || 0) + feeEarned
          };
        }
        return r;
      });
      setRiders(updatedRiders);
      saveDokanRiders(updatedRiders);
      const updatedProfile = updatedRiders.find(r => r.id === activeRider.id);
      if (updatedProfile) setActiveRider(updatedProfile);
    }

    setActiveJob(null);
    window.dispatchEvent(new Event('storage'));
    alert('Congratulations! Order delivered successfully. Delivery fee credited to your Boda Ledger!');
  };

  // Trigger VoIP Dialing modal
  const triggerDialer = (customerName: string, customerPhone: string) => {
    setCallingName(customerName);
    setCallingPhone(customerPhone);
    setIsCalling(true);
  };

  // Trigger WhatsApp Messaging API redirection
  const triggerWhatsApp = (orderId: string, customerName: string, customerPhone: string, location: string) => {
    const cleanedPhone = customerPhone.replace(/\s+/g, '').replace(/^0/, '256');
    const message = `Hi ${customerName}, this is your Olimart Boda courier rider (${activeRider.name}). I am delivering your order *${orderId}* to *${location}*. Please keep your phone close so I can call you on approach. Mwebale kusiima!`;
    const encodedText = encodeURIComponent(message);
    const waLink = `https://wa.me/${cleanedPhone}?text=${encodedText}`;
    
    // Open in new tab securely
    window.open(waLink, '_blank');
  };

  const pendingJobs = orders.filter(o => o.status === 'placed' || o.status === 'dispatched');

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6" id="dokan-courier-portal-root">
      
      {/* Top Banner & Identity Switcher */}
      <div className="bg-gradient-to-r from-emerald-700 to-teal-800 text-white rounded-3xl p-6 shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1 text-left">
          <div className="flex items-center gap-2">
            <span className="bg-emerald-900 text-3xs font-black px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1">
              🏍️ Kampala Boda Courier
            </span>
            <span className="text-emerald-200 text-xs font-mono">PLATE: {activeRider.motorcyclePlate}</span>
          </div>
          <h2 className="text-xl font-black">{activeRider.name}</h2>
          <p className="text-xs text-emerald-100 flex items-center gap-1.5">
            📍 Base: {activeRider.location} &bull; Completed Drops: {activeRider.completedDeliveries}
          </p>
        </div>

        {/* Change Rider Switcher */}
        <div className="flex items-center gap-3 bg-emerald-900/40 p-2.5 rounded-xl border border-emerald-500/20 text-slate-800 shrink-0">
          <span className="text-3xs font-black text-white uppercase">Switch Rider:</span>
          <select
            value={activeRider.id}
            onChange={(e) => {
              const target = riders.find(r => r.id === e.target.value);
              if (target) {
                setActiveRider(target);
                setActiveJob(null);
              }
            }}
            className="bg-white px-2 py-1.5 rounded-lg text-xs font-black focus:outline-none"
          >
            {riders.map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Conditional Pending State (Waiting Page) vs. Active Dashboard */}
      {activeRider?.status === 'pending' ? (
        <div className="space-y-6" id="rider-onboarding-waiting-page">
          
          {/* Header Block */}
          <div className="bg-amber-50 dark:bg-slate-900 border border-amber-300 dark:border-amber-900/60 rounded-3xl p-6 text-left flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="space-y-2">
              <span className="bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 text-3xs font-black px-2.5 py-1 rounded uppercase tracking-wider font-mono animate-pulse inline-block">
                ⚠️ ONBOARDING STATUS: AWAITING ADMIN APPROVAL
              </span>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">Your Courier Account is Being Verified</h3>
              <p className="text-xs text-slate-500 font-semibold leading-relaxed max-w-xl">
                Olimart Logistics conducts compliance checks on your National ID Card and Driving Permit to guarantee cargo safety. 
                Once the Super Admin approves your application, your active Boda Dispatch Dashboard will load automatically.
              </p>
            </div>
            <button
              onClick={() => {
                const list = getDokanRiders();
                const updated = list.map(r => r.id === activeRider.id ? { ...r, status: 'approved' as const } : r);
                saveDokanRiders(updated);
                setRiders(updated);
                setActiveRider(prev => ({ ...prev, status: 'approved' }));
                window.dispatchEvent(new Event('storage'));
                alert("🎉 ADMIN SIMULATOR SUCCESS:\nRider approved! Access Link activated. Opening your dispatcher dashboard.");
              }}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs uppercase px-5 py-3 rounded-xl shadow-md transform transition-transform duration-200 active:scale-95 cursor-pointer flex items-center gap-2 shrink-0"
            >
              <ShieldCheck size={16} />
              <span>[Simulator] Admin Quick-Approve</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            
            {/* Left Column: Registered Courier Details */}
            <div className="md:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 text-left space-y-5">
              <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-3">
                📋 Your Onboarding Dossier
              </h4>

              <div className="flex items-center gap-4">
                <img 
                  src={activeRider.pictureUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=60'} 
                  alt="Rider Portrait" 
                  className="w-16 h-16 rounded-full object-cover border-2 border-emerald-500 shadow-sm"
                />
                <div>
                  <p className="text-3xs text-slate-400 font-black uppercase">AUTO-GENERATED USER ID</p>
                  <p className="text-base font-mono font-black text-emerald-600">{activeRider.id}</p>
                </div>
              </div>

              <div className="space-y-3.5 pt-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-3xs text-slate-400 uppercase">FULL NAME</p>
                    <p className="font-black text-slate-900 dark:text-white">{activeRider.name}</p>
                  </div>
                  <div>
                    <p className="text-3xs text-slate-400 uppercase">CONTACT TELEPHONE</p>
                    <p className="font-black text-slate-900 dark:text-white">{activeRider.phone}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-3xs text-slate-400 uppercase">EMAIL ADDRESS</p>
                    <p className="font-black text-slate-900 dark:text-white">{activeRider.email || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-3xs text-slate-400 uppercase font-bold text-[#f68b1e]">COMPULSORY NATIONAL ID</p>
                    <p className="font-mono font-black text-slate-900 dark:text-amber-100">{activeRider.idCard || 'Verified via NIRA'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-800/80 pt-3">
                  <div>
                    <p className="text-3xs text-slate-400 uppercase">VEHICLE PLATE (REG NO)</p>
                    <p className="font-black font-mono text-slate-900 dark:text-white uppercase">{activeRider.motorcyclePlate}</p>
                  </div>
                  <div>
                    <p className="text-3xs text-slate-400 uppercase">DRIVING PERMIT CODE</p>
                    <p className="font-mono font-black text-slate-900 dark:text-white uppercase">{activeRider.drivingPermit}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-3xs text-slate-400 uppercase">TRANSPORT MEANS</p>
                    <p className="font-black text-emerald-600 uppercase">{activeRider.transportMeans.toUpperCase()}</p>
                  </div>
                  <div>
                    <p className="text-3xs text-slate-400 uppercase">OPERATING HUB BASE</p>
                    <p className="font-black text-slate-950 dark:text-white">{activeRider.location}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Simulated WhatsApp, Email, and SMS Alerts with dashboard Link */}
            <div className="md:col-span-7 space-y-6">
              
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 text-left space-y-4">
                <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>Simulated Multi-Channel Admin Approval Notifications</span>
                </h4>
                <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                  The moment the Super Admin clicks 'Approve', Olimart triggers automated API webhooks sending SMS, WhatsApp, and Email digests with a secure access token to bypass authentication.
                </p>

                {/* Simulated Smartphone Container */}
                <div className="space-y-4 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                  
                  {/* WhatsApp Simulation */}
                  <div className="bg-emerald-500/10 border-l-4 border-emerald-500 p-3 rounded-r-xl space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-3xs text-emerald-600 font-black uppercase flex items-center gap-1">
                        💬 WhatsApp Notification API
                      </span>
                      <span className="text-3xs text-slate-400 font-bold">Just Now</span>
                    </div>
                    <p className="text-xs text-slate-800 dark:text-slate-200 font-medium">
                      "Hi <span className="font-black">{activeRider.name.split(' [')[0]}</span>, congratulations! Your Olimart Courier Profile has been approved by our central safety team. You can now access your dispatcher dashboard instantly via this link: <span className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline cursor-pointer">https://olimart-courier.ug/dashboard/{activeRider.id}</span>"
                    </p>
                  </div>

                  {/* SMS Simulation */}
                  <div className="bg-sky-500/10 border-l-4 border-sky-500 p-3 rounded-r-xl space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-3xs text-sky-600 font-black uppercase flex items-center gap-1">
                        📱 SMS Cellular Gateway
                      </span>
                      <span className="text-3xs text-slate-400 font-bold">1m ago</span>
                    </div>
                    <p className="text-xs text-slate-800 dark:text-slate-200 font-medium">
                      "OLIMART DISPATCH: Driver account approved. Access active cargo boards immediately using your unique ID: <span className="font-bold text-sky-600">{activeRider.id}</span>. Access Link: <span className="text-sky-600 hover:underline cursor-pointer">https://olimart-courier.ug/dashboard/{activeRider.id}</span>"
                    </p>
                  </div>

                  {/* Email Simulation */}
                  <div className="bg-indigo-500/10 border-l-4 border-indigo-500 p-3 rounded-r-xl space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-3xs text-indigo-600 font-black uppercase flex items-center gap-1">
                        ✉️ Email Delivery Hub
                      </span>
                      <span className="text-3xs text-slate-400 font-bold">2m ago</span>
                    </div>
                    <p className="text-xs text-slate-800 dark:text-slate-200 font-medium">
                      <span className="font-bold text-slate-900 dark:text-white">Subject: Olimart Courier Partnership Welcome Kit</span><br />
                      "Your documents (ID: {activeRider.idCard}) have passed central screening. Enclosed is your digital handbook. Navigate to your dashboard link to accept your first cargo bid: <span className="text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer">https://olimart-courier.ug/dashboard/{activeRider.id}</span>"
                    </p>
                  </div>

                </div>
              </div>
              
            </div>

          </div>

        </div>
      ) : (
        <>
          {/* Quick stats banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex justify-between items-center text-left shadow-xs">
              <div>
                <p className="text-3xs font-black text-slate-400 uppercase">My Wallet Earnings</p>
                <p className="text-lg font-black text-slate-900 dark:text-white">{formatPrice(activeRider.earnings || 0)}</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-black">UGX</div>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex justify-between items-center text-left shadow-xs">
              <div>
                <p className="text-3xs font-black text-slate-400 uppercase">Drops Completed</p>
                <p className="text-lg font-black text-slate-900 dark:text-white">{activeRider.completedDeliveries || 0} Drops</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <Check size={18} />
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex justify-between items-center text-left shadow-xs">
              <div>
                <p className="text-3xs font-black text-slate-400 uppercase">Current Job Status</p>
                <p className="text-lg font-black text-emerald-600">
                  {activeJob ? 'Active Navigation' : 'Awaiting Bids'}
                </p>
              </div>
              <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center animate-pulse">
                <Navigation size={18} />
              </div>
            </div>
          </div>

      {/* Active Job Radar and Navigation */}
      {activeJob ? (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start" id="active-courier-transit">
          
          {/* Active HUD */}
          <div className="md:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl space-y-4 text-left shadow-sm">
            <div className="flex justify-between items-center">
              <span className="bg-amber-100 text-amber-800 text-3xs font-black px-2 py-0.5 rounded uppercase tracking-wider animate-pulse">
                Active Job: In Transit
              </span>
              <span className="text-xs font-mono font-black">{activeJob.id}</span>
            </div>

            <div className="space-y-3.5 border-t border-slate-100 dark:border-slate-800 pt-3 text-xs font-semibold">
              <div>
                <p className="text-slate-400 text-3xs uppercase font-bold">Landmark Destination</p>
                <div className="flex items-start gap-1.5 mt-1">
                  <MapPin size={16} className="text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-black text-slate-900 dark:text-slate-100">{activeJob.customerAddress}</p>
                    <p className="text-xs text-slate-500 font-bold">{activeJob.customerLocation}</p>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-slate-400 text-3xs uppercase font-bold">Client Contact</p>
                <p className="text-slate-850 dark:text-slate-200 font-black mt-1">{activeJob.customerName}</p>
                <p className="font-mono text-slate-500">{activeJob.customerPhone}</p>
              </div>

              <div>
                <p className="text-slate-400 text-3xs uppercase font-bold">Logistics Breakdown</p>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl text-left">
                    <p className="text-3xs text-slate-400">DISTANCE</p>
                    <p className="font-black font-mono text-slate-900 dark:text-white">{activeJob.distanceKm} Km</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl text-left">
                    <p className="text-3xs text-slate-400">COURIER FEE</p>
                    <p className="font-black font-mono text-emerald-600">{formatPrice(activeJob.deliveryFee)}</p>
                  </div>
                </div>
              </div>

              {/* Items in Cargo */}
              <div>
                <p className="text-slate-400 text-3xs uppercase font-bold mb-1.5">Cargo Manifest</p>
                <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl space-y-1">
                  {activeJob.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs font-bold">
                      <span className="text-slate-800 dark:text-slate-200">{it.product.title}</span>
                      <span className="text-orange-600">[{it.quantity}x]</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action buttons (CALL & WHATSAPP) */}
              <div className="space-y-2 pt-2">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => triggerDialer(activeJob.customerName, activeJob.customerPhone)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-xl flex items-center justify-center gap-1.5 font-black uppercase cursor-pointer text-3xs"
                  >
                    <Phone size={14} /> Call Customer
                  </button>
                  <button
                    onClick={() => triggerWhatsApp(activeJob.id, activeJob.customerName, activeJob.customerPhone, activeJob.customerLocation)}
                    className="bg-sky-600 hover:bg-sky-500 text-white py-2.5 rounded-xl flex items-center justify-center gap-1.5 font-black uppercase cursor-pointer text-3xs"
                  >
                    <MessageSquare size={14} /> Send WhatsApp
                  </button>
                </div>

                <button
                  onClick={() => handleDeliverJob(activeJob.id)}
                  className="w-full bg-orange-600 hover:bg-orange-500 text-white py-3.5 rounded-xl flex items-center justify-center gap-1.5 font-black uppercase cursor-pointer shadow-md text-xs"
                >
                  <CheckSquare size={16} /> Confirm Drop Delivered
                </button>

                <button
                  onClick={() => handleCancelJob(activeJob.id)}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 py-2 rounded-xl flex items-center justify-center gap-1 cursor-pointer text-3xs font-bold"
                >
                  <X size={12} /> Cancel Delivery Job
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Boda-Boda Radar map */}
          <div className="md:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl text-left space-y-4 shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
              <Navigation2 size={16} className="text-rose-600 animate-pulse" /> Kampala Courier GPS Radar Monitor
            </h3>

            {/* Simulated Live canvas map */}
            <div className="relative w-full h-[320px] bg-slate-100 dark:bg-slate-950 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex items-center justify-center">
              
              {/* Fake road grids */}
              <div className="absolute inset-0 opacity-15 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#334155 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
              <div className="absolute left-[30%] right-[30%] top-0 bottom-0 border-l border-r border-dashed border-slate-400 opacity-20" />
              <div className="absolute top-[40%] bottom-[40%] left-0 right-0 border-t border-b border-dashed border-slate-400 opacity-20" />

              {/* Vendor node */}
              <div className="absolute left-[20%] top-[30%] flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 border border-orange-400 flex items-center justify-center shadow">
                  🏪
                </div>
                <span className="text-3xs font-black bg-white/90 px-1 py-0.2 rounded mt-1 text-slate-800 border">Seller Store</span>
              </div>

              {/* Route line */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <path d="M 120 110 L 260 210" fill="none" stroke="#f68b1e" strokeWidth="3" strokeDasharray="6 4" className="animate-pulse" />
              </svg>

              {/* Pulsing courier Boda icon */}
              <div className="absolute left-[45%] top-[50%] flex flex-col items-center animate-bounce">
                <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg border-2 border-white">
                  🏍️
                </div>
                <span className="text-4xs font-bold bg-emerald-700 text-white px-1.5 rounded mt-1">Me (Plate: {activeRider.motorcyclePlate})</span>
              </div>

              {/* Customer node */}
              <div className="absolute right-[25%] bottom-[25%] flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 border border-rose-400 flex items-center justify-center shadow animate-pulse">
                  📍
                </div>
                <span className="text-3xs font-black bg-white/90 px-1 py-0.2 rounded mt-1 text-slate-800 border truncate max-w-[100px]">
                  {activeJob.customerName}
                </span>
              </div>

              <div className="absolute bottom-3 left-3 bg-slate-900/95 text-white p-2.5 rounded-xl text-3xs font-bold leading-tight space-y-0.5">
                <p>📍 CURRENT ROUTE: <span className="text-orange-400 font-black">Central Corridor Kampala</span></p>
                <p>🚦 TRAFFIC: <span className="text-emerald-400">Moderate Boda Clearance</span></p>
                <p>⌛ ESTIMATED DROP: <span className="text-amber-400 font-black">12 Mins</span></p>
              </div>

              <button className="absolute top-3 right-3 bg-white p-2 rounded-full shadow hover:bg-slate-50 cursor-pointer text-slate-700">
                <Locate size={16} />
              </button>
            </div>
          </div>

        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl text-left space-y-4 shadow-sm" id="courier-available-jobs-list">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
            <Truck size={16} className="text-emerald-600" /> Currently Posted Delivery Orders Queue ({pendingJobs.length} drops waiting)
          </h3>

          {pendingJobs.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                <Smile size={24} />
              </div>
              <p className="text-slate-400 text-xs font-bold">No Boda drops waiting inside Kampala right now!</p>
              <p className="text-3xs text-slate-400">Order from the consumer shop first to generate transit logs.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingJobs.map(o => (
                <div key={o.id} className="border border-slate-150 dark:border-slate-800 p-4 rounded-2xl space-y-3 flex flex-col justify-between hover:border-emerald-500/50 transition-colors">
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-mono font-black text-slate-900 dark:text-white">{o.id}</span>
                      <span className="bg-emerald-100 text-emerald-800 text-3xs font-black px-2 py-0.5 rounded uppercase">
                        Drop fee: {formatPrice(o.deliveryFee)}
                      </span>
                    </div>

                    <div className="space-y-1 text-slate-500 font-bold">
                      <p>👤 Receiver: <span className="text-slate-850 dark:text-slate-200">{o.customerName}</span></p>
                      <p className="line-clamp-1">📍 Landmark: <span className="text-slate-800 dark:text-slate-200">{o.customerAddress} ({o.customerLocation})</span></p>
                      <p>🛣️ Boda Route Distance: <span className="text-orange-600 font-mono font-black">{o.distanceKm} km</span></p>
                    </div>

                    <div className="pl-2 border-l-2 border-emerald-600 text-xs font-bold text-slate-700 dark:text-slate-300">
                      Cargo: {o.items.map(it => `${it.product.title} [x${it.quantity}]`).join(', ')}
                    </div>
                  </div>

                  <button
                    onClick={() => handleAcceptJob(o.id)}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase py-2.5 rounded-xl cursor-pointer shadow flex items-center justify-center gap-1 transition-colors"
                  >
                    <span>Accept Delivery Drop</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      </>
      )}

      {/* CALL MODAL (Simulated VoIP dialer) */}
      {isCalling && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-slate-950 text-white rounded-3xl p-6 w-full max-w-xs text-center space-y-6 border border-slate-800 animate-in fade-in zoom-in duration-200 shadow-2xl">
            <div className="space-y-2">
              <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto animate-pulse">
                <PhoneCall size={28} className="text-white" />
              </div>
              <p className="text-3xs text-slate-500 font-black uppercase tracking-wider font-mono">Dialing via Olimart VOIP Bridge</p>
              <h4 className="text-lg font-black">{callingName}</h4>
              <p className="text-xs text-slate-400 font-mono">{callingPhone}</p>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-emerald-400 font-bold animate-pulse">📞 Line Active & Calling...</p>
              <p className="text-3xs text-slate-500 font-medium">Auto-connecting to local telecom gateway.</p>
            </div>

            <button
              onClick={() => setIsCalling(false)}
              className="w-full bg-rose-600 hover:bg-rose-500 text-white py-2.5 rounded-xl font-black uppercase cursor-pointer text-xs"
            >
              Hang Up Call
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
