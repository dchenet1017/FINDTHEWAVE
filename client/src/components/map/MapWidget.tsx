import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Maximize2, MapPin } from 'lucide-react'
import { MapContainer } from '@/components/map/MapContainer'
import { BusinessMarkerLayer } from '@/components/map/BusinessMarkerLayer'
import { MiniPopup, type MarkerData } from '@/components/map/MiniPopup'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/utils'
import type { Business } from '../../../../shared/types/business'

type Size = 'small' | 'medium' | 'large'

const sizeToHeight: Record<Size, string> = {
  small: 'h-[200px]',
  medium: 'h-[300px]',
  large: 'h-[400px]',
}

interface MapWidgetProps {
  size?: Size
  center?: [number, number] // [lng, lat]
  zoom?: number
  markers?: MarkerData[] | Business[] | any
  showUserLocation?: boolean
  highlightId?: string
  onMarkerClick?: (marker: MarkerData | Business) => void
  onExpand?: () => void
  expandUrl?: string // URL to navigate on expand
  title?: string
  className?: string
  interactive?: boolean
}

export function MapWidget({
  size = 'medium',
  center,
  zoom = 12,
  markers = [],
  showUserLocation = false,
  highlightId,
  onMarkerClick,
  onExpand,
  expandUrl,
  title = 'Map Overview',
  className,
  interactive = true,
}: MapWidgetProps) {
  const navigate = useNavigate()
  const [loaded, setLoaded] = useState(false)
  const [selectedMarker, setSelectedMarker] = useState<MarkerData | null>(null)
  const [mapInstance, setMapInstance] = useState<any>(null)

  // Ensure markers is always an array (API may return object or undefined)
  const markersList = Array.isArray(markers) ? markers : []

  // Convert markers to Business format if needed
  const businesses = useMemo(() => {
    if (!markersList.length) return []

    return markersList.map((m: any) => {
      // If already a Business, return as is
      if (m.type && typeof m.type === 'string' && ['BAR', 'RESTAURANT', 'ENTERTAINMENT', 'FITNESS', 'WELLNESS', 'HOTEL', 'OTHER'].includes(m.type)) {
        return m as Business
      }
      
      // Convert MarkerData to Business format
      return {
        id: m.id,
        name: m.name,
        type: m.type || 'OTHER',
        latitude: m.latitude,
        longitude: m.longitude,
        isVerified: m.isVerified || false,
        rating: m.rating,
        description: m.description,
        location: {
          latitude: m.latitude,
          longitude: m.longitude,
          address: '',
          city: '',
          state: '',
          zipCode: '',
        },
      } as Business
    })
  }, [markersList])

  const validMarkers = useMemo(() => {
    return businesses.filter((b) => {
      const lat = (b as any).latitude ?? (b as any).location?.latitude
      const lng = (b as any).longitude ?? (b as any).location?.longitude
      return lat != null && lng != null && !Number.isNaN(Number(lat)) && !Number.isNaN(Number(lng))
    })
  }, [businesses])

  const handleExpand = () => {
    if (expandUrl) {
      navigate(expandUrl)
    } else {
      onExpand?.()
    }
  }

  const handleMarkerClick = (business: Business) => {
    // Convert Business to MarkerData for popup
    const lat = (business as any).latitude ?? (business as any).location?.latitude
    const lng = (business as any).longitude ?? (business as any).location?.longitude
    
    if (lat != null && lng != null) {
      const markerData: MarkerData = {
        id: business.id,
        name: business.name,
        type: business.type,
        latitude: Number(lat),
        longitude: Number(lng),
        rating: (business as any).rating,
        isVerified: business.isVerified,
      }
      setSelectedMarker(markerData)
    }
    
    onMarkerClick?.(business)
  }

  const handleViewDetails = (marker: MarkerData) => {
    const business = businesses.find((b) => b.id === marker.id)
    if (business) {
      onMarkerClick?.(business)
    }
    setSelectedMarker(null)
  }

  const markerCount = validMarkers.length
  const markerLabel = markerCount === 1 ? 'place' : 'places'

  return (
    <Card className={cn('bg-dark-card border-gray-800 relative', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          {title}
        </CardTitle>
        <div className="flex items-center gap-2">
          {markerCount > 0 && (
            <Badge variant="secondary" className="text-[11px]">
              {markerCount} {markerLabel} nearby
            </Badge>
          )}
          {(onExpand || expandUrl) && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleExpand}
              className="h-7 px-2 text-xs"
            >
              <Maximize2 className="h-3.5 w-3.5 mr-1" />
              View Full Map
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className={cn('relative overflow-hidden rounded-b-lg', sizeToHeight[size])}>
          {!loaded && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-dark-bg/70 backdrop-blur-sm">
              <Skeleton className="h-10 w-10 rounded-full" />
            </div>
          )}

          <MapContainer
            initialCenter={center}
            initialZoom={zoom}
            showControls={true} // Show zoom controls
            showUserLocation={showUserLocation}
            interactive={interactive}
            showStyleSwitcher={false} // Hide style switcher in widget
            onMapLoad={(map) => {
              setLoaded(true)
              setMapInstance(map)
            }}
            className="border-0 rounded-none"
          >
            {(map) => {
              if (!map) return null
              
              return (
                <>
                  <BusinessMarkerLayer
                    map={map}
                    businesses={validMarkers}
                    selectedId={highlightId}
                    onBusinessClick={handleMarkerClick}
                  />
                  {selectedMarker && (
                    <MiniPopup
                      map={map}
                      marker={selectedMarker}
                      onClose={() => setSelectedMarker(null)}
                      onViewDetails={handleViewDetails}
                    />
                  )}
                </>
              )
            }}
          </MapContainer>
        </div>
      </CardContent>
    </Card>
  )
}
