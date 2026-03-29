'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { isAnyAdminRole, useAuthStore } from '@/lib/auth-store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function ChangePasswordPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading, changePassword } = useAuthStore()

  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/auth/login')
    }
  }, [isAuthenticated, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.error('All fields are required')
      return
    }

    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters')
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error('New password and confirm password do not match')
      return
    }

    try {
      await changePassword(oldPassword, newPassword)
      toast.success('Password changed successfully')

      if (isAnyAdminRole(user?.role)) {
        router.push('/admin/dashboard')
      } else if (user?.role === 'VENDOR') {
        router.push('/vendor/dashboard')
      } else {
        router.push('/dashboard')
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to change password')
    }
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>
            Update your account password for better security.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="oldPassword" className="text-sm font-medium">Current Password</label>
              <Input
                id="oldPassword"
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Enter current password"
              />
            </div>

            <div>
              <label htmlFor="newPassword" className="text-sm font-medium">New Password</label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="text-sm font-medium">Confirm New Password</label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Updating...' : 'Update Password'}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
