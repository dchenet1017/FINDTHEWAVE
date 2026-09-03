import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import mapboxgl, { Map as MapboxMap, Marker } from 'mapbox-gl'
import {
  createVenueMarkerElement,
  setVenueMarkerSelected,
  type VenueMarkerType,
} from '@/components/map/markers/venueMarkerFactory'

type MarkerType = VenueMarkerType

interface MapMarkerProps {
  map: MapboxMap | null
  position: [number, number] // [lng, lat]
  type?: MarkerType
  isSponsored?: boolean
  isSelected?: boolean
  /** Draws the 🕺 badge for a venue with a live Go Out offer */
  hasActiveOffer?: boolean
  /** Accessible name, e.g. the venue name */
  label?: string
  onClick?: () => void
  children?: React.ReactNode // Popup content
}

/**
 * A single DOM marker, for the maps that place pins directly rather than
 * through the clustered BusinessMarkerLayer. Shares the category art from
 * venueMarkerFactory so both paths look the same.
 */
export function MapMarker({
  map,
  position,
  type = 'OTHER',
  isSponsored = false,
  isSelected = false,
  hasActiveOffer = false,
  label,
  onClick,
  children,
}: MapMarkerProps) {
  const markerRef = useRef<Marker | null>(null)
  const popupRef = useRef<mapboxgl.Popup | null>(null)
  const elRef = useRef<HTMLDivElement | null>(null)
  // Popup content is rendered via a portal into this node (not a second
  // createRoot) so it stays inside the app's React tree and keeps access to
  // QueryClientProvider, the router, etc.
  const [popupContainer] = useState(() => document.createElement('div'))

  // Destructured so the dependency array stays statically checkable
  const [lng, lat] = position

  useEffect(() => {
    if (!map || typeof map.getContainer !== 'function' || !map.getContainer()) return

    // isSelected is applied by the effect below, so it stays out of here and
    // a selection change never rebuilds the element.
    const el = createVenueMarkerElement(type, {
      isSponsored,
      hasActiveOffer,
      label,
    })

    if (onClick) el.addEventListener('click', onClick)

    const marker = new mapboxgl.Marker({ element: el, anchor: 'center' })
      .setLngLat([lng, lat])
      .addTo(map)

    if (children) {
      try {
        popupContainer.className = 'wavefinder-popup'

        const popup = new mapboxgl.Popup({
          closeButton: false,
          offset: 24,
          maxWidth: '320px',
        }).setDOMContent(popupContainer)

        marker.setPopup(popup)
        popupRef.current = popup
      } catch {
        // popup is optional - a marker without one still works
      }
    }

    markerRef.current = marker
    elRef.current = el

    return () => {
      try {
        if (onClick) el.removeEventListener('click', onClick)
        popupRef.current?.remove()
        marker.remove()
      } catch {
        // already detached
      }
      popupRef.current = null
    }
  }, [map, lng, lat, type, isSponsored, hasActiveOffer, label, onClick, children, popupContainer])

  // Selection toggles in place so the animation does not restart
  useEffect(() => {
    if (elRef.current) setVenueMarkerSelected(elRef.current, isSelected)
  }, [isSelected])

  return children ? createPortal(children, popupContainer) : null
}
