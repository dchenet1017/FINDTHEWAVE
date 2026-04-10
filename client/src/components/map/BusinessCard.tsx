import { ShieldCheck, Star, MapPin, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'
import type { Business } from '../../../shared/types/business'

interface BusinessCardProps {
  business: Business & { distance?: number; promotions?: any[] }
  selected?: boolean
  onClick?: () => void
}

const typeColors: Record<string, string> = {
  BAR: 'bg-[#FF5E7D]',
  RESTAURANT: 'bg-[#01D1A2]',
  ENTERTAINMENT: 'bg-[#9C6BFF]',
  FITNESS: 'bg-[#0396FF]',
  WELLNESS: 'bg-[#FF9F43]',
  HOTEL: 'bg-[#74B9FF]',
  OTHER: 'bg-[#6C5CE7]',
}

export function BusinessCard({ business, selected, onClick }: BusinessCardProps) {
  const hasPromo = (business.promotions && business.promotions.length > 0) || false
  const isSponsored = Boolean((business as any).isSponsored || (business as any).activeAdvertisement)
  const color = typeColors[business.type] || typeColors.OTHER
  const rating =
    typeof (business as any).rating === 'number'
      ? Number((business as any).rating)
      : undefined
  const distance =
    business.distance !== undefined && !Number.isNaN(Number(business.distance))
      ? Number(business.distance)
      : undefined

  return (
    <div
      className={cn(
        'flex gap-3 rounded-lg border border-gray-800 bg-dark-bg p-3 hover:border-primary/60 transition-colors cursor-pointer',
        selected && 'border-primary'
      )}
      onClick={onClick}
    >
      <div className="h-14 w-14 rounded-md bg-gray-900 flex items-center justify-center relative overflow-hidden">
        {business.images && business.images.length > 0 ? (
          <img
            src={business.images[0]}
            alt={business.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className={cn('h-full w-full', color)} />
        )}
        <Badge
          variant="secondary"
          className="absolute bottom-1 left-1 text-[10px] px-1 py-0.5"
        >
          {business.type}
        </Badge>
      </div>

      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-white line-clamp-1">{business.name}</p>
          {isSponsored && (
            <Badge variant="warning" className="text-[10px] px-1.5 py-0">
              Sponsored
            </Badge>
          )}
          {business.isVerified && (
            <ShieldCheck className="h-4 w-4 text-success shrink-0" />
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <MapPin className="h-3.5 w-3.5" />
          <span className="line-clamp-1">
            {business.city ? `${business.city}${business.state ? ', ' + business.state : ''}` : 'Unknown'}
          </span>
          {distance !== undefined && (
            <span className="text-primary">{distance.toFixed(1)} mi</span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          {rating !== undefined && (
            <span className="inline-flex items-center gap-1">
              <Star className="h-3.5 w-3.5 text-warning" />
              {rating.toFixed(1)}
            </span>
          )}
          {hasPromo && (
            <span className="inline-flex items-center gap-1 text-accent">
              <Sparkles className="h-3.5 w-3.5" />
              Promo
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

