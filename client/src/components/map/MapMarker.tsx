import { useEffect, useRef } from 'react'
import mapboxgl, { Map as MapboxMap, Marker } from 'mapbox-gl'
import { markerColors } from '@/lib/mapbox'
import { cn } from '@/lib/utils'

type MarkerType =
  | 'BAR'
  | 'RESTAURANT'
  | 'ENTERTAINMENT'
  | 'FITNESS'
  | 'WELLNESS'
  | 'HOTEL'
  | 'OTHER'
  | 'WAVELEADER'
  | 'USER'

interface MapMarkerProps {
  map: MapboxMap | null
  position: [number, number] // [lng, lat]
  type?: MarkerType
  isSponsored?: boolean
  isSelected?: boolean
  onClick?: () => void
  children?: React.ReactNode // Popup content
}

export function MapMarker({
  map,
  position,
  type = 'OTHER',
  isSponsored = false,
  isSelected = false,
  onClick,
  children,
}: MapMarkerProps) {
  const markerRef = useRef<Marker | null>(null)
  const popupRef = useRef<mapboxgl.Popup | null>(null)
  const elRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!map || typeof map.getContainer !== 'function' || !map.getContainer()) return

    const el = document.createElement('div')
    el.className = 'wavefinder-marker'

    const pin = document.createElement('div')
    pin.className = cn(
      'marker-pin',
      isSelected && 'marker-selected',
      isSponsored && 'marker-sponsored'
    )
    pin.style.backgroundColor = markerColors[type] || markerColors.OTHER

    const dot = document.createElement('div')
    dot.className = 'marker-dot'
    pin.appendChild(dot)

    if (isSponsored) {
      const pulse = document.createElement('div')
      pulse.className = 'marker-pulse'
      pulse.style.borderColor = (markerColors[type] || markerColors.OTHER) + '55'
      pin.appendChild(pulse)
    }

    el.appendChild(pin)

    if (onClick) {
      el.addEventListener('click', onClick)
    }

    const marker = new mapboxgl.Marker(el).setLngLat(position).addTo(map)

    // Popup
    if (children) {
      try {
        const popup = new mapboxgl.Popup({
          closeButton: false,
          offset: 24,
          maxWidth: '320px',
        }).setDOMContent(createPopupContent(children))

        marker.setPopup(popup)
        popupRef.current = popup
      } catch (_) {}
    }

    markerRef.current = marker
    elRef.current = el

    return () => {
      try {
        if (onClick && el) el.removeEventListener('click', onClick)
        if (popupRef.current) popupRef.current.remove()
        marker.remove()
      } catch (_) {}
    }
  }, [map, position[0], position[1], type, isSponsored, isSelected, onClick, children])

  // Update selected class if prop changes
  useEffect(() => {
    if (elRef.current) {
      if (isSelected) {
        elRef.current.querySelector('.marker-pin')?.classList.add('marker-selected')
      } else {
        elRef.current.querySelector('.marker-pin')?.classList.remove('marker-selected')
      }
    }
  }, [isSelected])

  return null
}

function createPopupContent(content: React.ReactNode) {
  const container = document.createElement('div')
  container.className = 'wavefinder-popup'

  const root = document.createElement('div')
  container.appendChild(root)

  // Render React node into DOM
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { createRoot } = require('react-dom/client')
  const reactRoot = createRoot(root)
  reactRoot.render(content)

  return container
}

