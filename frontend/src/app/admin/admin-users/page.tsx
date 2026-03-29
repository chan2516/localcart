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
import { AdminShell } from '@/components/admin-shell'

type AdminAccount = {
  id: number
  email: string
  firstName: string
  lastName: string
  isActive: boolean
  level: 'LEVEL_1' | 'LEVEL_2'
}

type ContactInfo = {
  pageTitle: string
  pageSubtitle: string
  announcementTitle: string
  announcementBody: string
  supportEmail: string
  supportPhone: string
  supportAddress: string
  supportHours: string
  faqTitle: string
  faqBody: string
}

export default function AdminUsersPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()

  const [admins, setAdmins] = useState<AdminAccount[]>([])
  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    pageTitle: 'Contact LocalCart',
    pageSubtitle: 'We are here to help customers and vendors with fast, friendly support.',
    announcementTitle: 'Need quick assistance?',
    announcementBody:
      'Share your issue with account details, order number, or vendor name so our support team can resolve it quickly. For admin escalations, include screenshots and a short timeline of events.',
    supportEmail: 'support@localcart.com',
    supportPhone: '+1-800-LOCALCART',
    supportAddress: 'LocalCart Support Center',
    supportHours: 'Mon-Sat, 9:00 AM - 6:00 PM',
    faqTitle: 'Before you contact us',
    faqBody:
      'Most order updates are available in your dashboard under Orders. Vendors can track approvals and policy updates in Vendor Dashboard. If your issue remains unresolved, contact support and mention your registered email for faster verification.',
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
        setContactInfo((prev) => ({ ...prev, ...contactResponse }))
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

    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters long')
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
      const details = error?.errors
        ? Object.values(error.errors).filter(Boolean).join(' | ')
        : null
      toast.error(details || error?.message || 'Failed to create admin account')
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
      const details = error?.errors
        ? Object.values(error.errors).filter(Boolean).join(' | ')
        : null
      toast.error(details || error?.message || 'Failed to update contact info')
    } finally {
      setSavingContact(false)
    }
  }

  const previewFaqItems = contactInfo.faqBody
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)

  if (loading) {
    return <div className="max-w-7xl mx-auto px-4 py-10">Loading admin access settings...</div>
  }

  return (
    <AdminShell
      title="Admin Access Management"
      subtitle="Create and control second-level admins, and manage Contact Us details."
    >
      <div className="flex items-start justify-between gap-4 flex-wrap">
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
                placeholder="Page title"
                value={contactInfo.pageTitle}
                onChange={(e) => setContactInfo((prev) => ({ ...prev, pageTitle: e.target.value }))}
              />
              <Input
                placeholder="Page subtitle"
                value={contactInfo.pageSubtitle}
                onChange={(e) => setContactInfo((prev) => ({ ...prev, pageSubtitle: e.target.value }))}
              />
              <Input
                placeholder="Announcement title"
                value={contactInfo.announcementTitle}
                onChange={(e) => setContactInfo((prev) => ({ ...prev, announcementTitle: e.target.value }))}
              />
              <textarea
                className="min-h-[120px] w-full rounded-md border px-3 py-2 text-sm"
                placeholder="Announcement body"
                value={contactInfo.announcementBody}
                onChange={(e) => setContactInfo((prev) => ({ ...prev, announcementBody: e.target.value }))}
              />
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
              <Input
                placeholder="FAQ title"
                value={contactInfo.faqTitle}
                onChange={(e) => setContactInfo((prev) => ({ ...prev, faqTitle: e.target.value }))}
              />
              <textarea
                className="min-h-[120px] w-full rounded-md border px-3 py-2 text-sm"
                placeholder="FAQ content (one point per line)"
                value={contactInfo.faqBody}
                onChange={(e) => setContactInfo((prev) => ({ ...prev, faqBody: e.target.value }))}
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
          <CardTitle>Live Contact Us Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border bg-gradient-to-br from-slate-50 to-white p-6 space-y-6">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900">{contactInfo.pageTitle || 'Contact LocalCart'}</h2>
              <p className="text-slate-600">{contactInfo.pageSubtitle || 'Support and help details for customers and vendors.'}</p>
            </div>

            <div className="rounded-lg border bg-white p-4">
              <p className="text-sm uppercase tracking-wide text-slate-500">Featured Update</p>
              <h3 className="mt-1 text-xl font-semibold text-slate-900">{contactInfo.announcementTitle || 'Need quick assistance?'}</h3>
              <p className="mt-2 whitespace-pre-line text-slate-700">{contactInfo.announcementBody}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-lg border bg-white p-4">
                <p className="text-sm text-slate-500">Email</p>
                <p className="font-semibold text-slate-900">{contactInfo.supportEmail}</p>
              </div>
              <div className="rounded-lg border bg-white p-4">
                <p className="text-sm text-slate-500">Phone</p>
                <p className="font-semibold text-slate-900">{contactInfo.supportPhone}</p>
              </div>
              <div className="rounded-lg border bg-white p-4">
                <p className="text-sm text-slate-500">Address</p>
                <p className="font-semibold text-slate-900">{contactInfo.supportAddress}</p>
              </div>
              <div className="rounded-lg border bg-white p-4">
                <p className="text-sm text-slate-500">Support Hours</p>
                <p className="font-semibold text-slate-900">{contactInfo.supportHours}</p>
              </div>
            </div>

            <div className="rounded-lg border bg-white p-4">
              <h3 className="text-xl font-semibold text-slate-900">{contactInfo.faqTitle}</h3>
              {previewFaqItems.length > 0 ? (
                <ul className="mt-2 space-y-2 text-slate-700">
                  {previewFaqItems.map((item, index) => (
                    <li key={`${item}-${index}`} className="flex gap-2">
                      <span className="font-semibold text-slate-500">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-slate-700">{contactInfo.faqBody}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

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
      </AdminShell>
  )
}
