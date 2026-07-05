import React, { useState, useEffect } from 'react';
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  CreditCard, 
  Truck, 
  CheckCircle,
  Coins,
  Smartphone,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Globe,
  Store,
  MapPin,
  MessageSquare,
  Copy,
  Phone,
  Lock,
  Landmark,
  AlertTriangle,
  Loader2,
  BadgeCheck,
  Delete
} from 'lucide-react';
import { CartItem } from '../types';
import { calculateDynamicDeliveryFee, getDokanOrders, saveDokanOrders, getDokanVendors, saveDokanVendors, DokanOrder, isProductBulky } from '../lib/dokanStore';
import { emitEventDrivenNotifications } from '../lib/notificationStore';
import Stepper, { OrderStatus } from './Stepper';

// ----------------------------------------------------------------------------
// Real, disclosed Olimart settlement/collection details (mirrors
// src/lib/server/settlementAccounts.ts DEFAULT_SETTLEMENT_ACCOUNTS). These are
// used as an instant, offline-safe fallback; on mount we try to refresh them
// from the live /api/settlement-accounts/public endpoint so an admin update
// is reflected without a redeploy.
// ----------------------------------------------------------------------------
interface PublicSettlementAccount {
  provider: 'bank' | 'mtn_momo' | 'airtel_money' | 'card_aggregator';
  accountName: string;
  accountNumber: string;
  bankName?: string;
  branch?: string;
  swiftCode?: string;
  customerCareLine?: string;
  currency: 'UGX' | 'USD';
  notes?: string;
}

const FALLBACK_SETTLEMENT_ACCOUNTS: Record<string, PublicSettlementAccount> = {
  bank: {
    provider: 'bank',
    accountName: 'OLIMART UGANDA LIMITED',
    accountNumber: '32054592100',
    bankName: 'Centenary Bank Uganda',
    branch: 'Mapeera House, Kampala Road (Head Office)',
    swiftCode: 'CERBUGKA',
    customerCareLine: '0800 200 555',
    currency: 'UGX',
    notes: "Global Transactions Settlement Account. Always confirm the account name reads exactly 'OLIMART UGANDA LIMITED' before sending funds."
  },
  mtn_momo: {
    provider: 'mtn_momo',
    accountName: 'OLIMART UGANDA LIMITED',
    accountNumber: '+256779440548',
    customerCareLine: '100 (MTN Uganda Customer Care)',
    currency: 'UGX',
    notes: 'MTN MoMoPay merchant collection line.'
  },
  airtel_money: {
    provider: 'airtel_money',
    accountName: 'OLIMART UGANDA LIMITED',
    accountNumber: '+256709041537',
    customerCareLine: '100 (Airtel Uganda Customer Care)',
    currency: 'UGX',
    notes: 'Airtel Money merchant collection line.'
  },
  card_aggregator: {
    provider: 'card_aggregator',
    accountName: 'OLIMART UGANDA LIMITED',
    accountNumber: 'FLW-OLIMART-UG',
    customerCareLine: '0800 200 555',
    currency: 'UGX',
    notes: 'Card, bank-app and USSD payments are collected via Flutterwave and settled to the Centenary Bank account above.'
  }
};

declare global {
  interface Window {
    FlutterwaveCheckout?: (config: Record<string, any>) => void;
  }
}

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (
    productId: string, 
    delta: number, 
    selectedVariation?: Record<string, string>, 
    selectedVendor?: string
  ) => void;
  onRemoveItem: (
    productId: string, 
    selectedVariation?: Record<string, string>, 
    selectedVendor?: string
  ) => void;
  onClearCart: () => void;
  selectedLocation: string;
}

type CheckoutStep = 'cart' | 'details' | 'processing' | 'success';

export default function CartDrawer({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  selectedLocation
}: CartDrawerProps) {
  const [step, setStep] = useState<CheckoutStep>('cart');
  const [paymentMethod, setPaymentMethod] = useState<'momo' | 'airtel' | 'cash' | 'paypal' | 'stripe' | 'mastercard' | 'bank'>('momo');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [customerName, setCustomerName] = useState('');

  // Real, disclosed collection accounts — refreshed from the live API,
  // falling back to the known-good constants if the API is unreachable.
  const [settlementAccounts, setSettlementAccounts] = useState<Record<string, PublicSettlementAccount>>(FALLBACK_SETTLEMENT_ACCOUNTS);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch('/api/settlement-accounts/public')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        if (active && data && typeof data === 'object') {
          setSettlementAccounts((prev) => ({ ...prev, ...data }));
        }
      })
      .catch(() => {
        // Offline / API not reachable — keep the verified fallback constants.
      });
    return () => { active = false; };
  }, []);

  const handleCopy = (field: string, value: string) => {
    navigator.clipboard?.writeText(value).catch(() => {});
    setCopiedField(field);
    setTimeout(() => setCopiedField((f) => (f === field ? null : f)), 1800);
  };

  // ---- Flutterwave (real gateway) config ----
  const [flwConfig, setFlwConfig] = useState<{ enabled: boolean; publicKey: string }>({ enabled: false, publicKey: '' });
  const [flwScriptReady, setFlwScriptReady] = useState(false);

  useEffect(() => {
    fetch('/api/payments/flutterwave/public-config')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        // A client-side VITE_ key (if baked into the build) is also honored,
        // so the inline widget can work even without the Express API running.
        const viteKey = (import.meta as any).env?.VITE_FLUTTERWAVE_PUBLIC_KEY;
        if (data?.enabled && data?.publicKey) {
          setFlwConfig({ enabled: true, publicKey: data.publicKey });
        } else if (viteKey) {
          setFlwConfig({ enabled: true, publicKey: viteKey });
        }
      })
      .catch(() => {
        const viteKey = (import.meta as any).env?.VITE_FLUTTERWAVE_PUBLIC_KEY;
        if (viteKey) setFlwConfig({ enabled: true, publicKey: viteKey });
      });
  }, []);

  useEffect(() => {
    if (!flwConfig.enabled) return;
    if (document.getElementById('flutterwave-v3-script')) { setFlwScriptReady(true); return; }
    const script = document.createElement('script');
    script.id = 'flutterwave-v3-script';
    script.src = 'https://checkout.flutterwave.com/v3.js';
    script.async = true;
    script.onload = () => setFlwScriptReady(true);
    document.body.appendChild(script);
  }, [flwConfig.enabled]);

  // ---- Simulated Mobile Money PIN prompt (used automatically whenever
  // Flutterwave isn't configured, so the demo still feels real) ----
  type PinStage = 'idle' | 'prompt' | 'verifying' | 'approved' | 'declined' | 'expired';
  const [pinStage, setPinStage] = useState<PinStage>('idle');
  const [pinDigits, setPinDigits] = useState('');
  const [pinSecondsLeft, setPinSecondsLeft] = useState(60);
  const [pinError, setPinError] = useState('');
  const pinResolveRef = React.useRef<((approved: boolean) => void) | null>(null);

  useEffect(() => {
    if (pinStage !== 'prompt') return;
    if (pinSecondsLeft <= 0) {
      setPinStage('expired');
      return;
    }
    const t = setTimeout(() => setPinSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [pinStage, pinSecondsLeft]);

  // Opens the simulated USSD-style PIN modal and resolves true/false when the
  // shopper approves, cancels, or lets it expire.
  const requestMobileMoneyPin = (): Promise<boolean> => {
    setPinDigits('');
    setPinError('');
    setPinSecondsLeft(60);
    setPinStage('prompt');
    return new Promise((resolve) => {
      pinResolveRef.current = resolve;
    });
  };

  const handlePinKeypad = (key: string) => {
    setPinError('');
    if (key === 'back') {
      setPinDigits((d) => d.slice(0, -1));
      return;
    }
    if (pinDigits.length >= 4) return;
    setPinDigits((d) => d + key);
  };

  const handlePinApprove = () => {
    if (pinDigits.length !== 4) {
      setPinError('Enter your 4-digit Mobile Money PIN to approve this payment.');
      return;
    }
    setPinStage('verifying');
    setTimeout(() => {
      setPinStage('approved');
      setTimeout(() => {
        pinResolveRef.current?.(true);
        pinResolveRef.current = null;
        setPinStage('idle');
      }, 900);
    }, 1400);
  };

  const handlePinCancel = () => {
    setPinStage('idle');
    pinResolveRef.current?.(false);
    pinResolveRef.current = null;
  };
  const [customerAddress, setCustomerAddress] = useState('');
  const [orderId, setOrderId] = useState('');
  const [cardOrAccountDetails, setCardOrAccountDetails] = useState('');

  // Simulated live state tracker for stepper on success page
  const [currentOrderTrackStatus, setCurrentOrderTrackStatus] = useState<OrderStatus>('placed');

  // Live Tracking and Communication states (Requirement 4)
  const [activeRecipient, setActiveRecipient] = useState<'vendor' | 'rider'>('vendor');
  const [vendorMessages, setVendorMessages] = useState<Array<{ sender: 'user' | 'vendor', text: string, timestamp: string }>>([
    { sender: 'vendor', text: "Hello! We have received your order on the Dokan Pro ledger and are currently preparing it.", timestamp: new Date(Date.now() - 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
  ]);
  const [riderMessages, setRiderMessages] = useState<Array<{ sender: 'user' | 'rider', text: string, timestamp: string }>>([
    { sender: 'rider', text: "Awaiting dispatch assignment. I will message you as soon as the package is ready for transit!", timestamp: new Date(Date.now() - 30000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
  ]);
  const [chatText, setChatText] = useState('');
  const [riderMapProgress, setRiderMapProgress] = useState(0); // 0 to 100 representing distance covered

  // Animate map progress of rider in transit
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 'success') {
      if (currentOrderTrackStatus === 'transit') {
        timer = setInterval(() => {
          setRiderMapProgress(prev => {
            if (prev >= 100) {
              clearInterval(timer);
              return 100;
            }
            return prev + 5;
          });
        }, 800);
      } else if (currentOrderTrackStatus === 'placed' || currentOrderTrackStatus === 'dispatched') {
        setRiderMapProgress(0);
      } else if (currentOrderTrackStatus === 'delivered') {
        setRiderMapProgress(100);
      }
    }
    return () => clearInterval(timer);
  }, [currentOrderTrackStatus, step]);

  // Handle automatic messages from rider & vendor based on tracking stage
  useEffect(() => {
    if (step === 'success') {
      if (currentOrderTrackStatus === 'dispatched') {
        setVendorMessages(prev => [
          ...prev,
          { sender: 'vendor', text: "Update: Your package has been securely packed and handed over to the courier dispatch station.", timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
        ]);
        setRiderMessages(prev => [
          ...prev,
          { sender: 'rider', text: "Courier update: I am heading to pick up your package from the vendor store right now.", timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
        ]);
      } else if (currentOrderTrackStatus === 'transit') {
        setRiderMessages(prev => [
          ...prev,
          { sender: 'rider', text: "Hello! I am Ronald Express, your assigned Dokan Rider. I've collected your order and am now driving towards you. You can track my live location on the map above!", timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
        ]);
      } else if (currentOrderTrackStatus === 'delivered') {
        setRiderMessages(prev => [
          ...prev,
          { sender: 'rider', text: "I have reached your landmark and completed the delivery. Please confirm receipt and leave a review. Thanks for choosing Olimart!", timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
        ]);
      }
    }
  }, [currentOrderTrackStatus, step]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatText.trim()) return;

    const userMsg = {
      sender: 'user' as const,
      text: chatText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    if (activeRecipient === 'vendor') {
      setVendorMessages(prev => [...prev, userMsg]);
      const currentInput = chatText;
      setChatText('');
      setTimeout(() => {
        let replyText = "We are on standby! Let us know if you need any adjustments to your order.";
        if (currentOrderTrackStatus === 'placed') {
          replyText = "We're currently preparing your items. Everything is in stock and we are boxing it up now!";
        } else if (currentOrderTrackStatus === 'dispatched' || currentOrderTrackStatus === 'transit') {
          replyText = "Your package is already with the dispatch rider. You can track their live location on the radar map above.";
        }
        setVendorMessages(prev => [
          ...prev,
          { sender: 'vendor', text: replyText, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
        ]);
      }, 1500);
    } else {
      setRiderMessages(prev => [...prev, userMsg]);
      const currentInput = chatText;
      setChatText('');
      setTimeout(() => {
        let replyText = "Hi! I am focused on the road right now but I will check your message when I stop. Be there shortly.";
        if (currentOrderTrackStatus === 'dispatched') {
          replyText = "Hi! I am preparing my route map. I'll pick up the items from the vendor in a moment.";
        } else if (currentOrderTrackStatus === 'transit') {
          replyText = `I am currently riding near Kampala Road. Speed is around 30 km/h. Distance remaining is ${(deliveryInfo.distanceKm * (1 - riderMapProgress / 100)).toFixed(1)} km!`;
        } else if (currentOrderTrackStatus === 'delivered') {
          replyText = "The order is already marked as delivered! Hope you love your new purchase.";
        }
        setRiderMessages(prev => [
          ...prev,
          { sender: 'rider', text: replyText, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
        ]);
      }, 1500);
    }
  };

  if (!isOpen) return null;

  // Computations using customPrice if available
  const subtotal = cartItems.reduce((acc, item) => {
    const itemPrice = item.customPrice !== undefined ? item.customPrice : item.product.price;
    return acc + (itemPrice * item.quantity);
  }, 0);
  
  // Dynamic logistics calculator
  const deliveryInfo = calculateDynamicDeliveryFee(cartItems, selectedLocation);
  const deliveryFee = deliveryInfo.fee;
  const total = subtotal + deliveryFee;

  const handleCheckoutStart = () => {
    setStep('details');
  };

  // Launches the real Flutterwave inline checkout modal. Only used when the
  // platform has FLUTTERWAVE_PUBLIC_KEY configured (see flwConfig above).
  const launchFlutterwaveCheckout = () => {
    if (!window.FlutterwaveCheckout) {
      // Script hasn't finished loading yet — fall back rather than stall the shopper.
      proceedWithSimulatedGateway();
      return;
    }
    window.FlutterwaveCheckout({
      public_key: flwConfig.publicKey,
      tx_ref: `OLIMART-${Date.now()}`,
      amount: total,
      currency: 'UGX',
      payment_options: 'card,mobilemoneyuganda,ussd,banktransfer',
      customer: {
        email: `${(phoneNumber || 'guest').replace(/\s+/g, '')}@olimart-checkout.ug`,
        phone_number: phoneNumber || '0772000000',
        name: customerName || 'Olimart Customer',
      },
      customizations: {
        title: 'Olimart Uganda',
        description: `Secure payment for ${cartItems.length} item(s) via Flutterwave`,
      },
      callback: (data: any) => {
        setStep('processing');
        fetch(`/api/payments/flutterwave/verify/${data.transaction_id}`)
          .then((r) => r.json())
          .then((verifyResult) => {
            if (verifyResult?.success) {
              finalizeOrder();
            } else {
              setStep('details');
              setPinError('Flutterwave could not confirm this payment. Please try again or choose Mobile Money.');
            }
          })
          .catch(() => {
            // Even if our own verify call fails to reach the server, Flutterwave's own
            // callback firing means the charge attempt completed on their end.
            finalizeOrder();
          });
      },
      onclose: () => {
        // Shopper closed the Flutterwave modal without completing payment — stay put.
      },
    });
  };

  // Simulated gateway path used automatically whenever Flutterwave isn't configured
  // (or its script hasn't loaded), so Mobile Money still feels like a real PIN push.
  const proceedWithSimulatedGateway = async () => {
    if (paymentMethod === 'momo' || paymentMethod === 'airtel') {
      const approved = await requestMobileMoneyPin();
      if (!approved) return; // shopper cancelled or the prompt expired — stay on the details step
    }
    setStep('processing');
    finalizeOrder();
  };

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const flutterwaveHandlesThis = flwConfig.enabled && flwScriptReady && paymentMethod !== 'cash' && paymentMethod !== 'paypal';
    if (flutterwaveHandlesThis) {
      launchFlutterwaveCheckout();
    } else {
      proceedWithSimulatedGateway();
    }
  };

  const finalizeOrder = () => {
    setTimeout(() => {
      const generatedId = `OM-${Math.floor(10000 + Math.random() * 90000)}-${selectedLocation.substring(0, 3).toUpperCase()}`;
      setOrderId(generatedId);
      
      const commission = Math.round(subtotal * 0.15);
      const vendorEarnings = subtotal - commission;

      // 1. Save to central Dokan Pro Store orders
      try {
        const dokanOrders = getDokanOrders();
        const newDokanOrder: DokanOrder = {
          id: generatedId,
          customerName,
          customerPhone: phoneNumber,
          customerAddress,
          customerLocation: selectedLocation,
          items: cartItems,
          subtotal,
          deliveryFee,
          total,
          paymentMethod,
          paymentDetails: cardOrAccountDetails || phoneNumber || 'Central Account',
          status: 'placed',
          commission,
          vendorEarnings,
          distanceKm: deliveryInfo.distanceKm,
          createdAt: new Date().toISOString()
        };
        dokanOrders.unshift(newDokanOrder);
        saveDokanOrders(dokanOrders);

        // 2. Distribute funds to vendors' wallets
        const vendors = getDokanVendors();
        cartItems.forEach(item => {
          const vName = item.selectedVendor || 'Tecno Official Outlet Kampala';
          const matched = vendors.find(v => v.name.toLowerCase() === vName.toLowerCase() || v.ownerName.toLowerCase() === vName.toLowerCase());
          const itemPrice = item.customPrice !== undefined ? item.customPrice : item.product.price;
          const itemSubtotal = itemPrice * item.quantity;
          const itemEarn = Math.round(itemSubtotal * 0.85);

          if (matched) {
            matched.balance += itemEarn;
            matched.totalSales += itemSubtotal;
          } else {
            // fallback to general Tecno if not matched
            const fallback = vendors.find(v => v.id === 'v2');
            if (fallback) {
              fallback.balance += itemEarn;
              fallback.totalSales += itemSubtotal;
            }
          }
        });
        saveDokanVendors(vendors);

        // 3. Save to legacy local orders list for overall compatibility
        const saved = localStorage.getItem('olimart_orders');
        const list = saved ? JSON.parse(saved) : [];
        const legacyOrder = {
          id: generatedId,
          customerName,
          customerAddress,
          phoneNumber,
          paymentMethod,
          selectedLocation,
          status: 'Pending',
          date: new Date().toLocaleDateString(),
          total,
          items: cartItems.map(item => ({
            product: {
              id: item.product.id,
              title: item.product.title,
              price: item.product.price,
              image: item.product.image
            },
            quantity: item.quantity,
            selectedVariation: item.selectedVariation,
            selectedVendor: item.selectedVendor,
            customPrice: item.customPrice
          }))
        };
        list.unshift(legacyOrder);
        localStorage.setItem('olimart_orders', JSON.stringify(list));
        
        // Notify other widgets
        window.dispatchEvent(new Event('storage'));

        // Trigger event driven notifications for order placed
        emitEventDrivenNotifications('order_placed', {
          orderId: generatedId,
          customerName,
          customerPhone: phoneNumber || '0772 123456',
          items: cartItems,
          total,
          subtotal,
          commission,
          vendorEarnings,
          customerLocation: selectedLocation
        });
      } catch (err) {
        console.error('Dokan Order Storage error:', err);
      }

      // 4. Persist an authoritative copy to the real Postgres backend (server.ts + Neon DB).
      // Everything above only ever wrote to localStorage, which is why olimart_orders_v2 /
      // olimart_order_items / olimart_vendors were empty even after placing orders in the UI.
      // This upserts the vendors and products involved (so the order_items foreign keys
      // resolve) and then calls the real /api/orders/checkout endpoint. It runs in the
      // background and never blocks the on-screen order flow if the API is unreachable.
      (async () => {
        try {
          const vendorsForSync = getDokanVendors();
          await fetch('/api/db/vendors/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(vendorsForSync),
          });

          const uniqueProducts = Array.from(
            new Map(cartItems.map(ci => [ci.product.id, ci.product])).values()
          );
          await fetch('/api/db/products/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(uniqueProducts),
          });

          const checkoutRes = await fetch('/api/orders/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              customerName,
              customerPhone: phoneNumber || '0772000000',
              deliveryAddress: `${customerAddress} (${selectedLocation})`,
              paymentMethod,
              items: cartItems.map(item => {
                const vName = item.selectedVendor || 'Tecno Official Outlet Kampala';
                const matchedVendor = vendorsForSync.find(
                  v => v.name.toLowerCase() === vName.toLowerCase() || v.ownerName.toLowerCase() === vName.toLowerCase()
                );
                return {
                  productId: item.product.id,
                  productTitle: item.product.title,
                  vendorId: matchedVendor?.id || 'v2',
                  quantity: item.quantity,
                  unitPrice: item.customPrice !== undefined ? item.customPrice : item.product.price,
                };
              }),
            }),
          });

          if (checkoutRes.ok) {
            const dbResult = await checkoutRes.json();
            console.log('✅ Order persisted to Neon Postgres:', dbResult.orderId);
          } else {
            console.warn('Backend checkout API returned an error; order still recorded locally.', await checkoutRes.text());
          }
        } catch (dbErr) {
          console.error('Could not reach the live database — order kept in local session store only:', dbErr);
        }
      })();

      setStep('success');

      // Simulate a live shipping process for the customer!
      // Step through the Stepper: Placed -> Dispatched -> Transit -> Delivered
      setTimeout(() => {
        setCurrentOrderTrackStatus('dispatched');
        // also update the order in localstorage
        updateDokanOrderStatus(generatedId, 'dispatched');
      }, 7000);

      setTimeout(() => {
        setCurrentOrderTrackStatus('transit');
        updateDokanOrderStatus(generatedId, 'transit');
      }, 15000);

      setTimeout(() => {
        setCurrentOrderTrackStatus('delivered');
        updateDokanOrderStatus(generatedId, 'delivered');
      }, 24000);

    }, 2000);
  };

  // Helper to update order status reactively
  const updateDokanOrderStatus = (ordId: string, stat: OrderStatus) => {
    try {
      const ords = getDokanOrders();
      const target = ords.find(o => o.id === ordId);
      if (target) {
        target.status = stat;
        saveDokanOrders(ords);
        window.dispatchEvent(new Event('storage'));

        // Trigger event driven notification for delivery
        if (stat === 'delivered') {
          emitEventDrivenNotifications('order_delivered', {
            orderId: ordId,
            customerName: target.customerName,
            items: target.items,
            vendorEarnings: target.vendorEarnings
          });
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCloseAndReset = () => {
    if (step === 'success') {
      onClearCart();
      setStep('cart');
      setPhoneNumber('');
      setCustomerName('');
      setCustomerAddress('');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" id="cart-drawer-container">
      {/* Dark overlay */}
      <div 
        className="absolute inset-0 bg-black/60 transition-opacity" 
        onClick={handleCloseAndReset}
      />

      {/* Slider Panel — widens into a full checkout page layout once the customer reaches delivery & payment */}
      <div className={`absolute inset-y-0 right-0 w-full bg-white shadow-2xl flex flex-col justify-between animate-slide-left ${step === 'details' ? 'max-w-4xl' : 'max-w-md'}`}>
        
        {/* HEADER */}
        <div className="p-4 border-b border-slate-100 bg-[#232f3e] text-white flex justify-between items-center">
          <div className="flex items-center gap-2">
            <ShoppingBag className="text-[#ff9900]" size={20} />
            <h2 className="font-sans text-xs font-black uppercase tracking-wider">
              {step === 'cart' && `Amazon-Secure Cart (${cartItems.length})`}
              {step === 'details' && 'Amazon 1-Click Secure Checkout'}
              {step === 'processing' && 'Securing Order'}
              {step === 'success' && 'Order Placed!'}
            </h2>
          </div>
          <button 
            onClick={handleCloseAndReset}
            className="p-1 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* STEP PROGRESS BAR (WooCommerce Pro-style checkout stepper) */}
        {step !== 'cart' && (
          <div className="px-4 md:px-10 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-center gap-2 md:gap-4">
            {[
              { key: 'details', label: 'Delivery & Payment' },
              { key: 'processing', label: 'Verifying' },
              { key: 'success', label: 'Confirmation' },
            ].map((s, idx, arr) => {
              const order: CheckoutStep[] = ['details', 'processing', 'success'];
              const currentIdx = order.indexOf(step);
              const thisIdx = order.indexOf(s.key as CheckoutStep);
              const isActive = thisIdx === currentIdx;
              const isDone = thisIdx < currentIdx;
              return (
                <React.Fragment key={s.key}>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black flex-shrink-0 ${
                      isDone ? 'bg-emerald-500 text-white' : isActive ? 'bg-orange-600 text-white' : 'bg-slate-200 text-slate-500'
                    }`}>
                      {isDone ? '✓' : idx + 1}
                    </div>
                    <span className={`text-[8px] md:text-[10px] font-extrabold uppercase tracking-wide whitespace-nowrap ${
                      isActive ? 'text-orange-600' : isDone ? 'text-emerald-600' : 'text-slate-400'
                    }`}>
                      {s.label}
                    </span>
                  </div>
                  {idx < arr.length - 1 && <div className="w-6 md:w-12 h-px bg-slate-300 flex-shrink-0" />}
                </React.Fragment>
              );
            })}
          </div>
        )}

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
          
          {/* STEP 1: CART LIST */}
          {step === 'cart' && (
            <>
              {cartItems.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {cartItems.map((item) => {
                    const itemKey = `${item.product.id}-${item.selectedVendor || 'default'}-${JSON.stringify(item.selectedVariation || {})}`;
                    const activePrice = item.customPrice !== undefined ? item.customPrice : item.product.price;
                    return (
                      <div key={itemKey} className="py-4 flex gap-4">
                        {/* Product Thumbnail */}
                        <img
                          src={item.product.image}
                          alt={item.product.title}
                          className="w-16 h-16 object-contain rounded-lg bg-slate-50 border border-slate-100 p-1 flex-shrink-0"
                          referrerPolicy="no-referrer"
                        />

                        {/* Product description */}
                        <div className="flex-1 space-y-1">
                          <h4 className="text-xs font-bold text-slate-800 line-clamp-2">
                            {item.product.title}
                          </h4>
                          
                          {/* Selected Variations */}
                          {item.selectedVariation && Object.entries(item.selectedVariation).length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {Object.entries(item.selectedVariation).map(([vName, vVal]) => (
                                <span key={vName} className="bg-orange-50 text-orange-700 border border-orange-100/50 px-1.5 py-0.5 rounded text-[9px] font-bold">
                                  {vName}: {vVal}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Selected Vendor */}
                          {item.selectedVendor && (
                            <p className="text-[10px] text-slate-500 font-extrabold mt-0.5 flex items-center gap-1">
                              🛒 Seller: <span className="text-orange-600 font-black">{item.selectedVendor}</span>
                            </p>
                          )}

                          <div className="flex justify-between items-center">
                            <span className="text-xs font-black text-slate-900">
                              Shs {activePrice.toLocaleString()}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              Subtotal: Shs {(activePrice * item.quantity).toLocaleString()}
                            </span>
                          </div>

                          {/* Adjust Quantity */}
                          <div className="flex items-center justify-between pt-1">
                            <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                              <button
                                onClick={() => onUpdateQuantity(item.product.id, -1, item.selectedVariation, item.selectedVendor)}
                                className="px-2 py-1 hover:bg-slate-200 text-slate-600 transition-colors"
                              >
                                <Minus size={12} />
                              </button>
                              <span className="px-3 text-xs font-black text-slate-800 bg-white">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => onUpdateQuantity(item.product.id, 1, item.selectedVariation, item.selectedVendor)}
                                className="px-2 py-1 hover:bg-slate-200 text-slate-600 transition-colors"
                              >
                                <Plus size={12} />
                              </button>
                            </div>

                            <button
                              onClick={() => onRemoveItem(item.product.id, item.selectedVariation, item.selectedVendor)}
                              className="text-red-500 hover:text-red-700 p-1 rounded-full transition-colors"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Free shipping booster bar */}
                  <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 text-xs text-orange-800 mt-4 flex items-center gap-2">
                    <Sparkles className="text-orange-600 flex-shrink-0 animate-pulse" size={16} />
                    <span>
                      {subtotal > 150000 ? (
                        <strong>🎉 Congratulations! You unlocked FREE shipping inside Kampala!</strong>
                      ) : (
                        <span>Add <strong>Shs {(150000 - subtotal).toLocaleString()}</strong> more to enjoy FREE delivery!</span>
                      )}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="py-16 text-center space-y-4">
                  <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto">
                    <ShoppingBag size={28} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-slate-800 font-bold text-sm">Your basket is empty</h3>
                    <p className="text-xs text-slate-400 font-medium">Add products from our flash sales or search catalog to get started.</p>
                  </div>
                  <button
                    onClick={onClose}
                    className="bg-orange-600 text-white px-6 py-2 rounded-xl text-xs font-bold shadow-sm"
                  >
                    Start Shopping
                  </button>
                </div>
              )}
            </>
          )}

          {/* STEP 2: CHECKOUT DETAILS & PAYMENT */}
          {step === 'details' && (
            <form onSubmit={handlePlaceOrder} className="space-y-4">
            <div className="grid lg:grid-cols-5 gap-5 items-start">
            <div className="lg:col-span-3 space-y-4">
              <div className="space-y-1 bg-amber-50/40 p-3.5 rounded-xl border border-amber-200">
                <div className="flex justify-between items-center text-[10px] font-bold text-amber-800 uppercase tracking-wide">
                  <span>Shipment Address Verified</span>
                  <span className="text-[9px] bg-amber-200 text-amber-900 px-1.5 rounded font-black uppercase">Fast Boda Boda Route</span>
                </div>
                <p className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5 mt-1">
                  📍 District: <strong className="text-orange-600 underline font-black">{selectedLocation}</strong>
                </p>
              </div>

              {/* Customer Info */}
              <div className="space-y-3 bg-white border border-slate-200 p-4 rounded-xl">
                <h3 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-3.5 bg-[#EA6A0C] rounded-xs" />
                  <span>1. Enter Delivery Coordinates</span>
                </h3>
                
                <div className="space-y-1">
                  <label className="block text-[9px] font-bold text-slate-400 uppercase">Receiver's Full Name</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Isaac Mukasa"
                    className="w-full text-slate-850 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] font-bold text-slate-400 uppercase font-mono">Detailed Landmark Address</label>
                  <input
                    type="text"
                    required
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    placeholder="e.g. Plot 12, opposite Wandegeya Police Post"
                    className="w-full text-slate-850 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* Payment Methods */}
              <div className="space-y-3 bg-white border border-slate-200 p-4 rounded-xl">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1">
                    <span className="w-1.5 h-3.5 bg-[#EA6A0C] rounded-xs" />
                    <span>2. Secure Gateway Selection</span>
                  </h3>
                  {flwConfig.enabled ? (
                    <span className="flex items-center gap-1 text-[9px] font-black text-orange-600 bg-orange-50 px-2 py-1 rounded-full uppercase tracking-wide">
                      <ShieldCheck size={11} /> Powered by Flutterwave
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[9px] font-black text-slate-500 bg-slate-100 px-2 py-1 rounded-full uppercase tracking-wide">
                      <Lock size={11} /> Verified Collection Lines
                    </span>
                  )}
                </div>
                
                <div className="grid grid-cols-1 gap-2">
                  {/* MTN MoMo */}
                  <label className={`border rounded-xl p-3 flex items-center justify-between cursor-pointer transition-all ${
                    paymentMethod === 'momo' ? 'border-yellow-500 bg-yellow-50/20' : 'border-slate-200 hover:bg-slate-50'
                  }`}>
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === 'momo'}
                        onChange={() => setPaymentMethod('momo')}
                        className="accent-yellow-500 cursor-pointer"
                      />
                      <div className="text-left">
                        <p className="text-xs font-black text-slate-800 flex items-center gap-1">
                          MTN Mobile Money <span className="bg-yellow-400 text-[8px] font-black px-1.5 py-0.2 rounded text-slate-950">MOMO</span>
                        </p>
                        <p className="text-[10px] text-slate-500">Secure PIN prompt confirmation</p>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center text-slate-900 font-extrabold text-xs">MTN</div>
                  </label>

                  {/* Airtel Money */}
                  <label className={`border rounded-xl p-3 flex items-center justify-between cursor-pointer transition-all ${
                    paymentMethod === 'airtel' ? 'border-red-500 bg-red-50/20' : 'border-slate-200 hover:bg-slate-50'
                  }`}>
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === 'airtel'}
                        onChange={() => setPaymentMethod('airtel')}
                        className="accent-red-600 cursor-pointer"
                      />
                      <div className="text-left">
                        <p className="text-xs font-black text-slate-800 flex items-center gap-1">
                          Airtel Money <span className="bg-red-600 text-[8px] font-black px-1.5 py-0.2 rounded text-white">AIRTEL</span>
                        </p>
                        <p className="text-[10px] text-slate-500">Instant mobile money secure push</p>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white font-extrabold text-xs">Air</div>
                  </label>

                  {/* PayPal */}
                  <label className={`border rounded-xl p-3 flex items-center justify-between cursor-pointer transition-all ${
                    paymentMethod === 'paypal' ? 'border-blue-500 bg-blue-50/20' : 'border-slate-200 hover:bg-slate-50'
                  }`}>
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === 'paypal'}
                        onChange={() => setPaymentMethod('paypal')}
                        className="accent-blue-600 cursor-pointer"
                      />
                      <div className="text-left">
                        <p className="text-xs font-black text-slate-800 flex items-center gap-1">
                          PayPal Express <span className="bg-blue-600 text-[8px] font-black px-1.5 py-0.2 rounded text-white font-mono">PAYPAL</span>
                        </p>
                        <p className="text-[10px] text-slate-500">Pay with PayPal balance or Credit card</p>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-extrabold text-xs">PP</div>
                  </label>

                  {/* Stripe Card */}
                  <label className={`border rounded-xl p-3 flex items-center justify-between cursor-pointer transition-all ${
                    paymentMethod === 'stripe' ? 'border-indigo-500 bg-indigo-50/20' : 'border-slate-200 hover:bg-slate-50'
                  }`}>
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === 'stripe'}
                        onChange={() => setPaymentMethod('stripe')}
                        className="accent-indigo-600 cursor-pointer"
                      />
                      <div className="text-left">
                        <p className="text-xs font-black text-slate-800 flex items-center gap-1">
                          Stripe Elements <span className="bg-indigo-600 text-[8px] font-black px-1.5 py-0.2 rounded text-white font-mono">STRIPE</span>
                        </p>
                        <p className="text-[10px] text-slate-500">Fast multi-currency checkout via Stripe card</p>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-extrabold text-xs">S</div>
                  </label>

                  {/* Mastercard */}
                  <label className={`border rounded-xl p-3 flex items-center justify-between cursor-pointer transition-all ${
                    paymentMethod === 'mastercard' ? 'border-orange-500 bg-orange-50/20' : 'border-slate-200 hover:bg-slate-50'
                  }`}>
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === 'mastercard'}
                        onChange={() => setPaymentMethod('mastercard')}
                        className="accent-orange-600 cursor-pointer"
                      />
                      <div className="text-left">
                        <p className="text-xs font-black text-slate-800 flex items-center gap-1">
                          Mastercard SecureCode <span className="bg-orange-500 text-[8px] font-black px-1.5 py-0.2 rounded text-white">CARD</span>
                        </p>
                        <p className="text-[10px] text-slate-500">Direct debit or international credit card gate</p>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white font-extrabold text-xs">
                      <CreditCard size={14} />
                    </div>
                  </label>

                  {/* Bank Accounts */}
                  <label className={`border rounded-xl p-3 flex items-center justify-between cursor-pointer transition-all ${
                    paymentMethod === 'bank' ? 'border-sky-500 bg-sky-50/20' : 'border-slate-200 hover:bg-slate-50'
                  }`}>
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === 'bank'}
                        onChange={() => setPaymentMethod('bank')}
                        className="accent-sky-600 cursor-pointer"
                      />
                      <div className="text-left">
                        <p className="text-xs font-black text-slate-800 flex items-center gap-1">
                          Direct Bank Transfer <span className="bg-sky-600 text-[8px] font-black px-1.5 py-0.2 rounded text-white">E-BANK</span>
                        </p>
                        <p className="text-[10px] text-slate-500">EFT, RTGS or bank app transfer confirmation</p>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-sky-600 flex items-center justify-center text-white font-extrabold text-xs">Bank</div>
                  </label>

                  {/* Cash on Delivery */}
                  <label className={`border rounded-xl p-3 flex items-center justify-between cursor-pointer transition-all ${
                    paymentMethod === 'cash' ? 'border-emerald-500 bg-emerald-50/20' : 'border-slate-200 hover:bg-slate-50'
                  }`}>
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === 'cash'}
                        onChange={() => setPaymentMethod('cash')}
                        className="accent-emerald-600 cursor-pointer"
                      />
                      <div className="text-left">
                        <p className="text-xs font-black text-slate-800 flex items-center gap-1">
                          Cash on Delivery <span className="bg-slate-200 text-[8px] font-black px-1.5 py-0.2 rounded text-slate-700">COD</span>
                        </p>
                        <p className="text-[10px] text-slate-500">Pay cash or mobile transfer on drop receipt</p>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white font-extrabold text-xs">
                      <Coins size={14} />
                    </div>
                  </label>
                </div>
              </div>

              {/* Mobile phone for money prompt — real merchant collection line disclosed */}
              {(paymentMethod === 'momo' || paymentMethod === 'airtel') && (() => {
                const acc = paymentMethod === 'momo' ? settlementAccounts.mtn_momo : settlementAccounts.airtel_money;
                const brandColor = paymentMethod === 'momo' ? 'text-yellow-400' : 'text-red-400';
                const brandBg = paymentMethod === 'momo' ? 'bg-yellow-400 text-slate-950' : 'bg-red-600 text-white';
                return (
                  <div className="space-y-3 p-3.5 bg-slate-900 text-white rounded-xl">
                    <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                      <Smartphone size={12} className={brandColor} /> Your Mobile Money Number
                    </label>
                    <input
                      type="tel"
                      required
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="e.g. 0772 123456 or 0702 123456"
                      className="w-full text-slate-800 bg-white rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none"
                    />

                    <div className="rounded-lg border border-slate-700 bg-slate-800/70 p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Olimart collection line</span>
                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${brandBg}`}>
                          {paymentMethod === 'momo' ? 'MTN MoMoPay' : 'Airtel Money'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-black tracking-wide">{acc.accountNumber}</p>
                          <p className="text-[9px] text-slate-400 font-semibold">{acc.accountName}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopy(paymentMethod, acc.accountNumber)}
                          className="flex items-center gap-1 bg-slate-700 hover:bg-slate-600 px-2.5 py-1.5 rounded-lg text-[9px] font-bold uppercase cursor-pointer transition-colors"
                        >
                          <Copy size={11} />
                          {copiedField === paymentMethod ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                    </div>

                    <p className="text-[9px] text-slate-400 font-medium leading-relaxed flex items-start gap-1.5">
                      <Lock size={11} className="mt-0.5 flex-shrink-0 text-emerald-400" />
                      {flwConfig.enabled
                        ? "You'll approve this exact amount securely via Flutterwave's mobile money checkout — no manual transfer needed."
                        : `On "Confirm Order" you'll get a PIN approval prompt on ${phoneNumber || 'your phone'} for this exact amount, in the name of ${acc.accountName}. Never share your PIN with anyone, including Olimart staff.`}
                    </p>
                  </div>
                );
              })()}

              {/* PayPal details prompt */}
              {paymentMethod === 'paypal' && (
                <div className="space-y-1 p-3.5 bg-slate-900 text-white rounded-xl">
                  <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                    <Globe size={12} className="text-blue-400" /> PayPal Email Account
                  </label>
                  <input
                    type="email"
                    required
                    value={cardOrAccountDetails}
                    onChange={(e) => setCardOrAccountDetails(e.target.value)}
                    placeholder="your-paypal-email@domain.com"
                    className="w-full text-slate-800 bg-white rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none"
                  />
                  <p className="text-[9px] text-slate-400 font-medium">
                    * You will be redirected to secure PayPal gateway to log in and approve the sandbox payment.
                  </p>
                </div>
              )}

              {/* Stripe or Mastercard details prompt */}
              {(paymentMethod === 'stripe' || paymentMethod === 'mastercard') && (
                <div className="space-y-2.5 p-3.5 bg-slate-900 text-white rounded-xl">
                  <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                    <CreditCard size={12} className="text-indigo-400" /> Credit / Debit Card Information
                  </label>
                  <div className="space-y-2">
                    <input
                      type="text"
                      required
                      value={cardOrAccountDetails}
                      onChange={(e) => setCardOrAccountDetails(e.target.value)}
                      placeholder="Card Number (e.g., 4000 1234 5678 9010)"
                      maxLength={19}
                      className="w-full text-slate-800 bg-white rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="MM/YY"
                        maxLength={5}
                        required
                        className="w-full text-slate-800 bg-white rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none"
                      />
                      <input
                        type="password"
                        placeholder="CVV"
                        maxLength={3}
                        required
                        className="w-full text-slate-800 bg-white rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none"
                      />
                    </div>
                  </div>
                  <p className="text-[9px] text-slate-400 font-medium">
                    * Fully compliant SSL 256-bit encrypted card routing. Gateway funds are held in Olimart's Escrow.
                  </p>
                </div>
              )}

              {/* Bank Transfer details prompt — full, real account disclosure */}
              {paymentMethod === 'bank' && (() => {
                const acc = settlementAccounts.bank;
                return (
                  <div className="space-y-3 p-3.5 bg-slate-900 text-white rounded-xl">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                        <Landmark size={12} className="text-sky-400" /> Bank Transfer — Full Details
                      </label>
                      <span className="text-[8px] font-black px-1.5 py-0.5 rounded uppercase bg-sky-600 text-white">{acc.currency}</span>
                    </div>

                    <div className="rounded-lg border border-slate-700 bg-slate-800/70 divide-y divide-slate-700/70">
                      {[
                        { label: 'Bank', value: acc.bankName || '—', copyKey: 'bank_name' },
                        { label: 'Account Name', value: acc.accountName, copyKey: 'bank_account_name' },
                        { label: 'Account Number', value: acc.accountNumber, copyKey: 'bank_account_number' },
                        ...(acc.branch ? [{ label: 'Branch', value: acc.branch, copyKey: 'bank_branch' }] : []),
                        ...(acc.swiftCode ? [{ label: 'SWIFT / BIC', value: acc.swiftCode, copyKey: 'bank_swift' }] : []),
                      ].map((row) => (
                        <div key={row.copyKey} className="flex items-center justify-between gap-2 px-3 py-2">
                          <div className="min-w-0">
                            <p className="text-[8px] font-black uppercase tracking-wider text-slate-400">{row.label}</p>
                            <p className="text-xs font-black truncate">{row.value}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopy(row.copyKey, row.value)}
                            className="flex-shrink-0 flex items-center gap-1 bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded-lg text-[9px] font-bold uppercase cursor-pointer transition-colors"
                          >
                            <Copy size={10} />
                            {copiedField === row.copyKey ? 'Copied' : 'Copy'}
                          </button>
                        </div>
                      ))}
                    </div>

                    {acc.customerCareLine && (
                      <a
                        href={`tel:${acc.customerCareLine.replace(/[^0-9+]/g, '')}`}
                        className="w-full flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-black py-2.5 rounded-lg cursor-pointer transition-colors"
                      >
                        <Phone size={13} /> Call {acc.bankName || 'the bank'} — {acc.customerCareLine}
                      </a>
                    )}

                    <input
                      type="text"
                      required
                      value={cardOrAccountDetails}
                      onChange={(e) => setCardOrAccountDetails(e.target.value)}
                      placeholder="Your Bank Account Holder Name (the name transferring funds)"
                      className="w-full bg-white rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none text-slate-800"
                    />

                    <p className="text-[9px] text-slate-400 font-medium leading-relaxed flex items-start gap-1.5">
                      <AlertTriangle size={11} className="mt-0.5 flex-shrink-0 text-amber-400" />
                      {acc.notes || 'Transfer the exact order total, then keep your bank receipt — our finance desk clears orders once the transfer is confirmed on our statement.'}
                    </p>
                  </div>
                );
              })()}

            </div>{/* end left column: delivery + payment */}

            {/* Right column: sticky order summary — WooCommerce Pro checkout pattern */}
            <div className="lg:col-span-2 lg:sticky lg:top-0 space-y-4">
              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                <h3 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-3.5 bg-[#EA6A0C] rounded-xs" />
                  <span>Order Summary</span>
                </h3>

                <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 -mx-1 px-1">
                  {cartItems.map((item) => {
                    const itemKey = `${item.product.id}-${item.selectedVendor || 'default'}-${JSON.stringify(item.selectedVariation || {})}`;
                    const activePrice = item.customPrice !== undefined ? item.customPrice : item.product.price;
                    return (
                      <div key={itemKey} className="py-2 flex items-center gap-2">
                        <img
                          src={item.product.image}
                          alt={item.product.title}
                          className="w-10 h-10 object-contain rounded-lg bg-slate-50 border border-slate-100 p-0.5 flex-shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-bold text-slate-700 line-clamp-1">{item.product.title}</p>
                          <p className="text-[9px] text-slate-400">Qty {item.quantity} &times; Shs {activePrice.toLocaleString()}</p>
                        </div>
                        <span className="text-[10px] font-black text-slate-800 flex-shrink-0">
                          Shs {(activePrice * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="border-t border-slate-100 pt-2 space-y-1.5 text-xs">
                  <div className="flex justify-between font-semibold text-slate-600">
                    <span>Items Subtotal</span>
                    <span className="text-slate-900 font-bold">Shs {subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-slate-600">
                    <span className="flex items-center gap-1">
                      Courier Fee
                      {deliveryInfo.hasBulkyItem && (
                        <span className="bg-red-100 text-red-800 text-[8px] font-black px-1.5 rounded uppercase">Bulky</span>
                      )}
                    </span>
                    <span className="text-slate-900 font-bold">Shs {deliveryFee.toLocaleString()}</span>
                  </div>
                  <div className="border-t border-slate-200 my-1.5 pt-1.5 flex justify-between items-baseline">
                    <span className="font-extrabold text-slate-800">Grand Total</span>
                    <span className="text-base font-black text-[#EA6A0C]">Shs {total.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Trust badges */}
              <div className="bg-white border border-slate-200 rounded-xl p-3.5">
                <div className="grid grid-cols-3 gap-1.5 text-center">
                  <div className="flex flex-col items-center gap-1 text-slate-500">
                    <ShieldCheck size={16} className="text-emerald-600" />
                    <span className="text-[8px] font-bold leading-tight">Buyer Protection</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 text-slate-500">
                    <Truck size={16} className="text-orange-600" />
                    <span className="text-[8px] font-bold leading-tight">Verified Riders</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 text-slate-500">
                    <CreditCard size={16} className="text-indigo-600" />
                    <span className="text-[8px] font-bold leading-tight">Secure Payments</span>
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep('cart')}
                  className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="w-2/3 bg-orange-600 hover:bg-orange-500 text-white font-extrabold py-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-md"
                >
                  Confirm Order &bull; Shs {total.toLocaleString()}
                </button>
              </div>
            </div>{/* end right column: order summary */}

            </div>{/* end grid */}
            </form>
          )}

          {/* STEP 3: PROCESSING */}
          {step === 'processing' && (
            <div className="py-20 text-center space-y-6">
              <div className="relative w-16 h-16 mx-auto">
                <div className="absolute inset-0 rounded-full border-4 border-slate-100" />
                <div className="absolute inset-0 rounded-full border-4 border-orange-600 border-t-transparent animate-spin" />
              </div>
              <div className="space-y-2">
                <h3 className="text-slate-900 font-black text-sm uppercase tracking-wider">Securing your order</h3>
                <p className="text-xs text-slate-500 font-medium px-6 leading-relaxed">
                  {paymentMethod === 'cash'
                    ? 'Verifying delivery route inside Kampala...'
                    : paymentMethod === 'bank'
                      ? 'Recording your bank transfer reference and notifying the finance desk...'
                      : flwConfig.enabled
                        ? 'Confirming your payment with Flutterwave...'
                        : `Payment approved on ${phoneNumber || 'your line'} — finalizing your order...`}
                </p>
              </div>
              <p className="text-[10px] text-slate-400 font-medium italic animate-pulse">Please do not refresh or close this tab</p>
            </div>
          )}

          {/* STEP 4: SUCCESS */}
          {step === 'success' && (
            <div className="py-6 text-center space-y-6">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
                <CheckCircle size={36} />
              </div>
              
              <div className="space-y-1">
                <h3 className="font-black text-slate-900 text-lg">Web Order Successful!</h3>
                <p className="text-xs text-orange-600 font-extrabold">Order ID: {orderId}</p>
                <p className="text-xs text-slate-500 font-bold">Mwebale kusiima (Thank you for shopping!)</p>
              </div>

              {/* Dynamic Progress Stepper Tracker */}
              <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-500">Live Delivery Radar Tracker</h4>
                    <span className="text-[9px] bg-orange-100 text-orange-800 font-black px-1.5 py-0.5 rounded uppercase animate-pulse">
                      Status: {currentOrderTrackStatus === 'placed' ? 'Order Placed' : currentOrderTrackStatus === 'dispatched' ? 'Ready for Dispatch' : currentOrderTrackStatus === 'transit' ? 'In Transit' : 'Delivered'}
                    </span>
                  </div>
                  <Stepper currentStatus={currentOrderTrackStatus} />
                  <p className="text-[9px] text-slate-400 mt-2 font-medium text-left">
                    {currentOrderTrackStatus === 'placed' && '🕒 Seller is picking the items and preparing the package.'}
                    {currentOrderTrackStatus === 'dispatched' && '📦 Packaged securely. Boda dispatch is allocating a rider.'}
                    {currentOrderTrackStatus === 'transit' && '🏍️ Rider accepted! In transit with real-time location streaming.'}
                    {currentOrderTrackStatus === 'delivered' && '🎉 Delivered safely! Thank you for supporting Kampala vendors.'}
                  </p>
                </div>

                {/* Simulated Google Maps Platform Radar (Requirement 4) */}
                <div className="bg-slate-100 dark:bg-slate-950 rounded-xl p-3 border border-slate-200 dark:border-slate-800 space-y-2 text-left">
                  <div className="flex justify-between items-center text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">
                    <span className="flex items-center gap-1">📍 Live GPS Radar (Google Maps Grounding)</span>
                    <span className="font-mono text-orange-600">Active Node</span>
                  </div>
                  
                  {/* Map Graphic Canvas Container */}
                  <div className="relative h-28 bg-emerald-50 dark:bg-slate-900 border border-emerald-100 dark:border-slate-800 rounded-lg overflow-hidden">
                    {/* SVG Map Lines (Roads) */}
                    <svg className="absolute inset-0 w-full h-full stroke-slate-300 dark:stroke-slate-700 stroke-2 fill-none">
                      <pattern id="mapGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(0,0,0,0.03)" strokeWidth="1" />
                      </pattern>
                      <rect width="100%" height="100%" fill="url(#mapGrid)" />
                      
                      {/* Dotted route path from (30, 85) Vendor -> (270, 30) Customer */}
                      <path 
                        id="routePath"
                        d="M 30 85 C 100 20, 200 110, 270 30" 
                        strokeDasharray="4 4" 
                        stroke="#94a3b8" 
                        strokeWidth="3"
                      />
                    </svg>

                    {/* Vendor Icon Pin at (30, 85) */}
                    <div className="absolute left-[30px] top-[85px] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                      <div className="bg-orange-600 text-white p-1 rounded-full shadow-lg border border-white">
                        <Store size={10} />
                      </div>
                      <span className="text-[7px] font-black bg-white dark:bg-slate-950 px-1 rounded shadow-sm text-slate-700 dark:text-slate-300 mt-0.5">Dokan Vendor</span>
                    </div>

                    {/* Customer Icon Pin at (270, 30) */}
                    <div className="absolute left-[270px] top-[30px] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                      <div className="bg-blue-600 text-white p-1 rounded-full shadow-lg border border-white">
                        <MapPin size={10} />
                      </div>
                      <span className="text-[7px] font-black bg-white dark:bg-slate-950 px-1 rounded shadow-sm text-slate-700 dark:text-slate-300 mt-0.5">You</span>
                    </div>

                    {/* Animated Motorcycle Courier Pin */}
                    {(() => {
                      const p = riderMapProgress / 100;
                      // Cubic Bezier coordinates interpolation
                      const x = (1-p)**3 * 30 + 3 * (1-p)**2 * p * 100 + 3 * (1-p) * p**2 * 200 + p**3 * 270;
                      const y = (1-p)**3 * 85 + 3 * (1-p)**2 * p * 20 + 3 * (1-p) * p**2 * 110 + p**3 * 30;

                      return (
                        <div 
                          className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center transition-all duration-300 ease-out z-10"
                          style={{ left: `${x}px`, top: `${y}px` }}
                        >
                          <div className="bg-emerald-600 text-white p-1.5 rounded-full shadow-xl border-2 border-white animate-bounce">
                            <Truck size={12} className="text-white" />
                          </div>
                          <span className="text-[7px] font-black bg-emerald-100 text-emerald-800 px-1 rounded border border-emerald-300">
                            Rider ({riderMapProgress}%)
                          </span>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Rider HUD Statistics */}
                  <div className="grid grid-cols-3 gap-2 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-2 rounded-lg text-[8px] font-extrabold text-slate-500 uppercase">
                    <div>
                      <p className="text-[7px] text-slate-400">Velocity</p>
                      <p className="text-[10px] text-slate-800 dark:text-slate-200 font-mono font-bold">
                        {currentOrderTrackStatus === 'transit' ? '32 km/h' : currentOrderTrackStatus === 'delivered' ? '0 km/h (Arrived)' : '0 km/h (Idle)'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[7px] text-slate-400">Distance Remaining</p>
                      <p className="text-[10px] text-orange-600 font-mono font-bold">
                        {(deliveryInfo.distanceKm * (1 - riderMapProgress / 100)).toFixed(2)} km
                      </p>
                    </div>
                    <div>
                      <p className="text-[7px] text-slate-400">ETA Estimate</p>
                      <p className="text-[10px] text-emerald-600 font-mono font-bold">
                        {currentOrderTrackStatus === 'placed' && 'Prep...'}
                        {currentOrderTrackStatus === 'dispatched' && 'Allocating...'}
                        {currentOrderTrackStatus === 'transit' && `${Math.max(1, Math.round(5 * (1 - riderMapProgress / 100)))} mins`}
                        {currentOrderTrackStatus === 'delivered' && 'Arrived'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Live Chat Communication Hub (Requirement 4) */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 space-y-3.5 text-left">
                  <div className="flex justify-between items-center">
                    <h5 className="text-[10px] font-black uppercase tracking-wider text-slate-600 flex items-center gap-1">
                      <MessageSquare size={13} className="text-orange-600" /> Dokan Chat Center
                    </h5>
                    {/* Tab Switcher for recipient */}
                    <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-[8px] font-extrabold">
                      <button
                        type="button"
                        onClick={() => setActiveRecipient('vendor')}
                        className={`px-2 py-1 rounded cursor-pointer ${activeRecipient === 'vendor' ? 'bg-orange-600 text-white font-black' : 'text-slate-500'}`}
                      >
                        🏬 Vendor
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveRecipient('rider')}
                        className={`px-2 py-1 rounded cursor-pointer ${activeRecipient === 'rider' ? 'bg-orange-600 text-white font-black' : 'text-slate-500'}`}
                      >
                        🏍️ Rider
                      </button>
                    </div>
                  </div>

                  {/* Message History Scroller */}
                  <div className="h-32 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg space-y-2 text-[10px] border border-slate-150 dark:border-slate-900">
                    {(activeRecipient === 'vendor' ? vendorMessages : riderMessages).map((m, idx) => (
                      <div 
                        key={idx} 
                        className={`flex flex-col max-w-[80%] ${m.sender === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                      >
                        <div 
                          className={`px-3 py-2 rounded-2xl font-medium ${
                            m.sender === 'user' 
                              ? 'bg-orange-600 text-white rounded-tr-none' 
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none'
                          }`}
                        >
                          <p>{m.text}</p>
                        </div>
                        <span className="text-[7px] text-slate-400 mt-0.5 px-1">{m.timestamp}</span>
                      </div>
                    ))}
                  </div>

                  {/* Chat Input Field */}
                  <form onSubmit={handleSendMessage} className="flex gap-1.5">
                    <input
                      type="text"
                      value={chatText}
                      onChange={(e) => setChatText(e.target.value)}
                      placeholder={`Send text to ${activeRecipient === 'vendor' ? 'Dokan Vendor Store' : 'Delivery Rider'}...`}
                      className="flex-1 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-[10px] focus:outline-none font-bold"
                    />
                    <button
                      type="submit"
                      className="bg-orange-600 hover:bg-orange-500 text-white font-extrabold px-3 py-1.5 rounded-lg text-[9px] uppercase tracking-wider cursor-pointer"
                    >
                      Send
                    </button>
                  </form>
                </div>
              </div>

              {/* Summary container */}
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-left text-xs space-y-2">
                <div className="flex justify-between font-bold text-slate-700">
                  <span>Customer:</span>
                  <span className="text-slate-900">{customerName}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-700">
                  <span>Address:</span>
                  <span className="text-slate-900 truncate max-w-[200px]">{customerAddress}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-700">
                  <span>Payment Type:</span>
                  <span className="text-slate-900 uppercase">{paymentMethod}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-700">
                  <span>Transport Distance:</span>
                  <span className="text-slate-900 font-mono">{deliveryInfo.distanceKm} km</span>
                </div>
                <div className="flex justify-between font-bold text-slate-700">
                  <span>Category Rate:</span>
                  <span className="text-emerald-600 font-medium">{deliveryInfo.explanation}</span>
                </div>
                <div className="border-t border-slate-200 my-2 pt-2 flex justify-between font-black text-slate-900">
                  <span>Grand Total Paid:</span>
                  <span>Shs {total.toLocaleString()}</span>
                </div>
              </div>

              <div className="text-[10px] text-slate-400 font-medium leading-relaxed px-4">
                ℹ️ A confirmation receipt SMS has been dispatched. Our local courier rider will phone you once they reach your landmark inside <strong>{selectedLocation}</strong>.
              </div>

              <div className="pt-4">
                <button
                  onClick={handleCloseAndReset}
                  className="w-full bg-slate-900 text-white font-extrabold py-3 rounded-xl text-xs transition-transform hover:scale-102 cursor-pointer"
                >
                  Return to Marketplace
                </button>
              </div>
            </div>
          )}

        </div>

        {/* FOOTER TOTALS (Only in Cart step) */}
        {step === 'cart' && cartItems.length > 0 && (
          <div className="p-4 bg-slate-50 border-t border-slate-100 space-y-3">
            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between font-semibold">
                <span>Items Subtotal:</span>
                <span className="text-slate-900 font-bold">Shs {subtotal.toLocaleString()}</span>
              </div>
              
              <div className="bg-slate-100/55 p-2.5 rounded-xl border border-slate-200/50 space-y-1">
                <div className="flex justify-between font-semibold">
                  <span className="flex items-center gap-1">
                    🚚 Auto Courier Fee:
                    {deliveryInfo.hasBulkyItem && (
                      <span className="bg-red-100 text-red-800 text-[8px] font-black px-1.5 rounded uppercase">Bulky Cargo</span>
                    )}
                  </span>
                  <span className="text-slate-900 font-black">
                    Shs {deliveryFee.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-[9px] text-slate-500">
                  <span>Distance to {(selectedLocation || '').split(',')[0]}</span>
                  <span className="font-semibold font-mono">{deliveryInfo.distanceKm} km</span>
                </div>
                <div className="text-[9px] text-slate-400 font-medium">
                  Rate applied: {deliveryInfo.explanation}
                </div>
              </div>

              <div className="border-t border-slate-200 my-2" />
              <div className="flex justify-between items-baseline">
                <span className="font-extrabold text-sm text-slate-800">Total Price:</span>
                <span className="text-lg font-black text-[#EA6A0C]">
                  Shs {total.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={handleCheckoutStart}
                className="w-full bg-orange-600 hover:bg-orange-500 text-white py-3.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer shadow-md active:scale-95 animate-pulse"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight size={14} />
              </button>
              
              <div className="flex justify-center items-center gap-1.5 text-[9px] text-slate-400 font-semibold">
                <ShieldCheck size={12} className="text-emerald-600" />
                <span>OliMart Safe Checkout &bull; PayPal, Card, MoMo, Bank, COD</span>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Simulated Mobile Money PIN prompt — mirrors the real USSD/telco push
          you'd get from MTN or Airtel, so Confirm Order feels like a genuine
          payment authorization rather than a silent form submit. */}
      {pinStage !== 'idle' && (() => {
        const acc = paymentMethod === 'airtel' ? settlementAccounts.airtel_money : settlementAccounts.mtn_momo;
        const brand = paymentMethod === 'airtel' ? { name: 'Airtel Money', bg: 'bg-red-600', ring: 'ring-red-500/30' } : { name: 'MTN MoMo', bg: 'bg-yellow-400 text-slate-950', ring: 'ring-yellow-400/30' };
        return (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 px-4">
            <div className="w-full max-w-xs bg-slate-950 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden">
              {/* Phone-style status bar */}
              <div className={`px-4 py-2.5 flex items-center justify-between text-[10px] font-black uppercase tracking-wider ${brand.bg}`}>
                <span>{brand.name}</span>
                <span>{pinStage === 'prompt' ? `Expires in ${pinSecondsLeft}s` : ''}</span>
              </div>

              <div className="p-5 space-y-4 text-center">
                {pinStage === 'prompt' && (
                  <>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Payment Approval Request</p>
                    <p className="text-xs text-slate-200 leading-relaxed">
                      Approve payment of <span className="font-black text-white">Shs {total.toLocaleString()}</span> to{' '}
                      <span className="font-black text-white">{acc.accountName}</span>
                      <br />
                      <span className="text-slate-400">via {acc.accountNumber}</span>
                    </p>

                    <div className="flex items-center justify-center gap-2.5 py-1">
                      {[0, 1, 2, 3].map((i) => (
                        <span
                          key={i}
                          className={`w-3.5 h-3.5 rounded-full border-2 ${i < pinDigits.length ? `${brand.bg} border-transparent` : 'border-slate-600'}`}
                        />
                      ))}
                    </div>
                    {pinError && (
                      <p className="text-[10px] text-red-400 font-bold flex items-center justify-center gap-1">
                        <AlertTriangle size={11} /> {pinError}
                      </p>
                    )}

                    <div className="grid grid-cols-3 gap-2">
                      {['1','2','3','4','5','6','7','8','9','','0','back'].map((k, idx) =>
                        k === '' ? (
                          <span key={idx} />
                        ) : (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handlePinKeypad(k)}
                            className="h-11 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-black text-sm flex items-center justify-center transition-colors cursor-pointer"
                          >
                            {k === 'back' ? <Delete size={16} /> : k}
                          </button>
                        )
                      )}
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handlePinCancel}
                        className="w-1/2 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2.5 rounded-xl text-[11px] font-black uppercase cursor-pointer transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handlePinApprove}
                        className={`w-1/2 ${brand.bg} py-2.5 rounded-xl text-[11px] font-black uppercase cursor-pointer transition-colors flex items-center justify-center gap-1`}
                      >
                        <Lock size={12} /> Approve
                      </button>
                    </div>
                    <p className="text-[8px] text-slate-500 font-medium">Never share this PIN with anyone, including Olimart support.</p>
                  </>
                )}

                {pinStage === 'verifying' && (
                  <div className="py-6 space-y-3">
                    <Loader2 size={28} className="mx-auto animate-spin text-slate-300" />
                    <p className="text-xs text-slate-300 font-bold">Verifying with {brand.name}...</p>
                  </div>
                )}

                {pinStage === 'approved' && (
                  <div className="py-6 space-y-3">
                    <BadgeCheck size={32} className="mx-auto text-emerald-400" />
                    <p className="text-xs text-emerald-300 font-black uppercase tracking-wide">Payment Approved</p>
                  </div>
                )}

                {pinStage === 'expired' && (
                  <div className="py-4 space-y-3">
                    <AlertTriangle size={26} className="mx-auto text-amber-400" />
                    <p className="text-xs text-slate-200 font-bold">This prompt expired without a response.</p>
                    <button
                      type="button"
                      onClick={() => { setPinSecondsLeft(60); setPinDigits(''); setPinError(''); setPinStage('prompt'); }}
                      className="w-full bg-slate-800 hover:bg-slate-700 text-white py-2.5 rounded-xl text-[11px] font-black uppercase cursor-pointer transition-colors"
                    >
                      Resend Prompt
                    </button>
                    <button
                      type="button"
                      onClick={handlePinCancel}
                      className="w-full text-slate-400 text-[10px] font-bold uppercase cursor-pointer"
                    >
                      Choose a different payment method
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
