'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/auth-store'
import { apiClient } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

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
  createdAt?: string
}

type UserSummary = {
  id: number
  email: string
  firstName?: string
  lastName?: string
  isActive?: boolean
  roles?: string[]
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()

  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [users, setUsers] = useState<UserSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/adminlogin')
      return
    }
    if (user && user.role !== 'ADMIN') {
      toast.error('Admin access is required')
      router.push('/')
      return
    }

    const fetchData = async () => {
      try {
        const [statsResponse, vendorsResponse, usersResponse] = await Promise.all([
          apiClient.get<DashboardStats>('/admin/dashboard'),
          apiClient.get<{ content?: Vendor[]; vendors?: Vendor[] }>('/admin/vendors/pending?page=0&size=10'),
          apiClient.get<{ content?: UserSummary[] }>('/admin/users?page=0&size=10'),
        ])

        setStats(statsResponse)
        setVendors(vendorsResponse.content || vendorsResponse.vendors || [])
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
      setVendors((prev) => prev.filter((vendor) => vendor.id !== vendorId))
      toast.success(`Vendor ${status.toLowerCase()}`)
    } catch (error: any) {
      toast.error(error?.message || 'Failed to update vendor status')
    }
  }

  if (loading) {
    return <div className="max-w-7xl mx-auto px-4 py-10">Loading admin dashboard...</div>
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-gray-600">Platform-level control center</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardHeader><CardTitle>Total Users</CardTitle></CardHeader><CardContent>{stats?.totalUsers ?? 0}</CardContent></Card>
        <Card><CardHeader><CardTitle>Total Vendors</CardTitle></CardHeader><CardContent>{stats?.totalVendors ?? 0}</CardContent></Card>
        <Card><CardHeader><CardTitle>Pending Vendors</CardTitle></CardHeader><CardContent>{stats?.pendingVendorApplications ?? vendors.length}</CardContent></Card>
        <Card><CardHeader><CardTitle>Total Products</CardTitle></CardHeader><CardContent>{stats?.totalProducts ?? 0}</CardContent></Card>
        <Card><CardHeader><CardTitle>Total Orders</CardTitle></CardHeader><CardContent>{stats?.totalOrders ?? 0}</CardContent></Card>
        <Card><CardHeader><CardTitle>Total Revenue</CardTitle></CardHeader><CardContent>{stats?.totalRevenue ?? 0}</CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Vendor Applications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {vendors.length === 0 && <p className="text-gray-600">No pending vendors.</p>}
          {vendors.map((vendor) => (
            <div key={vendor.id} className="rounded-md border p-3 flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold">{vendor.businessName}</p>
                <p className="text-sm text-gray-600">{vendor.businessEmail || 'No email provided'}</p>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => handleVendorDecision(vendor.id, 'APPROVED')}>Approve</Button>
                <Button variant="destructive" onClick={() => handleVendorDecision(vendor.id, 'REJECTED')}>
                  Reject
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Users</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {users.length === 0 && <p className="text-gray-600">No users found.</p>}
          {users.map((u) => (
            <div key={u.id} className="rounded-md border p-3">
              <p className="font-medium">{u.firstName || ''} {u.lastName || ''}</p>
              <p className="text-sm text-gray-600">{u.email}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
