import { useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { Map as MapboxMap, Marker } from 'mapbox-gl'
import api from '@/lib/axios'
import { mapboxgl } from '@/lib/mapbox'
import { GO_OUT_POLL_MS } from '@/hooks/useGoOut'

export interface DemandHotspot {
  latitude: number
  longitude: number
  people: number
  topVibe: string | null
  intensity: 1 | 2 | 3
}

/**
 * Where people want to go out right now. Public and aggregate-only: the server
 * snaps hands to a ~500 m grid and drops any cell with fewer than three.
 */
export function useDemandHotspots(enabled = true) {
  return useQuery<DemandHotspot[]>({
    queryKey: ['go-out', 'hotspots'],
    queryFn: async () => {
      const { data } = await api.get<{ success: boolean; data?: { hotspots: DemandHotspot[] } }>(
        '/go-out/hotspots'
      )
      return data.data?.hotspots ?? []
    },
    enabled,
    refetchInterval: enabled ? GO_OUT_POLL_MS : false,
    staleTime: 10_000,
    // Decoration: a failed poll just leaves the last pulses in place
    retry: false,
  })
}

const vibeLabel = (vibe: string | null) => (vibe ? vibe.replace(/_/g, ' ').toLowerCase() : 'a night out')

function buildElement(spot: DemandHotspot): HTMLDivElement {
  const el = document.createElement('div')
  el.innerHTML =
    '<span class="wf-hotspot__glow"></span>' +
    '<span class="wf-hotspot__wave"></span>' +
    '<span class="wf-hotspot__wave wf-hotspot__wave--late"></span>' +
    '<span class="wf-hotspot__label"></span>'
  updateElement(el, spot)
  return el
}

function updateElement(el: HTMLElement, spot: DemandHotspot) {
  // classList, not className: Mapbox adds its own positioning classes here
  el.classList.add('wf-hotspot')
  for (const level of [1, 2, 3]) el.classList.toggle(`wf-hotspot--${level}`, spot.intensity === level)
  const text = `${spot.people} going out`
  const label = el.querySelector('.wf-hotspot__label')
  if (label && label.textContent !== text) label.textContent = text
  el.title = `${spot.people} people nearby want to go out — mostly ${vibeLabel(spot.topVibe)}`
  el.setAttribute('aria-label', el.title)
}

/**
 * Warm pulses where demand is building, sized and paced by intensity. Kept as
 * DOM markers updated in place so a poll doesn't restart every animation.
 */
export function DemandHotspotLayer({ map, visible = true }: { map: MapboxMap; visible?: boolean }) {
  const { data: hotspots = [] } = useDemandHotspots(visible)
  const markers = useRef(new Map<string, Marker>())

  useEffect(() => {
    const live = markers.current
    const wanted = new Map(
      (visible ? hotspots : []).map((s) => [`${s.latitude},${s.longitude}`, s])
    )

    for (const [key, marker] of live) {
      if (!wanted.has(key)) {
        marker.remove()
        live.delete(key)
      }
    }

    for (const [key, spot] of wanted) {
      const existing = live.get(key)
      if (existing) {
        updateElement(existing.getElement(), spot)
      } else {
        const marker = new mapboxgl.Marker({ element: buildElement(spot), anchor: 'center' })
          .setLngLat([spot.longitude, spot.latitude])
          .addTo(map)
        live.set(key, marker)
      }
    }
  }, [map, hotspots, visible])

  // Clean up every pulse when the layer unmounts
  useEffect(() => {
    const live = markers.current
    return () => {
      for (const marker of live.values()) marker.remove()
      live.clear()
    }
  }, [])

  return null
}
