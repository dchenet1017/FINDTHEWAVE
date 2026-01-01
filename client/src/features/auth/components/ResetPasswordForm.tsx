import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { authService } from '@/services/auth.service'
import { toast } from 'sonner'

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>

const passwordRequirements = [
  { label: 'At least 8 characters', regex: /.{8,}/ },
  { label: 'One uppercase letter', regex: /[A-Z]/ },
  { label: 'One number', regex: /[0-9]/ },
]

export function ResetPasswordForm() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  })

  const password = watch('password', '')

  const getPasswordStrength = () => {
    const requirements = passwordRequirements.map((req) => ({
      ...req,
      met: req.regex.test(password),
    }))
    return { requirements }
  }

  const passwordStrength = getPasswordStrength()

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      toast.error('Invalid reset token')
      return
    }

    setIsLoading(true)
    try {
      await authService.resetPassword(token, data.password)
      toast.success('Password reset successfully!')
      navigate('/login')
    } catch (error: any) {
      toast.error(
        error.response?.data?.error?.message || 'Failed to reset password'
      )
    } finally {
      setIsLoading(false)
    }
  }

  if (!token) {
    return (
      <Alert variant="destructive">
        <p>Invalid or missing reset token. Please request a new password reset.</p>
      </Alert>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Input
          label="New Password"
          type={showPassword ? 'text' : 'password'}
          placeholder="Enter new password"
          leftIcon={<Lock className="h-4 w-4" />}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-gray-400 hover:text-white"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          }
          error={errors.password?.message}
          {...register('password')}
        />

        {password && (
          <div className="rounded-md bg-dark-card p-3 space-y-1">
            <p className="text-xs font-medium text-gray-300">Password Requirements:</p>
            {passwordStrength.requirements.map((req, index) => (
              <div key={index} className="flex items-center gap-2 text-xs">
                {req.met ? (
                  <CheckCircle2 className="h-3 w-3 text-success" />
                ) : (
                  <div className="h-3 w-3 rounded-full border border-gray-600" />
                )}
                <span className={req.met ? 'text-success' : 'text-gray-400'}>
                  {req.label}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <Input
        label="Confirm New Password"
        type={showConfirmPassword ? 'text' : 'password'}
        placeholder="Confirm new password"
        leftIcon={<Lock className="h-4 w-4" />}
        rightIcon={
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="text-gray-400 hover:text-white"
          >
            {showConfirmPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        }
        error={errors.confirmPassword?.message}
        {...register('confirmPassword')}
      />

      <Button type="submit" className="w-full" loading={isLoading}>
        Reset Password
      </Button>
    </form>
  )
}

