import { AuthLayout } from '@/components/layout/AuthLayout'
import { Card, CardContent } from '@/components/ui/Card'
import { LoginForm } from '@/features/auth/components/LoginForm'

export default function LoginPage() {
  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your account to continue"
    >
      <Card>
        <CardContent className="pt-6">
          <LoginForm />
        </CardContent>
      </Card>
    </AuthLayout>
  )
}

