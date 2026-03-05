'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { apiClient } from '@/lib/api-client'

type TrackInfo = {
  status: string
  trackingNumber?: string
  shippedAt?: string
  deliveredAt?: string
}

export default function OrderTrackPage() {
  const params = useParams()
  const id = params.id as string
  const [tracking, setTracking] = useState<TrackInfo | null>(null)

  useEffect(() => {
    const loadTracking = async () => {
      try {
        const response = await apiClient.get<TrackInfo>(`/orders/${id}/track`)
        setTracking(response)
      } catch {
        setTracking(null)
      }
    }

    loadTracking()
  }, [id])

  if (!tracking) {
    return <div className="max-w-6xl mx-auto px-4 py-10">Unable to fetch tracking details.</div>
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-2">
      <h1 className="text-3xl font-bold">Track Order</h1>
      <p>Status: {tracking.status}</p>
      <p>Tracking Number: {tracking.trackingNumber || 'Not assigned yet'}</p>
      <p>Shipped At: {tracking.shippedAt || 'Pending'}</p>
      <p>Delivered At: {tracking.deliveredAt || 'Pending'}</p>
    </div>
  )
}
