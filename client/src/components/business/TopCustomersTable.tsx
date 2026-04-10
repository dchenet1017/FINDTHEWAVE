import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import type { TopCustomerRow } from '@/hooks/useBusinessAnalytics'
import { formatCurrency } from '@/utils/booking'
import { formatDistanceToNow } from 'date-fns'

function displayName(firstName: string | null, lastName: string | null) {
  const f = firstName?.trim()
  const l = lastName?.trim()
  if (!f && !l) return 'Customer'
  if (f && l) return `${f} ${l[0].toUpperCase()}.`
  return f || l || 'Customer'
}

export function TopCustomersTable({
  rows = [],
  isLoading,
  pageSize = 10,
}: {
  rows?: TopCustomerRow[]
  isLoading?: boolean
  pageSize?: number
}) {
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    if (!query) return rows
    return rows.filter((r) => {
      const name = `${r.firstName || ''} ${r.lastName || ''}`.toLowerCase()
      return name.includes(query)
    })
  }, [rows, q])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const pageRows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

  return (
    <Card className="border-gray-800 bg-gray-900/40">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 space-y-0 pb-2">
        <CardTitle className="text-sm font-semibold text-white">Top Customers</CardTitle>
        <div className="w-full sm:w-[280px]">
          <Input
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              setPage(1)
            }}
            placeholder="Search customers…"
            leftIcon={<Search className="h-4 w-4" />}
            className="bg-dark-bg border-gray-700"
          />
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {isLoading ? (
          <Skeleton className="h-[320px] w-full" />
        ) : filtered.length === 0 ? (
          <div className="py-10 text-center text-sm text-gray-500">No customer data yet.</div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-lg border border-gray-800">
              <table className="w-full text-sm">
                <thead className="bg-dark-bg border-b border-gray-800">
                  <tr className="text-left text-xs uppercase tracking-wider text-gray-400">
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Total Check-ins</th>
                    <th className="px-4 py-3">Total Spent</th>
                    <th className="px-4 py-3">Last Visit</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {pageRows.map((r) => {
                    const name = displayName(r.firstName, r.lastName)
                    const initials = (r.firstName?.[0] || r.lastName?.[0] || 'C').toUpperCase()
                    const last = formatDistanceToNow(new Date(r.lastVisit), { addSuffix: true })
                    return (
                      <tr key={r.id} className="hover:bg-dark-bg/40 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar src={r.avatar || undefined} fallback={initials} size="sm" />
                            <div className="min-w-0">
                              <p className="text-white font-medium truncate">{name}</p>
                              <p className="text-xs text-gray-500">Customer</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-white font-semibold">{r.totalCheckIns}</td>
                        <td className="px-4 py-3 text-white">{formatCurrency(r.totalSpent)}</td>
                        <td className="px-4 py-3 text-gray-300">{last}</td>
                        <td className="px-4 py-3 text-right">
                          <Link to={`/business/customers?customer=${encodeURIComponent(r.id)}`}>
                            <Button size="sm" variant="secondary">
                              View Profile
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between mt-4">
              <p className="text-xs text-gray-500">
                Page {safePage} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={safePage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Prev
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={safePage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

