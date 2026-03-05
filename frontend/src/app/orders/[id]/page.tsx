'use client'

import { useParams } from 'next/navigation'
import { useOrderById } from '@/hooks/use-api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function OrderDetailsPage() {
  const params = useParams()
  const id = params.id as string
  const { data: order, isLoading } = useOrderById(id)

  if (isLoading) {
    return <div className="max-w-6xl mx-auto px-4 py-10">Loading order...</div>
  }

  if (!order) {
    return <div className="max-w-6xl mx-auto px-4 py-10">Order not found.</div>
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>Order {order.orderNumber}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p>Status: {order.status}</p>
          <p>Total: ${order.total.toFixed(2)}</p>
          <p>Items: {order.items?.length || 0}</p>
        </CardContent>
      </Card>
    </div>
  )
}
