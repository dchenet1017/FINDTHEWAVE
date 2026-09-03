import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import mapboxgl, { Map as MapboxMap } from 'mapbox-gl'
import { Star, X, BadgeCheck } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { WaveLeaderDiscovery } from '@/hooks/useWaveLeaders'

interface WaveLeaderPopupProps {
  map: MapboxMap | null
  waveLeader: WaveLeaderDiscovery | null
  onClose?: () => void
}

export function WaveLeaderPopup({ map, waveLeader, onClose }: WaveLeaderPopupProps) {
  // Rendered via a portal (not a second createRoot) so it stays inside the
  // app's React tree and keeps access to QueryClientProvider, the router, etc.
  const [container] = useState(() => document.createElement('div'))
  const popupRef = useRef<mapboxgl.Popup | null>(null)

  useEffect(() => {
    if (!map || !waveLeader) return

    const lat = waveLeader.latitude
    const lng = waveLeader.longitude
    if (lat == null || lng == null) return

    const popup = new mapboxgl.Popup({
      closeButton: false,
      offset: 16,
      className: 'wavefinder-popup',
      maxWidth: '320px',
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
  }, [map, waveLeader, container])

  if (!waveLeader || waveLeader.latitude == null || waveLeader.longitude == null) return null

  const handleClose = () => {
    popupRef.current?.remove()
    onClose?.()
  }

  return createPortal(
    <WaveLeaderPopupContent waveLeader={waveLeader} onClose={handleClose} />,
    container
  )
}

function WaveLeaderPopupContent({
  waveLeader,
  onClose,
}: {
  waveLeader: WaveLeaderDiscovery
  onClose?: () => void
}) {
  const avatarUrl =
    waveLeader.avatar ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${waveLeader.id}`

  return (
    <div className="w-[300px] text-white">
      <div className="flex items-start gap-3">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 rounded-full bg-black/60 p-1 text-gray-200 hover:text-white z-10"
        >
          <X className="h-4 w-4" />
        </button>
        <img
          src={avatarUrl}
          alt={waveLeader.displayName}
          className="h-14 w-14 rounded-full object-cover border-2 border-gray-700 shrink-0"
        />
        <div className="min-w-0 flex-1 pt-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-white">{waveLeader.displayName}</p>
            {waveLeader.isVerified && (
              <BadgeCheck className="h-4 w-4 text-primary shrink-0" />
            )}
          </div>
          <p className="text-sm text-gray-400">{waveLeader.specialty}</p>
          <div className="flex items-center gap-2 mt-1 text-sm text-gray-300">
            <span className="flex items-center gap-0.5">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              {waveLeader.rating.toFixed(1)} ({waveLeader.totalReviews})
            </span>
            <span className="text-primary font-medium">
              ${waveLeader.hourlyRate}/hr
            </span>
          </div>
          <span
            className={
              waveLeader.isAvailable
                ? 'text-xs text-green-400'
                : 'text-xs text-gray-500'
            }
          >
            {waveLeader.isAvailable ? 'Available' : 'Busy'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-4">
        <Button
          variant="secondary"
          size="sm"
          className="flex-1"
          onClick={() => {
            window.location.href = `/waveleader/${waveLeader.id}/profile`
          }}
        >
          View Profile
        </Button>
        <Button
          variant="default"
          size="sm"
          className="flex-1"
          disabled={!waveLeader.isAvailable}
          onClick={() => {
            window.location.href = `/waveleader/${waveLeader.id}/profile?book=1`
          }}
        >
          Book Now
        </Button>
      </div>
    </div>
  )
}
