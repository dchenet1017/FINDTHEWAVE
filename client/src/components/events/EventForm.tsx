import { useCallback, useEffect, useMemo, useState } from 'react'
import { useForm, Controller, type UseFormReset } from 'react-hook-form'
import { addHours, differenceInMinutes, format, parseISO } from 'date-fns'
import { Link } from 'react-router-dom'
import { ArrowLeft, Loader2, MapPin, Search } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Textarea } from '@/components/ui/Textarea'
import { Switch } from '@/components/ui/Switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import { cn } from '@/lib/utils'
import { geocodeAddress } from '@/lib/mapbox'
import { useWaveLeaders } from '@/hooks/useWaveLeaders'
import {
  useCreateEvent,
  useUpdateEvent,
  type CreateEventData,
} from '@/hooks/useBusinessEvents'
import type { Event, EventCategory } from '@/types/event'

const CATEGORIES: EventCategory[] = [
  'MUSIC',
  'SPORTS',
  'FOOD_DRINK',
  'WELLNESS',
  'NETWORKING',
  'EDUCATION',
  'ART',
  'NIGHTLIFE',
  'COMMUNITY',
  'OTHER',
]

const CATEGORY_LABELS: Record<EventCategory, string> = {
  MUSIC: 'Music',
  SPORTS: 'Sports',
  FOOD_DRINK: 'Food & Drink',
  WELLNESS: 'Wellness',
  NETWORKING: 'Networking',
  EDUCATION: 'Education',
  ART: 'Art',
  NIGHTLIFE: 'Nightlife',
  COMMUNITY: 'Community',
  OTHER: 'Other',
}

function timezones(): string[] {
  try {
    return Intl.supportedValuesOf('timeZone')
  } catch {
    return [
      'UTC',
      'America/New_York',
      'America/Chicago',
      'America/Denver',
      'America/Los_Angeles',
      'Europe/London',
    ]
  }
}

function defaultStartEndLocal() {
  const start = addHours(new Date(), 26)
  start.setMinutes(0, 0, 0)
  const end = addHours(start, 2)
  return {
    start: format(start, "yyyy-MM-dd'T'HH:mm"),
    end: format(end, "yyyy-MM-dd'T'HH:mm"),
  }
}

function isoToLocalInput(iso: string | undefined) {
  if (!iso) return ''
  try {
    return format(parseISO(iso), "yyyy-MM-dd'T'HH:mm")
  } catch {
    return ''
  }
}

export type EventFormValues = {
  title: string
  category: EventCategory
  description: string
  tagsInput: string
  imageUrl: string
  locationMode: 'business' | 'custom' | 'virtual'
  venueName: string
  address: string
  latitude: number
  longitude: number
  virtualLink: string
  startDate: string
  endDate: string
  timezone: string
  requiresRegistration: boolean
  maxUnlimited: boolean
  maxAttendees: string
  registrationDeadline: string
  ticketFree: boolean
  ticketPrice: string
  wlSearch: string
  featuredWaveLeaderId: string
  waveLeaderRate: string
  highlights: string
  whatsIncluded: string
  whatToBring: string
  specialInstructions: string
  ageRestrictions: string
  accessibilityInfo: string
  isFeatured: boolean
  publishAction: 'draft' | 'publish' | 'schedule'
  scheduledPublishAt: string
}

function defaultValues(
  biz: { name: string; lat: number; lng: number; addressLine: string },
  initial?: Event | null
): EventFormValues {
  const { start, end } = defaultStartEndLocal()
  if (!initial) {
    return {
      title: '',
      category: 'COMMUNITY',
      description: '',
      tagsInput: '',
      imageUrl: '',
      locationMode: 'business',
      venueName: biz.name,
      address: biz.addressLine,
      latitude: biz.lat,
      longitude: biz.lng,
      virtualLink: '',
      startDate: start,
      endDate: end,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York',
      requiresRegistration: true,
      maxUnlimited: true,
      maxAttendees: '',
      registrationDeadline: '',
      ticketFree: true,
      ticketPrice: '',
      wlSearch: '',
      featuredWaveLeaderId: '',
      waveLeaderRate: '',
      highlights: '',
      whatsIncluded: '',
      whatToBring: '',
      specialInstructions: '',
      ageRestrictions: '',
      accessibilityInfo: '',
      isFeatured: false,
      publishAction: 'draft',
      scheduledPublishAt: '',
    }
  }

  return {
    title: initial.title,
    category: initial.category,
    description: initial.description || '',
    tagsInput: (initial.tags || []).join(', '),
    imageUrl: initial.imageUrl || '',
    locationMode: initial.isVirtual ? 'virtual' : 'custom',
    venueName: initial.venueName || '',
    address: initial.address || '',
    latitude: initial.latitude,
    longitude: initial.longitude,
    virtualLink: initial.virtualLink || '',
    startDate: isoToLocalInput(initial.startDate) || start,
    endDate: isoToLocalInput(initial.endDate) || end,
    timezone: initial.timezone || 'America/New_York',
    requiresRegistration: initial.requiresRegistration,
    maxUnlimited: initial.maxAttendees == null,
    maxAttendees: initial.maxAttendees != null ? String(initial.maxAttendees) : '',
    registrationDeadline: isoToLocalInput(initial.registrationDeadline ?? undefined),
    ticketFree: initial.ticketPrice == null || Number(initial.ticketPrice) === 0,
    ticketPrice:
      initial.ticketPrice != null && Number(initial.ticketPrice) > 0
        ? String(initial.ticketPrice)
        : '',
    wlSearch: '',
    featuredWaveLeaderId: initial.featuredWaveLeaderId || '',
    waveLeaderRate:
      initial.waveLeaderRate != null ? String(initial.waveLeaderRate) : '',
    highlights: (initial.highlights || []).join('\n'),
    whatsIncluded: (initial.whatsIncluded || []).join('\n'),
    whatToBring: (initial.whatToBring || []).join('\n'),
    specialInstructions: initial.specialInstructions || '',
    ageRestrictions: initial.ageRestrictions || '',
    accessibilityInfo: initial.accessibilityInfo || '',
    isFeatured: initial.isFeatured,
    publishAction: 'draft',
    scheduledPublishAt: isoToLocalInput(initial.scheduledPublishAt ?? undefined),
  }
}

function splitLines(s: string) {
  return s
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
}

function splitTags(s: string) {
  return s
    .split(/[,#]/)
    .map((t) => t.trim())
    .filter(Boolean)
}

function buildPayload(
  v: EventFormValues,
  biz: { name: string; lat: number; lng: number; addressLine: string },
  publishMode: 'draft' | 'publish' | 'schedule'
): CreateEventData {
  let latitude = v.latitude
  let longitude = v.longitude
  let venueName: string | null = v.venueName || null
  let address: string | null = v.address || null
  let isVirtual = false
  let virtualLink: string | null = null

  if (v.locationMode === 'business') {
    latitude = biz.lat
    longitude = biz.lng
    venueName = biz.name
    address = biz.addressLine || null
  } else if (v.locationMode === 'virtual') {
    isVirtual = true
    virtualLink = v.virtualLink.trim() || null
    latitude = biz.lat
    longitude = biz.lng
  }

  const start = new Date(v.startDate)
  const end = new Date(v.endDate)
  const regDeadline = v.registrationDeadline.trim()
    ? new Date(v.registrationDeadline).toISOString()
    : null

  const maxAttendees = v.maxUnlimited
    ? null
    : v.maxAttendees.trim()
      ? parseInt(v.maxAttendees, 10)
      : null

  const ticketPrice =
    v.ticketFree || !v.ticketPrice.trim() ? null : parseFloat(v.ticketPrice)

  const wlRate = v.waveLeaderRate.trim() ? parseFloat(v.waveLeaderRate) : null

  const scheduledPublishAt =
    publishMode === 'schedule' && v.scheduledPublishAt.trim()
      ? new Date(v.scheduledPublishAt).toISOString()
      : null

  return {
    title: v.title.trim(),
    description: v.description,
    category: v.category,
    tags: splitTags(v.tagsInput),
    imageUrl: v.imageUrl.trim() || null,
    highlights: splitLines(v.highlights),
    whatsIncluded: splitLines(v.whatsIncluded),
    whatToBring: splitLines(v.whatToBring),
    specialInstructions: v.specialInstructions.trim() || null,
    ageRestrictions: v.ageRestrictions.trim() || null,
    accessibilityInfo: v.accessibilityInfo.trim() || null,
    startDate: start.toISOString(),
    endDate: end.toISOString(),
    timezone: v.timezone,
    venueName,
    address,
    latitude,
    longitude,
    isVirtual,
    virtualLink,
    requiresRegistration: v.requiresRegistration,
    maxAttendees: Number.isFinite(maxAttendees as number) ? maxAttendees : null,
    registrationDeadline: regDeadline,
    ticketPrice: ticketPrice != null && Number.isFinite(ticketPrice) ? ticketPrice : null,
    featuredWaveLeaderId: v.featuredWaveLeaderId.trim() || null,
    waveLeaderRate: wlRate != null && Number.isFinite(wlRate) ? wlRate : null,
    scheduledPublishAt,
    isFeatured: v.isFeatured,
    publishMode,
  }
}

function coerceDraftValues(v: EventFormValues, biz: { lat: number; lng: number }): EventFormValues {
  const { start, end } = defaultStartEndLocal()
  const copy = { ...v }
  if (!copy.title.trim()) copy.title = 'Draft event'
  if (!copy.startDate) copy.startDate = start
  if (!copy.endDate) copy.endDate = end
  if (copy.locationMode === 'virtual' && !copy.virtualLink.trim()) {
    copy.locationMode = 'business'
  }
  if (copy.locationMode === 'business' || copy.locationMode === 'virtual') {
    copy.latitude = biz.lat
    copy.longitude = biz.lng
  }
  if (
    copy.locationMode === 'custom' &&
    (!Number.isFinite(copy.latitude) || !Number.isFinite(copy.longitude))
  ) {
    copy.locationMode = 'business'
    copy.latitude = biz.lat
    copy.longitude = biz.lng
  }
  if (!copy.ticketFree && !copy.ticketPrice.trim()) copy.ticketFree = true
  if (!copy.maxUnlimited && !copy.maxAttendees.trim()) copy.maxUnlimited = true
  const s = new Date(copy.startDate)
  const e = new Date(copy.endDate)
  if (!Number.isNaN(s.getTime()) && !Number.isNaN(e.getTime()) && e <= s) {
    copy.endDate = format(addHours(s, 2), "yyyy-MM-dd'T'HH:mm")
  }
  return copy
}

function validateStep(
  step: number,
  v: EventFormValues,
  biz: { lat: number; lng: number }
): string | null {
  if (step === 0) {
    if (!v.title.trim()) return 'Event title is required.'
    if (!v.category) return 'Category is required.'
  }
  if (step === 1) {
    const s = new Date(v.startDate)
    const e = new Date(v.endDate)
    if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return 'Valid start and end are required.'
    if (e <= s) return 'End must be after start.'
    if (v.locationMode === 'virtual' && !v.virtualLink.trim()) return 'Virtual link is required.'
    if (v.locationMode === 'custom') {
      if (!v.address.trim()) return 'Address is required for a custom venue.'
      if (!Number.isFinite(v.latitude) || !Number.isFinite(v.longitude)) {
        return 'Look up the address to set map coordinates.'
      }
    }
    if (v.locationMode === 'business') {
      if (!Number.isFinite(biz.lat) || !Number.isFinite(biz.lng)) {
        return 'Set your business location on the map before creating events.'
      }
    }
  }
  if (step === 2) {
    if (!v.ticketFree) {
      const p = parseFloat(v.ticketPrice)
      if (!v.ticketPrice.trim() || !Number.isFinite(p) || p < 0) return 'Enter a valid ticket price or choose Free.'
    }
    if (!v.maxUnlimited) {
      const m = parseInt(v.maxAttendees, 10)
      if (!v.maxAttendees.trim() || !Number.isFinite(m) || m < 1) return 'Enter max attendees or choose Unlimited.'
    }
  }
  if (step === 4) {
    if (v.publishAction === 'schedule' && !v.scheduledPublishAt.trim()) {
      return 'Pick a schedule date and time.'
    }
  }
  return null
}

const STEP_LABELS = ['Basics', 'Date & place', 'Registration', 'Details', 'Review']

export interface EventFormProps {
  mode: 'create' | 'edit'
  eventId?: string
  initialEvent?: Event | null
  businessName: string
  businessLatitude: number
  businessLongitude: number
  businessAddress: string
  onCreated?: (event: Event) => void
}

export function EventForm({
  mode,
  eventId,
  initialEvent,
  businessName,
  businessLatitude,
  businessLongitude,
  businessAddress,
  onCreated,
}: EventFormProps) {
  const biz = useMemo(
    () => ({
      name: businessName,
      lat: businessLatitude,
      lng: businessLongitude,
      addressLine: businessAddress,
    }),
    [businessName, businessLatitude, businessLongitude, businessAddress]
  )

  const draftKey = eventId ? `wf-event-draft-${eventId}` : 'wf-event-draft-new'

  const createMut = useCreateEvent()
  const updateMut = useUpdateEvent()

  const [step, setStep] = useState(0)
  const [wlQuery, setWlQuery] = useState('')
  const [geoLoading, setGeoLoading] = useState(false)

  const { data: wlData } = useWaveLeaders({
    search: wlQuery || undefined,
    limit: 12,
    page: 1,
    lat: businessLatitude,
    lng: businessLongitude,
  })

  const form = useForm<EventFormValues>({
    defaultValues: defaultValues(biz, initialEvent ?? null),
  })

  const { register, control, watch, setValue, reset, setError, clearErrors, formState } = form

  const applyReset = useCallback(
    (r: UseFormReset<EventFormValues>, ev: Event | null | undefined) => {
      const base = defaultValues(biz, ev ?? null)
      if (ev) {
        r(base)
        return
      }
      try {
        const raw = localStorage.getItem(draftKey)
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<EventFormValues>
          r({ ...base, ...parsed })
          return
        }
      } catch {
        /* ignore */
      }
      r(base)
    },
    [biz, draftKey]
  )

  useEffect(() => {
    applyReset(reset, initialEvent ?? null)
  }, [initialEvent?.id, applyReset, reset, initialEvent])

  useEffect(() => {
    let t: ReturnType<typeof setTimeout>
    const sub = watch((val) => {
      clearTimeout(t)
      t = setTimeout(() => {
        try {
          localStorage.setItem(draftKey, JSON.stringify(val))
        } catch {
          /* quota */
        }
      }, 600)
    })
    return () => {
      clearTimeout(t)
      sub.unsubscribe()
    }
  }, [watch, draftKey])

  const values = watch()
  const durationMin = useMemo(() => {
    try {
      const s = new Date(values.startDate)
      const e = new Date(values.endDate)
      if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return null
      return differenceInMinutes(e, s)
    } catch {
      return null
    }
  }, [values.startDate, values.endDate])

  const runGeocode = useCallback(async () => {
    const q = values.address.trim()
    if (!q) return
    setGeoLoading(true)
    try {
      const results = await geocodeAddress(q)
      const first = results[0]
      if (!first) {
        setError('root', { message: 'No results for that address.' })
        return
      }
      const [lng, lat] = first.center
      setValue('latitude', lat)
      setValue('longitude', lng)
      setValue('address', first.place_name)
    } finally {
      setGeoLoading(false)
    }
  }, [values.address, setValue, setError])

  const goNext = () => {
    clearErrors('root')
    const err = validateStep(step, values, biz)
    if (err) {
      setError('root', { message: err })
      return
    }
    setStep((s) => Math.min(s + 1, STEP_LABELS.length - 1))
  }

  const goBack = () => {
    setStep((s) => Math.max(s - 1, 0))
  }

  const submitWithMode = (publishMode: 'draft' | 'publish' | 'schedule') => {
    const err = validateStep(0, values, biz) || validateStep(1, values, biz) || validateStep(2, values, biz)
    if (err) {
      setError('root', { message: err })
      return
    }
    if (publishMode === 'schedule') {
      const e = validateStep(4, { ...values, publishAction: 'schedule' }, biz)
      if (e) {
        setError('root', { message: e })
        return
      }
    }
    const payload = buildPayload(values, biz, publishMode)
    if (mode === 'create' && !eventId) {
      createMut.mutate(payload, {
        onSuccess: (ev) => {
          localStorage.removeItem(draftKey)
          onCreated?.(ev)
        },
      })
    } else if (eventId) {
      updateMut.mutate({ id: eventId, payload })
    }
  }

  const onSaveDraft = () => submitWithMode('draft')

  const busy = createMut.isPending || updateMut.isPending

  return (
    <div className="mx-auto max-w-3xl text-white">
      <Link
        to="/business/events"
        className="mb-6 inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to events
      </Link>

      <h1 className="text-2xl font-bold">
        {mode === 'create' ? 'Create event' : 'Edit event'}
      </h1>
      <p className="mt-1 text-sm text-gray-400">
        Step {step + 1} of {STEP_LABELS.length}: {STEP_LABELS[step]}
      </p>

      <div className="mt-6 flex gap-2">
        {STEP_LABELS.map((label, i) => (
          <button
            key={label}
            type="button"
            onClick={() => {
              if (i < step) setStep(i)
            }}
            className={cn(
              'h-2 flex-1 rounded-full transition-colors',
              i <= step ? 'bg-primary' : 'bg-gray-800',
              i < step && 'cursor-pointer hover:bg-primary/80'
            )}
            title={label}
          />
        ))}
      </div>

      {formState.errors.root?.message && (
        <p className="mt-4 rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
          {formState.errors.root.message}
        </p>
      )}

      <form
        className="mt-6 space-y-6"
        onSubmit={(e) => {
          e.preventDefault()
          if (step < STEP_LABELS.length - 1) goNext()
        }}
        noValidate
      >
        {step === 0 && (
          <div className="space-y-4 rounded-xl border border-gray-800 bg-dark-card p-6">
            <div>
              <Label htmlFor="title">Event title *</Label>
              <Input
                id="title"
                className="mt-1.5"
                {...register('title', { required: true })}
                placeholder="Summer rooftop mixer"
              />
              {formState.errors.title && (
                <p className="mt-1 text-xs text-danger">Title is required</p>
              )}
            </div>
            <div>
              <Label>Category *</Label>
              <Controller
                name="category"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {CATEGORY_LABELS[c]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <p className="mt-0.5 text-xs text-gray-500">
                Rich text: basic HTML is allowed; it is sanitized for public pages.
              </p>
              <Textarea
                id="description"
                className="mt-1.5 min-h-[140px]"
                {...register('description')}
                placeholder="<p>Tell attendees what makes this event special.</p>"
              />
            </div>
            <div>
              <Label htmlFor="tagsInput">Tags</Label>
              <Input
                id="tagsInput"
                className="mt-1.5"
                {...register('tagsInput')}
                placeholder="live-music, outdoor, family"
              />
            </div>
            <div>
              <Label htmlFor="imageUrl">Event image URL</Label>
              <Input id="imageUrl" className="mt-1.5" {...register('imageUrl')} placeholder="https://..." />
              <input
                type="file"
                accept="image/*"
                className="mt-2 block text-sm text-gray-400"
                onChange={(ev) => {
                  const file = ev.target.files?.[0]
                  if (!file) return
                  if (file.size > 450_000) {
                    setError('root', { message: 'Image must be under 450KB for data URL, or use a hosted URL.' })
                    return
                  }
                  const reader = new FileReader()
                  reader.onload = () => {
                    if (typeof reader.result === 'string') setValue('imageUrl', reader.result)
                  }
                  reader.readAsDataURL(file)
                }}
              />
              {values.imageUrl?.startsWith('http') || values.imageUrl?.startsWith('data:') ? (
                <img
                  src={values.imageUrl}
                  alt=""
                  className="mt-3 h-32 w-full rounded-md object-cover border border-gray-800"
                />
              ) : null}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4 rounded-xl border border-gray-800 bg-dark-card p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="startDate">Start *</Label>
                <Input id="startDate" type="datetime-local" className="mt-1.5" {...register('startDate')} />
              </div>
              <div>
                <Label htmlFor="endDate">End *</Label>
                <Input id="endDate" type="datetime-local" className="mt-1.5" {...register('endDate')} />
              </div>
            </div>
            {durationMin != null && durationMin >= 0 && (
              <p className="text-sm text-gray-400">
                Duration: {Math.floor(durationMin / 60)}h {durationMin % 60}m
              </p>
            )}
            <div>
              <Label>Timezone</Label>
              <Controller
                name="timezone"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="mt-1.5 max-h-40 overflow-hidden">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 overflow-y-auto">
                      {timezones().map((tz) => (
                        <SelectItem key={tz} value={tz}>
                          {tz}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-3">
              <Label>Location</Label>
              <Controller
                name="locationMode"
                control={control}
                render={({ field }) => (
                  <div className="flex flex-col gap-2">
                    {(
                      [
                        ['business', 'Use business location'],
                        ['custom', 'Custom venue'],
                        ['virtual', 'Virtual event'],
                      ] as const
                    ).map(([val, lab]) => (
                      <label
                        key={val}
                        className={cn(
                          'flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm',
                          field.value === val ? 'border-primary bg-primary/10' : 'border-gray-800'
                        )}
                      >
                        <input
                          type="radio"
                          className="accent-primary"
                          checked={field.value === val}
                          onChange={() => field.onChange(val)}
                        />
                        {lab}
                      </label>
                    ))}
                  </div>
                )}
              />
            </div>

            {values.locationMode === 'business' && (
              <div className="flex gap-2 rounded-lg border border-gray-800 bg-dark-bg/50 p-4 text-sm text-gray-300">
                <MapPin className="h-5 w-5 shrink-0 text-primary" />
                <div>
                  <p className="font-medium text-white">{businessName}</p>
                  <p>{businessAddress || 'No address on file — update in My Location.'}</p>
                </div>
              </div>
            )}

            {values.locationMode === 'custom' && (
              <div className="space-y-3">
                <div>
                  <Label htmlFor="venueName">Venue name</Label>
                  <Input id="venueName" className="mt-1.5" {...register('venueName')} />
                </div>
                <div>
                  <Label htmlFor="address">Address *</Label>
                  <div className="mt-1.5 flex gap-2">
                    <Input id="address" {...register('address')} placeholder="123 Main St, City" />
                    <Button
                      type="button"
                      variant="outline"
                      disabled={geoLoading}
                      onClick={() => runGeocode()}
                    >
                      {geoLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Look up'}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {values.locationMode === 'virtual' && (
              <div>
                <Label htmlFor="virtualLink">Meeting link *</Label>
                <Input
                  id="virtualLink"
                  className="mt-1.5"
                  {...register('virtualLink')}
                  placeholder="https://zoom.us/j/..."
                />
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 rounded-xl border border-gray-800 bg-dark-card p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label>Requires registration</Label>
                <p className="text-xs text-gray-500">Turn off for open-door events.</p>
              </div>
              <Controller
                name="requiresRegistration"
                control={control}
                render={({ field }) => (
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                )}
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label>Unlimited attendees</Label>
              </div>
              <Controller
                name="maxUnlimited"
                control={control}
                render={({ field }) => (
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                )}
              />
            </div>
            {!values.maxUnlimited && (
              <div>
                <Label htmlFor="maxAttendees">Max attendees *</Label>
                <Input
                  id="maxAttendees"
                  type="number"
                  min={1}
                  className="mt-1.5"
                  {...register('maxAttendees')}
                />
              </div>
            )}
            <div>
              <Label htmlFor="registrationDeadline">Registration deadline (optional)</Label>
              <Input
                id="registrationDeadline"
                type="datetime-local"
                className="mt-1.5"
                {...register('registrationDeadline')}
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <Label>Free event</Label>
              <Controller
                name="ticketFree"
                control={control}
                render={({ field }) => (
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                )}
              />
            </div>
            {!values.ticketFree && (
              <div>
                <Label htmlFor="ticketPrice">Ticket price (USD) *</Label>
                <Input
                  id="ticketPrice"
                  type="number"
                  min={0}
                  step="0.01"
                  className="mt-1.5"
                  {...register('ticketPrice')}
                />
              </div>
            )}

            <div className="border-t border-gray-800 pt-4">
              <Label>Featured WaveLeader</Label>
              <p className="text-xs text-gray-500">
                Search and attach a WaveLeader; set an event rate if needed.
              </p>
              <div className="relative mt-2">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  className="pl-9"
                  placeholder="Search by name..."
                  value={wlQuery}
                  onChange={(e) => setWlQuery(e.target.value)}
                />
              </div>
              <div className="mt-2 max-h-40 space-y-1 overflow-y-auto rounded-md border border-gray-800 p-2">
                {(wlData?.waveLeaders || []).map((wl) => (
                  <button
                    key={wl.id}
                    type="button"
                    className={cn(
                      'flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm hover:bg-gray-800',
                      values.featuredWaveLeaderId === wl.id && 'bg-primary/15 text-primary'
                    )}
                    onClick={() => setValue('featuredWaveLeaderId', wl.id)}
                  >
                    <span>{wl.displayName}</span>
                    <span className="text-xs text-gray-500">${wl.hourlyRate}/hr</span>
                  </button>
                ))}
                {!wlData?.waveLeaders?.length && (
                  <p className="text-xs text-gray-500">Type to search WaveLeaders.</p>
                )}
              </div>
              {values.featuredWaveLeaderId && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="mt-2"
                  onClick={() => setValue('featuredWaveLeaderId', '')}
                >
                  Clear selection
                </Button>
              )}
              <div className="mt-3">
                <Label htmlFor="waveLeaderRate">WaveLeader rate for this event ($)</Label>
                <Input id="waveLeaderRate" type="number" min={0} step="0.01" className="mt-1.5" {...register('waveLeaderRate')} />
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 rounded-xl border border-gray-800 bg-dark-card p-6">
            <div>
              <Label htmlFor="highlights">What to expect (one per line)</Label>
              <Textarea id="highlights" className="mt-1.5 min-h-[100px]" {...register('highlights')} />
            </div>
            <div>
              <Label htmlFor="whatsIncluded">What&apos;s included</Label>
              <Textarea id="whatsIncluded" className="mt-1.5 min-h-[80px]" {...register('whatsIncluded')} />
            </div>
            <div>
              <Label htmlFor="whatToBring">What to bring</Label>
              <Textarea id="whatToBring" className="mt-1.5 min-h-[80px]" {...register('whatToBring')} />
            </div>
            <div>
              <Label htmlFor="specialInstructions">Special instructions</Label>
              <Textarea id="specialInstructions" className="mt-1.5" {...register('specialInstructions')} />
            </div>
            <div>
              <Label htmlFor="ageRestrictions">Age restrictions</Label>
              <Input id="ageRestrictions" className="mt-1.5" {...register('ageRestrictions')} />
            </div>
            <div>
              <Label htmlFor="accessibilityInfo">Accessibility</Label>
              <Textarea id="accessibilityInfo" className="mt-1.5" {...register('accessibilityInfo')} />
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4 rounded-xl border border-gray-800 bg-dark-card p-6">
            <div className="rounded-lg border border-gray-800 bg-dark-bg/40 p-4">
              <p className="text-lg font-semibold">{values.title || 'Untitled'}</p>
              <p className="text-sm text-gray-400">
                {CATEGORY_LABELS[values.category]} ·{' '}
                {values.startDate &&
                  (() => {
                    try {
                      return format(new Date(values.startDate), 'PPp')
                    } catch {
                      return values.startDate
                    }
                  })()}
              </p>
              {values.imageUrl ? (
                <img
                  src={values.imageUrl}
                  alt=""
                  className="mt-3 h-36 w-full rounded-md object-cover"
                />
              ) : null}
            </div>
            <div className="flex items-center justify-between gap-4 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
              <div>
                <Label>Feature this event</Label>
                <p className="text-xs text-gray-500">+$50 featured placement fee (billing integration pending).</p>
              </div>
              <Controller
                name="isFeatured"
                control={control}
                render={({ field }) => (
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                )}
              />
            </div>
            <div>
              <Label>Publish</Label>
              <Controller
                name="publishAction"
                control={control}
                render={({ field }) => (
                  <div className="mt-2 flex flex-col gap-2">
                    {(
                      [
                        ['draft', 'Save as draft'],
                        ['publish', 'Publish now'],
                        ['schedule', 'Schedule publish'],
                      ] as const
                    ).map(([val, lab]) => (
                      <label
                        key={val}
                        className={cn(
                          'flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm',
                          field.value === val ? 'border-primary bg-primary/10' : 'border-gray-800'
                        )}
                      >
                        <input
                          type="radio"
                          className="accent-primary"
                          checked={field.value === val}
                          onChange={() => field.onChange(val)}
                        />
                        {lab}
                      </label>
                    ))}
                  </div>
                )}
              />
            </div>
            {values.publishAction === 'schedule' && (
              <div>
                <Label htmlFor="scheduledPublishAt">Schedule date & time *</Label>
                <Input
                  id="scheduledPublishAt"
                  type="datetime-local"
                  className="mt-1.5"
                  {...register('scheduledPublishAt')}
                />
              </div>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 border-t border-gray-800 pt-6">
          {step > 0 && (
            <Button type="button" variant="outline" onClick={goBack}>
              Back
            </Button>
          )}
          <Button type="button" variant="ghost" disabled={busy} onClick={onSaveDraft}>
            Save draft
          </Button>
          {step < STEP_LABELS.length - 1 ? (
            <Button type="submit">Continue</Button>
          ) : (
            <>
              <Button
                type="button"
                disabled={busy}
                onClick={() => {
                  const m =
                    values.publishAction === 'publish'
                      ? 'publish'
                      : values.publishAction === 'schedule'
                        ? 'schedule'
                        : 'draft'
                  submitWithMode(m)
                }}
              >
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {values.publishAction === 'publish'
                  ? 'Publish'
                  : values.publishAction === 'schedule'
                    ? 'Schedule'
                    : 'Save draft'}
              </Button>
            </>
          )}
        </div>
      </form>
    </div>
  )
}
