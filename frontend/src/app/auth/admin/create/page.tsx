'use client'

import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/auth-store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle } from 'lucide-react'

export default function CreateAdminPage() {
  const router = useRouter()
  const { user } = useAuthStore()

  if (user?.role !== 'ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100 py-12 px-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardContent className="pt-10 text-center space-y-6">
            <div className="flex justify-center">
              <AlertTriangle className="h-16 w-16 text-red-500" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-2xl font-bold text-gray-900">Access Denied</CardTitle>
              <CardDescription className="text-base text-gray-600">
                You need administrator privileges to access admin tools.
              </CardDescription>
            </div>
            <Button
              onClick={() => router.push('/admin/login')}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2"
            >
              Go to Admin Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100 py-12 px-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900">Admin Creation Unavailable</CardTitle>
          <CardDescription className="text-gray-600 mt-2">
            This backend currently does not expose an endpoint to create new admin users.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
            Use Admin Dashboard to manage existing users and vendors.
          </p>
          <Button
            onClick={() => router.push('/admin/dashboard')}
            className="w-full bg-red-600 hover:bg-red-700 text-white"
          >
            Go to Admin Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
