import { Link } from 'react-router-dom'
import { Settings } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export default function WaveLeaderSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="text-gray-400 mt-2">Configure your WaveLeader account.</p>
      </div>
      <div className="mt-8 p-12 rounded-xl border border-gray-800 bg-dark-card/50 text-center">
        <Settings className="h-16 w-16 text-primary/50 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-white mb-2">Use General Settings</h2>
        <p className="text-gray-400 max-w-md mx-auto mb-6">
          Account, notifications, and privacy settings are managed in the main user settings.
        </p>
        <Link to="/dashboard/settings">
          <Button variant="default">Go to Settings</Button>
        </Link>
      </div>
    </div>
  )
}
