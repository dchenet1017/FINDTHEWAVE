import { useEffect, useRef } from 'react'
import mapboxgl, { Map as MapboxMap } from 'mapbox-gl'
import type { CheckInLocation } from '@/services/user.service'

const typeColors: Record<string, string> = {
  BAR: '#FF5E7D',
  RESTAURANT: '#01D1A2',
  ENTERTAINMENT: '#9C6BFF',
  FITNESS: '#0396FF',
  WELLNESS: '#FF9F43',
  HOTEL: '#74B9FF',
  OTHER: '#6C5CE7',
}

function createStampMarker(
  location: CheckInLocation,
  onClick: () => void
): mapboxgl.Marker {
  const color = typeColors[location.businessType] || typeColors.OTHER
  const el = document.createElement('div')
  el.className = 'stamp-marker'
  el.style.width = '32px'
  el.style.height = '32px'
  el.style.borderRadius = '50%'
  el.style.backgroundColor = color
  el.style.border = '3px solid white'
  el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)'
  el.style.cursor = 'pointer'
  el.style.display = 'flex'
  el.style.alignItems = 'center'
  el.style.justifyContent = 'center'
  el.style.fontSize = '16px'
  el.title = location.businessName

  el.addEventListener('click', onClick)

  return new mapboxgl.Marker(el).setLngLat([location.longitude, location.latitude])
}

interface CheckInMapMarkersProps {
  map: MapboxMap | null
  locations: CheckInLocation[]
  onLocationSelect: (loc: CheckInLocation) => void
}

export function CheckInMapMarkers({ map, locations, onLocationSelect }: CheckInMapMarkersProps) {
  const markersRef = useRef<mapboxgl.Marker[]>([])
  const pathSourceId = 'checkin-path'
  const pathLayerId = 'checkin-path-layer'

  useEffect(() => {
    if (!map) return

    // Cleanup previous markers
    markersRef.current.forEach((marker) => marker.remove())
    markersRef.current = []

    // Add new markers
    locations.forEach((loc) => {
      const marker = createStampMarker(loc, () => onLocationSelect(loc))
      marker.addTo(map)
      markersRef.current.push(marker)
    })

    // Draw path connecting stamps chronologically
    if (locations.length >= 2) {
      const sorted = [...locations].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )
      const coordinates = sorted.map((loc) => [loc.longitude, loc.latitude] as [number, number])

      const addPath = () => {
        try {
          if (map.getSource(pathSourceId)) {
            const source = map.getSource(pathSourceId) as mapboxgl.GeoJSONSource
            source.setData({
              type: 'Feature',
              geometry: {
                type: 'LineString',
                coordinates,
              },
            } as any)
          } else {
            map.addSource(pathSourceId, {
              type: 'geojson',
              data: {
                type: 'Feature',
                geometry: {
                  type: 'LineString',
                  coordinates,
                },
              } as any,
            })

            if (!map.getLayer(pathLayerId)) {
              map.addLayer({
                id: pathLayerId,
                type: 'line',
                source: pathSourceId,
                layout: {
                  'line-join': 'round',
                  'line-cap': 'round',
                },
                paint: {
                  'line-color': '#6C5CE7',
                  'line-width': 2,
                  'line-opacity': 0.6,
                },
              })
            }
          }
        } catch (error) {
          // Source/layer might not be ready yet
          console.error('Error adding path:', error)
        }
      }

      if (map.isStyleLoaded()) {
        addPath()
      } else {
        map.once('load', addPath)
      }
    }

    return () => {
      // Cleanup markers
      markersRef.current.forEach((marker) => marker.remove())
      markersRef.current = []

      // Cleanup path
      try {
        if (map.getLayer(pathLayerId)) {
          map.removeLayer(pathLayerId)
        }
        if (map.getSource(pathSourceId)) {
          map.removeSource(pathSourceId)
        }
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  }, [map, locations, onLocationSelect])

  return null
}

