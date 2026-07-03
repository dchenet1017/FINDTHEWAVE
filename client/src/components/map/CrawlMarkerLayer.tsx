import { useEffect, useMemo } from 'react'
import type { Map as MapboxMap, GeoJSONSource, MapLayerMouseEvent } from 'mapbox-gl'
import type { Crawl } from '@/types/crawl'

type Props = {
  map: MapboxMap | null
  crawls: Crawl[]
  selectedId?: string | null
  onClick?: (c: Crawl) => void
}

const POINTS_SOURCE_ID = 'crawl-stops'
const POINTS_LAYER_ID = 'crawl-stops-points'
const LINES_SOURCE_ID = 'crawl-routes'
const LINES_LAYER_ID = 'crawl-routes-lines'

function validStops(crawl: Crawl) {
  return crawl.stops
    .filter((s) => s.business?.latitude != null && s.business?.longitude != null)
    .slice()
    .sort((a, b) => a.order - b.order)
}

export function CrawlMarkerLayer({ map, crawls, selectedId, onClick }: Props) {
  const pointsGeoJson = useMemo(() => {
    const list = Array.isArray(crawls) ? crawls : []
    const features: GeoJSON.Feature[] = []
    for (const c of list) {
      const stops = validStops(c)
      stops.forEach((s, i) => {
        features.push({
          type: 'Feature',
          id: `${c.id}-${s.id}`,
          properties: {
            crawlId: c.id,
            stopOrder: i + 1,
            totalStops: stops.length,
            title: c.title,
            data: c,
          },
          geometry: {
            type: 'Point',
            coordinates: [Number(s.business!.longitude), Number(s.business!.latitude)],
          },
        })
      })
    }
    return { type: 'FeatureCollection', features } as GeoJSON.FeatureCollection
  }, [crawls])

  const linesGeoJson = useMemo(() => {
    const list = Array.isArray(crawls) ? crawls : []
    const features: GeoJSON.Feature[] = []
    for (const c of list) {
      const stops = validStops(c)
      if (stops.length < 2) continue
      features.push({
        type: 'Feature',
        id: c.id,
        properties: { crawlId: c.id },
        geometry: {
          type: 'LineString',
          coordinates: stops.map((s) => [Number(s.business!.longitude), Number(s.business!.latitude)]),
        },
      })
    }
    return { type: 'FeatureCollection', features } as GeoJSON.FeatureCollection
  }, [crawls])

  useEffect(() => {
    if (!map) return

    const addLayers = () => {
      if (!map.getSource(LINES_SOURCE_ID)) {
        map.addSource(LINES_SOURCE_ID, { type: 'geojson', data: linesGeoJson })
        map.addLayer({
          id: LINES_LAYER_ID,
          type: 'line',
          source: LINES_SOURCE_ID,
          paint: {
            'line-color': '#9C6BFF',
            'line-width': 2,
            'line-dasharray': [2, 1.5],
          },
        })
      }
      if (!map.getSource(POINTS_SOURCE_ID)) {
        map.addSource(POINTS_SOURCE_ID, { type: 'geojson', data: pointsGeoJson })
        map.addLayer({
          id: POINTS_LAYER_ID,
          type: 'circle',
          source: POINTS_SOURCE_ID,
          paint: {
            'circle-color': '#9C6BFF',
            'circle-radius': ['case', ['==', ['get', 'crawlId'], selectedId ?? ''], 9, 7],
            'circle-stroke-width': 2,
            'circle-stroke-color': '#0f172a',
          },
        })
      }
    }

    if (map.isStyleLoaded()) addLayers()
    else map.once('load', addLayers)

    return () => {
      try {
        if (!map) return
        if (map.getLayer(POINTS_LAYER_ID)) map.removeLayer(POINTS_LAYER_ID)
        if (map.getSource(POINTS_SOURCE_ID)) map.removeSource(POINTS_SOURCE_ID)
        if (map.getLayer(LINES_LAYER_ID)) map.removeLayer(LINES_LAYER_ID)
        if (map.getSource(LINES_SOURCE_ID)) map.removeSource(LINES_SOURCE_ID)
      } catch {
        // map was already destroyed during navigation
      }
    }
  }, [map])

  useEffect(() => {
    if (!map) return
    const source = map.getSource(POINTS_SOURCE_ID) as GeoJSONSource
    if (source) {
      const enriched = {
        ...pointsGeoJson,
        features: pointsGeoJson.features.map((f: any) => ({
          ...f,
          properties: { ...f.properties, data: JSON.stringify(f.properties.data) },
        })),
      }
      source.setData(enriched as any)
    }
    const lineSource = map.getSource(LINES_SOURCE_ID) as GeoJSONSource
    if (lineSource) lineSource.setData(linesGeoJson as any)
  }, [map, pointsGeoJson, linesGeoJson])

  useEffect(() => {
    if (!map) return
    const handler = (e: MapLayerMouseEvent) => {
      const feat = map.queryRenderedFeatures(e.point, { layers: [POINTS_LAYER_ID] })[0]
      if (!feat?.properties?.data) return
      const crawl = JSON.parse(feat.properties.data) as Crawl
      onClick?.(crawl)
    }
    map.on('click', POINTS_LAYER_ID, handler)
    return () => {
      if (map) map.off('click', POINTS_LAYER_ID, handler)
    }
  }, [map, onClick])

  return null
}
