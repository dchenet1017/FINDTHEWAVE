import { Link } from 'react-router-dom'
import { Waves, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center space-y-6 max-w-3xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-8">
            <Waves className="h-12 w-12 text-primary" />
            <h1 className="text-5xl font-bold text-white">WaveFinder</h1>
          </div>
          <h2 className="text-4xl font-bold text-white">
            Connect with Wave Leaders and Discover Amazing Experiences
          </h2>
          <p className="text-xl text-gray-400">
            Join communities, book experiences, and connect with local Wave Leaders
            who make every moment memorable.
          </p>
          <div className="flex items-center justify-center gap-4 pt-4">
            <Link to="/register">
              <Button size="lg">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="lg">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-xl font-semibold text-white mb-2">Find Wave Leaders</h3>
              <p className="text-gray-400">
                Discover experienced Wave Leaders in your community who can guide you
                through amazing experiences.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-xl font-semibold text-white mb-2">Join Communities</h3>
              <p className="text-gray-400">
                Connect with like-minded people in communities that match your
                interests and passions.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-xl font-semibold text-white mb-2">Book Experiences</h3>
              <p className="text-gray-400">
                Easily book and schedule experiences with Wave Leaders and businesses
                in your area.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}

