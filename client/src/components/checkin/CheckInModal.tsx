import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Gift, MapPin, Sparkles } from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { CheckInSuccessAnimation } from './CheckInSuccessAnimation'

interface CheckInModalProps {
  open: boolean
  onClose: () => void
  businessName: string
  businessLogo?: string
  pointsEarned: number
  totalPoints: number
  streak?: number
  businessId?: string
}

export function CheckInModal({
  open,
  onClose,
  businessName,
  businessLogo,
  pointsEarned,
  totalPoints,
  streak,
  businessId,
}: CheckInModalProps) {
  const navigate = useNavigate()
  const [animationComplete, setAnimationComplete] = useState(false)

  const handleViewPassport = () => {
    onClose()
    navigate('/dashboard/passport')
  }

  const handleContinue = () => {
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">

        {/* Success Animation */}
        <div className="mb-6">
          <CheckInSuccessAnimation
            points={pointsEarned}
            businessName={businessName}
            showConfetti={true}
            onComplete={() => setAnimationComplete(true)}
          />
        </div>

        {/* Business Info */}
        <div className="text-center mb-6">
          {businessLogo ? (
            <img
              src={businessLogo}
              alt={businessName}
              className="h-16 w-16 rounded-full mx-auto mb-3 object-cover border-2 border-primary"
            />
          ) : (
            <div className="h-16 w-16 rounded-full mx-auto mb-3 bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <MapPin className="h-8 w-8 text-white" />
            </div>
          )}
          <h3 className="text-xl font-bold text-white mb-1">{businessName}</h3>
          <p className="text-sm text-gray-400">Successfully checked in!</p>
        </div>

        {/* Points Info */}
        <div className="bg-dark-bg rounded-lg p-4 mb-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Points Earned</span>
            <div className="flex items-center gap-2">
              <Gift className="h-4 w-4 text-primary" />
              <span className="font-bold text-primary">+{pointsEarned}</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Total Points</span>
            <span className="font-semibold text-white">{totalPoints.toLocaleString()}</span>
          </div>
          {streak && streak > 1 && (
            <div className="flex items-center justify-between pt-2 border-t border-gray-800">
              <span className="text-sm text-gray-400 flex items-center gap-1">
                <Sparkles className="h-4 w-4 text-accent" />
                Current Streak
              </span>
              <Badge variant="secondary" className="bg-accent/10 text-accent border-accent/20">
                {streak} days
              </Badge>
            </div>
          )}
        </div>

        {/* Actions */}
        {animationComplete && (
          <div className="flex flex-col gap-2">
            <Button onClick={handleViewPassport} className="w-full">
              View Passport
            </Button>
            <Button variant="secondary" onClick={handleContinue} className="w-full">
              Continue Exploring
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

