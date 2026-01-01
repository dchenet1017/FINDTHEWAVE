import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

export default function BusinessManagement() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Business Management</h1>
        <p className="text-gray-400 mt-2">Manage all businesses on the platform</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Businesses</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400">Business management interface coming soon...</p>
        </CardContent>
      </Card>
    </div>
  )
}

