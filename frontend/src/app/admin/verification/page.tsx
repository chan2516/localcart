'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { isAnyAdminRole, useAuthStore } from '@/lib/auth-store'
import { apiClient } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { AdminShell } from '@/components/admin-shell'
import { ActionReasonModal } from '@/components/action-reason-modal'
import { useReasonModal } from '@/hooks/use-reason-modal'
import { Building2, Camera, FileText, Phone, RefreshCw, ShieldCheck, Store, UserRound } from 'lucide-react'

type VendorStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED'
type VerificationTab = 'applications' | 'documents'

type VendorDocument = {
  id: number
  documentType: string
  documentUrl?: string
  fileName?: string
  mimeType?: string
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED' | string
  verificationComments?: string
  documentNumber?: string
  createdAt?: string
  updatedAt?: string
}

type Vendor = {
  id: number
  businessName: string
  description?: string
  businessEmail?: string
  businessPhone?: string
  businessAddress?: string
  businessZipCode?: string
  shopPincode?: string
  website?: string
  businessType?: string
  taxId?: string
  gstinNumber?: string
  fassaiNumber?: string
  shopCertificateNumber?: string
  businessRegistrationNumber?: string
  vendorPhotoUrl?: string
  vendorSignatureUrl?: string
  approvedAt?: string
  updatedAt?: string
  status: VendorStatus
  createdAt?: string
  rejectionReason?: string
  commissionRate?: number
  isDeleted?: boolean
  documents?: VendorDocument[]
}

function formatDate(value?: string) {
  return value ? new Date(value).toLocaleString() : 'Not set'
}

function formatDocumentType(value: string) {
  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function isImageDocument(document: VendorDocument) {
  const mimeType = document.mimeType?.toLowerCase() || ''
  const url = document.documentUrl?.toLowerCase() || ''
  return mimeType.startsWith('image/') || /\.(png|jpg|jpeg|webp|gif|bmp)$/i.test(url)
}

function isPdfDocument(document: VendorDocument) {
  const mimeType = document.mimeType?.toLowerCase() || ''
  const url = document.documentUrl?.toLowerCase() || ''
  return mimeType.includes('pdf') || url.endsWith('.pdf')
}

function statusTone(status: VendorStatus) {
  switch (status) {
    case 'APPROVED':
      return 'border-emerald-200 bg-emerald-100 text-emerald-800'
    case 'REJECTED':
      return 'border-rose-200 bg-rose-100 text-rose-800'
    case 'SUSPENDED':
      return 'border-amber-200 bg-amber-100 text-amber-800'
    default:
      return 'border-slate-200 bg-slate-100 text-slate-800'
  }
}

function documentTone(status: string) {
  switch (status) {
    case 'VERIFIED':
      return 'border-emerald-200 bg-emerald-100 text-emerald-800'
    case 'REJECTED':
      return 'border-rose-200 bg-rose-100 text-rose-800'
    default:
      return 'border-amber-200 bg-amber-100 text-amber-800'
  }
}

function DocumentPreview({ document }: { document: VendorDocument }) {
  const label = formatDocumentType(document.documentType)

  return (
    <div className="overflow-hidden rounded-xl border bg-slate-50">
      <div className="flex h-32 items-center justify-center bg-white">
        {isImageDocument(document) && document.documentUrl ? (
          <img src={document.documentUrl} alt={label} className="h-full w-full object-cover" />
        ) : isPdfDocument(document) ? (
          <div className="flex flex-col items-center gap-2 text-slate-500">
            <FileText className="h-5 w-5" />
            <span className="text-xs font-medium">PDF document</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-slate-500">
            <FileText className="h-5 w-5" />
            <span className="text-xs font-medium">{label}</span>
          </div>
        )}
      </div>
      <div className="space-y-1 border-t px-3 py-2">
        <p className="text-sm font-medium text-slate-900">{label}</p>
        <p className="text-[11px] text-slate-500">{document.fileName || 'Uploaded document'}</p>
      </div>
    </div>
  )
}

export default function AdminVerificationPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()

  const [vendors, setVendors] = useState<Vendor[]>([])
  const [documents, setDocuments] = useState<VendorDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [documentLoading, setDocumentLoading] = useState(true)
  const [processingVendorId, setProcessingVendorId] = useState<number | null>(null)
  const [processingDocumentId, setProcessingDocumentId] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<VerificationTab>('applications')
  const vendorRejectModal = useReasonModal<number, never>()
  const documentRejectModal = useReasonModal<number, never>()

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

    void Promise.all([loadVendors(), loadPendingDocuments()])
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

  const documentSummary = useMemo(() => {
    return documents.reduce(
      (acc, document) => {
        if (document.verificationStatus === 'VERIFIED') acc.verified += 1
        else if (document.verificationStatus === 'REJECTED') acc.rejected += 1
        else acc.pending += 1
        return acc
      },
      { pending: 0, verified: 0, rejected: 0 }
    )
  }, [documents])

  async function loadVendors() {
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

  async function loadPendingDocuments() {
    try {
      setDocumentLoading(true)
      const response = await apiClient.get<{ content?: VendorDocument[]; documents?: VendorDocument[] }>('/admin/vendor-documents/pending?page=0&size=100')
      setDocuments(response.content || response.documents || [])
    } catch (error: any) {
      toast.error(error?.message || 'Failed to load pending documents')
    } finally {
      setDocumentLoading(false)
    }
  }

  async function handleDecision(vendorId: number, status: 'APPROVED' | 'REJECTED', reason?: string) {
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

  async function handleDocumentDecision(documentId: number, verificationStatus: 'VERIFIED' | 'REJECTED', verificationComments?: string) {
    try {
      setProcessingDocumentId(documentId)
      await apiClient.post(`/admin/vendor-documents/${documentId}/verify`, {
        documentId,
        verificationStatus,
        verificationComments,
      })
      toast.success(`Document ${verificationStatus.toLowerCase()} successfully`)
      await loadPendingDocuments()
    } catch (error: any) {
      toast.error(error?.message || 'Failed to update document status')
    } finally {
      setProcessingDocumentId(null)
    }
  }

  async function handleRestoreVendor(vendorId: number) {
    try {
      setProcessingVendorId(vendorId)
      await apiClient.post(`/admin/vendors/${vendorId}/restore`)
      toast.success('Vendor restored successfully')
      await loadVendors()
    } catch (error: any) {
      toast.error(error?.message || 'Failed to restore vendor')
    } finally {
      setProcessingVendorId(null)
    }
  }

  function openVendorRejectModal(vendorId: number) {
    vendorRejectModal.open(vendorId)
  }

  function openDocumentRejectModal(documentId: number) {
    documentRejectModal.open(documentId)
  }

  async function submitVendorRejection() {
    if (!vendorRejectModal.state.target) return
    const reason = vendorRejectModal.state.reason.trim()
    if (!reason) {
      toast.error('Rejection reason is required')
      return
    }

    await handleDecision(vendorRejectModal.state.target, 'REJECTED', reason)
    vendorRejectModal.close()
  }

  async function submitDocumentRejection() {
    if (!documentRejectModal.state.target) return
    const reason = documentRejectModal.state.reason.trim()
    if (!reason) {
      toast.error('Rejection comment is required')
      return
    }

    await handleDocumentDecision(documentRejectModal.state.target, 'REJECTED', reason)
    documentRejectModal.close()
  }

  if (loading && documentLoading) {
    return <div className="mx-auto max-w-7xl px-4 py-10 text-slate-600">Loading verification dashboard...</div>
  }

  return (
    <AdminShell title="Admin Verification Dashboard" subtitle="Review and verify vendor applications and compliance status.">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-6 py-8 text-white shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.16),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(56,189,248,0.16),transparent_30%)]" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <Badge className="border-white/20 bg-white/10 text-white">Verification control center</Badge>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Review vendors and documents from one place.</h1>
              <p className="max-w-2xl text-sm leading-6 text-slate-300 md:text-base">
                Use the application queue for vendor approvals and the document queue for local uploads, certificates, and identity files.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/dashboard">
              <Button variant="secondary" className="bg-white text-slate-900 hover:bg-slate-100">Back to Dashboard</Button>
            </Link>
            <Button variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10" onClick={loadVendors}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Applications
            </Button>
            <Button variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10" onClick={loadPendingDocuments}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Documents
            </Button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card className="border-slate-200/80 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Pending Vendors</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold text-slate-900">{summary.PENDING}</CardContent>
        </Card>
        <Card className="border-emerald-200/80 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Approved Vendors</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold text-emerald-700">{summary.APPROVED}</CardContent>
        </Card>
        <Card className="border-rose-200/80 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Rejected Vendors</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold text-rose-700">{summary.REJECTED}</CardContent>
        </Card>
        <Card className="border-amber-200/80 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Suspended Vendors</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold text-amber-700">{summary.SUSPENDED}</CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Pending Documents</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold text-slate-900">{documentSummary.pending}</CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Verified Documents</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold text-emerald-700">{documentSummary.verified}</CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Rejected Documents</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold text-rose-700">{documentSummary.rejected}</CardContent>
        </Card>
      </div>

      <div className="inline-flex rounded-2xl border border-slate-200 bg-slate-100 p-1">
        <button
          type="button"
          className={`rounded-xl px-4 py-2 text-sm font-medium transition ${activeTab === 'applications' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          onClick={() => setActiveTab('applications')}
        >
          Vendor Applications
        </button>
        <button
          type="button"
          className={`rounded-xl px-4 py-2 text-sm font-medium transition ${activeTab === 'documents' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          onClick={() => setActiveTab('documents')}
        >
          Document Review
        </button>
      </div>

      {activeTab === 'applications' ? (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <ShieldCheck className="h-4 w-4" /> Vendor Verification Queue
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {vendors.length === 0 ? <p className="text-slate-600">No vendor applications found.</p> : null}
            {vendors.map((vendor) => {
              const certificateDocuments = (vendor.documents || []).filter((doc) => !['VENDOR_PHOTO', 'VENDOR_SIGNATURE'].includes(doc.documentType))

              return (
                <div key={vendor.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-16 w-16 rounded-2xl border border-slate-200">
                        <AvatarImage src={vendor.vendorPhotoUrl || ''} alt={vendor.businessName} />
                        <AvatarFallback className="rounded-2xl bg-slate-900 text-white">
                          <Store className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-semibold text-slate-900">{vendor.businessName}</h3>
                          <Badge className={statusTone(vendor.status)}>{vendor.status}</Badge>
                          {vendor.isDeleted ? <Badge variant="destructive">Banned</Badge> : null}
                        </div>
                        <p className="max-w-3xl text-sm text-slate-600">{vendor.description || 'No business description provided.'}</p>
                        <div className="flex flex-wrap gap-3 text-sm text-slate-600">
                          <span className="inline-flex items-center gap-2"><Building2 className="h-4 w-4" />{vendor.businessType || 'Business type not set'}</span>
                          <span className="inline-flex items-center gap-2"><Phone className="h-4 w-4" />{vendor.businessPhone || 'No phone'}</span>
                          <span className="inline-flex items-center gap-2"><UserRound className="h-4 w-4" />{vendor.businessEmail || 'No email'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {vendor.isDeleted ? (
                        <Button
                          variant="outline"
                          disabled={processingVendorId === vendor.id}
                          onClick={() => handleRestoreVendor(vendor.id)}
                        >
                          Restore
                        </Button>
                      ) : (
                        <>
                          <Button disabled={vendor.status === 'APPROVED' || processingVendorId === vendor.id} onClick={() => handleDecision(vendor.id, 'APPROVED')}>
                            Approve
                          </Button>
                          <Button variant="destructive" disabled={processingVendorId === vendor.id} onClick={() => openVendorRejectModal(vendor.id)}>
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
                    <div className="rounded-2xl border bg-slate-50 p-4">
                      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Business Details</p>
                      <div className="space-y-2 text-sm text-slate-700">
                        <p><span className="font-medium">Address:</span> {vendor.businessAddress || 'No address'}</p>
                        <p><span className="font-medium">ZIP:</span> {vendor.businessZipCode || 'Not set'}</p>
                        <p><span className="font-medium">Shop Pincode:</span> {vendor.shopPincode || 'Not set'}</p>
                        <p><span className="font-medium">Website:</span> {vendor.website || 'Not provided'}</p>
                      </div>
                    </div>

                    <div className="rounded-2xl border bg-slate-50 p-4">
                      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Registration IDs</p>
                      <div className="space-y-2 text-sm text-slate-700">
                        <p><span className="font-medium">Tax ID:</span> {vendor.taxId || 'Not set'}</p>
                        <p><span className="font-medium">GSTIN:</span> {vendor.gstinNumber || 'Not set'}</p>
                        <p><span className="font-medium">FASSAI:</span> {vendor.fassaiNumber || 'Not set'}</p>
                        <p><span className="font-medium">Shop Certificate:</span> {vendor.shopCertificateNumber || 'Not set'}</p>
                        <p><span className="font-medium">Business Reg. No.:</span> {vendor.businessRegistrationNumber || 'Not set'}</p>
                      </div>
                    </div>

                    <div className="rounded-2xl border bg-slate-50 p-4">
                      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Media & Certificates</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <div className="flex h-28 items-center justify-center overflow-hidden rounded-xl border bg-white">
                            {vendor.vendorPhotoUrl ? (
                              <img src={vendor.vendorPhotoUrl} alt={`${vendor.businessName} photo`} className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex flex-col items-center gap-1 text-xs text-slate-500">
                                <Camera className="h-4 w-4" />
                                No photo
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-slate-600">Vendor photo</p>
                        </div>
                        <div className="space-y-2">
                          <div className="flex h-28 items-center justify-center overflow-hidden rounded-xl border bg-white p-2">
                            {vendor.vendorSignatureUrl ? (
                              <img src={vendor.vendorSignatureUrl} alt={`${vendor.businessName} signature`} className="h-full w-full object-contain" />
                            ) : (
                              <div className="flex flex-col items-center gap-1 text-xs text-slate-500">
                                <FileText className="h-4 w-4" />
                                No signature
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-slate-600">Signature</p>
                        </div>
                      </div>

                      <div className="mt-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Uploaded Certificates</p>
                          <Badge className="border-slate-200 bg-slate-100 text-slate-700">{certificateDocuments.length}</Badge>
                        </div>
                        {certificateDocuments.length > 0 ? (
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1">
                            {certificateDocuments.map((document) => (
                              <div key={document.id} className="space-y-2 rounded-xl border bg-white p-2 shadow-sm">
                                <DocumentPreview document={document} />
                                <div className="space-y-1 px-1 pb-1">
                                  <div className="flex items-center gap-2">
                                    <Badge className={documentTone(document.verificationStatus)}>{document.verificationStatus}</Badge>
                                    {document.documentNumber ? <span className="text-[11px] text-slate-500">#{document.documentNumber}</span> : null}
                                  </div>
                                  <div className="flex flex-wrap gap-2 text-[11px] text-slate-500">
                                    <span>{formatDate(document.createdAt)}</span>
                                    {document.documentUrl ? (
                                      <a href={document.documentUrl} target="_blank" rel="noreferrer" className="font-medium text-slate-900 underline underline-offset-2">
                                        Open file
                                      </a>
                                    ) : null}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-slate-500">No certificate uploads found for this vendor.</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-500">
                    <span>Created: {formatDate(vendor.createdAt)}</span>
                    <span>Updated: {formatDate(vendor.updatedAt)}</span>
                    <span>Approved: {formatDate(vendor.approvedAt)}</span>
                    {vendor.commissionRate != null ? <span>Commission: {vendor.commissionRate}%</span> : null}
                  </div>

                  {vendor.rejectionReason ? (
                    <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                      Rejection reason: {vendor.rejectionReason}
                    </div>
                  ) : null}
                </div>
              )
            })}
          </CardContent>
        </Card>
      ) : null}

      {activeTab === 'documents' ? (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <FileText className="h-4 w-4" /> Pending Document Verification
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {documentLoading ? <p className="text-slate-600">Loading document queue...</p> : null}
            {!documentLoading && documents.length === 0 ? <p className="text-slate-600">No pending documents found.</p> : null}

            {documents.map((document) => (
              <div key={document.id} className="rounded-2xl border bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-base font-semibold text-slate-900">{formatDocumentType(document.documentType)}</p>
                      <Badge className="border-slate-200 bg-slate-100 text-slate-700">ID #{document.id}</Badge>
                      <Badge className={documentTone(document.verificationStatus)}>{document.verificationStatus}</Badge>
                    </div>
                    <p className="text-sm text-slate-600">File: {document.fileName || 'Unnamed file'}</p>
                    <p className="text-sm text-slate-600">Document Number: {document.documentNumber || 'Not provided'}</p>
                    <p className="text-xs text-slate-500">Uploaded: {formatDate(document.createdAt)}</p>
                    {document.verificationComments ? <p className="text-sm text-rose-700">Current comment: {document.verificationComments}</p> : null}
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row">
                    {document.documentUrl ? (
                      <a href={document.documentUrl} target="_blank" rel="noreferrer">
                        <Button variant="outline">Open Document</Button>
                      </a>
                    ) : null}
                    <Button disabled={processingDocumentId === document.id} onClick={() => handleDocumentDecision(document.id, 'VERIFIED')}>
                      Verify
                    </Button>
                    <Button variant="destructive" disabled={processingDocumentId === document.id} onClick={() => openDocumentRejectModal(document.id)}>
                      Reject
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <ActionReasonModal
        open={vendorRejectModal.state.open}
        title="Reject Vendor Application"
        subtitle="Provide a clear reason so the vendor can correct and re-submit."
        label="Rejection Reason"
        textareaId="vendor-reject-reason"
        placeholder="Example: GSTIN certificate number is missing and business address proof is unclear."
        value={vendorRejectModal.state.reason}
        onChange={vendorRejectModal.setReason}
        onCancel={vendorRejectModal.close}
        onSubmit={submitVendorRejection}
        submitLabel="Submit Rejection"
        submitVariant="destructive"
        disabled={processingVendorId !== null}
      />

      <ActionReasonModal
        open={documentRejectModal.state.open}
        title="Reject Document"
        subtitle="Add an exact reason so the vendor can upload the corrected document."
        label="Rejection Comment"
        textareaId="document-reject-reason"
        placeholder="Example: Signature image is blurred and does not match the registration name."
        value={documentRejectModal.state.reason}
        onChange={documentRejectModal.setReason}
        onCancel={documentRejectModal.close}
        onSubmit={submitDocumentRejection}
        submitLabel="Submit Rejection"
        submitVariant="destructive"
        disabled={processingDocumentId !== null}
      />
    </AdminShell>
  )
}
