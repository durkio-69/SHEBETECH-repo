import React from 'react';
import { Check, ClipboardList, Package, Truck, Smile } from 'lucide-react';

export type OrderStatus = 'placed' | 'dispatched' | 'transit' | 'delivered';

interface StepperProps {
  currentStatus: OrderStatus;
}

export default function Stepper({ currentStatus }: StepperProps) {
  const steps: { key: OrderStatus; label: string; desc: string; icon: any }[] = [
    { 
      key: 'placed', 
      label: 'Order Placed', 
      desc: 'Seller confirmed', 
      icon: ClipboardList 
    },
    { 
      key: 'dispatched', 
      label: 'Ready for Dispatch', 
      desc: 'Boda dispatch sorted', 
      icon: Package 
    },
    { 
      key: 'transit', 
      label: 'In Transit', 
      desc: 'Rider en-route', 
      icon: Truck 
    },
    { 
      key: 'delivered', 
      label: 'Delivered', 
      desc: 'Received safely', 
      icon: Smile 
    }
  ];

  const getStatusIndex = (status: OrderStatus) => {
    switch (status) {
      case 'placed': return 0;
      case 'dispatched': return 1;
      case 'transit': return 2;
      case 'delivered': return 3;
      default: return 0;
    }
  };

  const currentIndex = getStatusIndex(currentStatus);

  return (
    <div className="w-full py-4 px-2" id="order-stepper-tracker">
      <div className="relative flex items-center justify-between">
        
        {/* Background connector line */}
        <div className="absolute left-0 right-0 top-[22px] h-[3px] bg-slate-100 dark:bg-slate-800 -z-0" />

        {/* Filled active connector line */}
        <div 
          className="absolute left-0 top-[22px] h-[3px] bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-700 ease-in-out -z-0"
          style={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
        />

        {steps.map((step, idx) => {
          const StepIcon = step.icon;
          const isCompleted = idx < currentIndex;
          const isActive = idx === currentIndex;
          const isPending = idx > currentIndex;

          return (
            <div key={step.key} className="flex flex-col items-center flex-1 relative z-10">
              
              {/* Stepper Node Circle */}
              <div 
                className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-500 border-2 ${
                  isCompleted 
                    ? 'bg-gradient-to-br from-emerald-500 to-teal-600 border-emerald-400 text-white shadow-md shadow-emerald-200/50 dark:shadow-none' 
                    : isActive 
                    ? 'bg-gradient-to-br from-orange-500 to-amber-600 border-orange-400 text-white shadow-lg shadow-orange-300/40 dark:shadow-none scale-110' 
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600'
                }`}
              >
                {isCompleted ? (
                  <Check size={18} strokeWidth={3} className="animate-pulse" />
                ) : (
                  <StepIcon size={18} strokeWidth={isActive ? 2.5 : 2} />
                )}
              </div>

              {/* Step Labels */}
              <div className="text-center mt-2.5 max-w-[85px] sm:max-w-[100px]">
                <p 
                  className={`text-3xs font-black uppercase tracking-tight transition-colors duration-300 ${
                    isActive 
                      ? 'text-orange-600 dark:text-orange-400 font-extrabold' 
                      : isCompleted 
                      ? 'text-emerald-600 dark:text-emerald-400 font-bold' 
                      : 'text-slate-500 dark:text-slate-500'
                  }`}
                >
                  {step.label}
                </p>
                <p className="text-4xs text-slate-400 dark:text-slate-500 mt-0.5 leading-none">
                  {step.desc}
                </p>
              </div>

            </div>
          );
        })}

      </div>
    </div>
  );
}
