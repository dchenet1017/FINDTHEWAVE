import { useEffect, useMemo } from 'react'
import type { Map as MapboxMap, GeoJSONSource } from 'mapbox-gl'

type HeatPoint = { lat: number; lng: number; weight?: number }

type HeatmapLayerProps = {
  map: MapboxMap | null
  id?: string
  points: HeatPoint[]
  visible?: boolean
  colorRamp?: [number, string][]
}

export function HeatmapLayer({
  map,
  id = 'heatmap',
  points,
  visible = true,
  colorRamp = [
    [0, 'rgba(56,189,248,0)'],
    [0.2, 'rgba(56,189,248,0.6)'],
    [0.4, 'rgba(34,197,94,0.6)'],
    [0.6, 'rgba(234,179,8,0.7)'],
    [1, 'rgba(239,68,68,0.8)'],
  ],
}: HeatmapLayerProps) {
  const SOURCE_ID = `${id}-src`
  const LAYER_ID = `${id}-layer`

  const geojson = useMemo(() => {
    const list = Array.isArray(points) ? points : []
    return {
      type: 'FeatureCollection',
      features: list.map((p, idx) => ({
        type: 'Feature',
        id: idx,
        properties: { weight: p.weight ?? 1 },
        geometry: {
          type: 'Point',
          coordinates: [p.lng, p.lat],
        },
      })),
    } as GeoJSON.FeatureCollection
  }, [points])

  useEffect(() => {
    if (!map) return
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
          'heatmap-weight': ['interpolate', ['linear'], ['get', 'weight'], 0, 0, 6, 1],
          'heatmap-intensity': 1,
          'heatmap-color': ['interpolate', ['linear'], ['heatmap-density'], ...colorRamp.flat()],
          'heatmap-radius': 30,
          'heatmap-opacity': 0.8,
        },
      })
    }
    return () => {
      try {
        if (!map) return
        if (map.getLayer(LAYER_ID)) map.removeLayer(LAYER_ID)
        if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID)
      } catch {
        // map was already destroyed during navigation
      }
    }
  }, [map])

  useEffect(() => {
    if (!map) return
    const source = map.getSource(SOURCE_ID) as GeoJSONSource
    if (source) {
      source.setData(geojson as any)
    }
    if (map.getLayer(LAYER_ID)) {
      map.setLayoutProperty(LAYER_ID, 'visibility', visible ? 'visible' : 'none')
    }
  }, [map, geojson, visible])

  return null
}

