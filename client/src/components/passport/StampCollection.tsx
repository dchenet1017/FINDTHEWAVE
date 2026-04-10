import { useNavigate } from 'react-router-dom'
import { MapPin, Calendar, Gift } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn, formatDate } from '@/lib/utils'
import { useCheckInHistory } from '@/hooks/usePassport'
import type { CheckIn } from '@/services/user.service'

const typeColors: Record<string, string> = {
  BAR: 'bg-[#FF5E7D]',
  RESTAURANT: 'bg-[#01D1A2]',
  ENTERTAINMENT: 'bg-[#9C6BFF]',
  FITNESS: 'bg-[#0396FF]',
  WELLNESS: 'bg-[#FF9F43]',
  HOTEL: 'bg-[#74B9FF]',
  OTHER: 'bg-[#6C5CE7]',
}

const typeIcons: Record<string, string> = {
  BAR: '🍺',
  RESTAURANT: '🍽️',
  ENTERTAINMENT: '🎭',
  FITNESS: '💪',
  WELLNESS: '🧘',
  HOTEL: '🏨',
  OTHER: '📍',
}

interface StampCollectionProps {
  limit?: number
  showViewAll?: boolean
}

export function StampCollection({ limit = 5, showViewAll = true }: StampCollectionProps) {
  const navigate = useNavigate()
  const { data: checkIns = [], isLoading } = useCheckInHistory(limit)

  if (isLoading) {
    return (
      <Card className="bg-dark-card border-gray-800">
        <CardHeader>
          <CardTitle className="text-sm text-gray-200">Recent Stamps</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-24 w-24 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (checkIns.length === 0) {
    return (
      <Card className="bg-dark-card border-gray-800">
        <CardHeader>
          <CardTitle className="text-sm text-gray-200">Recent Stamps</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-4xl mb-2">🎫</div>
            <p className="text-sm text-gray-400">No stamps yet</p>
            <p className="text-xs text-gray-500 mt-1">Check in at places to collect stamps</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-dark-card border-gray-800">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm text-gray-200">Recent Stamps</CardTitle>
        {showViewAll && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard/places')}
            className="text-xs"
          >
            View All
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {checkIns.slice(0, limit).map((checkIn) => (
            <StampItem key={checkIn.id} checkIn={checkIn} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function StampItem({ checkIn }: { checkIn: CheckIn }) {
  const navigate = useNavigate()
  const business = checkIn.business
  const type = business.type || 'OTHER'
  const color = typeColors[type] || typeColors.OTHER
  const icon = typeIcons[type] || typeIcons.OTHER

  const handleClick = () => {
    navigate(`/business/${business.id}`)
  }

  return (
    <div
      className={cn(
        'relative group cursor-pointer transition-all hover:scale-105',
        'rounded-lg border-2 border-gray-700 hover:border-primary/60'
      )}
      onClick={handleClick}
    >
      {/* Stamp design */}
      <div className={cn('relative rounded-lg p-3 text-center', color)}>
        {/* Perforated edge effect */}
        <div className="absolute inset-0 border-2 border-dashed border-white/30 rounded-lg" />
        
        {/* Icon */}
        <div className="text-3xl mb-1">{icon}</div>
        
        {/* Business name */}
        <p className="text-xs font-semibold text-white line-clamp-2 mb-1">
          {business.name}
        </p>
        
        {/* Date */}
        <p className="text-[10px] text-white/80">
          {formatDate(checkIn.createdAt)}
        </p>
        
        {/* Points badge */}
        <div className="absolute -top-2 -right-2">
          <Badge
            variant="secondary"
            className="bg-white/90 text-gray-900 text-[10px] px-1.5 py-0 flex items-center gap-0.5"
          >
            <Gift className="h-2.5 w-2.5" />
            {checkIn.points}
          </Badge>
        </div>
      </div>

      {/* Hover tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
        <div className="bg-dark-card border border-gray-700 rounded-md px-2 py-1 text-xs text-white whitespace-nowrap shadow-lg">
          <p className="font-semibold">{business.name}</p>
          <p className="text-gray-400">{formatDate(checkIn.createdAt)}</p>
        </div>
      </div>
    </div>
  )
}

