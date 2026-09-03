import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import mapboxgl, { Map as MapboxMap } from 'mapbox-gl'
import { ShieldCheck, Star, MapPin, Phone, Globe, X, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { FavoriteButton } from './FavoriteButton'
import { CheckInButton } from './CheckInButton'
import type { Business } from '../../../../shared/types/business'

interface BusinessPopupProps {
  map: MapboxMap | null
  business: Business | null
  onClose?: () => void
  userLocation?: { lat: number; lng: number } | null
}

export function BusinessPopup({ map, business, onClose, userLocation }: BusinessPopupProps) {
  // The popup content is rendered via a portal (not a second createRoot) so it
  // stays inside the app's React tree and keeps access to QueryClientProvider,
  // the router, etc. A detached root has none of that context.
  const [container] = useState(() => document.createElement('div'))
  const popupRef = useRef<mapboxgl.Popup | null>(null)

  useEffect(() => {
    if (!map || !business) return

    const lng = Number((business as any).longitude ?? (business as any).location?.longitude ?? NaN)
    const lat = Number((business as any).latitude ?? (business as any).location?.latitude ?? NaN)
    if (Number.isNaN(lng) || Number.isNaN(lat)) return

    const popup = new mapboxgl.Popup({
      closeButton: false,
      offset: 16,
      className: 'wavefinder-popup',
      maxWidth: '360px',
    })
    popupRef.current = popup

    popup.setDOMContent(container).setLngLat([lng, lat]).addTo(map)

    return () => {
      try {
        popup.remove()
      } catch {
        // popup was already removed
      }
      popupRef.current = null
    }
  }, [map, business, container])

  if (!business) return null

  const handleClose = () => {
    popupRef.current?.remove()
    onClose?.()
  }

  return createPortal(
    <BusinessPopupContent business={business} onClose={handleClose} userLocation={userLocation} />,
    container
  )
}

function BusinessPopupContent({
  business,
  onClose,
  userLocation,
}: {
  business: Business
  onClose?: () => void
  userLocation?: { lat: number; lng: number } | null
}) {
  const hasPromo = (business as any).promotions && (business as any).promotions.length > 0
  const promo = hasPromo ? (business as any).promotions[0] : null
  const isSponsored = Boolean((business as any).isSponsored || (business as any).activeAdvertisement)

  const rating = (business as any).rating
  const distance = (business as any).distance

  const address =
    (business as any).address ??
    (business as any).location?.address ??
    (business as any).city ??
    (business as any).location?.city ??
    'Location unknown'

  const lat = (business as any).latitude ?? (business as any).location?.latitude
  const lng = (business as any).longitude ?? (business as any).location?.longitude
  const directionsUrl =
    lat !== undefined && lng !== undefined
      ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
      : undefined

  return (
    <div className="w-[320px] text-white">
      <div className="relative h-32 rounded-md overflow-hidden bg-dark-bg">
        {business.images && business.images.length > 0 ? (
          <img src={business.images[0]} alt={business.name} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-gradient-to-r from-primary/50 to-secondary/50" />
        )}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 rounded-full bg-black/60 p-1 text-gray-200 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="absolute bottom-2 left-2">
          <Badge variant="secondary" className="text-xs">
            {business.type}
          </Badge>
        </div>
      </div>

      <div className="space-y-2 pt-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-lg font-semibold">{business.name}</p>
              {isSponsored && <Badge variant="warning">Sponsored</Badge>}
              {business.isVerified && <ShieldCheck className="h-4 w-4 text-success" />}
            </div>
            <p className="text-sm text-gray-400 flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {address}
            </p>
          </div>
          {rating !== undefined && (
            <div className="flex items-center gap-1 text-sm text-warning">
              <Star className="h-4 w-4" />
              {Number(rating).toFixed(1)}
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-3 text-sm text-gray-300">
          {(business as any).phone && (
            <span className="inline-flex items-center gap-1">
              <Phone className="h-4 w-4" />
              <a href={`tel:${(business as any).phone}`} className="hover:text-primary">
                {(business as any).phone}
              </a>
            </span>
          )}
          {(business as any).website && (
            <span className="inline-flex items-center gap-1">
              <Globe className="h-4 w-4" />
              <a href={(business as any).website} target="_blank" rel="noreferrer" className="hover:text-primary">
                Website
              </a>
            </span>
          )}
          {distance !== undefined && (
            <span className="text-primary text-xs">{Number(distance).toFixed(1)} mi away</span>
          )}
        </div>

        {promo && (
          <div className="rounded-md border border-accent/40 bg-accent/10 p-3 flex items-start gap-2 text-sm">
            <Sparkles className="h-4 w-4 text-accent mt-0.5" />
            <div>
              <p className="font-semibold text-white">{promo.title}</p>
              {promo.description && <p className="text-gray-300 text-xs mt-1">{promo.description}</p>}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 pt-1">
          <FavoriteButton businessId={business.id} size="sm" />
          <CheckInButton business={business} userLocation={userLocation} size="sm" className="flex-1" />
        </div>

        <div className="flex items-center gap-2 pt-1">
          <Button
            variant="default"
            size="sm"
            className="flex-1"
            onClick={() => {
              window.location.href = `/business/${business.id}`
            }}
          >
            View Details
          </Button>
          {directionsUrl && (
            <Button
              variant="secondary"
              size="sm"
              className="flex-1"
              onClick={() => window.open(directionsUrl, '_blank')}
            >
              Get Directions
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

