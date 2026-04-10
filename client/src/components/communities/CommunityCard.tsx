import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'
import type { Community } from '@/services/community.service'

const iconMap: Record<string, string> = {
  mountain: '🏔️',
  utensils: '🍽️',
  music: '🎵',
  'laptop-code': '💻',
  dumbbell: '💪',
  palette: '🎨',
}

interface CommunityCardProps {
  community: Community
  isMember: boolean
  onJoin: () => void
  onLeave: () => void
  isLoading: boolean
}

export function CommunityCard({
  community,
  isMember,
  onJoin,
  onLeave,
  isLoading,
}: CommunityCardProps) {
  const navigate = useNavigate()
  const icon = iconMap[community.icon] || '👥'

  return (
    <Card
      className={cn(
        'group cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-lg',
        'border-l-4'
      )}
      style={{ borderLeftColor: community.color || '#6C5CE7' }}
      onClick={() => navigate(`/communities/${community.id}`)}
    >
      <CardContent className="p-6">
        <div className="flex flex-col items-center text-center space-y-4">
          <div
            className="h-20 w-20 rounded-2xl flex items-center justify-center text-4xl"
            style={{
              background: `linear-gradient(135deg, ${community.color}20, ${community.color}40)`,
            }}
          >
            {icon}
          </div>

          <div className="space-y-1">
            <h3 className="text-xl font-bold text-white">{community.name}</h3>
            <p className="text-sm text-gray-400 line-clamp-2">{community.description}</p>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {community.totalMembers} members
            </Badge>
            {isMember && (
              <Badge className="bg-primary/20 text-primary border-primary/30">
                Joined
              </Badge>
            )}
          </div>

          <div className="flex gap-2 w-full" onClick={(e) => e.stopPropagation()}>
            {isMember ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={(e) => {
                    e.stopPropagation()
                    navigate(`/communities/${community.id}`)
                  }}
                >
                  View Community
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onLeave()
                  }}
                  disabled={isLoading}
                  loading={isLoading}
                >
                  Leave
                </Button>
              </>
            ) : (
              <>
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={(e) => {
                    e.stopPropagation()
                    onJoin()
                  }}
                  disabled={isLoading}
                  loading={isLoading}
                >
                  Join
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    navigate(`/communities/${community.id}`)
                  }}
                >
                  View
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
