import { useMemo } from 'react'
import { MapContainer } from '@/components/map/MapContainer'
import { AdCoverageZone } from '@/components/map/AdCoverageZone'
import { PulsingMarker } from '@/components/map/PulsingMarker'
import { CustomerHeatmap } from '@/components/map/CustomerHeatmap'
import type { HeatPoint } from '@/hooks/useBusinessMap'

export function AdCoverageMap({
  center,
  radiusMiles,
  heatPoints = [],
  showHeatmap = true,
  estimatedUsers,
  heightClassName = 'h-[220px]',
}: {
  center: [number, number] | null
  radiusMiles: number
  heatPoints?: HeatPoint[]
  showHeatmap?: boolean
  estimatedUsers?: number
  heightClassName?: string
}) {
  const points = useMemo(() => heatPoints || [], [heatPoints])

  return (
    <div className={`relative rounded-lg overflow-hidden border border-gray-800 ${heightClassName}`}>
      <MapContainer
        initialCenter={center || undefined}
        initialZoom={12}
        showControls={false}
        showUserLocation={false}
        interactive={false}
        showStyleSwitcher={false}
      >
        {(map) => (
          <>
            {center && <PulsingMarker map={map} position={center} color="#6C5CE7" size={14} />}
            {center && (
              <AdCoverageZone map={map} center={center} radiusMiles={radiusMiles} visible={true} />
            )}
            {showHeatmap && (
              <CustomerHeatmap
                map={map}
                visible={true}
                checkIns={points.map((p) => ({ ...p, count: p.count }))}
              />
            )}
          </>
        )}
      </MapContainer>

      {typeof estimatedUsers === 'number' && (
        <div className="absolute bottom-2 left-2 rounded-md bg-black/60 border border-gray-700 px-2 py-1 text-xs text-gray-100">
          Est. users in area: <span className="font-semibold">{estimatedUsers}</span>
        </div>
      )}
    </div>
  )
}

