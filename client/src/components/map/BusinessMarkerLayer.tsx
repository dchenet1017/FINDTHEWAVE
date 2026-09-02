import { useCallback, useEffect, useMemo, useRef } from 'react'
import mapboxgl, { type Map as MapboxMap, type GeoJSONSource } from 'mapbox-gl'
import {
  createVenueMarkerElement,
  setVenueMarkerOffer,
  setVenueMarkerSelected,
} from '@/components/map/markers/venueMarkerFactory'
import type { Business } from '../../../../shared/types/business'

type Props = {
  map: MapboxMap | null
  businesses: Business[]
  selectedId?: string | null
  onBusinessClick?: (biz: Business) => void
  /** Business ids running a live Go Out offer - drawn with the 🕺 badge */
  activeOfferVenueIds?: Set<string>
}

const SOURCE_ID = 'businesses'
const CLUSTER_LAYER_ID = 'clusters'
const CLUSTER_COUNT_ID = 'cluster-count'

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

interface MarkerEntry {
  marker: mapboxgl.Marker
  el: HTMLElement
  onClick: () => void
}

/**
 * Business markers.
 *
 * Clusters stay a GL circle layer (cheap at any count), while each unclustered
 * leaf becomes a DOM marker so it can carry the category animation from
 * venueMarkerFactory. That keeps clustering - dropping it would put a DOM node
 * on screen for every venue in view.
 */
export function BusinessMarkerLayer({
  map,
  businesses,
  selectedId,
  onBusinessClick,
  activeOfferVenueIds,
}: Props) {
  const markersRef = useRef<globalThis.Map<string, MarkerEntry>>(new globalThis.Map())
  /**
   * Several instances of this component share one source id. Only the instance
   * that created the source drives the markers, otherwise the extra layers on
   * UserMapPage would each render a duplicate pin over the same venue.
   */
  const ownsSourceRef = useRef(false)

  const businessById = useMemo(() => {
    const index = new globalThis.Map<string, Business>()
    for (const b of Array.isArray(businesses) ? businesses : []) index.set(b.id, b)
    return index
  }, [businesses])

  // Latest values, read inside map event handlers without re-binding them on
  // every prop change. Written in an effect, never during render.
  const selectedIdRef = useRef(selectedId)
  const activeOfferRef = useRef(activeOfferVenueIds)
  const onBusinessClickRef = useRef(onBusinessClick)
  const businessByIdRef = useRef(businessById)

  useEffect(() => {
    selectedIdRef.current = selectedId
    activeOfferRef.current = activeOfferVenueIds
    onBusinessClickRef.current = onBusinessClick
    businessByIdRef.current = businessById
  }, [selectedId, activeOfferVenueIds, onBusinessClick, businessById])

  const geojson = useMemo(() => {
    const getCoords = (b: Business) => {
      const lat = (b as any).latitude ?? (b as any).location?.latitude
      const lng = (b as any).longitude ?? (b as any).location?.longitude
      return {
        lat: lat !== null ? Number(lat) : undefined,
        lng: lng !== null ? Number(lng) : undefined,
      }
    }

    const list = Array.isArray(businesses) ? businesses : []
    return {
      type: 'FeatureCollection',
      features: list
        .map((b) => {
          const { lat, lng } = getCoords(b)
          if (lat === undefined || lng === undefined || Number.isNaN(lat) || Number.isNaN(lng)) {
            return null
          }
          return {
            type: 'Feature',
            id: b.id,
            properties: {
              id: b.id,
              type: b.type,
              isSponsored: Boolean((b as any).isSponsored),
            },
            geometry: { type: 'Point', coordinates: [lng, lat] },
          }
        })
        .filter(Boolean),
    } as GeoJSON.FeatureCollection
  }, [businesses])

  /**
   * Reconcile DOM markers against whatever the source currently has unclustered
   * in view. Runs on every map render, so it stays a cheap id diff - existing
   * markers are mutated in place rather than rebuilt, which also keeps their
   * CSS animations from restarting.
   */
  const syncMarkers = useCallback(() => {
    if (!map || !ownsSourceRef.current) return
    if (!safeHasSource(map, SOURCE_ID)) return
    try {
      if (!map.isSourceLoaded(SOURCE_ID)) return
    } catch {
      return
    }

    let features: mapboxgl.MapboxGeoJSONFeature[]
    try {
      features = map.querySourceFeatures(SOURCE_ID)
    } catch {
      return
    }

    const seen = new Set<string>()

    for (const feature of features) {
      const props = feature.properties as Record<string, any> | null
      if (!props || props.point_count) continue

      const id = props.id as string | undefined
      if (!id || seen.has(id)) continue
      seen.add(id)

      const existing = markersRef.current.get(id)
      if (existing) {
        setVenueMarkerSelected(existing.el, selectedIdRef.current === id)
        setVenueMarkerOffer(existing.el, activeOfferRef.current?.has(id) ?? false)
        continue
      }

      const coordinates = (feature.geometry as any)?.coordinates
      if (!Array.isArray(coordinates) || coordinates.length < 2) continue

      const business = businessByIdRef.current.get(id)
      const el = createVenueMarkerElement(props.type ?? 'OTHER', {
        hasActiveOffer: activeOfferRef.current?.has(id) ?? false,
        isSelected: selectedIdRef.current === id,
        isSponsored: Boolean(props.isSponsored),
        label: business?.name,
      })

      const onClick = () => {
        const biz = businessByIdRef.current.get(id)
        if (biz) onBusinessClickRef.current?.(biz)
      }
      el.addEventListener('click', onClick)
      el.addEventListener('keydown', ((event: KeyboardEvent) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onClick()
        }
      }) as EventListener)

      const marker = new mapboxgl.Marker({ element: el, anchor: 'center' })
        .setLngLat(coordinates as [number, number])
        .addTo(map)

      markersRef.current.set(id, { marker, el, onClick })
    }

    // Anything that clustered up or scrolled out of view.
    for (const [id, entry] of markersRef.current) {
      if (seen.has(id)) continue
      try {
        entry.el.removeEventListener('click', entry.onClick)
        entry.marker.remove()
      } catch {
        // marker was already detached
      }
      markersRef.current.delete(id)
    }
  }, [map])

  // Source + cluster layers
  useEffect(() => {
    if (!map) return
    const markers = markersRef.current

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
        ownsSourceRef.current = true
      } catch {
        return
      }

      map.addLayer({
        id: CLUSTER_LAYER_ID,
        type: 'circle',
        source: SOURCE_ID,
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': ['step', ['get', 'point_count'], '#6C5CE7', 10, '#9C88FF', 25, '#00D2D3'],
          'circle-radius': ['step', ['get', 'point_count'], 20, 10, 25, 25, 30],
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
        paint: { 'text-color': '#ffffff' },
      })

      // Cluster click -> zoom in
      map.on('click', CLUSTER_LAYER_ID, (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: [CLUSTER_LAYER_ID] })
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

      map.on('mouseenter', CLUSTER_LAYER_ID, () => (map.getCanvas().style.cursor = 'pointer'))
      map.on('mouseleave', CLUSTER_LAYER_ID, () => (map.getCanvas().style.cursor = ''))

      syncMarkers()
    }

    if (map.isStyleLoaded()) {
      addLayers()
    } else {
      map.once('load', addLayers)
    }

    return () => {
      try {
        for (const [, entry] of markers) {
          entry.el.removeEventListener('click', entry.onClick)
          entry.marker.remove()
        }
        markers.clear()

        if (!map) return
        if (safeHasLayer(map, CLUSTER_LAYER_ID)) map.removeLayer(CLUSTER_LAYER_ID)
        if (safeHasLayer(map, CLUSTER_COUNT_ID)) map.removeLayer(CLUSTER_COUNT_ID)
        if (ownsSourceRef.current && safeHasSource(map, SOURCE_ID)) map.removeSource(SOURCE_ID)
        ownsSourceRef.current = false
      } catch {
        // map was already destroyed during navigation
      }
    }
  }, [map, geojson, syncMarkers])

  // Keep markers in step with clustering as the map moves
  useEffect(() => {
    if (!map) return
    map.on('render', syncMarkers)
    return () => {
      try {
        map.off('render', syncMarkers)
      } catch {
        // map already torn down
      }
    }
  }, [map, syncMarkers])

  // Push new business data into the source
  useEffect(() => {
    if (!map || !ownsSourceRef.current) return
    const source = (safeHasSource(map, SOURCE_ID) ? map.getSource(SOURCE_ID) : null) as
      | GeoJSONSource
      | null
    if (source) {
      source.setData(geojson as any)
      syncMarkers()
    }
  }, [map, geojson, syncMarkers])

  // Selection and offer badges - applied in place, no marker rebuild
  useEffect(() => {
    for (const [id, entry] of markersRef.current) {
      setVenueMarkerSelected(entry.el, selectedId === id)
      setVenueMarkerOffer(entry.el, activeOfferVenueIds?.has(id) ?? false)
    }
  }, [selectedId, activeOfferVenueIds])

  return null
}
