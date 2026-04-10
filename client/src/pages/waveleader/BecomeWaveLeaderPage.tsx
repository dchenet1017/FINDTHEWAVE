import { Link } from 'react-router-dom'
import { Waves, ArrowRight, Clock, DollarSign, Award, LogIn, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { useAuthStore } from '@/store/authStore'

export default function BecomeWaveLeaderPage() {
  const { isAuthenticated } = useAuthStore()

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-secondary/10" />
        <div className="container relative mx-auto px-4 py-24 md:py-32">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/20 border border-primary/40 mb-6">
              <Waves className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-white">
              Become a WaveLeader
            </h1>
            <p className="text-xl md:text-2xl text-gray-400">
              Share your expertise and earn money
            </p>
            <Link to={isAuthenticated ? '/waveleader/register' : '/login'} className="inline-block">
              <Button size="lg" className="gap-2">
                Get Started
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-white text-center mb-12">
          Why Join as a WaveLeader?
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="border-gray-800">
            <CardContent className="pt-8 pb-8">
              <div className="h-14 w-14 rounded-xl bg-primary/20 flex items-center justify-center mb-6">
                <Clock className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Flexible Schedule
              </h3>
              <ul className="text-gray-400 space-y-2">
                <li>• Set your own hours</li>
                <li>• Choose your service area</li>
              </ul>
            </CardContent>
          </Card>
          <Card className="border-gray-800">
            <CardContent className="pt-8 pb-8">
              <div className="h-14 w-14 rounded-xl bg-primary/20 flex items-center justify-center mb-6">
                <DollarSign className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Earn Money
              </h3>
              <ul className="text-gray-400 space-y-2">
                <li>• Set your own rates</li>
                <li>• Get paid directly</li>
              </ul>
            </CardContent>
          </Card>
          <Card className="border-gray-800">
            <CardContent className="pt-8 pb-8">
              <div className="h-14 w-14 rounded-xl bg-primary/20 flex items-center justify-center mb-6">
                <Award className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Build Your Brand
              </h3>
              <ul className="text-gray-400 space-y-2">
                <li>• Create your profile</li>
                <li>• Gain followers</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-20 border-t border-gray-800">
        <h2 className="text-3xl font-bold text-white text-center mb-12">
          How It Works
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { step: 1, title: 'Create Profile', desc: 'Add your info and specialty' },
            { step: 2, title: 'Set Service Area', desc: 'Choose where you work' },
            { step: 3, title: 'Get Verified', desc: "We'll review your application" },
            { step: 4, title: 'Start Earning', desc: 'Accept bookings and get paid' },
          ].map((item) => (
            <div key={item.step} className="relative">
              <div className="flex flex-col items-center text-center">
                <div className="h-14 w-14 rounded-full bg-primary/20 border-2 border-primary/50 flex items-center justify-center text-xl font-bold text-primary mb-4">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-gray-400">{item.desc}</p>
              </div>
              {item.step < 4 && (
                <div className="hidden lg:block absolute top-7 left-[60%] w-[80%] h-0.5 bg-gray-700" />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Requirements */}
      <section className="container mx-auto px-4 py-20 border-t border-gray-800">
        <h2 className="text-3xl font-bold text-white text-center mb-12">
          Requirements
        </h2>
        <div className="max-w-2xl mx-auto">
          <ul className="space-y-4 text-gray-300">
            <li className="flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-primary" />
              18 years or older
            </li>
            <li className="flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-primary" />
              Valid ID
            </li>
            <li className="flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-primary" />
              Professional experience in your field
            </li>
            <li className="flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-primary" />
              Background check (coming soon)
            </li>
          </ul>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 border-t border-gray-800">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h2 className="text-3xl font-bold text-white">
            Ready to get started?
          </h2>
          <p className="text-gray-400">
            Join thousands of WaveLeaders sharing their expertise and earning on their own terms.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {isAuthenticated ? (
              <Link to="/waveleader/register">
                <Button size="lg" className="gap-2">
                  Complete Application
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/waveleader/register">
                  <Button size="lg" className="gap-2">
                    <UserPlus className="h-5 w-5" />
                    Sign Up
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="outline" size="lg" className="gap-2">
                    <LogIn className="h-5 w-5" />
                    Login
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
