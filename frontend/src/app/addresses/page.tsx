'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/auth-store'
import { apiClient } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type Address = {
  id: number
  street: string
  apartment?: string
  city: string
  state: string
  country: string
  zipCode: string
  addressType: 'BILLING' | 'SHIPPING' | 'BOTH'
}

const initialForm = {
  street: '',
  apartment: '',
  city: '',
  state: '',
  country: '',
  zipCode: '',
  addressType: 'BOTH' as 'BILLING' | 'SHIPPING' | 'BOTH',
}

export default function AddressesPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const [addresses, setAddresses] = useState<Address[]>([])
  const [form, setForm] = useState(initialForm)

  const loadAddresses = async () => {
    try {
      const response = await apiClient.get<{ addresses: Address[] }>('/addresses')
      setAddresses(response.addresses || [])
    } catch (error: any) {
      toast.error(error?.message || 'Failed to load addresses')
    }
  }

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login')
      return
    }
    loadAddresses()
  }, [isAuthenticated, router])

  const createAddress = async () => {
    if (!form.street || !form.city || !form.state || !form.country || !form.zipCode) {
      toast.error('Please complete all required fields')
      return
    }

    try {
      await apiClient.post('/addresses', form)
      toast.success('Address added')
      setForm(initialForm)
      await loadAddresses()
    } catch (error: any) {
      toast.error(error?.message || 'Failed to add address')
    }
  }

  const deleteAddress = async (id: number) => {
    try {
      await apiClient.delete(`/addresses/${id}`)
      toast.success('Address deleted')
      await loadAddresses()
    } catch (error: any) {
      toast.error(error?.message || 'Failed to delete address')
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-6">
      <h1 className="text-3xl font-bold">My Addresses</h1>

      <Card>
        <CardHeader>
          <CardTitle>Add New Address</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input placeholder="Street" value={form.street} onChange={(e) => setForm((p) => ({ ...p, street: e.target.value }))} />
            <Input placeholder="Apartment" value={form.apartment} onChange={(e) => setForm((p) => ({ ...p, apartment: e.target.value }))} />
            <Input placeholder="City" value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} />
            <Input placeholder="State" value={form.state} onChange={(e) => setForm((p) => ({ ...p, state: e.target.value }))} />
            <Input placeholder="Country" value={form.country} onChange={(e) => setForm((p) => ({ ...p, country: e.target.value }))} />
            <Input placeholder="ZIP Code" value={form.zipCode} onChange={(e) => setForm((p) => ({ ...p, zipCode: e.target.value }))} />
          </div>
          <select className="h-10 rounded-md border px-3" value={form.addressType} onChange={(e) => setForm((p) => ({ ...p, addressType: e.target.value as 'BILLING' | 'SHIPPING' | 'BOTH' }))}>
            <option value="BILLING">Billing</option>
            <option value="SHIPPING">Shipping</option>
            <option value="BOTH">Both</option>
          </select>
          <Button onClick={createAddress}>Save Address</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Saved Addresses</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {addresses.length === 0 && <p className="text-gray-600">No address saved yet.</p>}
          {addresses.map((address) => (
            <div key={address.id} className="rounded-md border p-3 flex items-center justify-between gap-3">
              <div>
                <p className="font-medium">{address.street}, {address.city}</p>
                <p className="text-sm text-gray-600">{address.state}, {address.country} - {address.zipCode} ({address.addressType})</p>
              </div>
              <Button variant="destructive" onClick={() => deleteAddress(address.id)}>Delete</Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
