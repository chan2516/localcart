'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { isAnyAdminRole, isLevelOneAdminRole, useAuthStore } from '@/lib/auth-store'
import { apiClient } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AccountPanel } from '@/components/account-panel'
import { AdminShell } from '@/components/admin-shell'
import { ActionReasonModal } from '@/components/action-reason-modal'
import { useReasonModal } from '@/hooks/use-reason-modal'

type DashboardStats = {
  totalUsers?: number
  totalVendors?: number
  pendingVendorApplications?: number
  totalProducts?: number
  totalOrders?: number
  totalRevenue?: number
}

type Vendor = {
  id: number
  businessName: string
  businessEmail?: string
  status?: string
  isDeleted?: boolean
  rejectionReason?: string
  createdAt?: string
}

type UserSummary = {
  id: number
  email: string
  firstName?: string
  lastName?: string
  isActive?: boolean
  isDeleted?: boolean
  suspensionReason?: string
  roles?: string[]
}

type AdminHistoryEntry = {
  id: number
  targetType: 'USER' | 'VENDOR'
  targetId: number
  targetLabel?: string
  actionType: 'APPROVE' | 'REJECT' | 'ACTIVATE' | 'SUSPEND' | 'BAN' | 'DELETE' | 'RESTORE'
  reason?: string
  adminUserId?: number
  adminName?: string
  adminEmail?: string
  createdAt?: string
}

type UserAction = 'ACTIVATE' | 'SUSPEND' | 'BAN' | 'DELETE'
type VendorAction = 'APPROVED' | 'REJECTED' | 'BANNED'
type ManagementTab = 'users' | 'vendors' | 'history'

export default function AdminDashboardPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()
  const isLevelOneAdmin = isLevelOneAdminRole(user?.role)

  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [pendingVendors, setPendingVendors] = useState<Vendor[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [users, setUsers] = useState<UserSummary[]>([])
  const [history, setHistory] = useState<AdminHistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [historyLoading, setHistoryLoading] = useState(true)
  const [managingUserId, setManagingUserId] = useState<number | null>(null)
  const [managingVendorId, setManagingVendorId] = useState<number | null>(null)
  const [managementTab, setManagementTab] = useState<ManagementTab>('users')
  const [historyFilter, setHistoryFilter] = useState<'ALL' | 'USER' | 'VENDOR'>('ALL')
  const userActionModal = useReasonModal<UserSummary, UserAction>()
  const vendorActionModal = useReasonModal<Vendor, VendorAction>()
  const pendingVendorRejectModal = useReasonModal<Vendor, never>()

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

    const fetchData = async () => {
      try {
        const [statsResponse, pendingVendorsResponse, allVendorsResponse, usersResponse, historyResponse] = await Promise.all([
          apiClient.get<DashboardStats>('/admin/dashboard'),
          apiClient.get<{ content?: Vendor[]; vendors?: Vendor[] }>('/admin/vendors/pending?page=0&size=10'),
          apiClient.get<{ content?: Vendor[]; vendors?: Vendor[] }>('/admin/vendors?page=0&size=20'),
          apiClient.get<{ content?: UserSummary[] }>('/admin/users?page=0&size=10'),
          apiClient.get<{ content?: AdminHistoryEntry[] }>('/admin/history?page=0&size=50'),
        ])

        setStats(statsResponse)
        setPendingVendors(pendingVendorsResponse.content || pendingVendorsResponse.vendors || [])
        setVendors(allVendorsResponse.content || allVendorsResponse.vendors || [])
        setUsers(usersResponse.content || [])
        setHistory(historyResponse.content || [])
      } catch (error: any) {
        toast.error(error?.message || 'Failed to load admin dashboard')
      } finally {
        setLoading(false)
        setHistoryLoading(false)
      }
    }

    fetchData()
  }, [isAuthenticated, user, router])

  const handleVendorDecision = async (vendorId: number, status: 'APPROVED' | 'REJECTED', reason?: string) => {
    try {
      await apiClient.post('/admin/vendors/approve', {
        vendorId,
        status,
        reason: status === 'REJECTED' ? reason || 'Rejected by admin from dashboard' : undefined,
      })
      setPendingVendors((prev) => prev.filter((vendor) => vendor.id !== vendorId))
      setVendors((prev) => prev.map((vendor) => (vendor.id === vendorId ? { ...vendor, status } : vendor)))
      toast.success(`Vendor ${status.toLowerCase()}`)
    } catch (error: any) {
      toast.error(error?.message || 'Failed to update vendor status')
    }
  }

  const handleManageVendor = async (vendor: Vendor, action: VendorAction, reason?: string) => {
    try {
      setManagingVendorId(vendor.id)
      let updated: Vendor

      if (action === 'APPROVED') {
        updated = await apiClient.post('/admin/vendors/approve', {
          vendorId: vendor.id,
          status: 'APPROVED',
          reason: 'Approved by admin',
        })
      } else if (action === 'REJECTED') {
        updated = await apiClient.post('/admin/vendors/approve', {
          vendorId: vendor.id,
          status: 'REJECTED',
          reason: reason || 'Rejected by admin',
        })
      } else if (action === 'BANNED') {
        updated = await apiClient.post(`/admin/vendors/${vendor.id}/ban`, {
          reason,
        })
      } else {
        throw new Error('Unsupported vendor action')
      }

      setVendors((prev) => prev.map((v) => (v.id === updated.id ? { ...v, ...updated } : v)))
      if (updated.status && updated.status !== 'PENDING') {
        setPendingVendors((prev) => prev.filter((v) => v.id !== vendor.id))
      }
      toast.success('Vendor updated successfully')
    } catch (error: any) {
      toast.error(error?.message || 'Failed to manage vendor')
    } finally {
      setManagingVendorId(null)
    }
  }

  const handleManageUser = async (targetUser: UserSummary, action: UserAction, reason?: string) => {
    const suspensionDurationDays = action === 'SUSPEND' ? 30 : undefined

    try {
      setManagingUserId(targetUser.id)
      const updated = await apiClient.post<UserSummary>('/admin/users/manage', {
        userId: targetUser.id,
        action,
        reason,
        suspensionDurationDays,
      })

      if (action === 'DELETE') {
        setUsers((prev) => prev.filter((u) => u.id !== targetUser.id))
      } else {
        setUsers((prev) => prev.map((u) => (u.id === updated.id ? { ...u, ...updated } : u)))
      }
      await loadHistory()
      toast.success(`User ${action.toLowerCase()} completed`)
    } catch (error: any) {
      toast.error(error?.message || 'Failed to manage user')
    } finally {
      setManagingUserId(null)
    }
  }

  const openUserActionModal = (targetUser: UserSummary, action: UserAction) => {
    userActionModal.open(targetUser, action)
  }

  const openVendorActionModal = (vendor: Vendor, action: VendorAction) => {
    vendorActionModal.open(vendor, action)
  }

  const submitUserActionModal = async () => {
    if (!userActionModal.state.target || !userActionModal.state.action) return

    const action = userActionModal.state.action
    const reason = userActionModal.state.reason.trim()
    if ((action === 'SUSPEND' || action === 'BAN' || action === 'DELETE') && !reason) {
      toast.error('Reason is required for this action')
      return
    }

    await handleManageUser(userActionModal.state.target, action, reason || undefined)
    userActionModal.close()
  }

  const loadHistory = async () => {
    try {
      setHistoryLoading(true)
      const response = await apiClient.get<{ content?: AdminHistoryEntry[] }>('/admin/history?page=0&size=50')
      setHistory(response.content || [])
    } catch (error: any) {
      toast.error(error?.message || 'Failed to load admin history')
    } finally {
      setHistoryLoading(false)
    }
  }

  const filteredHistory = historyFilter === 'ALL' ? history : history.filter((entry) => entry.targetType === historyFilter)

  const formatHistoryAction = (value: AdminHistoryEntry['actionType']) => {
    switch (value) {
      case 'APPROVE': return 'Approved'
      case 'REJECT': return 'Rejected'
      case 'ACTIVATE': return 'Activated'
      case 'SUSPEND': return 'Suspended'
      case 'BAN': return 'Banned'
      case 'DELETE': return 'Deleted'
      case 'RESTORE': return 'Restored'
      default: return value
    }
  }

  const historyTone = (value: AdminHistoryEntry['actionType']) => {
    switch (value) {
      case 'APPROVE':
      case 'ACTIVATE':
      case 'RESTORE':
        return 'bg-emerald-100 text-emerald-800'
      case 'REJECT':
      case 'DELETE':
      case 'BAN':
        return 'bg-rose-100 text-rose-800'
      default:
        return 'bg-amber-100 text-amber-800'
    }
  }

  const submitVendorActionModal = async () => {
    if (!vendorActionModal.state.target || !vendorActionModal.state.action) return

    const action = vendorActionModal.state.action
    const reason = vendorActionModal.state.reason.trim()
    if ((action === 'REJECTED' || action === 'BANNED') && !reason) {
      toast.error('Reason is required')
      return
    }

    if (action === 'APPROVED') {
      await handleManageVendor(vendorActionModal.state.target, action)
    } else {
      await handleManageVendor(vendorActionModal.state.target, action, reason)
    }

    vendorActionModal.close()
  }

  const submitPendingVendorRejection = async () => {
    if (!pendingVendorRejectModal.state.target) return

    const reason = pendingVendorRejectModal.state.reason.trim()
    if (!reason) {
      toast.error('Reason is required')
      return
    }

    await handleVendorDecision(pendingVendorRejectModal.state.target.id, 'REJECTED', reason)
    pendingVendorRejectModal.close()
  }

  if (loading) {
    return <div className="max-w-7xl mx-auto px-4 py-10">Loading admin dashboard...</div>
  }

  return (
    <AdminShell title="Admin Dashboard" subtitle="Platform-level control center">
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-900 px-6 py-5 text-white shadow-lg">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-200">Admin Workspace</p>
            <h2 className="text-2xl font-bold md:text-3xl">Run moderation, approvals, and platform oversight from one place.</h2>
            <p className="max-w-3xl text-sm text-slate-200 md:text-base">
              Review vendor applications, manage user access, and monitor platform activity without bouncing between screens.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/admin/verification">
              <Button variant="outline" className="border-white/20 bg-white/10 text-white hover:bg-white/20">
                Open Verification Dashboard
              </Button>
            </Link>
            {isLevelOneAdmin && (
              <Link href="/admin/development">
                <Button variant="outline" className="border-white/20 bg-white/10 text-white hover:bg-white/20">Open Development Hub</Button>
              </Link>
            )}
            {isLevelOneAdmin && (
              <Link href="/admin/admin-users">
                <Button variant="outline" className="border-white/20 bg-white/10 text-white hover:bg-white/20">Manage Admin Access</Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {user && <AccountPanel user={user} />}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-slate-600">Total Users</CardTitle></CardHeader>
          <CardContent className="space-y-1"><p className="text-2xl font-bold text-slate-900">{stats?.totalUsers ?? 0}</p><p className="text-xs text-slate-500">Registered platform accounts</p></CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-slate-600">Total Vendors</CardTitle></CardHeader>
          <CardContent className="space-y-1"><p className="text-2xl font-bold text-slate-900">{stats?.totalVendors ?? 0}</p><p className="text-xs text-slate-500">Seller accounts across the catalog</p></CardContent>
        </Card>
        <Card className="border-amber-200 bg-amber-50/70 shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-amber-900">Pending Vendors</CardTitle></CardHeader>
          <CardContent className="space-y-1"><p className="text-2xl font-bold text-amber-950">{stats?.pendingVendorApplications ?? pendingVendors.length}</p><p className="text-xs text-amber-800">Waiting on review or verification</p></CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-slate-600">Total Products</CardTitle></CardHeader>
          <CardContent className="space-y-1"><p className="text-2xl font-bold text-slate-900">{stats?.totalProducts ?? 0}</p><p className="text-xs text-slate-500">Catalog items available to shoppers</p></CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-slate-600">Total Orders</CardTitle></CardHeader>
          <CardContent className="space-y-1"><p className="text-2xl font-bold text-slate-900">{stats?.totalOrders ?? 0}</p><p className="text-xs text-slate-500">Completed and in-flight purchases</p></CardContent>
        </Card>
        <Card className="border-emerald-200 bg-emerald-50/70 shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-emerald-900">Total Revenue</CardTitle></CardHeader>
          <CardContent className="space-y-1"><p className="text-2xl font-bold text-emerald-950">${Number(stats?.totalRevenue ?? 0).toLocaleString()}</p><p className="text-xs text-emerald-800">Gross sales tracked by the platform</p></CardContent>
        </Card>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="space-y-4 border-b bg-slate-50/70">
          <CardTitle className="text-lg">Management Console</CardTitle>
          <p className="text-sm text-slate-600">Switch between user control, vendor management, and action history without losing context.</p>
          <div className="w-full border-b">
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              <button
                type="button"
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  managementTab === 'users'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100'
                }`}
                onClick={() => setManagementTab('users')}
              >
                User Management ({users.length})
              </button>
              <button
                type="button"
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  managementTab === 'vendors'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100'
                }`}
                onClick={() => setManagementTab('vendors')}
              >
                Vendor Management ({vendors.length})
              </button>
              <button
                type="button"
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  managementTab === 'history'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100'
                }`}
                onClick={() => setManagementTab('history')}
              >
                Action History ({history.length})
              </button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3 max-h-[780px] overflow-auto pr-1">
          {managementTab === 'users' ? (
            <>
              {users.length === 0 && <p className="text-gray-600">No users found.</p>}
              {users.map((u) => (
                <div key={u.id} className="rounded-md border p-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{u.firstName || ''} {u.lastName || ''}</p>
                    <p className="text-sm text-gray-600">{u.email}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      ID: {u.id} | Roles: {(u.roles || []).join(', ') || 'N/A'} | Status: {u.isDeleted ? 'Banned' : (u.isActive ? 'Active' : 'Suspended')}
                    </p>
                    {u.suspensionReason ? <p className="text-xs text-red-600 mt-1">Reason: {u.suspensionReason}</p> : null}
                  </div>
                  <div className="flex gap-2 flex-wrap justify-end">
                    <Button
                      variant="outline"
                      disabled={managingUserId === u.id || String(u.id) === String(user?.id)}
                      onClick={() => handleManageUser(u, 'ACTIVATE')}
                    >
                      Activate
                    </Button>
                    <Button
                      variant="secondary"
                      disabled={managingUserId === u.id || String(u.id) === String(user?.id)}
                      onClick={() => openUserActionModal(u, 'SUSPEND')}
                    >
                      Suspend
                    </Button>
                    <Button
                      variant="destructive"
                      disabled={managingUserId === u.id || String(u.id) === String(user?.id)}
                      onClick={() => openUserActionModal(u, 'BAN')}
                    >
                      Ban
                    </Button>
                    <Button
                      variant="destructive"
                      disabled={managingUserId === u.id || String(u.id) === String(user?.id)}
                      onClick={() => openUserActionModal(u, 'DELETE')}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </>
          ) : managementTab === 'vendors' ? (
            <>
              <div className="rounded-md border p-3 bg-amber-50">
                <p className="font-medium">Pending Applications ({pendingVendors.length})</p>
                {pendingVendors.length === 0 ? (
                  <p className="text-sm text-gray-600 mt-1">No pending vendors.</p>
                ) : (
                  <div className="mt-2 space-y-2">
                    {pendingVendors.map((vendor) => (
                      <div key={vendor.id} className="rounded-md border p-2 bg-white flex items-center justify-between gap-2">
                        <div>
                          <p className="font-semibold text-sm">{vendor.businessName}</p>
                          <p className="text-xs text-gray-600">{vendor.businessEmail || 'No email provided'}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleVendorDecision(vendor.id, 'APPROVED')}>Approve</Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => pendingVendorRejectModal.open(vendor)}
                          >
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {vendors.length === 0 && <p className="text-gray-600">No vendors found.</p>}
              {vendors.map((vendor) => (
                <div key={vendor.id} className="rounded-md border p-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{vendor.businessName}</p>
                    <p className="text-sm text-gray-600">{vendor.businessEmail || 'No email provided'}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      ID: {vendor.id} | Status: {vendor.isDeleted ? 'Banned' : vendor.status || 'UNKNOWN'}
                    </p>
                    {vendor.rejectionReason ? <p className="text-xs text-red-600 mt-1">Reason: {vendor.rejectionReason}</p> : null}
                  </div>
                  <div className="flex gap-2 flex-wrap justify-end">
                    <Button
                      variant="outline"
                      disabled={managingVendorId === vendor.id}
                      onClick={() => handleManageVendor(vendor, 'APPROVED')}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="secondary"
                      disabled={managingVendorId === vendor.id}
                      onClick={() => openVendorActionModal(vendor, 'REJECTED')}
                    >
                      Reject
                    </Button>
                    <Button
                      variant="destructive"
                      disabled={managingVendorId === vendor.id}
                      onClick={() => openVendorActionModal(vendor, 'BANNED')}
                    >
                      Ban
                    </Button>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {(['ALL', 'USER', 'VENDOR'] as const).map((filter) => (
                  <Button
                    key={filter}
                    variant={historyFilter === filter ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setHistoryFilter(filter)}
                  >
                    {filter === 'ALL' ? 'All' : filter.charAt(0) + filter.slice(1).toLowerCase()}
                  </Button>
                ))}
              </div>

              {historyLoading ? <p className="text-gray-600">Loading history...</p> : null}
              {!historyLoading && filteredHistory.length === 0 ? <p className="text-gray-600">No history records found.</p> : null}

              {!historyLoading && filteredHistory.map((entry) => (
                <div key={entry.id} className="rounded-md border p-3 bg-white">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${entry.targetType === 'USER' ? 'bg-sky-100 text-sky-800' : 'bg-violet-100 text-violet-800'}`}>
                      {entry.targetType}
                    </span>
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${historyTone(entry.actionType)}`}>
                      {formatHistoryAction(entry.actionType)}
                    </span>
                    <span className="text-sm font-medium">{entry.targetLabel || `#${entry.targetId}`}</span>
                  </div>
                  <p className="mt-2 text-sm text-gray-700">
                    Admin: {entry.adminName || entry.adminEmail || `#${entry.adminUserId}`}
                  </p>
                  {entry.reason ? <p className="mt-1 text-sm text-gray-600">Reason: {entry.reason}</p> : null}
                  <p className="mt-1 text-xs text-gray-500">{entry.createdAt ? new Date(entry.createdAt).toLocaleString() : 'Unknown time'}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ActionReasonModal
        open={userActionModal.state.open && Boolean(userActionModal.state.target) && Boolean(userActionModal.state.action)}
        title={
          userActionModal.state.action === 'SUSPEND'
            ? 'Suspend User'
            : userActionModal.state.action === 'BAN'
              ? 'Ban User'
              : 'Delete User'
        }
        subtitle={
          userActionModal.state.target
            ? `User #${userActionModal.state.target.id} - ${userActionModal.state.target.email}`
            : undefined
        }
        label="Reason"
        textareaId="user-action-reason"
        placeholder="Provide a clear reason for this action."
        value={userActionModal.state.reason}
        onChange={userActionModal.setReason}
        onCancel={userActionModal.close}
        onSubmit={submitUserActionModal}
        submitLabel={userActionModal.state.action === 'DELETE' ? 'Delete User' : 'Submit Action'}
        submitVariant="destructive"
        disabled={managingUserId !== null}
      />

      <ActionReasonModal
        open={vendorActionModal.state.open && Boolean(vendorActionModal.state.target) && Boolean(vendorActionModal.state.action)}
        title={vendorActionModal.state.action === 'REJECTED' ? 'Reject Vendor' : 'Ban Vendor'}
        subtitle={
          vendorActionModal.state.target
            ? `Vendor #${vendorActionModal.state.target.id} - ${vendorActionModal.state.target.businessName}`
            : undefined
        }
        label="Reason"
        textareaId="vendor-action-reason"
        placeholder="Provide a clear reason for this action."
        value={vendorActionModal.state.reason}
        onChange={vendorActionModal.setReason}
        onCancel={vendorActionModal.close}
        onSubmit={submitVendorActionModal}
        submitLabel="Submit Action"
        submitVariant="destructive"
        disabled={managingVendorId !== null}
      />

      <ActionReasonModal
        open={pendingVendorRejectModal.state.open && Boolean(pendingVendorRejectModal.state.target)}
        title="Reject Pending Vendor"
        subtitle={
          pendingVendorRejectModal.state.target
            ? `Vendor #${pendingVendorRejectModal.state.target.id} - ${pendingVendorRejectModal.state.target.businessName}`
            : undefined
        }
        label="Reason"
        textareaId="pending-vendor-reject-reason"
        placeholder="Provide a clear reason for rejection."
        value={pendingVendorRejectModal.state.reason}
        onChange={pendingVendorRejectModal.setReason}
        onCancel={pendingVendorRejectModal.close}
        onSubmit={submitPendingVendorRejection}
        submitLabel="Submit Rejection"
        submitVariant="destructive"
        disabled={managingVendorId !== null}
      />
    </AdminShell>
  )
}
