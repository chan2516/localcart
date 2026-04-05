'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/lib/auth-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Mail, Lock, User, Phone, Eye, EyeOff, CheckCircle, AlertCircle, MapPin } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const { register, isLoading } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    pincode: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [passwordStrength, setPasswordStrength] = useState(0)

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
    const { name } = e.target
    const value =
      name === 'phoneNumber'
        ? e.target.value.replace(/\D/g, '').slice(0, 10)
        : e.target.value
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

    if (!validateForm()) {
      return
    }

    try {
      await register(
        formData.email,
        formData.password,
        formData.firstName,
        formData.lastName,
        formData.phoneNumber,
        formData.pincode
      )
      toast.success('Account created successfully!')
      router.push('/dashboard')
    } catch (error: any) {
      const errorMsg = error?.message || 'Registration failed. Please try again.'
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-3xl font-bold text-gray-900">Create Account</CardTitle>
          <CardDescription className="text-gray-600">
            Join LocalCart and start shopping from local vendors
          </CardDescription>
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
                {errors.firstName && <p className="text-xs text-red-500">{errors.firstName}</p>}
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
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
                  disabled={isLoading}
                />
              </div>
              {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
            </div>

            {/* Phone Number */}
            <div className="space-y-2">
              <label htmlFor="phoneNumber" className="text-sm font-semibold text-gray-700">
                Phone Number (Optional)
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  placeholder="10-digit phone number"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  className="pl-10"
                  maxLength={10}
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Pincode/ZIP */}
            <div className="space-y-2">
              <label htmlFor="pincode" className="text-sm font-semibold text-gray-700">
                Pincode/ZIP (For Location-Based Search)
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="pincode"
                  name="pincode"
                  type="text"
                  placeholder="e.g., 560001"
                  value={formData.pincode}
                  onChange={handleInputChange}
                  className="pl-10"
                  disabled={isLoading}
                />
              </div>
              <p className="text-xs text-gray-500">This helps you find shops closest to your location</p>
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
              {formData.confirmPassword && formData.password === formData.confirmPassword && (
                <div className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-xs">Passwords match</span>
                </div>
              )}
              {errors.confirmPassword && (
                <p className="text-sm text-red-500">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Register Button */}
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2"
              disabled={isLoading}
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Button>

            {/* Sign In Link */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Already have an account?</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => router.push('/auth/login')}
              disabled={isLoading}
            >
              Sign In
            </Button>

            {/* Vendor Registration */}
            <div className="text-center space-y-2 pt-4 border-t">
              <p className="text-sm text-gray-600">
                Want to sell?{' '}
                <Link
                  href="/auth/vendor/register"
                  className="font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                >
                  Become a Vendor
                </Link>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
