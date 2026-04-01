import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Flag, X, AlertTriangle, UserX, Send, Check } from 'lucide-react'
import { toast } from 'sonner'

interface ReportModalProps {
  isOpen: boolean
  onClose: () => void
  reportedName: string
  reportedId: string
}

const REPORT_REASONS = [
  { id: 'harassment', label: 'Harassment or bullying', icon: AlertTriangle },
  { id: 'fake_profile', label: 'Fake profile or scammer', icon: UserX },
  { id: 'inappropriate', label: 'Inappropriate behavior', icon: Flag },
  { id: 'other', label: 'Other reason', icon: Flag },
]

export function ReportModal({ isOpen, onClose, reportedName, reportedId }: ReportModalProps) {
  const [selectedReason, setSelectedReason] = useState('')
  const [details, setDetails] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = () => {
    if (!selectedReason || !details.trim()) return
    setIsSubmitting(true)
    
    // In production, this would submit to your backend
    console.log('Report submitted:', { reportedId, reason: selectedReason, details })

    setTimeout(() => {
      setIsSubmitting(false)
      setSelectedReason('')
      setDetails('')
      onClose()
      toast.success('Report submitted successfully', {
        icon: <Check className="w-5 h-5 text-white" />,
        description: 'Thank you for helping keep the Campus ecosystem safe.'
      })
    }, 1500)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-10 pointer-events-none">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-background/60 backdrop-blur-md pointer-events-auto"
          />
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="relative w-full md:w-[540px] bg-card border-t md:border border-border rounded-t-[2.5rem] md:rounded-3xl shadow-2xl overflow-hidden pointer-events-auto max-h-[92vh] flex flex-col"
          >
            <div className="w-full flex justify-center pt-3 pb-1 md:hidden">
              <div className="w-12 h-1.5 rounded-full bg-muted/60" />
            </div>
            <div className="flex items-center justify-between px-6 py-5 border-b border-border/40">
              <div>
                <h2 className="text-lg font-black leading-tight">Report {reportedName}</h2>
                <p className="text-xs text-muted-foreground font-bold mt-0.5 tracking-tight">Help us keep the Campus ecosystem safe</p>
              </div>
              <button onClick={onClose} className="w-10 h-10 rounded-2xl bg-muted flex items-center justify-center hover:bg-foreground hover:text-background transition-colors active:scale-95">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6 overflow-y-auto">
              <div className="space-y-2">
                {REPORT_REASONS.map((reason) => {
                  const Icon = reason.icon
                  return (
                    <button
                      key={reason.id}
                      onClick={() => setSelectedReason(reason.id)}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all active:scale-[0.98] ${selectedReason === reason.id
                        ? 'border-primary bg-primary/5 text-primary shadow-sm'
                        : 'border-border/60 bg-card hover:border-foreground/20'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${selectedReason === reason.id ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-black">{reason.label}</span>
                    </button>
                  )
                })}
              </div>
              <div className="space-y-2">
                <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground px-1">Details</p>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Describe what happened..."
                  className="w-full bg-muted/30 border border-border/60 rounded-2xl px-4 py-3.5 font-bold outline-none focus:ring-2 focus:ring-primary/20 resize-none min-h-[100px]"
                />
              </div>
              <button
                onClick={handleSubmit}
                disabled={!selectedReason || isSubmitting}
                className={`w-full py-4.5 rounded-2xl bg-red-500 text-white font-black text-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-500/20 active:scale-[0.98] ${!selectedReason || isSubmitting ? 'opacity-50 grayscale' : 'hover:bg-red-600'}`}
              >
                {isSubmitting ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Submit Report <Send className="w-4 h-4" /></>}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
