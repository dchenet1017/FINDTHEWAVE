import { AuthLayout } from '@/components/layout/AuthLayout'
import { Card, CardContent } from '@/components/ui/Card'
import { RegisterForm } from '@/features/auth/components/RegisterForm'

export default function RegisterPage() {
  return (
    <AuthLayout
      title="Create an account"
      subtitle="Join WaveFinder and start discovering amazing experiences"
    >
      <Card>
        <CardContent className="pt-6">
          <RegisterForm />
        </CardContent>
      </Card>
    </AuthLayout>
  )
}

