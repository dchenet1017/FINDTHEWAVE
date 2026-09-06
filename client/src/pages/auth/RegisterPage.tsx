import { useSearchParams } from 'react-router-dom'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { Card, CardContent } from '@/components/ui/Card'
import { RegisterForm } from '@/features/auth/components/RegisterForm'
import { SignUpProviders } from '@/features/auth/components/SignUpProviders'

const ROLE_PARAM_MAP: Record<string, 'USER' | 'WAVELEADER' | 'BUSINESS'> = {
  user: 'USER',
  waveleader: 'WAVELEADER',
  wave_leader: 'WAVELEADER',
  business: 'BUSINESS',
}

export default function RegisterPage() {
  const [searchParams] = useSearchParams()
  // Lets landing-page CTAs like "Grow My Business" land straight on the
  // matching account type instead of the USER default.
  const defaultRole = ROLE_PARAM_MAP[searchParams.get('role')?.toLowerCase() ?? '']

  return (
    <AuthLayout
      title="Create an account"
      subtitle="Join WaveFinder and start discovering amazing experiences"
    >
      <Card>
        <CardContent className="space-y-6 pt-6">
          <SignUpProviders />
          <RegisterForm defaultRole={defaultRole} />
        </CardContent>
      </Card>
    </AuthLayout>
  )
}

