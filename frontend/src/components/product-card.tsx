'use client'

import { Product } from '@/hooks/use-api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import Link from 'next/link'
import Image from 'next/image'
import { ShoppingCart } from 'lucide-react'
import { useAddToCart } from '@/hooks/use-api'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/auth-store'

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const { user } = useAuthStore()
  const addToCart = useAddToCart()

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!user) {
      toast.error('Please login to add items to cart')
      return
    }

    try {
      await addToCart.mutateAsync({
        productId: product.id,
        quantity: 1,
      })
      toast.success('Added to cart!')
    } catch {
      toast.error('Failed to add to cart')
    }
  }

  const hasDiscount = product.discountPrice && product.discountPrice < product.price
  const discountPercentage = hasDiscount
    ? Math.round(((product.price - product.discountPrice!) / product.price) * 100)
    : 0

  return (
    <Link href={`/products/${product.slug}`}>
      <Card className="h-full hover:shadow-lg transition-shadow overflow-hidden flex flex-col">
        <CardContent className="p-0">
          <div className="relative w-full aspect-square bg-gray-100 overflow-hidden">
            {product.imageUrls && product.imageUrls.length > 0 ? (
              <Image
                src={product.imageUrls[0]}
                alt={product.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                No image
              </div>
            )}

            {hasDiscount && (
              <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                {discountPercentage}% OFF
              </div>
            )}

            {product.stock === 0 && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="text-white font-bold">Out of Stock</span>
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex-1 flex flex-col justify-between p-4">
          <div>
            <h3 className="font-semibold text-sm line-clamp-2 mb-2">{product.name}</h3>

            <div className="flex items-center gap-2 mb-4">
              {hasDiscount ? (
                <>
                  <span className="text-lg font-bold text-blue-600">
                    ${product.discountPrice?.toFixed(2)}
                  </span>
                  <span className="text-sm text-gray-400 line-through">
                    ${product.price.toFixed(2)}
                  </span>
                </>
              ) : (
                <span className="text-lg font-bold">${product.price.toFixed(2)}</span>
              )}
            </div>
          </div>

          <Button
            onClick={handleAddToCart}
            disabled={product.stock === 0 || addToCart.isPending}
            variant={product.stock === 0 ? 'secondary' : 'default'}
            size="sm"
            className="w-full"
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Add to Cart
          </Button>
        </CardFooter>
      </Card>
    </Link>
  )
}
