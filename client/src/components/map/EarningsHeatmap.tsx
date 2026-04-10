import { useEffect, useMemo } from 'react'
import type { Map as MapboxMap, GeoJSONSource } from 'mapbox-gl'

interface EarningsHeatmapProps {
  map: MapboxMap | null
  points: Array<{ lat: number; lng: number; weight: number }>
  visible?: boolean
  colorRamp?: [number, string][]
}

const DEFAULT_COLOR_RAMP: [number, string][] = [
  [0, 'rgba(56,189,248,0)'],
  [0.2, 'rgba(56,189,248,0.5)'],
  [0.4, 'rgba(34,197,94,0.6)'],
  [0.6, 'rgba(234,179,8,0.7)'],
  [1, 'rgba(239,68,68,0.8)'],
]

export function EarningsHeatmap({
  map,
  points,
  visible = true,
  colorRamp = DEFAULT_COLOR_RAMP,
}: EarningsHeatmapProps) {
  const SOURCE_ID = 'earnings-heatmap-src'
  const LAYER_ID = 'earnings-heatmap-layer'

  const geojson = useMemo(() => {
    return {
      type: 'FeatureCollection' as const,
      features: points.map((p, idx) => ({
        type: 'Feature' as const,
        id: idx,
        properties: { weight: p.weight ?? 1 },
        geometry: {
          type: 'Point' as const,
          coordinates: [p.lng, p.lat],
        },
      })),
    }
  }, [points])

  useEffect(() => {
    if (!map || typeof map.addSource !== 'function') return

    if (!map.getSource(SOURCE_ID)) {
      map.addSource(SOURCE_ID, {
        type: 'geojson',
        data: geojson,
      })
      map.addLayer({
        id: LAYER_ID,
        type: 'heatmap',
        source: SOURCE_ID,
        layout: { visibility: visible ? 'visible' : 'none' },
        paint: {
          'heatmap-weight': [
            'interpolate',
            ['linear'],
            ['get', 'weight'],
            0,
            0,
            100,
            1,
          ],
          'heatmap-intensity': 1,
          'heatmap-color': ['interpolate', ['linear'], ['heatmap-density'], ...colorRamp.flat()],
          'heatmap-radius': 30,
          'heatmap-opacity': 0.8,
        },
      })
    }

    return () => {
      if (map.getLayer(LAYER_ID)) map.removeLayer(LAYER_ID)
      if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID)
    }
  }, [map])

  useEffect(() => {
    if (!map || typeof map.getSource !== 'function') return
    const source = map.getSource(SOURCE_ID) as GeoJSONSource | undefined
    if (source && typeof source.setData === 'function') {
      source.setData(geojson as any)
    }
    if (map.getLayer(LAYER_ID)) {
      map.setLayoutProperty(LAYER_ID, 'visibility', visible ? 'visible' : 'none')
    }
  }, [map, geojson, visible])

  return null
}
