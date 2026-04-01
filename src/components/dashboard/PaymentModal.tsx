import { motion, AnimatePresence } from 'framer-motion'
import { X, ShieldCheck, Lock, Check, ChevronRight, ChevronLeft } from 'lucide-react'
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
  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-100 flex items-end md:items-center justify-center pointer-events-none">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-background/80 backdrop-blur-xl pointer-events-auto"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="relative w-full md:w-[920px] max-w-full bg-card border-t md:border border-border rounded-t-[2.5rem] md:rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden pointer-events-auto max-h-[95vh] flex flex-col md:flex-row"
        >
          {/* Left Column (Desktop - Feature Area) */}
          <div className="hidden md:flex md:w-[420px] bg-primary/5 p-12 flex-col justify-center border-r border-border/40 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-3xl blur-3xl translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-3xl blur-3xl -translate-x-1/2 -translate-y-1/2" />

            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="relative mb-10 w-48 h-48">
                <motion.img
                  initial={{ y: 0 }}
                  animate={{ y: [0, -12, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  src="/Savings.png"
                  alt="Savings"
                  className="w-full h-full object-contain"
                />
              </div>
              <h2 className="text-[28px] font-black text-foreground leading-tight mb-4">The Smart Move.</h2>
              <p className="text-[15px] font-medium text-muted-foreground/80 leading-relaxed mb-10 text-center">
                A small verification fee ensures every user is a real, high-quality Campus student.
              </p>

              <div className="w-full space-y-4">
                {[
                  { icon: <ShieldCheck className="w-4 h-4" />, text: "Account Protection" },
                  { icon: <Lock className="w-5 h-5" />, text: "Campuses" },
                  { icon: <Check className="w-4 h-4" />, text: "Verified Community" }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 bg-background/50 backdrop-blur-sm border border-border/40 p-3.5 rounded-2xl shadow-sm">
                    <div className="w-8 h-8 rounded-3xl bg-primary/10 flex items-center justify-center text-primary">
                      {item.icon}
                    </div>
                    <span className="text-[13px] font-bold text-foreground">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Mobile Header / Image */}
          <div className="md:hidden flex flex-col items-center pt-8 pb-4 px-6 text-center">
            <div className="w-32 h-32 mb-4">
              <img src="/Savings.png" alt="Savings" className="w-full h-full object-contain" />
            </div>
            <h2 className="text-[24px] font-black text-foreground leading-tight">Unlock Premium</h2>
            <p className="text-[13px] font-medium text-muted-foreground mt-2 max-w-[280px]">
              Get full verification and start chatting with compatible roommates today.
            </p>
          </div>

          {/* Right Column (Payment Area) */}
          <div className="flex-1 flex flex-col bg-card relative">
            {/* Close Hub (Top Row) */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-50">
              {/* Back Button (Always Visible) */}
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-card/60 backdrop-blur-xl border border-border/40 flex items-center gap-2 hover:bg-foreground hover:text-background transition-all active:scale-95 pointer-events-auto text-foreground group"
              >
                <ChevronLeft className="w-5 h-5 transition-transform group-hover:-translate-x-0.5" />
                <span className="text-[13px] font-black uppercase tracking-wider hidden sm:inline">Back</span>
              </button>

              {/* Close Button (Always Visible) */}
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-xl bg-card/60 backdrop-blur-xl border border-border/40 flex items-center justify-center hover:bg-destructive hover:text-white transition-all active:scale-95 pointer-events-auto text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 p-6 md:p-12 overflow-y-auto flex flex-col justify-center">
              <h3 className="text-[12px] font-bold text-primary uppercase tracking-[0.2em] mb-6 md:mb-8 text-center md:text-left">Verification Details</h3>

              {/* Discount Code Input */}
              {!discountApplied ? (
                <div className="w-full mb-8">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={discountCode}
                        onChange={(e) => onDiscountCodeChange(e.target.value)}
                        placeholder="PROMO CODE"
                        className="w-full px-5 py-4 bg-muted/40 border-2 border-border/40 rounded-2xl text-[15px] font-bold outline-none focus:border-primary/50 transition-all placeholder:text-muted-foreground/30"
                        disabled={isApplyingDiscount}
                      />
                    </div>
                    <button
                      onClick={onApplyDiscount}
                      disabled={!discountCode.trim() || isApplyingDiscount}
                      className="px-6 py-4 bg-primary text-white font-black rounded-2xl hover:bg-foreground transition-all disabled:opacity-40 text-[14px]"
                    >
                      {isApplyingDiscount ? '...' : 'Apply'}
                    </button>
                  </div>
                  {discountError && <p className="text-[12px] text-red-500 font-bold mt-2 pl-1">{discountError}</p>}
                </div>
              ) : (
                <div className="w-full mb-8">
                  <div className="flex items-center justify-between bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-3xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                        <Check className="w-5 h-5 text-white" strokeWidth={3} />
                      </div>
                      <div>
                        <p className="text-[13px] font-black text-emerald-600">₵10.00 OFF Applied</p>
                        <p className="text-[11px] font-bold text-emerald-600 uppercase">{discountCode}</p>
                      </div>
                    </div>
                    <button onClick={onRemoveDiscount} className="text-[12px] font-black text-emerald-600 border-b border-emerald-600/30 hover:text-emerald-500">Remove</button>
                  </div>
                </div>
              )}

              {/* Verification Summary */}
              <div className="space-y-4 mb-10 md:mb-12">
                <div className="flex justify-between items-center text-[15px] font-bold text-muted-foreground px-1">
                  <span>Premium Access</span>
                  <span>GHS 25.00</span>
                </div>
                {discountApplied && (
                  <div className="flex justify-between items-center text-[15px] font-bold text-emerald-600 px-1">
                    <span>Promo Discount</span>
                    <span>-GHS 10.00</span>
                  </div>
                )}
                <div className="h-px bg-border/60 mx-1" />
                <div className="flex justify-between items-center px-1">
                  <span className="text-[17px] font-black text-foreground">Total Fee</span>
                  <span className="text-[26px] font-black text-primary">GHS {finalPrice.toFixed(2)}</span>
                </div>
              </div>

              {/* Final Button */}
              <div className="space-y-4">
                <PaystackPaymentButton
                  email={email}
                  amount={finalPrice}
                  onSuccess={onPaymentSuccess}
                  onClose={onPaymentClose}
                  className="w-full py-5 bg-foreground text-background font-black rounded-2xl shadow-xl shadow-foreground/10 hover:shadow-2xl transition-all active:scale-[0.98] text-[16px] flex items-center justify-center gap-3 border border-white/10"
                >
                  Complete Verification <ChevronRight className="w-5 h-5" />
                </PaystackPaymentButton>
                <button
                  onClick={onClose}
                  className="w-full py-4 text-[13px] font-bold text-muted-foreground hover:text-foreground transition-colors"
                >
                  Maybe Later
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
