import { useEffect, useRef } from 'react'
import type { Map as MapboxMap, GeoJSONSource, MapLayerMouseEvent } from 'mapbox-gl'
import type { Event } from '@/types/event'
import { categoryColor, isEventStartingToday } from './eventMapConfig'

const SOURCE_ID = 'wf-events-source'
const CLUSTER_LAYER = 'wf-events-clusters'
const COUNT_LAYER = 'wf-events-cluster-count'
const POINT_LAYER = 'wf-events-unclustered'

function buildGeoJSON(events: Event[]) {
  return {
    type: 'FeatureCollection' as const,
    features: events.map((e) => ({
      type: 'Feature' as const,
      properties: {
        eventId: e.id,
        category: e.category,
        pulse: isEventStartingToday(e.startDate) ? 1 : 0,
      },
      geometry: {
        type: 'Point' as const,
        coordinates: [e.longitude, e.latitude] as [number, number],
      },
    })),
  }
}

function matchColorExpression(): object {
  const cats = [
    'MUSIC',
    'SPORTS',
    'FOOD_DRINK',
    'WELLNESS',
    'NETWORKING',
    'EDUCATION',
    'ART',
    'NIGHTLIFE',
    'COMMUNITY',
    'OTHER',
  ] as const
  const flat: unknown[] = ['match', ['get', 'category']]
  for (const c of cats) {
    flat.push(c, categoryColor(c))
  }
  flat.push(categoryColor('OTHER'))
  return flat as object
}

interface EventMapMarkersProps {
  map: MapboxMap
  events: Event[]
  onEventClick: (event: Event) => void
}

/**
 * Clustered map layers with category colors; larger stroke when the event starts today.
 */
export function EventMapMarkers({ map, events, onEventClick }: EventMapMarkersProps) {
  const eventsRef = useRef(events)
  const onClickRef = useRef(onEventClick)
  eventsRef.current = events
  onClickRef.current = onEventClick

  useEffect(() => {
    if (!map) return

    const geo = buildGeoJSON(eventsRef.current)

    if (!map.getSource(SOURCE_ID)) {
      map.addSource(SOURCE_ID, {
        type: 'geojson',
        data: geo,
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 52,
      })

      map.addLayer({
        id: CLUSTER_LAYER,
        type: 'circle',
        source: SOURCE_ID,
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': 'rgba(99, 102, 241, 0.55)',
          'circle-stroke-width': 2,
          'circle-stroke-color': '#a5b4fc',
          'circle-radius': ['step', ['get', 'point_count'], 18, 10, 22, 25, 28],
        },
      })

      map.addLayer({
        id: COUNT_LAYER,
        type: 'symbol',
        source: SOURCE_ID,
        filter: ['has', 'point_count'],
        layout: {
          'text-field': ['get', 'point_count_abbreviated'],
          'text-size': 12,
        },
        paint: {
          'text-color': '#ffffff',
        },
      })

      map.addLayer({
        id: POINT_LAYER,
        type: 'circle',
        source: SOURCE_ID,
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': matchColorExpression(),
          'circle-radius': ['case', ['==', ['get', 'pulse'], 1], 11, 8],
          'circle-stroke-width': ['case', ['==', ['get', 'pulse'], 1], 3, 1.5],
          'circle-stroke-color': '#ffffff',
          'circle-opacity': 0.92,
        },
      })
    } else {
      ;(map.getSource(SOURCE_ID) as GeoJSONSource).setData(geo)
    }

    const onClusterClick = (e: MapLayerMouseEvent) => {
      const features = map.queryRenderedFeatures(e.point, { layers: [CLUSTER_LAYER] })
      const f = features[0]
      if (!f?.properties?.cluster_id) return
      const src = map.getSource(SOURCE_ID) as GeoJSONSource
      const clusterId = Number(f.properties.cluster_id)
      src.getClusterExpansionZoom(clusterId, (err, zoom) => {
        if (err) return
        const coords = (f.geometry as GeoJSON.Point).coordinates as [number, number]
        map.easeTo({ center: coords, zoom: Math.min(zoom + 0.5, 18) })
      })
    }

    const onPointClick = (e: MapLayerMouseEvent) => {
      const features = map.queryRenderedFeatures(e.point, { layers: [POINT_LAYER] })
      const id = features[0]?.properties?.eventId as string | undefined
      if (!id) return
      const ev = eventsRef.current.find((x) => x.id === id)
      if (ev) onClickRef.current(ev)
    }

    const cursorPointer = () => {
      map.getCanvas().style.cursor = 'pointer'
    }
    const cursorDefault = () => {
      map.getCanvas().style.cursor = ''
    }

    map.on('click', CLUSTER_LAYER, onClusterClick)
    map.on('click', POINT_LAYER, onPointClick)
    map.on('mouseenter', CLUSTER_LAYER, cursorPointer)
    map.on('mouseleave', CLUSTER_LAYER, cursorDefault)
    map.on('mouseenter', POINT_LAYER, cursorPointer)
    map.on('mouseleave', POINT_LAYER, cursorDefault)

    return () => {
      try {
        map.off('click', CLUSTER_LAYER, onClusterClick)
        map.off('click', POINT_LAYER, onPointClick)
        map.off('mouseenter', CLUSTER_LAYER, cursorPointer)
        map.off('mouseleave', CLUSTER_LAYER, cursorDefault)
        map.off('mouseenter', POINT_LAYER, cursorPointer)
        map.off('mouseleave', POINT_LAYER, cursorDefault)
        if (map.getLayer(COUNT_LAYER)) map.removeLayer(COUNT_LAYER)
        if (map.getLayer(POINT_LAYER)) map.removeLayer(POINT_LAYER)
        if (map.getLayer(CLUSTER_LAYER)) map.removeLayer(CLUSTER_LAYER)
        if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID)
      } catch {
        // map was already destroyed during navigation
      }
    }
  }, [map])

  useEffect(() => {
    if (!map?.getSource(SOURCE_ID)) return
    ;(map.getSource(SOURCE_ID) as GeoJSONSource).setData(buildGeoJSON(events))
    eventsRef.current = events
  }, [map, events])

  return null
}
