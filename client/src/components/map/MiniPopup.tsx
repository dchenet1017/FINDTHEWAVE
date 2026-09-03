import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import mapboxgl, { Map as MapboxMap } from 'mapbox-gl'
import { Star, MapPin, X } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

export interface MarkerData {
  id: string
  name: string
  type: string
  latitude: number
  longitude: number
  rating?: number
  isVerified?: boolean
}

interface MiniPopupProps {
  map: MapboxMap | null
  marker: MarkerData | null
  onClose?: () => void
  onViewDetails?: (marker: MarkerData) => void
}

export function MiniPopup({ map, marker, onClose, onViewDetails }: MiniPopupProps) {
  // Rendered via a portal (not a second createRoot) so it stays inside the
  // app's React tree and keeps access to QueryClientProvider, the router, etc.
  const [container] = useState(() => document.createElement('div'))
  const popupRef = useRef<mapboxgl.Popup | null>(null)

  useEffect(() => {
    if (!map || !marker) return

    const popup = new mapboxgl.Popup({
      closeButton: false,
      offset: 12,
      className: 'wavefinder-mini-popup',
      maxWidth: '280px',
    })
    popupRef.current = popup

    popup.setDOMContent(container).setLngLat([marker.longitude, marker.latitude]).addTo(map)

    return () => {
      try {
        popup.remove()
      } catch {
        // popup was already removed
      }
      popupRef.current = null
    }
  }, [map, marker, container])

  if (!marker) return null

  const handleClose = () => {
    popupRef.current?.remove()
    onClose?.()
  }

  const handleViewDetails = () => {
    onViewDetails?.(marker)
    popupRef.current?.remove()
  }

  return createPortal(
    <MiniPopupContent marker={marker} onClose={handleClose} onViewDetails={handleViewDetails} />,
    container
  )
}

function MiniPopupContent({
  marker,
  onClose,
  onViewDetails,
}: {
  marker: MarkerData
  onClose?: () => void
  onViewDetails?: () => void
}) {
  return (
    <div className="w-[260px] text-white">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-base font-semibold truncate">{marker.name}</p>
            {marker.isVerified && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                Verified
              </Badge>
            )}
          </div>
          <Badge variant="outline" className="text-[10px] mb-2">
            {marker.type}
          </Badge>
          {marker.rating !== undefined && (
            <div className="flex items-center gap-1 text-sm text-warning mt-1">
              <Star className="h-3.5 w-3.5 fill-current" />
              <span className="text-xs">{Number(marker.rating).toFixed(1)}</span>
            </div>
          )}
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 rounded-full bg-black/60 p-1 text-gray-200 hover:text-white transition-colors"
          aria-label="Close popup"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <Button
        variant="default"
        size="sm"
        className="w-full text-xs"
        onClick={onViewDetails}
      >
        View Details
      </Button>
    </div>
  )
}

