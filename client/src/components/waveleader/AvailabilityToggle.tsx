import { useState } from 'react'
import { Switch } from '@/components/ui/Switch'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AvailabilityToggleProps {
  isAvailable: boolean
  onChange: (available: boolean) => void
  isLoading?: boolean
}

export function AvailabilityToggle({ isAvailable, onChange, isLoading = false }: AvailabilityToggleProps) {
  const [showConfirm, setShowConfirm] = useState(false)

  const handleToggle = (checked: boolean) => {
    if (checked) {
      onChange(true)
    } else {
      setShowConfirm(true)
    }
  }

  const confirmUnavailable = () => {
    onChange(false)
    setShowConfirm(false)
  }

  const cancelUnavailable = () => {
    setShowConfirm(false)
  }

  return (
    <>
      <div
        className={cn(
          'flex items-center gap-3 p-4 rounded-lg border-2 transition-colors',
          isAvailable ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5'
        )}
      >
        {isLoading ? (
          <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
        ) : (
          <>
            {isAvailable ? (
              <CheckCircle className="h-8 w-8 text-green-500 shrink-0" />
            ) : (
              <XCircle className="h-8 w-8 text-red-500 shrink-0" />
            )}
          </>
        )}
        <div className="flex-1">
          <p className={cn('font-semibold', isAvailable ? 'text-green-500' : 'text-red-500')}>
            {isAvailable ? 'Available' : 'Unavailable'}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {isAvailable
              ? 'Clients can book you for sessions'
              : 'You will not appear in search results'}
          </p>
        </div>
        <Switch
          checked={isAvailable}
          onCheckedChange={handleToggle}
          disabled={isLoading}
          className="scale-110"
        />
      </div>

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Go Unavailable?</DialogTitle>
            <DialogDescription>
              You will not appear in search results and clients won&apos;t be able to book you until
              you turn availability back on.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={cancelUnavailable}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmUnavailable}>
              Yes, Go Unavailable
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
