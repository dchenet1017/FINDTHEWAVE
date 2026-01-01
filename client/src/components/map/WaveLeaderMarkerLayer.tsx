import { useEffect, useMemo } from 'react'
import type { Map as MapboxMap, GeoJSONSource, MapLayerMouseEvent } from 'mapbox-gl'
import { markerColors } from '@/lib/mapbox'
import type { WaveLeader } from '../../../../shared/types/business'

type Props = {
  map: MapboxMap | null
  waveLeaders: WaveLeader[]
  selectedId?: string | null
  onClick?: (wl: WaveLeader) => void
}

const SOURCE_ID = 'waveleaders'
const POINT_LAYER_ID = 'waveleaders-points'

export function WaveLeaderMarkerLayer({ map, waveLeaders, selectedId, onClick }: Props) {
  const geojson = useMemo(() => {
    return {
      type: 'FeatureCollection',
      features: waveLeaders
        .map((w) => {
          const lat = (w as any).latitude
          const lng = (w as any).longitude
          if (lat == null || lng == null) return null
          return {
            type: 'Feature',
            id: w.id,
            properties: {
              id: w.id,
              name: (w as any).displayName || 'WaveLeader',
              rating: (w as any).rating,
              available: (w as any).isAvailable,
              color: markerColors.WAVELEADER,
              data: w,
            },
            geometry: {
              type: 'Point',
              coordinates: [Number(lng), Number(lat)],
            },
          }
        })
        .filter(Boolean),
    } as GeoJSON.FeatureCollection
  }, [waveLeaders])

  useEffect(() => {
    if (!map) return
    if (!map.getSource(SOURCE_ID)) {
      map.addSource(SOURCE_ID, {
        type: 'geojson',
        data: geojson,
      })

      map.addLayer({
        id: POINT_LAYER_ID,
        type: 'circle',
        source: SOURCE_ID,
        paint: {
          'circle-color': ['get', 'color'],
          'circle-radius': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            9,
            7,
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#0f172a',
          'circle-opacity': [
            'case',
            ['boolean', ['get', 'available'], false],
            0.95,
            0.5,
          ],
        },
      })
    }

    return () => {
      if (!map) return
      if (map.getLayer(POINT_LAYER_ID)) map.removeLayer(POINT_LAYER_ID)
      if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID)
    }
  }, [map])

  useEffect(() => {
    if (!map) return
    const src = map.getSource(SOURCE_ID) as GeoJSONSource
    if (src) {
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
      src.setData(enriched as any)
    }
  }, [map, geojson])

  useEffect(() => {
    if (!map) return
    geojson.features.forEach((f: any) => {
      map.setFeatureState({ source: SOURCE_ID, id: f.properties.id }, { selected: false })
    })
    if (selectedId) {
      map.setFeatureState({ source: SOURCE_ID, id: selectedId }, { selected: true })
    }
  }, [map, geojson, selectedId])

  useEffect(() => {
    if (!map) return
    const handler = (e: MapLayerMouseEvent) => {
      const feat = map.queryRenderedFeatures(e.point, { layers: [POINT_LAYER_ID] })[0]
      if (!feat?.properties?.data) return
      const wl = JSON.parse(feat.properties.data) as WaveLeader
      onClick?.(wl)
    }
    map.on('click', POINT_LAYER_ID, handler)
    return () => {
      if (map) map.off('click', POINT_LAYER_ID, handler)
    }
  }, [map, onClick])

  return null
}

