import { cn } from '../../lib/utils'

interface PillToggleProps {
  options: { value: string; label: string }[]
  value: string
  onChange: (value: string) => void
  className?: string
}

export function PillToggle({ options, value, onChange }: PillToggleProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            'p-4 rounded-2xl border-2 transition-all',
            value === option.value
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border bg-card hover:border-foreground/20'
          )}
        >
          <span className="font-bold text-sm">{option.label}</span>
        </button>
      ))}
    </div>
  )
}
