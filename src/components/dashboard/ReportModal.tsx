import { useState } from 'react'
import { AlertTriangle, UserX, Flag, Check } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { ModalShell } from '../ui/ModalShell'
import { OrbitalLoader } from '../ui/OrbitalLoader'

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
  const { profile } = useAuth()
  const [selectedReason, setSelectedReason] = useState('')
  const [details, setDetails] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!selectedReason || !details.trim() || !profile) return
    setIsSubmitting(true)

    try {
      const { error } = await supabase
        .from('reports')
        .insert({
          reporter_id: profile.id,
          reported_id: reportedId,
          reason: selectedReason,
          details: details.trim(),
          status: 'PENDING'
        })

      if (error) throw error

      toast.success('Report submitted successfully', {
        icon: <Check className="w-5 h-5 text-white" />,
        description: 'Thank you for helping keep the Campus ecosystem safe.'
      })
      
      setSelectedReason('')
      setDetails('')
      onClose()
    } catch (err: any) {
      console.error('Report submission failed:', err)
      toast.error('Failed to submit report', {
        description: 'Please try again later or contact support.'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title={`Report ${reportedName}`}
      subtitle="Help us keep the Campus ecosystem safe"
      maxWidth="max-w-[92%] md:max-w-md"
    >
      <div className="space-y-4">
        <div className="space-y-2">
          {REPORT_REASONS.map((reason) => {
            const Icon = reason.icon
            return (
              <button
                key={reason.id}
                onClick={() => setSelectedReason(reason.id)}
                className={`w-full flex items-center gap-4 p-4 rounded-[22px] border-2 transition-all active:scale-[0.98] ${selectedReason === reason.id
                  ? 'border-primary bg-primary/5 text-primary shadow-sm'
                  : 'border-border/60 bg-card hover:border-foreground/20'
                }`}
              >
                <div className={`w-10 h-10 rounded-[18px] flex items-center justify-center ${selectedReason === reason.id ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                  <Icon className="w-5 h-5 stroke-[2.5]" />
                </div>
                <span className="text-[15px] font-black">{reason.label}</span>
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
          className={`w-full h-[64px] rounded-[22px] bg-destructive text-white font-black text-[17px] transition-all flex items-center justify-center gap-3 shadow-xl shadow-destructive/20 active:scale-[0.98] uppercase tracking-[0.2em] ${!selectedReason || isSubmitting ? 'opacity-40 grayscale cursor-not-allowed' : 'hover:scale-[1.02] hover:bg-destructive/90'}`}
        >
          {isSubmitting ? (
            <div className="scale-50 -mx-4 -my-4"><OrbitalLoader /></div>
          ) : (
            <>
              Submit Report <Flag className="w-5 h-5 fill-current" />
            </>
          )}
        </button>
      </div>
    </ModalShell>
  )
}
