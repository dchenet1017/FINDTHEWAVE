import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { EventForm } from '@/components/events/EventForm'
import { useBusinessEvent } from '@/hooks/useBusinessEvents'
import { useBusinessLocation } from '@/hooks/useBusinessMap'
import { useBusinessDashboard } from '@/hooks/useBusinessDashboard'
import { Skeleton } from '@/components/ui/Skeleton'

export default function CreateEventPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const { data: dashboard } = useBusinessDashboard()
  const { data: location, isLoading: locLoading } = useBusinessLocation()
  const { data: event, isLoading: eventLoading } = useBusinessEvent(id, isEdit)

  const businessName = dashboard?.business?.name || location?.name || 'My business'
  const lat = location?.latitude ?? 40.7128
  const lng = location?.longitude ?? -74.006
  const addressLine = useMemo(() => {
    if (!location) return ''
    return [location.address, location.city, location.state, location.zipCode]
      .filter(Boolean)
      .join(', ')
  }, [location])

  if (isEdit && eventLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }

  if (!isEdit && locLoading && !location) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }

  return (
    <EventForm
      mode={isEdit ? 'edit' : 'create'}
      eventId={id}
      initialEvent={isEdit ? event : null}
      businessName={businessName}
      businessLatitude={lat}
      businessLongitude={lng}
      businessAddress={addressLine}
      onCreated={(ev) => navigate(`/business/events/${ev.id}/edit`, { replace: true })}
    />
  )
}
