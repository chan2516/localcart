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
      <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
        <div className="flex gap-2">
          <Link href="/admin/dashboard">
            <Button variant="outline" size="sm">Back To Dashboard</Button>
          </Link>
          <Link href="/admin/development">
            <Button variant="outline" size="sm">Development Hub</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Create Second-Level Admin</CardTitle>
            <p className="text-xs text-slate-500 mt-1">Add a new admin account to manage platform</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={createAdmin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Full Name</label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="First name"
                    value={form.firstName}
                    onChange={(e) => setForm((prev) => ({ ...prev, firstName: e.target.value }))}
                    className="text-sm"
                  />
                  <Input
                    placeholder="Last name"
                    value={form.lastName}
                    onChange={(e) => setForm((prev) => ({ ...prev, lastName: e.target.value }))}
                    className="text-sm"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Email Address</label>
                <Input
                  type="email"
                  placeholder="admin@localcart.com"
                  value={form.email}
                  onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                  className="text-sm"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Password</label>
                <Input
                  type="password"
                  placeholder="Minimum 8 characters"
                  value={form.password}
                  onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                  className="text-sm"
                />
                <p className="text-xs text-slate-500">Must be at least 8 characters long</p>
              </div>
              
              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? 'Creating...' : 'Create Admin'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Contact Us Configuration</CardTitle>
            <p className="text-xs text-slate-500 mt-1">Configure your support page and contact details</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={saveContactInfo} className="space-y-6">
              {/* Page Header Section */}
              <div className="border-b pb-4">
                <h3 className="text-sm font-semibold text-slate-900 mb-3">Page Header</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Page Title</label>
                    <Input
                      placeholder="Contact LocalCart"
                      value={contactInfo.pageTitle}
                      onChange={(e) => setContactInfo((prev) => ({ ...prev, pageTitle: e.target.value }))}
                      className="text-sm mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Page Subtitle</label>
                    <Input
                      placeholder="Support description"
                      value={contactInfo.pageSubtitle}
                      onChange={(e) => setContactInfo((prev) => ({ ...prev, pageSubtitle: e.target.value }))}
                      className="text-sm mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Announcement Section */}
              <div className="border-b pb-4">
                <h3 className="text-sm font-semibold text-slate-900 mb-3">Featured Announcement</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Title</label>
                    <Input
                      placeholder="e.g., Need quick assistance?"
                      value={contactInfo.announcementTitle}
                      onChange={(e) => setContactInfo((prev) => ({ ...prev, announcementTitle: e.target.value }))}
                      className="text-sm mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Message</label>
                    <textarea
                      className="min-h-[100px] w-full rounded-md border px-3 py-2 text-sm font-normal"
                      placeholder="Support message body..."
                      value={contactInfo.announcementBody}
                      onChange={(e) => setContactInfo((prev) => ({ ...prev, announcementBody: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              {/* Contact Details Section */}
              <div className="border-b pb-4">
                <h3 className="text-sm font-semibold text-slate-900 mb-3">Contact Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Email</label>
                    <Input
                      type="email"
                      placeholder="support@localcart.com"
                      value={contactInfo.supportEmail}
                      onChange={(e) => setContactInfo((prev) => ({ ...prev, supportEmail: e.target.value }))}
                      className="text-sm mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Phone</label>
                    <Input
                      placeholder="+1-800-LOCALCART"
                      value={contactInfo.supportPhone}
                      onChange={(e) => setContactInfo((prev) => ({ ...prev, supportPhone: e.target.value }))}
                      className="text-sm mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Address</label>
                    <Input
                      placeholder="Support address"
                      value={contactInfo.supportAddress}
                      onChange={(e) => setContactInfo((prev) => ({ ...prev, supportAddress: e.target.value }))}
                      className="text-sm mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Hours</label>
                    <Input
                      placeholder="Mon-Sat, 9:00 AM - 6:00 PM"
                      value={contactInfo.supportHours}
                      onChange={(e) => setContactInfo((prev) => ({ ...prev, supportHours: e.target.value }))}
                      className="text-sm mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* FAQ Section */}
              <div className="pb-4">
                <h3 className="text-sm font-semibold text-slate-900 mb-3">Frequently Asked Questions</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">FAQ Title</label>
                    <Input
                      placeholder="e.g., Before you contact us"
                      value={contactInfo.faqTitle}
                      onChange={(e) => setContactInfo((prev) => ({ ...prev, faqTitle: e.target.value }))}
                      className="text-sm mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">FAQ Content</label>
                    <textarea
                      className="min-h-[100px] w-full rounded-md border px-3 py-2 text-sm font-normal"
                      placeholder="One question/point per line..."
                      value={contactInfo.faqBody}
                      onChange={(e) => setContactInfo((prev) => ({ ...prev, faqBody: e.target.value }))}
                    />
                    <p className="text-xs text-slate-500 mt-1">Each line will appear as a separate bullet point</p>
                  </div>
                </div>
              </div>

              <Button type="submit" disabled={savingContact} className="w-full">
                {savingContact ? 'Saving...' : 'Save Contact Info'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Live Contact Us Preview</CardTitle>
          <p className="text-xs text-slate-500 mt-1">See how your contact page will look to visitors</p>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border bg-gradient-to-br from-slate-50 to-white p-8 space-y-8">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold tracking-tight text-slate-900">{contactInfo.pageTitle || 'Contact LocalCart'}</h1>
              <p className="text-lg text-slate-600">{contactInfo.pageSubtitle || 'Support and help details for customers and vendors.'}</p>
            </div>

            <div className="rounded-lg bg-slate-100 border-l-4 border-slate-900 p-5">
              <p className="text-xs uppercase tracking-widest font-semibold text-slate-700">Featured Update</p>
              <h3 className="mt-2 text-2xl font-bold text-slate-900">{contactInfo.announcementTitle || 'Need quick assistance?'}</h3>
              <p className="mt-3 whitespace-pre-line text-slate-700 leading-relaxed">{contactInfo.announcementBody}</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="rounded-lg border bg-white p-4 hover:shadow-sm transition-shadow">
                <p className="text-xs text-slate-500 font-semibold uppercase">Email</p>
                <p className="font-semibold text-slate-900 text-sm mt-2">{contactInfo.supportEmail}</p>
              </div>
              <div className="rounded-lg border bg-white p-4 hover:shadow-sm transition-shadow">
                <p className="text-xs text-slate-500 font-semibold uppercase">Phone</p>
                <p className="font-semibold text-slate-900 text-sm mt-2">{contactInfo.supportPhone}</p>
              </div>
              <div className="rounded-lg border bg-white p-4 hover:shadow-sm transition-shadow">
                <p className="text-xs text-slate-500 font-semibold uppercase">Address</p>
                <p className="font-semibold text-slate-900 text-sm mt-2">{contactInfo.supportAddress}</p>
              </div>
              <div className="rounded-lg border bg-white p-4 hover:shadow-sm transition-shadow">
                <p className="text-xs text-slate-500 font-semibold uppercase">Hours</p>
                <p className="font-semibold text-slate-900 text-sm mt-2">{contactInfo.supportHours}</p>
              </div>
            </div>

            <div className="rounded-lg border bg-white p-6">
              <h3 className="text-2xl font-bold text-slate-900">{contactInfo.faqTitle}</h3>
              {previewFaqItems.length > 0 ? (
                <ul className="mt-4 space-y-3 text-slate-700">
                  {previewFaqItems.map((item, index) => (
                    <li key={`${item}-${index}`} className="flex gap-3">
                      <span className="font-bold text-slate-400 flex-shrink-0">✓</span>
                      <span className="leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-slate-700">{contactInfo.faqBody}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Existing Admin Accounts</CardTitle>
          <p className="text-xs text-slate-500 mt-1">Manage permissions and status for second-level admin accounts</p>
        </CardHeader>
        <CardContent>
          {admins.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-600">No admin accounts yet. Create one above to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {admins.map((admin) => {
                const isCurrentUser = String(admin.id) === String(user?.id)
                const isLevelOne = admin.level === 'LEVEL_1'

                return (
                  <div
                    key={admin.id}
                    className="rounded-lg border p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-50 hover:bg-white transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-slate-900 text-sm">
                          {admin.firstName} {admin.lastName}
                        </p>
                        <span
                          className={`text-xs px-2 py-1 rounded font-semibold ${
                            admin.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {admin.isActive ? 'Active' : 'Suspended'}
                        </span>
                        <span className="text-xs px-2 py-1 rounded bg-slate-200 text-slate-800 font-semibold">
                          {admin.level.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-2">{admin.email}</p>
                      <p className="text-xs text-slate-500 mt-1">ID: {admin.id}</p>
                    </div>
                    <div className="flex gap-2 sm:flex-col lg:flex-row">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isCurrentUser || isLevelOne || admin.isActive}
                        onClick={() => updateAdminStatus(admin.id, true)}
                        className="text-xs"
                      >
                        Activate
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={isCurrentUser || isLevelOne || !admin.isActive}
                        onClick={() => updateAdminStatus(admin.id, false)}
                        className="text-xs"
                      >
                        Suspend
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
      </AdminShell>
  )
}
