import React from 'react';
import { Truck, Coins, ShieldCheck, RefreshCw } from 'lucide-react';

export default function TrustBadges() {
  const guarantees = [
    {
      id: 'g1',
      icon: Truck,
      title: 'Free Delivery Available',
      desc: 'Free delivery on qualifying orders above Shs 150,000 within Kampala & Wakiso.',
      color: 'bg-orange-50 text-orange-600',
    },
    {
      id: 'g2',
      icon: Coins,
      title: 'Pay on Delivery Option',
      desc: 'Pay safely with Cash, MTN MoMo, or Airtel Money only when your package is delivered.',
      color: 'bg-emerald-50 text-emerald-600',
    },
    {
      id: 'g3',
      icon: ShieldCheck,
      title: '100% Verified Sellers',
      desc: 'Look for the "Verified Official" tag for items direct from authorized distributors.',
      color: 'bg-blue-50 text-blue-600',
    },
    {
      id: 'g4',
      icon: RefreshCw,
      title: 'Hassle-Free 7-Day Returns',
      desc: 'Enjoy peace of mind with our 7-day easy returns policy on all qualifying items.',
      color: 'bg-amber-50 text-amber-600',
    },
  ];

  return (
    <section className="py-8 px-4 max-w-7xl mx-auto" id="trust-benefits-section">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 bg-white p-8 rounded-3xl border border-slate-100 shadow-xs">
        {guarantees.map((g) => {
          const Icon = g.icon;
          return (
            <div key={g.id} className="flex gap-4 items-start sm:text-left text-left group">
              {/* Icon */}
              <div className={`p-3.5 rounded-2xl flex-shrink-0 transition-transform group-hover:scale-110 ${g.color}`}>
                <Icon size={24} />
              </div>

              {/* Text */}
              <div className="space-y-1">
                <h3 className="font-extrabold text-sm text-slate-900 group-hover:text-orange-600 transition-colors">
                  {g.title}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  {g.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
