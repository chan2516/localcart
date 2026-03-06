import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'

// Types
export interface Product {
  id: string | number
  name: string
  slug: string
  description: string
  price: number
  discountPrice?: number
  stock: number
  categoryId: string | number
  vendorId: string | number
  isFeatured?: boolean
  isActive?: boolean
  imageUrls?: string[]
  createdAt: string
  updatedAt: string
}

export interface Category {
  id: string | number
  name: string
  slug: string
  description?: string
  parentId?: string | number
}

export interface CartItem {
  id: string | number
  productId: string | number
  quantity: number
  product?: Product
  productName?: string
  productSlug?: string
  price?: number
  discountPrice?: number
  subtotal?: number
  imageUrl?: string
}

export interface Cart {
  id?: string
  cartId?: string
  items: CartItem[]
  subtotal: number
  tax: number
  shipping: number
  shippingFee?: number
  total: number
}

export interface Order {
  id: string | number
  orderNumber: string
  userId: string | number
  items: CartItem[]
  subtotal: number
  tax: number
  shipping: number
  shippingFee?: number
  total: number
  status: string
  createdAt: string
}

// Product Hooks
export const useProducts = (page = 1, limit = 12) => {
  return useQuery({
    queryKey: ['products', page, limit],
    queryFn: async () => {
      const response = await apiClient.get<{
        products: Product[]
        totalItems: number
        totalPages: number
      }>(`/products?page=${page - 1}&size=${limit}`)

      return {
        content: response.products || [],
        totalElements: response.totalItems || 0,
        totalPages: response.totalPages || 0,
      }
    },
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

export const useSearchProducts = (query: string, category?: string, page = 1, limit = 20) => {
  return useQuery({
    queryKey: ['products-search', query, category, page, limit],
    queryFn: async () => {
      const normalizedQuery = query.trim()
      const params = new URLSearchParams()
      if (normalizedQuery) params.append('q', normalizedQuery)

      if (category) {
        const categoryId = Number(category)
        if (Number.isFinite(categoryId) && categoryId > 0) {
          params.append('category', String(categoryId))
        }
      }

      params.append('page', String(Math.max(0, page - 1)))
      params.append('size', String(limit))

      const response = await apiClient.get<{
        products: Product[]
        totalItems: number
        totalPages: number
      }>(
        `/products/search?${params.toString()}`
      )

      return {
        content: response.products || [],
        totalElements: response.totalItems || 0,
        totalPages: response.totalPages || 0,
      }
    },
    enabled: !!query.trim() || !!category,
  })
}

// Category Hooks
export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await apiClient.get<{ categories?: Category[] } | Category[]>('/categories')
      if (Array.isArray(response)) {
        return response
      }
      return response.categories || []
    },
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
    queryFn: async () => {
      const cart = await apiClient.get<Cart>('/cart')

      const normalizedItems = (cart.items || []).map((item) => {
        if (item.product) return item

        return {
          ...item,
          product: {
            id: item.productId,
            name: item.productName || 'Product',
            slug: item.productSlug || String(item.productId || ''),
            description: '',
            price: Number(item.price || 0),
            discountPrice: item.discountPrice != null ? Number(item.discountPrice) : undefined,
            stock: 0,
            categoryId: '',
            vendorId: '',
            imageUrls: item.imageUrl ? [item.imageUrl] : [],
            createdAt: '',
            updatedAt: '',
          },
        }
      })

      return {
        ...cart,
        items: normalizedItems,
        shipping: cart.shipping ?? cart.shippingFee ?? 0,
      }
    },
  })
}

export const useAddToCart = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { productId: string | number; quantity: number }) =>
      apiClient.post('/cart/add-item', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] })
    },
  })
}

export const useUpdateCartItem = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { id: string | number; quantity: number }) =>
      apiClient.put(`/cart/items/${data.id}?quantity=${data.quantity}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] })
    },
  })
}

export const useRemoveFromCart = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string | number) => apiClient.delete(`/cart/items/${id}`),
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
    queryFn: async () => {
      const response = await apiClient.get<{
        orders: Order[]
        totalItems: number
        totalPages: number
      }>(`/orders?page=${page - 1}&size=${limit}`)

      const normalizedOrders = (response.orders || []).map((order) => ({
        ...order,
        shipping: order.shipping ?? order.shippingFee ?? 0,
      }))

      return {
        content: normalizedOrders,
        totalElements: response.totalItems || 0,
        totalPages: response.totalPages || 0,
      }
    },
  })
}

export const useOrderById = (id: string) => {
  return useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      const order = await apiClient.get<Order>(`/orders/${id}`)
      return {
        ...order,
        shipping: order.shipping ?? order.shippingFee ?? 0,
      }
    },
    enabled: !!id,
  })
}

export const useCheckout = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: {
      shippingAddressId: number
      billingAddressId: number
      paymentMethod: string
      couponCode?: string
      notes?: string
      deliveryPreference?: string
    }) => apiClient.post('/cart/checkout', payload),
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
      apiClient.post(
        `/orders/${data.id}/cancel${data.reason ? `?reason=${encodeURIComponent(data.reason)}` : ''}`
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}
