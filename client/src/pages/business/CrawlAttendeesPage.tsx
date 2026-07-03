import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Search, Trophy, UserCheck } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { Skeleton } from '@/components/ui/Skeleton'
import { useBusinessCrawl, useCrawlAttendees } from '@/hooks/useBusinessCrawls'

export default function CrawlAttendeesPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: crawl, isLoading: crawlLoading } = useBusinessCrawl(id)
  const { data: attendees = [], isLoading: attLoading } = useCrawlAttendees(id)
  const [search, setSearch] = useState('')

  const totalStops = crawl?.stops.length ?? 0

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return attendees
    return attendees.filter((r) => {
      const name = `${r.firstName || ''} ${r.lastName || ''}`.toLowerCase()
      return name.includes(q) || r.email.toLowerCase().includes(q)
    })
  }, [attendees, search])

  const completedCount = attendees.filter((a) => a.bonusAwarded).length

  if (crawlLoading || !id) {
    return (
      <div className="mx-auto max-w-5xl space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 text-white">
      <Link to="/business/crawls" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white">
        <ArrowLeft className="h-4 w-4" />
        Crawls
      </Link>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{crawl?.title || 'Crawl'}</h1>
          <p className="mt-1 text-sm text-gray-400">
            {attendees.length} registered · {completedCount} completed all {totalStops} stops
          </p>
        </div>
        <Button onClick={() => navigate(`/business/crawls/${id}/check-in`)}>
          <UserCheck className="mr-2 h-4 w-4" />
          Check in attendees
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
        <Input
          className="pl-9"
          placeholder="Search name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-800">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead className="border-b border-gray-800 bg-dark-card text-gray-400">
            <tr>
              <th className="p-3">Attendee</th>
              <th className="p-3">Registered</th>
              <th className="p-3">Progress</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {attLoading ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-gray-500">
                  Loading…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-gray-500">
                  No attendees match your search.
                </td>
              </tr>
            ) : (
              filtered.map((row) => {
                const name = [row.firstName, row.lastName].filter(Boolean).join(' ') || 'Guest'
                return (
                  <tr key={row.id} className="border-b border-gray-800/80 hover:bg-dark-card/50">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Avatar src={row.avatar || undefined} fallback={name[0] || '?'} size="sm" />
                        <div>
                          <p className="font-medium text-white">{name}</p>
                          <p className="text-xs text-gray-500">{row.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-gray-400">
                      {(() => {
                        try {
                          return format(parseISO(row.registeredAt), 'PP p')
                        } catch {
                          return row.registeredAt
                        }
                      })()}
                    </td>
                    <td className="p-3 text-gray-400">
                      {row.stopsCompleted} / {totalStops} stops
                    </td>
                    <td className="p-3">
                      {row.status === 'CANCELLED' ? (
                        <Badge variant="destructive">Cancelled</Badge>
                      ) : row.bonusAwarded ? (
                        <Badge className="bg-primary/20 text-primary border-primary/30">
                          <Trophy className="mr-1 h-3 w-3" />
                          Completed
                        </Badge>
                      ) : (
                        <Badge variant="secondary">In progress</Badge>
                      )}
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
