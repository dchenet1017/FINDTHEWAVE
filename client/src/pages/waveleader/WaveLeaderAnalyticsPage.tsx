import { BarChart3 } from 'lucide-react'

export default function WaveLeaderAnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Analytics</h1>
        <p className="text-gray-400 mt-2">View your performance insights.</p>
      </div>
      <div className="mt-8 p-12 rounded-xl border border-gray-800 bg-dark-card/50 text-center">
        <BarChart3 className="h-16 w-16 text-primary/50 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-white mb-2">Analytics Coming Soon</h2>
        <p className="text-gray-400 max-w-md mx-auto">
          Performance metrics, booking trends, and audience insights will be available in a future milestone.
        </p>
      </div>
    </div>
  )
}
