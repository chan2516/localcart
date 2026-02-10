import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'

// Types
export interface Product {
  id: string
  name: string
  slug: string
  description: string
  price: number
  discountPrice?: number
  stock: number
  categoryId: string
  vendorId: string
  featured: boolean
  status: string
  imageUrls?: string[]
  createdAt: string
  updatedAt: string
}

export interface Category {
  id: string
  name: string
  slug: string
  description?: string
  parentId?: string
}

export interface CartItem {
  id: string
  productId: string
  quantity: number
  product: Product
  imageUrl?: string
}

export interface Cart {
  id: string
  items: CartItem[]
  subtotal: number
  tax: number
  shipping: number
  total: number
}

export interface Order {
  id: string
  orderNumber: string
  userId: string
  items: CartItem[]
  subtotal: number
  tax: number
  shipping: number
  total: number
  status: string
  createdAt: string
}

// Product Hooks
export const useProducts = (page = 1, limit = 12) => {
  return useQuery({
    queryKey: ['products', page, limit],
    queryFn: () =>
      apiClient.get<{ content: Product[]; totalElements: number; totalPages: number }>(
        `/products?page=${page - 1}&limit=${limit}`
      ),
  })
}

export const useProductById = (id: string) => {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => apiClient.get<Product>(`/products/${id}`),
    enabled: !!id,
  })
}

export const useProductBySlug = (slug: string) => {
  return useQuery({
    queryKey: ['product', slug],
    queryFn: () => apiClient.get<Product>(`/products/slug/${slug}`),
    enabled: !!slug,
  })
}

export const useSearchProducts = (query: string, category?: string) => {
  return useQuery({
    queryKey: ['products-search', query, category],
    queryFn: () => {
      const params = new URLSearchParams()
      if (query) params.append('q', query)
      if (category) params.append('category', category)
      return apiClient.get<Product[]>(`/products/search?${params.toString()}`)
    },
    enabled: !!query,
  })
}

// Category Hooks
export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => apiClient.get<Category[]>('/categories'),
  })
}

export const useCategoryById = (id: string) => {
  return useQuery({
    queryKey: ['category', id],
    queryFn: () => apiClient.get<Category>(`/categories/${id}`),
    enabled: !!id,
  })
}

// Cart Hooks
export const useCart = () => {
  return useQuery({
    queryKey: ['cart'],
    queryFn: () => apiClient.get<Cart>('/cart'),
  })
}

export const useAddToCart = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { productId: string; quantity: number }) =>
      apiClient.post('/cart/add-item', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] })
    },
  })
}

export const useUpdateCartItem = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { id: string; quantity: number }) =>
      apiClient.put(`/cart/items/${data.id}`, { quantity: data.quantity }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] })
    },
  })
}

export const useRemoveFromCart = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/cart/items/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] })
    },
  })
}

export const useClearCart = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => apiClient.delete('/cart'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] })
    },
  })
}

// Order Hooks
export const useOrders = (page = 1, limit = 10) => {
  return useQuery({
    queryKey: ['orders', page, limit],
    queryFn: () =>
      apiClient.get<{ content: Order[]; totalElements: number; totalPages: number }>(
        `/orders?page=${page - 1}&limit=${limit}`
      ),
  })
}

export const useOrderById = (id: string) => {
  return useQuery({
    queryKey: ['order', id],
    queryFn: () => apiClient.get<Order>(`/orders/${id}`),
    enabled: !!id,
  })
}

export const useCheckout = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => apiClient.post('/cart/checkout'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}

export const useCancelOrder = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { id: string; reason: string }) =>
      apiClient.post(`/orders/${data.id}/cancel`, { reason: data.reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}
