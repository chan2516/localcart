'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/auth-store'
import { apiClient } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Clock3, RefreshCw, ShieldCheck, XCircle } from 'lucide-react'

type VendorProfile = {
  id: number
  businessName: string
  description?: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED'
  rejectionReason?: string
  createdAt?: string
  approvedAt?: string
  businessZipCode?: string
  shopPincode?: string
  businessType?: string
}

type VendorDocument = {
  id: number
  documentType: string
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED' | string
  createdAt?: string
}

type CatalogAccess = {
  canAddItems: boolean
  vendorApproved: boolean
  allDocumentsVerified: boolean
  unverifiedDocumentCount: number
}

export default function VendorVerificationPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()
  const [vendor, setVendor] = useState<VendorProfile | null>(null)
  const [documents, setDocuments] = useState<VendorDocument[]>([])
  const [catalogAccess, setCatalogAccess] = useState<CatalogAccess | null>(null)
  const [loading, setLoading] = useState(true)
  const [rechecking, setRechecking] = useState(false)

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
        const [vendorResponse, documentResponse, accessResponse] = await Promise.all([
          apiClient.get<VendorProfile>('/vendors/me'),
          apiClient.get<VendorDocument[]>('/vendors/me/documents').catch(() => []),
          apiClient.get<CatalogAccess>('/vendors/me/can-add-items').catch(() => null),
        ])
        setVendor(vendorResponse)
        setDocuments(Array.isArray(documentResponse) ? documentResponse : [])
        setCatalogAccess(accessResponse)
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

  const status = vendor?.status || user?.vendorStatus || 'PENDING'
  const formatDate = (value?: string) => (value ? new Date(value).toLocaleString() : 'Not set')
  const verifiedDocuments = documents.filter((item) => item.verificationStatus === 'VERIFIED').length
  const rejectedDocuments = documents.filter((item) => item.verificationStatus === 'REJECTED').length
  const pendingDocuments = documents.filter((item) => item.verificationStatus === 'PENDING').length

  const statusTone =
    status === 'APPROVED'
      ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
      : status === 'REJECTED'
        ? 'bg-rose-100 text-rose-800 border-rose-200'
        : status === 'SUSPENDED'
          ? 'bg-amber-100 text-amber-800 border-amber-200'
          : 'bg-slate-100 text-slate-800 border-slate-200'

  const recheckAccess = async () => {
    try {
      setRechecking(true)
      const response = await apiClient.get<CatalogAccess>('/vendors/me/can-add-items')
      setCatalogAccess(response)
      toast.success(response.canAddItems ? 'You can now add products' : 'Verification still in progress')
    } catch (error: any) {
      toast.error(error?.message || 'Unable to recheck verification')
    } finally {
      setRechecking(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-6">
      <div className="rounded-2xl border bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-900 p-6 text-white shadow-lg">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-[0.24em] text-emerald-200">Vendor Verification</p>
            <h1 className="text-3xl font-bold">Verification Status</h1>
            <p className="text-sm text-slate-200">Track approval, document checks, and catalog access readiness.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="border-white/20 bg-white/10 text-white hover:bg-white/20"
              onClick={recheckAccess}
              disabled={rechecking}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${rechecking ? 'animate-spin' : ''}`} />
              Recheck
            </Button>
            <Link href="/vendor/dashboard">
              <Button variant="outline" className="border-white/20 bg-white/10 text-white hover:bg-white/20">Back to Vendor Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Current Status</CardTitle></CardHeader>
          <CardContent><Badge className={statusTone}>{status}</Badge></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Pending Docs</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">{pendingDocuments}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Verified Docs</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold text-emerald-700">{verifiedDocuments}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Rejected Docs</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold text-rose-700">{rejectedDocuments}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{vendor?.businessName || 'Your Business'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-slate-700">{vendor?.description || 'Business description is not provided yet.'}</p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <p className="text-sm text-slate-600">Business ZIP/Pincode: <span className="font-medium">{vendor?.businessZipCode || 'Not set'}</span></p>
            <p className="text-sm text-slate-600">Shop Pincode: <span className="font-medium">{vendor?.shopPincode || 'Not set'}</span></p>
            <p className="text-sm text-slate-600">Business Type: <span className="font-medium">{vendor?.businessType || 'Not set'}</span></p>
            <p className="text-sm text-slate-600">Created: <span className="font-medium">{formatDate(vendor?.createdAt)}</span></p>
          </div>
          {vendor?.approvedAt ? <p className="text-sm text-slate-600">Approved on: <span className="font-medium">{formatDate(vendor.approvedAt)}</span></p> : null}
          {vendor?.rejectionReason ? <p className="text-sm text-rose-600">Rejection reason: {vendor.rejectionReason}</p> : null}

          <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700">
            <p className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              Product catalog access: <span className="font-semibold">{catalogAccess?.canAddItems ? 'Enabled' : 'Locked'}</span>
            </p>
            <p className="mt-1 text-xs text-slate-600">
              {catalogAccess?.allDocumentsVerified
                ? 'All required documents are verified.'
                : `${catalogAccess?.unverifiedDocumentCount ?? 0} required document(s) still pending.`}
            </p>
          </div>

          {status === 'PENDING' ? (
            <p className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              <Clock3 className="h-4 w-4" />
              Your account is under review. Product operations unlock after approval and document verification.
            </p>
          ) : null}

          {status === 'APPROVED' ? (
            <p className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              <CheckCircle2 className="h-4 w-4" />
              Your account is approved.
            </p>
          ) : null}

          {status === 'REJECTED' ? (
            <p className="flex items-center gap-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              <XCircle className="h-4 w-4" />
              Your account was rejected. Resolve the issue and re-submit.
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
