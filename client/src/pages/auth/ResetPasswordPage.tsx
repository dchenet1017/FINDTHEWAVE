import { AuthLayout } from '@/components/layout/AuthLayout'
import { Card, CardContent } from '@/components/ui/Card'
import { ResetPasswordForm } from '@/features/auth/components/ResetPasswordForm'

export default function ResetPasswordPage() {
  return (
    <AuthLayout
      title="Reset password"
      subtitle="Enter your new password below"
    >
      <Card>
        <CardContent className="pt-6">
          <ResetPasswordForm />
        </CardContent>
      </Card>
    </AuthLayout>
  )
}

