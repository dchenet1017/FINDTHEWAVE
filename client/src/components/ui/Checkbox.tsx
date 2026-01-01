import * as React from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'type'> {
  label?: string
  onCheckedChange?: (checked: boolean) => void
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, checked, onCheckedChange, onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onCheckedChange?.(e.target.checked)
      onChange?.(e)
    }

    return (
      <label className="flex items-center gap-2 cursor-pointer group">
        <div className="relative">
          <input
            type="checkbox"
            ref={ref}
            checked={checked}
            onChange={handleChange}
            className="sr-only"
            {...props}
          />
          <div
            className={cn(
              'h-5 w-5 rounded border-2 transition-all flex items-center justify-center',
              checked
                ? 'bg-primary border-primary'
                : 'bg-dark-card border-gray-600 group-hover:border-gray-500',
              className
            )}
          >
            {checked && <Check className="h-3.5 w-3.5 text-white" />}
          </div>
        </div>
        {label && (
          <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
            {label}
          </span>
        )}
      </label>
    )
  }
)
Checkbox.displayName = 'Checkbox'

export { Checkbox }

