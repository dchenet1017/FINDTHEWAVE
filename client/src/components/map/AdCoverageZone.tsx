import { useEffect, useMemo } from 'react'
import type { Map as MapboxMap, GeoJSONSource } from 'mapbox-gl'
import { createCircleGeoJSON } from '@/lib/mapbox'

type Props = {
  map: MapboxMap | null
  center: [number, number] | null
  radiusMiles: number
  visible: boolean
}

const SOURCE_ID = 'ad-coverage-src'
const FILL_LAYER_ID = 'ad-coverage-fill'
const LINE_LAYER_ID = 'ad-coverage-line'

export function AdCoverageZone({ map, center, radiusMiles, visible }: Props) {
  const geojson = useMemo(() => {
    if (!center) return null
    return {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {},
          geometry: createCircleGeoJSON(center, radiusMiles),
        },
      ],
    } as GeoJSON.FeatureCollection
  }, [center, radiusMiles])

  useEffect(() => {
    if (!map || !geojson) return

    const add = () => {
      if (!map.getSource(SOURCE_ID)) {
        map.addSource(SOURCE_ID, { type: 'geojson', data: geojson })
      }
      if (!map.getLayer(FILL_LAYER_ID)) {
        map.addLayer({
          id: FILL_LAYER_ID,
          type: 'fill',
          source: SOURCE_ID,
          paint: {
            'fill-color': '#6C5CE7',
            'fill-opacity': 0.12,
          },
        })
      }
      if (!map.getLayer(LINE_LAYER_ID)) {
        map.addLayer({
          id: LINE_LAYER_ID,
          type: 'line',
          source: SOURCE_ID,
          paint: {
            'line-color': '#6C5CE7',
            'line-width': 2,
            'line-opacity': 0.55,
          },
        })
      }

      map.setLayoutProperty(FILL_LAYER_ID, 'visibility', visible ? 'visible' : 'none')
      map.setLayoutProperty(LINE_LAYER_ID, 'visibility', visible ? 'visible' : 'none')
    }

    if (map.isStyleLoaded()) add()
    else map.once('load', add)

    return () => {
      if (!map) return
      if (map.getLayer(LINE_LAYER_ID)) map.removeLayer(LINE_LAYER_ID)
      if (map.getLayer(FILL_LAYER_ID)) map.removeLayer(FILL_LAYER_ID)
      if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID)
    }
  }, [map])

  useEffect(() => {
    if (!map || !geojson) return
    const source = map.getSource(SOURCE_ID) as GeoJSONSource
    if (source) source.setData(geojson as any)
    if (map.getLayer(FILL_LAYER_ID)) {
      map.setLayoutProperty(FILL_LAYER_ID, 'visibility', visible ? 'visible' : 'none')
    }
    if (map.getLayer(LINE_LAYER_ID)) {
      map.setLayoutProperty(LINE_LAYER_ID, 'visibility', visible ? 'visible' : 'none')
    }
  }, [map, geojson, visible])

  return null
}

