import { Link } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-6 text-center space-y-4">
          <ShieldAlert className="h-16 w-16 text-warning mx-auto" />
          <h1 className="text-2xl font-bold text-white">Access Denied</h1>
          <p className="text-gray-400">
            You don't have permission to access this page. Please contact an
            administrator if you believe this is an error.
          </p>
          <div className="pt-4 space-y-2">
            <Link to="/dashboard">
              <Button className="w-full">Go to Dashboard</Button>
            </Link>
            <Link to="/">
              <Button variant="outline" className="w-full">
                Go Home
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

