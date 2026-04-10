import { useEffect, useMemo } from 'react'
import type { Map as MapboxMap, Marker } from 'mapbox-gl'
import mapboxgl from 'mapbox-gl'

type Props = {
  map: MapboxMap | null
  position: [number, number] | null // [lng, lat]
  color: string
  size?: number
  onClick?: () => void
}

export function PulsingMarker({ map, position, color, size = 18, onClick }: Props) {
  const el = useMemo(() => {
    const root = document.createElement('button')
    root.type = 'button'
    root.style.width = `${size}px`
    root.style.height = `${size}px`
    root.style.borderRadius = '9999px'
    root.style.background = color
    root.style.border = '2px solid rgba(15,23,42,0.9)'
    root.style.boxShadow = '0 0 0 6px rgba(108,92,231,0.12)'
    root.style.position = 'relative'
    root.style.cursor = 'pointer'

    const ping = document.createElement('span')
    ping.style.position = 'absolute'
    ping.style.inset = '-10px'
    ping.style.borderRadius = '9999px'
    ping.style.background = color
    ping.style.opacity = '0.15'
    ping.style.animation = 'wf-ping 1.6s cubic-bezier(0, 0, 0.2, 1) infinite'
    root.appendChild(ping)

    const style = document.createElement('style')
    style.textContent = `
@keyframes wf-ping {
  0% { transform: scale(0.6); opacity: 0.25; }
  70% { transform: scale(1.6); opacity: 0; }
  100% { transform: scale(1.6); opacity: 0; }
}`
    root.appendChild(style)

    return root
  }, [color, size])

  useEffect(() => {
    if (!map || !position) return
    const marker: Marker = new mapboxgl.Marker({ element: el, anchor: 'center' })
      .setLngLat(position)
      .addTo(map)

    const click = (e: MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      onClick?.()
    }
    el.addEventListener('click', click)

    return () => {
      el.removeEventListener('click', click)
      marker.remove()
    }
  }, [map, position, el, onClick])

  useEffect(() => {
    if (!map || !position) return
    // marker instance is not retained; this component recreates when deps change.
  }, [map, position])

  return null
}

