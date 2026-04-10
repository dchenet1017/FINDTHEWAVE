import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/Card'
import { StatCard } from '@/components/dashboard/StatCard'
import { PassportCard } from '@/components/passport/PassportCard'
import { StampCollection } from '@/components/passport/StampCollection'
import { CheckInMap } from '@/components/passport/CheckInMap'
import { CheckCircle, MapPin, Gift } from 'lucide-react'
import { usePassportData } from '@/hooks/usePassport'
import { LoadingScreen } from '@/components/layout/LoadingScreen'

export default function PassportPage() {
  const navigate = useNavigate()
  const { data: passportData, isLoading } = usePassportData()

  if (isLoading) {
    return <LoadingScreen />
  }

  if (!passportData) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Failed to load passport data</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Digital Passport</h1>
        <p className="text-gray-400 mt-1">Your journey through WaveFinder experiences</p>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Passport Card (2/3 on desktop) */}
        <div className="lg:col-span-2">
          <PassportCard data={passportData} />
        </div>

        {/* Right Column - Stats & Recent Stamps (1/3 on desktop) */}
        <div className="space-y-6">
          {/* Stats */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-white">Your Stats</h2>
            <div className="space-y-3">
              <StatCard
                title="Total Check-ins"
                value={passportData.totalCheckIns.toLocaleString()}
                icon={CheckCircle}
                iconColor="text-blue-500"
                iconBg="bg-blue-500/10"
                onClick={() => navigate('/dashboard/places')}
              />
              <StatCard
                title="Places Visited"
                value={passportData.placesVisited.toLocaleString()}
                icon={MapPin}
                iconColor="text-green-500"
                iconBg="bg-green-500/10"
                onClick={() => navigate('/dashboard/places')}
              />
              <StatCard
                title="Points Earned"
                value={passportData.totalPoints.toLocaleString()}
                icon={Gift}
                iconColor="text-purple-500"
                iconBg="bg-purple-500/10"
                onClick={() => navigate('/dashboard/rewards')}
              />
            </div>
          </div>

          {/* Recent Stamps */}
          <StampCollection limit={5} showViewAll={true} />
        </div>
      </div>

      {/* Check-in Map Section */}
      <div>
        <CheckInMap />
      </div>
    </div>
  )
}

