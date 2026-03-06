'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/auth-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Mail, Lock, User, Eye, EyeOff, ShieldPlus, CheckCircle, AlertCircle } from 'lucide-react'

export default function AdminCreateUserPage() {
  const router = useRouter()
  const { user, createAdminUser, isLoading } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [passwordStrength, setPasswordStrength] = useState(0)
  const adminCreateSupported = false

  useEffect(() => {
    // Check if user is admin
    if (!user || user.role !== 'ADMIN') {
      toast.error('Admin access required')
      router.push('/auth/admin/login')
    }
  }, [user, router])

  const calculatePasswordStrength = (password: string) => {
    let strength = 0
    if (password.length >= 8) strength += 1
    if (password.length >= 12) strength += 1
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 1
    if (/[0-9]/.test(password)) strength += 1
    if (/[^a-zA-Z0-9]/.test(password)) strength += 1
    return strength
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email'
    }

    if (!formData.firstName) {
      newErrors.firstName = 'First name is required'
    }

    if (!formData.lastName) {
      newErrors.lastName = 'Last name is required'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm password'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    if (name === 'password') {
      setPasswordStrength(calculatePasswordStrength(value))
    }

    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!adminCreateSupported) {
      toast.error('Admin user creation is not available in the current backend API')
      return
    }

    if (!validateForm()) {
      return
    }

    try {
      await createAdminUser(
        formData.email,
        formData.password,
        formData.firstName,
        formData.lastName
      )

      setSubmitted(true)
      toast.success('Admin user created successfully!')

      // Reset form
      setTimeout(() => {
        setFormData({
          email: '',
          password: '',
          confirmPassword: '',
          firstName: '',
          lastName: '',
        })
        setSubmitted(false)
      }, 3000)
    } catch (error: any) {
      const errorMsg =
        error?.response?.data?.message || 'Failed to create admin user. Please try again.'
      toast.error(errorMsg)
    }
  }

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 2) return 'bg-red-500'
    if (passwordStrength <= 3) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getPasswordStrengthText = () => {
    if (passwordStrength <= 2) return 'Weak'
    if (passwordStrength <= 3) return 'Fair'
    return 'Strong'
  }

  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100 py-12 px-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardContent className="pt-10 text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-red-600 mx-auto" />
            <p className="text-gray-600">Loading...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100 py-12 px-4">
      <Card className="w-full max-w-md shadow-lg">
        {!submitted ? (
          <>
            <CardHeader className="text-center space-y-2">
              <div className="flex justify-center mb-2">
                <ShieldPlus className="h-10 w-10 text-red-600" />
              </div>
              <CardTitle className="text-3xl font-bold text-gray-900">Create Admin User</CardTitle>
              <CardDescription className="text-gray-600">
                Create a new administrator account
              </CardDescription>
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                This action is temporarily disabled because the backend does not expose an admin user creation endpoint.
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* First Name & Last Name */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label htmlFor="firstName" className="text-sm font-semibold text-gray-700">
                      First Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="firstName"
                        name="firstName"
                        placeholder="John"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className={`pl-10 ${errors.firstName ? 'border-red-500' : ''}`}
                        disabled={isLoading}
                      />
                    </div>
                    {errors.firstName && (
                      <p className="text-xs text-red-500">{errors.firstName}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="lastName" className="text-sm font-semibold text-gray-700">
                      Last Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="lastName"
                        name="lastName"
                        placeholder="Doe"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className={`pl-10 ${errors.lastName ? 'border-red-500' : ''}`}
                        disabled={isLoading}
                      />
                    </div>
                    {errors.lastName && <p className="text-xs text-red-500">{errors.lastName}</p>}
                  </div>
                </div>

                {/* Email Field */}
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-semibold text-gray-700">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="admin@example.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
                      disabled={isLoading}
                    />
                  </div>
                  {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-semibold text-gray-700">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleInputChange}
                      className={`pl-10 pr-10 ${errors.password ? 'border-red-500' : ''}`}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  {formData.password && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1 bg-gray-200 rounded">
                          <div
                            className={`h-full rounded ${getPasswordStrengthColor()}`}
                            style={{ width: `${(passwordStrength / 5) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-gray-600">
                          {getPasswordStrengthText()}
                        </span>
                      </div>
                    </div>
                  )}
                  {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
                </div>

                {/* Confirm Password Field */}
                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="text-sm font-semibold text-gray-700">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className={`pl-10 pr-10 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {formData.confirmPassword &&
                    formData.password === formData.confirmPassword && (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-xs">Passwords match</span>
                      </div>
                    )}
                  {errors.confirmPassword && (
                    <p className="text-sm text-red-500">{errors.confirmPassword}</p>
                  )}
                </div>

                {/* Create Button */}
                <Button
                  type="submit"
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2"
                  disabled={isLoading || !adminCreateSupported}
                >
                  {isLoading ? 'Creating Admin User...' : adminCreateSupported ? 'Create Admin User' : 'Creation Unavailable'}
                </Button>

                {/* Back Button */}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push('/admin/dashboard')}
                  disabled={isLoading}
                >
                  Back to Dashboard
                </Button>
              </form>
            </CardContent>
          </>
        ) : (
          <CardContent className="pt-10 text-center space-y-6">
            <div className="flex justify-center">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-2xl font-bold text-gray-900">Admin User Created</CardTitle>
              <CardDescription className="text-base text-gray-600">
                The new admin account has been created successfully.
              </CardDescription>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-800">
              <p>
                <strong>Email:</strong> {formData.email}
                <br />
                The user can now log in with the provided credentials.
              </p>
            </div>

            <Button
              onClick={() => {
                setFormData({
                  email: '',
                  password: '',
                  confirmPassword: '',
                  firstName: '',
                  lastName: '',
                })
                setSubmitted(false)
              }}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2"
            >
              Create Another Admin
            </Button>

            <Button
              variant="outline"
              onClick={() => router.push('/admin/dashboard')}
              className="w-full"
            >
              Back to Dashboard
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  )
}
