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
import { Badge } from '@/components/ui/badge'
import { AccountPanel } from '@/components/account-panel'
import { AlertTriangle, BarChart3, Boxes, CheckCircle2, Clock3, Wallet } from 'lucide-react'

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

type VendorOrder = {
  id: string | number
  orderNumber?: string
  status?: string
  totalAmount?: number
  createdAt?: string
}

type VendorPayout = {
  id: string | number
  amount?: number
  status?: string
  payoutDate?: string
}

type VendorCoupon = {
  id: string | number
  code?: string
  type?: string
  value?: number
  isActive?: boolean
}

type VendorAnalytics = {
  conversionRate?: number
  repeatCustomers?: number
  avgOrderValue?: number
  topCategory?: string
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
  const [activeTab, setActiveTab] = useState<'overview' | 'catalog' | 'orders' | 'payouts' | 'coupons' | 'analytics'>('overview')
  const [vendorOrders, setVendorOrders] = useState<VendorOrder[]>([])
  const [vendorPayouts, setVendorPayouts] = useState<VendorPayout[]>([])
  const [vendorCoupons, setVendorCoupons] = useState<VendorCoupon[]>([])
  const [vendorAnalytics, setVendorAnalytics] = useState<VendorAnalytics | null>(null)

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
        const [vendorRes, dashboardRes, ordersRes, payoutsRes, couponsRes, analyticsRes] = await Promise.all([
          apiClient.get<VendorProfile>('/vendors/me'),
          apiClient.get<VendorInsights>('/vendors/me/dashboard'),
          apiClient.get<{ content?: VendorOrder[]; orders?: VendorOrder[] }>('/vendors/me/orders?page=0&size=10').catch(() => ({ content: [], orders: [] })),
          apiClient.get<{ content?: VendorPayout[]; payouts?: VendorPayout[] }>('/vendors/me/payouts?page=0&size=10').catch(() => ({ content: [], payouts: [] })),
          apiClient.get<{ content?: VendorCoupon[]; coupons?: VendorCoupon[] }>('/vendors/me/coupons?page=0&size=10').catch(() => ({ content: [], coupons: [] })),
          apiClient.get<VendorAnalytics>('/vendors/me/analytics').catch(() => null),
        ])
        setVendorProfile(vendorRes)
        setVendorInsights(dashboardRes)
        setVendorOrders(ordersRes.content || ordersRes.orders || [])
        setVendorPayouts(payoutsRes.content || payoutsRes.payouts || [])
        setVendorCoupons(couponsRes.content || couponsRes.coupons || [])
        setVendorAnalytics(analyticsRes)
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

  const inventoryHealth = useMemo(() => {
    const outOfStock = myProducts.filter((product) => Number(product.stock) <= 0)
    const lowStock = myProducts.filter((product) => Number(product.stock) > 0 && Number(product.stock) <= 5)
    const discounted = myProducts.filter((product) => Number(product.discountPrice || 0) > 0)

    return {
      outOfStock,
      lowStock,
      discounted,
    }
  }, [myProducts])

  const topInventoryRisk = useMemo(
    () => [...inventoryHealth.outOfStock, ...inventoryHealth.lowStock].slice(0, 5),
    [inventoryHealth.outOfStock, inventoryHealth.lowStock]
  )

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
            <p className="mt-1">Product management is locked until admin verification is complete.</p>
            {vendorProfile?.rejectionReason ? <p className="mt-1">Reason: {vendorProfile.rejectionReason}</p> : null}
          </CardContent>
        </Card>
      )}

      <div className="flex gap-2 overflow-x-auto pb-1">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'catalog', label: 'Catalog' },
          { id: 'orders', label: 'Orders' },
          { id: 'payouts', label: 'Payouts' },
          { id: 'coupons', label: 'Coupons' },
          { id: 'analytics', label: 'Analytics' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card><CardHeader><CardTitle>Total Sales</CardTitle></CardHeader><CardContent>${Number(vendorInsights?.totalSales || 0).toFixed(2)}</CardContent></Card>
            <Card><CardHeader><CardTitle>Total Orders</CardTitle></CardHeader><CardContent>{vendorInsights?.totalOrders ?? 0}</CardContent></Card>
            <Card><CardHeader><CardTitle>Pending Payout</CardTitle></CardHeader><CardContent>${Number(vendorInsights?.pendingPayout || 0).toFixed(2)}</CardContent></Card>
            <Card><CardHeader><CardTitle>Total Products</CardTitle></CardHeader><CardContent>{vendorInsights?.totalProducts ?? myProducts.length}</CardContent></Card>
            <Card><CardHeader><CardTitle>Active Products</CardTitle></CardHeader><CardContent>{vendorInsights?.activeProducts ?? myProducts.length}</CardContent></Card>
            <Card><CardHeader><CardTitle>Average Rating</CardTitle></CardHeader><CardContent>{Number(vendorInsights?.averageRating || 0).toFixed(1)} ({vendorInsights?.totalReviews ?? 0} reviews)</CardContent></Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Boxes className="h-4 w-4" />Catalog Health</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span>Out of stock</span>
                  <Badge variant="destructive">{inventoryHealth.outOfStock.length}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Low stock (1-5)</span>
                  <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">{inventoryHealth.lowStock.length}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Discounted products</span>
                  <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">{inventoryHealth.discounted.length}</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Wallet className="h-4 w-4" />Payout Snapshot</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-slate-700">
                <p>Pending payout: <span className="font-semibold">${Number(vendorInsights?.pendingPayout || 0).toFixed(2)}</span></p>
                <p>Completed sales: <span className="font-semibold">${Number(vendorInsights?.totalSales || 0).toFixed(2)}</span></p>
                <p className="text-xs text-slate-500">Tip: Keep inventory and fulfillment current to reduce payout holds.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><BarChart3 className="h-4 w-4" />Store Checklist</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="flex items-center gap-2 text-slate-700"><CheckCircle2 className="h-4 w-4 text-emerald-600" />Complete business verification</p>
                <p className="flex items-center gap-2 text-slate-700"><CheckCircle2 className="h-4 w-4 text-emerald-600" />Upload at least 5 active products</p>
                <p className="flex items-center gap-2 text-slate-700"><Clock3 className="h-4 w-4 text-amber-600" />Review low stock products daily</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-600" />Inventory Alerts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {topInventoryRisk.length === 0 && <p className="text-sm text-slate-600">No urgent inventory issues.</p>}
              {topInventoryRisk.map((product) => {
                const qty = Number(product.stock)
                const state = qty <= 0 ? 'Out of stock' : 'Low stock'

                return (
                  <div key={product.id} className="rounded-md border p-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{product.name}</p>
                      <p className="text-sm text-slate-600">SKU slug: {product.slug}</p>
                    </div>
                    <div className="text-right">
                      <Badge className={qty <= 0 ? 'bg-rose-100 text-rose-700 hover:bg-rose-100' : 'bg-amber-100 text-amber-700 hover:bg-amber-100'}>{state}</Badge>
                      <p className="text-xs text-slate-600 mt-1">Current stock: {qty}</p>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </>
      )}

      {activeTab === 'catalog' && (
        <>
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
        </>
      )}

      {activeTab === 'orders' && (
        <Card>
          <CardHeader><CardTitle>Orders (Backend Placeholder)</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-slate-600">Expected endpoint: <span className="font-mono">GET /vendors/me/orders</span></p>
            {vendorOrders.length === 0 ? (
              <p className="text-slate-600">No order data available yet.</p>
            ) : (
              vendorOrders.map((order) => (
                <div key={order.id} className="rounded-md border p-3 flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{order.orderNumber || `Order #${order.id}`}</p>
                    <p className="text-sm text-slate-600">Status: {order.status || 'PENDING'}</p>
                  </div>
                  <p className="text-sm font-semibold">${Number(order.totalAmount || 0).toFixed(2)}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'payouts' && (
        <Card>
          <CardHeader><CardTitle>Payouts (Backend Placeholder)</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-slate-600">Expected endpoint: <span className="font-mono">GET /vendors/me/payouts</span></p>
            {vendorPayouts.length === 0 ? (
              <p className="text-slate-600">No payout records available yet.</p>
            ) : (
              vendorPayouts.map((payout) => (
                <div key={payout.id} className="rounded-md border p-3 flex items-center justify-between">
                  <div>
                    <p className="font-semibold">Payout #{payout.id}</p>
                    <p className="text-sm text-slate-600">Status: {payout.status || 'PROCESSING'}</p>
                  </div>
                  <p className="text-sm font-semibold">${Number(payout.amount || 0).toFixed(2)}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'coupons' && (
        <Card>
          <CardHeader><CardTitle>Coupons (Backend Placeholder)</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-slate-600">Expected endpoint: <span className="font-mono">GET /vendors/me/coupons</span></p>
            {vendorCoupons.length === 0 ? (
              <p className="text-slate-600">No coupon records available yet.</p>
            ) : (
              vendorCoupons.map((coupon) => (
                <div key={coupon.id} className="rounded-md border p-3 flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{coupon.code || `COUPON-${coupon.id}`}</p>
                    <p className="text-sm text-slate-600">Type: {coupon.type || 'PERCENT'}</p>
                  </div>
                  <p className="text-sm font-semibold">{coupon.value || 0}{coupon.type === 'AMOUNT' ? ' USD' : '%'}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'analytics' && (
        <Card>
          <CardHeader><CardTitle>Analytics (Backend Placeholder)</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-700">
            <p>Expected endpoint: <span className="font-mono">GET /vendors/me/analytics</span></p>
            <p>Conversion rate: <span className="font-semibold">{Number(vendorAnalytics?.conversionRate || 0).toFixed(2)}%</span></p>
            <p>Repeat customers: <span className="font-semibold">{vendorAnalytics?.repeatCustomers || 0}</span></p>
            <p>Average order value: <span className="font-semibold">${Number(vendorAnalytics?.avgOrderValue || 0).toFixed(2)}</span></p>
            <p>Top category: <span className="font-semibold">{vendorAnalytics?.topCategory || 'N/A'}</span></p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
