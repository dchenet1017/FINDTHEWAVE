import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import {
  Beer,
  Check,
  Clock,
  Dumbbell,
  Hotel,
  Loader2,
  MapPin,
  Music,
  Search,
  Sparkles,
  Store,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { OnboardingShell } from '@/components/onboarding/OnboardingShell'
import { useCreateBusiness, useMyBusiness } from '@/hooks/useMyBusiness'
import { geocodeAddress, getCurrentPosition, reverseGeocode } from '@/lib/mapbox'
import { cn } from '@/lib/utils'

const TOTAL_STEPS = 4

/** Mirrors the BusinessType enum in server/prisma/schema.prisma */
const VENUE_TYPES: { value: string; label: string; icon: LucideIcon }[] = [
  { value: 'BAR', label: 'Bar', icon: Beer },
  { value: 'RESTAURANT', label: 'Restaurant', icon: UtensilsCrossed },
  { value: 'ENTERTAINMENT', label: 'Entertainment', icon: Music },
  { value: 'FITNESS', label: 'Fitness', icon: Dumbbell },
  { value: 'WELLNESS', label: 'Wellness', icon: Sparkles },
  { value: 'HOTEL', label: 'Hotel', icon: Hotel },
  { value: 'OTHER', label: 'Other', icon: Store },
]

interface Draft {
  name: string
  type: string
  description: string
  address: string
  city: string
  state: string
  zipCode: string
  pin: { lat: number; lng: number; label: string } | null
  phone: string
  website: string
}

const EMPTY: Draft = {
  name: '',
  type: '',
  description: '',
  address: '',
  city: '',
  state: '',
  zipCode: '',
  pin: null,
  phone: '',
  website: '',
}

/** "mybar.com" is what people type; the API wants a full URL */
function normalizeWebsite(raw: string): string | null {
  const value = raw.trim()
  if (!value) return null
  return /^https?:\/\//i.test(value) ? value : `https://${value}`
}

/**
 * First-run setup for a business account: creates the venue that every
 * business dashboard reads. The venue starts PENDING and stays off the public
 * map until an admin approves it.
 */
export default function BusinessOnboardingPage() {
  const navigate = useNavigate()
  const { data: existing, isLoading } = useMyBusiness()
  const createBusiness = useCreateBusiness()

  const [step, setStep] = useState(1)
  const [draft, setDraft] = useState<Draft>(EMPTY)
  const [touched, setTouched] = useState(false)
  const [locating, setLocating] = useState(false)
  const [locationError, setLocationError] = useState('')

  const patch = (changes: Partial<Draft>) => setDraft((d) => ({ ...d, ...changes }))
  const goTo = (n: number) => {
    setTouched(false)
    setStep(n)
  }

  // Full-screen takeover, as in the consumer wizard
  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [])

  // Someone who already has a venue has nothing to set up. Step 4 is the
  // confirmation shown right after creating one, so it stays.
  if (!isLoading && existing && step !== 4) {
    return <Navigate to="/business/dashboard" replace />
  }

  // ---- Step 1: the venue
  const nameError = touched && draft.name.trim().length < 2 ? 'Enter your venue name' : undefined
  const typeError = touched && !draft.type ? 'Pick the closest match' : undefined
  const descriptionError =
    touched && draft.description.trim().length < 10
      ? 'A sentence or two (10+ characters) helps people decide'
      : undefined

  const submitVenue = () => {
    setTouched(true)
    if (draft.name.trim().length < 2 || !draft.type || draft.description.trim().length < 10) return
    goTo(2)
  }

  // ---- Step 2: where it is
  const addressComplete =
    draft.address.trim().length >= 3 &&
    draft.city.trim().length >= 2 &&
    draft.state.trim().length >= 2 &&
    draft.zipCode.trim().length >= 3

  const findOnMap = async () => {
    setLocationError('')
    setLocating(true)
    try {
      const query = `${draft.address}, ${draft.city}, ${draft.state} ${draft.zipCode}`
      const [match] = await geocodeAddress(query)
      if (!match) {
        setLocationError("We couldn't find that address. Check it, or use your current location if you're at the venue.")
        return
      }
      patch({ pin: { lng: match.center[0], lat: match.center[1], label: match.place_name } })
    } catch {
      setLocationError('Address lookup failed. Try again in a moment.')
    } finally {
      setLocating(false)
    }
  }

  const useHere = async () => {
    setLocationError('')
    setLocating(true)
    try {
      const pos = await getCurrentPosition()
      const lat = pos.coords.latitude
      const lng = pos.coords.longitude
      const label = await reverseGeocode(lng, lat).catch(() => '')
      patch({ pin: { lat, lng, label: label || `${lat.toFixed(5)}, ${lng.toFixed(5)}` } })
    } catch {
      setLocationError('Location access was blocked. Allow it in your browser, or look the address up instead.')
    } finally {
      setLocating(false)
    }
  }

  const submitLocation = () => {
    setTouched(true)
    if (!addressComplete || !draft.pin) return
    goTo(3)
  }

  // ---- Step 3: contact, then create
  const submitAll = () => {
    if (!draft.pin) return goTo(2)
    createBusiness.mutate(
      {
        name: draft.name.trim(),
        type: draft.type,
        description: draft.description.trim(),
        address: draft.address.trim(),
        city: draft.city.trim(),
        state: draft.state.trim(),
        zipCode: draft.zipCode.trim(),
        latitude: draft.pin.lat,
        longitude: draft.pin.lng,
        phone: draft.phone.trim() || null,
        website: normalizeWebsite(draft.website),
      },
      { onSuccess: () => goTo(4) }
    )
  }

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-dark-bg text-white">
      <div className="mx-auto min-h-full w-full max-w-lg">
        {isLoading ? (
          <div className="flex min-h-screen items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {step === 1 && (
              <OnboardingShell
                step={1}
                totalSteps={TOTAL_STEPS}
                title="Put your venue on the wave"
                subtitle="People nearby are deciding where to go tonight. Tell them about your place."
                footer={
                  <Button size="lg" className="w-full" onClick={submitVenue}>
                    Continue
                  </Button>
                }
              >
                <div className="space-y-8">
                  <Input
                    label="Venue name"
                    placeholder="e.g. The Rooftop at 5th"
                    value={draft.name}
                    error={nameError}
                    autoComplete="organization"
                    onChange={(e) => patch({ name: e.target.value })}
                  />

                  <div>
                    <span className="mb-3 block text-sm font-medium text-gray-300">What kind of place is it?</span>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {VENUE_TYPES.map(({ value, label, icon: Icon }) => {
                        const selected = draft.type === value
                        return (
                          <button
                            key={value}
                            type="button"
                            aria-pressed={selected}
                            onClick={() => patch({ type: value })}
                            className={cn(
                              'flex flex-col items-center gap-2 rounded-xl border px-3 py-4 transition-all',
                              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                              selected
                                ? 'border-primary bg-primary/10 text-white'
                                : 'border-gray-700 bg-dark-card text-gray-400 hover:border-gray-600 hover:text-gray-200'
                            )}
                          >
                            <Icon className={cn('h-5 w-5', selected ? 'text-primary' : 'text-gray-500')} />
                            <span className="text-sm font-medium">{label}</span>
                          </button>
                        )
                      })}
                    </div>
                    {typeError && <p className="mt-2 text-sm text-danger">{typeError}</p>}
                  </div>

                  <div>
                    <label htmlFor="venue-description" className="mb-2 block text-sm font-medium text-gray-300">
                      Describe it in a line or two
                    </label>
                    <Textarea
                      id="venue-description"
                      rows={3}
                      placeholder="Craft cocktails, a DJ from 10pm and the best skyline view in Midtown."
                      value={draft.description}
                      onChange={(e) => patch({ description: e.target.value })}
                    />
                    {descriptionError && <p className="mt-2 text-sm text-danger">{descriptionError}</p>}
                  </div>
                </div>
              </OnboardingShell>
            )}

            {step === 2 && (
              <OnboardingShell
                step={2}
                totalSteps={TOTAL_STEPS}
                onBack={() => goTo(1)}
                title="Where are you?"
                subtitle="This is the pin people see on the map and the spot check-ins are measured from."
                footer={
                  <Button size="lg" className="w-full" onClick={submitLocation}>
                    Continue
                  </Button>
                }
              >
                <div className="space-y-5">
                  <Input
                    label="Street address"
                    placeholder="123 Main St"
                    value={draft.address}
                    autoComplete="street-address"
                    error={touched && draft.address.trim().length < 3 ? 'Required' : undefined}
                    onChange={(e) => patch({ address: e.target.value, pin: null })}
                  />
                  <div className="grid grid-cols-6 gap-3">
                    <div className="col-span-3">
                      <Input
                        label="City"
                        value={draft.city}
                        autoComplete="address-level2"
                        error={touched && draft.city.trim().length < 2 ? 'Required' : undefined}
                        onChange={(e) => patch({ city: e.target.value, pin: null })}
                      />
                    </div>
                    <div className="col-span-1">
                      <Input
                        label="State"
                        placeholder="NY"
                        value={draft.state}
                        autoComplete="address-level1"
                        error={touched && draft.state.trim().length < 2 ? '!' : undefined}
                        onChange={(e) => patch({ state: e.target.value, pin: null })}
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        label="ZIP"
                        value={draft.zipCode}
                        autoComplete="postal-code"
                        inputMode="numeric"
                        error={touched && draft.zipCode.trim().length < 3 ? 'Required' : undefined}
                        onChange={(e) => patch({ zipCode: e.target.value, pin: null })}
                      />
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <Button variant="outline" onClick={findOnMap} disabled={!addressComplete || locating}>
                      <Search className="mr-2 h-4 w-4" />
                      Find on map
                    </Button>
                    <Button variant="outline" onClick={useHere} disabled={locating}>
                      <MapPin className="mr-2 h-4 w-4" />
                      I'm at the venue now
                    </Button>
                  </div>

                  <div
                    className={cn(
                      'flex items-start gap-3 rounded-md border px-3 py-3 text-sm',
                      draft.pin ? 'border-primary/50 bg-primary/5' : 'border-gray-700 bg-dark-card'
                    )}
                  >
                    {locating ? (
                      <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-primary" />
                    ) : draft.pin ? (
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    ) : (
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" />
                    )}
                    <span className={draft.pin ? 'text-white' : 'text-gray-500'}>
                      {locating
                        ? 'Finding your venue…'
                        : draft.pin
                          ? `Pinned: ${draft.pin.label}`
                          : 'No map pin yet - look up the address or use your current location.'}
                    </span>
                  </div>
                  {locationError && <p className="text-sm text-danger">{locationError}</p>}
                  {touched && !draft.pin && !locationError && (
                    <p className="text-sm text-danger">Pin your venue on the map to continue.</p>
                  )}
                </div>
              </OnboardingShell>
            )}

            {step === 3 && (
              <OnboardingShell
                step={3}
                totalSteps={TOTAL_STEPS}
                onBack={() => goTo(2)}
                title="How can people reach you?"
                subtitle="Optional, but it builds trust when someone is choosing between venues."
                footer={
                  <Button size="lg" className="w-full" onClick={submitAll} loading={createBusiness.isPending}>
                    Submit for approval
                  </Button>
                }
              >
                <div className="space-y-5">
                  <Input
                    label="Phone"
                    type="tel"
                    placeholder="(212) 555-0123"
                    value={draft.phone}
                    autoComplete="tel"
                    onChange={(e) => patch({ phone: e.target.value })}
                  />
                  <Input
                    label="Website"
                    placeholder="yourvenue.com"
                    value={draft.website}
                    autoComplete="url"
                    onChange={(e) => patch({ website: e.target.value })}
                  />
                </div>
              </OnboardingShell>
            )}

            {step === 4 && (
              <OnboardingShell
                step={4}
                totalSteps={TOTAL_STEPS}
                showProgress={false}
                footer={
                  <Button size="lg" className="w-full" onClick={() => navigate('/business/dashboard', { replace: true })}>
                    Go to my dashboard
                  </Button>
                }
              >
                <div className="flex flex-1 flex-col items-center justify-center pt-16 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/15">
                    <Clock className="h-8 w-8 text-primary" />
                  </div>
                  <h1 className="mt-6 text-3xl font-bold tracking-tight">You're in the queue</h1>
                  <p className="mt-3 max-w-sm text-base leading-relaxed text-gray-400">
                    {draft.name || 'Your venue'} is waiting for a quick review by the WaveFinder team. Once
                    it's approved you'll appear on the live map and can send offers to people looking to
                    go out nearby.
                  </p>
                </div>
              </OnboardingShell>
            )}
          </>
        )}
      </div>
    </div>
  )
}
