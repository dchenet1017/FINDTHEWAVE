import { useParams, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import {
  useCommunity,
  useCommunityMembers,
  useJoinCommunity,
  useLeaveCommunity,
  useMyCommunities,
} from '@/hooks/useCommunities'
import { useAuthStore } from '@/store/authStore'
import { MemberGrid } from '@/components/communities/MemberGrid'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { Skeleton } from '@/components/ui/Skeleton'
import {
  ArrowLeft,
  Share2,
  Users,
  UserCheck,
  Star,
  Calendar,
  LogIn,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const iconMap: Record<string, string> = {
  mountain: '🏔️',
  utensils: '🍽️',
  music: '🎵',
  'laptop-code': '💻',
  dumbbell: '💪',
  palette: '🎨',
}

export default function CommunityDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const [membersPage, setMembersPage] = useState(1)

  const { data: community, isLoading: communityLoading } = useCommunity(id)
  const { data: myCommunities = [] } = useMyCommunities({ enabled: isAuthenticated })
  const { data: membersData, isLoading: membersLoading } = useCommunityMembers(
    id,
    membersPage,
    20
  )
  const joinCommunity = useJoinCommunity()
  const leaveCommunity = useLeaveCommunity()

  const isMember = id ? myCommunities.some((c) => c.id === id) : false

  if (!id) {
    navigate('/communities')
    return null
  }

  if (communityLoading || !community) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-32 mb-6" />
        <Skeleton className="h-48 w-full rounded-lg mb-6" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    )
  }

  const icon = iconMap[community.icon] || '👥'
  const isMutating = joinCommunity.isPending || leaveCommunity.isPending

  return (
    <div className="min-h-screen">
      {/* Header Section */}
      <div
        className={cn(
          'relative overflow-hidden border-b border-gray-800',
          'bg-gradient-to-br',
          'from-dark-bg via-dark-card/50 to-dark-bg'
        )}
        style={{
          borderLeftColor: community.color,
          borderLeftWidth: '4px',
        }}
      >
        <div className="container mx-auto px-4 py-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="mb-6 gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          <div className="flex flex-col md:flex-row md:items-start gap-6">
            <div
              className="h-24 w-24 rounded-2xl flex items-center justify-center text-5xl flex-shrink-0"
              style={{
                background: `linear-gradient(135deg, ${community.color}20, ${community.color}40)`,
              }}
            >
              {icon}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h1 className="text-3xl font-bold text-white">{community.name}</h1>
                <Badge variant="secondary" className="gap-1">
                  <Users className="h-3 w-3" />
                  {community.totalMembers} members
                </Badge>
              </div>
              <p className="text-gray-400 mb-4 max-w-2xl">{community.description}</p>

              <div className="flex flex-wrap gap-2">
                {isAuthenticated ? (
                  isMember ? (
                    <Button
                      variant="outline"
                      onClick={() => leaveCommunity.mutate(id)}
                      disabled={isMutating}
                      loading={isMutating}
                    >
                      Leave Community
                    </Button>
                  ) : (
                    <Button
                      onClick={() => joinCommunity.mutate(id)}
                      disabled={isMutating}
                      loading={isMutating}
                      className="gap-2"
                    >
                      <UserCheck className="h-4 w-4" />
                      Join Community
                    </Button>
                  )
                ) : (
                  <Button onClick={() => navigate('/login')} className="gap-2">
                    <LogIn className="h-4 w-4" />
                    Sign in to join
                  </Button>
                )}
                <Button variant="ghost" size="sm" className="gap-2">
                  <Share2 className="h-4 w-4" />
                  Share
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="about" className="space-y-6">
          <TabsList className="bg-dark-card border border-gray-800">
            <TabsTrigger value="about">About</TabsTrigger>
            <TabsTrigger value="members" disabled={!isMember}>
              Members
            </TabsTrigger>
            <TabsTrigger value="waveleaders">WaveLeaders</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
          </TabsList>

          <TabsContent value="about" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-400">{community.description}</p>
                <div>
                  <h4 className="font-medium text-white mb-2">Community Guidelines</h4>
                  <ul className="list-disc list-inside text-gray-400 space-y-1 text-sm">
                    <li>Be respectful to all members</li>
                    <li>Share relevant experiences and recommendations</li>
                    <li>Connect with WaveLeaders for personalized experiences</li>
                    <li>Report any issues to community admins</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Membership Benefits</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-gray-400">
                  <li className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-primary flex-shrink-0" />
                    Exclusive access to community WaveLeaders
                  </li>
                  <li className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary flex-shrink-0" />
                    Priority booking for community events
                  </li>
                  <li className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary flex-shrink-0" />
                    Connect with like-minded members
                  </li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="members" className="space-y-6">
            {isMember ? (
              <MemberGrid
                members={membersData?.members ?? []}
                total={membersData?.pagination?.total ?? 0}
                page={membersData?.pagination?.page ?? membersPage}
                totalPages={membersData?.pagination?.totalPages ?? 0}
                onPageChange={setMembersPage}
                isLoading={membersLoading}
              />
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-gray-400">Join this community to see members.</p>
                  <Button
                    className="mt-4"
                    onClick={() => joinCommunity.mutate(id)}
                    disabled={isMutating}
                    loading={isMutating}
                  >
                    Join Community
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="waveleaders" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>WaveLeaders</CardTitle>
                <p className="text-sm text-gray-400">
                  WaveLeaders assigned to this community
                </p>
              </CardHeader>
              <CardContent>
                {community.waveLeaders && community.waveLeaders.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {community.waveLeaders.map((wl) => (
                      <div
                        key={wl.id}
                        className="flex items-center gap-4 p-4 rounded-lg bg-dark-bg border border-gray-800"
                      >
                        <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center text-lg">
                          {wl.avatar ? (
                            <img
                              src={wl.avatar}
                              alt={wl.displayName}
                              className="h-full w-full rounded-full object-cover"
                            />
                          ) : (
                            wl.displayName?.charAt(0) || '?'
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white">{wl.displayName}</p>
                          <p className="text-sm text-gray-500">{wl.specialty}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge
                              variant={wl.isAvailable ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {wl.isAvailable ? 'Available' : 'Unavailable'}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              ⭐ {wl.rating.toFixed(1)}
                            </span>
                          </div>
                        </div>
                        <Button size="sm">Book</Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 py-8 text-center">
                    No WaveLeaders assigned to this community yet.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="events" className="space-y-6">
            <Card>
              <CardContent className="py-16 text-center">
                <Calendar className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">
                  Community Events
                </h3>
                <p className="text-gray-400 max-w-md mx-auto">
                  Upcoming community events will appear here. This feature is coming in
                  Milestone 8.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
