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
} from 'lucide-react'

interface StepIndicatorProps {
  currentStep: number
  totalSteps: number
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep, totalSteps }) => {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {Array.from({ length: totalSteps }).map((_, index) => (
        <div key={index} className="flex items-center">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
              index + 1 <= currentStep
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-600'
            }`}
          >
            {index + 1}
          </div>
          {index < totalSteps - 1 && (
            <div
              className={`h-1 w-12 mx-2 transition-all ${
                index + 1 < currentStep ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  )
}

export default function VendorRegisterPage() {
  const router = useRouter()
  const { register, login, registerVendor, isLoading } = useAuthStore()
  const [currentStep, setCurrentStep] = useState(1)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  // Step 1: User Account Data
  const [userFormData, setUserFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
  })

  // Step 2: Business Details
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
    businessType: 'SOLE_PROPRIETOR',
  })

  // Step 3: Documents & Photos
  const [documentsData, setDocumentsData] = useState({
    gstinCertificateUrl: '',
    fassaiCertificateUrl: '',
    shopOwnershipCertificateUrl: '',
    vendorPhotoUrl: '',
    vendorSignatureUrl: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [passwordStrength, setPasswordStrength] = useState(0)

  // ============= Step 1 Validation =============
  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!userFormData.email) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userFormData.email)) {
      newErrors.email = 'Please enter a valid email'
    }

    if (!userFormData.firstName) newErrors.firstName = 'First name is required'
    if (!userFormData.lastName) newErrors.lastName = 'Last name is required'

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

  // ============= Step 2 Validation =============
  const validateStep2 = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!businessFormData.businessName) {
      newErrors.businessName = 'Business name is required'
    }

    if (!businessFormData.description || businessFormData.description.length < 20) {
      newErrors.description = 'Description must be at least 20 characters'
    }

    if (!businessFormData.businessEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(businessFormData.businessEmail)) {
      newErrors.businessEmail = 'Valid business email is required'
    }

    if (!businessFormData.businessPhone) {
      newErrors.businessPhone = 'Business phone is required'
    }

    if (!businessFormData.businessAddress) {
      newErrors.businessAddress = 'Business address is required'
    }

    if (!businessFormData.shopPincode || businessFormData.shopPincode.length < 3) {
      newErrors.shopPincode = 'Valid shop pincode is required'
    }

    if (!businessFormData.taxId) {
      newErrors.taxId = 'Tax ID is required'
    }

    if (!businessFormData.businessRegistrationNumber) {
      newErrors.businessRegistrationNumber = 'Business registration number is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // ============= Step 3 Validation =============
  const validateStep3 = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!documentsData.gstinCertificateUrl) {
      newErrors.gstinCertificateUrl = 'GSTIN Certificate is required'
    }

    if (!documentsData.fassaiCertificateUrl) {
      newErrors.fassaiCertificateUrl = 'FASSAI Certificate is required'
    }

    if (!documentsData.shopOwnershipCertificateUrl) {
      newErrors.shopOwnershipCertificateUrl = 'Shop Ownership Certificate is required'
    }

    if (!documentsData.vendorPhotoUrl) {
      newErrors.vendorPhotoUrl = 'Vendor photo is required'
    }

    if (!documentsData.vendorSignatureUrl) {
      newErrors.vendorSignatureUrl = 'Vendor signature is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // ============= Form Handlers =============
  const calculatePasswordStrength = (password: string) => {
    let strength = 0
    if (password.length >= 8) strength += 1
    if (password.length >= 12) strength += 1
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 1
    if (/[0-9]/.test(password)) strength += 1
    if (/[^a-zA-Z0-9]/.test(password)) strength += 1
    return strength
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

  const handleDocumentCapture = (field: string, url: string) => {
    setDocumentsData((prev) => ({ ...prev, [field]: url }))
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  // ============= Step Handlers =============
  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateStep1()) return

    try {
      setIsSubmitting(true)
      // Register user account
      await register(
        userFormData.email,
        userFormData.password,
        userFormData.firstName,
        userFormData.lastName,
        userFormData.phoneNumber.trim()
      )
      // Auto-login
      await login(userFormData.email, userFormData.password)
      
      toast.success('Account created! Proceed to business details.')
      setCurrentStep(2)
    } catch (error: any) {
      const fieldErrors = error?.errors as Record<string, string> | undefined
      if (fieldErrors && Object.keys(fieldErrors).length > 0) {
        setErrors((prev) => ({ ...prev, ...fieldErrors }))
      }
      toast.error(error?.message || 'Failed to create account')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateStep2()) return

    toast.success('Business details saved! Upload documents next.')
    setCurrentStep(3)
  }

  const handleStep3Submit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateStep3()) return

    try {
      setIsSubmitting(true)

      // Register as vendor
      await registerVendor(
        businessFormData.businessName,
        businessFormData.description,
        businessFormData.businessEmail,
        businessFormData.businessPhone,
        businessFormData.businessAddress,
        businessFormData.businessZipCode,
        businessFormData.shopPincode,
        businessFormData.taxId,
        businessFormData.businessRegistrationNumber,
        businessFormData.businessType
      )

      toast.success('Vendor registration completed! You will receive approval notification soon.')
      router.push('/vendor/verification/pending')
    } catch (error: any) {
      toast.error(error?.message || 'Vendor registration failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      setErrors({})
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100 py-12 px-4">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-center space-y-1 rounded-t-lg">
          <CardTitle className="text-3xl">Become a Vendor</CardTitle>
          <CardDescription className="text-emerald-100">
            {currentStep === 1 && 'Step 1: Create Your Account'}
            {currentStep === 2 && 'Step 2: Business Details'}
            {currentStep === 3 && 'Step 3: Documents & Verification'}
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-8">
          <StepIndicator currentStep={currentStep} totalSteps={3} />

          {/* ============= STEP 1: USER ACCOUNT ============= */}
          {currentStep === 1 && (
            <form onSubmit={handleStep1Submit} className="space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">First Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      name="firstName"
                      placeholder="John"
                      value={userFormData.firstName}
                      onChange={handleUserInputChange}
                      className={`pl-10 ${errors.firstName ? 'border-red-500' : ''}`}
                      disabled={isSubmitting}
                    />
                  </div>
                  {errors.firstName && <p className="text-xs text-red-500">{errors.firstName}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Last Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      name="lastName"
                      placeholder="Doe"
                      value={userFormData.lastName}
                      onChange={handleUserInputChange}
                      className={`pl-10 ${errors.lastName ? 'border-red-500' : ''}`}
                      disabled={isSubmitting}
                    />
                  </div>
                  {errors.lastName && <p className="text-xs text-red-500">{errors.lastName}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    value={userFormData.email}
                    onChange={handleUserInputChange}
                    className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
                    disabled={isSubmitting}
                  />
                </div>
                {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    name="phoneNumber"
                    type="tel"
                    placeholder="10-digit phone number"
                    value={userFormData.phoneNumber}
                    onChange={handleUserInputChange}
                    className="pl-10"
                    maxLength={10}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={userFormData.password}
                    onChange={handleUserInputChange}
                    className={`pl-10 pr-10 ${errors.password ? 'border-red-500' : ''}`}
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {userFormData.password && (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1 bg-gray-200 rounded">
                      <div
                        className={`h-full rounded ${getPasswordStrengthColor()}`}
                        style={{ width: `${(passwordStrength / 5) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-600">{getPasswordStrengthText()}</span>
                  </div>
                )}
                {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={userFormData.confirmPassword}
                    onChange={handleUserInputChange}
                    className={`pl-10 pr-10 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-gray-400"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {userFormData.confirmPassword && userFormData.password === userFormData.confirmPassword && (
                  <div className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-xs">Passwords match</span>
                  </div>
                )}
                {errors.confirmPassword && <p className="text-sm text-red-500">{errors.confirmPassword}</p>}
              </div>

              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={isSubmitting}>
                {isSubmitting ? 'Creating Account...' : 'Continue to Business Details'}
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </form>
          )}

          {/* ============= STEP 2: BUSINESS DETAILS ============= */}
          {currentStep === 2 && (
            <form onSubmit={handleStep2Submit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Business Name *</label>
                <div className="relative">
                  <Store className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    name="businessName"
                    placeholder="My Shop Name"
                    value={businessFormData.businessName}
                    onChange={handleBusinessInputChange}
                    className={`pl-10 ${errors.businessName ? 'border-red-500' : ''}`}
                    disabled={isSubmitting}
                  />
                </div>
                {errors.businessName && <p className="text-xs text-red-500">{errors.businessName}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Business ZIP Code *</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      name="businessZipCode"
                      placeholder="e.g., 560001"
                      value={businessFormData.businessZipCode}
                      onChange={handleBusinessInputChange}
                      className="pl-10"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Shop Pincode (Location) *</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      name="shopPincode"
                      placeholder="e.g., 560001"
                      value={businessFormData.shopPincode}
                      onChange={handleBusinessInputChange}
                      className={`pl-10 ${errors.shopPincode ? 'border-red-500' : ''}`}
                      disabled={isSubmitting}
                    />
                  </div>
                  {errors.shopPincode && <p className="text-xs text-red-500">{errors.shopPincode}</p>}
                  <p className="text-xs text-gray-500">Used for location-based search by customers</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Business Address *</label>
                <textarea
                  name="businessAddress"
                  placeholder="Enter your full business address"
                  value={businessFormData.businessAddress}
                  onChange={handleBusinessInputChange}
                  className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-emerald-500 outline-none ${
                    errors.businessAddress ? 'border-red-500' : 'border-gray-300'
                  }`}
                  rows={3}
                  disabled={isSubmitting}
                />
                {errors.businessAddress && <p className="text-xs text-red-500">{errors.businessAddress}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Business Email *</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      name="businessEmail"
                      type="email"
                      placeholder="shop@example.com"
                      value={businessFormData.businessEmail}
                      onChange={handleBusinessInputChange}
                      className={`pl-10 ${errors.businessEmail ? 'border-red-500' : ''}`}
                      disabled={isSubmitting}
                    />
                  </div>
                  {errors.businessEmail && <p className="text-xs text-red-500">{errors.businessEmail}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Business Phone *</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      name="businessPhone"
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      value={businessFormData.businessPhone}
                      onChange={handleBusinessInputChange}
                      className={`pl-10 ${errors.businessPhone ? 'border-red-500' : ''}`}
                      disabled={isSubmitting}
                    />
                  </div>
                  {errors.businessPhone && <p className="text-xs text-red-500">{errors.businessPhone}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Business Description *</label>
                <textarea
                  name="description"
                  placeholder="Describe your business (minimum 20 characters)"
                  value={businessFormData.description}
                  onChange={handleBusinessInputChange}
                  className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-emerald-500 outline-none ${
                    errors.description ? 'border-red-500' : 'border-gray-300'
                  }`}
                  rows={3}
                  disabled={isSubmitting}
                />
                {errors.description && <p className="text-xs text-red-500">{errors.description}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Tax ID (GSTIN/VAT) *</label>
                  <Input
                    name="taxId"
                    placeholder="Your Tax ID"
                    value={businessFormData.taxId}
                    onChange={handleBusinessInputChange}
                    className={`${errors.taxId ? 'border-red-500' : ''}`}
                    disabled={isSubmitting}
                  />
                  {errors.taxId && <p className="text-xs text-red-500">{errors.taxId}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Business Registration # *</label>
                  <Input
                    name="businessRegistrationNumber"
                    placeholder="Registration Number"
                    value={businessFormData.businessRegistrationNumber}
                    onChange={handleBusinessInputChange}
                    className={`${errors.businessRegistrationNumber ? 'border-red-500' : ''}`}
                    disabled={isSubmitting}
                  />
                  {errors.businessRegistrationNumber && <p className="text-xs text-red-500">{errors.businessRegistrationNumber}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">GSTIN Number</label>
                <Input
                  name="gstinNumber"
                  placeholder="Your GSTIN"
                  value={businessFormData.gstinNumber}
                  onChange={handleBusinessInputChange}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">FASSAI Number</label>
                <Input
                  name="fassaiNumber"
                  placeholder="Your FASSAI Number"
                  value={businessFormData.fassaiNumber}
                  onChange={handleBusinessInputChange}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Shop Certificate Number</label>
                <Input
                  name="shopCertificateNumber"
                  placeholder="Your Shop Certificate Number"
                  value={businessFormData.shopCertificateNumber}
                  onChange={handleBusinessInputChange}
                  disabled={isSubmitting}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={handleBack}
                  disabled={isSubmitting}
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Continue to Documents'}
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </form>
          )}

          {/* ============= STEP 3: DOCUMENTS & PHOTOS ============= */}
          {currentStep === 3 && (
            <form onSubmit={handleStep3Submit} className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">Document Upload Guide</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• All documents will be verified by our admin team</li>
                  <li>• You can only add items after all documents are verified</li>
                  <li>• Ensure documents are clear and valid</li>
                  <li>• Photos must be recent and clear</li>
                </ul>
              </div>

              {/* Document Cards */}
              <DocumentUploadCard
                title="GSTIN Certificate"
                description="Upload your GSTIN certificate"
                field="gstinCertificateUrl"
                value={documentsData.gstinCertificateUrl}
                onCapture={handleDocumentCapture}
                error={errors.gstinCertificateUrl}
                icon={<FileText className="h-8 w-8 text-red-500" />}
              />

              <DocumentUploadCard
                title="FASSAI Certificate"
                description="Upload your FASSAI certificate (if applicable)"
                field="fassaiCertificateUrl"
                value={documentsData.fassaiCertificateUrl}
                onCapture={handleDocumentCapture}
                error={errors.fassaiCertificateUrl}
                icon={<FileText className="h-8 w-8 text-green-500" />}
              />

              <DocumentUploadCard
                title="Shop Ownership Certificate"
                description="Upload your shop ownership/rent proof"
                field="shopOwnershipCertificateUrl"
                value={documentsData.shopOwnershipCertificateUrl}
                onCapture={handleDocumentCapture}
                error={errors.shopOwnershipCertificateUrl}
                icon={<FileText className="h-8 w-8 text-blue-500" />}
              />

              <DocumentUploadCard
                title="Your Photo"
                description="Take or upload a clear photo of yourself (for verification)"
                field="vendorPhotoUrl"
                value={documentsData.vendorPhotoUrl}
                onCapture={handleDocumentCapture}
                error={errors.vendorPhotoUrl}
                isPhoto={true}
                icon={<Camera className="h-8 w-8 text-purple-500" />}
              />

              <DocumentUploadCard
                title="Your Signature"
                description="Upload a clear image of your signature"
                field="vendorSignatureUrl"
                value={documentsData.vendorSignatureUrl}
                onCapture={handleDocumentCapture}
                error={errors.vendorSignatureUrl}
                isPhoto={true}
                icon={<Camera className="h-8 w-8 text-orange-500" />}
              />

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={handleBack}
                  disabled={isSubmitting}
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700" disabled={isSubmitting}>
                  {isSubmitting ? 'Registering...' : 'Complete Registration'}
                  <CheckCircle className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </form>
          )}

          {/* Vendor Login Link */}
          <div className="mt-6 text-center text-sm text-gray-600">
            Already a vendor?{' '}
            <Link href="/auth/vendor/login" className="font-semibold text-emerald-600 hover:text-emerald-700">
              Sign in here
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ============= DOCUMENT UPLOAD CARD COMPONENT =============
interface DocumentUploadCardProps {
  title: string
  description: string
  field: string
  value: string
  onCapture: (field: string, url: string) => void
  error?: string
  isPhoto?: boolean
  icon: React.ReactNode
}

const DocumentUploadCard: React.FC<DocumentUploadCardProps> = ({
  title,
  description,
  field,
  value,
  onCapture,
  error,
  isPhoto,
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
    <div className={`border rounded-lg p-4 ${error ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}>
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-semibold text-gray-900">{title}</h4>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
        {icon}
      </div>

      {value ? (
        <div className="mt-4">
          <img src={value} alt={title} className="max-h-40 rounded-lg" />
          <button
            type="button"
            onClick={() => onCapture(field, '')}
            className="mt-2 text-sm text-red-600 hover:text-red-700 underline"
          >
            Remove & Recapture
          </button>
        </div>
      ) : (
        <div className="mt-4">
          <label className="block">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-emerald-500 transition">
              <input
                type="file"
                accept={isPhoto ? 'image/*' : 'image/*,.pdf'}
                onChange={handleFileChange}
                className="hidden"
              />
              <Camera className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Click to upload or take a photo</p>
            </div>
          </label>
        </div>
      )}

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  )
}
