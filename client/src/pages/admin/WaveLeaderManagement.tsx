import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

export default function WaveLeaderManagement() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Wave Leader Management</h1>
        <p className="text-gray-400 mt-2">Manage all Wave Leaders on the platform</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Wave Leaders</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400">Wave Leader management interface coming soon...</p>
        </CardContent>
      </Card>
    </div>
  )
}

