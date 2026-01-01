import * as React from 'react'
import { cn } from '@/lib/utils'

export interface TooltipProps extends React.HTMLAttributes<HTMLDivElement> {
  content: string
  side?: 'top' | 'bottom' | 'left' | 'right'
}

const Tooltip = React.forwardRef<HTMLDivElement, TooltipProps>(
  ({ className, content, side = 'top', children, ...props }, ref) => {
    const [isVisible, setIsVisible] = React.useState(false)

    const sideClasses = {
      top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
      bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
      left: 'right-full top-1/2 -translate-y-1/2 mr-2',
      right: 'left-full top-1/2 -translate-y-1/2 ml-2',
    }

    return (
      <div
        ref={ref}
        className="relative inline-block"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        {...props}
      >
        {children}
        {isVisible && (
          <div
            className={cn(
              'absolute z-50 rounded-md bg-gray-800 px-3 py-1.5 text-sm text-white shadow-md whitespace-nowrap',
              sideClasses[side],
              className
            )}
          >
            {content}
            <div
              className={cn(
                'absolute bg-gray-800 w-2 h-2 rotate-45',
                side === 'top' && 'top-full left-1/2 -translate-x-1/2 -mt-1',
                side === 'bottom' && 'bottom-full left-1/2 -translate-x-1/2 -mb-1',
                side === 'left' && 'left-full top-1/2 -translate-y-1/2 -ml-1',
                side === 'right' && 'right-full top-1/2 -translate-y-1/2 -mr-1'
              )}
            />
          </div>
        )}
      </div>
    )
  }
)
Tooltip.displayName = 'Tooltip'

export { Tooltip }

