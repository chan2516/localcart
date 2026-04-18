'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { apiClient } from '@/lib/api-client'
import { resolveMediaUrl } from '@/lib/media-url'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ShoppingCart, Store, Shield, TrendingUp, Package, Star, BarChart3, PieChart, Clock, Users } from 'lucide-react'
import { toast } from 'sonner'

interface Product {
  id: number
  slug: string
  name: string
  description: string
  price: number
  discountPrice?: number
  imageUrl?: string
  rating?: number
  stock: number
  vendorName?: string
}

interface ChartData {
  name: string
  value: number
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [stats] = useState({
    totalVendors: 247,
    totalOrders: 5843,
    activeUsers: 12500,
    avgDeliveryTime: '2-4 hours',
  })

  const [salesData] = useState<ChartData[]>([
    { name: 'Jan', value: 2400 },
    { name: 'Feb', value: 3200 },
    { name: 'Mar', value: 2800 },
    { name: 'Apr', value: 4100 },
    { name: 'May', value: 3900 },
    { name: 'Jun', value: 5200 },
  ])

  const [revenueData] = useState<ChartData[]>([
    { name: 'Jan', value: 12000 },
    { name: 'Feb', value: 16000 },
    { name: 'Mar', value: 14000 },
    { name: 'Apr', value: 20500 },
    { name: 'May', value: 19500 },
    { name: 'Jun', value: 26000 },
  ])

  const [categoryData] = useState<ChartData[]>([
    { name: 'Groceries', value: 35 },
    { name: 'Electronics', value: 25 },
    { name: 'Clothing', value: 20 },
    { name: 'Home & Garden', value: 15 },
    { name: 'Other', value: 5 },
  ])

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await apiClient.get<any>('/products?page=0&size=8')
        const mapped = (response.products || []).map((product: any) => ({
          id: product.id,
          slug: product.slug,
          name: product.name,
          description: product.description || '',
          price: Number(product.price || 0),
          discountPrice: product.discountPrice != null ? Number(product.discountPrice) : undefined,
          imageUrl: Array.isArray(product.imageUrls) && product.imageUrls.length > 0 ? product.imageUrls[0] : undefined,
          rating: product.rating != null ? Number(product.rating) : undefined,
          stock: Number(product.stock || 0),
          vendorName: product.vendorName,
        }))
        setProducts(mapped)
      } catch (error) {
        console.error('Failed to fetch products:', error)
        toast.error('Failed to load products')
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-4">Welcome to LocalCart</h1>
          <p className="text-xl mb-8 text-blue-100">
            Your trusted marketplace for local vendors with fast delivery and competitive prices
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/products">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                <ShoppingCart className="mr-2 h-5 w-5" />
                Start Shopping
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Platform Stats */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-12 text-center text-gray-900">Platform Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-l-4 border-l-blue-600">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-gray-600 flex items-center gap-2">
                  <Store className="h-4 w-4 text-blue-600" />
                  Active Vendors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-gray-900">{stats.totalVendors}</p>
                <p className="text-sm text-gray-500 mt-2">Local businesses trusted by customers</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-600">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-gray-600 flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-green-600" />
                  Total Orders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-gray-900">{stats.totalOrders.toLocaleString()}</p>
                <p className="text-sm text-gray-500 mt-2">Successfully delivered orders</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-600">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-gray-600 flex items-center gap-2">
                  <Users className="h-4 w-4 text-purple-600" />
                  Active Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-gray-900">{stats.activeUsers.toLocaleString()}</p>
                <p className="text-sm text-gray-500 mt-2">Monthly active customers</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-600">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-gray-600 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-600" />
                  Avg Delivery
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-gray-900">{stats.avgDeliveryTime}</p>
                <p className="text-sm text-gray-500 mt-2">Fast & reliable delivery</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Sales Chart */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8 text-gray-900">Sales Performance</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Sales Orders Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  Monthly Orders
                </CardTitle>
                <CardDescription>Order volume trends over 6 months</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {salesData.map((data) => {
                    const maxValue = Math.max(...salesData.map(d => d.value))
                    const percentage = (data.value / maxValue) * 100
                    return (
                      <div key={data.name}>
                        <div className="flex justify-between mb-2">
                          <span className="font-semibold text-sm text-gray-900">{data.name}</span>
                          <span className="text-sm text-gray-600">{data.value} orders</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Revenue Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-green-600" />
                  Monthly Revenue
                </CardTitle>
                <CardDescription>Revenue generated over 6 months</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {revenueData.map((data) => {
                    const maxValue = Math.max(...revenueData.map(d => d.value))
                    const percentage = (data.value / maxValue) * 100
                    return (
                      <div key={data.name}>
                        <div className="flex justify-between mb-2">
                          <span className="font-semibold text-sm text-gray-900">{data.name}</span>
                          <span className="text-sm text-gray-600">${(data.value / 1000).toFixed(1)}k</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className="bg-green-600 h-2.5 rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Category Distribution */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8 text-gray-900">Product Categories</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-purple-600" />
                  Category Distribution
                </CardTitle>
                <CardDescription>Breakdown of products by category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categoryData.map((category) => (
                    <div key={category.name}>
                      <div className="flex justify-between mb-2">
                        <span className="font-semibold text-gray-900">{category.name}</span>
                        <span className="text-gray-600 font-semibold">{category.value}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full transition-all duration-500 ${
                            category.name === 'Groceries'
                              ? 'bg-orange-500'
                              : category.name === 'Electronics'
                              ? 'bg-blue-500'
                              : category.name === 'Clothing'
                              ? 'bg-pink-500'
                              : category.name === 'Home & Garden'
                              ? 'bg-green-500'
                              : 'bg-gray-500'
                          }`}
                          style={{ width: `${category.value}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Why Choose LocalCart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-600" />
                  Why Choose LocalCart
                </CardTitle>
                <CardDescription>What makes us different</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    <Store className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Support Local</h4>
                    <p className="text-sm text-gray-600">Every purchase supports local vendors and community businesses</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Best Prices</h4>
                    <p className="text-sm text-gray-600">Competitive pricing with regular discounts and exclusive deals</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    <Clock className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Fast Delivery</h4>
                    <p className="text-sm text-gray-600">Get your orders delivered within 2-4 hours in your area</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    <Shield className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Secure Shopping</h4>
                    <p className="text-sm text-gray-600">Safe payment methods and buyer protection guarantee</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Featured Products</h2>
              <p className="text-gray-600 mt-2">Discover our top picks for you</p>
            </div>
            <Link href="/products">
              <Button variant="outline">View All Products</Button>
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="h-48 bg-gray-200 rounded mb-4" />
                    <div className="h-4 bg-gray-200 rounded mb-2" />
                    <div className="h-4 bg-gray-200 rounded w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : products.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Products Yet</h3>
                <p className="text-gray-600 mb-4">
                  We're setting up our marketplace. Check back soon!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <Link key={product.id} href={`/products/${product.slug}`}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                    <CardContent className="p-0">
                      <div className="relative h-48 bg-gray-100 rounded-t-lg overflow-hidden">
                        {product.imageUrl ? (
                          <img
                            src={resolveMediaUrl(product.imageUrl)}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <Package className="h-16 w-16 text-gray-300" />
                          </div>
                        )}
                        {product.discountPrice && (
                          <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                            SALE
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">
                          {product.name}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                          {product.description}
                        </p>
                        <div className="flex items-center gap-1 mb-2">
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          <span className="text-sm font-medium">{(product.rating ?? 0).toFixed(1)}</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                          {product.discountPrice ? (
                            <>
                              <span className="text-lg font-bold text-gray-900">
                                ${product.discountPrice.toFixed(2)}
                              </span>
                              <span className="text-sm text-gray-500 line-through">
                                ${product.price.toFixed(2)}
                              </span>
                            </>
                          ) : (
                            <span className="text-lg font-bold text-gray-900">
                              ${product.price.toFixed(2)}
                            </span>
                          )}
                        </div>
                        {product.stock <= 5 && product.stock > 0 && (
                          <p className="text-xs text-orange-600 mt-2">
                            Only {product.stock} left!
                          </p>
                        )}
                        {product.stock === 0 && (
                          <p className="text-xs text-red-600 mt-2">Out of Stock</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
