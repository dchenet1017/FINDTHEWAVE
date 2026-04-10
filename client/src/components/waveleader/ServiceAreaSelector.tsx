import { useEffect, useRef, useState, useCallback } from 'react'
import mapboxgl, { type Map as MapboxMap } from 'mapbox-gl'
import { MapContainer } from '@/components/map/MapContainer'
import { Input } from '@/components/ui/Input'
import { Slider } from '@/components/ui/Slider'
import { geocodeAddress, createCircleGeoJSON, defaultMapConfig } from '@/lib/mapbox'
import { MapPin, Loader2 } from 'lucide-react'

interface LocationData {
  address: string
  latitude: number
  longitude: number
}

interface ServiceAreaSelectorProps {
  location: LocationData | null
  radiusMiles: number
  onLocationChange: (location: LocationData | null) => void
  onRadiusChange: (radius: number) => void
  disabled?: boolean
}

export function ServiceAreaSelector({
  location,
  radiusMiles,
  onLocationChange,
  onRadiusChange,
  disabled = false,
}: ServiceAreaSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<
    Array<{ id: string; place_name: string; center: [number, number] }>
  >([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const mapRef = useRef<MapboxMap | null>(null)
  const circleSourceId = 'service-area-circle'
  const circleLayerId = 'service-area-circle-fill'

  const updateCircle = useCallback(
    (map: MapboxMap) => {
      if (!location) return

      const circle = createCircleGeoJSON(
        [location.longitude, location.latitude],
        radiusMiles
      )

      const source = map.getSource(circleSourceId)
      if (source) {
        ;(source as mapboxgl.GeoJSONSource).setData({
          type: 'Feature',
          properties: {},
          geometry: circle,
        })
      } else {
        map.addSource(circleSourceId, {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: circle,
          },
        })
        map.addLayer({
          id: circleLayerId,
          type: 'fill',
          source: circleSourceId,
          paint: {
            'fill-color': '#6C5CE7',
            'fill-opacity': 0.2,
            'fill-outline-color': '#6C5CE7',
          },
        })
      }
    },
    [location, radiusMiles]
  )

  useEffect(() => {
    if (searchQuery.length < 3) {
      setSearchResults([])
      return
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true)
      try {
        const results = await geocodeAddress(searchQuery)
        setSearchResults(results)
        setShowResults(true)
      } catch {
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchQuery])

  const handleSelectResult = (result: {
    place_name: string
    center: [number, number]
  }) => {
    onLocationChange({
      address: result.place_name,
      latitude: result.center[1],
      longitude: result.center[0],
    })
    setSearchQuery(result.place_name)
    setShowResults(false)
  }

  const handleMapLoad = (map: MapboxMap) => {
    mapRef.current = map

    if (location) {
      map.flyTo({
        center: [location.longitude, location.latitude],
        zoom: 11,
      })
      updateCircle(map)
    }
  }

  useEffect(() => {
    if (mapRef.current && location) {
      mapRef.current.flyTo({
        center: [location.longitude, location.latitude],
        zoom: 11,
      })
      updateCircle(mapRef.current)
    }
  }, [location, radiusMiles, updateCircle])

  return (
    <div className="space-y-4">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
        <Input
          placeholder="Search for your address..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => searchResults.length > 0 && setShowResults(true)}
          onBlur={() => setTimeout(() => setShowResults(false), 200)}
          className="pl-10 pr-10"
          disabled={disabled}
        />
        {isSearching && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 animate-spin" />
        )}
        {showResults && searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 rounded-lg border border-gray-700 bg-dark-card shadow-xl z-10 max-h-48 overflow-auto">
            {searchResults.map((result) => (
              <button
                key={result.id}
                type="button"
                onClick={() => handleSelectResult(result)}
                className="w-full px-4 py-3 text-left text-sm text-white hover:bg-gray-800 transition-colors"
              >
                {result.place_name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-300">
          Service radius: {radiusMiles} miles
        </label>
        <Slider
          value={[radiusMiles]}
          onValueChange={([v]) => onRadiusChange(v)}
          min={1}
          max={25}
          step={1}
          disabled={disabled}
        />
      </div>

      <div className="h-[300px] rounded-lg overflow-hidden border border-gray-800">
        <MapContainer
          initialCenter={
            location
              ? [location.longitude, location.latitude]
              : defaultMapConfig.center
          }
          initialZoom={location ? 11 : defaultMapConfig.zoom}
          onMapLoad={handleMapLoad}
          showControls={false}
          showUserLocation={false}
          showStyleSwitcher={false}
        >
          {(map) => map && location && updateCircle(map)}
        </MapContainer>
      </div>

      {location && (
        <p className="text-sm text-gray-500">
          Center: {location.address}
        </p>
      )}
    </div>
  )
}
