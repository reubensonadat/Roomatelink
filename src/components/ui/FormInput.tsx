import { forwardRef, InputHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

export interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, icon, className, id, ...props }, ref
) => {
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="text-xs font-semibold text-muted-foreground mb-2 block">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50 pointer-events-none">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            'w-full px-5 py-3.5 bg-muted border border-border rounded-xl text-foreground font-bold text-sm focus:outline-none focus:border-primary transition-all placeholder:text-muted-foreground/50',
            icon && 'pl-12',
            error && 'border-red-500 focus:border-red-500',
            className
          )}
          {...props}
        />
      </div>
      {error && (
        <p className="text-[11px] text-red-500 font-black mt-1 pl-1 animate-pulse">
          {error}
        </p>
      )}
    </div>
  )
})

FormInput.displayName = 'FormInput'
