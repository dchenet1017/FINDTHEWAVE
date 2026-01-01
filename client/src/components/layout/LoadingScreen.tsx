import { Waves, Loader2 } from 'lucide-react'

export function LoadingScreen() {
  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Waves className="h-8 w-8 text-primary animate-pulse" />
          <h1 className="text-2xl font-bold text-white">WaveFinder</h1>
        </div>
        <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
        <p className="text-gray-400 text-sm">Loading...</p>
      </div>
    </div>
  )
}

