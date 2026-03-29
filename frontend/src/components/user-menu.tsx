'use client'

import { isAnyAdminRole, isLevelOneAdminRole, User } from '@/lib/auth-store'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import Link from 'next/link'
import { useAuthStore } from '@/lib/auth-store'
import { useRouter } from 'next/navigation'

interface UserMenuProps {
  user: User
}

export function UserMenu({ user }: UserMenuProps) {
  const { logout } = useAuthStore()
  const router = useRouter()

  const isAdmin = isAnyAdminRole(user.role)
  const isLevelOneAdmin = isLevelOneAdminRole(user.role)

  const dashboardHref =
    isAdmin
      ? '/admin/dashboard'
      : user.role === 'VENDOR'
        ? '/vendor/dashboard'
        : '/dashboard'

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  const initials = `${user.firstName?.[0] || 'U'}${user.lastName?.[0] || 'U'}`.toUpperCase()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Avatar>
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5 text-sm">
          <p className="font-medium">{user.firstName} {user.lastName}</p>
          <p className="text-xs text-gray-500">{user.email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={dashboardHref}>Dashboard</Link>
        </DropdownMenuItem>
        {!isAdmin && (
          <DropdownMenuItem asChild>
            <Link href="/profile">Profile</Link>
          </DropdownMenuItem>
        )}
        {!isAdmin && (
          <DropdownMenuItem asChild>
            <Link href="/orders">Orders</Link>
          </DropdownMenuItem>
        )}
        {!isAdmin && (
          <DropdownMenuItem asChild>
            <Link href="/addresses">Addresses</Link>
          </DropdownMenuItem>
        )}
        {isLevelOneAdmin && (
          <DropdownMenuItem asChild>
            <Link href="/admin/development">Development</Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem asChild>
          <Link href="/auth/change-password">Change Password</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
