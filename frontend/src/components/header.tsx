'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useAuthStore } from '@/lib/auth-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ShoppingCart, Search } from 'lucide-react'
import { UserMenu } from './user-menu'

export function Header() {
  const { user, accessToken, loadUserFromStorage, getProfile } = useAuthStore()

  useEffect(() => {
    loadUserFromStorage()
    if (accessToken) {
      getProfile()
    }
  }, [])

  return (
    <header className="sticky top-0 z-50 bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* Top bar - Logo and search */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <Link href="/" className="text-2xl font-bold text-primary">
            LocalCart
          </Link>

          {/* Search bar */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Input
                placeholder="Search products..."
                className="pr-10"
                type="search"
              />
              <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Cart icon */}
            <Link href="/cart">
              <Button variant="ghost" size="icon">
                <ShoppingCart className="h-5 w-5" />
              </Button>
            </Link>

            {/* Auth buttons or user menu */}
            {user ? (
              <UserMenu user={user} />
            ) : (
              <div className="flex gap-2">
                <Link href="/auth/login">
                  <Button variant="outline">Login</Button>
                </Link>
                <Link href="/auth/register">
                  <Button>Sign Up</Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex gap-6">
          <Link href="/" className="text-sm font-medium hover:text-primary">
            Home
          </Link>
          <Link href="/products" className="text-sm font-medium hover:text-primary">
            Products
          </Link>
          {user?.role === 'VENDOR' && (
            <Link href="/vendor/dashboard" className="text-sm font-medium hover:text-primary">
              Vendor Dashboard
            </Link>
          )}
          {user?.role === 'ADMIN' && (
            <Link href="/admin/dashboard" className="text-sm font-medium hover:text-primary">
              Admin Dashboard
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}
