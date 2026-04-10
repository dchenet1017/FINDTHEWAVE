import { useState, useCallback } from 'react'
import { Search, MapPin, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { cn } from '@/lib/utils'

interface WaveLeaderSearchBarProps {
  searchTerm: string
  locationQuery: string
  onSearchChange: (value: string) => void
  onLocationChange: (value: string) => void
  onUseMyLocation: () => void
  onSearch: () => void
  isLoading?: boolean
  className?: string
}

export function WaveLeaderSearchBar({
  searchTerm,
  locationQuery,
  onSearchChange,
  onLocationChange,
  onUseMyLocation,
  onSearch,
  isLoading = false,
  className,
}: WaveLeaderSearchBarProps) {
  const [locLoading, setLocLoading] = useState(false)

  const handleUseMyLocation = useCallback(async () => {
    setLocLoading(true)
    try {
      await onUseMyLocation()
    } finally {
      setLocLoading(false)
    }
  }, [onUseMyLocation])

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            type="search"
            placeholder="Search by specialty or name..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSearch()}
            className="pl-9 bg-dark-bg border-gray-700"
            disabled={isLoading}
          />
        </div>
        <div className="relative flex-1 flex gap-2">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 z-10" />
          <Input
            type="text"
            placeholder="City or use my location"
            value={locationQuery}
            onChange={(e) => onLocationChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSearch()}
            className="pl-9 bg-dark-bg border-gray-700 flex-1"
            disabled={isLoading}
          />
          <Button
            type="button"
            variant="secondary"
            size="icon"
            onClick={handleUseMyLocation}
            disabled={locLoading || !navigator.geolocation}
            title="Use my location"
          >
            {locLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MapPin className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
      <Button
        onClick={onSearch}
        disabled={isLoading}
        className="w-full sm:w-auto min-w-[120px]"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Searching...
          </>
        ) : (
          <>
            <Search className="h-4 w-4 mr-2" />
            Search
          </>
        )}
      </Button>
    </div>
  )
}
