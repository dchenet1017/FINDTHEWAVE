import { AuthLayout } from '@/components/layout/AuthLayout'
import { Card, CardContent } from '@/components/ui/Card'
import { ForgotPasswordForm } from '@/features/auth/components/ForgotPasswordForm'

export default function ForgotPasswordPage() {
  return (
    <AuthLayout
      title="Forgot password"
      subtitle="No worries, we'll help you reset it"
    >
      <Card>
        <CardContent className="pt-6">
          <ForgotPasswordForm />
        </CardContent>
      </Card>
    </AuthLayout>
  )
}

