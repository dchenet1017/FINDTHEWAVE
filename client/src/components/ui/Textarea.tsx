import * as React from 'react'
import { cn } from '@/lib/utils'

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps & { error?: string }>(
  ({ className, error, ...props }, ref) => {
    return (
      <>
        <textarea
          className={cn(
            'flex min-h-[80px] w-full rounded-md border bg-dark-bg px-3 py-2 text-sm text-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            error ? 'border-danger' : 'border-gray-700',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <p className="text-danger text-xs mt-1">{error}</p>}
      </>
    )
  }
)
Textarea.displayName = 'Textarea'

export { Textarea }
