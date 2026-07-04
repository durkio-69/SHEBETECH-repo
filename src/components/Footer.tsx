import React, { useState } from 'react';
import { 
  Facebook, 
  Twitter, 
  Instagram, 
  Youtube, 
  Send, 
  HelpCircle, 
  Truck, 
  RotateCcw, 
  CheckCircle,
  Smartphone,
  Coins,
  CreditCard
} from 'lucide-react';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsSubscribed(true);
    setEmail('');
  };

  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-8 border-t border-slate-800" id="main-footer">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
        
        {/* About & Branding Column */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="bg-orange-500 p-1.5 rounded-lg">
              <div className="w-5 h-5 border-4 border-white rounded-xs"></div>
            </div>
            <span className="text-2xl font-black tracking-tighter text-white uppercase">
              Oli<span className="text-orange-500 italic">Mart</span>
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed font-medium">
            Olimart is Uganda’s premier online e-commerce marketplace. We make buying and selling daily goods, high-tech appliances, fashion wear, and supermarket items safe, fast, and remarkably affordable across all districts.
          </p>

          {/* Social icons */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Join Our Community</h4>
            <div className="flex gap-3">
              <a href="#" className="p-2 bg-slate-800 text-slate-300 hover:text-orange-500 rounded-full transition-colors">
                <Facebook size={16} />
              </a>
              <a href="#" className="p-2 bg-slate-800 text-slate-300 hover:text-orange-500 rounded-full transition-colors">
                <Twitter size={16} />
              </a>
              <a href="#" className="p-2 bg-slate-800 text-slate-300 hover:text-orange-500 rounded-full transition-colors">
                <Instagram size={16} />
              </a>
              <a href="#" className="p-2 bg-slate-800 text-slate-300 hover:text-orange-500 rounded-full transition-colors">
                <Youtube size={16} />
              </a>
            </div>
          </div>
        </div>

        {/* Customer Support Links */}
        <div className="space-y-4">
          <h4 className="text-xs font-black uppercase tracking-wider text-white">Customer Service</h4>
          <ul className="space-y-2 text-xs">
            <li>
              <a href="#" className="hover:text-orange-500 transition-colors flex items-center gap-1.5 font-medium">
                <HelpCircle size={13} /> Help Center & FAQs
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-orange-500 transition-colors flex items-center gap-1.5 font-medium">
                <RotateCcw size={13} /> Easy 7-Day Returns Policy
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-orange-500 transition-colors flex items-center gap-1.5 font-medium">
                <Truck size={13} /> Track Your Delivery Route
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-orange-500 transition-colors flex items-center gap-1.5 font-medium">
                <CheckCircle size={13} /> Official Stores Guarantee
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-orange-500 transition-colors font-medium">
                Report a Counterfeit Product
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-orange-500 transition-colors font-medium">
                Mobile Money Payment Guide
              </a>
            </li>
          </ul>
        </div>

        {/* Payment & App download */}
        <div className="space-y-6">
          {/* Payments accepted */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-white">Payments Accepted</h4>
            <div className="flex flex-wrap gap-2">
              <div className="w-16 h-8 bg-white/5 hover:bg-white/10 rounded border border-white/10 flex flex-col items-center justify-center text-4xs font-black tracking-wider text-slate-300 transition-colors">
                <span className="w-2 h-2 rounded-full bg-yellow-400 mb-0.5" />
                MTN
              </div>
              <div className="w-16 h-8 bg-white/5 hover:bg-white/10 rounded border border-white/10 flex flex-col items-center justify-center text-4xs font-black tracking-wider text-slate-300 transition-colors">
                <span className="w-2 h-2 rounded-full bg-red-600 mb-0.5" />
                AIRTEL
              </div>
              <div className="w-16 h-8 bg-white/5 hover:bg-white/10 rounded border border-white/10 flex flex-col items-center justify-center text-4xs font-black tracking-wider text-slate-300 transition-colors">
                <CreditCard size={11} className="text-orange-500 mb-0.5" />
                VISA
              </div>
              <div className="w-16 h-8 bg-white/5 hover:bg-white/10 rounded border border-white/10 flex flex-col items-center justify-center text-4xs font-black tracking-wider text-slate-300 transition-colors">
                <Coins size={11} className="text-yellow-500 mb-0.5" />
                CASH
              </div>
            </div>
          </div>

          {/* App store downloads */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-white">Download Olimart Apps</h4>
            <div className="flex flex-col sm:flex-row gap-2">
              {/* Google Play */}
              <a href="#" className="flex items-center gap-2 bg-slate-800 hover:bg-slate-750 p-2 rounded-xl transition-colors border border-slate-700/50">
                <span className="text-xs text-orange-500 font-extrabold text-center w-full">Google Play Store</span>
              </a>
              {/* App Store */}
              <a href="#" className="flex items-center gap-2 bg-slate-800 hover:bg-slate-750 p-2 rounded-xl transition-colors border border-slate-700/50">
                <span className="text-xs text-orange-500 font-extrabold text-center w-full">iOS App Store</span>
              </a>
            </div>
          </div>
        </div>

        {/* Newsletter Signup Column */}
        <div className="space-y-4">
          <h4 className="text-xs font-black uppercase tracking-wider text-white">Join Our Newsletter</h4>
          <p className="text-xs text-slate-400 leading-normal font-medium">
            Subscribe today and receive a <strong>Shs 10,000 discount voucher</strong> sent instantly to your inbox for your first shopping order!
          </p>

          {!isSubscribed ? (
            <form onSubmit={handleSubscribe} className="flex rounded-xl overflow-hidden bg-slate-800 p-1 border border-slate-700 focus-within:border-orange-500">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address"
                className="bg-transparent text-slate-100 placeholder-slate-500 px-3 py-2 text-xs focus:outline-none flex-1 min-w-0"
              />
              <button 
                type="submit"
                className="bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Send size={12} />
                <span>Join</span>
              </button>
            </form>
          ) : (
            <div className="bg-orange-950/40 border border-orange-800/60 p-3 rounded-xl text-xs space-y-1">
              <p className="text-orange-400 font-bold">🎉 Welcome to the Olimart Family!</p>
              <p className="text-3xs text-slate-300 font-medium leading-relaxed">
                Check your inbox! We've sent coupon code <strong className="text-yellow-400">MARTUG10</strong> for an immediate Shs 10,000 discount.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* Under footer copyright */}
      <div className="max-w-7xl mx-auto px-4 mt-12 pt-6 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-500 font-medium">
        <p>&copy; 2026 Olimart Uganda Ltd. All rights reserved.</p>
        <div className="flex gap-4">
          <a href="#" className="hover:underline">Privacy Policy</a>
          <span>&bull;</span>
          <a href="#" className="hover:underline">Terms of Service</a>
          <span>&bull;</span>
          <a href="#" className="hover:underline">Sitemap</a>
        </div>
      </div>
    </footer>
  );
}
