import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Star, MapPin } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { BookingCalendar } from '@/components/booking/BookingCalendar'
import { TimeSlotSelector } from '@/components/booking/TimeSlotSelector'
import { BookingSummary } from '@/components/booking/BookingSummary'
import { usePublicWaveLeaderProfile } from '@/hooks/useWaveLeaderProfile'
import { getCurrentPosition } from '@/lib/mapbox'
import { getDurationOptions } from '@/utils/booking'
import { saveBookingDraft } from '@/utils/bookingDraftStorage'

const SERVICE_TYPES = [
  'Consulting',
  'Workshop',
  'One-on-One Session',
  'Event Performance',
  'Other',
] as const

export default function BookWaveLeaderPage() {
  const { waveLeaderId } = useParams()
  const { data: waveLeader, isLoading } = usePublicWaveLeaderProfile(waveLeaderId)

  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [durationHours, setDurationHours] = useState<number>(1)
  const [serviceType, setServiceType] = useState<string>('One-on-One Session')
  const [location, setLocation] = useState<string>('')
  const [notes, setNotes] = useState<string>('')

  const avatarUrl = useMemo(() => {
    if (!waveLeader) return ''
    return (
      waveLeader.user?.avatar ||
      `https://api.dicebear.com/7.x/avataaars/svg?seed=${waveLeader.id}`
    )
  }, [waveLeader])

  const hourlyRate = waveLeader?.hourlyRate ?? 0

  const handleContinue = () => {
    if (!waveLeaderId || !selectedDate || !selectedTime) return
    const y = selectedDate.getFullYear()
    const m = String(selectedDate.getMonth() + 1).padStart(2, '0')
    const d = String(selectedDate.getDate()).padStart(2, '0')
    const bookingDraft = {
      waveLeaderId,
      scheduledDate: `${y}-${m}-${d}`,
      scheduledTime: selectedTime,
      durationHours,
      serviceType,
      location,
      notes: notes || undefined,
      waveLeaderName: waveLeader.displayName,
      waveLeaderAvatar: waveLeader.user?.avatar,
      hourlyRate,
    }
    saveBookingDraft(bookingDraft)
    navigate(`/booking/${waveLeaderId}/payment`, { state: { bookingDraft } })
  }

  const useMyLocation = async () => {
    try {
      const pos = await getCurrentPosition()
      setLocation(`My location (${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)})`)
    } catch {
      // ignore
    }
  }

  if (!waveLeaderId) {
    return (
      <div className="p-6 text-gray-400">
        Missing WaveLeader ID.
      </div>
    )
  }

  if (isLoading || !waveLeader) {
    return (
      <div className="p-6 text-gray-400">
        Loading WaveLeader…
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Summary card */}
            <Card className="border-gray-800">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <img
                    src={avatarUrl}
                    alt={waveLeader.displayName}
                    className="h-14 w-14 rounded-full object-cover border border-gray-700"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="text-xl font-semibold text-white truncate">
                        {waveLeader.displayName}
                      </h1>
                      {waveLeader.isVerified && (
                        <Badge variant="success">Verified</Badge>
                      )}
                      <Badge variant={waveLeader.isAvailable ? 'success' : 'outline'}>
                        {waveLeader.isAvailable ? 'Available' : 'Busy'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-400 mt-0.5">
                      {waveLeader.specialty}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-sm">
                      <span className="flex items-center gap-1 text-amber-400">
                        <Star className="h-4 w-4 fill-amber-400" />
                        {waveLeader.rating.toFixed(1)} ({waveLeader.totalReviews})
                      </span>
                      <span className="text-primary font-semibold text-base">
                        ${hourlyRate}/hr
                      </span>
                    </div>
                    {waveLeader.location && (
                      <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                        <MapPin className="h-3.5 w-3.5" />
                        <span className="truncate">{waveLeader.location}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Date & time */}
            <Card className="border-gray-800">
              <CardContent className="p-5 space-y-5">
                <div>
                  <h2 className="text-lg font-semibold text-white">Date</h2>
                  <p className="text-sm text-gray-400 mt-1">
                    Choose a date within the next 3 months.
                  </p>
                </div>
                <BookingCalendar
                  waveLeaderId={waveLeaderId}
                  selectedDate={selectedDate}
                  onDateSelect={(d) => {
                    setSelectedDate(d)
                    setSelectedTime(null)
                  }}
                />

                <div className="pt-2">
                  <h2 className="text-lg font-semibold text-white">Time</h2>
                  <p className="text-sm text-gray-400 mt-1">
                    Pick a start time. Slots are 1-hour intervals (9 AM – 8 PM).
                  </p>
                </div>

                {selectedDate ? (
                  <TimeSlotSelector
                    waveLeaderId={waveLeaderId}
                    selectedDate={selectedDate}
                    selectedTime={selectedTime}
                    onTimeSelect={setSelectedTime}
                    durationHours={durationHours}
                  />
                ) : (
                  <div className="rounded-lg border border-gray-800 bg-dark-bg p-6 text-center text-sm text-gray-500">
                    Select a date to see available time slots.
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <p className="text-sm font-medium text-gray-300 mb-2">Duration</p>
                    <Select
                      value={String(durationHours)}
                      onValueChange={(v) => setDurationHours(Number(v))}
                    >
                      <SelectTrigger className="bg-dark-bg border-gray-700">
                        <SelectValue placeholder="Select duration" />
                      </SelectTrigger>
                      <SelectContent>
                        {getDurationOptions().map((o) => (
                          <SelectItem key={o.value} value={String(o.value)}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-300 mb-2">Service type</p>
                    <Select value={serviceType} onValueChange={setServiceType}>
                      <SelectTrigger className="bg-dark-bg border-gray-700">
                        <SelectValue placeholder="Select service type" />
                      </SelectTrigger>
                      <SelectContent>
                        {SERVICE_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Service details */}
            <Card className="border-gray-800">
              <CardContent className="p-5 space-y-4">
                <div>
                  <h2 className="text-lg font-semibold text-white">Service details</h2>
                  <p className="text-sm text-gray-400 mt-1">
                    Provide the location and any special requests.
                  </p>
                </div>
                <div className="flex gap-2 items-end">
                  <Input
                    label="Location"
                    placeholder="Enter address or meeting location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={useMyLocation}
                    className="h-10"
                  >
                    Use My Location
                  </Button>
                </div>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value.slice(0, 500))}
                  placeholder="Any special requirements or notes…"
                  maxLength={500}
                />
                <div className="text-xs text-gray-500 text-right">
                  {notes.length}/500
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right column */}
          <div className="lg:col-span-1">
            <BookingSummary
              waveLeader={{ hourlyRate }}
              selectedDate={selectedDate}
              selectedTime={selectedTime}
              durationHours={durationHours}
              serviceType={serviceType}
              location={location}
              onContinue={handleContinue}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

