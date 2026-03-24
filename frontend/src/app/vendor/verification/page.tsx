'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/auth-store'
import { apiClient } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type VendorProfile = {
  id: number
  businessName: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED'
  rejectionReason?: string
  createdAt?: string
  approvedAt?: string
  businessZipCode?: string
}

export default function VendorVerificationPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()
  const [vendor, setVendor] = useState<VendorProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/vendor/login')
      return
    }

    if (user && user.role !== 'VENDOR') {
      toast.error('Vendor access is required')
      router.push('/')
      return
    }

    const loadVendor = async () => {
      try {
        const response = await apiClient.get<VendorProfile>('/vendors/me')
        setVendor(response)
      } catch (error: any) {
        toast.error(error?.message || 'Failed to load verification status')
      } finally {
        setLoading(false)
      }
    }

    void loadVendor()
  }, [isAuthenticated, user, router])

  if (loading) {
    return <div className="max-w-4xl mx-auto px-4 py-10">Loading verification status...</div>
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Vendor Verification</h1>
          <p className="text-gray-600">Track your verification and approval progress.</p>
        </div>
        <Link href="/vendor/dashboard">
          <Button variant="outline">Back to Vendor Dashboard</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{vendor?.businessName || 'Your Business'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p>
            Current status: <span className="font-semibold">{vendor?.status || user?.vendorStatus || 'PENDING'}</span>
          </p>
          <p className="text-sm text-gray-600">Business ZIP/Pincode: {vendor?.businessZipCode || 'Not set'}</p>
          {vendor?.approvedAt ? <p className="text-sm text-gray-600">Approved on: {vendor.approvedAt}</p> : null}
          {vendor?.rejectionReason ? <p className="text-sm text-red-600">Rejection reason: {vendor.rejectionReason}</p> : null}

          {!vendor || vendor.status === 'PENDING' ? (
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
              Your account is under review. Product and promotion operations are enabled only after approval.
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
