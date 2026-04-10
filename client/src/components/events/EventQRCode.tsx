import { QRCodeSVG } from 'qrcode.react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

interface EventQRCodeProps {
  attendeeId: string
  eventTitle: string
  /** Full payload string (JSON) encoded in the QR */
  value?: string
  className?: string
}

export function EventQRCode({ attendeeId, eventTitle, value, className }: EventQRCodeProps) {
  const qrValue = value ?? attendeeId

  return (
    <div className={cn('space-y-4 text-center', className)}>
      <div
        className={cn(
          'inline-block rounded-xl bg-white p-4 shadow-lg shadow-primary/20',
          'ring-2 ring-primary/70 ring-offset-4 ring-offset-dark-bg',
          'animate-[wf-qr-pulse_2.5s_ease-in-out_infinite]'
        )}
        aria-label={`Check-in QR for ${eventTitle}`}
      >
        <QRCodeSVG value={qrValue} size={200} level="H" includeMargin />
      </div>
      <p className="text-sm text-gray-400">
        Show this QR code at the event for check-in. Keep it private until you arrive.
      </p>
      <Button
        type="button"
        variant="outline"
        className="border-gray-600"
        disabled
        title="Coming soon"
      >
        Save to Wallet
      </Button>
      <style>{`
        @keyframes wf-qr-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.4); }
          50% { box-shadow: 0 0 0 12px rgba(99, 102, 241, 0); }
        }
      `}</style>
    </div>
  )
}
