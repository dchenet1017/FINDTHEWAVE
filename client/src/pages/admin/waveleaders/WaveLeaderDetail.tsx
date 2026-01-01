import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Star, DollarSign, Calendar, CheckCircle, XCircle, MapPin, Phone, Mail, Globe, Edit, Shield, Ban } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { adminService } from '@/services/admin.service'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import { toast } from 'sonner'

export default function WaveLeaderDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: waveLeader, isLoading } = useQuery({
    queryKey: ['admin', 'waveleader', id],
    queryFn: () => adminService.getWaveLeader(id!),
    enabled: !!id,
  })

  const verifyMutation = useMutation({
    mutationFn: () => adminService.verifyWaveLeader(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'waveleader', id] })
      toast.success('WaveLeader verified successfully')
    },
    onError: () => {
      toast.error('Failed to verify WaveLeader')
    },
  })

  const suspendMutation = useMutation({
    mutationFn: () => adminService.suspendWaveLeader(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'waveleader', id] })
      toast.success('WaveLeader suspended successfully')
    },
    onError: () => {
      toast.error('Failed to suspend WaveLeader')
    },
  })

  const activateMutation = useMutation({
    mutationFn: () => adminService.activateWaveLeader(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'waveleader', id] })
      toast.success('WaveLeader activated successfully')
    },
    onError: () => {
      toast.error('Failed to activate WaveLeader')
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!waveLeader) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">WaveLeader not found</p>
        <Button onClick={() => navigate('/admin/waveleaders')} className="mt-4">
          Back to WaveLeaders
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/admin/waveleaders')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold text-white">WaveLeader Details</h1>
      </div>

      {/* Profile Header */}
      <Card className="bg-dark-card border-gray-800">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <Avatar
                src={waveLeader.user.avatar}
                alt={waveLeader.displayName}
                fallback={waveLeader.displayName.charAt(0)}
                className="h-20 w-20"
              />
              <div>
                <h2 className="text-2xl font-bold text-white">{waveLeader.displayName}</h2>
                <p className="text-gray-400">{waveLeader.specialty}</p>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span className="text-white">{waveLeader.rating.toFixed(1)}</span>
                    <span className="text-gray-400 text-sm">({waveLeader.totalReviews} reviews)</span>
                  </div>
                  {waveLeader.location && (
                    <div className="flex items-center gap-1 text-gray-400">
                      <MapPin className="h-4 w-4" />
                      <span className="text-sm">{waveLeader.location}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {waveLeader.isVerified ? (
                <Badge variant="success" className="py-1 px-3">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Verified
                </Badge>
              ) : (
                <Badge variant="warning" className="py-1 px-3">
                  Pending Verification
                </Badge>
              )}
              {!waveLeader.isAvailable && (
                <Badge variant="destructive" className="py-1 px-3">
                  <Ban className="h-4 w-4 mr-1" />
                  Suspended
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-dark-card border-gray-800">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Total Bookings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-white">{waveLeader.totalBookings}</p>
          </CardContent>
        </Card>

        <Card className="bg-dark-card border-gray-800">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total Earnings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-white">{formatCurrency(waveLeader.totalEarnings || 0)}</p>
          </CardContent>
        </Card>

        <Card className="bg-dark-card border-gray-800">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Hourly Rate
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-white">{formatCurrency(waveLeader.hourlyRate)}/hr</p>
          </CardContent>
        </Card>

        <Card className="bg-dark-card border-gray-800">
          <CardHeader className="pb-2">
            <CardDescription>Member Since</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-white">{formatDate(waveLeader.createdAt)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="info" className="space-y-6">
        <TabsList className="bg-dark-card border-gray-800">
          <TabsTrigger value="info">Information</TabsTrigger>
          <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
          <TabsTrigger value="bookings">Recent Bookings</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          <TabsTrigger value="communities">Communities</TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <Card className="bg-dark-card border-gray-800">
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-400 mb-1">Description</h4>
                <p className="text-white">{waveLeader.description}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-1">Contact Information</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-white">
                      <Mail className="h-4 w-4 text-gray-400" />
                      {waveLeader.user.email}
                    </div>
                    {waveLeader.user.phone && (
                      <div className="flex items-center gap-2 text-white">
                        <Phone className="h-4 w-4 text-gray-400" />
                        {waveLeader.user.phone}
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-1">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {waveLeader.tags?.map((tag: string) => (
                      <Badge key={tag} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="portfolio">
          <Card className="bg-dark-card border-gray-800">
            <CardHeader>
              <CardTitle>Portfolio Gallery</CardTitle>
            </CardHeader>
            <CardContent>
              {waveLeader.portfolioImages?.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {waveLeader.portfolioImages.map((image: string, index: number) => (
                    <img
                      key={index}
                      src={image}
                      alt={`Portfolio ${index + 1}`}
                      className="rounded-lg aspect-square object-cover"
                    />
                  ))}
                </div>
              ) : (
                <p className="text-gray-400">No portfolio images uploaded</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bookings">
          <Card className="bg-dark-card border-gray-800">
            <CardHeader>
              <CardTitle>Recent Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              {waveLeader.recentBookings?.length > 0 ? (
                <div className="space-y-4">
                  {waveLeader.recentBookings.map((booking: any) => (
                    <div key={booking.id} className="flex items-center justify-between p-4 rounded-lg bg-dark-bg">
                      <div>
                        <p className="font-medium text-white">{booking.user.firstName} {booking.user.lastName}</p>
                        <p className="text-sm text-gray-400">{formatDate(booking.scheduledDate)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-white">{formatCurrency(booking.totalAmount)}</p>
                        <Badge variant={booking.status === 'COMPLETED' ? 'success' : 'secondary'}>
                          {booking.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400">No recent bookings</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviews">
          <Card className="bg-dark-card border-gray-800">
            <CardHeader>
              <CardTitle>Customer Reviews</CardTitle>
            </CardHeader>
            <CardContent>
              {waveLeader.reviews?.length > 0 ? (
                <div className="space-y-4">
                  {waveLeader.reviews.map((review: any) => (
                    <div key={review.id} className="p-4 rounded-lg bg-dark-bg">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium text-white">{review.user.firstName} {review.user.lastName}</p>
                          <div className="flex items-center gap-1 mt-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={cn(
                                  'h-4 w-4',
                                  i < review.rating ? 'text-yellow-500 fill-current' : 'text-gray-600'
                                )}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-gray-400">{formatDate(review.createdAt)}</p>
                      </div>
                      <p className="text-gray-300">{review.comment}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400">No reviews yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="communities">
          <Card className="bg-dark-card border-gray-800">
            <CardHeader>
              <CardTitle>Community Assignments</CardTitle>
            </CardHeader>
            <CardContent>
              {waveLeader.communities?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {waveLeader.communities.map((community: any) => (
                    <div key={community.id} className="flex items-center gap-3 p-4 rounded-lg bg-dark-bg">
                      <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-primary font-bold">{community.name.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="font-medium text-white">{community.name}</p>
                        <p className="text-sm text-gray-400">Assigned {formatDate(community.assignedAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400">Not assigned to any communities</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Actions */}
      <Card className="bg-dark-card border-gray-800">
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {!waveLeader.isVerified && (
              <Button
                onClick={() => verifyMutation.mutate()}
                disabled={verifyMutation.isPending}
              >
                <Shield className="h-4 w-4 mr-2" />
                Verify WaveLeader
              </Button>
            )}
            
            {waveLeader.isAvailable ? (
              <Button
                variant="destructive"
                onClick={() => suspendMutation.mutate()}
                disabled={suspendMutation.isPending}
              >
                <Ban className="h-4 w-4 mr-2" />
                Suspend Account
              </Button>
            ) : (
              <Button
                variant="secondary"
                onClick={() => activateMutation.mutate()}
                disabled={activateMutation.isPending}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Activate Account
              </Button>
            )}
            
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
