'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/lib/auth-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const { forgotPassword, isLoading } = useAuthStore()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) {
      setError('Email is required')
      return
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address')
      return
    }

    try {
      await forgotPassword(email)
      setSubmitted(true)
      toast.success('Password reset link sent to your email!')
    } catch (error: any) {
      const errorMsg =
        error?.response?.data?.message ||
        'Failed to send reset link. Please check your email and try again.'
      toast.error(errorMsg)
      setError(errorMsg)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <Card className="w-full max-w-md shadow-lg">
        {!submitted ? (
          <>
            <CardHeader className="text-center space-y-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-fit mx-auto mb-2"
                onClick={() => router.back()}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <CardTitle className="text-3xl font-bold text-gray-900">Reset Password</CardTitle>
              <CardDescription className="text-gray-600">
                Enter your email address and we'll send you a link to reset your password
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Field */}
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-semibold text-gray-700">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value)
                        if (error) setError('')
                      }}
                      className={`pl-10 ${error ? 'border-red-500' : ''}`}
                      disabled={isLoading}
                      autoFocus
                    />
                  </div>
                  {error && <p className="text-sm text-red-500">{error}</p>}
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2"
                  disabled={isLoading}
                >
                  {isLoading ? 'Sending...' : 'Send Reset Link'}
                </Button>

                {/* Back to Login */}
                <div className="text-center">
                  <Link
                    href="/auth/login"
                    className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    Back to Login
                  </Link>
                </div>
              </form>
            </CardContent>
          </>
        ) : (
          <CardContent className="pt-10 text-center space-y-6">
            <div className="flex justify-center">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-2xl font-bold text-gray-900">Check Your Email</CardTitle>
              <CardDescription className="text-base text-gray-600">
                We've sent a password reset link to
                <br />
                <span className="font-semibold text-gray-800">{email}</span>
              </CardDescription>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
              <p>
                The link will expire in 24 hours. If you don't see the email, check your spam folder.
              </p>
            </div>

            <Button
              onClick={() => router.push('/auth/login')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2"
            >
              Back to Login
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                setSubmitted(false)
                setEmail('')
              }}
              className="w-full"
            >
              Try Another Email
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  )
}
