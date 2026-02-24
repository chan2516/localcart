'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, Calendar, Mail, AlertCircle } from 'lucide-react'

export default function RegistrationCompletePage() {
  const router = useRouter()

  const handleDone = () => {
    router.push('/auth/vendor/login')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100 py-12 px-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardContent className="pt-10 text-center space-y-6">
          {/* Success Icon */}
          <div className="flex justify-center">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>

          {/* Title */}
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold text-gray-900">
              Registration Submitted!
            </CardTitle>
            <CardDescription className="text-base text-gray-600">
              Thank you for registering as a vendor with LocalCart
            </CardDescription>
          </div>

          {/* Information Boxes */}
          <div className="space-y-3">
            {/* What's Next */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
              <div className="flex gap-2">
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <div className="text-left">
                  <p className="font-semibold mb-1">What happens next?</p>
                  <p>
                    Our admin team will review your application and verify your business details. You'll receive an email notification when your account is approved.
                  </p>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
              <div className="flex gap-2">
                <Calendar className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <div className="text-left">
                  <p className="font-semibold mb-1">Expected Timeline</p>
                  <p>Approval usually takes 1-3 business days. We'll notify you by email (check spam folder).</p>
                </div>
              </div>
            </div>

            {/* Email Confirmation */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-800">
              <div className="flex gap-2">
                <Mail className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <div className="text-left">
                  <p className="font-semibold mb-1">Confirmation Email Sent</p>
                  <p>Check your email for a confirmation message. You may need to verify your email address.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Next Steps List */}
          <div className="bg-gray-50 rounded-lg p-4 text-left text-sm">
            <p className="font-semibold text-gray-900 mb-2">What you can do now:</p>
            <ul className="space-y-1 text-gray-700">
              <li>✓ Check your email for confirmation</li>
              <li>✓ Verify your email if needed</li>
              <li>✓ Wait for admin approval (1-3 days)</li>
              <li>✓ Once approved, start adding products to your store</li>
            </ul>
          </div>

          {/* Buttons */}
          <div className="space-y-3 pt-4">
            <Button
              onClick={handleDone}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2"
            >
              Back to Vendor Login
            </Button>

            <Button
              variant="outline"
              onClick={() => router.push('/')}
              className="w-full"
            >
              Continue as Customer
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
