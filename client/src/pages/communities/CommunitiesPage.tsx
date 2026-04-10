import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCommunities, useJoinCommunity, useLeaveCommunity, useMyCommunities } from '@/hooks/useCommunities'
import { useAuthStore } from '@/store/authStore'
import { CommunityCard } from '@/components/communities/CommunityCard'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { Users, LogIn } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function CommunitiesPage() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const { data: communities = [], isLoading: communitiesLoading } = useCommunities()
  const { data: myCommunities = [], isLoading: myCommunitiesLoading } = useMyCommunities({
    enabled: isAuthenticated,
  })
  const joinCommunity = useJoinCommunity()
  const leaveCommunity = useLeaveCommunity()

  const myCommunityIds = myCommunities.map((c) => c.id)

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div
        className={cn(
          'relative overflow-hidden',
          'bg-gradient-to-br from-primary/20 via-dark-bg to-secondary/10',
          'border-b border-gray-800'
        )}
      >
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Join Communities
            </h1>
            <p className="text-lg text-gray-400 mb-6">
              Connect with like-minded people, discover WaveLeaders, and explore exclusive
              experiences in your area.
            </p>
            {!isAuthenticated && (
              <Button
                onClick={() => navigate('/login')}
                className="gap-2"
              >
                <LogIn className="h-4 w-4" />
                Sign in to join communities
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Community Grid */}
      <div className="container mx-auto px-4 py-8">
        {communitiesLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-lg" />
            ))}
          </div>
        ) : communities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="h-24 w-24 rounded-full bg-gray-800 flex items-center justify-center mb-6">
              <Users className="h-12 w-12 text-gray-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">No communities yet</h2>
            <p className="text-gray-400 max-w-md">
              Communities are being set up. Check back soon to discover and join exciting
              communities near you.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {communities.map((community) => (
              <CommunityCard
                key={community.id}
                community={community}
                isMember={myCommunityIds.includes(community.id)}
                onJoin={() =>
                  isAuthenticated
                    ? joinCommunity.mutate(community.id)
                    : navigate('/login')
                }
                onLeave={() => leaveCommunity.mutate(community.id)}
                isLoading={
                  myCommunitiesLoading ||
                  joinCommunity.isPending ||
                  leaveCommunity.isPending
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
