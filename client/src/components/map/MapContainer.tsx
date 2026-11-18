import { useEffect, useRef, useState } from 'react'
import mapboxgl, {
  Map as MapboxMap,
  NavigationControl,
  FullscreenControl,
  ScaleControl,
  GeolocateControl,
} from 'mapbox-gl'
import { mapStyles, defaultMapConfig } from '@/lib/mapbox'
import { cn } from '@/lib/utils'

type MapStyleKey = keyof typeof mapStyles

interface MapContainerProps {
  className?: string
  initialCenter?: [number, number]
  initialZoom?: number
  onMapLoad?: (map: MapboxMap) => void
  onMoveEnd?: (map: MapboxMap) => void
  onClick?: (e: mapboxgl.MapMouseEvent) => void
  /** Called only once the map and its style are ready, so `map` is never null. */
  children?: (map: MapboxMap) => React.ReactNode
  showControls?: boolean
  showUserLocation?: boolean
  interactive?: boolean
  showStyleSwitcher?: boolean
}

export function MapContainer({
  className,
  initialCenter = defaultMapConfig.center,
  initialZoom = defaultMapConfig.zoom,
  onMapLoad,
  onMoveEnd,
  onClick,
  children,
  showControls = true,
  showUserLocation = true,
  interactive = true,
  showStyleSwitcher = true,
}: MapContainerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<MapboxMap | null>(null)
  const [mapStyle, setMapStyle] = useState<MapStyleKey>('dark')
  const [isLoaded, setIsLoaded] = useState(false)
  const tokenMissing = !mapboxgl.accessToken

  // Use refs for initial values so the map isn't recreated when props change
  const initialCenterRef = useRef(initialCenter)
  const initialZoomRef = useRef(initialZoom)
  const initialStyleRef = useRef(mapStyle)
  const userMovedRef = useRef(false)

  // Store callbacks in refs to avoid map recreation on callback changes
  const onMapLoadRef = useRef(onMapLoad)
  const onMoveEndRef = useRef(onMoveEnd)
  const onClickRef = useRef(onClick)

  useEffect(() => {
    onMapLoadRef.current = onMapLoad
    onMoveEndRef.current = onMoveEnd
    onClickRef.current = onClick
  })

  useEffect(() => {
    if (!containerRef.current || tokenMissing) return

    const map = new mapboxgl.Map({
      container: containerRef.current,
      accessToken: mapboxgl.accessToken || undefined,
      style: mapStyles[initialStyleRef.current],
      center: initialCenterRef.current,
      zoom: initialZoomRef.current,
      interactive,
    })

    mapRef.current = map

    if (showControls) {
      map.addControl(new NavigationControl(), 'top-right')
      map.addControl(new FullscreenControl(), 'top-right')
      map.addControl(new ScaleControl({ maxWidth: 120, unit: 'imperial' }), 'bottom-left')
      if (showUserLocation) {
        map.addControl(
          new GeolocateControl({
            positionOptions: { enableHighAccuracy: true },
            trackUserLocation: true,
            showUserHeading: true,
          }),
          'top-right'
        )
      }
    }

    map.on('load', () => {
      setIsLoaded(true)
      onMapLoadRef.current?.(map)
    })

    map.on('moveend', () => {
      onMoveEndRef.current?.(map)
    })

    // Only real user gestures carry originalEvent; programmatic moves don't.
    map.on('movestart', (e) => {
      if ((e as any).originalEvent) userMovedRef.current = true
    })

    map.on('click', (e) => {
      onClickRef.current?.(e)
    })

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [showControls, showUserLocation, interactive, tokenMissing])

  // The centre often arrives after the map exists (the venue or user location
  // is still loading). Go there once it does, unless the user already moved.
  const centerKey = initialCenter ? `${initialCenter[0]},${initialCenter[1]}` : ''
  useEffect(() => {
    const map = mapRef.current
    if (!map || !initialCenter || userMovedRef.current) return
    const [lng, lat] = initialCenter
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) return
    const c = map.getCenter()
    if (Math.abs(c.lng - lng) > 1e-6 || Math.abs(c.lat - lat) > 1e-6) {
      map.jumpTo({ center: [lng, lat] })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [centerKey, isLoaded])

  // Style switcher. Keeps the same map (position, controls) and swaps only the
  // basemap. setStyle wipes every custom source/layer, so the overlay children
  // are unmounted first (isLoaded=false), then remounted on the new style to
  // add their layers again. Recreating the map here used to leave overlays
  // pointing at a half-built map and crash the page.
  useEffect(() => {
    const map = mapRef.current
    if (!map || mapStyle === initialStyleRef.current) return
    initialStyleRef.current = mapStyle
    const done = () => setIsLoaded(true)
    map.once('style.load', done)
    map.setStyle(mapStyles[mapStyle])
    return () => {
      map.off('style.load', done)
    }
  }, [mapStyle])

  const handleStyleChange = (style: MapStyleKey) => {
    if (style === mapStyle) return
    setIsLoaded(false)
    setMapStyle(style)
  }

  if (tokenMissing) {
    return (
      <div className={cn('flex items-center justify-center rounded-lg border border-danger/40 bg-danger/10 p-4 text-danger', className)}>
        Mapbox token missing. Set VITE_MAPBOX_TOKEN in your .env
      </div>
    )
  }

  return (
    <div className={cn('relative h-full w-full rounded-lg overflow-hidden border border-gray-800 bg-dark-card', className)}>
      {/* Style switcher */}
      {showStyleSwitcher && (
        <div className="absolute top-3 left-3 z-20 flex gap-2">
          {(['dark', 'streets', 'satellite'] as MapStyleKey[]).map((styleKey) => (
            <button
              key={styleKey}
              onClick={() => handleStyleChange(styleKey)}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-medium border transition-colors',
                mapStyle === styleKey
                  ? 'bg-primary text-white border-primary'
                  : 'bg-dark-bg/80 text-gray-300 border-gray-700 hover:border-gray-500'
              )}
            >
              {styleKey.charAt(0).toUpperCase() + styleKey.slice(1)}
            </button>
          ))}
        </div>
      )}

      {/* Map container */}
      <div ref={containerRef} className="h-full w-full" />

      {/* Loading overlay */}
      {!isLoaded && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-dark-bg/80 backdrop-blur-sm">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}

      {/* Render overlays only after the base style has loaded */}
      {isLoaded && mapRef.current && children?.(mapRef.current)}
    </div>
  )
}

