import { useState } from 'react'
import { Check, X, Heart } from 'lucide-react'
import { ModalShell } from '../ui/ModalShell'

interface FoundRoommateModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  dayNumber: number
}

export function FoundRoommateModal({ isOpen, onClose, onConfirm, dayNumber }: FoundRoommateModalProps) {
  const [selectedOption, setSelectedOption] = useState<'yes' | 'no' | null>(null)

  const getDayMessage = () => {
    switch (dayNumber) {
      case 7:
        return "It's been a week! Have you found a roommate yet?"
      case 30:
        return "A month has passed! Did you find your perfect match?"
      case 50:
        return "Day 50 - almost two months! Any luck finding a roommate?"
      default:
        return "Have you found a roommate yet?"
    }
  }

  const getDayTitle = () => {
    switch (dayNumber) {
      case 7:
        return "One Week Check-in"
      case 30:
        return "Monthly Update"
      case 50:
        return "50 Day Milestone"
      default:
        return "Roommate Status"
    }
  }

  const handleConfirm = () => {
    if (selectedOption === 'yes') {
      onConfirm()
    } else {
      onClose()
    }
  }

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title={getDayTitle()}
      subtitle={`Day ${dayNumber} Check-in`}
      maxWidth="max-w-[92%] md:max-w-md"
    >
      <div className="flex flex-col gap-4">
        <p className="text-[15px] font-bold text-foreground leading-relaxed">
          {getDayMessage()}
        </p>

        {/* Options */}
        <div className="grid grid-cols-1 gap-3">
          <button
            onClick={() => setSelectedOption('yes')}
            className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all active:scale-[0.98] ${
              selectedOption === 'yes'
                ? 'border-primary bg-primary/5 shadow-sm'
                : 'border-border/60 bg-card hover:border-primary/30'
            }`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
              selectedOption === 'yes' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-muted text-muted-foreground'
            }`}>
              <Check className="w-5 h-5" strokeWidth={3} />
            </div>
            <div className="text-left">
              <span className="text-[15px] font-bold text-foreground block">Yes, I found a roommate!</span>
              <p className="text-[12px] text-muted-foreground mt-0.5 font-medium leading-tight">Great! We'll mark your profile as found.</p>
            </div>
          </button>

          <button
            onClick={() => setSelectedOption('no')}
            className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all active:scale-[0.98] ${
              selectedOption === 'no'
                ? 'border-muted bg-muted/50 shadow-sm'
                : 'border-border/60 bg-card hover:border-foreground/20'
            }`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
              selectedOption === 'no' ? 'bg-muted-foreground text-background shadow-lg shadow-muted-foreground/20' : 'bg-muted text-muted-foreground'
            }`}>
              <X className="w-5 h-5" strokeWidth={3} />
            </div>
            <div className="text-left">
              <span className="text-[15px] font-bold text-foreground block">Not yet</span>
              <p className="text-[12px] text-muted-foreground mt-0.5 font-medium leading-tight">No worries, keep looking! We're here to help.</p>
            </div>
          </button>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            onClick={handleConfirm}
            disabled={!selectedOption}
            className={`w-full py-4.5 rounded-full font-bold text-[16px] transition-all flex items-center justify-center gap-2 h-[56px] ${
              !selectedOption
                ? 'bg-muted/50 text-muted-foreground opacity-50 cursor-not-allowed'
                : 'bg-primary text-primary-foreground hover:bg-foreground hover:text-background shadow-lg shadow-primary/20 active:scale-[0.98]'
            }`}
          >
            {selectedOption === 'yes' ? (
              <>
                <Heart className="w-5 h-5 fill-current" />
                <span>Mark as Found</span>
              </>
            ) : (
              <span>Continue Searching</span>
            )}
          </button>
          <p className="text-[11px] text-muted-foreground text-center mt-4 font-medium px-4 leading-relaxed">
            Updating your status helps us keep the community accurate for everyone.
          </p>
        </div>
      </div>
    </ModalShell>
  )
}
