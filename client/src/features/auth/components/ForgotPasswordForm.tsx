import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { Mail, CheckCircle2 } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { authService } from '@/services/auth.service'

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email'),
})

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>

export function ForgotPasswordForm() {
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true)
    try {
      await authService.forgotPassword(data.email)
      setIsSubmitted(true)
    } catch (error: any) {
      // Error is handled by axios interceptor/toast
    } finally {
      setIsLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="space-y-4">
        <Alert variant="success" icon={<CheckCircle2 className="h-5 w-5" />}>
          <div className="space-y-2">
            <p className="font-medium">Check your email</p>
            <p className="text-sm text-gray-300">
              If an account exists with that email, we've sent you a password reset
              link.
            </p>
          </div>
        </Alert>
        <Link to="/login">
          <Button variant="outline" className="w-full">
            Back to Login
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <p className="text-sm text-gray-400">
          Enter your email address and we'll send you a link to reset your password.
        </p>
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          leftIcon={<Mail className="h-4 w-4" />}
          error={errors.email?.message}
          {...register('email')}
        />
      </div>

      <Button type="submit" className="w-full" loading={isLoading}>
        Send Reset Link
      </Button>

      <div className="text-center text-sm text-gray-400">
        Remember your password?{' '}
        <Link to="/login" className="text-primary hover:underline">
          Sign in
        </Link>
      </div>
    </form>
  )
}

