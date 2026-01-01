import { Link } from 'react-router-dom'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-6 text-center space-y-4">
          <AlertCircle className="h-16 w-16 text-danger mx-auto" />
          <h1 className="text-4xl font-bold text-white">404</h1>
          <h2 className="text-2xl font-semibold text-white">Page Not Found</h2>
          <p className="text-gray-400">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <div className="pt-4">
            <Link to="/">
              <Button>Go Home</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

