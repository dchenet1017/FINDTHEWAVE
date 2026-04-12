import { useEffect, useMemo } from 'react'
import type { Map as MapboxMap, GeoJSONSource, MapLayerMouseEvent } from 'mapbox-gl'

type EventFeature = {
  id: string
  latitude: number
  longitude: number
  title: string
  type?: string
  startDate?: string
  endDate?: string
}

type Props = {
  map: MapboxMap | null
  events: EventFeature[]
  onClick?: (e: EventFeature) => void
}

const SOURCE_ID = 'events'
const LAYER_ID = 'events-points'

export function EventMarkerLayer({ map, events, onClick }: Props) {
  const geojson = useMemo(() => {
    const list = Array.isArray(events) ? events : []
    return {
      type: 'FeatureCollection',
      features: list
        .map((ev) => ({
          type: 'Feature',
          id: ev.id,
          properties: {
            id: ev.id,
            title: ev.title,
            type: ev.type || 'EVENT',
            data: ev,
          },
          geometry: {
            type: 'Point',
            coordinates: [Number(ev.longitude), Number(ev.latitude)],
          },
        }))
        .filter((f) => !Number.isNaN((f as any).geometry.coordinates[0])),
    } as GeoJSON.FeatureCollection
  }, [events])

  useEffect(() => {
    if (!map) return
    if (!map.getSource(SOURCE_ID)) {
      map.addSource(SOURCE_ID, {
        type: 'geojson',
        data: geojson,
      })
      map.addLayer({
        id: LAYER_ID,
        type: 'circle',
        source: SOURCE_ID,
        paint: {
          'circle-color': '#F59E0B',
          'circle-radius': 7,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#0f172a',
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
      const enriched = {
        ...geojson,
        features: geojson.features.map((f: any) => ({
          ...f,
          properties: {
            ...f.properties,
            data: JSON.stringify(f.properties.data),
          },
        })),
      }
      source.setData(enriched as any)
    }
  }, [map, geojson])

  useEffect(() => {
    if (!map) return
    const handler = (e: MapLayerMouseEvent) => {
      const feat = map.queryRenderedFeatures(e.point, { layers: [LAYER_ID] })[0]
      if (!feat?.properties?.data) return
      const ev = JSON.parse(feat.properties.data) as EventFeature
      onClick?.(ev)
    }
    map.on('click', LAYER_ID, handler)
    return () => {
      if (map) map.off('click', LAYER_ID, handler)
    }
  }, [map, onClick])

  return null
}

