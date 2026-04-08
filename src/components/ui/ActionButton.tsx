import { ButtonHTMLAttributes } from 'react'
import { ChevronRight } from 'lucide-react'
import { cn } from '../../lib/utils'

interface ActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode
  title: string
  subtitle: string
}

export function ActionButton({ icon, title, subtitle, className, ...props }: ActionButtonProps) {
  return (
    <button
      className={cn(
        'flex items-center justify-between p-3 rounded-3xl hover:bg-muted/50 transition-colors text-left group',
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-2xl bg-muted flex items-center justify-center group-hover:bg-muted/80 transition-colors">
          {icon}
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-[15px] text-foreground">{title}</span>
          <span className="text-[13px] font-medium text-muted-foreground">{subtitle}</span>
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground/50 mr-2" />
    </button>
  )
}
