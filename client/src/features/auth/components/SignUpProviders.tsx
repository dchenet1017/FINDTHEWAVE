import { Apple, Smartphone } from 'lucide-react'

/**
 * Phone / Apple / Google sign-up options.
 *
 * The Fastify auth module is email + password only today, so these are shown
 * as coming soon rather than wired to a provider that does not exist yet.
 * When the backend lands, give each a real handler and drop `disabled`.
 */

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="currentColor"
        d="M21.35 11.1h-9.18v2.92h5.27c-.23 1.37-1.62 4.01-5.27 4.01-3.17 0-5.76-2.62-5.76-5.85s2.59-5.85 5.76-5.85c1.8 0 3.01.77 3.7 1.43l2.52-2.43C16.78 3.77 14.7 2.85 12.17 2.85c-5.09 0-9.22 4.13-9.22 9.22s4.13 9.22 9.22 9.22c5.32 0 8.85-3.74 8.85-9.01 0-.61-.07-1.07-.17-1.53z"
      />
    </svg>
  )
}

const PROVIDERS = [
  { id: 'phone', label: 'Continue with Phone', icon: Smartphone },
  { id: 'apple', label: 'Continue with Apple', icon: Apple },
  { id: 'google', label: 'Continue with Google', icon: GoogleIcon },
]

export function SignUpProviders() {
  return (
    <div className="space-y-3">
      {PROVIDERS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          disabled
          title="Coming soon"
          className="flex w-full items-center gap-3 rounded-md border border-gray-700 bg-dark-card px-4 py-2.5 text-sm font-medium text-gray-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Icon className="h-4 w-4 shrink-0" />
          <span className="flex-1 text-left">{label}</span>
          <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
            Soon
          </span>
        </button>
      ))}

      <div className="flex items-center gap-3 pt-1">
        <span className="h-px flex-1 bg-gray-700" />
        <span className="text-xs text-gray-500">or sign up with email</span>
        <span className="h-px flex-1 bg-gray-700" />
      </div>
    </div>
  )
}
