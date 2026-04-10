import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Edit2,
  Mail,
  Phone,
  Calendar,
  CheckCircle,
  MapPin,
  Star,
  Users,
  Gift,
  Award,
  FileText,
  Calendar as CalendarIcon,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { AvatarUpload } from '@/components/profile/AvatarUpload'
import { ProfileForm } from '@/components/profile/ProfileForm'
import { useProfile, useUpdateProfile, useUploadAvatar } from '@/hooks/useProfile'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatDate } from '@/lib/utils'
import { EventsWidget } from '@/components/dashboard/EventsWidget'

export default function ProfilePage() {
  const navigate = useNavigate()
  const { data: profile, isLoading } = useProfile()
  const { mutate: updateProfile, isPending: isUpdating } = useUpdateProfile()
  const { mutate: uploadAvatar, isPending: isUploadingAvatar } = useUploadAvatar()
  const [isEditing, setIsEditing] = useState(false)
  const [isEditingName, setIsEditingName] = useState(false)
  const [editedName, setEditedName] = useState({ firstName: '', lastName: '' })

  const handleSaveProfile = async (data: any) => {
    updateProfile(data, {
      onSuccess: () => {
        setIsEditing(false)
      },
    })
  }

  const handleUploadAvatar = async (file: File) => {
    uploadAvatar(file)
  }

  const handleSaveName = () => {
    if (editedName.firstName && editedName.lastName) {
      updateProfile(editedName, {
        onSuccess: () => {
          setIsEditingName(false)
        },
      })
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  if (!profile) {
    return <div className="p-6">Profile not found</div>
  }

  const memberSince = new Date(profile.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
  })

  const levelNames = ['Bronze', 'Silver', 'Gold', 'Platinum']
  const levelColors = {
    1: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    2: 'bg-gray-400/10 text-gray-400 border-gray-400/20',
    3: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    4: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  }

  return (
    <div className="p-6 space-y-6">
      {/* Profile Header */}
      <div className="relative rounded-lg overflow-hidden">
        {/* Cover Image */}
        <div className="h-48 bg-gradient-to-r from-primary to-secondary" />

        {/* Profile Info */}
        <div className="relative -mt-16 px-6 pb-6">
          <div className="flex flex-col md:flex-row items-start md:items-end gap-4">
            {/* Avatar */}
            <div className="relative">
              <AvatarUpload
                currentAvatar={profile.avatar}
                onUpload={handleUploadAvatar}
                size="lg"
              />
            </div>

            {/* Name and Info */}
            <div className="flex-1 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div>
                {isEditingName ? (
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="text"
                      value={editedName.firstName}
                      onChange={(e) => setEditedName({ ...editedName, firstName: e.target.value })}
                      className="bg-dark-card border border-gray-700 rounded px-2 py-1 text-white text-2xl font-bold w-32"
                      placeholder="First"
                    />
                    <input
                      type="text"
                      value={editedName.lastName}
                      onChange={(e) => setEditedName({ ...editedName, lastName: e.target.value })}
                      className="bg-dark-card border border-gray-700 rounded px-2 py-1 text-white text-2xl font-bold w-32"
                      placeholder="Last"
                    />
                    <Button size="sm" onClick={handleSaveName} disabled={isUpdating}>
                      Save
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => setIsEditingName(false)}>
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mb-2">
                    <h1 className="text-3xl font-bold text-white">
                      {profile.firstName && profile.lastName
                        ? `${profile.firstName} ${profile.lastName}`
                        : profile.email}
                    </h1>
                    <button
                      onClick={() => {
                        setEditedName({
                          firstName: profile.firstName || '',
                          lastName: profile.lastName || '',
                        })
                        setIsEditingName(true)
                      }}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                  <div className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    {profile.email}
                    {profile.isVerified && (
                      <CheckCircle className="h-4 w-4 text-success ml-1" />
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Member since {memberSince}
                  </div>
                  {profile.phone && (
                    <div className="flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      {profile.phone}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge
                  variant="secondary"
                  className={levelColors[profile.stats.memberLevel as keyof typeof levelColors] || levelColors[1]}
                >
                  <Award className="h-3 w-3 mr-1" />
                  {levelNames[profile.stats.memberLevel - 1] || 'Bronze'} Level
                </Badge>
                <Button
                  variant="secondary"
                  onClick={() => setIsEditing(!isEditing)}
                  className="flex items-center gap-2"
                >
                  <Edit2 className="h-4 w-4" />
                  {isEditing ? 'Cancel' : 'Edit Profile'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Personal Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <ProfileForm
                  initialData={{
                    firstName: profile.firstName || '',
                    lastName: profile.lastName || '',
                    phone: profile.phone || '',
                    bio: profile.bio || '',
                  }}
                  onSave={handleSaveProfile}
                  onCancel={() => setIsEditing(false)}
                  isLoading={isUpdating}
                />
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-400">First Name</label>
                    <p className="text-white">{profile.firstName || 'Not set'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-400">Last Name</label>
                    <p className="text-white">{profile.lastName || 'Not set'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-400">Email</label>
                    <div className="flex items-center gap-2">
                      <p className="text-white">{profile.email}</p>
                      {profile.isVerified && (
                        <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-400">Phone</label>
                    <p className="text-white">{profile.phone || 'Not set'}</p>
                  </div>
                  {profile.bio && (
                    <div>
                      <label className="text-sm font-medium text-gray-400">Bio / About</label>
                      <p className="text-white">{profile.bio}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Reviews */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Reviews</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/reviews')}>
                View All
              </Button>
            </CardHeader>
            <CardContent>
              {profile.recentReviews.length > 0 ? (
                <div className="space-y-4">
                  {profile.recentReviews.map((review) => (
                    <div key={review.id} className="border-b border-gray-800 pb-4 last:border-0 last:pb-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold text-white">{review.businessName}</p>
                          <div className="flex items-center gap-1 mt-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < review.rating ? 'text-warning fill-warning' : 'text-gray-600'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <span className="text-xs text-gray-400">
                          {formatDate(review.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-300 line-clamp-2">{review.comment}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-8">No reviews yet</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Statistics & Communities */}
        <div className="space-y-6">
          {/* Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  <span className="text-sm text-gray-400">Check-ins</span>
                </div>
                <span className="font-semibold text-white">{profile.stats.checkIns}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-primary" />
                  <span className="text-sm text-gray-400">Places Visited</span>
                </div>
                <span className="font-semibold text-white">{profile.stats.placesVisited}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <span className="text-sm text-gray-400">Reviews</span>
                </div>
                <span className="font-semibold text-white">{profile.stats.reviewsWritten}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  <span className="text-sm text-gray-400">Bookings</span>
                </div>
                <span className="font-semibold text-white">{profile.stats.bookings}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-gray-800">
                <div className="flex items-center gap-2">
                  <Gift className="h-5 w-5 text-accent" />
                  <span className="text-sm text-gray-400">Points</span>
                </div>
                <span className="font-semibold text-accent">{profile.stats.pointsEarned.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          <EventsWidget compact className="border-gray-800" />

          {/* Communities */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Communities</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/communities')}>
                Browse
              </Button>
            </CardHeader>
            <CardContent>
              {profile.communities.length > 0 ? (
                <div className="space-y-3">
                  {profile.communities.map((community) => (
                    <div key={community.id} className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                        <Users className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-white">{community.name}</p>
                        {community.description && (
                          <p className="text-xs text-gray-400 mt-1">{community.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-4">No communities joined yet</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
