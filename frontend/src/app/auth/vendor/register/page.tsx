'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/lib/auth-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import {
  Mail,
  Lock,
  User,
  Phone,
  Building2,
  MapPin,
  Eye,
  EyeOff,
  CheckCircle,
  Store,
} from 'lucide-react'

export default function VendorRegisterPage() {
  const router = useRouter()
  const { register, registerVendor, isLoading } = useAuthStore()
  const [step, setStep] = useState(1) // Step 1: User Info, Step 2: Business Info
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  const [userFormData, setUserFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
  })

  const [vendorFormData, setVendorFormData] = useState({
    businessName: '',
    description: '',
    businessPhone: '',
    businessAddress: '',
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

  const validateUserForm = () => {
    const newErrors: Record<string, string> = {}

    if (!userFormData.email) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userFormData.email)) {
      newErrors.email = 'Please enter a valid email'
    }

    if (!userFormData.firstName) {
      newErrors.firstName = 'First name is required'
    }

    if (!userFormData.lastName) {
      newErrors.lastName = 'Last name is required'
    }

    if (!userFormData.password) {
      newErrors.password = 'Password is required'
    } else if (userFormData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    }

    if (!userFormData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm password'
    } else if (userFormData.password !== userFormData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateVendorForm = () => {
    const newErrors: Record<string, string> = {}

    if (!vendorFormData.businessName) {
      newErrors.businessName = 'Business name is required'
    }

    if (!vendorFormData.description) {
      newErrors.description = 'Business description is required'
    } else if (vendorFormData.description.length < 20) {
      newErrors.description = 'Description must be at least 20 characters'
    }

    if (!vendorFormData.businessPhone) {
      newErrors.businessPhone = 'Business phone is required'
    }

    if (!vendorFormData.businessAddress) {
      newErrors.businessAddress = 'Business address is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleUserInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setUserFormData((prev) => ({ ...prev, [name]: value }))

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

  const handleVendorInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setVendorFormData((prev) => ({ ...prev, [name]: value }))

    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateUserForm()) {
      return
    }

    try {
      // Register user first
      await register(
        userFormData.email,
        userFormData.password,
        userFormData.firstName,
        userFormData.lastName,
        userFormData.phoneNumber
      )

      const user = useAuthStore.getState().user
      if (user?.id) {
        setUserId(user.id)
        setStep(2)
        toast.success('Step 1 complete! Now add your business details.')
      }
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || 'Registration failed. Please try again.'
      toast.error(errorMsg)
    }
  }

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateVendorForm()) {
      return
    }

    try {
      await registerVendor(
        vendorFormData.businessName,
        vendorFormData.description,
        vendorFormData.businessPhone,
        vendorFormData.businessAddress
      )

      toast.success('Vendor registration complete! Please wait for admin approval.')
      setTimeout(() => {
        router.push('/auth/vendor/registration-complete')
      }, 1500)
    } catch (error: any) {
      const errorMsg =
        error?.response?.data?.message || 'Failed to register vendor. Please try again.'
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100 py-12 px-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <Store className="h-10 w-10 text-orange-600" />
          </div>
          <CardTitle className="text-3xl font-bold text-gray-900">Become a Vendor</CardTitle>
          <CardDescription className="text-gray-600">
            {step === 1
              ? 'Create your account (Step 1 of 2)'
              : 'Add your business details (Step 2 of 2)'}
          </CardDescription>

          {/* Progress Bar */}
          <div className="flex gap-2 mt-4">
            <div
              className={`h-1 flex-1 rounded ${step >= 1 ? 'bg-orange-600' : 'bg-gray-200'}`}
            />
            <div
              className={`h-1 flex-1 rounded ${step >= 2 ? 'bg-orange-600' : 'bg-gray-200'}`}
            />
          </div>
        </CardHeader>
        <CardContent>
          {step === 1 ? (
            <form onSubmit={handleStep1Submit} className="space-y-5">
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
                      value={userFormData.firstName}
                      onChange={handleUserInputChange}
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
                      value={userFormData.lastName}
                      onChange={handleUserInputChange}
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
                    value={userFormData.email}
                    onChange={handleUserInputChange}
                    className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
                    disabled={isLoading}
                  />
                </div>
                {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
              </div>

              {/* Phone Number */}
              <div className="space-y-2">
                <label htmlFor="phoneNumber" className="text-sm font-semibold text-gray-700">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="phoneNumber"
                    name="phoneNumber"
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={userFormData.phoneNumber}
                    onChange={handleUserInputChange}
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>
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
                    value={userFormData.password}
                    onChange={handleUserInputChange}
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

                {userFormData.password && (
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
                    value={userFormData.confirmPassword}
                    onChange={handleUserInputChange}
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
                {userFormData.confirmPassword &&
                  userFormData.password === userFormData.confirmPassword && (
                    <div className="flex items-center gap-1 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-xs">Passwords match</span>
                    </div>
                  )}
                {errors.confirmPassword && (
                  <p className="text-sm text-red-500">{errors.confirmPassword}</p>
                )}
              </div>

              {/* Next Button */}
              <Button
                type="submit"
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2"
                disabled={isLoading}
              >
                {isLoading ? 'Creating Account...' : 'Next: Add Business Details'}
              </Button>

              {/* Sign In Link */}
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Already have an account?{' '}
                  <Link
                    href="/auth/vendor/login"
                    className="font-semibold text-orange-600 hover:text-orange-700 hover:underline"
                  >
                    Sign In
                  </Link>
                </p>
              </div>
            </form>
          ) : (
            <form onSubmit={handleStep2Submit} className="space-y-5">
              {/* Business Name */}
              <div className="space-y-2">
                <label htmlFor="businessName" className="text-sm font-semibold text-gray-700">
                  Business Name
                </label>
                <div className="relative">
                  <Store className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="businessName"
                    name="businessName"
                    placeholder="My Awesome Store"
                    value={vendorFormData.businessName}
                    onChange={handleVendorInputChange}
                    className={`pl-10 ${errors.businessName ? 'border-red-500' : ''}`}
                    disabled={isLoading}
                  />
                </div>
                {errors.businessName && (
                  <p className="text-sm text-red-500">{errors.businessName}</p>
                )}
              </div>

              {/* Business Description */}
              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-semibold text-gray-700">
                  Business Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  placeholder="Describe your business in 20+ characters..."
                  value={vendorFormData.description}
                  onChange={handleVendorInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                    errors.description ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={isLoading}
                  rows={4}
                />
                <p className="text-xs text-gray-500">
                  {vendorFormData.description.length} / 20 characters minimum
                </p>
                {errors.description && (
                  <p className="text-sm text-red-500">{errors.description}</p>
                )}
              </div>

              {/* Business Phone */}
              <div className="space-y-2">
                <label htmlFor="businessPhone" className="text-sm font-semibold text-gray-700">
                  Business Phone
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="businessPhone"
                    name="businessPhone"
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={vendorFormData.businessPhone}
                    onChange={handleVendorInputChange}
                    className={`pl-10 ${errors.businessPhone ? 'border-red-500' : ''}`}
                    disabled={isLoading}
                  />
                </div>
                {errors.businessPhone && (
                  <p className="text-sm text-red-500">{errors.businessPhone}</p>
                )}
              </div>

              {/* Business Address */}
              <div className="space-y-2">
                <label htmlFor="businessAddress" className="text-sm font-semibold text-gray-700">
                  Business Address
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="businessAddress"
                    name="businessAddress"
                    placeholder="123 Main Street, City, State 12345"
                    value={vendorFormData.businessAddress}
                    onChange={handleVendorInputChange}
                    className={`pl-10 ${errors.businessAddress ? 'border-red-500' : ''}`}
                    disabled={isLoading}
                  />
                </div>
                {errors.businessAddress && (
                  <p className="text-sm text-red-500">{errors.businessAddress}</p>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2"
                disabled={isLoading}
              >
                {isLoading ? 'Registering...' : 'Complete Registration'}
              </Button>

              {/* Back Button */}
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setStep(1)}
                disabled={isLoading}
              >
                Back
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
