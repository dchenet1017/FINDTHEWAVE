import { useState, useRef } from 'react'
import { Camera, Loader2, X } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

interface AvatarUploadProps {
  currentAvatar?: string
  onUpload: (file: File) => Promise<void>
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

export function AvatarUpload({ currentAvatar, onUpload, size = 'lg', className }: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      alert('Please select a valid image file (JPEG, PNG, or WebP)')
      return
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      alert('File size must be less than 5MB')
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Upload file
    setIsUploading(true)
    try {
      await onUpload(file)
      setPreview(null)
    } catch (error) {
      console.error('Upload error:', error)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleRemove = () => {
    setPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const avatarSize = {
    sm: 'h-16 w-16',
    md: 'h-24 w-24',
    lg: 'h-32 w-32',
  }[size]

  const displayAvatar = preview || currentAvatar

  return (
    <div className={cn('relative inline-block', className)}>
      <div className="relative group">
        <Avatar
          src={displayAvatar || undefined}
          fallback={currentAvatar ? undefined : 'U'}
          size={size}
          className={cn(avatarSize, 'border-4 border-dark-card')}
        />
        <button
          onClick={handleClick}
          disabled={isUploading}
          className={cn(
            'absolute inset-0 flex items-center justify-center',
            'bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity',
            'rounded-full cursor-pointer',
            isUploading && 'opacity-100 cursor-not-allowed'
          )}
        >
          {isUploading ? (
            <Loader2 className="h-6 w-6 text-white animate-spin" />
          ) : (
            <Camera className="h-6 w-6 text-white" />
          )}
        </button>
      </div>

      {preview && (
        <button
          onClick={handleRemove}
          className="absolute -top-2 -right-2 rounded-full bg-danger p-1 text-white hover:bg-danger/90 transition-colors"
          aria-label="Remove preview"
        >
          <X className="h-4 w-4" />
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_TYPES.join(',')}
        onChange={handleFileSelect}
        className="hidden"
      />

      <div className="mt-2 text-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClick}
          disabled={isUploading}
          className="text-xs"
        >
          {currentAvatar ? 'Change' : 'Upload'} Avatar
        </Button>
        <p className="text-xs text-gray-400 mt-1">Max 5MB, JPEG/PNG/WebP</p>
      </div>
    </div>
  )
}

