import { useEffect, useState } from 'react'
import { Gift, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CheckInSuccessAnimationProps {
  points: number
  businessName?: string
  showConfetti?: boolean
  onComplete?: () => void
}

export function CheckInSuccessAnimation({
  points,
  businessName,
  showConfetti = true,
  onComplete,
}: CheckInSuccessAnimationProps) {
  const [showStamp, setShowStamp] = useState(false)
  const [showPoints, setShowPoints] = useState(false)
  const [showConfettiEffect, setShowConfettiEffect] = useState(false)

  useEffect(() => {
    // Stamp animation
    setTimeout(() => setShowStamp(true), 100)
    // Points animation
    setTimeout(() => setShowPoints(true), 300)
    // Confetti
    if (showConfetti) {
      setTimeout(() => setShowConfettiEffect(true), 200)
    }
    // Complete callback
    if (onComplete) {
      setTimeout(() => onComplete(), 2000)
    }
  }, [showConfetti, onComplete])

  return (
    <div className="relative flex items-center justify-center min-h-[200px]">
      {/* Confetti effect */}
      {showConfettiEffect && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute confetti-piece"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-10px',
                animationDelay: `${Math.random() * 0.5}s`,
                animationDuration: `${1 + Math.random()}s`,
              }}
            >
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
          ))}
        </div>
      )}

      {/* Stamp animation */}
      <div
        className={cn(
          'relative transition-all duration-500',
          showStamp ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
        )}
      >
        <div className="relative">
          {/* Stamp design */}
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary to-secondary border-4 border-white shadow-2xl flex items-center justify-center">
            <div className="text-white text-center">
              <div className="text-4xl mb-1">✓</div>
              <div className="text-xs font-bold">CHECKED IN</div>
            </div>
          </div>

          {/* Perforated edge effect */}
          <div className="absolute inset-0 border-4 border-dashed border-white/50 rounded-full animate-pulse" />
        </div>
      </div>

      {/* Points floating animation */}
      {showPoints && (
        <div
          className={cn(
            'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
            'flex items-center gap-2 text-2xl font-bold text-primary',
            'animate-float-up'
          )}
        >
          <Gift className="h-6 w-6" />
          <span>+{points} points</span>
        </div>
      )}

      <style>{`
        @keyframes float-up {
          0% {
            transform: translate(-50%, -50%) translateY(0) scale(0.8);
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) translateY(-100px) scale(1.2);
            opacity: 0;
          }
        }
        .animate-float-up {
          animation: float-up 1.5s ease-out forwards;
        }
        @keyframes confetti-fall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(400px) rotate(360deg);
            opacity: 0;
          }
        }
        .confetti-piece {
          animation: confetti-fall linear forwards;
        }
      `}</style>
    </div>
  )
}

