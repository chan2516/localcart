'use client'

import { useParams } from 'next/navigation'
import { useProductBySlug, useAddToCart } from '@/hooks/use-api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useState } from 'react'
import Image from 'next/image'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/auth-store'
import Link from 'next/link'

export default function ProductPage() {
  const params = useParams()
  const slug = params.slug as string
  const [quantity, setQuantity] = useState(1)
  const { user } = useAuthStore()

  const { data: product, isLoading } = useProductBySlug(slug)
  const addToCart = useAddToCart()

  const handleAddToCart = async () => {
    if (!user) {
      toast.error('Please login to add items to cart')
      return
    }

    try {
      await addToCart.mutateAsync({
        productId: product!.id,
        quantity,
      })
      toast.success('Added to cart!')
      setQuantity(1)
    } catch (error) {
      toast.error('Failed to add to cart')
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <Skeleton className="h-96 rounded-lg" />
          <Skeleton className="h-96 rounded-lg" />
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Product not found</h1>
        <Link href="/products">
          <Button>Back to Products</Button>
        </Link>
      </div>
    )
  }

  const hasDiscount = product.discountPrice && product.discountPrice < product.price
  const discountPercentage = hasDiscount
    ? Math.round(((product.price - product.discountPrice!) / product.price) * 100)
    : 0

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Breadcrumb */}
      <div className="mb-8">
        <Link href="/products" className="text-blue-600 hover:underline">
          Products
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-600">{product.name}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Images */}
        <div>
          {product.imageUrls && product.imageUrls.length > 0 ? (
            <div className="relative bg-gray-100 rounded-lg overflow-hidden aspect-square">
              <Image
                src={product.imageUrls[0]}
                alt={product.name}
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="bg-gray-100 rounded-lg aspect-square flex items-center justify-center">
              <span className="text-gray-400">No image</span>
            </div>
          )}

          {/* Thumbnail gallery */}
          {product.imageUrls && product.imageUrls.length > 1 && (
            <div className="grid grid-cols-4 gap-2 mt-4">
              {product.imageUrls.map((url, idx) => (
                <div key={idx} className="relative bg-gray-100 rounded aspect-square overflow-hidden">
                  <Image
                    src={url}
                    alt={`${product.name} ${idx + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div>
          <h1 className="text-4xl font-bold mb-4">{product.name}</h1>

          {/* Rating placeholder */}
          <div className="flex items-center gap-2 mb-6">
            <div className="flex text-yellow-400">
              {[...Array(5)].map((_, i) => (
                <span key={i}>★</span>
              ))}
            </div>
            <span className="text-gray-600">(0 reviews)</span>
          </div>

          {/* Price */}
          <div className="mb-6">
            {hasDiscount ? (
              <div className="flex items-center gap-4">
                <span className="text-4xl font-bold text-blue-600">
                  ${product.discountPrice?.toFixed(2)}
                </span>
                <span className="text-2xl text-gray-400 line-through">
                  ${product.price.toFixed(2)}
                </span>
                <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-semibold">
                  {discountPercentage}% OFF
                </span>
              </div>
            ) : (
              <span className="text-4xl font-bold">${product.price.toFixed(2)}</span>
            )}
          </div>

          {/* Stock status */}
          <div className="mb-6">
            {product.stock > 0 ? (
              <span className="text-green-600 font-semibold">In Stock ({product.stock} available)</span>
            ) : (
              <span className="text-red-600 font-semibold">Out of Stock</span>
            )}
          </div>

          {/* Description */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-2">Description</h3>
            <p className="text-gray-600 leading-relaxed">{product.description}</p>
          </div>

          {/* Add to cart section */}
          <div className="border-t pt-8">
            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2">Quantity</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-2 border rounded hover:bg-gray-50"
                >
                  −
                </button>
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20 text-center"
                  min="1"
                  max={product.stock}
                />
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="px-4 py-2 border rounded hover:bg-gray-50"
                >
                  +
                </button>
              </div>
            </div>

            <Button
              onClick={handleAddToCart}
              disabled={product.stock === 0 || addToCart.isPending}
              size="lg"
              className="w-full"
            >
              {addToCart.isPending ? 'Adding...' : 'Add to Cart'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
