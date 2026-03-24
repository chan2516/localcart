'use client'

import { useRouter } from 'next/navigation'
import { User, useAuthStore } from '@/lib/auth-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface AccountPanelProps {
  user: User
}

export function AccountPanel({ user }: AccountPanelProps) {
  const router = useRouter()
  const { logout } = useAuthStore()

  const initials = `${user.firstName?.[0] || 'U'}${user.lastName?.[0] || 'U'}`.toUpperCase()

  const handleLogout = () => {
    logout()
    router.push('/auth/login')
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Account Information</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{user.firstName || 'User'} {user.lastName || ''}</p>
              <p className="text-sm text-gray-600">{user.email}</p>
              <p className="text-xs text-gray-500">Role: {user.role}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => router.push('/profile')}>
              My Details
            </Button>
            <Button variant="outline" onClick={() => router.push('/auth/change-password')}>
              Change Password
            </Button>
            <Button variant="destructive" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
