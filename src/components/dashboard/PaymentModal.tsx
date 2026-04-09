import { motion, AnimatePresence } from 'framer-motion'
import { ShieldCheck, Check, ChevronRight, X, Sparkles, Loader2 } from 'lucide-react'
import PaystackPaymentButton from '../PaystackPaymentButton'

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  email: string
  amount: number
  discountCode: string
  discountApplied: boolean
  discountError: string
  finalPrice: number
  isApplyingDiscount: boolean
  onDiscountCodeChange: (code: string) => void
  onApplyDiscount: () => void
  onRemoveDiscount: () => void
  onPaymentSuccess: (reference: any) => void
  onPaymentClose: () => void
}

export function PaymentModal({
  isOpen,
  onClose,
  email,
  amount,
  discountCode,
  discountApplied,
  discountError,
  finalPrice,
  isApplyingDiscount,
  onDiscountCodeChange,
  onApplyDiscount,
  onRemoveDiscount,
  onPaymentSuccess,
  onPaymentClose
}: PaymentModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center p-0 sm:p-6">
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/60 backdrop-blur-xl"
          />

          {/* Bottom Sheet Modal */}
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 300, mass: 0.8 }}
            className="relative w-full max-w-[92%] md:max-w-4xl bg-card border-t sm:border border-border/80 rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-premium overflow-hidden flex flex-col md:flex-row max-h-[92vh] sm:max-h-[85vh]"
          >
            {/* Left Column (Desktop - Feature Area) */}
            <div className="hidden md:flex md:w-[380px] bg-primary/5 p-10 flex-col justify-center border-r border-border/40 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-3xl blur-3xl translate-x-1/2 -translate-y-1/2" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-3xl blur-3xl -translate-x-1/2 translate-y-1/2" />

              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="relative mb-10 w-48 h-48">
                  <motion.img
                    initial={{ y: 0 }}
                    animate={{ y: [0, -12, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    src="/Savings.png"
                    alt="Savings"
                    className="w-full h-full object-contain drop-shadow-2xl"
                  />
                </div>
                <h2 className="text-[28px] font-black text-foreground leading-tight mb-4 tracking-tight uppercase">The Smart Move.</h2>
                <p className="text-[14px] font-bold text-muted-foreground/70 leading-relaxed mb-8 text-center uppercase tracking-wide">
                  A small verification fee ensures every student is real and Campus-Verified.
                </p>

                <div className="w-full space-y-4">
                  {[
                    { icon: <ShieldCheck className="w-4 h-4" />, text: "Institutional Protection" },
                    { icon: <Sparkles className="w-4 h-4" />, text: "Elite DNA Matching" },
                    { icon: <Check className="w-4 h-4" />, text: "Campus-Verified Hub" }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-4 bg-background/40 backdrop-blur-md border border-border/40 p-4 rounded-[22px] shadow-sm group hover:border-primary/30 transition-all">
                      <div className="w-9 h-9 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                        {item.icon}
                      </div>
                      <span className="text-[11px] font-black text-foreground uppercase tracking-widest">{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column (Payment Area) */}
            <div className="flex-1 flex flex-col bg-card relative min-h-0">
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-6 right-6 w-12 h-12 rounded-[22px] bg-muted/40 flex items-center justify-center hover:bg-foreground hover:text-background transition-all active:scale-95 shadow-sm z-50 border border-border/40 backdrop-blur-sm"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex-1 p-6 md:p-10 overflow-y-auto flex flex-col justify-center scroll-smooth">
                <div className="mb-10 text-center md:text-left">
                  <h3 className="text-[12px] font-black text-primary uppercase tracking-[0.4em] mb-4">Verification Hub</h3>
                  <h4 className="text-[32px] font-black text-foreground tracking-tighter uppercase leading-none">Checkout Securely</h4>
                </div>

                {/* Discount Code Area */}
                {!discountApplied ? (
                  <div className="w-full mb-10">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={discountCode}
                          onChange={(e) => onDiscountCodeChange(e.target.value.toUpperCase())}
                          placeholder="PROMO CODE"
                          className="w-full px-6 py-5 bg-muted/30 border-2 border-border/40 rounded-[22px] text-[15px] font-black outline-none focus:border-primary/50 transition-all placeholder:text-muted-foreground/30 uppercase tracking-widest"
                        />
                      </div>
                      <button
                        onClick={onApplyDiscount}
                        disabled={!discountCode.trim() || isApplyingDiscount}
                        className="px-10 py-6 bg-foreground text-background font-black rounded-[22px] hover:bg-primary hover:text-white transition-all disabled:opacity-30 text-[14px] uppercase tracking-widest shadow-xl active:scale-95 flex items-center justify-center min-w-[140px]"
                      >
                        {isApplyingDiscount ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Apply'}
                      </button>
                    </div>
                    {discountError && <p className="text-[11px] text-red-500 font-black mt-3 pl-2 uppercase tracking-wider animate-pulse">{discountError}</p>}
                  </div>
                ) : (
                  <div className="w-full mb-10 animate-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center justify-between bg-primary/5 border border-primary/20 rounded-[22px] p-6 shadow-inner">
                      <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-[18px] bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                          <Check className="w-6 h-6 text-white stroke-[4]" />
                        </div>
                        <div>
                          <p className="text-[14px] font-black text-primary uppercase tracking-tight italic leading-none">Privilege Applied</p>
                          <p className="text-[11px] font-bold text-muted-foreground uppercase mt-1 tracking-widest">{discountCode}</p>
                        </div>
                      </div>
                      <button onClick={onRemoveDiscount} className="px-4 py-2 text-[11px] font-black text-muted-foreground hover:text-red-500 transition-colors uppercase tracking-[0.2em]">Remove</button>
                    </div>
                  </div>
                )}

                {/* Summary Area */}
                <div className="flex flex-col gap-5 mb-10">
                  <div className="flex justify-between items-center text-[13px] font-black text-muted-foreground/60 uppercase tracking-[0.3em]">
                    <span>Campus Entry Fee</span>
                    <span>₵{amount.toFixed(2)}</span>
                  </div>
                  {discountApplied && (
                    <div className="flex justify-between items-center text-[14px] font-black text-primary uppercase tracking-[0.3em] bg-primary/5 p-3 rounded-xl border border-primary/10">
                      <span>Elite Reward</span>
                      <span>-₵{(amount - finalPrice).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="h-px bg-border/40 w-full" />
                  <div className="flex justify-between items-baseline pt-4">
                    <span className="text-[16px] font-black text-foreground uppercase tracking-[0.4em]">Total Duo</span>
                    <span className="text-[42px] font-black text-foreground tracking-tighter tabular-nums leading-none">₵{finalPrice.toFixed(2)}</span>
                  </div>
                </div>

                {/* Action Hub */}
                <div className="space-y-5">
                  <PaystackPaymentButton
                    email={email}
                    amount={finalPrice}
                    promoCode={discountCode}
                    onSuccess={onPaymentSuccess}
                    onClose={onPaymentClose}
                    className="w-full h-[72px] bg-foreground text-background font-black rounded-[22px] shadow-2xl hover:bg-primary hover:text-white transition-all active:scale-[0.98] text-[17px] flex items-center justify-center gap-4 uppercase tracking-[0.3em] border border-white/5 group"
                  >
                    Confirm access <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                  </PaystackPaymentButton>
                  <p className="text-[10px] font-bold text-muted-foreground/40 text-center uppercase tracking-[0.4em] leading-relaxed px-6">
                    Verified through institutional node. Encrypted by Paystack.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
