import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { Mail, Lock, User, Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/hooks/useAuth'

const registerSchema = z
  .object({
    email: z.string().email('Please enter a valid email'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string(),
    firstName: z.string().min(2, 'First name must be at least 2 characters').optional(),
    lastName: z.string().min(2, 'Last name must be at least 2 characters').optional(),
    role: z.enum(['USER', 'WAVELEADER', 'BUSINESS']).default('USER'),
    terms: z.boolean().refine((val) => val === true, {
      message: 'You must accept the terms and conditions',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

type RegisterFormData = z.infer<typeof registerSchema>

const passwordRequirements = [
  { label: 'At least 8 characters', regex: /.{8,}/ },
  { label: 'One uppercase letter', regex: /[A-Z]/ },
  { label: 'One number', regex: /[0-9]/ },
]

export function RegisterForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const { register: registerUser, isRegisterLoading } = useAuth()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'USER',
      terms: false,
    },
  })

  const password = watch('password', '')

  const getPasswordStrength = () => {
    const requirements = passwordRequirements.map((req) => ({
      ...req,
      met: req.regex.test(password),
    }))
    const metCount = requirements.filter((r) => r.met).length
    return { requirements, metCount, total: requirements.length }
  }

  const passwordStrength = getPasswordStrength()

  const onSubmit = (data: RegisterFormData) => {
    registerUser({
      email: data.email,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role,
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="First Name"
          type="text"
          placeholder="John"
          leftIcon={<User className="h-4 w-4" />}
          error={errors.firstName?.message}
          {...register('firstName')}
        />
        <Input
          label="Last Name"
          type="text"
          placeholder="Doe"
          leftIcon={<User className="h-4 w-4" />}
          error={errors.lastName?.message}
          {...register('lastName')}
        />
      </div>

      <Input
        label="Email"
        type="email"
        placeholder="you@example.com"
        leftIcon={<Mail className="h-4 w-4" />}
        error={errors.email?.message}
        {...register('email')}
      />

      <div className="space-y-2">
        <Input
          label="Password"
          type={showPassword ? 'text' : 'password'}
          placeholder="Create a password"
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
        label="Confirm Password"
        type={showConfirmPassword ? 'text' : 'password'}
        placeholder="Confirm your password"
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

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-300">Account Type</label>
        <div className="grid grid-cols-3 gap-2">
          {(['USER', 'WAVELEADER', 'BUSINESS'] as const).map((role) => (
            <label
              key={role}
              className={`flex items-center justify-center p-3 rounded-md border cursor-pointer transition-colors ${
                watch('role') === role
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-gray-600 bg-dark-card text-gray-300 hover:border-gray-500'
              }`}
            >
              <input
                type="radio"
                value={role}
                {...register('role')}
                className="sr-only"
              />
              <span className="text-sm font-medium capitalize">
                {role === 'WAVELEADER' ? 'Wave Leader' : role.toLowerCase()}
              </span>
            </label>
          ))}
        </div>
      </div>

      <label className="flex items-start space-x-2 cursor-pointer">
        <input
          type="checkbox"
          {...register('terms')}
          className="mt-1 rounded border-gray-600 bg-dark-card text-primary focus:ring-primary"
        />
        <span className="text-sm text-gray-300">
          I agree to the{' '}
          <Link to="/terms" className="text-primary hover:underline">
            Terms and Conditions
          </Link>{' '}
          and{' '}
          <Link to="/privacy" className="text-primary hover:underline">
            Privacy Policy
          </Link>
        </span>
      </label>
      {errors.terms && (
        <p className="text-sm text-danger">{errors.terms.message}</p>
      )}

      <Button type="submit" className="w-full" loading={isRegisterLoading}>
        Create Account
      </Button>

      <div className="text-center text-sm text-gray-400">
        Already have an account?{' '}
        <Link to="/login" className="text-primary hover:underline">
          Sign in
        </Link>
      </div>
    </form>
  )
}

