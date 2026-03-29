'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/auth-store'
import { apiClient } from '@/lib/api-client'
import { useCategories, useProducts, Product } from '@/hooks/use-api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AccountPanel } from '@/components/account-panel'

type ProductForm = {
  id?: string | number
  name: string
  slug: string
  description: string
  price: string
  discountPrice: string
  stock: string
  categoryId: string
}

type VendorProfile = {
  id: number
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED'
  isDeleted?: boolean
  rejectionReason?: string
  businessName?: string
}

type VendorInsights = {
  totalSales?: number
  totalOrders?: number
  pendingPayout?: number
  totalProducts?: number
  activeProducts?: number
  averageRating?: number
  totalReviews?: number
}

const initialProductForm: ProductForm = {
  name: '',
  slug: '',
  description: '',
  price: '',
  discountPrice: '',
  stock: '0',
  categoryId: '',
}

export default function VendorDashboardPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()
  const { data: productsData, refetch: refetchProducts } = useProducts(1, 200)
  const { data: categories } = useCategories()

  const [savingProduct, setSavingProduct] = useState(false)
  const [editingProductId, setEditingProductId] = useState<string | number | null>(null)
  const [productForm, setProductForm] = useState<ProductForm>(initialProductForm)
  const [vendorProfile, setVendorProfile] = useState<VendorProfile | null>(null)
  const [vendorInsights, setVendorInsights] = useState<VendorInsights | null>(null)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/vendor/login')
      return
    }

    if (user && user.role !== 'VENDOR') {
      toast.error('Vendor access is required')
      router.push('/')
      return
    }

    const loadVendorData = async () => {
      try {
        const [vendorRes, dashboardRes] = await Promise.all([
          apiClient.get<VendorProfile>('/vendors/me'),
          apiClient.get<VendorInsights>('/vendors/me/dashboard'),
        ])
        setVendorProfile(vendorRes)
        setVendorInsights(dashboardRes)
      } catch (error: any) {
        toast.error(error?.message || 'Failed to load vendor data')
      }
    }

    loadVendorData()
  }, [isAuthenticated, user, router])

  const myProducts = useMemo(() => {
    const allProducts = productsData?.content || []
    if (!user?.vendorId) return allProducts
    return allProducts.filter((product) => String(product.vendorId) === String(user.vendorId))
  }, [productsData, user?.vendorId])

  const canManageCatalog = (vendorProfile?.status || user?.vendorStatus) === 'APPROVED' && !vendorProfile?.isDeleted

  const resetProductForm = () => {
    setProductForm(initialProductForm)
    setEditingProductId(null)
  }

  const handleEditProduct = (product: Product) => {
    setEditingProductId(product.id)
    setProductForm({
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description || '',
      price: String(product.price),
      discountPrice: product.discountPrice ? String(product.discountPrice) : '',
      stock: String(product.stock),
      categoryId: String(product.categoryId || ''),
    })
  }

  const handleSaveProduct = async () => {
    if (!canManageCatalog) {
      toast.error('Your vendor account is not approved yet')
      return
    }

    if (!productForm.name || !productForm.slug || !productForm.price || !productForm.categoryId) {
      toast.error('Name, slug, price, and category are required')
      return
    }

    setSavingProduct(true)
    try {
      const payload = {
        name: productForm.name.trim(),
        slug: productForm.slug.trim().toLowerCase(),
        description: productForm.description.trim(),
        price: Number(productForm.price),
        discountPrice: productForm.discountPrice ? Number(productForm.discountPrice) : undefined,
        stock: Number(productForm.stock),
        categoryId: Number(productForm.categoryId),
        isActive: true,
        isFeatured: false,
      }

      if (editingProductId) {
        await apiClient.put(`/products/${editingProductId}`, payload)
        toast.success('Product updated')
      } else {
        await apiClient.post('/products', payload)
        toast.success('Product created')
      }

      await refetchProducts()
      resetProductForm()
    } catch (error: any) {
      toast.error(error?.message || 'Failed to save product')
    } finally {
      setSavingProduct(false)
    }
  }

  const handleDeleteProduct = async (productId: string | number) => {
    if (!canManageCatalog) {
      toast.error('Your vendor account is not approved yet')
      return
    }

    try {
      await apiClient.delete(`/products/${productId}`)
      toast.success('Product deleted')
      await refetchProducts()
    } catch (error: any) {
      toast.error(error?.message || 'Failed to delete product')
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Vendor Dashboard</h1>
        <p className="text-gray-600">Manage your products and track your business insights.</p>
        <div className="mt-3">
          <Link href="/vendor/verification">
            <Button variant="outline">View Verification Status</Button>
          </Link>
        </div>
      </div>

      {user && <AccountPanel user={user} />}

      {!canManageCatalog && (
        <Card className="border-amber-300 bg-amber-50">
          <CardHeader>
            <CardTitle>Verification In Progress</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-amber-900">
            <p>
              Vendor status: <span className="font-semibold">{vendorProfile?.status || user?.vendorStatus || 'PENDING'}</span>
            </p>
            <p className="mt-1">
              Product management is locked until admin verification is complete.
            </p>
            {vendorProfile?.rejectionReason ? (
              <p className="mt-1">Reason: {vendorProfile.rejectionReason}</p>
            ) : null}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardHeader><CardTitle>Total Sales</CardTitle></CardHeader><CardContent>${Number(vendorInsights?.totalSales || 0).toFixed(2)}</CardContent></Card>
        <Card><CardHeader><CardTitle>Total Orders</CardTitle></CardHeader><CardContent>{vendorInsights?.totalOrders ?? 0}</CardContent></Card>
        <Card><CardHeader><CardTitle>Pending Payout</CardTitle></CardHeader><CardContent>${Number(vendorInsights?.pendingPayout || 0).toFixed(2)}</CardContent></Card>
        <Card><CardHeader><CardTitle>Total Products</CardTitle></CardHeader><CardContent>{vendorInsights?.totalProducts ?? myProducts.length}</CardContent></Card>
        <Card><CardHeader><CardTitle>Active Products</CardTitle></CardHeader><CardContent>{vendorInsights?.activeProducts ?? myProducts.length}</CardContent></Card>
        <Card><CardHeader><CardTitle>Average Rating</CardTitle></CardHeader><CardContent>{Number(vendorInsights?.averageRating || 0).toFixed(1)} ({vendorInsights?.totalReviews ?? 0} reviews)</CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{editingProductId ? 'Edit Product' : 'Add Product'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input placeholder="Product name" value={productForm.name} onChange={(e) => setProductForm((prev) => ({ ...prev, name: e.target.value }))} />
            <Input placeholder="product-slug" value={productForm.slug} onChange={(e) => setProductForm((prev) => ({ ...prev, slug: e.target.value }))} />
            <Input placeholder="Price" type="number" min="0" value={productForm.price} onChange={(e) => setProductForm((prev) => ({ ...prev, price: e.target.value }))} />
            <Input placeholder="Discount price" type="number" min="0" value={productForm.discountPrice} onChange={(e) => setProductForm((prev) => ({ ...prev, discountPrice: e.target.value }))} />
            <Input placeholder="Stock" type="number" min="0" value={productForm.stock} onChange={(e) => setProductForm((prev) => ({ ...prev, stock: e.target.value }))} />
            <select className="h-10 rounded-md border px-3" value={productForm.categoryId} onChange={(e) => setProductForm((prev) => ({ ...prev, categoryId: e.target.value }))}>
              <option value="">Select category</option>
              {(categories || []).map((category) => (
                <option key={category.id} value={String(category.id)}>{category.name}</option>
              ))}
            </select>
          </div>
          <textarea className="w-full min-h-24 rounded-md border p-3" placeholder="Description" value={productForm.description} onChange={(e) => setProductForm((prev) => ({ ...prev, description: e.target.value }))} />
          <div className="flex gap-2">
            <Button onClick={handleSaveProduct} disabled={savingProduct || !canManageCatalog}>{savingProduct ? 'Saving...' : editingProductId ? 'Update Product' : 'Create Product'}</Button>
            {editingProductId && <Button variant="outline" onClick={resetProductForm}>Cancel Edit</Button>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>My Products</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {myProducts.length === 0 && <p className="text-gray-600">No products yet.</p>}
          {myProducts.map((product) => (
            <div key={product.id} className="rounded-md border p-3 flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold">{product.name}</p>
                <p className="text-sm text-gray-600">${Number(product.price).toFixed(2)} | Stock: {product.stock}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => handleEditProduct(product)} disabled={!canManageCatalog}>Edit</Button>
                <Button variant="destructive" onClick={() => handleDeleteProduct(product.id)} disabled={!canManageCatalog}>Delete</Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

    </div>
  )
}
