'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/auth-store'
import { apiClient } from '@/lib/api-client'
import { useCart, useCheckout } from '@/hooks/use-api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { resolveMediaUrl } from '@/lib/media-url'
import { ArrowLeft, CheckCircle2, CreditCard, MapPin, Package, ShieldCheck, Sparkles } from 'lucide-react'

type Address = {
  id: number
  street: string
  city: string
  state: string
  country: string
  zipCode: string
  addressType: 'BILLING' | 'SHIPPING' | 'BOTH'
}

export default function CheckoutPage() {
  const router = useRouter()
  const { isAuthenticated, user } = useAuthStore()
  const { data: cart } = useCart()
  const checkout = useCheckout()

  const [addresses, setAddresses] = useState<Address[]>([])
  const [shippingAddressId, setShippingAddressId] = useState<number | null>(null)
  const [billingAddressId, setBillingAddressId] = useState<number | null>(null)
  const [paymentMethod, setPaymentMethod] = useState('CREDIT_CARD')

  const selectedShippingAddress = addresses.find((address) => address.id === shippingAddressId) || null
  const selectedBillingAddress = addresses.find((address) => address.id === billingAddressId) || null

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login')
      return
    }

    // Redirect vendors away from shopping
    if (user?.role === 'VENDOR') {
      toast.error('Vendors cannot shop. Please use your vendor dashboard.')
      router.push('/vendor/dashboard')
      return
    }

    const loadAddresses = async () => {
      try {
        const response = await apiClient.get<{ addresses: Address[] }>('/addresses')
        const list = response.addresses || []
        setAddresses(list)
        if (list.length > 0) {
          setShippingAddressId(list[0].id)
          setBillingAddressId(list[0].id)
        }
      } catch {
        toast.error('Please add an address before checkout')
      }
    }

    loadAddresses()
  }, [isAuthenticated, router])

  useEffect(() => {
    if (cart?.items?.length === 0) {
      toast.message('Your cart is empty')
      router.push('/cart')
    }
  }, [cart?.items?.length, router])

  const placeOrder = async () => {
    if (!shippingAddressId || !billingAddressId) {
      toast.error('Select shipping and billing addresses')
      return
    }

    try {
      await checkout.mutateAsync({
        shippingAddressId,
        billingAddressId,
        paymentMethod,
      })
      toast.success('Order placed successfully')
      router.push('/orders')
    } catch (error: any) {
      toast.error(error?.message || 'Checkout failed')
    }
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="rounded-3xl border bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 px-6 py-10 text-white shadow-2xl">
          <div className="max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
              <CreditCard className="h-3.5 w-3.5" />
              Checkout
            </div>
            <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">Prepare payment once items are in the cart.</h1>
            <p className="max-w-xl text-sm leading-6 text-white/75 md:text-base">
              Add products first, then return here to confirm addresses, payment method, and final totals.
            </p>
            <Link href="/products">
              <Button className="mt-2 gap-2">
                <ArrowLeft className="h-4 w-4" />
                Browse Products
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-8 rounded-3xl border bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 px-6 py-10 text-white shadow-2xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Final step
            </div>
            <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">Confirm addresses and place your order.</h1>
            <p className="max-w-2xl text-sm leading-6 text-white/75 md:text-base">
              Review shipping, billing, and payment details before submitting the order.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[360px]">
            <div className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.2em] text-white/50">Subtotal</p>
              <p className="mt-2 text-2xl font-semibold">${cart.subtotal.toFixed(2)}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.2em] text-white/50">Shipping</p>
              <p className="mt-2 text-2xl font-semibold">${cart.shipping.toFixed(2)}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.2em] text-white/50">Total</p>
              <p className="mt-2 text-2xl font-semibold">${cart.total.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          <Card className="overflow-hidden rounded-3xl border-slate-200/80 shadow-sm">
            <CardHeader className="border-b bg-slate-50/80">
              <CardTitle className="flex items-center gap-2 text-xl">
                <MapPin className="h-5 w-5 text-slate-700" />
                Delivery details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-700">Shipping Address</p>
                  <select
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-slate-400"
                    value={shippingAddressId ?? ''}
                    onChange={(e) => setShippingAddressId(Number(e.target.value))}
                  >
                    <option value="">Select shipping address</option>
                    {addresses.map((address) => (
                      <option key={address.id} value={address.id}>
                        {address.street}, {address.city}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-700">Billing Address</p>
                  <select
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-slate-400"
                    value={billingAddressId ?? ''}
                    onChange={(e) => setBillingAddressId(Number(e.target.value))}
                  >
                    <option value="">Select billing address</option>
                    {addresses.map((address) => (
                      <option key={address.id} value={address.id}>
                        {address.street}, {address.city}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Selected shipping</p>
                  <p className="mt-2 text-sm font-medium text-slate-950">
                    {selectedShippingAddress ? `${selectedShippingAddress.street}, ${selectedShippingAddress.city}` : 'No shipping address selected'}
                  </p>
                </div>
                <div className="rounded-2xl border bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Selected billing</p>
                  <p className="mt-2 text-sm font-medium text-slate-950">
                    {selectedBillingAddress ? `${selectedBillingAddress.street}, ${selectedBillingAddress.city}` : 'No billing address selected'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-3xl border-slate-200/80 shadow-sm">
            <CardHeader className="border-b bg-slate-50/80">
              <CardTitle className="flex items-center gap-2 text-xl">
                <CreditCard className="h-5 w-5 text-slate-700" />
                Payment method
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              <select
                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-slate-400"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="CREDIT_CARD">Credit Card</option>
                <option value="DEBIT_CARD">Debit Card</option>
                <option value="UPI">UPI</option>
                <option value="NET_BANKING">Net Banking</option>
                <option value="WALLET">Wallet</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
              </select>

              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <p>Secure checkout. We only use the selected addresses and payment method to create the order.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="overflow-hidden rounded-3xl border-slate-200/80 shadow-sm">
            <CardHeader className="border-b bg-slate-50/80">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Package className="h-5 w-5 text-slate-700" />
                Order summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              <div className="space-y-3">
                {cart.items.slice(0, 4).map((item) => (
                  <div key={item.id} className="flex items-center gap-3 rounded-2xl border bg-slate-50 p-3">
                    <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl bg-slate-200">
                      {item.imageUrl ? (
                        <img
                          src={resolveMediaUrl(item.imageUrl)}
                          alt={item.product?.name || item.productName || 'Product image'}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[10px] text-slate-400">No image</div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-950">{item.product?.name || item.productName || 'Product'}</p>
                      <p className="text-xs text-slate-500">Qty {item.quantity}</p>
                    </div>
                    <p className="text-sm font-semibold text-slate-950">${Number(item.subtotal ?? 0).toFixed(2)}</p>
                  </div>
                ))}
              </div>

              {cart.items.length > 4 && (
                <p className="text-xs text-slate-500">+ {cart.items.length - 4} more item(s)</p>
              )}

              <div className="space-y-3 rounded-2xl bg-slate-50 p-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Subtotal</span>
                  <span className="font-medium text-slate-950">${cart.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Tax</span>
                  <span className="font-medium text-slate-950">${cart.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Shipping</span>
                  <span className="font-medium text-slate-950">${cart.shipping.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t pt-3 text-base font-semibold">
                  <span>Total</span>
                  <span>${cart.total.toFixed(2)}</span>
                </div>
              </div>

              <Button className="w-full gap-2" onClick={placeOrder} disabled={checkout.isPending}>
                {checkout.isPending ? 'Placing order...' : 'Place Order'}
                {!checkout.isPending && <CheckCircle2 className="h-4 w-4" />}
              </Button>

              <Link href="/cart">
                <Button variant="outline" className="w-full">
                  Back to Cart
                </Button>
              </Link>
            </CardContent>
          </Card>

          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Sparkles className="h-4 w-4" />
              What happens next
            </div>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              <li>1. We validate the selected addresses.</li>
              <li>2. Your order is created with the chosen payment method.</li>
              <li>3. You are redirected to your orders page after success.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
