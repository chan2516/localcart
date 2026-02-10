'use client'

import { useAuthStore } from '@/lib/auth-store'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default function ProfilePage() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login')
    }
  }, [isAuthenticated, router])

  if (!user) {
    return null
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8">Profile</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main Profile Card */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    First Name
                  </label>
                  <p className="text-lg font-semibold">{user.firstName || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Last Name
                  </label>
                  <p className="text-lg font-semibold">{user.lastName || '-'}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Email
                </label>
                <p className="text-lg font-semibold">{user.email}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Account Role
                </label>
                <p className="text-lg font-semibold capitalize">{user.role.toLowerCase()}</p>
              </div>

              <div className="pt-6 border-t">
                <Link href="/auth/change-password">
                  <Button>Change Password</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Links */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Quick Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/orders" className="block">
                <Button variant="outline" className="w-full justify-start">
                  My Orders
                </Button>
              </Link>
              <Link href="/addresses" className="block">
                <Button variant="outline" className="w-full justify-start">
                  Addresses
                </Button>
              </Link>
              <Link href="/cart" className="block">
                <Button variant="outline" className="w-full justify-start">
                  Shopping Cart
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
