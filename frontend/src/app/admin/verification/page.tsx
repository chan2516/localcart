'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { isAnyAdminRole, useAuthStore } from '@/lib/auth-store'
import { apiClient } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AdminShell } from '@/components/admin-shell'

type VendorStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED'

type Vendor = {
  id: number
  businessName: string
  businessEmail?: string
  businessPhone?: string
  businessAddress?: string
  businessZipCode?: string
  status: VendorStatus
  createdAt?: string
  rejectionReason?: string
}

export default function AdminVerificationPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()

  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [processingVendorId, setProcessingVendorId] = useState<number | null>(null)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/admin/login')
      return
    }

    if (user && !isAnyAdminRole(user.role)) {
      toast.error('Admin access is required')
      router.push('/')
      return
    }

    void loadVendors()
  }, [isAuthenticated, user, router])

  const summary = useMemo(() => {
    return vendors.reduce(
      (acc, vendor) => {
        acc[vendor.status] += 1
        return acc
      },
      { PENDING: 0, APPROVED: 0, REJECTED: 0, SUSPENDED: 0 } as Record<VendorStatus, number>
    )
  }, [vendors])

  const loadVendors = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get<{ content?: Vendor[]; vendors?: Vendor[] }>('/admin/vendors?page=0&size=100')
      setVendors(response.content || response.vendors || [])
    } catch (error: any) {
      toast.error(error?.message || 'Failed to load vendor verification data')
    } finally {
      setLoading(false)
    }
  }

  const handleDecision = async (vendorId: number, status: 'APPROVED' | 'REJECTED') => {
    const reason = status === 'REJECTED'
      ? window.prompt('Add a rejection reason (required):')?.trim()
      : undefined

    if (status === 'REJECTED' && !reason) {
      toast.error('Rejection reason is required')
      return
    }

    try {
      setProcessingVendorId(vendorId)
      await apiClient.post('/admin/vendors/approve', {
        vendorId,
        status,
        reason,
      })
      toast.success(`Vendor ${status.toLowerCase()} successfully`)
      await loadVendors()
    } catch (error: any) {
      toast.error(error?.message || 'Failed to update vendor verification status')
    } finally {
      setProcessingVendorId(null)
    }
  }

  if (loading) {
    return <div className="max-w-7xl mx-auto px-4 py-10">Loading verification dashboard...</div>
  }

  return (
    <AdminShell title="Admin Verification Dashboard" subtitle="Review and verify vendor applications and compliance status.">
      <div className="flex gap-2">
        <Link href="/admin/dashboard">
          <Button variant="outline">Back to Admin Dashboard</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardHeader><CardTitle>Pending</CardTitle></CardHeader><CardContent>{summary.PENDING}</CardContent></Card>
        <Card><CardHeader><CardTitle>Approved</CardTitle></CardHeader><CardContent>{summary.APPROVED}</CardContent></Card>
        <Card><CardHeader><CardTitle>Rejected</CardTitle></CardHeader><CardContent>{summary.REJECTED}</CardContent></Card>
        <Card><CardHeader><CardTitle>Suspended</CardTitle></CardHeader><CardContent>{summary.SUSPENDED}</CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vendor Verification Queue</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {vendors.length === 0 && <p className="text-gray-600">No vendor applications found.</p>}
          {vendors.map((vendor) => (
            <div key={vendor.id} className="rounded-md border p-3 flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{vendor.businessName}</p>
                <p className="text-sm text-gray-600">{vendor.businessEmail || 'No email'} | {vendor.businessPhone || 'No phone'}</p>
                <p className="text-sm text-gray-600">{vendor.businessAddress || 'No address'} {vendor.businessZipCode ? `- ${vendor.businessZipCode}` : ''}</p>
                <p className="text-xs mt-1 text-gray-500">Status: {vendor.status}</p>
                {vendor.rejectionReason ? (
                  <p className="text-xs mt-1 text-red-600">Reason: {vendor.rejectionReason}</p>
                ) : null}
              </div>
              <div className="flex gap-2">
                <Button
                  disabled={vendor.status === 'APPROVED' || processingVendorId === vendor.id}
                  onClick={() => handleDecision(vendor.id, 'APPROVED')}
                >
                  Approve
                </Button>
                <Button
                  variant="destructive"
                  disabled={processingVendorId === vendor.id}
                  onClick={() => handleDecision(vendor.id, 'REJECTED')}
                >
                  Reject
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </AdminShell>
  )
}
