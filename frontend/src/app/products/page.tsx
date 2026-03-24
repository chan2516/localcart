'use client'

import { ProductCard } from '@/components/product-card'
import { useProducts, useCategories, useSearchProducts } from '@/hooks/use-api'
import { Input } from '@/components/ui/input'
import { useEffect, useMemo, useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { apiClient } from '@/lib/api-client'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type Address = {
  id: number
  zipCode: string
  addressType: 'BILLING' | 'SHIPPING' | 'BOTH'
}

export default function ProductsPage() {
  const [page, setPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [zipCode, setZipCode] = useState('')
  const [savedZipCodes, setSavedZipCodes] = useState<string[]>([])

  useEffect(() => {
    const loadUserZipCodes = async () => {
      try {
        const response = await apiClient.get<{ addresses?: Address[] }>('/addresses')
        const uniqueZipCodes = Array.from(
          new Set((response.addresses || []).map((a) => a.zipCode?.trim()).filter(Boolean))
        ) as string[]

        setSavedZipCodes(uniqueZipCodes)
        if (!zipCode && uniqueZipCodes.length > 0) {
          setZipCode(uniqueZipCodes[0])
        }
      } catch {
        // Products page also works for guests or users without saved addresses.
      }
    }

    loadUserZipCodes()
  }, [])

  const { data: productsData, isLoading } = useSearchQuery(
    searchQuery,
    selectedCategory === 'all' ? undefined : selectedCategory,
    zipCode,
    page
  )
  const { data: categories } = useCategories()

  const locationLabel = useMemo(() => {
    if (!zipCode.trim()) return 'All serviceable areas'
    return `Near ${zipCode.trim()}`
  }, [zipCode])

  return (
    <div className="min-h-screen bg-[#eaeded]">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="rounded-xl bg-gradient-to-r from-[#131921] via-[#232f3e] to-[#37475a] text-white px-6 py-8 mb-6">
          <p className="text-sm uppercase tracking-wide text-[#ffcc80]">LocalCart Marketplace</p>
          <h1 className="text-3xl md:text-4xl font-bold mt-1">Shop Nearby Stores</h1>
          <p className="text-sm md:text-base text-slate-200 mt-2">
            Discover products from vendors close to your saved pincode and get faster local delivery.
          </p>
          <p className="text-sm mt-3 text-[#ffcc80]">Showing: {locationLabel}</p>
        </div>

        <div className="bg-white p-5 rounded-lg shadow-sm mb-8 grid grid-cols-1 md:grid-cols-3 gap-4 border border-slate-100">
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
            <Select
              value={selectedCategory}
              onValueChange={(value) => {
                setSelectedCategory(value)
                setPage(1)
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories?.map((cat) => (
                  <SelectItem key={cat.id} value={String(cat.id)}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Delivery Pincode</label>
            <Input
              placeholder="Enter pincode"
              value={zipCode}
              onChange={(e) => {
                setZipCode(e.target.value)
                setPage(1)
              }}
            />
            {savedZipCodes.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {savedZipCodes.map((savedZip) => (
                  <button
                    key={savedZip}
                    className={`text-xs px-2 py-1 rounded border ${zipCode === savedZip ? 'bg-[#febd69] border-[#febd69] text-[#111]' : 'bg-slate-50 border-slate-200 text-slate-700'}`}
                    onClick={() => {
                      setZipCode(savedZip)
                      setPage(1)
                    }}
                    type="button"
                  >
                    {savedZip}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(12)].map((_, i) => (
              <Skeleton key={i} className="h-72 rounded-lg" />
            ))}
          </div>
        ) : (
          <>
            {productsData?.content && productsData.content.length > 0 ? (
              <>
                <p className="text-sm text-slate-600 mb-4">
                  {productsData.totalElements} product(s) found {zipCode.trim() ? `for pincode ${zipCode.trim()}` : ''}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {productsData.content.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-14 bg-white rounded-lg border border-slate-200">
                <p className="text-slate-700 text-lg font-medium">No nearby products found</p>
                <p className="text-slate-500 mt-2">Try another pincode or remove category/search filters.</p>
              </div>
            )}

            {productsData && productsData.totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-10">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border rounded disabled:opacity-50 bg-white"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-sm text-slate-700">
                  Page {page} of {productsData.totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(productsData.totalPages, page + 1))}
                  disabled={page === productsData.totalPages}
                  className="px-4 py-2 border rounded disabled:opacity-50 bg-white"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// Helper function for search query
function useSearchQuery(query: string, category: string | undefined, zipCode: string, page: number) {
  const { data: searchResults, isLoading: searchLoading } = useSearchProducts(query, category, zipCode, page)
  const { data: allProducts, isLoading: allLoading } = useProducts(page)

  if (query || category || zipCode.trim()) {
    return {
      data: searchResults,
      isLoading: searchLoading,
    }
  }

  return { data: allProducts, isLoading: allLoading }
}
