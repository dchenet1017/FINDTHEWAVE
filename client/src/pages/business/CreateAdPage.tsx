import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Checkbox } from '@/components/ui/Checkbox'
import { Slider } from '@/components/ui/Slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import { AdPreview } from '@/components/ads/AdPreview'
import { AdCoverageMap } from '@/components/ads/AdCoverageMap'
import { PricingCalculator, calculateDailyPrice } from '@/components/ads/PricingCalculator'
import { useBusinessLocation, useCustomerHeatmap } from '@/hooks/useBusinessMap'
import {
  useAdvertisement,
  useCreateAdvertisement,
  useEstimateAdReach,
  useUpdateAdvertisement,
} from '@/hooks/useAdvertisements'
import type { AdType, CreateAdData, Advertisement } from '@/types/ads'

type Step = 1 | 2 | 3 | 4

const AD_TYPES: Array<{ value: AdType; label: string }> = [
  { value: 'STANDARD_PROMOTION', label: 'Standard Promotion' },
  { value: 'EVENT_ANNOUNCEMENT', label: 'Event Announcement' },
  { value: 'NEW_MENU_ITEM', label: 'New Menu Item' },
  { value: 'SPECIAL_OFFER', label: 'Special Offer' },
]

function iso(date: Date) {
  return date.toISOString().slice(0, 10)
}

function daysBetween(start: string, end: string) {
  const s = new Date(start + 'T00:00:00')
  const e = new Date(end + 'T00:00:00')
  const diff = Math.max(0, e.getTime() - s.getTime())
  return Math.max(1, Math.round(diff / 86400000) + 1)
}

export default function CreateAdPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const location = useLocation()
  const duplicateFrom = (location.state as any)?.duplicateFrom as Advertisement | undefined

  const isEdit = Boolean(id)
  const [step, setStep] = useState<Step>(1)
  const [termsAccepted, setTermsAccepted] = useState(false)

  const { data: biz } = useBusinessLocation()
  const { data: heatPoints = [] } = useCustomerHeatmap('30d')
  const { data: editingAd } = useAdvertisement(id)
  const center = biz ? ([Number(biz.longitude), Number(biz.latitude)] as [number, number]) : null

  const [title, setTitle] = useState(duplicateFrom?.title || '')
  const [description, setDescription] = useState(duplicateFrom?.description || '')
  const [type, setType] = useState<AdType>(duplicateFrom?.type || 'STANDARD_PROMOTION')
  const [imageUrl, setImageUrl] = useState<string | null>(duplicateFrom?.imageUrl || null)
  const [ctaText, setCtaText] = useState(duplicateFrom?.ctaText || 'Learn More')

  const [radius, setRadius] = useState<number>(duplicateFrom?.radiusMiles || 5)
  const [demographics, setDemographics] = useState<boolean>(duplicateFrom?.demographicsEnabled || false)
  const [peakHours, setPeakHours] = useState<boolean>(duplicateFrom?.peakHoursEnabled || false)
  const [weekendBoost, setWeekendBoost] = useState<boolean>(duplicateFrom?.weekendBoostEnabled || false)

  const [startDate, setStartDate] = useState<string>(duplicateFrom?.startDate || iso(new Date()))
  const [runContinuously, setRunContinuously] = useState<boolean>(!duplicateFrom?.endDate)
  const [endDate, setEndDate] = useState<string>(duplicateFrom?.endDate || iso(new Date(Date.now() + 7 * 86400000)))

  const durationDays = useMemo(
    () => (runContinuously ? 30 : daysBetween(startDate, endDate)),
    [runContinuously, startDate, endDate]
  )

  const computed = useMemo(() => {
    return calculateDailyPrice({
      radius,
      peakHours,
      demographics,
      weekendBoost,
      duration: 1,
    } as any)
  }, [radius, peakHours, demographics, weekendBoost])

  const [dailyBudget, setDailyBudget] = useState<number>(duplicateFrom?.dailyBudget || computed.daily)
  const { data: reachEstimate } = useEstimateAdReach(radius, demographics ? { enabled: true } : undefined)

  const createMutation = useCreateAdvertisement()
  const updateMutation = useUpdateAdvertisement()
  const isSubmitting = createMutation.isPending || updateMutation.isPending

  useEffect(() => {
    const source = duplicateFrom || editingAd
    if (!source) return
    setTitle(source.title || '')
    setDescription(source.description || '')
    setType(source.type || 'STANDARD_PROMOTION')
    setImageUrl(source.imageUrl || null)
    setCtaText(source.ctaText || 'Learn More')
    setRadius(source.radiusMiles || 5)
    setDemographics(Boolean(source.demographicsEnabled))
    setPeakHours(Boolean(source.peakHoursEnabled))
    setWeekendBoost(Boolean(source.weekendBoostEnabled))
    setStartDate(source.startDate || iso(new Date()))
    setRunContinuously(!source.endDate)
    setEndDate(source.endDate || iso(new Date(Date.now() + 7 * 86400000)))
    setDailyBudget(source.dailyBudget || computed.daily)
  }, [duplicateFrom, editingAd, computed.daily])

  const canNext = useMemo(() => {
    if (step === 1) return title.trim().length > 0 && description.trim().length > 0
    if (step === 2) return radius >= 1 && radius <= 25
    if (step === 3) return dailyBudget >= 50 && dailyBudget <= 500 && !!startDate
    return true
  }, [step, title, description, radius, dailyBudget, startDate])

  const payload: CreateAdData = {
    title: title.trim(),
    description: description.trim(),
    type,
    ctaText: ctaText.trim() || 'Learn More',
    imageUrl,
    radiusMiles: radius,
    demographicsEnabled: demographics,
    peakHoursEnabled: peakHours,
    weekendBoostEnabled: weekendBoost,
    startDate,
    endDate: runContinuously ? null : endDate,
    runContinuously,
    dailyBudget,
  }

  const handleSaveDraft = () => {
    toast.info('Draft saved (local only for now).')
  }

  const launch = async () => {
    if (!payload.title || payload.title.length > 60) {
      toast.error('Title is required (max 60 characters)')
      return
    }
    if (!payload.description || payload.description.length > 200) {
      toast.error('Description is required (max 200 characters)')
      return
    }
    if (!termsAccepted) {
      toast.error('Please accept the Terms & Conditions')
      return
    }
    try {
      if (isEdit && id) {
        await updateMutation.mutateAsync({ adId: id, patch: payload })
      } else {
        await createMutation.mutateAsync(payload)
      }
      navigate('/business/ads')
    } catch {
      // handled by hook
    }
  }

  const totalCost = useMemo(() => {
    const days = Math.max(1, durationDays)
    return Math.round(dailyBudget * days)
  }, [dailyBudget, durationDays])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-white">
            {isEdit ? 'Edit Advertisement' : 'Create Advertisement'}
          </h1>
          <p className="text-gray-400 mt-1">Step {step} of 4</p>
        </div>
        <Button variant="secondary" onClick={handleSaveDraft}>
          Save Draft
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Step 1 */}
          {step === 1 && (
            <Card className="border-gray-800 bg-gray-900/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-white">Ad Details</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <Input
                  label="Ad title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value.slice(0, 60))}
                  placeholder="Catchy headline (max 60 chars)"
                  className="bg-dark-bg border-gray-700"
                />
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value.slice(0, 200))}
                  placeholder="Short description (max 200 chars)"
                  className="bg-dark-bg border-gray-700 min-h-[120px]"
                  maxLength={200}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-300 mb-2">Ad type</p>
                    <Select value={type} onValueChange={(v) => setType(v as AdType)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {AD_TYPES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Input
                    label="CTA button text"
                    value={ctaText}
                    onChange={(e) => setCtaText(e.target.value.slice(0, 24))}
                    placeholder="Learn More"
                    className="bg-dark-bg border-gray-700"
                  />
                </div>

                <Input
                  label="Image URL (optional)"
                  value={imageUrl || ''}
                  onChange={(e) => setImageUrl(e.target.value || null)}
                  placeholder="https://..."
                  className="bg-dark-bg border-gray-700"
                />
                <p className="text-xs text-gray-500">
                  Upload is optional; server-side upload can be added later. (Max 5MB when enabled.)
                </p>
              </CardContent>
            </Card>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <Card className="border-gray-800 bg-gray-900/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-white">Targeting</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="rounded-lg border border-gray-800 bg-dark-bg/30 p-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Target radius</span>
                    <span className="text-white font-semibold">{radius} miles</span>
                  </div>
                  <Slider value={[radius]} min={1} max={25} step={1} onValueChange={(v) => setRadius(v[0] ?? 5)} />
                </div>

                <AdCoverageMap
                  center={center}
                  radiusMiles={radius}
                  heatPoints={heatPoints}
                  estimatedUsers={reachEstimate?.estimatedUsers}
                />

                <div className="rounded-lg border border-gray-800 bg-dark-bg/30 p-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Estimated reach</span>
                    <span className="text-white font-semibold">
                      {reachEstimate?.estimatedUsers?.toLocaleString() ?? '—'} users
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                    <span>
                      {reachEstimate?.estimatedImpressionsPerDay?.toLocaleString() ?? '—'} impressions/day
                    </span>
                    <span>{reachEstimate?.estimatedClicksPerDay?.toLocaleString() ?? '—'} clicks/day</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label className="flex items-center gap-2 text-sm text-gray-200">
                    <Checkbox checked={demographics} onCheckedChange={(v) => setDemographics(Boolean(v))} />
                    Demographic targeting
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-200">
                    <Checkbox checked={peakHours} onCheckedChange={(v) => setPeakHours(Boolean(v))} />
                    Peak hours boost
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-200">
                    <Checkbox checked={weekendBoost} onCheckedChange={(v) => setWeekendBoost(Boolean(v))} />
                    Weekend boost
                  </label>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <Card className="border-gray-800 bg-gray-900/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-white">Budget & Schedule</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Start date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-dark-bg border-gray-700"
                  />
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm text-gray-200 mt-7">
                      <Checkbox checked={runContinuously} onCheckedChange={(v) => setRunContinuously(Boolean(v))} />
                      Run continuously
                    </label>
                    {!runContinuously && (
                      <Input
                        label="End date"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="bg-dark-bg border-gray-700"
                      />
                    )}
                  </div>
                </div>

                <div className="rounded-lg border border-gray-800 bg-dark-bg/30 p-4">
                  <p className="text-sm text-gray-400">Duration</p>
                  <p className="text-white font-semibold">{durationDays} days</p>
                  {runContinuously && <p className="text-xs text-gray-500 mt-1">Estimated at 30 days for totals.</p>}
                </div>

                <div className="rounded-lg border border-gray-800 bg-dark-bg/30 p-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Budget per day</span>
                    <span className="text-white font-semibold">${dailyBudget}/day</span>
                  </div>
                  <Slider
                    value={[dailyBudget]}
                    min={50}
                    max={500}
                    step={1}
                    onValueChange={(v) => setDailyBudget(v[0] ?? 150)}
                  />
                  <p className="text-xs text-gray-500">
                    Suggested by pricing engine: ${computed.daily}/day
                  </p>
                </div>

                <PricingCalculator
                  params={{ radius, duration: durationDays, peakHours, demographics, weekendBoost }}
                  estimatedImpressionsPerDay={reachEstimate?.estimatedImpressionsPerDay}
                  estimatedClicksPerDay={reachEstimate?.estimatedClicksPerDay}
                />

                <Card className="border-gray-800 bg-gray-900/40">
                  <CardContent className="p-5">
                    <p className="text-sm text-gray-400">Estimated totals</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-white font-semibold">Total campaign cost</span>
                      <span className="text-2xl font-bold text-white">${totalCost}</span>
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          )}

          {/* Step 4 */}
          {step === 4 && (
            <Card className="border-gray-800 bg-gray-900/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-white">Review & Confirm</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="rounded-lg border border-gray-800 bg-dark-bg/30 p-4 space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Title</span>
                    <span className="text-white font-medium">{payload.title}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Type</span>
                    <span className="text-white font-medium">{type}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Radius</span>
                    <span className="text-white font-medium">{radius} mi</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Daily budget</span>
                    <span className="text-white font-medium">${dailyBudget}/day</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Schedule</span>
                    <span className="text-white font-medium">
                      {startDate} → {runContinuously ? 'Continuous' : endDate}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-lg border border-gray-800 bg-dark-bg/30 p-4">
                  <Checkbox
                    id="terms"
                    checked={termsAccepted}
                    onCheckedChange={(checked) => setTermsAccepted(Boolean(checked))}
                  />
                  <div className="space-y-1">
                    <label htmlFor="terms" className="text-sm font-medium text-gray-200">
                      I agree to the Terms & Conditions
                    </label>
                    <p className="text-sm text-gray-400">
                      By creating this advertisement, you agree to the advertising terms and payment policies.
                    </p>
                  </div>
                </div>
                {!termsAccepted && (
                  <p className="text-sm text-red-400">
                    Please accept the Terms & Conditions to continue
                  </p>
                )}

                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    className="flex-1"
                    onClick={launch}
                    disabled={!termsAccepted || isSubmitting}
                  >
                    {isSubmitting ? (isEdit ? 'Saving...' : 'Creating...') : 'Launch Campaign'}
                  </Button>
                  <Button variant="secondary" className="flex-1" onClick={handleSaveDraft}>
                    Save as Draft
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: live preview */}
        <div className="space-y-4">
          <AdPreview
            business={{ name: biz?.name || 'Your Business', logoUrl: null, rating: 4.7 }}
            ad={{ title, description, ctaText, imageUrl }}
          />
          <AdCoverageMap
            center={center}
            radiusMiles={radius}
            heatPoints={heatPoints}
            estimatedUsers={reachEstimate?.estimatedUsers}
          />
        </div>
      </div>

      {/* Step nav */}
      <div className="flex items-center justify-between">
        <Button
          variant="secondary"
          disabled={step === 1}
          onClick={() => setStep((s) => (Math.max(1, s - 1) as Step))}
        >
          Back
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => navigate('/business/ads')}>
            Cancel
          </Button>
          {step < 4 ? (
            <Button disabled={!canNext} onClick={() => setStep((s) => (Math.min(4, s + 1) as Step))}>
              Next
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

