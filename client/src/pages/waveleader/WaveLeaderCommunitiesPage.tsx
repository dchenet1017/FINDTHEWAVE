import { Link } from 'react-router-dom'
import { Users } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export default function WaveLeaderCommunitiesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Communities</h1>
        <p className="text-gray-400 mt-2">Your community memberships and activity.</p>
      </div>
      <div className="mt-8 p-12 rounded-xl border border-gray-800 bg-dark-card/50 text-center">
        <Users className="h-16 w-16 text-primary/50 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-white mb-2">Browse Communities</h2>
        <p className="text-gray-400 max-w-md mx-auto mb-6">
          Use the public communities page to discover and join communities, or access your dashboard communities.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link to="/communities">
            <Button variant="default">Browse Communities</Button>
          </Link>
          <Link to="/dashboard/communities">
            <Button variant="secondary">Dashboard Communities</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
