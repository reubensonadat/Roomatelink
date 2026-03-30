"use client";
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flag, X, AlertTriangle, UserX, Send, Check } from 'lucide-react';
import { toast } from 'sonner';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportedName: string;
  reportedId: string;
}

const REPORT_REASONS = [
  { id: 'harassment', label: 'Harassment or bullying', icon: AlertTriangle },
  { id: 'fake_profile', label: 'Fake profile or scammer', icon: UserX },
  { id: 'inappropriate', label: 'Inappropriate behavior', icon: Flag },
  { id: 'other', label: 'Other reason', icon: Flag },
];

export function ReportModal({ isOpen, onClose, reportedName, reportedId }: ReportModalProps) {
  const [selectedReason, setSelectedReason] = useState('');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = () => {
    if (!selectedReason || !details.trim()) return;
    setIsSubmitting(true);
    // In production, this would submit to your backend
    console.log('Report submitted:', { reportedId, reason: selectedReason, details });

    setTimeout(() => {
      setIsSubmitting(false);
      setSelectedReason('');
      setDetails('');
      onClose();
      // Show professional toast
      toast.success('Report submitted successfully', {
        icon: <Check className="w-5 h-5 text-white" />,
        description: 'Thank you for helping keep the Campus ecosystem safe.'
      });
    }, 1500);

  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-100 flex items-end md:items-center justify-center pointer-events-none p-0 md:p-10">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-background/60 backdrop-blur-md pointer-events-auto"
          />

          {/* Modal Sheet */}
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="relative w-full md:w-[540px] max-w-full bg-card border-t md:border border-border rounded-t-[2.5rem] md:rounded-3xl shadow-2xl overflow-hidden pointer-events-auto max-h-[92vh] flex flex-col"
          >
            {/* Drag Handle */}
            <div className="w-full flex justify-center pt-3 pb-1 shrink-0 md:hidden">
              <div className="w-12 h-1.5 rounded-full bg-muted/60" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-border/40 shrink-0">
              <div className="flex flex-col">
                <h2 className="text-[18px] font-bold text-foreground leading-tight">Report Account</h2>
                <p className="text-[12px] text-muted-foreground font-medium mt-0.5">Help us keep the Campus ecosystem safe</p>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-2xl bg-muted flex items-center justify-center hover:bg-foreground hover:text-background transition-colors active:scale-95"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-6 pb-12 custom-scrollbar flex flex-col gap-6">
              <p className="text-[13px] text-muted-foreground leading-relaxed font-medium">
                Please help us keep Roommate Link safe by providing details about why you're reporting this user.
              </p>

              {/* Report Reasons */}
              <div>
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-3 pl-1">Reason for Report</p>
                <div className="grid grid-cols-1 gap-2.5">
                  {REPORT_REASONS.map((reason) => {
                    const Icon = reason.icon;
                    return (
                      <button
                        key={reason.id}
                        onClick={() => setSelectedReason(reason.id)}
                        className={`w-full flex items-center gap-3.5 p-4 rounded-2xl border-2 transition-all active:scale-[0.98] ${selectedReason === reason.id
                          ? 'border-primary bg-primary/5 text-primary shadow-sm'
                          : 'border-border/60 bg-card hover:border-foreground/20'
                          }`}
                      >
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${selectedReason === reason.id
                          ? 'bg-primary text-white'
                          : 'bg-muted text-muted-foreground'
                          }`}>
                          <Icon className="w-3.5 h-3.5" strokeWidth={2.5} />
                        </div>
                        <span className="text-[14px] font-bold">{reason.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Additional Details */}
              <div>
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-3 pl-1">Additional Details (Optional)</p>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Describe what happened in more detail..."
                  rows={3}
                  className="w-full bg-muted/30 border border-border/60 rounded-2xl px-4 py-3.5 text-foreground font-medium outline-none focus:border-primary/50 focus:ring-[3px] focus:ring-primary/10 resize-none placeholder:text-muted-foreground/40 text-[14px] leading-relaxed shadow-sm"
                  maxLength={500}
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2 pb-8">
                <button
                  onClick={handleSubmit}
                  disabled={!selectedReason || isSubmitting}
                  className={`w-full py-4.5 rounded-2xl bg-red-500 text-white font-bold text-[16px] transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-500/20 active:scale-[0.98] ${!selectedReason || isSubmitting
                    ? 'opacity-50 cursor-not-allowed grayscale'
                    : 'hover:bg-red-600'
                    }`}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <span>Submit Report</span>
                      <Send className="w-4 h-4" strokeWidth={2.5} />
                    </>
                  )}
                </button>
                <p className="text-[11px] text-muted-foreground text-center mt-6 font-medium px-4">
                  False reports can lead to account suspension. Please only report genuine violations of our Campus guidelines.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function Loader2({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
