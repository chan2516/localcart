'use client'

import { useRouter } from 'next/navigation'
import { isLevelOneAdminRole, useAuthStore } from '@/lib/auth-store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle } from 'lucide-react'

export default function CreateAdminPage() {
  const router = useRouter()
  const { user } = useAuthStore()

  if (!isLevelOneAdminRole(user?.role)) {
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
                You need level-1 administrator privileges to access admin tools.
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
          <CardTitle className="text-2xl font-bold text-gray-900">Admin Access Moved</CardTitle>
          <CardDescription className="text-gray-600 mt-2">
            Admin creation and management are available in the new Admin Access page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-md px-3 py-2">
            Use this area to create second-level admins and edit Contact Us information.
          </p>
          <Button
            onClick={() => router.push('/admin/admin-users')}
            className="w-full bg-red-600 hover:bg-red-700 text-white"
          >
            Open Admin Access Management
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
