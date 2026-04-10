import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MapPin,
  Star,
  Heart,
  Navigation,
  MapPin as MapPinIcon,
  ShieldCheck,
  MoreVertical,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { DropdownMenu, DropdownMenuItem } from '@/components/ui/DropdownMenu'
import { FavoriteButton } from '@/components/map/FavoriteButton'
import { CheckInButton } from '@/components/map/CheckInButton'
import { formatDate } from '@/lib/utils'
import { formatDistance as formatDistanceMiles } from '@/lib/mapbox'
import { calculateDistance } from '@/utils/distance'
import type { Business } from '../../../../shared/types/business'

interface PlaceCardProps {
  business: Business
  userLocation?: { lat: number; lng: number } | null
  lastVisited?: string
  checkInCount?: number
  onSelect?: (business: Business) => void
  showActions?: boolean
}

export function PlaceCard({
  business,
  userLocation,
  lastVisited,
  checkInCount,
  onSelect,
  showActions = true,
}: PlaceCardProps) {
  const navigate = useNavigate()
  const [isHovered, setIsHovered] = useState(false)

  const lat = (business as any).latitude ?? (business as any).location?.latitude
  const lng = (business as any).longitude ?? (business as any).location?.longitude

  const distance = userLocation && lat && lng
    ? calculateDistance(userLocation.lat, userLocation.lng, Number(lat), Number(lng))
    : null

  const rating = (business as any).rating
  const address = (business as any).address ?? (business as any).location?.address ?? (business as any).city ?? 'Location unknown'

  const handleClick = () => {
    if (onSelect) {
      onSelect(business)
    } else {
      navigate(`/business/${business.id}`)
    }
  }

  const handleDirections = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (lat && lng) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank')
    }
  }

  return (
    <Card
      className="cursor-pointer hover:border-primary/50 transition-all"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      <div className="flex gap-4 p-4">
        {/* Image */}
        <div className="relative h-24 w-24 flex-shrink-0 rounded-md overflow-hidden bg-dark-bg">
          {business.images && business.images.length > 0 ? (
            <img
              src={business.images[0]}
              alt={business.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
              <MapPinIcon className="h-8 w-8 text-primary" />
            </div>
          )}
          {business.isVerified && (
            <div className="absolute top-1 right-1">
              <ShieldCheck className="h-4 w-4 text-success" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-white truncate">{business.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  {business.type}
                </Badge>
                {rating !== undefined && (
                  <div className="flex items-center gap-1 text-xs text-warning">
                    <Star className="h-3 w-3 fill-warning" />
                    {Number(rating).toFixed(1)}
                  </div>
                )}
              </div>
            </div>
            {showActions && (
              <DropdownMenu
                trigger={
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                }
                align="right"
              >
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleClick() }}>
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDirections(e) }}>
                  <Navigation className="h-4 w-4 mr-2" />
                  Get Directions
                </DropdownMenuItem>
              </DropdownMenu>
            )}
          </div>

          <div className="space-y-1 text-sm text-gray-400">
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span className="truncate">{address}</span>
            </div>
            {distance !== null && (
              <div className="text-primary text-xs">
                {formatDistanceMiles(distance)} away
              </div>
            )}
            {lastVisited && (
              <div className="text-xs">
                Last visited {formatDate(lastVisited)}
              </div>
            )}
            {checkInCount !== undefined && checkInCount > 1 && (
              <div className="text-xs">
                Visited {checkInCount} times
              </div>
            )}
          </div>

          {/* Actions */}
          {showActions && isHovered && (
            <div className="flex items-center gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
              <FavoriteButton businessId={business.id} size="sm" />
              {lat && lng && (
                <CheckInButton
                  business={{
                    id: business.id,
                    name: business.name,
                    latitude: lat,
                    longitude: lng,
                  }}
                  userLocation={userLocation}
                  size="sm"
                  className="flex-1"
                />
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDirections}
                className="flex items-center gap-1"
              >
                <Navigation className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

