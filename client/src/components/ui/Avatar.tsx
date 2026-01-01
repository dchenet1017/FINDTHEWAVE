import * as React from 'react'
import { cn } from '@/lib/utils'

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string
  alt?: string
  fallback?: string
  size?: 'sm' | 'md' | 'lg'
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, alt, fallback, size = 'md', ...props }, ref) => {
    const sizeClasses = {
      sm: 'h-8 w-8 text-xs',
      md: 'h-10 w-10 text-sm',
      lg: 'h-12 w-12 text-base',
    }

    const [imgError, setImgError] = React.useState(false)

    return (
      <div
        ref={ref}
        className={cn(
          'relative flex items-center justify-center rounded-full bg-dark-card border border-gray-700 overflow-hidden',
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {src && !imgError ? (
          <img
            src={src}
            alt={alt}
            className="h-full w-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <span className="text-gray-300 font-medium">
            {fallback || (alt ? alt.charAt(0).toUpperCase() : '?')}
          </span>
        )}
      </div>
    )
  }
)
Avatar.displayName = 'Avatar'

export { Avatar }

