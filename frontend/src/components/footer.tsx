"use client"

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { apiClient } from '@/lib/api-client'
import { isAnyAdminRole, isLevelOneAdminRole, useAuthStore } from '@/lib/auth-store'

type ContactInfo = {
  supportEmail: string
  supportPhone: string
  supportAddress: string
  supportHours: string
}

export function Footer() {
  const pathname = usePathname()
  const { user } = useAuthStore()
  const isAdminRoute = pathname.startsWith('/admin') || pathname.startsWith('/auth/admin') || pathname === '/adminlogin'
  const isAdmin = isAnyAdminRole(user?.role) || isAdminRoute
  const isLevelOneAdmin = isLevelOneAdminRole(user?.role)
  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    supportEmail: 'support@localcart.com',
    supportPhone: '+1-800-LOCALCART',
    supportAddress: 'LocalCart Support Center',
    supportHours: 'Mon-Sat, 9:00 AM - 6:00 PM',
  })

  useEffect(() => {
    let mounted = true

    const loadContactInfo = async () => {
      try {
        const response = await apiClient.get<ContactInfo>('/public/contact-info')
        if (mounted) {
          setContactInfo(response)
        }
      } catch {
        // Keep fallback values when backend is unavailable.
      }
    }

    loadContactInfo()

    return () => {
      mounted = false
    }
  }, [])

  return (
    <footer className="bg-gray-900 text-white py-12 mt-20 border-t border-slate-700">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="font-bold text-lg mb-4">LocalCart</h3>
            <p className="text-gray-400 text-sm">
              {isAdmin
                ? 'Admin workspace for platform operations, developer diagnostics, and environment monitoring.'
                : 'Shop from local vendors with fast delivery and great deals.'}
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">{isAdmin ? 'Admin' : 'Shop'}</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              {isAdmin ? (
                <>
                  <li><Link href="/admin/dashboard" className="hover:text-white">Admin Dashboard</Link></li>
                  <li><Link href="/admin/verification" className="hover:text-white">Vendor Verification</Link></li>
                  {isLevelOneAdmin && <li><Link href="/admin/development" className="hover:text-white">Development Tools</Link></li>}
                  {isLevelOneAdmin && <li><Link href="/admin/admin-users" className="hover:text-white">Admin Access</Link></li>}
                </>
              ) : (
                <>
                  <li><Link href="/products" className="hover:text-white">Products</Link></li>
                  <li><a href="#" className="hover:text-white">Categories</a></li>
                  <li><a href="#" className="hover:text-white">Deals</a></li>
                </>
              )}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">{isAdmin ? 'Dev Access' : 'Support'}</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              {isAdmin ? (
                <>
                  <li><a href="http://localhost:3001" target="_blank" rel="noreferrer" className="hover:text-white">Grafana</a></li>
                  <li><a href="http://localhost:8081" target="_blank" rel="noreferrer" className="hover:text-white">Adminer DB</a></li>
                  {isLevelOneAdmin && <li><a href="http://localhost:5678" target="_blank" rel="noreferrer" className="hover:text-white">N8N</a></li>}
                </>
              ) : (
                <>
                  <li><Link href="/contact" className="hover:text-white">Contact Us Page</Link></li>
                  <li><a href={`mailto:${contactInfo.supportEmail}`} className="hover:text-white">{contactInfo.supportEmail}</a></li>
                  <li><span>{contactInfo.supportPhone}</span></li>
                  <li><span>{contactInfo.supportHours}</span></li>
                </>
              )}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">{isAdmin ? 'API Templates' : 'Legal'}</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              {isAdmin ? (
                <>
                  <li><Link href="/admin/development#endpoint-templates" className="hover:text-white">Auth Templates</Link></li>
                  <li><Link href="/admin/development#endpoint-templates" className="hover:text-white">User/Vendor Mgmt</Link></li>
                  <li><Link href="/admin/development#endpoint-templates" className="hover:text-white">Dashboard APIs</Link></li>
                </>
              ) : (
                <>
                  <li><a href="#" className="hover:text-white">Privacy</a></li>
                  <li><a href="#" className="hover:text-white">Terms</a></li>
                  <li><a href="#" className="hover:text-white">Cookies</a></li>
                </>
              )}
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
          <p>&copy; 2026 LocalCart. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
