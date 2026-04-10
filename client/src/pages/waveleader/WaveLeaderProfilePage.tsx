import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Label } from '@/components/ui/Label'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { Slider } from '@/components/ui/Slider'
import { Switch } from '@/components/ui/Switch'
import { Badge } from '@/components/ui/Badge'
import { ProfileForm } from '@/components/waveleader/ProfileForm'
import { PortfolioUpload } from '@/components/waveleader/PortfolioUpload'
import { LocationEditModal } from '@/components/waveleader/LocationEditModal'
import { useWaveLeaderProfile } from '@/hooks/useWaveLeaderProfile'
import { useServiceArea, useUpdateServiceArea } from '@/hooks/useServiceArea'
import { useCommunities } from '@/hooks/useCommunities'
import { useUpdateWaveLeaderProfile } from '@/hooks/useWaveLeaderProfile'
import { Star, BadgeCheck, Camera, ExternalLink } from 'lucide-react'

export default function WaveLeaderProfilePage() {
  const [showLocationModal, setShowLocationModal] = useState(false)
  const { data: profile, isLoading } = useWaveLeaderProfile()
  const { data: serviceArea } = useServiceArea()
  const updateServiceArea = useUpdateServiceArea()
  const updateProfile = useUpdateWaveLeaderProfile()
  const { data: communities = [] } = useCommunities()

  const [localRadius, setLocalRadius] = useState(serviceArea?.radius ?? 10)
  const [localImages, setLocalImages] = useState<string[]>([])

  useEffect(() => {
    if (profile?.portfolioImages?.length) {
      setLocalImages(profile.portfolioImages)
    }
  }, [profile?.portfolioImages])

  const handleLocationSave = (center: [number, number], address: string) => {
    updateServiceArea.mutate({
      center,
      radius: localRadius,
    })
    updateProfile.mutate({ location: address })
    setShowLocationModal(false)
  }

  const handlePortfolioSave = () => {
    updateProfile.mutate({ portfolioImages: localImages })
  }

  return (
    <div className="space-y-8">
      {/* Profile Header */}
      <div className="flex flex-col md:flex-row md:items-center gap-6 p-6 rounded-lg bg-dark-card border border-gray-800">
        <div className="relative">
          <Avatar
            src={profile?.user?.avatar || undefined}
            fallback={profile?.displayName?.[0] ?? 'U'}
            size="lg"
            className="h-24 w-24"
          />
          <Button
            size="icon"
            variant="secondary"
            className="absolute bottom-0 right-0 h-8 w-8 rounded-full"
          >
            <Camera className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            {profile?.displayName ?? 'WaveLeader'}
            {profile?.isVerified && (
              <BadgeCheck className="h-6 w-6 text-primary" />
            )}
          </h1>
          <p className="text-gray-400 mt-1">{profile?.specialty}</p>
          <div className="flex items-center gap-4 mt-3">
            <span className="flex items-center gap-1 text-amber-400">
              <Star className="h-5 w-5 fill-amber-400" />
              {(profile?.rating ?? 0).toFixed(1)}
            </span>
            <span className="text-sm text-gray-500">
              ({profile?.totalReviews ?? 0} reviews)
            </span>
            <span className="text-sm text-gray-500">
              {profile?.totalBookings ?? 0} bookings
            </span>
          </div>
          <Link
            to={`/waveleader/${profile?.id}/profile`}
            className="inline-flex items-center gap-2 mt-4 text-primary hover:text-primary/80"
          >
            <ExternalLink className="h-4 w-4" />
            View Public Profile
          </Link>
        </div>
      </div>

      {/* Editable Sections */}
      <ProfileForm profile={profile} isLoading={isLoading} />

      {/* Portfolio */}
      <Card className="bg-dark-card border-gray-800">
        <CardHeader>
          <CardTitle className="text-lg text-white">Portfolio</CardTitle>
        </CardHeader>
        <CardContent>
          <PortfolioUpload
            images={localImages}
            onChange={setLocalImages}
          />
          <Button
            onClick={handlePortfolioSave}
            disabled={updateProfile.isPending}
            loading={updateProfile.isPending}
            className="mt-4"
          >
            Save Changes
          </Button>
        </CardContent>
      </Card>

      {/* Location & Service Area */}
      <Card className="bg-dark-card border-gray-800">
        <CardHeader>
          <CardTitle className="text-lg text-white">
            Location & Service Area
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label className="text-gray-400">Home Location</Label>
              <p className="text-white mt-1">
                {profile?.location || serviceArea?.address || 'Not set'}
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowLocationModal(true)}
                className="mt-2"
              >
                Edit Location
              </Button>
            </div>
            <div>
              <Label className="text-gray-400">Service Radius</Label>
              <Slider
                value={[localRadius]}
                onValueChange={([v]) => setLocalRadius(v)}
                min={1}
                max={25}
                step={1}
                className="mt-2"
              />
              <p className="text-sm text-gray-500 mt-1">{localRadius} miles</p>
            </div>
            <div className="flex items-center gap-2">
              <Switch id="willingToTravel" />
              <Label htmlFor="willingToTravel" className="text-gray-400">
                Willing to travel outside service area
              </Label>
            </div>
            <Button
              onClick={() =>
                serviceArea?.center &&
                updateServiceArea.mutate({ center: serviceArea.center, radius: localRadius })
              }
              disabled={updateServiceArea.isPending}
              loading={updateServiceArea.isPending}
            >
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Communities */}
      <Card className="bg-dark-card border-gray-800">
        <CardHeader>
          <CardTitle className="text-lg text-white">Communities</CardTitle>
        </CardHeader>
        <CardContent>
          {communities.length === 0 ? (
            <p className="text-gray-400">No communities yet</p>
          ) : (
            <div className="space-y-2">
              {communities.slice(0, 6).map((community) => (
                <div
                  key={community.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-800"
                >
                  <span className="text-white">{community.name}</span>
                  <Switch />
                </div>
              ))}
            </div>
          )}
          <Link to="/waveleader/communities" className="inline-block mt-4 text-primary hover:text-primary/80">
            Browse More Communities
          </Link>
        </CardContent>
      </Card>

      <LocationEditModal
        open={showLocationModal}
        onOpenChange={setShowLocationModal}
        currentCenter={serviceArea?.center ?? [-73.9857, 40.7484]}
        currentAddress={profile?.location ?? serviceArea?.address}
        onSave={handleLocationSave}
      />
    </div>
  )
}
