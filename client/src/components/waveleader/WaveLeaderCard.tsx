import { useNavigate } from 'react-router-dom'
import { Star, MapPin, BadgeCheck } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import type { WaveLeaderDiscovery } from '@/hooks/useWaveLeaders'

interface WaveLeaderCardProps {
  waveLeader: WaveLeaderDiscovery
  showDistance?: boolean
  distance?: number
}

export function WaveLeaderCard({
  waveLeader,
  showDistance = false,
  distance,
}: WaveLeaderCardProps) {
  const navigate = useNavigate()
  const avatarUrl =
    waveLeader.avatar ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${waveLeader.id}`

  const handleClick = () => {
    navigate(`/waveleader/${waveLeader.id}/profile`)
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
      className={cn(
        'rounded-xl border border-gray-800 bg-dark-card p-4 transition-all duration-200',
        'hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-0.5',
        'cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-dark-bg'
      )}
    >
      <div className="flex items-start gap-3">
        <div className="relative shrink-0">
          <img
            src={avatarUrl}
            alt={waveLeader.displayName}
            className="h-14 w-14 rounded-full object-cover border-2 border-gray-700"
          />
          {waveLeader.isAvailable && (
            <span
              className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-dark-card"
              title="Available now"
            />
          )}
          {waveLeader.isVerified && (
            <span className="absolute -top-0.5 -right-0.5 rounded-full bg-primary p-0.5">
              <BadgeCheck className="h-3.5 w-3.5 text-white" />
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-white truncate">
              {waveLeader.displayName}
            </h3>
            {waveLeader.isVerified && (
              <span className="text-xs text-primary flex items-center gap-0.5">
                <BadgeCheck className="h-3 w-3" /> Verified
              </span>
            )}
          </div>
          <p className="text-sm text-gray-400 mt-0.5">{waveLeader.specialty}</p>
          <div className="flex items-center gap-3 mt-2 text-sm text-gray-300">
            <span className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span>
                {waveLeader.rating.toFixed(1)} ({waveLeader.totalReviews})
              </span>
            </span>
            <span className="text-primary font-medium">
              ${waveLeader.hourlyRate}/hr
            </span>
          </div>
          {waveLeader.location && (
            <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{waveLeader.location}</span>
            </div>
          )}
          {showDistance && distance != null && (
            <p className="text-xs text-gray-500 mt-0.5">
              {distance.toFixed(1)} mi away
            </p>
          )}
          <div className="flex items-center gap-2 mt-3">
            <span
              className={cn(
                'text-xs font-medium px-2 py-0.5 rounded-full',
                waveLeader.isAvailable
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-gray-700 text-gray-400'
              )}
            >
              {waveLeader.isAvailable ? 'Available' : 'Busy'}
            </span>
            <Button
              variant="secondary"
              size="sm"
              className="ml-auto"
              onClick={(e) => {
                e.stopPropagation()
                handleClick()
              }}
            >
              View Profile
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
