import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Download, Mail, Search, UserCheck } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Checkbox } from '@/components/ui/Checkbox'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import { Skeleton } from '@/components/ui/Skeleton'
import {
  useBusinessEvent,
  useEventAttendees,
  useCheckInAttendee,
  useRemoveAttendee,
  type EventAttendeeRow,
} from '@/hooks/useBusinessEvents'

function attendeeStatus(row: EventAttendeeRow) {
  if (row.checkedIn) return { label: 'Checked In', variant: 'success' as const }
  if (row.status === 'CANCELLED') return { label: 'Cancelled', variant: 'destructive' as const }
  if (row.status === 'CONFIRMED') return { label: 'Confirmed', variant: 'default' as const }
  if (row.status === 'WAITLIST') return { label: 'Waitlist', variant: 'warning' as const }
  return { label: 'Registered', variant: 'secondary' as const }
}

function exportCsv(rows: EventAttendeeRow[], filename: string) {
  const headers = [
    'Name',
    'Email',
    'Registered',
    'Tickets',
    'Amount',
    'Status',
    'CheckedIn',
  ]
  const lines = rows.map((r) => {
    const name = [r.firstName, r.lastName].filter(Boolean).join(' ')
    return [
      `"${name.replace(/"/g, '""')}"`,
      `"${r.email.replace(/"/g, '""')}"`,
      r.registeredAt,
      r.ticketsPurchased,
      r.totalPaid ?? '',
      r.status,
      r.checkedIn ? 'yes' : 'no',
    ].join(',')
  })
  const csv = [headers.join(','), ...lines].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function EventAttendeesPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: event, isLoading: evLoading } = useBusinessEvent(id)
  const { data: attendees = [], isLoading: attLoading } = useEventAttendees(id)
  const checkInMut = useCheckInAttendee()
  const removeMut = useRemoveAttendee()

  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<'registeredDesc' | 'registeredAsc' | 'name'>('registeredDesc')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const filtered = useMemo(() => {
    let rows = [...attendees]
    if (statusFilter === 'checked_in') rows = rows.filter((r) => r.checkedIn)
    else if (statusFilter === 'registered')
      rows = rows.filter((r) => !r.checkedIn && r.status === 'REGISTERED')
    else if (statusFilter === 'confirmed') rows = rows.filter((r) => r.status === 'CONFIRMED')
    else if (statusFilter === 'cancelled') rows = rows.filter((r) => r.status === 'CANCELLED')

    const q = search.trim().toLowerCase()
    if (q) {
      rows = rows.filter((r) => {
        const name = `${r.firstName || ''} ${r.lastName || ''}`.toLowerCase()
        return name.includes(q) || r.email.toLowerCase().includes(q)
      })
    }

    rows.sort((a, b) => {
      if (sort === 'name') {
        const na = `${a.firstName || ''} ${a.lastName || ''}`.localeCompare(
          `${b.firstName || ''} ${b.lastName || ''}`
        )
        return na
      }
      const ta = new Date(a.registeredAt).getTime()
      const tb = new Date(b.registeredAt).getTime()
      return sort === 'registeredAsc' ? ta - tb : tb - ta
    })
    return rows
  }, [attendees, statusFilter, search, sort])

  const toggle = (attendeeId: string) => {
    setSelected((prev) => {
      const n = new Set(prev)
      if (n.has(attendeeId)) n.delete(attendeeId)
      else n.add(attendeeId)
      return n
    })
  }

  const selectedRows = filtered.filter((r) => selected.has(r.id))

  const bulkMailto = () => {
    if (!selectedRows.length) {
      toast.message('Select at least one attendee')
      return
    }
    const emails = selectedRows.map((r) => encodeURIComponent(r.email)).join(',')
    window.open(`mailto:?bcc=${emails}`, '_blank', 'noopener,noreferrer')
  }

  const exportSelected = () => {
    const rows = selectedRows.length ? selectedRows : filtered
    exportCsv(rows, `event-${id}-attendees.csv`)
  }

  const checkedInCount = attendees.filter((a) => a.checkedIn).length

  if (evLoading || !id) {
    return (
      <div className="mx-auto max-w-6xl space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 text-white">
      <Link
        to="/business/events"
        className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Events
      </Link>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{event?.title || 'Event'}</h1>
          <p className="mt-1 text-sm text-gray-400">
            {attendees.length} registrations · {checkedInCount} checked in
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={exportSelected}>
            <Download className="mr-2 h-4 w-4" />
            Export list
          </Button>
          <Button onClick={() => navigate(`/business/events/${id}/check-in`)}>
            <UserCheck className="mr-2 h-4 w-4" />
            Check-in attendees
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-gray-800 bg-dark-card p-4 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            className="pl-9"
            placeholder="Search name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="registered">Registered</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="checked_in">Checked in</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="registeredDesc">Newest registration</SelectItem>
            <SelectItem value="registeredAsc">Oldest registration</SelectItem>
            <SelectItem value="name">Name (A–Z)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm">
          <span className="text-gray-300">{selected.size} selected</span>
          <Button size="sm" variant="outline" onClick={bulkMailto}>
            <Mail className="mr-2 h-4 w-4" />
            Email selected
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
            Clear
          </Button>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-gray-800">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="border-b border-gray-800 bg-dark-card text-gray-400">
            <tr>
              <th className="p-3 w-10">
                <Checkbox
                  checked={filtered.length > 0 && selected.size === filtered.length}
                  onCheckedChange={toggleAll}
                />
              </th>
              <th className="p-3">Attendee</th>
              <th className="p-3">Email</th>
              <th className="p-3">Registered</th>
              <th className="p-3">Tickets</th>
              <th className="p-3">Paid</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {attLoading ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-gray-500">
                  Loading…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-gray-500">
                  No attendees match your filters.
                </td>
              </tr>
            ) : (
              filtered.map((row) => {
                const st = attendeeStatus(row)
                const name = [row.firstName, row.lastName].filter(Boolean).join(' ') || 'Guest'
                return (
                  <tr key={row.id} className="border-b border-gray-800/80 hover:bg-dark-card/50">
                    <td className="p-3">
                      <Checkbox checked={selected.has(row.id)} onCheckedChange={() => toggle(row.id)} />
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Avatar src={row.avatar || undefined} fallback={name[0] || '?'} size="sm" />
                        <span className="font-medium text-white">{name}</span>
                      </div>
                    </td>
                    <td className="p-3 text-gray-400">{row.email}</td>
                    <td className="p-3 text-gray-400">
                      {(() => {
                        try {
                          return format(parseISO(row.registeredAt), 'PP p')
                        } catch {
                          return row.registeredAt
                        }
                      })()}
                    </td>
                    <td className="p-3">{row.ticketsPurchased}</td>
                    <td className="p-3">
                      {row.totalPaid != null ? `$${Number(row.totalPaid).toFixed(2)}` : '—'}
                    </td>
                    <td className="p-3">
                      <Badge variant={st.variant}>{st.label}</Badge>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            window.open(`mailto:${row.email}`, '_blank', 'noopener,noreferrer')
                          }
                        >
                          Message
                        </Button>
                        {!row.checkedIn && row.status !== 'CANCELLED' && (
                          <Button
                            size="sm"
                            variant="outline"
                            loading={checkInMut.isPending}
                            onClick={() => {
                              if (!id) return
                              checkInMut.mutate(
                                { eventId: id, attendeeId: row.id, method: 'MANUAL' },
                                {
                                  onSuccess: (d) => {
                                    if (d.alreadyCheckedIn) toast.message('Already checked in')
                                    else toast.success('Attendee checked in!')
                                  },
                                }
                              )
                            }}
                          >
                            Check in
                          </Button>
                        )}
                        {row.status !== 'CANCELLED' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-danger"
                            onClick={() => {
                              if (window.confirm('Cancel this registration?'))
                                id && removeMut.mutate({ eventId: id, attendeeId: row.id })
                            }}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
