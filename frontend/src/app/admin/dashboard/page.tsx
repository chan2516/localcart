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

type UserAction = 'ACTIVATE' | 'SUSPEND' | 'BAN'
type VendorAction = 'APPROVED' | 'SUSPENDED' | 'BANNED' | 'RESTORED'

export default function AdminDashboardPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()
  const isLevelOneAdmin = isLevelOneAdminRole(user?.role)

  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [pendingVendors, setPendingVendors] = useState<Vendor[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [users, setUsers] = useState<UserSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [managingUserId, setManagingUserId] = useState<number | null>(null)
  const [managingVendorId, setManagingVendorId] = useState<number | null>(null)
  const [managementTab, setManagementTab] = useState<'users' | 'vendors'>('users')

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
        const [statsResponse, pendingVendorsResponse, allVendorsResponse, usersResponse] = await Promise.all([
          apiClient.get<DashboardStats>('/admin/dashboard'),
          apiClient.get<{ content?: Vendor[]; vendors?: Vendor[] }>('/admin/vendors/pending?page=0&size=10'),
          apiClient.get<{ content?: Vendor[]; vendors?: Vendor[] }>('/admin/vendors?page=0&size=20'),
          apiClient.get<{ content?: UserSummary[] }>('/admin/users?page=0&size=10'),
        ])

        setStats(statsResponse)
        setPendingVendors(pendingVendorsResponse.content || pendingVendorsResponse.vendors || [])
        setVendors(allVendorsResponse.content || allVendorsResponse.vendors || [])
        setUsers(usersResponse.content || [])
      } catch (error: any) {
        toast.error(error?.message || 'Failed to load admin dashboard')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [isAuthenticated, user, router])

  const handleVendorDecision = async (vendorId: number, status: 'APPROVED' | 'REJECTED') => {
    try {
      await apiClient.post('/admin/vendors/approve', {
        vendorId,
        status,
        reason: status === 'REJECTED' ? 'Rejected by admin from dashboard' : undefined,
      })
      setPendingVendors((prev) => prev.filter((vendor) => vendor.id !== vendorId))
      setVendors((prev) => prev.map((vendor) => (vendor.id === vendorId ? { ...vendor, status } : vendor)))
      toast.success(`Vendor ${status.toLowerCase()}`)
    } catch (error: any) {
      toast.error(error?.message || 'Failed to update vendor status')
    }
  }

  const handleManageVendor = async (vendor: Vendor, action: VendorAction) => {
    let reason: string | undefined
    if (action === 'SUSPENDED' || action === 'BANNED') {
      const typedReason = window.prompt(
        `Enter reason for ${action === 'SUSPENDED' ? 'suspending' : 'banning'} vendor #${vendor.id}:`
      )
      if (!typedReason || !typedReason.trim()) {
        toast.error('Reason is required')
        return
      }
      reason = typedReason.trim()
    }

    try {
      setManagingVendorId(vendor.id)
      let updated: Vendor

      if (action === 'APPROVED') {
        updated = await apiClient.post('/admin/vendors/approve', {
          vendorId: vendor.id,
          status: 'APPROVED',
          reason: 'Approved by admin',
        })
      } else if (action === 'SUSPENDED') {
        updated = await apiClient.post(`/admin/vendors/${vendor.id}/suspend`, {
          reason,
        })
      } else if (action === 'BANNED') {
        updated = await apiClient.post(`/admin/vendors/${vendor.id}/ban`, {
          reason,
        })
      } else {
        updated = await apiClient.post(`/admin/vendors/${vendor.id}/restore`)
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

  const handleManageUser = async (targetUser: UserSummary, action: UserAction) => {
    let reason: string | undefined
    let suspensionDurationDays: number | undefined

    if (action === 'SUSPEND' || action === 'BAN') {
      const input = window.prompt(`Enter a reason for ${action.toLowerCase()}ing user #${targetUser.id}:`)
      if (!input || !input.trim()) {
        toast.error('Reason is required for suspend/ban actions')
        return
      }
      reason = input.trim()

      if (action === 'SUSPEND') {
        suspensionDurationDays = 30
      }
    }

    try {
      setManagingUserId(targetUser.id)
      const updated = await apiClient.post<UserSummary>('/admin/users/manage', {
        userId: targetUser.id,
        action,
        reason,
        suspensionDurationDays,
      })

      setUsers((prev) => prev.map((u) => (u.id === updated.id ? { ...u, ...updated } : u)))
      toast.success(`User ${action.toLowerCase()} completed`)
    } catch (error: any) {
      toast.error(error?.message || 'Failed to manage user')
    } finally {
      setManagingUserId(null)
    }
  }

  if (loading) {
    return <div className="max-w-7xl mx-auto px-4 py-10">Loading admin dashboard...</div>
  }

  return (
    <AdminShell title="Admin Dashboard" subtitle="Platform-level control center">
      <div className="mt-3 flex gap-2 flex-wrap">
        <Link href="/admin/verification">
          <Button variant="outline">Open Verification Dashboard</Button>
        </Link>
        {isLevelOneAdmin && (
          <Link href="/admin/development">
            <Button variant="outline">Open Development Hub</Button>
          </Link>
        )}
        {isLevelOneAdmin && (
          <Link href="/admin/admin-users">
            <Button variant="outline">Manage Admin Access</Button>
          </Link>
        )}
      </div>

      {user && <AccountPanel user={user} />}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardHeader><CardTitle>Total Users</CardTitle></CardHeader><CardContent>{stats?.totalUsers ?? 0}</CardContent></Card>
        <Card><CardHeader><CardTitle>Total Vendors</CardTitle></CardHeader><CardContent>{stats?.totalVendors ?? 0}</CardContent></Card>
        <Card><CardHeader><CardTitle>Pending Vendors</CardTitle></CardHeader><CardContent>{stats?.pendingVendorApplications ?? pendingVendors.length}</CardContent></Card>
        <Card><CardHeader><CardTitle>Total Products</CardTitle></CardHeader><CardContent>{stats?.totalProducts ?? 0}</CardContent></Card>
        <Card><CardHeader><CardTitle>Total Orders</CardTitle></CardHeader><CardContent>{stats?.totalOrders ?? 0}</CardContent></Card>
        <Card><CardHeader><CardTitle>Total Revenue</CardTitle></CardHeader><CardContent>{stats?.totalRevenue ?? 0}</CardContent></Card>
      </div>

      <Card>
        <CardHeader className="space-y-4">
          <CardTitle>Management Console</CardTitle>
          <div className="w-full border-b">
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              <button
                type="button"
                className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  managementTab === 'users'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
                onClick={() => setManagementTab('users')}
              >
                User Management ({users.length})
              </button>
              <button
                type="button"
                className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  managementTab === 'vendors'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
                onClick={() => setManagementTab('vendors')}
              >
                Vendor Management ({vendors.length})
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
                      onClick={() => handleManageUser(u, 'SUSPEND')}
                    >
                      Suspend
                    </Button>
                    <Button
                      variant="destructive"
                      disabled={managingUserId === u.id || String(u.id) === String(user?.id)}
                      onClick={() => handleManageUser(u, 'BAN')}
                    >
                      Ban
                    </Button>
                  </div>
                </div>
              ))}
            </>
          ) : (
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
                          <Button size="sm" variant="destructive" onClick={() => handleVendorDecision(vendor.id, 'REJECTED')}>Reject</Button>
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
                      onClick={() => handleManageVendor(vendor, 'SUSPENDED')}
                    >
                      Suspend
                    </Button>
                    <Button
                      variant="destructive"
                      disabled={managingVendorId === vendor.id}
                      onClick={() => handleManageVendor(vendor, 'BANNED')}
                    >
                      Ban
                    </Button>
                    <Button
                      disabled={managingVendorId === vendor.id}
                      onClick={() => handleManageVendor(vendor, 'RESTORED')}
                    >
                      Restore
                    </Button>
                  </div>
                </div>
              ))}
            </>
          )}
        </CardContent>
      </Card>
    </AdminShell>
  )
}
