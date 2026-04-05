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
  FileText,
  Camera,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
} from 'lucide-react'

// Step Indicator Component
const StepIndicator: React.FC<{ currentStep: number; totalSteps: number }> = ({
  currentStep,
  totalSteps,
}) => {
  return (
    <div className="flex items-center justify-center gap-3 mt-4">
      {Array.from({ length: totalSteps }).map((_, index) => (
        <div key={index} className="flex items-center gap-3">
          <div
            className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold ${
              index + 1 <= currentStep
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-200 text-gray-600'
            }`}
          >
            {index + 1}
          </div>
          {index < totalSteps - 1 && (
            <div
              className={`w-12 h-0.5 ${
                index + 1 < currentStep ? 'bg-emerald-600' : 'bg-gray-200'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  )
}

// Document Upload Card Component
interface DocumentUploadCardProps {
  title: string
  description: string
  field: string
  value: string
  onCapture: (field: string, value: string) => void
  error?: string
  isPhoto?: boolean
  icon?: React.ReactNode
}

const DocumentUploadCard: React.FC<DocumentUploadCardProps> = ({
  title,
  description,
  field,
  value,
  onCapture,
  error,
  isPhoto = false,
  icon,
}) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const url = event.target?.result as string
        onCapture(field, url)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div
      className={`border-2 rounded-lg p-4 ${error ? 'border-red-300 bg-red-50' : 'border-dashed border-gray-300 hover:border-emerald-400'}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {icon && <div className="text-emerald-600 text-2xl">{icon}</div>}
          <div>
            <h4 className="font-semibold text-gray-900">{title}</h4>
            <p className="text-xs text-gray-600">{description}</p>
          </div>
        </div>
      </div>

      {value ? (
        <div className="space-y-3">
          <div className="relative w-full h-40 rounded-lg overflow-hidden bg-gray-100">
            <img
              src={value}
              alt={title}
              className="w-full h-full object-cover"
            />
          </div>
          <button
            type="button"
            onClick={() => onCapture(field, '')}
            className="w-full px-3 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-semibold hover:bg-red-200"
          >
            Remove & Recapture
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex gap-2">
            {isPhoto && (
              <label className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg cursor-pointer hover:bg-blue-100">
                  <Camera className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-semibold text-blue-600">Capture Photo</span>
                </div>
              </label>
            )}

            <label className="flex-1">
              <input
                type="file"
                accept={isPhoto ? 'image/*' : 'image/*,.pdf'}
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="flex items-center justify-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg cursor-pointer hover:bg-emerald-100">
                <FileText className="h-4 w-4 text-emerald-600" />
                <span className="text-sm font-semibold text-emerald-600">
                  {isPhoto ? 'Upload' : 'Upload File'}
                </span>
              </div>
            </label>
          </div>

          {error && <p className="text-xs text-red-600 font-semibold">{error}</p>}
        </div>
      )}
    </div>
  )
}

export default function VendorRegisterPage() {
  const router = useRouter()
  const { register, login, registerVendor, isLoading } = useAuthStore()
  const [step, setStep] = useState(1) // Step 1, 2, or 3
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [userFormData, setUserFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
  })

  const [businessFormData, setBusinessFormData] = useState({
    businessName: '',
    description: '',
    businessEmail: '',
    businessPhone: '',
    businessAddress: '',
    businessZipCode: '',
    shopPincode: '',
    gstinNumber: '',
    fassaiNumber: '',
    shopCertificateNumber: '',
    taxId: '',
    businessRegistrationNumber: '',
    businessType: '',
  })

  const [documentsData, setDocumentsData] = useState({
    gstinCertificateUrl: '',
    fassaiCertificateUrl: '',
    shopOwnershipCertificateUrl: '',
    vendorPhotoUrl: '',
    vendorSignatureUrl: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const calculatePasswordStrength = (password: string) => {
    let strength = 0
    if (password.length >= 8) strength += 1
    if (password.length >= 12) strength += 1
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 1
    if (/[0-9]/.test(password)) strength += 1
    if (/[^a-zA-Z0-9]/.test(password)) strength += 1
    return strength
  }

  const validateStep1 = () => {
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

    const normalizedPhone = userFormData.phoneNumber.trim()

    if (!normalizedPhone) {
      newErrors.phoneNumber = 'Phone number is required'
    } else if (!/^\d{10}$/.test(normalizedPhone)) {
      newErrors.phoneNumber = 'Phone number must be exactly 10 digits'
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

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {}

    if (!businessFormData.businessName.trim()) {
      newErrors.businessName = 'Business name is required'
    }

    if (!businessFormData.description.trim()) {
      newErrors.description = 'Business description is required'
    } else if (businessFormData.description.trim().length < 20) {
      newErrors.description = 'Description must be at least 20 characters'
    }

    if (!businessFormData.businessZipCode.trim()) {
      newErrors.businessZipCode = 'Business ZIP code is required'
    } else if (businessFormData.businessZipCode.trim().length < 3) {
      newErrors.businessZipCode = 'Business ZIP code must be at least 3 characters'
    }

    if (!businessFormData.businessEmail.trim()) {
      newErrors.businessEmail = 'Business email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(businessFormData.businessEmail.trim())) {
      newErrors.businessEmail = 'Please enter a valid email'
    }

    if (!businessFormData.businessPhone.trim()) {
      newErrors.businessPhone = 'Phone is required'
    }

    if (!businessFormData.businessAddress.trim()) {
      newErrors.businessAddress = 'Address is required'
    }

    if (!businessFormData.shopPincode.trim()) {
      newErrors.shopPincode = 'Shop pincode is required'
    } else if (businessFormData.shopPincode.trim().length < 3) {
      newErrors.shopPincode = 'Pincode must be at least 3 characters'
    }

    if (!businessFormData.taxId.trim()) {
      newErrors.taxId = 'Tax ID is required'
    }

    if (!businessFormData.businessRegistrationNumber.trim()) {
      newErrors.businessRegistrationNumber = 'Business registration number is required'
    }

    if (!businessFormData.businessType.trim()) {
      newErrors.businessType = 'Business type is required'
    }

    if (!businessFormData.gstinNumber.trim()) {
      newErrors.gstinNumber = 'GSTIN is required'
    }

    if (!businessFormData.fassaiNumber.trim()) {
      newErrors.fassaiNumber = 'FASSAI is required'
    }

    if (!businessFormData.shopCertificateNumber.trim()) {
      newErrors.shopCertificateNumber = 'Shop certificate number is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep3 = () => {
    const newErrors: Record<string, string> = {}

    if (!documentsData.gstinCertificateUrl) {
      newErrors.gstinCertificateUrl = 'GSTIN certificate is required'
    }

    if (!documentsData.fassaiCertificateUrl) {
      newErrors.fassaiCertificateUrl = 'FASSAI certificate is required'
    }

    if (!documentsData.shopOwnershipCertificateUrl) {
      newErrors.shopOwnershipCertificateUrl = 'Shop ownership certificate is required'
    }

    if (!documentsData.vendorPhotoUrl) {
      newErrors.vendorPhotoUrl = 'Your photo is required'
    }

    if (!documentsData.vendorSignatureUrl) {
      newErrors.vendorSignatureUrl = 'Your signature is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleUserInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name } = e.target
    const value =
      name === 'phoneNumber'
        ? e.target.value.replace(/\D/g, '').slice(0, 10)
        : e.target.value
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

  const handleBusinessInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setBusinessFormData((prev) => ({ ...prev, [name]: value }))

    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const handleDocumentUpload = (field: string, value: string) => {
    setDocumentsData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isSubmitting || isLoading) {
      return
    }

    if (!validateStep1()) {
      return
    }

    try {
      setIsSubmitting(true)

      // Register user first
      await register(
        userFormData.email,
        userFormData.password,
        userFormData.firstName,
        userFormData.lastName,
        userFormData.phoneNumber.trim()
      )

      const user = useAuthStore.getState().user
      if (user?.id) {
        setStep(2)
        setErrors({})
        toast.success('Account created! Now add your business details.')
      }
    } catch (error: any) {
      const errorMsg = error?.message || 'Registration failed. Please try again.'
      const fieldErrors = error?.errors as Record<string, string> | undefined

      if (fieldErrors && Object.keys(fieldErrors).length > 0) {
        setErrors((prev) => ({ ...prev, ...fieldErrors }))
      }

      if (errorMsg.toLowerCase().includes('email already registered')) {
        try {
          await login(userFormData.email, userFormData.password)
          setStep(2)
          setErrors({})
          toast.success('Logged in! Continue with business details.')
          return
        } catch {
          toast.error('Email is already registered. Please log in with your password to continue.')
          return
        }
      }

      toast.error(errorMsg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStep2Submit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateStep2()) {
      toast.error('Please complete all required business details before continuing.')
      return
    }

    setStep(3)
    setErrors({})
  }

  const handleStep3Submit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isSubmitting || isLoading) {
      return
    }

    if (!validateStep3()) {
      return
    }

    try {
      setIsSubmitting(true)

      await registerVendor(
        businessFormData.businessName.trim(),
        businessFormData.description.trim(),
        businessFormData.businessEmail.trim(),
        businessFormData.businessPhone.trim(),
        businessFormData.businessAddress.trim(),
        businessFormData.businessZipCode.trim(),
        businessFormData.shopPincode.trim(),
        businessFormData.gstinNumber.trim(),
        businessFormData.fassaiNumber.trim(),
        businessFormData.shopCertificateNumber.trim(),
        documentsData.gstinCertificateUrl,
        documentsData.fassaiCertificateUrl,
        documentsData.shopOwnershipCertificateUrl,
        documentsData.vendorPhotoUrl,
        documentsData.vendorSignatureUrl,
        businessFormData.taxId.trim(),
        businessFormData.businessRegistrationNumber.trim(),
        businessFormData.businessType.trim()
      )

      toast.success('Vendor registration complete! Documents under review.')
      setTimeout(() => {
        router.push('/vendor/verification/pending')
      }, 1500)
    } catch (error: any) {
      const errorMsg = error?.message || 'Failed to complete registration. Please try again.'

      if (errorMsg.toLowerCase().includes('already has a vendor account')) {
        toast.success('Vendor account exists. Redirecting to dashboard.')
        router.push('/vendor/dashboard')
        return
      }

      toast.error(errorMsg)
    } finally {
      setIsSubmitting(false)
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 py-12 px-4">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader className="text-center space-y-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-t-lg">
          <div className="flex justify-center mb-2">
            <Store className="h-10 w-10" />
          </div>
          <CardTitle className="text-3xl font-bold">
            {step === 1 && 'Create Your Account'}
            {step === 2 && 'Business Details'}
            {step === 3 && 'Documents & Verification'}
          </CardTitle>
          <CardDescription className="text-emerald-50">
            {step === 1 && 'Step 1 of 3: Set up your vendor account'}
            {step === 2 && 'Step 2 of 3: Tell us about your business'}
            {step === 3 && 'Step 3 of 3: Upload required documents'}
          </CardDescription>

          <StepIndicator currentStep={step} totalSteps={3} />
        </CardHeader>

        <CardContent className="pt-8">
          {/* STEP 1: USER ACCOUNT */}
          {step === 1 && (
            <form onSubmit={handleStep1Submit} className="space-y-5">
              {/* Name Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      name="firstName"
                      placeholder="John"
                      value={userFormData.firstName}
                      onChange={handleUserInputChange}
                      className={`pl-10 ${errors.firstName ? 'border-red-500 bg-red-50' : ''}`}
                      disabled={isSubmitting || isLoading}
                    />
                  </div>
                  {errors.firstName && (
                    <p className="text-xs text-red-600">{errors.firstName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      name="lastName"
                      placeholder="Doe"
                      value={userFormData.lastName}
                      onChange={handleUserInputChange}
                      className={`pl-10 ${errors.lastName ? 'border-red-500 bg-red-50' : ''}`}
                      disabled={isSubmitting || isLoading}
                    />
                  </div>
                  {errors.lastName && (
                    <p className="text-xs text-red-600">{errors.lastName}</p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    value={userFormData.email}
                    onChange={handleUserInputChange}
                    className={`pl-10 ${errors.email ? 'border-red-500 bg-red-50' : ''}`}
                    disabled={isSubmitting || isLoading}
                  />
                </div>
                {errors.email && <p className="text-xs text-red-600">{errors.email}</p>}
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    name="phoneNumber"
                    type="tel"
                    placeholder="10-digit phone number"
                    value={userFormData.phoneNumber}
                    onChange={handleUserInputChange}
                    className={`pl-10 ${errors.phoneNumber ? 'border-red-500 bg-red-50' : ''}`}
                    maxLength={10}
                    disabled={isSubmitting || isLoading}
                  />
                </div>
                {errors.phoneNumber && (
                  <p className="text-xs text-red-600">{errors.phoneNumber}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={userFormData.password}
                    onChange={handleUserInputChange}
                    className={`pl-10 pr-10 ${errors.password ? 'border-red-500 bg-red-50' : ''}`}
                    disabled={isSubmitting || isLoading}
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
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${getPasswordStrengthColor()}`}
                          style={{ width: `${(passwordStrength / 5) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-gray-600">
                        {getPasswordStrengthText()}
                      </span>
                    </div>
                  </div>
                )}
                {errors.password && (
                  <p className="text-xs text-red-600">{errors.password}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={userFormData.confirmPassword}
                    onChange={handleUserInputChange}
                    className={`pl-10 pr-10 ${errors.confirmPassword ? 'border-red-500 bg-red-50' : ''}`}
                    disabled={isSubmitting || isLoading}
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
                      <span className="text-xs font-semibold">Passwords match</span>
                    </div>
                  )}
                {errors.confirmPassword && (
                  <p className="text-xs text-red-600">{errors.confirmPassword}</p>
                )}
              </div>

              {/* Next Button */}
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold py-2"
                disabled={isSubmitting || isLoading}
              >
                {isSubmitting || isLoading ? 'Creating Account...' : 'Next: Business Details'}
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>

              {/* Sign In Link */}
              <div className="text-center text-sm text-gray-600">
                Already a vendor?{' '}
                <Link href="/auth/vendor/login" className="font-semibold text-emerald-600 hover:text-emerald-700">
                  Sign In
                </Link>
              </div>
            </form>
          )}

          {/* STEP 2: BUSINESS DETAILS */}
          {step === 2 && (
            <form onSubmit={handleStep2Submit} className="space-y-5">
              {/* Business Name */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">
                  Business Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Store className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    name="businessName"
                    placeholder="My Awesome Store"
                    value={businessFormData.businessName}
                    onChange={handleBusinessInputChange}
                    className={`pl-10 ${errors.businessName ? 'border-red-500 bg-red-50' : ''}`}
                  />
                </div>
                {errors.businessName && (
                  <p className="text-xs text-red-600">{errors.businessName}</p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">
                  Business Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  placeholder="Describe your business (min 20 characters)..."
                  value={businessFormData.description}
                  onChange={handleBusinessInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none ${
                    errors.description
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-300'
                  }`}
                  rows={4}
                />
                <p className="text-xs text-gray-500">
                  {businessFormData.description.length} / 20 characters minimum
                </p>
                {errors.description && (
                  <p className="text-xs text-red-600">{errors.description}</p>
                )}
              </div>

              {/* Business Email & Phone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Business Email <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      name="businessEmail"
                      type="email"
                      placeholder="store@example.com"
                      value={businessFormData.businessEmail}
                      onChange={handleBusinessInputChange}
                      className={`pl-10 ${errors.businessEmail ? 'border-red-500 bg-red-50' : ''}`}
                    />
                  </div>
                  {errors.businessEmail && (
                    <p className="text-xs text-red-600">{errors.businessEmail}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Business Phone <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      name="businessPhone"
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      value={businessFormData.businessPhone}
                      onChange={handleBusinessInputChange}
                      className={`pl-10 ${errors.businessPhone ? 'border-red-500 bg-red-50' : ''}`}
                    />
                  </div>
                  {errors.businessPhone && (
                    <p className="text-xs text-red-600">{errors.businessPhone}</p>
                  )}
                </div>
              </div>

              {/* Address */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">
                  Business Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    name="businessAddress"
                    placeholder="123 Main Street, City, State"
                    value={businessFormData.businessAddress}
                    onChange={handleBusinessInputChange}
                    className={`pl-10 ${errors.businessAddress ? 'border-red-500 bg-red-50' : ''}`}
                  />
                </div>
                {errors.businessAddress && (
                  <p className="text-xs text-red-600">{errors.businessAddress}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Business ZIP/Pincode <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      name="businessZipCode"
                      placeholder="400001"
                      value={businessFormData.businessZipCode}
                      onChange={handleBusinessInputChange}
                      className={`pl-10 ${errors.businessZipCode ? 'border-red-500 bg-red-50' : ''}`}
                    />
                  </div>
                  {errors.businessZipCode && (
                    <p className="text-xs text-red-600">{errors.businessZipCode}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Business Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="businessType"
                    value={businessFormData.businessType}
                    onChange={handleBusinessInputChange}
                    className={`w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500 ${errors.businessType ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                  >
                    <option value="">Select business type</option>
                    <option value="SOLE_PROPRIETOR">Sole Proprietor</option>
                    <option value="PARTNERSHIP">Partnership</option>
                    <option value="LLP">LLP</option>
                    <option value="PRIVATE_LIMITED">Private Limited</option>
                    <option value="PUBLIC_LIMITED">Public Limited</option>
                    <option value="OTHER">Other</option>
                  </select>
                  {errors.businessType && (
                    <p className="text-xs text-red-600">{errors.businessType}</p>
                  )}
                </div>
              </div>

              {/* Shop Pincode - EMPHASIZED */}
              <div className="space-y-2 border-2 border-emerald-200 p-4 rounded-lg bg-emerald-50">
                <label className="text-sm font-bold text-emerald-900">
                  Shop Pincode <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-emerald-700 mb-2">
                  📍 This is the primary location used for customer searches. Customers near this pincode will find your shop first.
                </p>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-emerald-600" />
                  <Input
                    name="shopPincode"
                    placeholder="560001"
                    value={businessFormData.shopPincode}
                    onChange={handleBusinessInputChange}
                    className={`pl-10 border-emerald-400 font-semibold ${
                      errors.shopPincode
                        ? 'border-red-500 bg-red-50'
                        : ''
                    }`}
                  />
                </div>
                {errors.shopPincode && (
                  <p className="text-xs text-red-600">{errors.shopPincode}</p>
                )}
              </div>

              {/* Tax Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    GSTIN <span className="text-red-500">*</span>
                  </label>
                  <Input
                    name="gstinNumber"
                    placeholder="18AABCT1234H1Z0"
                    value={businessFormData.gstinNumber}
                    onChange={handleBusinessInputChange}
                    className={errors.gstinNumber ? 'border-red-500 bg-red-50' : ''}
                  />
                  {errors.gstinNumber && (
                    <p className="text-xs text-red-600">{errors.gstinNumber}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    FASSAI <span className="text-red-500">*</span>
                  </label>
                  <Input
                    name="fassaiNumber"
                    placeholder="1234567890123456"
                    value={businessFormData.fassaiNumber}
                    onChange={handleBusinessInputChange}
                    className={errors.fassaiNumber ? 'border-red-500 bg-red-50' : ''}
                  />
                  {errors.fassaiNumber && (
                    <p className="text-xs text-red-600">{errors.fassaiNumber}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Shop Cert # <span className="text-red-500">*</span>
                  </label>
                  <Input
                    name="shopCertificateNumber"
                    placeholder="SOC123456"
                    value={businessFormData.shopCertificateNumber}
                    onChange={handleBusinessInputChange}
                    className={errors.shopCertificateNumber ? 'border-red-500 bg-red-50' : ''}
                  />
                  {errors.shopCertificateNumber && (
                    <p className="text-xs text-red-600">{errors.shopCertificateNumber}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Tax ID <span className="text-red-500">*</span>
                  </label>
                  <Input
                    name="taxId"
                    placeholder="Enter Tax ID (or GSTIN)"
                    value={businessFormData.taxId}
                    onChange={handleBusinessInputChange}
                    className={errors.taxId ? 'border-red-500 bg-red-50' : ''}
                  />
                  {errors.taxId && (
                    <p className="text-xs text-red-600">{errors.taxId}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Business Registration Number <span className="text-red-500">*</span>
                  </label>
                  <Input
                    name="businessRegistrationNumber"
                    placeholder="Company registration number"
                    value={businessFormData.businessRegistrationNumber}
                    onChange={handleBusinessInputChange}
                    className={errors.businessRegistrationNumber ? 'border-red-500 bg-red-50' : ''}
                  />
                  {errors.businessRegistrationNumber && (
                    <p className="text-xs text-red-600">{errors.businessRegistrationNumber}</p>
                  )}
                </div>
              </div>

              {/* Navigation */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setStep(1); setErrors({}); }}
                  className="flex-1"
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>

                <Button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold py-2"
                >
                  Next: Upload Documents
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </form>
          )}

          {/* STEP 3: DOCUMENTS */}
          {step === 3 && (
            <form onSubmit={handleStep3Submit} className="space-y-6">
              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-blue-900">Verification Required</p>
                  <p className="text-xs text-blue-800 mt-1">
                    All documents will be reviewed by our admin team. You can start adding items once your documents are verified.
                    You can upload JPEG, PNG, or PDF files.
                  </p>
                </div>
              </div>

              {/* GSTIN Certificate */}
              <DocumentUploadCard
                title="GSTIN Certificate"
                description="Upload your GST registration certificate"
                field="gstinCertificateUrl"
                value={documentsData.gstinCertificateUrl}
                onCapture={handleDocumentUpload}
                error={errors.gstinCertificateUrl}
                icon="📄"
              />

              {/* FASSAI Certificate */}
              <DocumentUploadCard
                title="FASSAI Certificate"
                description="Upload your FASSAI registration certificate"
                field="fassaiCertificateUrl"
                value={documentsData.fassaiCertificateUrl}
                onCapture={handleDocumentUpload}
                error={errors.fassaiCertificateUrl}
                icon="🏪"
              />

              {/* Shop Ownership Certificate */}
              <DocumentUploadCard
                title="Shop Ownership Certificate"
                description="Upload your shop ownership or lease proof"
                field="shopOwnershipCertificateUrl"
                value={documentsData.shopOwnershipCertificateUrl}
                onCapture={handleDocumentUpload}
                error={errors.shopOwnershipCertificateUrl}
                icon="🏢"
              />

              {/* Your Photo */}
              <DocumentUploadCard
                title="Your Photo"
                description="Take or upload a clear passport-style photo"
                field="vendorPhotoUrl"
                value={documentsData.vendorPhotoUrl}
                onCapture={handleDocumentUpload}
                error={errors.vendorPhotoUrl}
                isPhoto={true}
                icon="📸"
              />

              {/* Your Signature */}
              <DocumentUploadCard
                title="Your Signature"
                description="Take or upload a photo of your signature"
                field="vendorSignatureUrl"
                value={documentsData.vendorSignatureUrl}
                onCapture={handleDocumentUpload}
                error={errors.vendorSignatureUrl}
                isPhoto={true}
                icon="✍️"
              />

              {/* Submit Section */}
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-4 rounded-lg">
                <p className="text-sm text-gray-700 mb-4">
                  <CheckCircle className="inline h-4 w-4 text-green-600 mr-2" />
                  Ready to submit? Make sure all documents are uploaded.
                </p>
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold py-2"
                  disabled={isSubmitting || isLoading}
                >
                  {isSubmitting || isLoading
                    ? 'Registering...'
                    : 'Complete Registration'}
                </Button>
              </div>

              {/* Navigation */}
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => { setStep(2); setErrors({}); }}
                disabled={isSubmitting || isLoading}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back to Business Details
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

