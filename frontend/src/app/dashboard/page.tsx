'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/auth-store'
import { useProducts } from '@/hooks/use-api'
import { ProductCard } from '@/components/product-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AccountPanel } from '@/components/account-panel'

export default function DashboardPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()
  const { data: productsData, isLoading: productsLoading } = useProducts(1, 8)

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/auth/login')
    }

    if (user?.role === 'VENDOR') {
      router.replace('/vendor/dashboard')
      return
    }

    if (user?.role === 'ADMIN') {
      router.replace('/admin/dashboard')
    }
  }, [isAuthenticated, router, user])

  if (!user) {
    return null
  }

  const isVendor = user.role === 'VENDOR'

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Welcome, {user.firstName || 'User'}</h1>
        <p className="text-gray-600 mt-1">
          Signed in successfully as <span className="font-semibold">{user.role}</span>
        </p>
      </div>

      <AccountPanel user={user} />

      <Card>
        <CardHeader>
          <CardTitle>Account Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p><span className="font-semibold">Email:</span> {user.email}</p>
          <p><span className="font-semibold">Role:</span> {user.role}</p>
          {isVendor && user.vendorId ? (
            <p><span className="font-semibold">Vendor ID:</span> {user.vendorId}</p>
          ) : null}
        </CardContent>
      </Card>

      {isVendor ? (
        <Card>
          <CardHeader>
            <CardTitle>Vendor Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Link href="/vendor/dashboard">
              <Button>Open Vendor Dashboard</Button>
            </Link>
            <Link href="/profile">
              <Button variant="outline">View Profile</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Customer Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Link href="/profile">
              <Button>View Profile</Button>
            </Link>
            <Link href="/products">
              <Button variant="outline">Browse Products</Button>
            </Link>
            <Link href="/auth/vendor/register">
              <Button variant="outline">Become a Vendor</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Products For You</CardTitle>
        </CardHeader>
        <CardContent>
          {productsLoading ? (
            <p className="text-gray-600">Loading products...</p>
          ) : productsData?.content && productsData.content.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {productsData.content.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No products are available right now.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
