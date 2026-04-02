import { ShieldCheck, Lock, Check, ChevronRight, CreditCard } from 'lucide-react'
import PaystackPaymentButton from '../PaystackPaymentButton'
import { ModalShell } from '../ui/ModalShell'

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
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="Secure Checkout"
      subtitle="Institutional Access Hub"
      maxWidth="md:w-[940px]"
    >
      <div className="flex flex-col md:flex-row min-h-0">
        {/* Left Column (Desktop - Feature Area) */}
        <div className="hidden md:flex md:w-[400px] bg-muted/20 p-10 flex-col justify-center border-r border-border/40 relative shrink-0">
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-foreground text-background rounded-3xl flex items-center justify-center mb-8 shadow-premium">
              <CreditCard className="w-8 h-8" />
            </div>
            
            <h2 className="text-[26px] font-black text-foreground tracking-tight leading-none mb-3 uppercase">Institutional Access</h2>
            <p className="text-[13px] font-medium text-muted-foreground leading-relaxed mb-10">
              A one-time verification fee secures the hub and ensures every synchronization is with a real campus student.
            </p>

            <div className="w-full space-y-3">
              {[
                { icon: <ShieldCheck className="w-4 h-4" />, text: "Account Protection" },
                { icon: <Lock className="w-4 h-4" />, text: "Verified Campus Hub" },
                { icon: <Check className="w-4 h-4" />, text: "Quality Match Protocol" }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3.5 glass-v2 p-4 rounded-xl shadow-sm border border-border/40">
                  <div className="w-7 h-7 rounded-lg bg-foreground text-background flex items-center justify-center">
                    {item.icon}
                  </div>
                  <span className="text-[11px] font-black text-foreground uppercase tracking-wider">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (Payment Area) */}
        <div className="flex-1 flex flex-col bg-card relative min-h-0">
          <div className="flex-1 p-8 md:p-12 overflow-y-auto flex flex-col justify-center scroll-smooth">
            <div className="mb-10 text-center md:text-left">
              <h3 className="text-[11px] font-black text-primary uppercase tracking-[0.3em] mb-2">Checkout Hub</h3>
              <h4 className="text-[22px] font-black text-foreground tracking-tight uppercase">Secure Verification</h4>
            </div>

            {/* Discount Code Area */}
            {!discountApplied ? (
              <div className="w-full mb-10">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={discountCode}
                    onChange={(e) => onDiscountCodeChange(e.target.value)}
                    placeholder="PROMO CODE"
                    className="flex-1 px-6 py-4.5 bg-muted/40 border border-border/60 rounded-2xl text-[14px] font-black outline-none focus:border-primary/50 transition-all placeholder:text-muted-foreground/30 uppercase tracking-widest"
                  />
                  <button
                    onClick={onApplyDiscount}
                    disabled={!discountCode.trim() || isApplyingDiscount}
                    className="px-8 py-4.5 bg-foreground text-background font-black rounded-2xl hover:bg-primary hover:text-white transition-all disabled:opacity-30 text-[13px] uppercase tracking-widest"
                  >
                    {isApplyingDiscount ? '...' : 'Verify'}
                  </button>
                </div>
                {discountError && <p className="text-[10px] text-red-500 font-black mt-2 pl-1 uppercase tracking-wider">{discountError}</p>}
              </div>
            ) : (
              <div className="w-full mb-10">
                <div className="flex items-center justify-between glass-v2 border border-emerald-500/30 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                      <Check className="w-5 h-5 text-white stroke-[4]" />
                    </div>
                    <div>
                      <p className="text-[13px] font-black text-emerald-600 uppercase tracking-tight italic">Elite Discount Applied</p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">{discountCode}</p>
                    </div>
                  </div>
                  <button onClick={onRemoveDiscount} className="text-[11px] font-black text-muted-foreground hover:text-red-500 transition-colors uppercase tracking-widest">Remove</button>
                </div>
              </div>
            )}

            {/* Summary Area */}
            <div className="flex flex-col gap-5 mb-10">
              <div className="flex justify-between items-center text-[13px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                <span>Verification Fee</span>
                <span>₵{amount.toFixed(2)}</span>
              </div>
              {discountApplied && (
                <div className="flex justify-between items-center text-[13px] font-black text-emerald-600 uppercase tracking-[0.2em]">
                  <span>Privilege Discount</span>
                  <span>-₵10.00</span>
                </div>
              )}
              <div className="h-px bg-border/40" />
              <div className="flex justify-between items-baseline pt-2">
                <span className="text-[15px] font-black text-foreground uppercase tracking-[0.3em]">Total Due</span>
                <span className="text-[32px] font-black text-foreground tracking-tighter">₵{finalPrice.toFixed(2)}</span>
              </div>
            </div>

            {/* Action Hub */}
            <div className="space-y-4">
              <PaystackPaymentButton
                email={email}
                amount={finalPrice}
                onSuccess={onPaymentSuccess}
                onClose={onPaymentClose}
                className="w-full py-5.5 bg-foreground text-background font-black rounded-2xl shadow-elevated hover:bg-primary hover:text-white transition-all active:scale-[0.98] text-[16px] flex items-center justify-center gap-3 uppercase tracking-[0.2em] border border-white/5"
              >
                Confirm & Synchronize <ChevronRight className="w-5 h-5" />
              </PaystackPaymentButton>
              <button
                onClick={onClose}
                className="w-full py-4 text-[11px] font-black text-muted-foreground hover:text-foreground transition-colors uppercase tracking-[0.3em] opacity-60 hover:opacity-100"
              >
                Maybe Later
              </button>
            </div>
            
            <div className="mt-10 flex flex-col items-center gap-3 opacity-40">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-muted-foreground" />
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Encrypted Checkout</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ModalShell>
  )
}
