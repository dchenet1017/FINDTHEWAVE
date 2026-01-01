import { useEffect, useMemo } from 'react'
import type { Map as MapboxMap, GeoJSONSource, MapLayerMouseEvent } from 'mapbox-gl'
import { markerColors } from '@/lib/mapbox'
import type { Business } from '../../../../shared/types/business'

type Props = {
  map: MapboxMap | null
  businesses: Business[]
  selectedId?: string | null
  onBusinessClick?: (biz: Business) => void
}

const SOURCE_ID = 'businesses'
const CLUSTER_LAYER_ID = 'clusters'
const CLUSTER_COUNT_ID = 'cluster-count'
const UNCLUSTERED_LAYER_ID = 'unclustered-point'

const safeHasSource = (map?: MapboxMap | null, id?: string) => {
  if (!map || !id) return false
  try {
    return Boolean(map.getSource(id))
  } catch {
    return false
  }
}

const safeHasLayer = (map?: MapboxMap | null, id?: string) => {
  if (!map || !id) return false
  try {
    return Boolean(map.getLayer(id))
  } catch {
    return false
  }
}

export function BusinessMarkerLayer({ map, businesses, selectedId, onBusinessClick }: Props) {
  const geojson = useMemo(() => {
    const getCoords = (b: Business) => {
      const lat = (b as any).latitude ?? (b as any).location?.latitude
      const lng = (b as any).longitude ?? (b as any).location?.longitude
      return { lat: lat !== null ? Number(lat) : undefined, lng: lng !== null ? Number(lng) : undefined }
    }

    return {
      type: 'FeatureCollection',
      features: businesses
        .map((b) => {
          const { lat, lng } = getCoords(b)
          if (lat === undefined || lng === undefined || Number.isNaN(lat) || Number.isNaN(lng)) return null
          return {
          type: 'Feature',
          id: b.id,
          properties: {
            id: b.id,
            color: markerColors[b.type] || markerColors.OTHER,
            business: b,
          },
          geometry: {
            type: 'Point',
              coordinates: [lng, lat],
          },
          }
        })
        .filter(Boolean),
    } as GeoJSON.FeatureCollection
  }, [businesses])

  // Init source and layers
  useEffect(() => {
    if (!map) return

    const addLayers = () => {
      if (map.getSource(SOURCE_ID)) return
      try {
        map.addSource(SOURCE_ID, {
          type: 'geojson',
          data: geojson,
          cluster: true,
          clusterMaxZoom: 14,
          clusterRadius: 50,
        })
      } catch {
        return
      }

      map.addLayer({
        id: CLUSTER_LAYER_ID,
        type: 'circle',
        source: SOURCE_ID,
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': [
            'step',
            ['get', 'point_count'],
            '#6C5CE7',
            10,
            '#9C88FF',
            25,
            '#00D2D3',
          ],
          'circle-radius': [
            'step',
            ['get', 'point_count'],
            20,
            10,
            25,
            25,
            30,
          ],
          'circle-opacity': 0.9,
        },
      })

      map.addLayer({
        id: CLUSTER_COUNT_ID,
        type: 'symbol',
        source: SOURCE_ID,
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-size': 12,
        },
        paint: {
          'text-color': '#ffffff',
        },
      })

      map.addLayer({
        id: UNCLUSTERED_LAYER_ID,
        type: 'circle',
        source: SOURCE_ID,
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': ['get', 'color'],
          'circle-radius': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            10,
            7,
          ],
          'circle-stroke-width': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            2,
            1,
          ],
          'circle-stroke-color': '#0f172a',
          'circle-opacity': 0.9,
        },
      })

      // Cluster click -> zoom
      map.on('click', CLUSTER_LAYER_ID, (e) => {
        const features = map.queryRenderedFeatures(e.point, {
          layers: [CLUSTER_LAYER_ID],
        })
        const clusterIdRaw = features[0]?.properties?.cluster_id
        const source = map.getSource(SOURCE_ID) as GeoJSONSource
        if (typeof clusterIdRaw !== 'number' || !source) return
        source.getClusterExpansionZoom(clusterIdRaw, (err, zoom) => {
          if (err) return
          const lng = Number((features[0].geometry as any)?.coordinates?.[0] ?? NaN)
          const lat = Number((features[0].geometry as any)?.coordinates?.[1] ?? NaN)
          if (Number.isNaN(lng) || Number.isNaN(lat)) return
          const zoomValue = typeof zoom === 'number' ? zoom : Number(zoom)
          if (Number.isNaN(zoomValue)) return
          map.easeTo({ center: [lng, lat] as [number, number], zoom: zoomValue })
        })
      })

      // Cursor effects
      map.on('mouseenter', CLUSTER_LAYER_ID, () => (map.getCanvas().style.cursor = 'pointer'))
      map.on('mouseleave', CLUSTER_LAYER_ID, () => (map.getCanvas().style.cursor = ''))
      map.on('mouseenter', UNCLUSTERED_LAYER_ID, () => (map.getCanvas().style.cursor = 'pointer'))
      map.on('mouseleave', UNCLUSTERED_LAYER_ID, () => (map.getCanvas().style.cursor = ''))
    }

    if (map.isStyleLoaded()) {
      addLayers()
    } else {
      map.once('load', addLayers)
    }

    return () => {
      if (!map) return
      if (safeHasLayer(map, CLUSTER_LAYER_ID)) map.removeLayer(CLUSTER_LAYER_ID)
      if (safeHasLayer(map, CLUSTER_COUNT_ID)) map.removeLayer(CLUSTER_COUNT_ID)
      if (safeHasLayer(map, UNCLUSTERED_LAYER_ID)) map.removeLayer(UNCLUSTERED_LAYER_ID)
      if (safeHasSource(map, SOURCE_ID)) map.removeSource(SOURCE_ID)
    }
  }, [map, geojson])

  // Update source data
  useEffect(() => {
    if (!map) return
    const source = (safeHasSource(map, SOURCE_ID) ? map.getSource(SOURCE_ID) : null) as
      | GeoJSONSource
      | null
    if (source) {
      const enriched = {
        ...geojson,
        features: geojson.features.map((f: any) => ({
          ...f,
          properties: {
            ...f.properties,
            business: JSON.stringify(f.properties.business),
          },
        })),
      }
      source.setData(enriched as any)
    }
  }, [map, geojson])

  // Selected feature state
  useEffect(() => {
    if (!map) return
    if (!safeHasSource(map, SOURCE_ID)) return
    geojson.features.forEach((f: any) => {
      map.setFeatureState({ source: SOURCE_ID, id: f.properties.id }, { selected: false })
    })
    if (selectedId) {
      map.setFeatureState({ source: SOURCE_ID, id: selectedId }, { selected: true })
    }
  }, [map, geojson, selectedId])

  // Attach click handler for points (after source set)
  useEffect(() => {
    if (!map) return
    const handler = (e: MapLayerMouseEvent) => {
      const feat = map.queryRenderedFeatures(e.point, { layers: [UNCLUSTERED_LAYER_ID] })[0]
      if (!feat?.properties?.business) return
      const biz = JSON.parse(feat.properties.business) as Business
      onBusinessClick?.(biz)
    }
    map.on('click', UNCLUSTERED_LAYER_ID, handler)
    return () => {
      if (map) {
        map.off('click', UNCLUSTERED_LAYER_ID, handler)
      }
    }
  }, [map, onBusinessClick])

  return null
}

