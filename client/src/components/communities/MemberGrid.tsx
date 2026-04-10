import { Link } from 'react-router-dom'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { ChevronLeft, ChevronRight, User } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import type { CommunityMember } from '@/services/community.service'

interface MemberGridProps {
  members: CommunityMember[]
  total: number
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  isLoading?: boolean
}

export function MemberGrid({
  members,
  total,
  page,
  totalPages,
  onPageChange,
  isLoading = false,
}: MemberGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 p-4 rounded-lg bg-dark-card/50 border border-gray-800"
          >
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (members.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="h-16 w-16 rounded-full bg-gray-800 flex items-center justify-center mb-4">
          <User className="h-8 w-8 text-gray-500" />
        </div>
        <p className="text-gray-400">No members yet</p>
        <p className="text-sm text-gray-500 mt-1">Be the first to join this community!</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {members.map((member) => (
          <div
            key={member.id}
            className="flex items-center gap-4 p-4 rounded-lg bg-dark-card/50 border border-gray-800 hover:border-gray-700 transition-colors"
          >
            <Avatar
              src={member.user.avatar ?? undefined}
              alt={member.user.displayName}
              fallback={member.user.displayName?.charAt(0) || '?'}
              size="lg"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Link
                  to={`/dashboard/profile`}
                  className="font-medium text-white hover:text-primary transition-colors truncate"
                >
                  {member.user.displayName || 'Anonymous'}
                </Link>
                {member.user.role === 'WAVELEADER' && (
                  <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
                    WaveLeader
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-0.5">
                Joined {formatDistanceToNow(new Date(member.joinedAt), { addSuffix: true })}
              </p>
              <Link
                to="/dashboard/profile"
                className="text-xs text-primary hover:underline mt-1 inline-block"
              >
                View Profile
              </Link>
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <p className="text-sm text-gray-500">
            Showing {members.length} of {total} members
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-gray-400">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
