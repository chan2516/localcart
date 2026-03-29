'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { isLevelOneAdminRole, useAuthStore } from '@/lib/auth-store'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type AdminShellProps = {
  title: string
  subtitle?: string
  children: React.ReactNode
}

const baseLinks = [
  { href: '/admin/dashboard', label: 'Overview' },
  { href: '/admin/verification', label: 'Verification' },
]

const levelOneLinks = [
  { href: '/admin/admin-users', label: 'Admin Access' },
  { href: '/admin/development', label: 'Development' },
]

export function AdminShell({ title, subtitle, children }: AdminShellProps) {
  const pathname = usePathname()
  const { user } = useAuthStore()
  const [menuOpen, setMenuOpen] = useState(false)

  const links = isLevelOneAdminRole(user?.role) ? [...baseLinks, ...levelOneLinks] : baseLinks

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 lg:py-8 lg:grid lg:grid-cols-[240px,1fr] lg:gap-6">
      <div className="mb-4 lg:hidden">
        <Button
          variant="outline"
          className="w-full justify-between"
          onClick={() => setMenuOpen((prev) => !prev)}
        >
          Admin Menu
          {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
        {menuOpen && (
          <nav className="mt-2 rounded-lg border bg-white p-2">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'block rounded-md px-3 py-2 text-sm font-medium',
                  pathname === link.href
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                )}
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}
      </div>

      <aside className="hidden lg:block">
        <div className="sticky top-24 rounded-xl border bg-white p-3">
          <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Admin</p>
          <nav className="space-y-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'block rounded-md px-3 py-2 text-sm font-medium',
                  pathname === link.href
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </aside>

      <section className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
          {subtitle ? <p className="mt-1 text-slate-600">{subtitle}</p> : null}
        </div>
        {children}
      </section>
    </div>
  )
}
