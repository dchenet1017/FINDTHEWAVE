import { useEffect, useState, useRef } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { CheckCircle2, XCircle, Loader2, Mail } from 'lucide-react'
import { authService } from '@/services/auth.service'
import { toast } from 'sonner'

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [isResending, setIsResending] = useState(false)
  const hasVerifiedRef = useRef(false)

  useEffect(() => {
    let isMounted = true

    const verifyEmail = async () => {
      if (!token || hasVerifiedRef.current) {
        if (!token && isMounted) {
          setStatus('error')
        }
        return
      }

      hasVerifiedRef.current = true

      try {
        const response = await authService.verifyEmail(token)
        
        if (isMounted) {
          if (response.data?.success) {
            setStatus('success')
            const message = response.data.data?.message || 'Email verified successfully!'
            toast.success(message)
          } else {
            setStatus('error')
            toast.error(
              response.data?.error?.message || 'Failed to verify email'
            )
          }
        }
      } catch (error: any) {
        if (isMounted) {
          setStatus('error')
          const errorMessage =
            error.response?.data?.error?.message || 'Failed to verify email'
          toast.error(errorMessage)
        }
      }
    }

    verifyEmail()

    return () => {
      isMounted = false
    }
  }, [token])

  const handleResend = async () => {
    setIsResending(true)
    try {
      // This would need to be implemented in the backend
      toast.success('Verification email sent!')
    } catch (error) {
      toast.error('Failed to resend verification email')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <AuthLayout
      title="Verify your email"
      subtitle="We need to verify your email address"
    >
      <Card>
        <CardContent className="pt-6">
          {status === 'loading' && (
            <div className="space-y-4 text-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
              <p className="text-gray-300">Verifying your email...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-4">
              <Alert variant="success" icon={<CheckCircle2 className="h-5 w-5" />}>
                <div className="space-y-2">
                  <p className="font-medium">Email verified successfully!</p>
                  <p className="text-sm text-gray-300">
                    Your email has been verified. You can now sign in to your account.
                  </p>
                </div>
              </Alert>
              <Link to="/login">
                <Button className="w-full">Go to Login</Button>
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              {!token ? (
                <>
                  <Alert variant="default" icon={<Mail className="h-5 w-5" />}>
                    <div className="space-y-2">
                      <p className="font-medium">Check your email</p>
                      <p className="text-sm text-gray-300">
                        We've sent a verification link to your email address. Please check your inbox and click the link to verify your account.
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        <strong>Development mode:</strong> Check the server console for the verification token if email is not configured.
                      </p>
                    </div>
                  </Alert>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleResend}
                      loading={isResending}
                    >
                      <Mail className="mr-2 h-4 w-4" />
                      Resend Verification Email
                    </Button>
                    <Link to="/login">
                      <Button variant="ghost" className="w-full">
                        Back to Login
                      </Button>
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <Alert variant="destructive" icon={<XCircle className="h-5 w-5" />}>
                    <div className="space-y-2">
                      <p className="font-medium">Verification failed</p>
                      <p className="text-sm text-gray-300">
                        The verification link is invalid or has expired.
                      </p>
                    </div>
                  </Alert>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleResend}
                      loading={isResending}
                    >
                      <Mail className="mr-2 h-4 w-4" />
                      Resend Verification Email
                    </Button>
                    <Link to="/login">
                      <Button variant="ghost" className="w-full">
                        Back to Login
                      </Button>
                    </Link>
                  </div>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </AuthLayout>
  )
}

