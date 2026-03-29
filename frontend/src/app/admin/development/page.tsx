'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { isAnyAdminRole, isLevelOneAdminRole, useAuthStore } from '@/lib/auth-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AdminShell } from '@/components/admin-shell'

const devLinks = [
  { name: 'Backend Health', url: 'http://localhost:8080/actuator/health', note: 'Application + DB + Redis status' },
  { name: 'Swagger UI', url: 'http://localhost:8080/swagger-ui.html', note: 'Interactive API explorer' },
  { name: 'Prometheus', url: 'http://localhost:9090', note: 'Metrics and query explorer' },
  { name: 'Grafana', url: 'http://localhost:3001', note: 'Dashboards (admin/admin)' },
  { name: 'Adminer', url: 'http://localhost:8081', note: 'Database management UI' },
  { name: 'N8N', url: 'http://localhost:5678', note: 'Automation workflows' },
  { name: 'Loki', url: 'http://localhost:3100', note: 'Log aggregation endpoint' },
]

const endpointTemplates = [
  {
    title: 'Auth: Login',
    method: 'POST',
    endpoint: '/api/v1/auth/login',
    payload: `{
  "email": "admin@localcart.com",
  "password": "Pass123!"
}`,
  },
  {
    title: 'Admin: List Users',
    method: 'GET',
    endpoint: '/api/v1/admin/users?page=0&size=20',
    payload: 'Authorization: Bearer {token}',
  },
  {
    title: 'Admin: Manage User (BAN)',
    method: 'POST',
    endpoint: '/api/v1/admin/users/manage',
    payload: `{
  "userId": 12,
  "action": "BAN",
  "reason": "Fraudulent activity"
}`,
  },
  {
    title: 'Admin: Approve Vendor',
    method: 'POST',
    endpoint: '/api/v1/admin/vendors/approve',
    payload: `{
  "vendorId": 8,
  "status": "APPROVED",
  "reason": "Documents verified",
  "commissionRate": 15.00
}`,
  },
  {
    title: 'Admin: Ban Vendor',
    method: 'POST',
    endpoint: '/api/v1/admin/vendors/{id}/ban',
    payload: `{
  "reason": "Policy violation"
}`,
  },
  {
    title: 'Admin: Restore Vendor',
    method: 'POST',
    endpoint: '/api/v1/admin/vendors/{id}/restore',
    payload: '{ }',
  },
  {
    title: 'Admin: Dashboard Stats',
    method: 'GET',
    endpoint: '/api/v1/admin/dashboard',
    payload: 'Authorization: Bearer {token}',
  },
]

export default function AdminDevelopmentPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()

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
      toast.error('Development hub is available for level-1 admins only')
      router.push('/admin/dashboard')
    }
  }, [isAuthenticated, user, router])

  return (
    <AdminShell title="Admin Development Hub" subtitle="Developer utilities, observability links, and API request templates.">
      <div className="flex items-start gap-3 flex-wrap">
        <Link href="/admin/dashboard">
          <Button variant="outline">Back To Dashboard</Button>
        </Link>
        <Link href="/admin/admin-users">
          <Button variant="outline">Admin Access Settings</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Developer Access Links</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {devLinks.map((item) => (
            <a
              key={item.name}
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border p-4 hover:bg-slate-50 transition-colors"
            >
              <p className="font-semibold">{item.name}</p>
              <p className="text-sm text-slate-600 mt-1">{item.note}</p>
              <p className="text-xs text-slate-500 mt-2 break-all">{item.url}</p>
            </a>
          ))}
          <div className="rounded-lg border p-4 bg-slate-50">
            <p className="font-semibold">Application Logs</p>
            <p className="text-sm text-slate-600 mt-1">Use this local path for backend troubleshooting.</p>
            <p className="text-xs text-slate-500 mt-2 break-all">logs/localcart.json</p>
          </div>
        </CardContent>
      </Card>

      <Card id="endpoint-templates">
        <CardHeader>
          <CardTitle>Endpoint Templates (From API Docs)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-600">
            Templates curated from md/API_QUICK_REFERENCE.md, md/API_ENDPOINTS_REFERENCE.md, and md/FRONTEND_API_GUIDE.md.
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {endpointTemplates.map((item) => (
              <div key={item.title} className="rounded-lg border p-4 bg-white">
                <p className="font-semibold">{item.title}</p>
                <p className="text-sm mt-1"><span className="font-semibold">{item.method}</span> {item.endpoint}</p>
                <pre className="mt-3 text-xs bg-slate-950 text-slate-100 p-3 rounded-md overflow-auto">
{item.payload}
                </pre>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </AdminShell>
  )
}
