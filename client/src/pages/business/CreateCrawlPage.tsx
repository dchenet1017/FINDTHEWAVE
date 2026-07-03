import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { GripVertical, MapPinned, Search, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Label } from '@/components/ui/Label'
import { Skeleton } from '@/components/ui/Skeleton'
import api from '@/lib/axios'
import {
  useBusinessCrawl,
  useCreateCrawl,
  useUpdateCrawl,
  type CreateCrawlData,
} from '@/hooks/useBusinessCrawls'

interface StopCandidate {
  id: string
  name: string
  type?: string
  city?: string
}

function toLocalInput(iso: string | undefined): string {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  } catch {
    return ''
  }
}

export default function CreateCrawlPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const { data: existing, isLoading: existingLoading } = useBusinessCrawl(id, isEdit)
  const createMut = useCreateCrawl()
  const updateMut = useUpdateCrawl()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [maxAttendees, setMaxAttendees] = useState('')
  const [bonusPoints, setBonusPoints] = useState('50')
  const [stops, setStops] = useState<StopCandidate[]>([])
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<StopCandidate[]>([])
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isEdit || !existing) return
    setTitle(existing.title)
    setDescription(existing.description)
    setStartDate(toLocalInput(existing.startDate))
    setEndDate(toLocalInput(existing.endDate))
    setMaxAttendees(existing.maxAttendees != null ? String(existing.maxAttendees) : '')
    setBonusPoints(String(existing.bonusPoints))
    setStops(
      existing.stops
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((s) => ({
          id: s.businessId,
          name: s.business?.name || 'Unknown business',
          type: s.business?.type,
          city: s.business?.city ?? undefined,
        }))
    )
  }, [isEdit, existing])

  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) {
      setResults([])
      return
    }
    setSearching(true)
    const handle = setTimeout(() => {
      api
        .get('/businesses/search', { params: { q } })
        .then((res) => {
          const body = res.data?.data ?? []
          setResults(Array.isArray(body) ? body.slice(0, 10) : [])
        })
        .catch(() => setResults([]))
        .finally(() => setSearching(false))
    }, 300)
    return () => clearTimeout(handle)
  }, [query])

  const stopIds = useMemo(() => new Set(stops.map((s) => s.id)), [stops])

  const addStop = (b: StopCandidate) => {
    if (stopIds.has(b.id)) return
    setStops((prev) => [...prev, b])
    setQuery('')
    setResults([])
  }

  const removeStop = (id: string) => setStops((prev) => prev.filter((s) => s.id !== id))

  const moveStop = (index: number, dir: -1 | 1) => {
    setStops((prev) => {
      const next = [...prev]
      const target = index + dir
      if (target < 0 || target >= next.length) return prev
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  const submit = (publishMode: 'draft' | 'publish') => {
    setError(null)
    if (!title.trim()) return setError('Title is required')
    if (!startDate || !endDate) return setError('Start and end date/time are required')
    if (stops.length < 2) return setError('A crawl needs at least 2 stops')

    const payload: CreateCrawlData = {
      title: title.trim(),
      description: description.trim(),
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      maxAttendees: maxAttendees ? Number(maxAttendees) : null,
      bonusPoints: bonusPoints ? Number(bonusPoints) : 50,
      stopBusinessIds: stops.map((s) => s.id),
      publishMode,
    }

    if (isEdit && id) {
      updateMut.mutate(
        { id, payload },
        { onSuccess: () => navigate('/business/crawls') }
      )
    } else {
      createMut.mutate(payload, { onSuccess: () => navigate('/business/crawls') })
    }
  }

  if (isEdit && existingLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    )
  }

  const saving = createMut.isPending || updateMut.isPending

  return (
    <div className="mx-auto max-w-2xl space-y-8 pb-16 text-white">
      <div>
        <h1 className="text-2xl font-bold">{isEdit ? 'Edit Crawl' : 'Create a Bar Crawl'}</h1>
        <p className="mt-1 text-sm text-gray-400">
          Pick the businesses your customers will visit, in order. They check in at each stop and
          earn a bonus for finishing.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Friday Night Crawl" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What's the vibe? What should people expect at each stop?"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="startDate">Starts</Label>
          <Input
            id="startDate"
            type="datetime-local"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">Ends</Label>
          <Input
            id="endDate"
            type="datetime-local"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="maxAttendees">Max attendees (optional)</Label>
          <Input
            id="maxAttendees"
            type="number"
            min={1}
            value={maxAttendees}
            onChange={(e) => setMaxAttendees(e.target.value)}
            placeholder="No limit"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bonusPoints">Completion bonus (points)</Label>
          <Input
            id="bonusPoints"
            type="number"
            min={0}
            value={bonusPoints}
            onChange={(e) => setBonusPoints(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-3">
        <Label>Stops (in order)</Label>
        <ul className="space-y-2">
          {stops.map((s, i) => (
            <li
              key={s.id}
              className="flex items-center gap-3 rounded-lg border border-gray-800 bg-dark-card px-3 py-2"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-semibold text-primary">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{s.name}</p>
                {s.city && <p className="text-xs text-gray-500">{s.city}</p>}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={i === 0}
                  onClick={() => moveStop(i, -1)}
                  aria-label="Move up"
                >
                  <GripVertical className="h-3.5 w-3.5 rotate-90" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 text-danger"
                  onClick={() => removeStop(s.id)}
                  aria-label="Remove stop"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </li>
          ))}
          {stops.length === 0 && (
            <li className="rounded-lg border border-dashed border-gray-700 px-3 py-6 text-center text-sm text-gray-500">
              No stops added yet. Search below to add at least 2.
            </li>
          )}
        </ul>

        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            className="pl-9"
            placeholder="Search businesses to add as a stop..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        {searching && <p className="text-xs text-gray-500">Searching…</p>}
        {results.length > 0 && (
          <ul className="space-y-1 rounded-lg border border-gray-800 p-2">
            {results.map((b) => (
              <li key={b.id}>
                <button
                  type="button"
                  disabled={stopIds.has(b.id)}
                  onClick={() => addStop(b)}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left hover:bg-gray-800/80 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <span className="flex items-center gap-2">
                    <MapPinned className="h-4 w-4 text-gray-500" />
                    {b.name}
                  </span>
                  <span className="text-xs text-gray-500">{b.city}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-col gap-3 border-t border-gray-800 pt-6 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" loading={saving} onClick={() => submit('draft')}>
          Save as draft
        </Button>
        <Button type="button" loading={saving} onClick={() => submit('publish')}>
          Publish crawl
        </Button>
      </div>
    </div>
  )
}
