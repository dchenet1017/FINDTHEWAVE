import { useParams, Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { PortfolioGallery } from '@/components/waveleader/PortfolioGallery'
import { ReviewList } from '@/components/waveleader/ReviewList'
import { BookingCalendar } from '@/components/waveleader/BookingCalendar'
import { MapWidget } from '@/components/map/MapWidget'
import {
  usePublicWaveLeaderProfile,
  useWaveLeaderReviews,
} from '@/hooks/useWaveLeaderProfile'
import { Star, BadgeCheck, MapPin } from 'lucide-react'

export default function PublicWaveLeaderProfilePage() {
  const { id } = useParams<{ id: string }>()
  const { data: profile, isLoading } = usePublicWaveLeaderProfile(id)
  const { data: reviewsData, isLoading: reviewsLoading } = useWaveLeaderReviews(
    id,
    1
  )

  const reviews = reviewsData?.reviews ?? []
  const totalReviews = reviewsData?.total ?? 0

  if (isLoading || !profile) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  const center: [number, number] | undefined =
    profile.longitude != null && profile.latitude != null
      ? [profile.longitude, profile.latitude]
      : undefined

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-primary/20 via-dark-card to-dark-bg border border-gray-800">
        <div className="h-32 sm:h-40 bg-gradient-to-r from-primary/30 to-transparent" />
        <div className="relative px-6 pb-6 -mt-16">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <Avatar
              src={profile.user?.avatar || undefined}
              fallback={profile.displayName?.[0] ?? 'U'}
              size="lg"
              className="h-24 w-24 rounded-full border-4 border-dark-card"
            />
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                {profile.displayName}
                {profile.isVerified && (
                  <BadgeCheck className="h-8 w-8 text-primary" />
                )}
              </h1>
              <p className="text-gray-400 mt-1">{profile.specialty}</p>
              <div className="flex items-center gap-4 mt-2">
                <span className="flex items-center gap-1 text-amber-400">
                  <Star className="h-5 w-5 fill-amber-400" />
                  {profile.rating.toFixed(1)}
                </span>
                <span className="text-sm text-gray-500">
                  ({profile.totalReviews} reviews)
                </span>
                {profile.location && (
                  <span className="flex items-center gap-1 text-sm text-gray-400">
                    <MapPin className="h-4 w-4" />
                    {profile.location}
                  </span>
                )}
              </div>
              <Button size="lg" className="mt-4">
                Book Now
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* About Section */}
      <Card className="bg-dark-card border-gray-800">
        <CardHeader>
          <CardTitle className="text-lg text-white">About</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-300">{profile.description}</p>
          {profile.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {profile.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
          <div className="flex flex-wrap gap-6 text-sm">
            <div>
              <span className="text-gray-500">Hourly Rate:</span>
              <span className="text-white ml-2">${profile.hourlyRate}/hr</span>
            </div>
            <div>
              <span className="text-gray-500">Response Rate:</span>
              <span className="text-white ml-2">95%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-dark-card border-gray-800">
          <CardContent className="pt-6">
            <p className="text-2xl font-bold text-white">
              {profile.totalBookings}
            </p>
            <p className="text-sm text-gray-500">Total Bookings</p>
          </CardContent>
        </Card>
        <Card className="bg-dark-card border-gray-800">
          <CardContent className="pt-6">
            <p className="text-2xl font-bold text-white">—</p>
            <p className="text-sm text-gray-500">Member Since</p>
          </CardContent>
        </Card>
        <Card className="bg-dark-card border-gray-800">
          <CardContent className="pt-6">
            <p className="text-2xl font-bold text-white">&lt;1 hr</p>
            <p className="text-sm text-gray-500">Response Time</p>
          </CardContent>
        </Card>
        <Card className="bg-dark-card border-gray-800">
          <CardContent className="pt-6">
            <p className="text-2xl font-bold text-white">
              {profile.communities?.length ?? 0}
            </p>
            <p className="text-sm text-gray-500">Communities</p>
          </CardContent>
        </Card>
      </div>

      {/* Portfolio Gallery */}
      {profile.portfolioImages?.length > 0 && (
        <Card className="bg-dark-card border-gray-800">
          <CardHeader>
            <CardTitle className="text-lg text-white">Portfolio</CardTitle>
          </CardHeader>
          <CardContent>
            <PortfolioGallery images={profile.portfolioImages} />
          </CardContent>
        </Card>
      )}

      {/* Reviews Section */}
      <Card className="bg-dark-card border-gray-800">
        <CardHeader>
          <CardTitle className="text-lg text-white">Reviews</CardTitle>
          <p className="text-sm text-gray-400">
            {profile.rating.toFixed(1)} • {profile.totalReviews} reviews
          </p>
        </CardHeader>
        <CardContent>
          <ReviewList
            reviews={reviews}
            isLoading={reviewsLoading}
            hasMore={totalReviews > reviews.length}
            onLoadMore={() => {}}
          />
        </CardContent>
      </Card>

      {/* Service Area Map */}
      {center && (
        <Card className="bg-dark-card border-gray-800">
          <CardHeader>
            <CardTitle className="text-lg text-white">Service Area</CardTitle>
            <p className="text-sm text-gray-400">
              This WaveLeader serves a 10 mile radius
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] rounded-lg overflow-hidden">
              <MapWidget
                center={center}
                title="Service Area"
                size="medium"
                markers={[]}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Book Section */}
      <Card className="bg-dark-card border-gray-800">
        <CardHeader>
          <CardTitle className="text-lg text-white">
            Book This WaveLeader
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-6">
          <div className="flex-1">
            <BookingCalendar waveLeaderId={profile.id} />
          </div>
          <div className="flex-1 flex flex-col justify-center">
            <Button size="lg" className="w-full">
              Check Availability & Book
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Related WaveLeaders placeholder */}
      <Card className="bg-dark-card border-gray-800">
        <CardHeader>
          <CardTitle className="text-lg text-white">
            Similar WaveLeaders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-400">
            Similar WaveLeaders coming soon
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
