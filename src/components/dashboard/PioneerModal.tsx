import { Crown, PartyPopper } from 'lucide-react'
import { ModalShell } from '../ui/ModalShell'

interface PioneerModalProps {
  isOpen: boolean
  onClose: () => void
  onClaim: () => void
}

export function PioneerModal({ isOpen, onClose, onClaim }: PioneerModalProps) {
  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="Pioneer Status"
      subtitle="Exclusive Batch Access"
      maxWidth="md:w-[440px]"
    >
      <div className="flex flex-col items-center text-center py-4">
        <div className="w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center mb-6 shadow-inner border border-primary/20">
          <Crown className="w-8 h-8 text-primary" />
        </div>

        <p className="text-[14px] text-muted-foreground font-medium leading-relaxed mb-8 px-2">
          You are officially one of the very first 100 students to join the roommate revolution. To say thank you, we've completely <span className="text-primary font-black uppercase tracking-widest">waived</span> your verification fee.
          <br /><br />
          <span className="text-foreground font-extrabold uppercase tracking-tight">Your Premium access is free forever.</span>
        </p>

        <button
          onClick={onClaim}
          className="w-full h-[60px] bg-primary text-white font-black text-[16px] rounded-2xl flex items-center justify-center gap-3 hover:bg-primary/90 transition-all active:scale-[0.98] shadow-lg uppercase tracking-widest"
        >
          Claim Pioneer Access <PartyPopper className="w-5 h-5" />
        </button>
      </div>
    </ModalShell>
  )
}
