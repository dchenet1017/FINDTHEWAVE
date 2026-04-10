import { useState, useRef, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { MapContainer } from '@/components/map/MapContainer'
import { MapMarker } from '@/components/map/MapMarker'
import { geocodeAddress, reverseGeocode } from '@/lib/mapbox'
import { MapPin, Loader2 } from 'lucide-react'
import type { Map as MapboxMap } from 'mapbox-gl'

interface LocationEditModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentCenter: [number, number]
  currentAddress?: string
  onSave: (center: [number, number], address: string) => void
}

export function LocationEditModal({
  open,
  onOpenChange,
  currentCenter,
  currentAddress,
  onSave,
}: LocationEditModalProps) {
  const [center, setCenter] = useState<[number, number]>(currentCenter)
  const [address, setAddress] = useState(currentAddress || '')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<
    Array<{ id: string; place_name: string; center: [number, number] }>
  >([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const mapRef = useRef<MapboxMap | null>(null)

  useEffect(() => {
    if (open) {
      setCenter(currentCenter)
      setAddress(currentAddress || '')
    }
  }, [open, currentCenter, currentAddress])

  useEffect(() => {
    if (searchQuery.length < 3) {
      setSearchResults([])
      return
    }
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true)
      try {
        const results = await geocodeAddress(searchQuery)
        setSearchResults(results)
        setShowResults(true)
      } catch {
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }, 300)
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    }
  }, [searchQuery])

  const handleSelectResult = (result: {
    place_name: string
    center: [number, number]
  }) => {
    setCenter(result.center)
    setAddress(result.place_name)
    setSearchQuery(result.place_name)
    setShowResults(false)
    mapRef.current?.flyTo({ center: result.center, zoom: 14 })
  }

  const handleMapClick = async (e: { lngLat: { lng: number; lat: number } }) => {
    const [lng, lat] = [e.lngLat.lng, e.lngLat.lat]
    setCenter([lng, lat])
    const addr = await reverseGeocode(lng, lat)
    setAddress(addr)
  }

  const handleSave = () => {
    setIsSaving(true)
    onSave(center, address)
    setIsSaving(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Location</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search for your address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchResults.length > 0 && setShowResults(true)}
              onBlur={() => setTimeout(() => setShowResults(false), 200)}
              className="pl-10 pr-10"
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 animate-spin" />
            )}
            {showResults && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 rounded-lg border border-gray-700 bg-dark-card shadow-xl z-10 max-h-48 overflow-auto">
                {searchResults.map((result) => (
                  <button
                    key={result.id}
                    type="button"
                    onClick={() => handleSelectResult(result)}
                    className="w-full px-4 py-3 text-left text-sm text-white hover:bg-gray-800 transition-colors"
                  >
                    {result.place_name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {address && (
            <p className="text-sm text-gray-400">
              Current: {address}
            </p>
          )}

          <div className="h-[300px] rounded-lg overflow-hidden border border-gray-800">
            <MapContainer
              initialCenter={center}
              initialZoom={14}
              showControls={false}
              showUserLocation={false}
              showStyleSwitcher={false}
              onMapLoad={(map) => {
                mapRef.current = map
              }}
              onClick={(e) => handleMapClick(e)}
            >
              {(map) =>
                map && center && (
                  <MapMarker
                    map={map}
                    position={center}
                    type="WAVELEADER"
                    isSelected
                  />
                )
              }
            </MapContainer>
          </div>
          <p className="text-xs text-gray-500">
            Click on the map or search for an address to set your location
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Location'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
