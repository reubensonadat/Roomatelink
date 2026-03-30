"use client";
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X, Zap, Shield, Sparkles, Crown, Tag } from 'lucide-react';
import Image from 'next/image';

interface PricingCardProps {
  className?: string;
}

const DISCOUNT_CODES = {
  ROOMMATE10: { label: 'ROOMMATE10', discount: 10 },
  WELCOME10: { label: 'WELCOME10', discount: 10 },
  PITCH10: { label: 'PITCH10', discount: 10 },
};

export function PricingCard({ className = '' }: PricingCardProps) {
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<number | null>(null);
  const [showDiscountInput, setShowDiscountInput] = useState(false);
  const [isInvalidCode, setIsInvalidCode] = useState(false);

  const originalPrice = 25;
  const finalPrice = appliedDiscount ? originalPrice - appliedDiscount : originalPrice;

  const handleApplyDiscount = () => {
    const code = discountCode.trim().toUpperCase();
    
    if (DISCOUNT_CODES[code as keyof typeof DISCOUNT_CODES]) {
      setAppliedDiscount(DISCOUNT_CODES[code as keyof typeof DISCOUNT_CODES].discount);
      setIsInvalidCode(false);
    } else if (code) {
      setIsInvalidCode(true);
      setAppliedDiscount(null);
    }
  };

  const handleRemoveDiscount = () => {
    setDiscountCode('');
    setAppliedDiscount(null);
    setIsInvalidCode(false);
  };

  return (
    <div className={`relative w-full max-w-md mx-auto ${className}`}>
      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 rounded-[2.5rem] shadow-2xl shadow-indigo-500/25 overflow-hidden"
      >
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

        {/* Content */}
        <div className="relative z-10 p-8 md:p-10">
          {/* Badge */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="flex items-center gap-1.5 px-4 py-2 bg-white/20 rounded-full backdrop-blur-sm">
              <Sparkles className="w-4 h-4 text-yellow-300" />
              <span className="text-[13px] font-bold text-white uppercase tracking-wider">Premium</span>
            </div>
          </div>

          {/* Price Display */}
          <div className="text-center mb-6">
            {appliedDiscount ? (
              <div className="flex items-center justify-center gap-3 mb-2">
                <span className="text-[32px] md:text-[36px] font-black text-white/50 line-through">
                  GHS {originalPrice}
                </span>
                <Tag className="w-6 h-6 text-emerald-300" />
                <span className="text-[42px] md:text-[48px] font-black text-white">
                  GHS {finalPrice}
                </span>
              </div>
            ) : (
              <div className="mb-2">
                <span className="text-[42px] md:text-[48px] font-black text-white">
                  GHS {originalPrice}
                </span>
              </div>
            )}
            <p className="text-[14px] md:text-[15px] font-medium text-white/80">
              One-time payment • Lifetime access
            </p>
          </div>

          {/* Discount Input */}
          {showDiscountInput ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4"
            >
              <div className="relative">
                <input
                  type="text"
                  value={discountCode}
                  onChange={(e) => {
                    setDiscountCode(e.target.value);
                    setIsInvalidCode(false);
                  }}
                  placeholder="Enter discount code"
                  className={`w-full bg-white/10 backdrop-blur-sm border-2 rounded-xl px-4 py-3.5 text-white font-bold text-[15px] outline-none placeholder:text-white/40 transition-all ${
                    isInvalidCode
                      ? 'border-red-400'
                      : 'border-white/20 focus:border-white/50'
                  }`}
                />
                {isInvalidCode && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-red-300 text-[12px] font-medium">
                    <X className="w-3.5 h-3.5" />
                    Invalid code
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleApplyDiscount}
                  className="flex-1 py-3 bg-white text-indigo-600 rounded-xl font-bold text-[14px] hover:bg-white/90 active:scale-[0.98] transition-all"
                >
                  Apply
                </button>
                <button
                  onClick={() => {
                    setShowDiscountInput(false);
                    setDiscountCode('');
                    setIsInvalidCode(false);
                  }}
                  className="px-4 py-3 bg-white/10 text-white rounded-xl font-medium text-[14px] hover:bg-white/20 active:scale-[0.98] transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          ) : (
            <button
              onClick={() => setShowDiscountInput(true)}
              className="w-full py-3 bg-white/10 text-white rounded-xl font-medium text-[14px] hover:bg-white/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <Tag className="w-4 h-4" />
              Have a discount code?
            </button>
          )}

          {/* Features */}
          <div className="space-y-3 mb-6">
            {[
              { icon: Crown, text: 'Unlock all roommate identities', included: true },
              { icon: Shield, text: 'Unlimited messaging', included: true },
              { icon: Zap, text: 'Priority matching algorithm', included: true },
              { icon: Sparkles, text: 'Verified badge on profile', included: true },
            ].map((feature, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                  feature.included ? 'bg-emerald-400/20' : 'bg-white/10'
                }`}>
                  {feature.included ? (
                    <Check className="w-3.5 h-3.5 text-emerald-300" strokeWidth={3} />
                  ) : (
                    <X className="w-3.5 h-3.5 text-white/40" strokeWidth={2.5} />
                  )}
                </div>
                <span className={`text-[14px] font-medium ${
                  feature.included ? 'text-white' : 'text-white/50'
                }`}>
                  {feature.text}
                </span>
              </div>
            ))}
          </div>

          {/* CTA Button */}
          <button className="w-full py-4.5 bg-white text-indigo-600 rounded-2xl font-black text-[16px] shadow-lg hover:bg-white/90 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2">
            <span>Unlock Now</span>
            <Crown className="w-5 h-5" />
          </button>

          {/* Trust Badge */}
          <div className="flex items-center justify-center gap-2 mt-4">
            <Shield className="w-4 h-4 text-white/60" />
            <span className="text-[12px] font-medium text-white/60">
              Secure payment • 100% satisfaction
            </span>
          </div>
        </div>
      </motion.div>

      {/* Savings Badge */}
      {appliedDiscount && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute -top-3 -right-3 z-20"
        >
          <div className="bg-emerald-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
            <Zap className="w-4 h-4" />
            <span className="text-[13px] font-bold">
              Save GHS {appliedDiscount}!
            </span>
          </div>
        </motion.div>
      )}
    </div>
  );
}
