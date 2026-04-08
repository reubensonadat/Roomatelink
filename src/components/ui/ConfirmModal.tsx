import { ModalShell } from './ModalShell'

interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  subtitle?: string
  confirmText?: string | React.ReactNode
  cancelText?: string
  variant?: 'danger' | 'default'
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  subtitle,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default'
}: ConfirmModalProps) {
  const isDanger = variant === 'danger'

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
    >
      <div className="flex flex-col gap-6">
        <p className="text-[15px] font-bold text-foreground leading-relaxed">
          {subtitle}
        </p>

        <div className="w-full flex flex-col gap-3">
          <button
            onClick={onConfirm}
            className={`w-full py-5 rounded-[22px] font-black text-[15px] shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center uppercase tracking-widest ${
              isDanger
                ? 'bg-red-500 text-white hover:bg-red-600 shadow-red-500/20'
                : 'bg-primary text-primary-foreground hover:bg-foreground hover:text-background shadow-primary/20'
            }`}
          >
            {confirmText}
          </button>
          <button
            onClick={onClose}
            className="w-full py-4 rounded-[22px] text-muted-foreground font-black text-[12px] hover:text-foreground transition-all uppercase tracking-[0.2em]"
          >
            {cancelText}
          </button>
        </div>
      </div>
    </ModalShell>
  )
}
