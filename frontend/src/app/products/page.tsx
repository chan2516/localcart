'use client'

import { ProductCard } from '@/components/product-card'
import { useProducts, useCategories, useSearchProducts } from '@/hooks/use-api'
import { Input } from '@/components/ui/input'
import { useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function ProductsPage() {
  const [page, setPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')

  const { data: productsData, isLoading } = useSearchQuery(searchQuery, selectedCategory, page)
  const { data: categories } = useCategories()

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold mb-2">Products</h1>
        <p className="text-gray-600">Browse our complete product catalog</p>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Search</label>
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setPage(1)
            }}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Category</label>
          <Select value={selectedCategory} onValueChange={(value) => {
            setSelectedCategory(value)
            setPage(1)
          }}>
            <SelectTrigger>
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Categories</SelectItem>
              {categories?.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Products Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(12)].map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-lg" />
          ))}
        </div>
      ) : (
        <>
          {productsData?.content && productsData.content.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {productsData.content.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No products found</p>
            </div>
          )}

          {/* Pagination */}
          {productsData && productsData.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-12">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-4 py-2 border rounded disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-4 py-2">
                Page {page} of {productsData.totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(productsData.totalPages, page + 1))}
                disabled={page === productsData.totalPages}
                className="px-4 py-2 border rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// Helper function for search query
function useSearchQuery(query: string, category: string, page: number) {
  const { data: searchResults, isLoading: searchLoading } = useSearchProducts(query, category)
  const { data: allProducts, isLoading: allLoading } = useProducts(page)

  if (query) {
    return {
      data: {
        content: searchResults || [],
        totalElements: (searchResults || []).length,
        totalPages: 1,
      },
      isLoading: searchLoading,
    }
  }

  return { data: allProducts, isLoading: allLoading }
}
