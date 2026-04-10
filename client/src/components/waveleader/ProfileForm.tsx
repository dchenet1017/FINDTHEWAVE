import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Textarea } from '@/components/ui/Textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Checkbox } from '@/components/ui/Checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import { useUpdateWaveLeaderProfile } from '@/hooks/useWaveLeaderProfile'
import type { WaveLeaderProfile } from '@/services/waveleader.service'
import { Loader2 } from 'lucide-react'

const basicSchema = z.object({
  displayName: z.string().min(1, 'Display name required'),
  specialty: z.string().min(1, 'Specialty required'),
  phone: z.string().optional(),
  description: z.string().max(500, 'Max 500 characters').optional(),
})

const servicesSchema = z.object({
  hourlyRate: z.number().min(0),
  services: z.array(z.string()).optional(),
})

type BasicFormData = z.infer<typeof basicSchema>
type ServicesFormData = z.infer<typeof servicesSchema>

const SERVICES_OPTIONS = [
  'Consulting',
  'Workshops',
  'One-on-One Sessions',
  'Events',
  'Private Lessons',
  'Other',
]

const DURATIONS = [
  { value: 30, label: '30 min' },
  { value: 60, label: '1 hr' },
  { value: 120, label: '2 hr' },
  { value: 180, label: '3 hr' },
]

interface ProfileFormProps {
  profile: WaveLeaderProfile | undefined
  isLoading?: boolean
}

export function ProfileForm({ profile, isLoading }: ProfileFormProps) {
  const updateProfile = useUpdateWaveLeaderProfile()

  const basicForm = useForm<BasicFormData>({
    resolver: zodResolver(basicSchema),
    defaultValues: {
      displayName: profile?.displayName ?? '',
      specialty: profile?.specialty ?? '',
      phone: profile?.user?.phone ?? '',
      description: profile?.description ?? '',
    },
  })

  const servicesForm = useForm<ServicesFormData>({
    resolver: zodResolver(servicesSchema),
    defaultValues: {
      hourlyRate: profile?.hourlyRate ?? 0,
      services: profile?.tags ?? [],
    },
  })

  useEffect(() => {
    if (profile) {
      basicForm.reset({
        displayName: profile.displayName,
        specialty: profile.specialty,
        phone: profile.user?.phone ?? '',
        description: profile.description,
      })
      servicesForm.reset({
        hourlyRate: profile.hourlyRate,
        services: profile.tags,
      })
    }
  }, [profile])

  const onBasicSubmit = (data: BasicFormData) => {
    updateProfile.mutate({
      displayName: data.displayName,
      specialty: data.specialty,
      description: data.description ?? '',
      phone: data.phone ?? undefined,
    } as any)
  }

  const onServicesSubmit = (data: ServicesFormData) => {
    updateProfile.mutate({
      hourlyRate: data.hourlyRate,
      tags: data.services ?? [],
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="bg-dark-card border-gray-800">
        <CardHeader>
          <CardTitle className="text-lg text-white">Basic Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={basicForm.handleSubmit(onBasicSubmit)}
            className="space-y-4"
          >
            <div>
              <Label>Display Name</Label>
              <Input
                {...basicForm.register('displayName')}
                placeholder="How clients see you"
                className="mt-2"
              />
              {basicForm.formState.errors.displayName && (
                <p className="text-sm text-red-500 mt-1">
                  {basicForm.formState.errors.displayName.message}
                </p>
              )}
            </div>
            <div>
              <Label>Specialty</Label>
              <Input
                {...basicForm.register('specialty')}
                placeholder="e.g. Yoga Instructor"
                className="mt-2"
              />
              {basicForm.formState.errors.specialty && (
                <p className="text-sm text-red-500 mt-1">
                  {basicForm.formState.errors.specialty.message}
                </p>
              )}
            </div>
            <div>
              <Label>Phone</Label>
              <Input
                {...basicForm.register('phone')}
                type="tel"
                placeholder="+1 (555) 000-0000"
                className="mt-2"
              />
            </div>
            <div>
              <Label>Bio / Description</Label>
              <Textarea
                {...basicForm.register('description')}
                rows={4}
                maxLength={500}
                placeholder="Tell clients about yourself"
                className="mt-2"
              />
              <p className="text-xs text-gray-500 mt-1">
                {(basicForm.watch('description')?.length ?? 0)}/500
              </p>
              {basicForm.formState.errors.description && (
                <p className="text-sm text-red-500 mt-1">
                  {basicForm.formState.errors.description.message}
                </p>
              )}
            </div>
            <Button
              type="submit"
              disabled={updateProfile.isPending}
              loading={updateProfile.isPending}
            >
              Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-dark-card border-gray-800">
        <CardHeader>
          <CardTitle className="text-lg text-white">Services & Pricing</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={servicesForm.handleSubmit(onServicesSubmit)}
            className="space-y-4"
          >
            <div>
              <Label>Hourly Rate ($)</Label>
              <Input
                type="number"
                min={0}
                step={5}
                {...servicesForm.register('hourlyRate', { valueAsNumber: true })}
                className="mt-2"
              />
              {servicesForm.formState.errors.hourlyRate && (
                <p className="text-sm text-red-500 mt-1">
                  {servicesForm.formState.errors.hourlyRate.message}
                </p>
              )}
            </div>
            <div>
              <Label>Services Offered</Label>
              <div className="mt-2 space-y-2">
                {SERVICES_OPTIONS.map((service) => (
                  <div key={service} className="flex items-center gap-2">
                    <Checkbox
                      checked={servicesForm.watch('services')?.includes(service)}
                      onCheckedChange={(checked) => {
                        const current = servicesForm.getValues('services') ?? []
                        if (checked) {
                          servicesForm.setValue('services', [...current, service])
                        } else {
                          servicesForm.setValue(
                            'services',
                            current.filter((s) => s !== service)
                          )
                        }
                      }}
                    />
                    <label className="text-sm text-gray-300">{service}</label>
                  </div>
                ))}
              </div>
            </div>
            <Button
              type="submit"
              disabled={updateProfile.isPending}
              loading={updateProfile.isPending}
            >
              Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
