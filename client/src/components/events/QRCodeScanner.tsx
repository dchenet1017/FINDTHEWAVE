import { useEffect, useId, useRef } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'

type QRCodeScannerProps = {
  onScan: (decodedText: string) => void
  /** Increment to remount scanner after a successful scan */
  remountKey?: number
}

export function QRCodeScanner({ onScan, remountKey = 0 }: QRCodeScannerProps) {
  const reactId = useId()
  const containerId = `qr-reader-${reactId.replace(/:/g, '')}`
  const onScanRef = useRef(onScan)
  onScanRef.current = onScan

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      containerId,
      { fps: 10, qrbox: 250 },
      false
    )

    scanner.render(
      (decodedText) => {
        onScanRef.current(decodedText)
        scanner.clear().catch(() => {
          /* ignore */
        })
      },
      () => {
        /* frame errors — ignore */
      }
    )

    return () => {
      scanner.clear().catch(() => {
        /* ignore */
      })
    }
  }, [containerId, remountKey])

  return (
    <div className="rounded-lg border border-gray-800 bg-black/40 p-2 [&_.html5-qrcode-element]:text-white">
      <div id={containerId} />
    </div>
  )
}
