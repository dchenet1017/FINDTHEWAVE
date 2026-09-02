import { useEffect, useRef } from 'react'
import { createRoot, type Root } from 'react-dom/client'
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
  const rootRef = useRef<Root | null>(null)
  const elRef = useRef<HTMLDivElement | null>(null)

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
        const container = document.createElement('div')
        container.className = 'wavefinder-popup'
        const root = createRoot(container)
        root.render(children)
        rootRef.current = root

        const popup = new mapboxgl.Popup({
          closeButton: false,
          offset: 24,
          maxWidth: '320px',
        }).setDOMContent(container)

        marker.setPopup(popup)
        popupRef.current = popup
      } catch {
        // popup is optional - a marker without one still works
      }
    }

    markerRef.current = marker
    elRef.current = el

    return () => {
      const root = rootRef.current
      try {
        if (onClick) el.removeEventListener('click', onClick)
        popupRef.current?.remove()
        marker.remove()
      } catch {
        // already detached
      }
      // Unmounting during React's own commit throws, so defer a tick.
      if (root) {
        setTimeout(() => {
          try {
            root.unmount()
          } catch {
            // root was already torn down
          }
        }, 0)
      }
      rootRef.current = null
      popupRef.current = null
    }
  }, [map, lng, lat, type, isSponsored, hasActiveOffer, label, onClick, children])

  // Selection toggles in place so the animation does not restart
  useEffect(() => {
    if (elRef.current) setVenueMarkerSelected(elRef.current, isSelected)
  }, [isSelected])

  return null
}
