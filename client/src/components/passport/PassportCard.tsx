import { Download, Share2, Waves } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { useAuthStore } from '@/store/authStore'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { PassportData } from '@/services/user.service'

// QR Code component - using a simple placeholder for now
// In production, install: npm install qrcode.react
function QRCode({ value, size = 120 }: { value: string; size?: number }) {
  // Placeholder QR code - replace with actual qrcode.react in production
  return (
    <div
      className="bg-white p-2 rounded"
      style={{ width: size, height: size }}
    >
      <div className="w-full h-full bg-gray-900 flex items-center justify-center rounded">
        <div className="text-white text-xs text-center p-2">
          <div className="font-mono text-[8px] leading-tight break-all">{value.substring(0, 20)}...</div>
          <div className="mt-1 text-[6px]">QR Code</div>
        </div>
      </div>
    </div>
  )
}

interface PassportCardProps {
  data: PassportData
  className?: string
}

const levelColors = {
  BRONZE: 'from-amber-600 to-amber-800',
  SILVER: 'from-gray-400 to-gray-600',
  GOLD: 'from-yellow-400 to-yellow-600',
  PLATINUM: 'from-purple-400 to-purple-600',
}

const levelLabels = {
  BRONZE: 'Bronze',
  SILVER: 'Silver',
  GOLD: 'Gold',
  PLATINUM: 'Platinum',
}

export function PassportCard({ data, className }: PassportCardProps) {
  const { user } = useAuthStore()
  const userName = user?.firstName && user?.lastName
    ? `${user.firstName} ${user.lastName}`
    : user?.email || 'Member'

  const userInitials = user
    ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() ||
      user.email[0].toUpperCase()
    : 'M'

  const handleDownload = () => {
    // TODO: Implement download functionality
    console.log('Download passport')
  }

  const handleShare = () => {
    // TODO: Implement share functionality
    if (navigator.share) {
      navigator.share({
        title: 'My WaveFinder Passport',
        text: `Check out my WaveFinder passport! ${data.passportId}`,
        url: window.location.href,
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      // Toast would be shown here
    }
  }

  return (
    <Card className={cn('bg-gradient-to-br border-2 border-primary/40 overflow-hidden relative', levelColors[data.level], className)}>
      {/* Watermark */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-8 right-8">
          <Waves className="h-32 w-32 text-white" />
        </div>
      </div>

      {/* Shine effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shine pointer-events-none" />

      <CardContent className="p-6 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Waves className="h-8 w-8 text-white" />
            <div>
              <h2 className="text-xl font-bold text-white">WaveFinder</h2>
              <p className="text-xs text-white/80">Digital Passport</p>
            </div>
          </div>
          <Badge
            variant="secondary"
            className="bg-white/20 text-white border-white/30 text-xs px-3 py-1"
          >
            {levelLabels[data.level]}
          </Badge>
        </div>

        {/* User Info */}
        <div className="flex items-center gap-4 mb-6">
          <Avatar
            src={user?.avatar || undefined}
            fallback={userInitials}
            size="lg"
            className="border-4 border-white/30"
          />
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white">{userName}</h3>
            <p className="text-sm text-white/80">Member since {formatDate(data.memberSince)}</p>
            <p className="text-xs text-white/60 font-mono mt-1">{data.passportId}</p>
          </div>
        </div>

        {/* QR Code */}
        <div className="flex justify-center mb-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <QRCode value={data.qrPayload} size={140} />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
            <p className="text-xs text-white/80 mb-1">Total Check-ins</p>
            <p className="text-2xl font-bold text-white">{data.totalCheckIns}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
            <p className="text-xs text-white/80 mb-1">Points Earned</p>
            <p className="text-2xl font-bold text-white">{data.totalPoints.toLocaleString()}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="flex-1 bg-white/20 hover:bg-white/30 text-white border-white/30"
            onClick={handleDownload}
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="flex-1 bg-white/20 hover:bg-white/30 text-white border-white/30"
            onClick={handleShare}
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
      </CardContent>

      <style>{`
        @keyframes shine {
          0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
          100% { transform: translateX(200%) translateY(200%) rotate(45deg); }
        }
        .animate-shine {
          animation: shine 3s infinite;
        }
      `}</style>
    </Card>
  )
}

