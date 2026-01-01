import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { AlertCircle, CheckCircle2, AlertTriangle, Info } from 'lucide-react'

const alertVariants = cva(
  'relative w-full rounded-lg border p-4',
  {
    variants: {
      variant: {
        default: 'bg-dark-card border-gray-700 text-white',
        destructive: 'bg-danger/10 border-danger text-danger',
        success: 'bg-success/10 border-success text-success',
        warning: 'bg-warning/10 border-warning text-warning',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  icon?: React.ReactNode
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant, icon, children, ...props }, ref) => {
    const defaultIcon = {
      default: <Info className="h-4 w-4" />,
      destructive: <AlertCircle className="h-4 w-4" />,
      success: <CheckCircle2 className="h-4 w-4" />,
      warning: <AlertTriangle className="h-4 w-4" />,
    }

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(alertVariants({ variant }), className)}
        {...props}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            {icon || defaultIcon[variant || 'default']}
          </div>
          <div className="flex-1">{children}</div>
        </div>
      </div>
    )
  }
)
Alert.displayName = 'Alert'

export { Alert, alertVariants }

