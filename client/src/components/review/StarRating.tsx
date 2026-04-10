import { useMemo, useState } from 'react'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

export type StarRatingSize = 'small' | 'medium' | 'large'

export interface StarRatingProps {
  value: number // 0-5
  onChange?: (rating: number) => void
  readonly?: boolean
  size?: StarRatingSize
}

const sizeClasses: Record<StarRatingSize, string> = {
  small: 'h-5 w-5',
  medium: 'h-8 w-8',
  large: 'h-12 w-12',
}

function colorClass(rating: number) {
  if (rating <= 2) return 'text-orange-400'
  if (rating === 3) return 'text-yellow-400'
  return 'text-emerald-400'
}

export function StarRating({
  value,
  onChange,
  readonly = false,
  size = 'medium',
}: StarRatingProps) {
  const [hover, setHover] = useState(0)
  const active = hover || value
  const activeColor = useMemo(() => colorClass(active || value || 3), [active, value])

  return (
    <div className="flex gap-2" role="radiogroup" aria-label="Star rating">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= active
        return (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={value === star}
            disabled={readonly}
            onClick={() => !readonly && onChange?.(star)}
            onMouseEnter={() => !readonly && setHover(star)}
            onMouseLeave={() => !readonly && setHover(0)}
            onKeyDown={(e) => {
              if (readonly) return
              if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
                e.preventDefault()
                onChange?.(Math.min(5, (value || 0) + 1))
              }
              if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
                e.preventDefault()
                onChange?.(Math.max(1, (value || 1) - 1))
              }
              if (e.key === 'Home') {
                e.preventDefault()
                onChange?.(1)
              }
              if (e.key === 'End') {
                e.preventDefault()
                onChange?.(5)
              }
            }}
            className={cn(sizeClasses[size], 'transition-colors')}
          >
            <Star
              className={cn(
                'h-full w-full',
                filled ? cn('fill-current', activeColor) : 'text-gray-500'
              )}
            />
          </button>
        )
      })}
    </div>
  )
}

