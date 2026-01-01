import { ReactNode } from 'react'
import { Waves } from 'lucide-react'

interface AuthLayoutProps {
  children: ReactNode
  title?: string
  subtitle?: string
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 pointer-events-none" />
      
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 relative z-10">
        {/* Left side - Form */}
        <div className="flex items-center justify-center">
          <div className="w-full max-w-md">
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Waves className="h-8 w-8 text-primary" />
                <h1 className="text-2xl font-bold text-white">WaveFinder</h1>
              </div>
              {title && (
                <h2 className="text-3xl font-bold text-white mb-2">{title}</h2>
              )}
              {subtitle && (
                <p className="text-gray-400">{subtitle}</p>
              )}
            </div>
            {children}
          </div>
        </div>

        {/* Right side - Branding (desktop only) */}
        <div className="hidden lg:flex items-center justify-center">
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center gap-2 mb-8">
              <Waves className="h-16 w-16 text-primary" />
              <h1 className="text-5xl font-bold text-white">WaveFinder</h1>
            </div>
            <p className="text-xl text-gray-300 max-w-md">
              Connect with Wave Leaders and discover amazing experiences in your
              community
            </p>
            <div className="flex items-center justify-center gap-4 mt-8">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <div className="w-2 h-2 rounded-full bg-secondary animate-pulse delay-75" />
              <div className="w-2 h-2 rounded-full bg-accent animate-pulse delay-150" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

