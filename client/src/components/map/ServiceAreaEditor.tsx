import { useEffect, useMemo, useCallback, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Slider } from '@/components/ui/Slider'
import { Button } from '@/components/ui/Button'
import { MapContainer } from '@/components/map/MapContainer'
import { MapMarker } from '@/components/map/MapMarker'
import mapboxgl from 'mapbox-gl'
import { createCircleGeoJSON } from '@/lib/mapbox'
import type { Map as MapboxMap } from 'mapbox-gl'
import type { Business } from '../../../../shared/types/business'

interface ServiceAreaEditorProps {
  center?: [number, number] | null
  radius?: number
  onCenterChange?: (center: [number, number]) => void
  onRadiusChange?: (radius: number) => void
  businesses?: Business[]
  isEditing?: boolean
  onSave?: (area: { center: [number, number]; radius: number }) => void
  onCancel?: () => void
}

export function ServiceAreaEditor({
  center,
  radius = 10,
  onCenterChange,
  onRadiusChange,
  businesses = [],
  isEditing = true,
  onSave,
  onCancel,
}: ServiceAreaEditorProps) {
  const circleSource = useMemo(() => {
    if (!center) return null
    const circle = createCircleGeoJSON(center, radius)
    return {
      type: 'Feature' as const,
      properties: {},
      geometry: circle,
    }
  }, [center, radius])

  const mapRef = useRef<MapboxMap | null>(null)

  const updateCircle = useCallback(
    (map: MapboxMap) => {
      if (!map || !circleSource) return

      const sourceId = 'service-area-circle'

      const source = map.getSource(sourceId)
      if (source) {
        ;(source as mapboxgl.GeoJSONSource).setData(circleSource)
      } else {
        map.addSource(sourceId, {
          type: 'geojson',
          data: circleSource,
        })
        map.addLayer({
          id: 'service-area-circle-fill',
          type: 'fill',
          source: sourceId,
          paint: {
            'fill-color': '#6C5CE7',
            'fill-opacity': 0.2,
            'fill-outline-color': '#6C5CE7',
          },
        })
      }
    },
    [circleSource]
  )

  useEffect(() => {
    if (mapRef.current && circleSource) {
      updateCircle(mapRef.current)
    }
  }, [circleSource, updateCircle])

  const handleSave = () => {
    if (!center) return
    onSave?.({ center, radius })
  }

  const handleMapClick = (e: mapboxgl.MapMouseEvent) => {
    if (!isEditing) return
    const [lng, lat] = [e.lngLat.lng, e.lngLat.lat]
    onCenterChange?.([lng, lat])
  }

  return (
    <Card className="bg-dark-card border-gray-800">
      <CardHeader>
        <CardTitle className="text-sm text-gray-200">Service Area</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>Radius: {radius} miles</span>
        </div>
        <Slider
          value={[radius]}
          min={1}
          max={25}
          step={1}
          onValueChange={(v) => onRadiusChange?.(v[0])}
          disabled={!isEditing}
        />
        <div className="h-64 rounded-md overflow-hidden border border-gray-800">
          <MapContainer
            initialCenter={center || undefined}
            initialZoom={12}
            showControls={false}
            showUserLocation={false}
            showStyleSwitcher={false}
            onMapLoad={(map) => {
              mapRef.current = map
              updateCircle(map)
            }}
            onClick={handleMapClick}
          >
            {(map) =>
              map &&
              center ? (
                <MapMarker
                  map={map}
                  position={center}
                  type="WAVELEADER"
                  isSelected
                />
              ) : null
            }
          </MapContainer>
        </div>
        {businesses.length > 0 && (
          <p className="text-xs text-gray-500">
            {businesses.length} businesses in your area
          </p>
        )}
        {isEditing && (onSave || onCancel) && (
          <div className="flex items-center gap-2">
            {onSave && (
              <Button onClick={handleSave} className="flex-1">
                Apply Changes
              </Button>
            )}
            {onCancel && (
              <Button variant="ghost" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
