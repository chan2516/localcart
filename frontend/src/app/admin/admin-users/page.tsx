'use client'

import { FormEvent, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api-client'
import { isAnyAdminRole, isLevelOneAdminRole, useAuthStore } from '@/lib/auth-store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

type AdminAccount = {
  id: number
  email: string
  firstName: string
  lastName: string
  isActive: boolean
  level: 'LEVEL_1' | 'LEVEL_2'
}

type ContactInfo = {
  supportEmail: string
  supportPhone: string
  supportAddress: string
  supportHours: string
}

export default function AdminUsersPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()

  const [admins, setAdmins] = useState<AdminAccount[]>([])
  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    supportEmail: 'support@localcart.com',
    supportPhone: '+1-800-LOCALCART',
    supportAddress: 'LocalCart Support Center',
    supportHours: 'Mon-Sat, 9:00 AM - 6:00 PM',
  })
  const [form, setForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [savingContact, setSavingContact] = useState(false)

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

    if (user && !isLevelOneAdminRole(user.role)) {
      toast.error('Only level-1 admins can manage admin access')
      router.push('/admin/dashboard')
      return
    }

    const loadData = async () => {
      try {
        const [adminsResponse, contactResponse] = await Promise.all([
          apiClient.get<{ content?: AdminAccount[] }>('/admin/admins?page=0&size=50'),
          apiClient.get<ContactInfo>('/admin/contact-info'),
        ])

        setAdmins(adminsResponse.content || [])
        setContactInfo(contactResponse)
      } catch (error: any) {
        toast.error(error?.message || 'Failed to load admin access data')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [isAuthenticated, user, router])

  const createAdmin = async (event: FormEvent) => {
    event.preventDefault()

    if (!form.email || !form.password || !form.firstName || !form.lastName) {
      toast.error('Please complete all admin creation fields')
      return
    }

    try {
      setSubmitting(true)
      await apiClient.post<AdminAccount>('/admin/admins', {
        email: form.email,
        password: form.password,
        firstName: form.firstName,
        lastName: form.lastName,
      })

      const refreshed = await apiClient.get<{ content?: AdminAccount[] }>('/admin/admins?page=0&size=50')
      setAdmins(refreshed.content || [])
      setForm({ email: '', password: '', firstName: '', lastName: '' })
      toast.success('Second-level admin account created')
    } catch (error: any) {
      toast.error(error?.message || 'Failed to create admin account')
    } finally {
      setSubmitting(false)
    }
  }

  const updateAdminStatus = async (adminId: number, active: boolean) => {
    try {
      await apiClient.post<AdminAccount>(`/admin/admins/${adminId}/${active ? 'activate' : 'suspend'}`)
      setAdmins((prev) => prev.map((admin) => (admin.id === adminId ? { ...admin, isActive: active } : admin)))
      toast.success(`Admin account ${active ? 'activated' : 'suspended'}`)
    } catch (error: any) {
      toast.error(error?.message || 'Failed to update admin status')
    }
  }

  const saveContactInfo = async (event: FormEvent) => {
    event.preventDefault()

    try {
      setSavingContact(true)
      const updated = await apiClient.put<ContactInfo>('/admin/contact-info', contactInfo)
      setContactInfo(updated)
      toast.success('Contact info updated')
    } catch (error: any) {
      toast.error(error?.message || 'Failed to update contact info')
    } finally {
      setSavingContact(false)
    }
  }

  if (loading) {
    return <div className="max-w-7xl mx-auto px-4 py-10">Loading admin access settings...</div>
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 space-y-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">Admin Access Management</h1>
          <p className="text-gray-600 mt-1">Create and control second-level admins, and manage Contact Us details.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/dashboard">
            <Button variant="outline">Back To Dashboard</Button>
          </Link>
          <Link href="/admin/development">
            <Button variant="outline">Development Hub</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Create Second-Level Admin</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={createAdmin} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  placeholder="First name"
                  value={form.firstName}
                  onChange={(e) => setForm((prev) => ({ ...prev, firstName: e.target.value }))}
                />
                <Input
                  placeholder="Last name"
                  value={form.lastName}
                  onChange={(e) => setForm((prev) => ({ ...prev, lastName: e.target.value }))}
                />
              </div>
              <Input
                type="email"
                placeholder="admin.l2@localcart.com"
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              />
              <Input
                type="password"
                placeholder="Strong password"
                value={form.password}
                onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              />
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Admin'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact Us Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={saveContactInfo} className="space-y-3">
              <Input
                type="email"
                placeholder="Support email"
                value={contactInfo.supportEmail}
                onChange={(e) => setContactInfo((prev) => ({ ...prev, supportEmail: e.target.value }))}
              />
              <Input
                placeholder="Support phone"
                value={contactInfo.supportPhone}
                onChange={(e) => setContactInfo((prev) => ({ ...prev, supportPhone: e.target.value }))}
              />
              <Input
                placeholder="Support address"
                value={contactInfo.supportAddress}
                onChange={(e) => setContactInfo((prev) => ({ ...prev, supportAddress: e.target.value }))}
              />
              <Input
                placeholder="Support hours"
                value={contactInfo.supportHours}
                onChange={(e) => setContactInfo((prev) => ({ ...prev, supportHours: e.target.value }))}
              />
              <Button type="submit" disabled={savingContact}>
                {savingContact ? 'Saving...' : 'Save Contact Info'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Existing Admin Accounts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {admins.length === 0 && <p className="text-gray-600">No admin accounts found.</p>}
          {admins.map((admin) => {
            const isCurrentUser = String(admin.id) === String(user?.id)
            const isLevelOne = admin.level === 'LEVEL_1'

            return (
              <div key={admin.id} className="rounded-md border p-3 flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{admin.firstName} {admin.lastName}</p>
                  <p className="text-sm text-gray-600">{admin.email}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    ID: {admin.id} | Level: {admin.level.replace('_', ' ')} | Status: {admin.isActive ? 'Active' : 'Suspended'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    disabled={isCurrentUser || isLevelOne || admin.isActive}
                    onClick={() => updateAdminStatus(admin.id, true)}
                  >
                    Activate
                  </Button>
                  <Button
                    variant="secondary"
                    disabled={isCurrentUser || isLevelOne || !admin.isActive}
                    onClick={() => updateAdminStatus(admin.id, false)}
                  >
                    Suspend
                  </Button>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
