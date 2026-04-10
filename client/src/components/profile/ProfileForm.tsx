import { useState } from 'react'
import { Save, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Label } from '@/components/ui/Label'
import { cn } from '@/lib/utils'

export interface ProfileFormData {
  firstName: string
  lastName: string
  phone: string
  bio: string
}

interface ProfileFormProps {
  initialData?: Partial<ProfileFormData>
  onSave: (data: ProfileFormData) => Promise<void>
  onCancel?: () => void
  isLoading?: boolean
}

export function ProfileForm({ initialData, onSave, onCancel, isLoading }: ProfileFormProps) {
  const [formData, setFormData] = useState<ProfileFormData>({
    firstName: initialData?.firstName || '',
    lastName: initialData?.lastName || '',
    phone: initialData?.phone || '',
    bio: initialData?.bio || '',
  })

  const [errors, setErrors] = useState<Partial<Record<keyof ProfileFormData, string>>>({})

  const handleChange = (field: keyof ProfileFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof ProfileFormData, string>> = {}

    if (formData.firstName.trim().length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters'
    }

    if (formData.lastName.trim().length < 2) {
      newErrors.lastName = 'Last name must be at least 2 characters'
    }

    if (formData.phone && !/^\+?[\d\s-()]+$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number'
    }

    if (formData.bio && formData.bio.length > 500) {
      newErrors.bio = 'Bio must be less than 500 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    await onSave(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName">First Name *</Label>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={(e) => handleChange('firstName', e.target.value)}
            error={errors.firstName}
            disabled={isLoading}
            required
          />
        </div>

        <div>
          <Label htmlFor="lastName">Last Name *</Label>
          <Input
            id="lastName"
            value={formData.lastName}
            onChange={(e) => handleChange('lastName', e.target.value)}
            error={errors.lastName}
            disabled={isLoading}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="phone">Phone Number</Label>
        <Input
          id="phone"
          type="tel"
          value={formData.phone}
          onChange={(e) => handleChange('phone', e.target.value)}
          error={errors.phone}
          disabled={isLoading}
          placeholder="+1 (555) 123-4567"
        />
      </div>

      <div>
        <Label htmlFor="bio">Bio / About</Label>
        <Textarea
          id="bio"
          value={formData.bio}
          onChange={(e) => handleChange('bio', e.target.value)}
          error={errors.bio}
          disabled={isLoading}
          placeholder="Tell us about yourself..."
          rows={4}
          maxLength={500}
        />
        <p className="text-xs text-gray-400 mt-1">
          {formData.bio.length}/500 characters
        </p>
      </div>

      <div className="flex items-center gap-2 pt-4">
        <Button type="submit" disabled={isLoading} className="flex items-center gap-2">
          <Save className="h-4 w-4" />
          Save Changes
        </Button>
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        )}
      </div>
    </form>
  )
}

