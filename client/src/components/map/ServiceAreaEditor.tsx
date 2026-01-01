import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Slider } from '@/components/ui/Slider'
import { Button } from '@/components/ui/Button'
import { MapContainer } from '@/components/map/MapContainer'
import { MapMarker } from '@/components/map/MapMarker'
import type { Map as MapboxMap } from 'mapbox-gl'

interface ServiceAreaEditorProps {
  center?: [number, number]
  radius?: number
  onSave?: (area: { center: [number, number]; radius: number }) => void
  onCancel?: () => void
}

export function ServiceAreaEditor({ center, radius = 10, onSave, onCancel }: ServiceAreaEditorProps) {
  const [map, setMap] = useState<MapboxMap | null>(null)
  const [areaCenter, setAreaCenter] = useState<[number, number] | null>(center ?? null)
  const [areaRadius, setAreaRadius] = useState<number>(radius)

  useEffect(() => {
    if (center) setAreaCenter(center)
  }, [center])

  const circleSource = useMemo(() => {
    if (!areaCenter) return null
    const [lng, lat] = areaCenter
    const rKm = areaRadius * 1.60934
    const points = 64
    const coords = []
    for (let i = 0; i <= points; i++) {
      const angle = (i * 360) / points
      const rad = (angle * Math.PI) / 180
      const dx = (rKm / 6371) * Math.cos(rad)
      const dy = (rKm / 6371) * Math.sin(rad)
      const newLat = lat + (dy * 180) / Math.PI
      const newLng = lng + ((dx * 180) / Math.PI) / Math.cos((lat * Math.PI) / 180)
      coords.push([newLng, newLat])
    }
    return {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [coords],
      },
    } as any
  }, [areaCenter, areaRadius])

  useEffect(() => {
    if (!map || !circleSource) return
    if (!map.getSource('service-area')) {
      map.addSource('service-area', {
        type: 'geojson',
        data: circleSource,
      })
      map.addLayer({
        id: 'service-area-fill',
        type: 'fill',
        source: 'service-area',
        paint: {
          'fill-color': '#6C5CE7',
          'fill-opacity': 0.1,
        },
      })
      map.addLayer({
        id: 'service-area-outline',
        type: 'line',
        source: 'service-area',
        paint: {
          'line-color': '#6C5CE7',
          'line-width': 2,
        },
      })
    } else {
      const src = map.getSource('service-area') as any
      src.setData(circleSource)
    }
  }, [map, circleSource])

  const handleSave = () => {
    if (!areaCenter) return
    onSave?.({ center: areaCenter, radius: areaRadius })
  }

  return (
    <Card className="bg-dark-card border-gray-800">
      <CardHeader>
        <CardTitle className="text-sm text-gray-200">Service Area</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-xs text-gray-400">Radius: {areaRadius} miles</div>
        <Slider value={[areaRadius]} min={1} max={25} step={1} onValueChange={(v) => setAreaRadius(v[0])} />
        <div className="h-64 rounded-md overflow-hidden border border-gray-800">
          <MapContainer
            initialCenter={areaCenter || undefined}
            initialZoom={12}
            showControls
            showUserLocation={false}
            onMapLoad={(m) => setMap(m)}
            onClick={(e) => setAreaCenter([e.lngLat.lng, e.lngLat.lat])}
          >
            {(m) =>
              m &&
              areaCenter && (
                <MapMarker
                  map={m}
                  position={areaCenter}
                  type="WAVELEADER"
                  isSelected
                />
              )
            }
          </MapContainer>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleSave} className="flex-1">
            Save Service Area
          </Button>
          {onCancel && (
            <Button variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

