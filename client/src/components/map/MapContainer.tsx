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
  children?: (map: MapboxMap | null) => React.ReactNode
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
      style: mapStyles[mapStyle],
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

    map.on('click', (e) => {
      onClickRef.current?.(e)
    })

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [mapStyle, showControls, showUserLocation, interactive, tokenMissing])

  // Style switcher handler
  const handleStyleChange = (style: MapStyleKey) => {
    setMapStyle(style)
    if (mapRef.current) {
      mapRef.current.setStyle(mapStyles[style])
    }
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

