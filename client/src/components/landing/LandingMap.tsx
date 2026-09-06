import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import mapboxgl from 'mapbox-gl'
import { markerColors } from '@/lib/mapbox'

/**
 * A real Mapbox canvas for the landing hero.
 *
 * The map is what the product is, so the marketing page renders the actual
 * thing rather than an illustration: same dark-v11 style and same marker
 * colours the app uses. It is non-interactive - it should read as a screenshot,
 * not invite the visitor to start panning instead of signing up.
 *
 * Falls back to `fallback` when there is no token or WebGL is unavailable, so a
 * misconfigured deploy degrades to a drawing instead of an empty grey box.
 */

interface LandingMapProps {
  fallback: ReactNode
}

/** Lower Manhattan - dense, and the rivers make it read as a map instantly. */
const MAP_CENTER: [number, number] = [-74.0055, 40.7135]
const MAP_ZOOM = 13.1

const VENUE_MARKERS: {
  lngLat: [number, number]
  color: string
  size: number
  count?: string
}[] = [
  { lngLat: [-74.0135, 40.718], color: markerColors.OTHER, size: 22, count: '12' },
  { lngLat: [-73.9975, 40.7075], color: '#9C88FF', size: 19, count: '7' },
  { lngLat: [-74.009, 40.7078], color: markerColors.BAR, size: 9 },
  { lngLat: [-74.001, 40.7188], color: markerColors.RESTAURANT, size: 9 },
  { lngLat: [-73.9995, 40.7042], color: markerColors.ENTERTAINMENT, size: 9 },
  { lngLat: [-74.015, 40.7102], color: markerColors.HOTEL, size: 9 },
  { lngLat: [-73.994, 40.7152], color: '#F59E0B', size: 9 },
  { lngLat: [-74.0045, 40.7028], color: markerColors.BAR, size: 9 },
]

function buildVenueMarker(color: string, size: number, count?: string) {
  const el = document.createElement('div')
  el.className =
    'flex items-center justify-center rounded-full text-[9px] font-bold text-white ring-2 ring-black/40'
  el.style.width = `${size}px`
  el.style.height = `${size}px`
  el.style.backgroundColor = color
  if (count) el.textContent = count
  return el
}

function buildOwnVenueMarker() {
  const el = document.createElement('div')
  el.className = 'flex flex-col items-center'
  el.innerHTML = `
    <span class="relative flex h-3.5 w-3.5">
      <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
      <span class="relative inline-flex h-3.5 w-3.5 rounded-full border-2 border-white bg-primary"></span>
    </span>
    <span class="mt-1 whitespace-nowrap rounded bg-black/75 px-1.5 py-0.5 text-[8px] font-medium text-white">Neon Rooftop</span>
  `
  return el
}

export function LandingMap({ fallback }: LandingMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [unavailable, setUnavailable] = useState(!mapboxgl.accessToken)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!containerRef.current || !mapboxgl.accessToken) return

    let map: mapboxgl.Map
    try {
      map = new mapboxgl.Map({
        container: containerRef.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: MAP_CENTER,
        zoom: MAP_ZOOM,
        interactive: false,
        // Keeping attribution on: required by Mapbox terms, and the small
        // credit line makes the panel read as a real map rather than a mock.
        attributionControl: true,
      })
    } catch {
      // No WebGL - Mapbox throws on construction.
      setUnavailable(true)
      return
    }

    // A blank dark rectangle is worse than a drawing, and a map that never
    // finishes loading reports no error of its own - so give it a deadline and
    // fall back if it misses it.
    const deadline = window.setTimeout(() => setUnavailable(true), 5000)

    map.on('load', () => {
      window.clearTimeout(deadline)
      setLoaded(true)
    })
    map.on('error', () => {
      window.clearTimeout(deadline)
      setUnavailable(true)
    })

    const markers = VENUE_MARKERS.map(({ lngLat, color, size, count }) =>
      new mapboxgl.Marker({ element: buildVenueMarker(color, size, count) })
        .setLngLat(lngLat)
        .addTo(map)
    )
    markers.push(
      new mapboxgl.Marker({ element: buildOwnVenueMarker() })
        .setLngLat(MAP_CENTER)
        .addTo(map)
    )

    return () => {
      window.clearTimeout(deadline)
      markers.forEach((m) => m.remove())
      map.remove()
    }
  }, [])

  if (unavailable) return <>{fallback}</>

  return (
    <div className="relative h-full w-full bg-[#141414]">
      <div ref={containerRef} className="h-full w-full" />
      {!loaded && <div className="absolute inset-0 animate-pulse bg-[#141414]" />}
    </div>
  )
}
