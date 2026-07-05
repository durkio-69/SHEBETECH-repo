import React, { useState } from 'react';
import { Store, TrendingUp, Sparkles, ShieldCheck, X, CheckCircle2 } from 'lucide-react';

export default function VendorHighlight() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ storeName: '', phone: '', category: 'fashion' });
  const [isRegistered, setIsRegistered] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.storeName || !formData.phone) return;
    setIsRegistered(true);
  };

  const resetForm = () => {
    setFormData({ storeName: '', phone: '', category: 'fashion' });
    setIsRegistered(false);
    setIsModalOpen(false);
  };

  return (
    <section className="py-8 px-4 max-w-7xl mx-auto" id="vendor-cta-section">
      <div className="bg-gradient-to-r from-orange-600 via-orange-500 to-red-600 rounded-3xl p-8 sm:p-12 text-white relative overflow-hidden shadow-lg border border-orange-400">
        
        {/* Decorative circle shapes in background */}
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute left-1/3 top-1/4 w-32 h-32 bg-yellow-400/10 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
          {/* Text Content */}
          <div className="max-w-2xl space-y-4">
            <span className="bg-yellow-400 text-slate-900 font-black text-[10px] uppercase tracking-widest px-3 py-1 rounded-full inline-flex items-center gap-1.5 shadow-sm">
              <Store size={10} /> Partner with us
            </span>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-none text-white">
              Grow Your Business — Sell on OliMart Uganda!
            </h2>
            <p className="text-sm sm:text-base text-orange-50/90 font-medium max-w-lg leading-relaxed">
              Reach over 500,000+ active buyers across Kampala, Entebbe, Wakiso, Jinja, and beyond. Register your shop today and start selling in under 5 minutes.
            </p>

            {/* Benefits checks */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-orange-50">
                <TrendingUp size={14} className="text-yellow-400" />
                <span>Zero signup fees & lowest commission</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-orange-50">
                <Sparkles size={14} className="text-yellow-400" />
                <span>Free vendor training & dashboard</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-orange-50">
                <ShieldCheck size={14} className="text-yellow-400" />
                <span>Trusted logistics & delivery network</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-orange-50">
                <Store size={14} className="text-yellow-400" />
                <span>Get paid instantly via Mobile Money</span>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex-shrink-0 w-full sm:w-auto flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold px-8 py-4 rounded-2xl text-sm transition-all duration-200 shadow-md hover:scale-105 active:scale-95 cursor-pointer w-full sm:w-auto text-center"
            >
              Start Selling Today
            </button>
            <a
              href="tel:+256700000000"
              className="bg-transparent hover:bg-white/10 text-white border-2 border-white/30 hover:border-white font-bold px-6 py-4 rounded-2xl text-sm transition-all text-center w-full sm:w-auto"
            >
              Call Vendor Support
            </a>
          </div>
        </div>
      </div>

      {/* VENDOR REGISTER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative border border-slate-100 animate-scale-up">
            
            {/* Close */}
            <button 
              onClick={resetForm}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-50 transition-colors"
            >
              <X size={20} />
            </button>

            {!isRegistered ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="text-center space-y-1 mb-2">
                  <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Store size={24} />
                  </div>
                  <h3 className="font-black text-slate-900 text-lg">Seller Registration</h3>
                  <p className="text-xs text-slate-400">Submit details to setup your shop on OliMart</p>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Store/Business Name</label>
                  <input
                    type="text"
                    required
                    value={formData.storeName}
                    onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                    placeholder="e.g. Mukono Electronics Hub"
                    className="w-full text-slate-850 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Contact Number (MTN / Airtel)</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="e.g. 0772 123456"
                    className="w-full text-slate-850 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Primary Selling Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full text-slate-850 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
                  >
                    <option value="fashion">African Wear & Fashion</option>
                    <option value="phones">Phones & Accessories</option>
                    <option value="electronics">Home Appliances & TVs</option>
                    <option value="supermarket">Groceries & Daily Foods</option>
                    <option value="beauty">Cosmetics & Herbal Gel</option>
                  </select>
                </div>

                <div className="pt-3">
                  <button
                    type="submit"
                    className="w-full bg-orange-600 hover:bg-orange-500 text-white font-extrabold py-3 rounded-xl text-xs transition-colors cursor-pointer shadow-sm active:scale-95"
                  >
                    Register My Store
                  </button>
                </div>

                <p className="text-[10px] text-center text-slate-400 leading-normal font-medium">
                  By registering, you agree to our Vendor Terms & Conditions. Our vendor team will call your number within 24 hours.
                </p>
              </form>
            ) : (
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
                  <CheckCircle2 size={36} />
                </div>
                <div className="space-y-1">
                  <h3 className="font-black text-slate-900 text-lg">Congratulations!</h3>
                  <p className="text-xs text-slate-600 font-bold">Your store <span className="text-orange-600">"{formData.storeName}"</span> is pre-registered!</p>
                  <p className="text-xs text-slate-400 font-medium px-4 leading-normal">
                    We have sent a confirmation packet to <strong className="text-slate-800">{formData.phone}</strong>. A dedicated OliMart agent will call you to complete catalog upload.
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    onClick={resetForm}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </section>
  );
}
