import { useMemo, useState } from 'react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Calendar, CheckCircle, Clock, MapPin, MapPinned, Search, Trophy, Users, XCircle } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import api from '@/lib/axios'
import type { Crawl } from '@/types/crawl'

function unwrap<T>(data: unknown): T {
  const r = data as { success?: boolean; data?: T }
  if (r?.success && r?.data != null) return r.data
  return data as T
}

const STATUS_VARIANTS: Record<string, 'success' | 'warning' | 'destructive' | 'secondary'> = {
  PUBLISHED: 'success',
  DRAFT: 'warning',
  CANCELLED: 'destructive',
  COMPLETED: 'secondary',
}

function useAdminCrawls(status: string) {
  return useQuery({
    queryKey: ['admin', 'crawls', status],
    queryFn: async (): Promise<Crawl[]> => {
      const { data } = await api.get('/admin/crawls', { params: status === 'all' ? {} : { status } })
      return unwrap<Crawl[]>(data) ?? []
    },
  })
}

export default function AdminCrawlsPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const queryClient = useQueryClient()
  const { data: crawls = [], isLoading } = useAdminCrawls(statusFilter)

  const publishMut = useMutation({
    mutationFn: (id: string) => api.post(`/admin/crawls/${id}/publish`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'crawls'] })
      toast.success('Crawl published')
    },
    onError: () => toast.error('Could not publish crawl'),
  })

  const cancelMut = useMutation({
    mutationFn: (id: string) => api.post(`/admin/crawls/${id}/cancel`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'crawls'] })
      toast.success('Crawl cancelled')
    },
    onError: () => toast.error('Could not cancel crawl'),
  })

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return crawls
    return crawls.filter(
      (c) => c.title.toLowerCase().includes(q) || c.hostBusiness?.name?.toLowerCase().includes(q)
    )
  }, [crawls, search])

  const totalAttendees = crawls.reduce((sum, c) => sum + c.currentAttendees, 0)
  const publishedCount = crawls.filter((c) => c.status === 'PUBLISHED').length
  const draftCount = crawls.filter((c) => c.status === 'DRAFT').length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Bar Crawls</h1>
        <p className="text-gray-400 mt-1">Monitor and manage all bar crawls across the platform</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Crawls', value: crawls.length, icon: MapPinned, color: 'text-primary' },
          { label: 'Published', value: publishedCount, icon: CheckCircle, color: 'text-green-500' },
          { label: 'Drafts', value: draftCount, icon: Clock, color: 'text-yellow-500' },
          { label: 'Total Attendees', value: totalAttendees, icon: Users, color: 'text-secondary' },
        ].map((s) => (
          <Card key={s.label} className="bg-dark-card border-gray-800">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">{s.label}</p>
                  <p className="text-2xl font-bold text-white">{s.value.toLocaleString()}</p>
                </div>
                <s.icon className={`h-8 w-8 ${s.color} opacity-80`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-dark-card border-gray-800">
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1">
              <Input
                placeholder="Search crawls or host businesses..."
                leftIcon={<Search className="h-4 w-4" />}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-dark-bg border-gray-700"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PUBLISHED">Published</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-dark-card border-gray-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-base">
            {isLoading ? 'Loading…' : `${filtered.length} crawl${filtered.length !== 1 ? 's' : ''} found`}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400">
                  <th className="text-left px-6 py-3 font-medium">Crawl</th>
                  <th className="text-left px-6 py-3 font-medium">Host</th>
                  <th className="text-left px-6 py-3 font-medium">Date</th>
                  <th className="text-left px-6 py-3 font-medium">Stops</th>
                  <th className="text-left px-6 py-3 font-medium">Attendees</th>
                  <th className="text-left px-6 py-3 font-medium">Bonus</th>
                  <th className="text-left px-6 py-3 font-medium">Status</th>
                  <th className="text-left px-6 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-dark-bg/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <MapPinned className="h-5 w-5 text-primary" />
                        </div>
                        <p className="font-medium text-white">{c.title}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-200">
                        {c.hostBusiness?.name ||
                          (c.createdByUser
                            ? `${c.createdByUser.firstName ?? ''} ${c.createdByUser.lastName ?? ''} (Admin)`
                            : '—')}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-white">
                        <Calendar className="h-3.5 w-3.5 text-gray-400" />
                        {(() => {
                          try {
                            return format(parseISO(c.startDate), 'PP')
                          } catch {
                            return c.startDate
                          }
                        })()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-white">
                        <MapPin className="h-3.5 w-3.5 text-gray-400" />
                        {c.stops.length}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-white">
                      {c.currentAttendees}
                      {c.maxAttendees != null ? ` / ${c.maxAttendees}` : ''}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-white">
                        <Trophy className="h-3.5 w-3.5 text-gray-400" />+{c.bonusPoints}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={STATUS_VARIANTS[c.status] || 'secondary'}>{c.status}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {c.status === 'DRAFT' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-400 hover:text-white"
                            loading={publishMut.isPending}
                            onClick={() => publishMut.mutate(c.id)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Publish
                          </Button>
                        )}
                        {c.status !== 'CANCELLED' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-danger hover:text-danger"
                            loading={cancelMut.isPending}
                            onClick={() => {
                              if (window.confirm('Cancel this crawl?')) cancelMut.mutate(c.id)
                            }}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Cancel
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!isLoading && filtered.length === 0 && (
              <div className="py-16 text-center text-gray-400">
                <MapPinned className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p>No crawls match your filters</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
