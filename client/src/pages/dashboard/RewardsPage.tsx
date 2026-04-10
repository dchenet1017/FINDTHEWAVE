import { useNavigate } from 'react-router-dom'
import { Gift, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'

export default function RewardsPage() {
  const navigate = useNavigate()

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardContent className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center mb-6">
            <Gift className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Rewards</h1>
          <p className="text-gray-400 mb-6 max-w-md">
            Earn points, unlock rewards, and redeem exclusive offers. This feature is coming in Milestone 9.
          </p>
          <div className="space-y-2 text-sm text-gray-500">
            <p>• Earn points for check-ins</p>
            <p>• Unlock reward tiers</p>
            <p>• Redeem exclusive offers</p>
            <p>• Track your progress</p>
          </div>
          <Button onClick={() => navigate('/dashboard')} className="mt-8">
            Go to Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

