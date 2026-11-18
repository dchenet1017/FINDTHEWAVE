import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import mapboxgl, { Map as MapboxMap, Marker } from 'mapbox-gl'
import {
  createVenueMarkerElement,
  setVenueMarkerOffer,
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

  // Pages pass a new onClick arrow and new popup JSX on every render. If the
  // effect below depended on them, every re-render of the page (each pan
  // re-renders it) tore down and rebuilt every pin, so they all blinked.
  // The latest onClick is read through a ref instead, and the popup only
  // depends on whether there is popup content at all.
  const onClickRef = useRef(onClick)
  useEffect(() => {
    onClickRef.current = onClick
  })
  const hasPopup = Boolean(children)

  useEffect(() => {
    if (!map || typeof map.getContainer !== 'function' || !map.getContainer()) return

    // isSelected and hasActiveOffer are applied in place by the effects
    // below, so changing them never rebuilds the element.
    const el = createVenueMarkerElement(type, {
      isSponsored,
      label,
    })

    const handleClick = () => onClickRef.current?.()
    el.addEventListener('click', handleClick)

    const marker = new mapboxgl.Marker({ element: el, anchor: 'center' })
      .setLngLat([lng, lat])
      .addTo(map)

    if (hasPopup) {
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
        el.removeEventListener('click', handleClick)
        popupRef.current?.remove()
        marker.remove()
      } catch {
        // already detached
      }
      popupRef.current = null
      elRef.current = null
    }
  }, [map, lng, lat, type, isSponsored, label, hasPopup, popupContainer])

  // Selection and the offer badge toggle in place so the animation does not
  // restart. They also re-apply after a rebuild (the effect above clears
  // elRef), via the extra dependencies.
  useEffect(() => {
    if (elRef.current) setVenueMarkerSelected(elRef.current, isSelected)
  }, [isSelected, map, lng, lat, type, isSponsored, label, hasPopup])

  useEffect(() => {
    if (elRef.current) setVenueMarkerOffer(elRef.current, hasActiveOffer)
  }, [hasActiveOffer, map, lng, lat, type, isSponsored, label, hasPopup])

  return children ? createPortal(children, popupContainer) : null
}
