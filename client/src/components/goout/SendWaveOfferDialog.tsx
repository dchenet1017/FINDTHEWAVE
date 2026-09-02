import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Textarea } from '@/components/ui/Textarea'
import { Slider } from '@/components/ui/Slider'
import { Switch } from '@/components/ui/Switch'
import { cn } from '@/lib/utils'
import { useSendOffer } from '@/hooks/useGoOut'
import { VIBE_OPTIONS, type Vibe } from '@/types/goOut'

interface SendWaveOfferDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Pre-selects the vibe when opened from a specific demand row */
  initialVibe?: Vibe | null
}

export function SendWaveOfferDialog({
  open,
  onOpenChange,
  initialVibe = null,
}: SendWaveOfferDialogProps) {
  const [message, setMessage] = useState('')
  const [perkDescription, setPerkDescription] = useState('')
  const [doorCode, setDoorCode] = useState('')
  const [radiusMiles, setRadiusMiles] = useState(5)
  const [vibes, setVibes] = useState<Vibe[]>(initialVibe ? [initialVibe] : [])
  const [broadcast, setBroadcast] = useState(false)
  const sendOffer = useSendOffer()

  const reset = () => {
    setMessage('')
    setPerkDescription('')
    setDoorCode('')
    setRadiusMiles(5)
    setVibes(initialVibe ? [initialVibe] : [])
    setBroadcast(false)
  }

  const close = () => {
    onOpenChange(false)
    reset()
  }

  const toggleVibe = (vibe: Vibe) => {
    setVibes((prev) =>
      prev.includes(vibe) ? prev.filter((v) => v !== vibe) : [...prev, vibe]
    )
  }

  const canSubmit = message.trim().length > 0 && perkDescription.trim().length > 0

  const submit = () => {
    if (!canSubmit) return
    sendOffer.mutate(
      {
        message: message.trim(),
        perkDescription: perkDescription.trim(),
        doorCode: doorCode.trim() || null,
        radiusMiles,
        vibes: vibes.length > 0 ? vibes : undefined,
        broadcast,
      },
      { onSuccess: close }
    )
  }

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? onOpenChange(true) : close())}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Send a Wave Offer</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="offer-message">Message</Label>
            <Textarea
              id="offer-message"
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Rooftop just opened up — come through, we saved you a spot."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="offer-perk">Perk</Label>
            <Input
              id="offer-perk"
              value={perkDescription}
              onChange={(e) => setPerkDescription(e.target.value)}
              placeholder="First round on us"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="offer-door-code">
              Door code <span className="text-gray-500">(optional)</span>
            </Label>
            <Input
              id="offer-door-code"
              value={doorCode}
              onChange={(e) => setDoorCode(e.target.value)}
              placeholder="WAVE22"
            />
            <p className="text-xs text-gray-500">
              Only shown to someone after they accept.
            </p>
          </div>

          {/* Broadcast toggle */}
          <label className="flex cursor-pointer items-center gap-4 rounded-xl border border-gray-700 bg-dark-bg p-4">
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium text-white">
                Broadcast to everyone
              </span>
              <span className="mt-0.5 block text-xs text-gray-500">
                Post one open offer the first person nearby can claim, instead of
                sending to each matching hand.
              </span>
            </span>
            <Switch
              checked={broadcast}
              onCheckedChange={setBroadcast}
              aria-label="Broadcast to everyone nearby"
            />
          </label>

          {/* Targeting - irrelevant once broadcasting */}
          <div
            className={cn(
              'space-y-5 transition-opacity',
              broadcast && 'pointer-events-none opacity-40'
            )}
            aria-hidden={broadcast}
          >
            <div>
              <div className="mb-3 flex items-baseline justify-between">
                <Label>Radius</Label>
                <span className="text-sm font-semibold text-primary">
                  {radiusMiles} {radiusMiles === 1 ? 'mile' : 'miles'}
                </span>
              </div>
              <Slider
                value={[radiusMiles]}
                min={1}
                max={25}
                step={1}
                aria-label="Offer radius in miles"
                onValueChange={([value]) => setRadiusMiles(value)}
              />
            </div>

            <div>
              <Label>
                Only these vibes <span className="text-gray-500">(optional)</span>
              </Label>
              <div className="mt-3 flex flex-wrap gap-2">
                {VIBE_OPTIONS.map(({ value, label, emoji }) => {
                  const selected = vibes.includes(value)
                  return (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => toggleVibe(value)}
                      className={cn(
                        'rounded-full border px-3 py-1.5 text-xs font-medium transition-all',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                        selected
                          ? 'border-primary bg-primary text-white'
                          : 'border-gray-700 bg-dark-bg text-gray-400 hover:border-gray-600 hover:text-white'
                      )}
                    >
                      <span className="mr-1" aria-hidden>
                        {emoji}
                      </span>
                      {label}
                    </button>
                  )
                })}
              </div>
              {vibes.length === 0 && (
                <p className="mt-2 text-xs text-gray-500">
                  Reaching everyone in range.
                </p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={close}>
            Cancel
          </Button>
          <Button
            loading={sendOffer.isPending}
            disabled={!canSubmit}
            onClick={submit}
          >
            Send offer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
