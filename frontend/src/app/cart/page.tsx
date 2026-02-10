'use client'

import { useCart, useRemoveFromCart, useUpdateCartItem, useCheckout } from '@/hooks/use-api'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import Image from 'next/image'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useState } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'

export default function CartPage() {
  const router = useRouter()
  const { data: cart, isLoading } = useCart()
  const removeFromCart = useRemoveFromCart()
  const updateCartItem = useUpdateCartItem()
  const checkout = useCheckout()
  const [isCheckingOut, setIsCheckingOut] = useState(false)

  const handleUpdateQuantity = async (itemId: string, quantity: number) => {
    if (quantity < 1) return
    try {
      await updateCartItem.mutateAsync({ id: itemId, quantity })
      toast.success('Cart updated')
    } catch {
      toast.error('Failed to update quantity')
    }
  }

  const handleRemoveItem = async (itemId: string) => {
    try {
      await removeFromCart.mutateAsync(itemId)
      toast.success('Removed from cart')
    } catch {
      toast.error('Failed to remove item')
    }
  }

  const handleCheckout = async () => {
    setIsCheckingOut(true)
    try {
      await checkout.mutateAsync()
      toast.success('Order placed successfully!')
      router.push('/orders')
    } catch (error) {
      toast.error('Failed to checkout')
    } finally {
      setIsCheckingOut(false)
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <Skeleton className="h-96 rounded-lg" />
      </div>
    )
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-6">Shopping Cart</h1>
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg mb-6">Your cart is empty</p>
          <Link href="/products">
            <Button>Continue Shopping</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <div className="space-y-4">
            {cart.items.map((item) => (
              <div key={item.id} className="bg-white rounded-lg border p-6 flex gap-4">
                {/* Product Image */}
                <div className="relative w-24 h-24 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.product.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      No image
                    </div>
                  )}
                </div>

                {/* Product Details */}
                <div className="flex-1">
                  <Link href={`/products/${item.product.slug}`} className="hover:text-blue-600">
                    <h3 className="font-semibold text-lg mb-2">{item.product.name}</h3>
                  </Link>

                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-gray-600 mb-4">
                        ${item.product.price.toFixed(2)} each
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                          className="px-2 py-1 border rounded hover:bg-gray-50"
                        >
                          −
                        </button>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) =>
                            handleUpdateQuantity(item.id, parseInt(e.target.value) || 1)
                          }
                          className="w-16 text-center"
                          min="1"
                        />
                        <button
                          onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                          className="px-2 py-1 border rounded hover:bg-gray-50"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-xl font-bold mb-4">
                        ${(item.product.price * item.quantity).toFixed(2)}
                      </p>
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cart Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border p-6 sticky top-20">
            <h2 className="text-xl font-bold mb-6">Order Summary</h2>

            <div className="space-y-4 mb-6 border-b pb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span>${cart.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tax (10%)</span>
                <span>${cart.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                <span>
                  {cart.shipping === 0 ? (
                    <span className="text-green-600 font-semibold">FREE</span>
                  ) : (
                    `$${cart.shipping.toFixed(2)}`
                  )}
                </span>
              </div>
            </div>

            <div className="flex justify-between text-lg font-bold mb-6">
              <span>Total</span>
              <span>${cart.total.toFixed(2)}</span>
            </div>

            <Button
              onClick={handleCheckout}
              disabled={isCheckingOut}
              size="lg"
              className="w-full"
            >
              {isCheckingOut ? 'Processing...' : 'Proceed to Checkout'}
            </Button>

            <Link href="/products">
              <Button variant="outline" size="lg" className="w-full mt-4">
                Continue Shopping
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
