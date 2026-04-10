import { useRef, useState } from 'react'
import { Upload, X, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

const MAX_IMAGES = 5
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

interface PortfolioUploadProps {
  images: string[]
  onChange: (images: string[]) => void
  disabled?: boolean
}

export function PortfolioUpload({
  images,
  onChange,
  disabled = false,
}: PortfolioUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [previewIndex, setPreviewIndex] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null)
    const files = e.target.files
    if (!files?.length) return

    if (images.length + files.length > MAX_IMAGES) {
      setError(`Maximum ${MAX_IMAGES} images allowed`)
      return
    }

    const newImages: string[] = []
    const fileArray = Array.from(files)

    fileArray.forEach((file) => {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setError('Only JPEG, PNG, WebP, and GIF images are allowed')
        return
      }
      if (file.size > MAX_FILE_SIZE) {
        setError('Each image must be under 5MB')
        return
      }
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        newImages.push(result)
        if (newImages.length === fileArray.length) {
          onChange([...images, ...newImages].slice(0, MAX_IMAGES))
        }
      }
      reader.readAsDataURL(file)
    })

    e.target.value = ''
  }

  const handleRemove = (index: number) => {
    onChange(images.filter((_, i) => i !== index))
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (disabled) return
    const files = e.dataTransfer.files
    if (files.length) {
      const input = document.createElement('input')
      input.type = 'file'
      input.multiple = true
      input.accept = ACCEPTED_TYPES.join(',')
      input.files = files
      input.onchange = (ev) => handleFileSelect(ev as unknown as React.ChangeEvent<HTMLInputElement>)
      input.click()
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  return (
    <div className="space-y-4">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => !disabled && images.length < MAX_IMAGES && inputRef.current?.click()}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer',
          'border-gray-700 hover:border-primary/50 hover:bg-dark-card/50',
          disabled && 'opacity-50 cursor-not-allowed',
          images.length >= MAX_IMAGES && 'cursor-default hover:border-gray-700'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(',')}
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        <Upload className="h-12 w-12 text-gray-500 mx-auto mb-3" />
        <p className="text-gray-400 mb-1">
          {images.length >= MAX_IMAGES
            ? `Maximum ${MAX_IMAGES} images uploaded`
            : 'Drag and drop or click to upload'}
        </p>
        <p className="text-sm text-gray-500">
          Up to {MAX_IMAGES} images, max 5MB each (JPEG, PNG, WebP, GIF)
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {images.map((img, index) => (
            <div
              key={index}
              className="relative aspect-square rounded-lg overflow-hidden border border-gray-700 group"
            >
              <img
                src={img}
                alt={`Portfolio ${index + 1}`}
                className="w-full h-full object-cover cursor-pointer"
                onClick={() => setPreviewIndex(index)}
              />
              {!disabled && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRemove(index)
                  }}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-red-500/90 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {previewIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setPreviewIndex(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <img
              src={images[previewIndex]}
              alt={`Portfolio preview ${previewIndex + 1}`}
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
            />
            <button
              type="button"
              onClick={() => setPreviewIndex(null)}
              className="absolute -top-10 right-0 p-2 rounded-full bg-gray-800 hover:bg-gray-700 text-white"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
