import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { MapContainer } from '@/components/map/MapContainer'
import { MapMarker } from '@/components/map/MapMarker'
import { toast } from 'sonner'

interface BusinessLocationEditorProps {
  latitude?: number | null
  longitude?: number | null
  onUpdate?: (coords: { lat: number; lng: number; address?: string }) => void
}

export function BusinessLocationEditor({ latitude, longitude, onUpdate }: BusinessLocationEditorProps) {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [address, setAddress] = useState('')
  useEffect(() => {
    if (latitude != null && longitude != null) {
      setCoords({ lat: Number(latitude), lng: Number(longitude) })
    }
  }, [latitude, longitude])

  const handleUpdate = () => {
    if (!coords) {
      toast.error('Set a location first')
      return
    }
    onUpdate?.({ lat: coords.lat, lng: coords.lng, address })
    toast.success('Location updated')
  }

  return (
    <Card className="bg-dark-card border-gray-800">
      <CardHeader>
        <CardTitle className="text-sm text-gray-200">Location</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input
          placeholder="Search address (placeholder)"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
        <div className="h-64 rounded-md overflow-hidden border border-gray-800">
          <MapContainer
            initialCenter={coords ? [coords.lng, coords.lat] : undefined}
            initialZoom={14}
            showControls={false}
            showUserLocation={false}
            onMapLoad={(map) => {
              if (coords) {
                map.setCenter([coords.lng, coords.lat])
              }
            }}
            onClick={(e) => {
              const { lng, lat } = e.lngLat
              setCoords({ lat, lng })
            }}
          >
            {(map) =>
              map &&
              coords && (
                <MapMarker
                  map={map}
                  position={[coords.lng, coords.lat]}
                  type="OTHER"
                  isSelected
                />
              )
            }
          </MapContainer>
        </div>
        <Button onClick={handleUpdate}>Update Location</Button>
      </CardContent>
    </Card>
  )
}

