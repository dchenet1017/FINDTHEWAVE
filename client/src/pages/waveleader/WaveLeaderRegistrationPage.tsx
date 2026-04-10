import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useWaveLeaderRegistration } from '@/hooks/useWaveLeaderRegistration'
import { useCommunities } from '@/hooks/useCommunities'
import { useAuthStore } from '@/store/authStore'
import { RegistrationSteps } from '@/components/waveleader/RegistrationSteps'
import { ServiceAreaSelector } from '@/components/waveleader/ServiceAreaSelector'
import { PortfolioUpload } from '@/components/waveleader/PortfolioUpload'
import { AvatarUpload } from '@/components/profile/AvatarUpload'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Textarea } from '@/components/ui/Textarea'
import { Checkbox } from '@/components/ui/Checkbox'
import { Card, CardContent } from '@/components/ui/Card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react'

const SERVICES = [
  'Consulting',
  'Workshops',
  'One-on-One Sessions',
  'Events',
  'Other',
]

const DURATIONS = [
  { value: 30, label: '30 min' },
  { value: 60, label: '1 hr' },
  { value: 120, label: '2 hr' },
]

const SPECIALTY_CATEGORIES = [
  'DJ & Music',
  'Yoga & Wellness',
  'Culinary',
  'Fitness',
  'City Tours',
  'Photography',
  'Art & Culture',
  'Tech',
  'Other',
]

export default function WaveLeaderRegistrationPage() {
  const { isAuthenticated } = useAuthStore()
  const {
    step,
    formData,
    nextStep,
    prevStep,
    goToStep,
    updateFormData,
    submit,
    isSubmitting,
  } = useWaveLeaderRegistration()
  const { data: communities = [] } = useCommunities()

  const [termsAccepted, setTermsAccepted] = useState(false)

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        state={{ from: '/waveleader/register', message: 'Please sign in to apply as a WaveLeader' }}
      />
    )
  }

  const validateStep = (): boolean => {
    if (step === 1) {
      if (!formData.displayName?.trim()) return false
      if (!formData.specialty?.trim()) return false
      return true
    }
    if (step === 2) {
      if (!formData.hourlyRate || formData.hourlyRate <= 0) return false
      return true
    }
    if (step === 3) {
      if (!formData.location) return false
      return true
    }
    if (step === 6) {
      return termsAccepted
    }
    return true
  }

  const handleNext = () => {
    if (validateStep()) {
      nextStep()
    }
  }

  const handleSubmit = () => {
    if (!termsAccepted) return
    submit(formData)
  }

  return (
    <div className="min-h-screen bg-dark-bg py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <Link
          to="/become-waveleader"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        <h1 className="text-3xl font-bold text-white mb-2">
          WaveLeader Application
        </h1>
        <p className="text-gray-400 mb-8">
          Step {step} of 6
        </p>

        <RegistrationSteps currentStep={step} onStepClick={goToStep} />

        <Card className="mt-8">
          <CardContent className="pt-6">
            {/* Step 1: Basic Information */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <Label>Display Name</Label>
                  <Input
                    placeholder="How clients will see you"
                    value={formData.displayName}
                    onChange={(e) => updateFormData({ displayName: e.target.value })}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Specialty / Title</Label>
                  <Input
                    placeholder="e.g. DJ & Music Curator, Yoga Instructor"
                    value={formData.specialty}
                    onChange={(e) => updateFormData({ specialty: e.target.value })}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Phone Number</Label>
                  <Input
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={formData.phone}
                    onChange={(e) => updateFormData({ phone: e.target.value })}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Bio / Description</Label>
                  <Textarea
                    placeholder="Tell clients about yourself (max 500 characters)"
                    value={formData.description}
                    onChange={(e) =>
                      updateFormData({ description: e.target.value.slice(0, 500) })
                    }
                    rows={4}
                    maxLength={500}
                    className="mt-2"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.description.length}/500
                  </p>
                </div>
                <div>
                  <Label>Profile Photo</Label>
                  <AvatarUpload
                    currentAvatar={formData.profilePhoto}
                    onUpload={(file) =>
                      new Promise<void>((resolve) => {
                        const reader = new FileReader()
                        reader.onload = () => {
                          updateFormData({ profilePhoto: reader.result as string })
                          resolve()
                        }
                        reader.readAsDataURL(file)
                      })
                    }
                    size="lg"
                    className="mt-2"
                  />
                </div>
              </div>
            )}

            {/* Step 2: Services & Rates */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <Label>Specialty Category</Label>
                  <Select
                    value={formData.specialty || undefined}
                    onValueChange={(v) => updateFormData({ specialty: v })}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {SPECIALTY_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Hourly Rate ($)</Label>
                  <Input
                    type="number"
                    min={0}
                    step={5}
                    placeholder="50"
                    value={formData.hourlyRate || ''}
                    onChange={(e) =>
                      updateFormData({ hourlyRate: Number(e.target.value) || 0 })
                    }
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Minimum Booking Duration</Label>
                  <Select
                    value={formData.minDuration ? String(formData.minDuration) : '60'}
                    onValueChange={(v) => updateFormData({ minDuration: Number(v) })}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DURATIONS.map((d) => (
                        <SelectItem key={d.value} value={String(d.value)}>
                          {d.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Services Offered</Label>
                  <div className="mt-2 space-y-2">
                    {SERVICES.filter((s) => s !== 'Other').map((service) => (
                      <div key={service} className="flex items-center gap-2">
                        <Checkbox
                          id={service}
                          checked={formData.services.includes(service)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              updateFormData({
                                services: [...formData.services, service],
                              })
                            } else {
                              updateFormData({
                                services: formData.services.filter((s) => s !== service),
                              })
                            }
                          }}
                        />
                        <label htmlFor={service} className="text-sm text-gray-300">
                          {service}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Location & Service Area */}
            {step === 3 && (
              <div className="space-y-6">
                <ServiceAreaSelector
                  location={formData.location}
                  radiusMiles={formData.serviceRadius}
                  onLocationChange={(loc) => updateFormData({ location: loc })}
                  onRadiusChange={(r) => updateFormData({ serviceRadius: r })}
                />
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="willingToTravel"
                    checked={formData.willingToTravel}
                    onCheckedChange={(checked) =>
                      updateFormData({ willingToTravel: !!checked })
                    }
                  />
                  <label htmlFor="willingToTravel" className="text-sm text-gray-300">
                    Willing to travel outside service area
                  </label>
                </div>
              </div>
            )}

            {/* Step 4: Portfolio */}
            {step === 4 && (
              <div className="space-y-6">
                <div>
                  <Label>Portfolio Images (up to 5)</Label>
                  <PortfolioUpload
                    images={formData.portfolioImages}
                    onChange={(imgs) => updateFormData({ portfolioImages: imgs })}
                  />
                </div>
                <div>
                  <Label>Portfolio Links</Label>
                  <Input
                    placeholder="Website, Instagram, etc. (comma-separated)"
                    value={formData.portfolioLinks.join(', ')}
                    onChange={(e) =>
                      updateFormData({
                        portfolioLinks: e.target.value
                          .split(',')
                          .map((s) => s.trim())
                          .filter(Boolean),
                      })
                    }
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Certifications</Label>
                  <Input
                    placeholder="Certifications (comma-separated)"
                    value={formData.certifications.join(', ')}
                    onChange={(e) =>
                      updateFormData({
                        certifications: e.target.value
                          .split(',')
                          .map((s) => s.trim())
                          .filter(Boolean),
                      })
                    }
                    className="mt-2"
                  />
                </div>
              </div>
            )}

            {/* Step 5: Communities */}
            {step === 5 && (
              <div className="space-y-4">
                <Label>Select communities to join</Label>
                <div className="space-y-2">
                  {communities.map((community) => (
                    <div
                      key={community.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-gray-800 hover:border-gray-700"
                    >
                      <Checkbox
                        id={community.id}
                        checked={formData.communities.includes(community.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            updateFormData({
                              communities: [...formData.communities, community.id],
                            })
                          } else {
                            updateFormData({
                              communities: formData.communities.filter((c) => c !== community.id),
                            })
                          }
                        }}
                      />
                      <label
                        htmlFor={community.id}
                        className="flex-1 cursor-pointer text-sm text-gray-300"
                      >
                        {community.name}
                      </label>
                      <span className="text-xs text-gray-500">
                        {community.totalMembers} members
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 6: Review */}
            {step === 6 && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-white mb-2">Basic Info</h3>
                  <p className="text-gray-400">
                    {formData.displayName} • {formData.specialty}
                  </p>
                  <p className="text-sm text-gray-500">{formData.phone}</p>
                </div>
                <div>
                  <h3 className="font-medium text-white mb-2">Rates</h3>
                  <p className="text-gray-400">
                    ${formData.hourlyRate}/hr • Min {formData.minDuration} min
                  </p>
                </div>
                <div>
                  <h3 className="font-medium text-white mb-2">Location</h3>
                  <p className="text-gray-400">
                    {formData.location?.address || 'Not set'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formData.serviceRadius} mile radius
                  </p>
                </div>
                <div>
                  <h3 className="font-medium text-white mb-2">Communities</h3>
                  <p className="text-gray-400">
                    {formData.communities.length > 0
                      ? communities
                          .filter((c) => formData.communities.includes(c.id))
                          .map((c) => c.name)
                          .join(', ')
                      : 'None selected'}
                  </p>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-lg border border-gray-800">
                  <Checkbox
                    id="terms"
                    checked={termsAccepted}
                    onCheckedChange={(checked) => setTermsAccepted(!!checked)}
                  />
                  <label htmlFor="terms" className="text-sm text-gray-300">
                    I agree to the Terms & Conditions and confirm the information above
                    is accurate.
                  </label>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={step <= 1}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          {step < 6 ? (
            <Button onClick={handleNext} disabled={!validateStep()} className="gap-2">
              Next
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!termsAccepted || isSubmitting}
              loading={isSubmitting}
              className="gap-2"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Submit Application
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
