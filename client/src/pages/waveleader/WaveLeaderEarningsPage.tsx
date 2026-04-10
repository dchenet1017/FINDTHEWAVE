import { DollarSign } from 'lucide-react'

export default function WaveLeaderEarningsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Earnings</h1>
        <p className="text-gray-400 mt-2">Track your income and payouts.</p>
      </div>
      <div className="mt-8 p-12 rounded-xl border border-gray-800 bg-dark-card/50 text-center">
        <DollarSign className="h-16 w-16 text-primary/50 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-white mb-2">Earnings Tracking Coming Soon</h2>
        <p className="text-gray-400 max-w-md mx-auto">
          Full earnings history, payouts, and invoicing will be available in a future milestone.
        </p>
      </div>
    </div>
  )
}
