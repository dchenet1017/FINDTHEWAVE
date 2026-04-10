import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { MapContainer } from '@/components/map/MapContainer'
import { MapMarker } from '@/components/map/MapMarker'
import { geocodeAddress, reverseGeocode } from '@/lib/mapbox'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  initial: { lat: number; lng: number; address?: string | null } | null
  onSave: (payload: { latitude: number; longitude: number; address: string }) => Promise<void> | void
}

export function BusinessLocationEditor({ open, onOpenChange, initial, onSave }: Props) {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [address, setAddress] = useState('')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Array<{ id: string; place_name: string; center: [number, number] }>>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open && initial) {
      setCoords({ lat: initial.lat, lng: initial.lng })
      setAddress(initial.address || '')
      setQuery('')
      setResults([])
    }
  }, [open, initial])

  const center = useMemo(() => {
    if (!coords) return undefined
    return [coords.lng, coords.lat] as [number, number]
  }, [coords])

  const runSearch = async () => {
    if (!query.trim()) return
    const res = await geocodeAddress(query.trim())
    setResults(res.map((r) => ({ id: r.id, place_name: r.place_name, center: r.center })))
  }

  const choose = async (center: [number, number], place?: string) => {
    setCoords({ lng: center[0], lat: center[1] })
    if (place) setAddress(place)
    else setAddress(await reverseGeocode(center[0], center[1]))
    setResults([])
  }

  const save = async () => {
    if (!coords) {
      toast.error('Pick a location on the map')
      return
    }
    if (!address.trim()) {
      toast.error('Enter an address (or select from search)')
      return
    }
    setSaving(true)
    try {
      await onSave({ latitude: coords.lat, longitude: coords.lng, address: address.trim() })
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit business location</DialogTitle>
          <DialogDescription>
            This will update your business location.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="Search address…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="bg-dark-bg border-gray-700"
            />
            <Button variant="secondary" onClick={runSearch} disabled={!query.trim()}>
              Search
            </Button>
          </div>

          {results.length > 0 && (
            <div className="rounded-lg border border-gray-800 bg-dark-bg max-h-44 overflow-auto">
              {results.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className="w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-gray-800/60"
                  onClick={() => choose(r.center, r.place_name)}
                >
                  {r.place_name}
                </button>
              ))}
            </div>
          )}

          <Input
            label="Address"
            placeholder="Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="bg-dark-bg border-gray-700"
          />

          <div className="grid grid-cols-2 gap-3 text-xs text-gray-400">
            <div className="rounded-lg border border-gray-800 bg-dark-bg p-3">
              <p className="text-gray-500">Latitude</p>
              <p className="text-white font-semibold">{coords ? coords.lat.toFixed(6) : '—'}</p>
            </div>
            <div className="rounded-lg border border-gray-800 bg-dark-bg p-3">
              <p className="text-gray-500">Longitude</p>
              <p className="text-white font-semibold">{coords ? coords.lng.toFixed(6) : '—'}</p>
            </div>
          </div>

          <div className="h-[360px] rounded-lg overflow-hidden border border-gray-800">
            <MapContainer
              initialCenter={center}
              initialZoom={14}
              showControls
              showUserLocation={false}
              onClick={(e) => {
                const { lng, lat } = e.lngLat
                setCoords({ lat, lng })
                reverseGeocode(lng, lat).then((a) => a && setAddress(a))
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
        </div>

        <DialogFooter className="gap-2">
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving}>
            Save Location
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

