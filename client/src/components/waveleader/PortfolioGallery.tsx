import { useState } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PortfolioGalleryProps {
  images: string[]
  className?: string
}

export function PortfolioGallery({ images, className }: PortfolioGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  if (!images.length) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-lg border-2 border-dashed border-gray-700 bg-dark-card/50 p-8 text-gray-500',
          className
        )}
      >
        No portfolio images yet
      </div>
    )
  }

  const goPrev = () => {
    if (lightboxIndex === null) return
    setLightboxIndex(lightboxIndex <= 0 ? images.length - 1 : lightboxIndex - 1)
  }

  const goNext = () => {
    if (lightboxIndex === null) return
    setLightboxIndex(lightboxIndex >= images.length - 1 ? 0 : lightboxIndex + 1)
  }

  return (
    <>
      <div
        className={cn(
          'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4',
          className
        )}
      >
        {images.map((img, index) => (
          <button
            key={index}
            type="button"
            onClick={() => setLightboxIndex(index)}
            className="aspect-square rounded-lg overflow-hidden border border-gray-800 hover:border-primary/50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <img
              src={img}
              alt={`Portfolio ${index + 1}`}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>

      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            onClick={(e) => {
              e.stopPropagation()
              setLightboxIndex(null)
            }}
            className="absolute top-4 right-4 p-2 rounded-full bg-gray-800 hover:bg-gray-700 text-white z-10"
          >
            <X className="h-6 w-6" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              goPrev()
            }}
            className="absolute left-4 p-2 rounded-full bg-gray-800/80 hover:bg-gray-700 text-white z-10"
          >
            <ChevronLeft className="h-8 w-8" />
          </button>
          <img
            src={images[lightboxIndex]}
            alt={`Portfolio ${lightboxIndex + 1}`}
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={(e) => {
              e.stopPropagation()
              goNext()
            }}
            className="absolute right-4 p-2 rounded-full bg-gray-800/80 hover:bg-gray-700 text-white z-10"
          >
            <ChevronRight className="h-8 w-8" />
          </button>
        </div>
      )}
    </>
  )
}
