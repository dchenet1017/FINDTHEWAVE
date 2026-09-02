import { AuthLayout } from '@/components/layout/AuthLayout'
import { Card, CardContent } from '@/components/ui/Card'
import { RegisterForm } from '@/features/auth/components/RegisterForm'
import { SignUpProviders } from '@/features/auth/components/SignUpProviders'

export default function RegisterPage() {
  return (
    <AuthLayout
      title="Create an account"
      subtitle="Join WaveFinder and start discovering amazing experiences"
    >
      <Card>
        <CardContent className="space-y-6 pt-6">
          <SignUpProviders />
          <RegisterForm />
        </CardContent>
      </Card>
    </AuthLayout>
  )
}

