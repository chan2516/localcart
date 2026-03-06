'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { apiClient } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ShoppingCart, Store, Shield, TrendingUp, Package, Star } from 'lucide-react'
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

export default function Home() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

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
            Shop from local vendors with fast delivery and great deals
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/products">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                <ShoppingCart className="mr-2 h-5 w-5" />
                Start Shopping
              </Button>
            </Link>
            <Link href="/auth/vendor/register">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                <Store className="mr-2 h-5 w-5" />
                Become a Vendor
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <Store className="h-10 w-10 text-blue-600 mb-2" />
                <CardTitle>Local Vendors</CardTitle>
                <CardDescription>
                  Support local businesses in your community
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <TrendingUp className="h-10 w-10 text-green-600 mb-2" />
                <CardTitle>Best Prices</CardTitle>
                <CardDescription>
                  Competitive pricing with regular discounts
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Shield className="h-10 w-10 text-purple-600 mb-2" />
                <CardTitle>Secure Shopping</CardTitle>
                <CardDescription>
                  Safe and secure payment methods
                </CardDescription>
              </CardHeader>
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
                <Link href="/auth/vendor/register">
                  <Button>Become a Vendor</Button>
                </Link>
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
                            src={product.imageUrl}
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

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-orange-500 to-red-600 text-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <Store className="h-16 w-16 mx-auto mb-4" />
          <h2 className="text-4xl font-bold mb-4">Ready to Start Selling?</h2>
          <p className="text-xl mb-8 text-orange-100">
            Join our growing community of local vendors
          </p>
          <Link href="/auth/vendor/register">
            <Button size="lg" className="bg-white text-orange-600 hover:bg-gray-100">
              Register as Vendor
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
