import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ShieldCheck, Star, MapPin, Phone, Globe, Share2, Heart } from 'lucide-react'
import { useBusiness } from '@/hooks/useBusinesses'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { MapContainer } from '@/components/map/MapContainer'
import { MapMarker } from '@/components/map/MapMarker'
import { cn } from '@/lib/utils'

function BusinessDetailSkeleton() {
  return (
    <div>
      <div className="h-64 md:h-80 w-full bg-gray-900 animate-pulse" />
      <div className="-mt-12 md:-mt-16 px-4 flex justify-center">
        <div className="w-full max-w-4xl space-y-4">
          <Card className="bg-dark-card border-gray-800">
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-4 w-64" />
              <Skeleton className="h-4 w-56" />
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function BusinessDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: business, isLoading, isError } = useBusiness(id)

  const coords = useMemo(() => {
    if (!business) return null
    const lat = (business as any).latitude ?? (business as any).location?.latitude
    const lng = (business as any).longitude ?? (business as any).location?.longitude
    if (lat === undefined || lng === undefined) return null
    const latNum = Number(lat)
    const lngNum = Number(lng)
    if (Number.isNaN(latNum) || Number.isNaN(lngNum)) return null
    return [lngNum, latNum] as [number, number]
  }, [business])

  if (isLoading) return <BusinessDetailSkeleton />

  if (isError || !business) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-bg text-white">
        <div className="text-center space-y-3">
          <p className="text-lg font-semibold">Business not found</p>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </div>
    )
  }

  const rating = (business as any).rating
  const reviewCount = (business as any).totalReviews
  const address =
    (business as any).address ??
    (business as any).location?.address ??
    (business as any).city ??
    (business as any).location?.city ??
    ''

  const phone = (business as any).phone
  const website = (business as any).website

  const hasPromos = (business as any).promotions && (business as any).promotions.length > 0
  const promos = hasPromos ? (business as any).promotions : []

  const heroImage =
    business.images && business.images.length > 0 ? business.images[0] : null

  const directionsUrl =
    coords && coords.length === 2
      ? `https://www.google.com/maps/dir/?api=1&destination=${coords[1]},${coords[0]}`
      : undefined

  return (
    <div className="min-h-screen bg-dark-bg text-white">
      {/* Hero */}
      <div className="relative h-64 md:h-80 w-full overflow-hidden">
        {heroImage ? (
          <img src={heroImage} alt={business.name} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-gradient-to-r from-primary/40 to-secondary/40" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

        <div className="absolute top-4 left-4 flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </div>

        <div className="absolute top-4 right-4 flex items-center gap-2">
          <Button variant="secondary" size="sm">
            <Heart className="h-4 w-4" />
          </Button>
          <Button variant="secondary" size="sm">
            <Share2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="absolute bottom-3 left-4">
          <Badge variant="secondary" className="text-xs">
            {business.type}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-10 -mt-12 md:-mt-16 flex justify-center">
        <div className="w-full max-w-4xl space-y-6">
          {/* Main info */}
          <Card className="bg-dark-card border-gray-800 shadow-lg">
            <CardContent className="p-6 space-y-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-white">{business.name}</h1>
                  {(business as any).isSponsored && <Badge variant="warning">Sponsored</Badge>}
                  {business.isVerified && <ShieldCheck className="h-5 w-5 text-success" />}
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <MapPin className="h-4 w-4" />
                  <span>{address || 'Location not provided'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-400">
                  {rating !== undefined && (
                    <span className="inline-flex items-center gap-1">
                      <Star className="h-4 w-4 text-warning" />
                      {Number(rating).toFixed(1)}
                    </span>
                  )}
                  {reviewCount !== undefined && (
                    <span className="text-xs text-gray-500">{reviewCount} reviews</span>
                  )}
                  {business.isVerified && (
                    <span className="text-success text-xs inline-flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3" />
                      Verified
                    </span>
                  )}
                </div>
              </div>

              <p className="text-sm text-gray-300 leading-relaxed">
                {business.description || 'No description provided.'}
              </p>

              <div className="flex flex-wrap gap-3">
                {phone && (
                  <Button variant="secondary" size="sm" onClick={() => (window.location.href = `tel:${phone}`)}>
                    <Phone className="h-4 w-4 mr-1" />
                    Call
                  </Button>
                )}
                {website && (
                  <Button variant="secondary" size="sm" onClick={() => window.open(website, '_blank')}>
                    <Globe className="h-4 w-4 mr-1" />
                    Website
                  </Button>
                )}
                {directionsUrl && (
                  <Button variant="default" size="sm" onClick={() => window.open(directionsUrl, '_blank')}>
                    Get Directions
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Promotions */}
          {hasPromos && (
            <Card className="bg-dark-card border border-accent/40">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-white">Active Promotions</p>
                  <Badge variant="secondary" className="text-xs">
                    {promos.length}
                  </Badge>
                </div>
                <div className="space-y-3">
                  {promos.map((promo: any) => (
                    <div
                      key={promo.id}
                      className="rounded-md border border-accent/30 bg-accent/10 p-3 space-y-1"
                    >
                      <p className="font-semibold text-white">{promo.title}</p>
                      {promo.description && (
                        <p className="text-xs text-gray-200">{promo.description}</p>
                      )}
                      {(promo.startDate || promo.endDate) && (
                        <p className="text-[11px] text-gray-400">
                          {promo.startDate && `From: ${new Date(promo.startDate).toLocaleDateString()}`}{" "}
                          {promo.endDate && `To: ${new Date(promo.endDate).toLocaleDateString()}`}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Location map */}
          {coords && (
            <Card className="bg-dark-card border-gray-800">
              <CardContent className="p-0">
                <div className="h-72 overflow-hidden rounded-lg">
                  <MapContainer
                    initialCenter={coords}
                    initialZoom={14}
                    showControls={false}
                    showUserLocation={false}
                    interactive={false}
                  >
                    {(map) =>
                      map && (
                        <MapMarker map={map} position={coords} type={business.type as any} isSelected />
                      )
                    }
                  </MapContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Reviews placeholder */}
          <Card className="bg-dark-card border-gray-800">
            <CardContent className="p-5">
              <p className="font-semibold text-white mb-2">Reviews</p>
              <p className="text-sm text-gray-400">Reviews coming soon.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

