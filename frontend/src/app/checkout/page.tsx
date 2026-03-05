'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/auth-store'
import { apiClient } from '@/lib/api-client'
import { useCart, useCheckout } from '@/hooks/use-api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

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
  const { isAuthenticated } = useAuthStore()
  const { data: cart } = useCart()
  const checkout = useCheckout()

  const [addresses, setAddresses] = useState<Address[]>([])
  const [shippingAddressId, setShippingAddressId] = useState<number | null>(null)
  const [billingAddressId, setBillingAddressId] = useState<number | null>(null)
  const [paymentMethod, setPaymentMethod] = useState('COD')

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login')
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

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-6">
      <h1 className="text-3xl font-bold">Checkout</h1>

      <Card>
        <CardHeader>
          <CardTitle>Address Selection</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm mb-2">Shipping Address</p>
            <select
              className="h-10 rounded-md border px-3 w-full"
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
          <div>
            <p className="text-sm mb-2">Billing Address</p>
            <select
              className="h-10 rounded-md border px-3 w-full"
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

          <div className="md:col-span-2">
            <p className="text-sm mb-2">Payment Method</p>
            <select
              className="h-10 rounded-md border px-3 w-full"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <option value="COD">Cash on Delivery</option>
              <option value="CREDIT_CARD">Credit Card</option>
              <option value="DEBIT_CARD">Debit Card</option>
              <option value="UPI">UPI</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Order Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between"><span>Subtotal</span><span>${cart?.subtotal?.toFixed(2) || '0.00'}</span></div>
          <div className="flex justify-between"><span>Tax</span><span>${cart?.tax?.toFixed(2) || '0.00'}</span></div>
          <div className="flex justify-between"><span>Shipping</span><span>${cart?.shipping?.toFixed(2) || '0.00'}</span></div>
          <div className="flex justify-between font-bold text-lg"><span>Total</span><span>${cart?.total?.toFixed(2) || '0.00'}</span></div>
          <Button className="w-full" onClick={placeOrder} disabled={checkout.isPending}>
            {checkout.isPending ? 'Placing order...' : 'Place Order'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
