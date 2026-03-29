'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { isAnyAdminRole, isLevelOneAdminRole, useAuthStore } from '@/lib/auth-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ShoppingCart, Search } from 'lucide-react'
import { UserMenu } from './user-menu'
import { cn } from '@/lib/utils'

export function Header() {
  const pathname = usePathname()
  const { user, accessToken, loadUserFromStorage, getProfile } = useAuthStore()
  const isAdminRoute = pathname.startsWith('/admin') || pathname.startsWith('/auth/admin') || pathname === '/adminlogin'
  const isAdmin = isAnyAdminRole(user?.role)
  const isLevelOneAdmin = isLevelOneAdminRole(user?.role)
  const isVendor = user?.role === 'VENDOR'
  const showMarketplaceNav = !isAdmin && !isVendor && !isAdminRoute

  const navItems = isAdmin
    ? [
        { href: '/admin/dashboard', label: 'Admin Dashboard' },
        ...(isLevelOneAdmin ? [{ href: '/admin/development', label: 'Development' }] : []),
        ...(isLevelOneAdmin ? [{ href: '/admin/admin-users', label: 'Admin Access' }] : []),
      ]
    : isAdminRoute
      ? [{ href: '/admin/login', label: 'Admin Login' }]
    : isVendor
      ? [
          { href: '/', label: 'Home' },
          { href: '/vendor/dashboard', label: 'Vendor Dashboard' },
        ]
      : [
          { href: '/', label: 'Home' },
          { href: '/products', label: 'Products' },
        ]

  useEffect(() => {
    loadUserFromStorage()
  }, [loadUserFromStorage])

  useEffect(() => {
    if (accessToken) {
      getProfile()
    }
  }, [accessToken, getProfile])

  return (
    <header className={cn(
      'sticky top-0 z-50 border-b backdrop-blur',
      isAdmin
        ? 'bg-slate-950/95 border-slate-800 text-slate-100'
        : 'bg-white/95 border-slate-300 text-slate-900 shadow-sm'
    )}>
      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* Top bar - Logo and search */}
        <div className="flex items-center justify-between gap-4 mb-4 flex-wrap md:flex-nowrap">
          <Link href="/" className={cn('text-2xl font-bold tracking-tight', isAdmin ? 'text-white' : 'text-slate-900')}>
            LocalCart
          </Link>

          {showMarketplaceNav ? (
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Input
                  placeholder="Search products..."
                  className={cn('pr-10', isAdmin && 'bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-400')}
                  type="search"
                />
                <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>
          ) : (
            <div className="flex-1" />
          )}

          <div className="flex items-center gap-4">
            {showMarketplaceNav && (
              <Link href="/cart">
                <Button variant={isAdmin ? 'secondary' : 'ghost'} size="icon">
                  <ShoppingCart className="h-5 w-5" />
                </Button>
              </Link>
            )}

            {/* Auth buttons or user menu */}
            {user ? (
              <UserMenu user={user} />
            ) : (
                isAdminRoute ? (
                  <Link href="/auth/login">
                    <Button variant="outline">Customer Portal</Button>
                  </Link>
                ) : (
                  <div className="flex gap-2">
                    <Link href="/auth/login">
                      <Button variant="outline">Login</Button>
                    </Link>
                    <Link href="/auth/register">
                      <Button>Sign Up</Button>
                    </Link>
                  </div>
                )
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex gap-2 overflow-x-auto pb-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'text-sm font-semibold px-3 py-1.5 rounded-md transition-colors whitespace-nowrap',
                  isActive
                    ? (isAdmin ? 'bg-white text-slate-900' : 'bg-slate-900 text-white')
                    : (isAdmin ? 'text-slate-200 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-100')
                )}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
