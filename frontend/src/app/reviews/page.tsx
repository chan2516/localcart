'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import Link from 'next/link'
import { apiClient } from '@/lib/api-client'
import { useAuthStore } from '@/lib/auth-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type Review = {
  id: number
  productId: number
  productName?: string
  rating: number
  title: string
  comment: string
  createdAt?: string
}

export default function ReviewsPage() {
  const { isAuthenticated } = useAuthStore()

  const [reviews, setReviews] = useState<Review[]>([])
  const [productId, setProductId] = useState('')
  const [rating, setRating] = useState('5')
  const [title, setTitle] = useState('')
  const [comment, setComment] = useState('')

  const loadMyReviews = async () => {
    try {
      const response = await apiClient.get<{ reviews: Review[] }>('/reviews/my?page=0&size=20')
      setReviews(response.reviews || [])
    } catch (error: any) {
      toast.error(error?.message || 'Failed to load your reviews')
    }
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const qp = new URLSearchParams(window.location.search)
      const qpProductId = qp.get('productId')
      if (qpProductId) setProductId(qpProductId)
    }

    if (!isAuthenticated) return
    loadMyReviews()
  }, [isAuthenticated])

  const submitReview = async () => {
    const parsedProductId = Number(productId)
    const parsedRating = Number(rating)
    const normalizedTitle = title.trim()
    const normalizedComment = comment.trim()

    if (!Number.isInteger(parsedProductId) || parsedProductId <= 0) {
      toast.error('Product ID must be a valid positive number')
      return
    }

    if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      toast.error('Rating must be between 1 and 5')
      return
    }

    if (normalizedTitle.length < 10 || normalizedTitle.length > 200) {
      toast.error('Title must be between 10 and 200 characters')
      return
    }

    if (normalizedComment.length < 20 || normalizedComment.length > 2000) {
      toast.error('Comment must be between 20 and 2000 characters')
      return
    }

    try {
      await apiClient.post('/reviews', {
        productId: parsedProductId,
        rating: parsedRating,
        title: normalizedTitle,
        comment: normalizedComment,
      })
      toast.success('Review submitted')
      setTitle('')
      setComment('')
      await loadMyReviews()
    } catch (error: any) {
      toast.error(error?.message || 'Failed to submit review')
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-6">
      <h1 className="text-3xl font-bold">My Reviews</h1>
      <p className="text-gray-600">Create and manage your product reviews.</p>

      <Card>
        <CardHeader>
          <CardTitle>Write a Review</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input placeholder="Product ID" value={productId} onChange={(e) => setProductId(e.target.value)} />
            <select className="h-10 rounded-md border px-3" value={rating} onChange={(e) => setRating(e.target.value)}>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
            <Input placeholder="Review title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <textarea className="w-full min-h-24 rounded-md border p-3" placeholder="Write your review comment" value={comment} onChange={(e) => setComment(e.target.value)} />
          <Button onClick={submitReview}>Submit Review</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Recent Reviews</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {reviews.length === 0 && <p className="text-gray-600">No reviews yet.</p>}
          {reviews.map((review) => (
            <div key={review.id} className="rounded-md border p-3">
              <p className="font-medium">{review.productName || `Product #${review.productId}`}</p>
              <p className="text-sm">Rating: {'★'.repeat(review.rating)}</p>
              <p className="text-sm font-medium">{review.title}</p>
              <p className="text-sm text-gray-600">{review.comment}</p>
            </div>
          ))}
          <div className="pt-2">
            <Link href="/products">
              <Button variant="outline">Browse Products</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
