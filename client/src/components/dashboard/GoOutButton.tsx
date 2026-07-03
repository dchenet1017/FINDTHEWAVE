import { Radio } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { DropdownMenu, DropdownMenuItem } from '@/components/ui/DropdownMenu'
import { useActivateGoOut, useDeactivateGoOut, useGoOutStatus } from '@/hooks/useGoOut'
import { getCurrentPosition } from '@/lib/mapbox'

const DURATION_OPTIONS = [
  { label: '30 minutes', minutes: 30 },
  { label: '1 hour', minutes: 60 },
  { label: '2 hours', minutes: 120 },
  { label: '4 hours', minutes: 240 },
]

export function GoOutButton() {
  const { data: status } = useGoOutStatus()
  const activateMut = useActivateGoOut()
  const deactivateMut = useDeactivateGoOut()

  const isActive = status?.isActive ?? false

  const activate = async (minutes: number) => {
    try {
      const pos = await getCurrentPosition()
      activateMut.mutate({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        durationMinutes: minutes,
      })
    } catch {
      activateMut.mutate({ latitude: 0, longitude: 0, durationMinutes: minutes })
    }
  }

  if (isActive) {
    return (
      <Button
        variant="secondary"
        className="border border-success/40 bg-success/10 text-success hover:bg-success/20"
        loading={deactivateMut.isPending}
        onClick={() => deactivateMut.mutate()}
      >
        <Radio className="h-4 w-4 mr-2 animate-pulse" />
        Going Out — Tap to stop
      </Button>
    )
  }

  return (
    <DropdownMenu
      trigger={
        <Button variant="secondary" loading={activateMut.isPending}>
          <Radio className="h-4 w-4 mr-2" />
          Go Out
        </Button>
      }
    >
      {DURATION_OPTIONS.map((opt) => (
        <DropdownMenuItem key={opt.minutes} onClick={() => activate(opt.minutes)}>
          {opt.label}
        </DropdownMenuItem>
      ))}
    </DropdownMenu>
  )
}
