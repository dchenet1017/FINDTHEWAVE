import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { MapPin, Star } from 'lucide-react'

export function AdPreview({
  business,
  ad,
  distanceLabel = '2.1 mi',
}: {
  business: { name: string; logoUrl?: string | null; rating?: number; locationLabel?: string | null }
  ad: { title: string; description: string; ctaText: string; imageUrl?: string | null }
  distanceLabel?: string
}) {
  const rating = business.rating ?? 4.7
  const initials = business.name?.[0]?.toUpperCase() || 'B'

  return (
    <Card className="border-gray-800 bg-gray-900/40">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar src={business.logoUrl || undefined} fallback={initials} size="sm" />
            <div className="min-w-0">
              <p className="text-white font-semibold truncate">{business.name}</p>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className="inline-flex items-center gap-1 text-amber-400">
                  <Star className="h-3.5 w-3.5 fill-amber-400" />
                  {rating.toFixed(1)}
                </span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {distanceLabel}
                </span>
              </div>
            </div>
          </div>
          <Badge variant="secondary">Promoted</Badge>
        </div>

        {ad.imageUrl ? (
          <img
            src={ad.imageUrl}
            alt=""
            className="h-36 w-full rounded-lg object-cover border border-gray-800"
          />
        ) : (
          <div className="h-36 w-full rounded-lg border border-dashed border-gray-700 bg-dark-bg/30 flex items-center justify-center text-sm text-gray-500">
            Optional ad image preview
          </div>
        )}

        <div className="space-y-1">
          <p className="text-white font-semibold">{ad.title || 'Ad title'}</p>
          <p className="text-sm text-gray-400 line-clamp-3">
            {ad.description || 'Ad description will appear here.'}
          </p>
        </div>

        <Button className="w-full">{ad.ctaText || 'Learn More'}</Button>
      </CardContent>
    </Card>
  )
}

