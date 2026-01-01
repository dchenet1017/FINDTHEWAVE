import { useMemo, useState } from 'react'
import { Maximize2, MapPin } from 'lucide-react'
import { MapContainer } from '@/components/map/MapContainer'
import { MapMarker } from '@/components/map/MapMarker'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/utils'

type Marker = {
  id: string
  latitude?: number | null
  longitude?: number | null
  type?: string
  name?: string
  isVerified?: boolean
  distance?: number
  description?: string
}

type Size = 'small' | 'medium' | 'large'

const sizeToHeight: Record<Size, string> = {
  small: 'h-[200px]',
  medium: 'h-[300px]',
  large: 'h-[400px]',
}

interface MapWidgetProps {
  size?: Size
  showControls?: boolean
  interactive?: boolean
  markers?: Marker[] | any
  highlightId?: string
  center?: [number, number]
  zoom?: number
  onMarkerClick?: (marker: Marker) => void
  onExpand?: () => void
  className?: string
}

export function MapWidget({
  size = 'medium',
  showControls = false,
  interactive = true,
  markers,
  highlightId,
  center,
  zoom = 12,
  onMarkerClick,
  onExpand,
  className,
}: MapWidgetProps) {
  const [loaded, setLoaded] = useState(false)

  const markerList: Marker[] = useMemo(() => {
    if (Array.isArray(markers)) return markers
    if (markers && Array.isArray((markers as any).items)) return (markers as any).items
    if (markers && Array.isArray((markers as any).businesses)) return (markers as any).businesses
    return []
  }, [markers])

  const validMarkers = useMemo(() => {
    return markerList.filter((m) => m.latitude != null && m.longitude != null)
  }, [markerList])

  return (
    <Card className={cn('bg-dark-card border-gray-800 relative', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          Map Overview
        </CardTitle>
        <Badge variant="secondary" className="text-[11px]">
          {validMarkers.length} markers
        </Badge>
      </CardHeader>
      <CardContent className="p-0">
        <div className={cn('relative overflow-hidden rounded-b-lg', sizeToHeight[size])}>
          {!loaded && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-dark-bg/70 backdrop-blur-sm">
              <Skeleton className="h-10 w-10 rounded-full" />
            </div>
          )}

          <div className="absolute top-2 right-2 z-20 flex items-center gap-2">
            {onExpand && (
              <Button size="sm" variant="secondary" onClick={onExpand} className="h-8 px-2">
                <Maximize2 className="h-4 w-4" />
              </Button>
            )}
          </div>

          <MapContainer
            initialCenter={center}
            initialZoom={zoom}
            showControls={showControls}
            showUserLocation={false}
            interactive={interactive}
            onMapLoad={() => setLoaded(true)}
          >
            {(map) =>
              map && (
                <>
                  {validMarkers.map((m) => {
                    const lat = Number(m.latitude)
                    const lng = Number(m.longitude)
                    if (Number.isNaN(lat) || Number.isNaN(lng)) return null
                    return (
                      <MapMarker
                        key={m.id}
                        map={map}
                        position={[lng, lat]}
                        type={(m.type as any) || 'OTHER'}
                        isSelected={highlightId === m.id}
                        onClick={() => onMarkerClick?.(m)}
                      />
                    )
                  })}
                </>
              )
            }
          </MapContainer>
        </div>
      </CardContent>
    </Card>
  )
}

