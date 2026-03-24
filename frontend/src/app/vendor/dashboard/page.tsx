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

type Promotion = {
  id: number
  promotionType: 'CAMPAIGN' | 'OFFER' | 'COUPON'
  title: string
  description?: string
  code?: string
  valueText?: string
}

type Coupon = {
  id: number
  code: string
  couponType: 'PERCENTAGE' | 'FIXED_AMOUNT'
  discountValue: number
  isActive: boolean
}

type VendorProfile = {
  id: number
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED'
  rejectionReason?: string
  businessName?: string
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

  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [promotionType, setPromotionType] = useState<'CAMPAIGN' | 'OFFER' | 'COUPON'>('CAMPAIGN')
  const [promotionTitle, setPromotionTitle] = useState('')
  const [promotionDescription, setPromotionDescription] = useState('')
  const [promotionCode, setPromotionCode] = useState('')
  const [promotionValue, setPromotionValue] = useState('')

  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [couponCode, setCouponCode] = useState('')
  const [couponType, setCouponType] = useState<'PERCENTAGE' | 'FIXED_AMOUNT'>('PERCENTAGE')
  const [couponValue, setCouponValue] = useState('')
  const [vendorProfile, setVendorProfile] = useState<VendorProfile | null>(null)

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
        const [vendorRes, promotionsRes, couponsRes] = await Promise.all([
          apiClient.get<VendorProfile>('/vendors/me'),
          apiClient.get<Promotion[]>('/promotions/me'),
          apiClient.get<Coupon[]>('/coupons/me'),
        ])
        setVendorProfile(vendorRes)
        setPromotions(promotionsRes || [])
        setCoupons(couponsRes || [])
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

  const canManageCatalog = (vendorProfile?.status || user?.vendorStatus) === 'APPROVED'

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

  const createPromotion = async () => {
    if (!canManageCatalog) {
      toast.error('Your vendor account is not approved yet')
      return
    }

    if (!promotionTitle || !promotionValue) {
      toast.error('Promotion title and value are required')
      return
    }

    try {
      const created = await apiClient.post<Promotion>('/promotions', {
        promotionType,
        title: promotionTitle,
        description: promotionDescription,
        code: promotionCode || undefined,
        valueText: promotionValue,
      })
      setPromotions((prev) => [created, ...prev])
      setPromotionTitle('')
      setPromotionDescription('')
      setPromotionCode('')
      setPromotionValue('')
      toast.success('Promotion created')
    } catch (error: any) {
      toast.error(error?.message || 'Failed to create promotion')
    }
  }

  const removePromotion = async (id: number) => {
    if (!canManageCatalog) {
      toast.error('Your vendor account is not approved yet')
      return
    }

    try {
      await apiClient.delete(`/promotions/${id}`)
      setPromotions((prev) => prev.filter((item) => item.id !== id))
      toast.success('Promotion deleted')
    } catch (error: any) {
      toast.error(error?.message || 'Failed to delete promotion')
    }
  }

  const createCoupon = async () => {
    if (!canManageCatalog) {
      toast.error('Your vendor account is not approved yet')
      return
    }

    if (!couponCode || !couponValue) {
      toast.error('Coupon code and value are required')
      return
    }

    try {
      const created = await apiClient.post<Coupon>('/coupons', {
        code: couponCode,
        couponType,
        discountValue: Number(couponValue),
      })
      setCoupons((prev) => [created, ...prev])
      setCouponCode('')
      setCouponValue('')
      toast.success('Coupon created')
    } catch (error: any) {
      toast.error(error?.message || 'Failed to create coupon')
    }
  }

  const deactivateCoupon = async (id: number) => {
    if (!canManageCatalog) {
      toast.error('Your vendor account is not approved yet')
      return
    }

    try {
      await apiClient.delete(`/coupons/${id}`)
      setCoupons((prev) => prev.map((coupon) => (coupon.id === id ? { ...coupon, isActive: false } : coupon)))
      toast.success('Coupon deactivated')
    } catch (error: any) {
      toast.error(error?.message || 'Failed to deactivate coupon')
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Vendor Dashboard</h1>
        <p className="text-gray-600">Manage products, promotions, offers, and coupons.</p>
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
              Catalog actions are locked until admin verification is complete.
            </p>
            {vendorProfile?.rejectionReason ? (
              <p className="mt-1">Reason: {vendorProfile.rejectionReason}</p>
            ) : null}
          </CardContent>
        </Card>
      )}

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

      <Card>
        <CardHeader><CardTitle>Campaigns & Offers</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <select className="h-10 rounded-md border px-3" value={promotionType} onChange={(e) => setPromotionType(e.target.value as 'CAMPAIGN' | 'OFFER' | 'COUPON')}>
              <option value="CAMPAIGN">Campaign</option>
              <option value="OFFER">Offer</option>
              <option value="COUPON">Coupon Promotion</option>
            </select>
            <Input placeholder="Title" value={promotionTitle} onChange={(e) => setPromotionTitle(e.target.value)} />
            <Input placeholder="Description" value={promotionDescription} onChange={(e) => setPromotionDescription(e.target.value)} />
            <Input placeholder="Code (optional)" value={promotionCode} onChange={(e) => setPromotionCode(e.target.value)} />
            <Input placeholder="Value text (e.g. 20% OFF)" value={promotionValue} onChange={(e) => setPromotionValue(e.target.value)} />
          </div>
          <Button onClick={createPromotion} disabled={!canManageCatalog}>Create Promotion</Button>
          <div className="space-y-2">
            {promotions.length === 0 && <p className="text-gray-600">No promotions yet.</p>}
            {promotions.map((promotion) => (
              <div key={promotion.id} className="rounded-md border p-3 flex justify-between items-center">
                <div>
                  <p className="font-medium">{promotion.title} ({promotion.promotionType})</p>
                  <p className="text-sm text-gray-600">{promotion.valueText} {promotion.code ? `| Code: ${promotion.code}` : ''}</p>
                </div>
                <Button variant="destructive" onClick={() => removePromotion(promotion.id)} disabled={!canManageCatalog}>Delete</Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Coupons</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input placeholder="Coupon code" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} />
            <select className="h-10 rounded-md border px-3" value={couponType} onChange={(e) => setCouponType(e.target.value as 'PERCENTAGE' | 'FIXED_AMOUNT')}>
              <option value="PERCENTAGE">Percentage</option>
              <option value="FIXED_AMOUNT">Fixed amount</option>
            </select>
            <Input placeholder="Discount value" type="number" min="0" value={couponValue} onChange={(e) => setCouponValue(e.target.value)} />
          </div>
          <Button onClick={createCoupon} disabled={!canManageCatalog}>Create Coupon</Button>
          <div className="space-y-2">
            {coupons.length === 0 && <p className="text-gray-600">No coupons yet.</p>}
            {coupons.map((coupon) => (
              <div key={coupon.id} className="rounded-md border p-3 flex justify-between items-center">
                <div>
                  <p className="font-medium">{coupon.code} ({coupon.couponType})</p>
                  <p className="text-sm text-gray-600">Value: {coupon.discountValue} | {coupon.isActive ? 'Active' : 'Inactive'}</p>
                </div>
                {coupon.isActive && <Button variant="destructive" onClick={() => deactivateCoupon(coupon.id)} disabled={!canManageCatalog}>Deactivate</Button>}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
