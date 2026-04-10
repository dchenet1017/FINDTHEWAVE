import { formatDistanceToNow } from 'date-fns'
import { Star } from 'lucide-react'
import type { WaveLeaderReview } from '@/services/waveleader.service'

interface ReviewListProps {
  reviews: WaveLeaderReview[]
  isLoading?: boolean
  onLoadMore?: () => void
  hasMore?: boolean
  emptyMessage?: string
}

function maskClientName(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 0) return 'Anonymous'
  if (parts.length === 1) return parts[0][0] + '***'
  return parts[0] + ' ' + parts[parts.length - 1][0] + '***'
}

export function ReviewList({
  reviews,
  isLoading,
  onLoadMore,
  hasMore,
  emptyMessage = 'No reviews yet',
}: ReviewListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="animate-pulse p-4 rounded-lg border border-gray-800"
          >
            <div className="h-4 w-32 bg-gray-800 rounded mb-2" />
            <div className="h-3 w-full bg-gray-800 rounded mb-2" />
            <div className="h-3 w-2/3 bg-gray-800 rounded" />
          </div>
        ))}
      </div>
    )
  }

  if (!reviews.length) {
    return (
      <div className="py-8 text-center text-gray-400">
        <p className="text-sm">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <div
          key={review.id}
          className="p-4 rounded-lg border border-gray-800 bg-dark-card/30"
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="font-medium text-white">
                {maskClientName(review.clientName)}
              </span>
              <span className="flex items-center gap-1 text-amber-400">
                <Star className="h-4 w-4 fill-amber-400" />
                {review.rating}
              </span>
            </div>
            <span className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(review.date), { addSuffix: true })}
            </span>
          </div>
          <p className="text-sm text-gray-300">{review.comment}</p>
          {review.waveLeaderResponse && (
            <div className="mt-3 pl-3 border-l-2 border-primary/50">
              <p className="text-xs text-gray-400 mb-1">WaveLeader response:</p>
              <p className="text-sm text-gray-300">{review.waveLeaderResponse}</p>
            </div>
          )}
        </div>
      ))}
      {hasMore && onLoadMore && (
        <button
          onClick={onLoadMore}
          className="w-full py-2 text-sm text-primary hover:text-primary/80 transition-colors"
        >
          Load More Reviews
        </button>
      )}
    </div>
  )
}
