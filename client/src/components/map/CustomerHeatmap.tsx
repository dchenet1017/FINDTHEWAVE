import { HeatmapLayer } from '@/components/map/HeatmapLayer'
import type { Map as MapboxMap } from 'mapbox-gl'

interface CustomerHeatmapProps {
  map: MapboxMap | null
  checkIns: Array<{ latitude: number; longitude: number; count: number }>
  visible: boolean
}

export function CustomerHeatmap({ map, checkIns, visible }: CustomerHeatmapProps) {
  const points = (checkIns || [])
    .filter((c) => c.latitude != null && c.longitude != null)
    .map((c) => ({
      lat: Number(c.latitude),
      lng: Number(c.longitude),
      weight: Math.max(1, Number(c.count) || 1),
    }))

  return (
    <HeatmapLayer
      map={map}
      id="checkins-heat"
      points={points}
      visible={visible}
      colorRamp={[
        [0, 'rgba(33,102,172,0)'],
        [0.2, 'rgb(103,169,207)'],
        [0.4, 'rgb(209,229,240)'],
        [0.6, 'rgb(253,219,199)'],
        [0.8, 'rgb(239,138,98)'],
        [1, 'rgb(178,24,43)'],
      ]}
    />
  )
}

