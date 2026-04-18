'use client'

import { useCart, useRemoveFromCart, useUpdateCartItem } from '@/hooks/use-api'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/auth-store'
import { ArrowRight, Package2, ShieldCheck, ShoppingBag, Trash2 } from 'lucide-react'
import { resolveMediaUrl } from '@/lib/media-url'

export default function CartPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const { data: cart, isLoading } = useCart()
  const removeFromCart = useRemoveFromCart()
  const updateCartItem = useUpdateCartItem()
  const [isCheckingOut, setIsCheckingOut] = useState(false)

  // Redirect vendors away from shopping
  useEffect(() => {
    if (user?.role === 'VENDOR') {
      toast.error('Vendors cannot shop. Please use your vendor dashboard.')
      router.push('/vendor/dashboard')
    }
  }, [user, router])

  const handleUpdateQuantity = async (itemId: string | number, quantity: number) => {
    if (quantity < 1) return
    try {
      await updateCartItem.mutateAsync({ id: itemId, quantity })
      toast.success('Cart updated')
    } catch {
      toast.error('Failed to update quantity')
    }
  }

  const handleRemoveItem = async (itemId: string | number) => {
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
      router.push('/checkout')
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
        <div className="mb-8 rounded-3xl border bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 px-6 py-10 text-white shadow-2xl">
          <div className="max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
              <ShoppingBag className="h-3.5 w-3.5" />
              Shopping Cart
            </div>
            <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">Your cart is waiting for the first item.</h1>
            <p className="max-w-xl text-sm leading-6 text-white/75 md:text-base">
              Add products from the catalog, review quantities here, then move into checkout with a clear order summary.
            </p>
          </div>
        </div>

        <div className="rounded-3xl border bg-white p-10 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
            <Package2 className="h-7 w-7" />
          </div>
          <h2 className="text-2xl font-semibold">Your cart is empty</h2>
          <p className="mt-2 text-sm text-slate-600">Browse products and add items to continue.</p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/products">
              <Button className="min-w-40">Continue Shopping</Button>
            </Link>
            <Link href="/orders">
              <Button variant="outline" className="min-w-40">View Orders</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="mb-8 rounded-3xl border bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 px-6 py-10 text-white shadow-2xl">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
              <ShoppingBag className="h-3.5 w-3.5" />
              Shopping Cart
            </div>
            <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">Review your items before checkout.</h1>
            <p className="max-w-2xl text-sm leading-6 text-white/75 md:text-base">
              Update quantities, remove products, and confirm the final total in one place.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 md:min-w-[320px]">
            <div className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.2em] text-white/50">Items</p>
              <p className="mt-2 text-2xl font-semibold">{cart.items.length}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.2em] text-white/50">Subtotal</p>
              <p className="mt-2 text-2xl font-semibold">${cart.subtotal.toFixed(2)}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.2em] text-white/50">Total</p>
              <p className="mt-2 text-2xl font-semibold">${cart.total.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <div className="space-y-4">
            {cart.items.map((item) => (
              <div key={item.id} className="group rounded-3xl border bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
                <div className="flex gap-4">
                <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-2xl bg-slate-100 ring-1 ring-slate-200/80">
                  {item.imageUrl ? (
                    <img
                      src={resolveMediaUrl(item.imageUrl)}
                      alt={item.product?.name || item.productName || 'Cart product image'}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                      No image
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-1">
                      <Link href={`/products/${item.product?.slug || item.productSlug || ''}`} className="hover:text-slate-950">
                        <h3 className="text-lg font-semibold text-slate-950">{item.product?.name || item.productName || 'Product'}</h3>
                      </Link>
                      <p className="text-sm text-slate-500">
                        ${Number(item.product?.price ?? item.price ?? 0).toFixed(2)} each
                      </p>
                    </div>

                    <div className="text-left md:text-right">
                      <p className="text-xl font-bold text-slate-950">
                        ${Number(item.subtotal ?? (Number(item.product?.price ?? item.price ?? 0) * item.quantity)).toFixed(2)}
                      </p>
                      <p className="text-xs text-slate-500">Line total</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2 rounded-full border bg-slate-50 px-2 py-1">
                      <button
                        onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-transparent text-lg leading-none text-slate-700 transition hover:border-slate-200 hover:bg-white"
                      >
                        −
                      </button>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) =>
                          handleUpdateQuantity(item.id, parseInt(e.target.value) || 1)
                        }
                        className="h-9 w-18 border-0 bg-transparent text-center text-sm font-semibold shadow-none focus-visible:ring-0"
                        min="1"
                      />
                      <button
                        onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-transparent text-lg leading-none text-slate-700 transition hover:border-slate-200 hover:bg-white"
                      >
                        +
                      </button>
                    </div>

                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="inline-flex items-center gap-2 text-sm font-medium text-red-600 transition hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cart Summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-20 space-y-4 rounded-3xl border bg-white p-6 shadow-sm">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">Order Summary</h2>
              <p className="mt-1 text-sm text-slate-500">Secure checkout with a clear breakdown before payment.</p>
            </div>

            <div className="space-y-3 rounded-2xl bg-slate-50 p-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Subtotal</span>
                <span className="font-medium text-slate-950">${cart.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Tax (10%)</span>
                <span className="font-medium text-slate-950">${cart.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Shipping</span>
                <span className="font-medium text-slate-950">
                  {cart.shipping === 0 ? <span className="font-semibold text-emerald-600">FREE</span> : `$${cart.shipping.toFixed(2)}`}
                </span>
              </div>
            </div>

            <div className="flex justify-between border-t pt-4 text-lg font-semibold text-slate-950">
              <span>Total</span>
              <span>${cart.total.toFixed(2)}</span>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleCheckout}
                disabled={isCheckingOut}
                size="lg"
                className="w-full gap-2"
              >
                {isCheckingOut ? 'Processing...' : 'Proceed to Checkout'}
                {!isCheckingOut && <ArrowRight className="h-4 w-4" />}
              </Button>

              <Link href="/products">
                <Button variant="outline" size="lg" className="w-full">
                  Continue Shopping
                </Button>
              </Link>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <p>Secure payment flow, address review, and order confirmation are handled on the next step.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
