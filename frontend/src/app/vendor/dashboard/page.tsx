'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/auth-store'
import { apiClient } from '@/lib/api-client'
import { normalizeImageUrlForStorage, resolveMediaUrl } from '@/lib/media-url'
import { useCategories, useProducts, Product } from '@/hooks/use-api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AccountPanel } from '@/components/account-panel'
import { AlertTriangle, BarChart3, Boxes, CheckCircle2, Clock3, Package, RefreshCw, Shield, ShieldCheck, ShoppingCart, Star, Store, Wallet } from 'lucide-react'

type ProductForm = {
  id?: string | number
  name: string
  slug: string
  description: string
  price: string
  discountPrice: string
  stock: string
  categoryId: string
  isFeatured: boolean
  imageUrls: string
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

type CatalogAccess = {
  canAddItems: boolean
  vendorApproved: boolean
  allDocumentsVerified: boolean
  unverifiedDocumentCount: number
  vendorStatus?: string
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

type UploadedProductImagesResponse = {
  urls?: string[]
  uploadedCount?: number
  provider?: string
}

type ProductFormErrors = {
  name?: string
  slug?: string
  price?: string
  stock?: string
  categoryId?: string
  discountPrice?: string
}

const initialProductForm: ProductForm = {
  name: '',
  slug: '',
  description: '',
  price: '',
  discountPrice: '',
  stock: '0',
  categoryId: '',
  isFeatured: false,
  imageUrls: '',
}

const normalizeImageUrls = (value: string) =>
  Array.from(
    new Set(
      value
        .split(/[\n,]/)
        .map((entry) => entry.trim())
        .filter(Boolean)
    )
  )

const mergeImageStack = (existingValue: string, incomingUrls: string[]) => {
  const existing = normalizeImageUrls(existingValue)
  const next = incomingUrls.map((url) => normalizeImageUrlForStorage(url)).filter(Boolean)
  const existingSet = new Set(existing)
  const appended = next.filter((url) => !existingSet.has(url))

  // Preserve primary image by keeping existing order first, then stacking new uploads after it.
  return [...existing, ...appended]
}

const normalizeSlug = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  const VENDOR_ALLOWED_CATEGORY_NAMES = ['Electronics', 'Toys', 'Hardware', 'Clothes', 'Kirana Items']

  const CATEGORY_VISUALS: Record<string, { icon: React.ComponentType<{ className?: string }>; chipClass: string; iconClass: string }> = {
    electronics: {
      icon: Shield,
      chipClass: 'bg-blue-50 text-blue-900 border-blue-200',
      iconClass: 'text-blue-600',
    },
    toys: {
      icon: Star,
      chipClass: 'bg-amber-50 text-amber-900 border-amber-200',
      iconClass: 'text-amber-600',
    },
    hardware: {
      icon: Store,
      chipClass: 'bg-slate-100 text-slate-900 border-slate-300',
      iconClass: 'text-slate-700',
    },
    clothes: {
      icon: ShoppingCart,
      chipClass: 'bg-pink-50 text-pink-900 border-pink-200',
      iconClass: 'text-pink-600',
    },
    'kirana items': {
      icon: Package,
      chipClass: 'bg-emerald-50 text-emerald-900 border-emerald-200',
      iconClass: 'text-emerald-700',
    },
  }

  const getCategoryVisual = (name?: string) => {
    const key = (name || '').trim().toLowerCase()
    return CATEGORY_VISUALS[key] || {
      icon: Boxes,
      chipClass: 'bg-slate-100 text-slate-900 border-slate-200',
      iconClass: 'text-slate-600',
    }
  }

  const getCategoryFormHints = (categoryName?: string) => {
    const key = (categoryName || '').trim().toLowerCase()

    if (key === 'electronics') {
      return {
        namePlaceholder: 'Samsung 55-inch 4K Smart TV',
        descriptionPlaceholder: 'Include model number, warranty, and key specs (RAM, storage, dimensions, power rating).',
        imageHint: 'Add clear front, side, and label/spec images for buyer confidence.',
      }
    }

    if (key === 'toys') {
      return {
        namePlaceholder: 'STEM Building Blocks Set (120 pcs)',
        descriptionPlaceholder: 'Mention age group, materials, safety notes, and included pieces.',
        imageHint: 'Show box, pieces laid out, and one assembled sample image.',
      }
    }

    if (key === 'hardware') {
      return {
        namePlaceholder: 'Drill Machine 650W with Bit Set',
        descriptionPlaceholder: 'Mention voltage, power rating, compatible use-cases, and included accessories.',
        imageHint: 'Add full product shot, close-up of accessories, and rating label image.',
      }
    }

    if (key === 'clothes') {
      return {
        namePlaceholder: 'Men Cotton Casual Shirt - Blue (M)',
        descriptionPlaceholder: 'Include fabric, fit, wash care, available sizes, and color variants.',
        imageHint: 'Upload front, back, and fabric close-up images for better conversion.',
      }
    }

    if (key === 'kirana items') {
      return {
        namePlaceholder: 'Basmati Rice Premium 5kg Pack',
        descriptionPlaceholder: 'Mention net quantity, brand, expiry/shelf life, and storage instructions.',
        imageHint: 'Use pack front, nutrition panel, and MRP/batch image for trust.',
      }
    }

    return {
      namePlaceholder: 'Product title',
      descriptionPlaceholder: 'Describe the product, pack size, and key benefits.',
      imageHint: 'Use one URL per line or upload multiple images for better listing quality.',
    }
  }

export default function VendorDashboardPage() {
  const router = useRouter()
  const imageInputRef = useRef<HTMLInputElement | null>(null)
  const { user, isAuthenticated } = useAuthStore()
  const { data: productsData, refetch: refetchProducts } = useProducts(1, 200)
  const { data: categories } = useCategories()

  const [savingProduct, setSavingProduct] = useState(false)
  const [uploadingImages, setUploadingImages] = useState(false)
  const [editingProductId, setEditingProductId] = useState<string | number | null>(null)
  const [productForm, setProductForm] = useState<ProductForm>(initialProductForm)
  const [productFormErrors, setProductFormErrors] = useState<ProductFormErrors>({})
  const [vendorProfile, setVendorProfile] = useState<VendorProfile | null>(null)
  const [vendorInsights, setVendorInsights] = useState<VendorInsights | null>(null)
  const [catalogAccess, setCatalogAccess] = useState<CatalogAccess | null>(null)
  const [checkingAccess, setCheckingAccess] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'catalog' | 'orders' | 'payouts' | 'coupons' | 'analytics'>('overview')
  const [vendorOrders, setVendorOrders] = useState<VendorOrder[]>([])
  const [vendorPayouts, setVendorPayouts] = useState<VendorPayout[]>([])
  const [vendorCoupons, setVendorCoupons] = useState<VendorCoupon[]>([])
  const [vendorAnalytics, setVendorAnalytics] = useState<VendorAnalytics | null>(null)
  const [vendorCategories, setVendorCategories] = useState<Array<{ id: string | number; name: string }>>([])

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
        const [vendorRes, dashboardRes, accessRes, vendorCategoriesRes] = await Promise.all([
          apiClient.get<VendorProfile>('/vendors/me'),
          apiClient.get<VendorInsights>('/vendors/me/dashboard'),
          apiClient.get<CatalogAccess>('/vendors/me/can-add-items').catch(() => null),
          apiClient
            .get<{ categories?: Array<{ id: string | number; name: string }> } | Array<{ id: string | number; name: string }>>('/categories/vendor-catalog')
            .catch(() => []),
        ])

        const normalizedVendorCategories = Array.isArray(vendorCategoriesRes)
          ? vendorCategoriesRes
          : (vendorCategoriesRes?.categories || [])

        setVendorProfile(vendorRes)
        setVendorInsights(dashboardRes)
        setVendorOrders([])
        setVendorPayouts([])
        setVendorCoupons([])
        setVendorAnalytics(null)
        setCatalogAccess(accessRes)
        setVendorCategories(normalizedVendorCategories)
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

  const draftImageUrls = useMemo(() => normalizeImageUrls(productForm.imageUrls), [productForm.imageUrls])
  const categoryOptions = useMemo(() => {
    if (vendorCategories.length > 0) {
      return vendorCategories
    }

    return (categories || []).filter((category) => VENDOR_ALLOWED_CATEGORY_NAMES.includes(category.name))
  }, [vendorCategories, categories])

  const categoryNameById = useMemo(
    () => new Map(categoryOptions.map((category) => [String(category.id), category.name])),
    [categoryOptions]
  )
  const selectedCategoryName = useMemo(
    () => categoryNameById.get(productForm.categoryId) || '',
    [categoryNameById, productForm.categoryId]
  )
  const selectedCategoryHints = useMemo(
    () => getCategoryFormHints(selectedCategoryName),
    [selectedCategoryName]
  )

  const isProductFormReady = useMemo(() => {
    return Boolean(
      productForm.name.trim() &&
      productForm.slug.trim() &&
      productForm.price.trim() &&
      productForm.categoryId &&
      Number(productForm.price) > 0 &&
      Number(productForm.stock) >= 0
    )
  }, [productForm.name, productForm.slug, productForm.price, productForm.categoryId, productForm.stock])

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

  const canManageCatalog = Boolean(catalogAccess?.vendorApproved ?? (vendorProfile?.status === 'APPROVED')) && !vendorProfile?.isDeleted

  const recheckCatalogAccess = async () => {
    try {
      setCheckingAccess(true)
      const response = await apiClient.get<CatalogAccess>('/vendors/me/can-add-items')
      setCatalogAccess(response)
      toast.success(response.canAddItems ? 'Catalog access confirmed' : 'Catalog access still pending')
    } catch (error: any) {
      toast.error(error?.message || 'Unable to recheck catalog access')
    } finally {
      setCheckingAccess(false)
    }
  }

  const resetProductForm = () => {
    setProductForm(initialProductForm)
    setProductFormErrors({})
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
      isFeatured: Boolean(product.isFeatured),
      imageUrls: Array.isArray(product.imageUrls) ? product.imageUrls.join('\n') : '',
    })
  }

  const handleProductImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    event.target.value = ''

    if (files.length === 0) {
      return
    }

    if (!canManageCatalog) {
      toast.error('Your vendor account is not ready for image uploads yet')
      return
    }

    const formData = new FormData()
    files.forEach((file) => formData.append('files', file))

    setUploadingImages(true)
    try {
      const response = await apiClient.upload<UploadedProductImagesResponse>('/vendors/me/product-images', formData)
      const uploadedUrls = response.urls || []

      setProductForm((prev) => ({
        ...prev,
        imageUrls: mergeImageStack(prev.imageUrls, uploadedUrls).join('\n'),
      }))

      toast.success(uploadedUrls.length > 0 ? `Uploaded ${uploadedUrls.length} image${uploadedUrls.length > 1 ? 's' : ''}` : 'Images uploaded')
    } catch (error: any) {
      toast.error(error?.message || 'Failed to upload product images')
    } finally {
      event.target.value = ''
      setUploadingImages(false)
    }
  }

  const handleSaveProduct = async () => {
    if (!canManageCatalog) {
      toast.error('Your vendor account is not ready for product creation yet')
      return
    }

    const normalizedSlug = normalizeSlug(productForm.slug)
    const nextErrors: ProductFormErrors = {}

    if (!productForm.name.trim()) {
      nextErrors.name = 'Product name is required'
    }

    if (!productForm.slug.trim()) {
      nextErrors.slug = 'Product slug is required'
    } else if (!normalizedSlug) {
      nextErrors.slug = 'Use lowercase letters, numbers, and hyphens only'
    } else if (normalizedSlug.length < 3) {
      nextErrors.slug = 'Product slug must be at least 3 characters'
    }

    if (!productForm.price.trim()) {
      nextErrors.price = 'Price is required'
    } else if (!Number.isFinite(Number(productForm.price)) || Number(productForm.price) <= 0) {
      nextErrors.price = 'Price must be greater than 0'
    }

    if (!Number.isFinite(Number(productForm.stock)) || Number(productForm.stock) < 0) {
      nextErrors.stock = 'Stock cannot be negative'
    }

    if (!productForm.categoryId) {
      nextErrors.categoryId = 'Select a product category'
    }

    if (productForm.discountPrice) {
      const discountPrice = Number(productForm.discountPrice)
      const price = Number(productForm.price)
      if (!Number.isFinite(discountPrice) || discountPrice < 0) {
        nextErrors.discountPrice = 'Discount price must be 0 or greater'
      } else if (Number.isFinite(price) && price > 0 && discountPrice >= price) {
        nextErrors.discountPrice = 'Discount price must be less than regular price'
      }
    }

    setProductFormErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      toast.error('Please correct the highlighted product fields and try again')
      return
    }

    setSavingProduct(true)
    try {
      const payload = {
        name: productForm.name.trim(),
        slug: normalizedSlug,
        description: productForm.description.trim(),
        price: Number(productForm.price),
        discountPrice: productForm.discountPrice ? Number(productForm.discountPrice) : undefined,
        stock: Number(productForm.stock),
        categoryId: Number(productForm.categoryId),
        isActive: true,
        isFeatured: productForm.isFeatured,
        imageUrls: normalizeImageUrls(productForm.imageUrls).map((url) => normalizeImageUrlForStorage(url)),
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
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-900 p-6 text-white shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.16),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.18),transparent_32%)]" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-[0.24em] text-emerald-200">Vendor Workspace</p>
            <h1 className="text-3xl font-semibold md:text-4xl">Vendor Dashboard</h1>
            <p className="max-w-2xl text-sm text-slate-200 md:text-base">
              Manage products, verify your catalog access, and keep your store presentation clean and consistent.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/vendor/verification">
              <Button variant="outline" className="border-white/20 bg-white/10 text-white hover:bg-white/20">
                View Verification Status
              </Button>
            </Link>
            <Button
              type="button"
              variant="outline"
              className="border-white/20 bg-white/10 text-white hover:bg-white/20"
              onClick={recheckCatalogAccess}
              disabled={checkingAccess}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${checkingAccess ? 'animate-spin' : ''}`} />
              Recheck Access
            </Button>
          </div>
        </div>
      </section>

      {user && <AccountPanel user={user} />}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card className="border-emerald-200/80 bg-emerald-50/80 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-emerald-900">Catalog Access</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-emerald-950">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              <span className="font-semibold">{catalogAccess?.canAddItems ? 'Ready to sell' : 'Waiting for verification'}</span>
            </div>
            <p className="text-xs text-emerald-800">
              {catalogAccess?.allDocumentsVerified
                ? 'All required documents are verified.'
                : `${catalogAccess?.unverifiedDocumentCount ?? 0} document(s) still need review.`}
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Products</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{myProducts.length}</CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{inventoryHealth.lowStock.length}</CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Featured Ready</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{inventoryHealth.discounted.length}</CardContent>
        </Card>
      </div>

      {!canManageCatalog && (
        <Card className="border-amber-300 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" />Awaiting Approval</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-amber-900">
            <p>
              Vendor status: <span className="font-semibold">{catalogAccess?.vendorStatus || vendorProfile?.status || user?.vendorStatus || 'PENDING'}</span>
            </p>
            <p className="mt-1">Product management unlocks after vendor approval.</p>
            <p className="mt-1">Document verification continues separately and still appears in your status panel.</p>
            {vendorProfile?.rejectionReason ? <p className="mt-1">Reason: {vendorProfile.rejectionReason}</p> : null}
          </CardContent>
        </Card>
      )}

      <div className="inline-flex rounded-2xl border border-slate-200 bg-slate-100 p-1">
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
            className={`rounded-xl px-4 py-2 text-sm font-medium whitespace-nowrap transition ${activeTab === tab.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
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
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>{editingProductId ? 'Edit Product' : 'Add Product'}</CardTitle>
              <p className="text-sm text-slate-600">Use clear labels, a valid category, and a concise description so the product is easy to review.</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4 rounded-2xl border bg-slate-50/70 p-4 shadow-sm">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">Product Basics</h3>
                    <p className="text-xs text-slate-600">Name and slug should match the product you want customers to find.</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="product-name">Product Name</Label>
                    <Input
                      id="product-name"
                      placeholder={selectedCategoryHints.namePlaceholder}
                      value={productForm.name}
                      onChange={(e) => {
                        const value = e.target.value
                        setProductForm((prev) => ({
                          ...prev,
                          name: value,
                          slug: prev.slug ? prev.slug : normalizeSlug(value),
                        }))
                        setProductFormErrors((prev) => ({ ...prev, name: undefined }))
                      }}
                      aria-invalid={Boolean(productFormErrors.name)}
                    />
                    {productFormErrors.name ? <p className="text-xs text-rose-700">{productFormErrors.name}</p> : null}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="product-slug">Slug</Label>
                    <Input
                      id="product-slug"
                      placeholder="organic-almond-milk"
                      value={productForm.slug}
                      onChange={(e) => {
                        setProductForm((prev) => ({ ...prev, slug: e.target.value }))
                        setProductFormErrors((prev) => ({ ...prev, slug: undefined }))
                      }}
                      onBlur={() => {
                        setProductForm((prev) => ({ ...prev, slug: normalizeSlug(prev.slug) }))
                      }}
                      aria-invalid={Boolean(productFormErrors.slug)}
                    />
                    <p className="text-xs text-slate-500">Slug auto-formats to lowercase and hyphens on blur.</p>
                    <p className="text-xs text-slate-500">Minimum 3 characters. Example: organic-almond-milk</p>
                    {productFormErrors.slug ? <p className="text-xs text-rose-700">{productFormErrors.slug}</p> : null}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="product-description">Description</Label>
                    <textarea
                      id="product-description"
                      className="min-h-28 w-full rounded-md border border-slate-300 bg-white p-3 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                      placeholder={selectedCategoryHints.descriptionPlaceholder}
                      value={productForm.description}
                      onChange={(e) => setProductForm((prev) => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-4 rounded-2xl border bg-white p-4 shadow-sm">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">Pricing & Inventory</h3>
                    <p className="text-xs text-slate-600">Keep price, stock, and featured status accurate for customers.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="product-price">Price</Label>
                      <Input
                        id="product-price"
                        placeholder="199.00"
                        type="number"
                        min="0"
                        value={productForm.price}
                        onChange={(e) => {
                          setProductForm((prev) => ({ ...prev, price: e.target.value }))
                          setProductFormErrors((prev) => ({ ...prev, price: undefined, discountPrice: undefined }))
                        }}
                        aria-invalid={Boolean(productFormErrors.price)}
                      />
                      {productFormErrors.price ? <p className="text-xs text-rose-700">{productFormErrors.price}</p> : null}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="product-discount">Discount Price</Label>
                      <Input
                        id="product-discount"
                        placeholder="149.00"
                        type="number"
                        min="0"
                        value={productForm.discountPrice}
                        onChange={(e) => {
                          setProductForm((prev) => ({ ...prev, discountPrice: e.target.value }))
                          setProductFormErrors((prev) => ({ ...prev, discountPrice: undefined }))
                        }}
                        aria-invalid={Boolean(productFormErrors.discountPrice)}
                      />
                      {productFormErrors.discountPrice ? <p className="text-xs text-rose-700">{productFormErrors.discountPrice}</p> : null}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="product-stock">Stock</Label>
                      <Input
                        id="product-stock"
                        placeholder="0"
                        type="number"
                        min="0"
                        value={productForm.stock}
                        onChange={(e) => {
                          setProductForm((prev) => ({ ...prev, stock: e.target.value }))
                          setProductFormErrors((prev) => ({ ...prev, stock: undefined }))
                        }}
                        aria-invalid={Boolean(productFormErrors.stock)}
                      />
                      {productFormErrors.stock ? <p className="text-xs text-rose-700">{productFormErrors.stock}</p> : null}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="product-category">Category</Label>
                      <Select
                        value={productForm.categoryId}
                        onValueChange={(value) => {
                          setProductForm((prev) => ({ ...prev, categoryId: value }))
                          setProductFormErrors((prev) => ({ ...prev, categoryId: undefined }))
                        }}
                      >
                        <SelectTrigger id="product-category" className="w-full">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categoryOptions.map((category) => (
                            <SelectItem key={category.id} value={String(category.id)}>
                              {(() => {
                                const visual = getCategoryVisual(category.name)
                                const Icon = visual.icon
                                return (
                                  <div className="flex items-center gap-2">
                                    <span className={`inline-flex h-5 w-5 items-center justify-center rounded-md bg-white ${visual.iconClass}`}>
                                      <Icon className="h-3.5 w-3.5" />
                                    </span>
                                    <span>{category.name}</span>
                                  </div>
                                )
                              })()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {productFormErrors.categoryId ? <p className="text-xs text-rose-700">{productFormErrors.categoryId}</p> : null}
                      {!productForm.categoryId && !productFormErrors.categoryId ? <p className="text-xs text-amber-700">Choose a category before creating the product.</p> : null}
                    </div>
                  </div>

                  <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3">
                    <label className="flex items-start gap-3 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        className="mt-1 h-4 w-4 rounded border-slate-300"
                        checked={productForm.isFeatured}
                        onChange={(e) => setProductForm((prev) => ({ ...prev, isFeatured: e.target.checked }))}
                      />
                      <span>
                        Mark this product as featured to promote it in featured product placements.
                      </span>
                    </label>
                  </div>

                  <div className="space-y-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <Label htmlFor="product-images">Image URLs</Label>
                        <p className="text-xs text-slate-500">You can paste URLs or upload files. Uploaded images are appended automatically.</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          ref={imageInputRef}
                          id="product-image-upload"
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={handleProductImageUpload}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => imageInputRef.current?.click()}
                          disabled={savingProduct || uploadingImages || !canManageCatalog}
                        >
                          {uploadingImages ? 'Uploading...' : 'Upload Images'}
                        </Button>
                        {draftImageUrls.length > 0 ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setProductForm((prev) => ({ ...prev, imageUrls: '' }))}
                            disabled={savingProduct || uploadingImages}
                          >
                            Clear
                          </Button>
                        ) : null}
                      </div>
                    </div>
                    <textarea
                      id="product-images"
                      className="min-h-32 w-full rounded-md border border-slate-300 bg-white p-3 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                      placeholder="https://cdn.example.com/products/item-1.jpg\nhttps://cdn.example.com/products/item-2.jpg"
                      value={productForm.imageUrls}
                      onChange={(e) => setProductForm((prev) => ({ ...prev, imageUrls: e.target.value }))}
                    />
                    <p className="text-xs text-slate-500">Accepted: JPG, PNG, WebP. Use one URL per line or commas to separate links.</p>
                    <p className="text-xs text-emerald-700">Tip: {selectedCategoryHints.imageHint}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-emerald-900">Available product categories</p>
                    <p className="text-xs text-emerald-800">Electronics, Toys, Hardware, Clothes, and Kirana Items are enabled for vendor catalog use.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {categoryOptions.map((category) => (
                      (() => {
                        const visual = getCategoryVisual(category.name)
                        const Icon = visual.icon
                        return (
                          <Badge key={category.id} variant="outline" className={`flex items-center gap-1.5 border ${visual.chipClass}`}>
                            <Icon className={`h-3 w-3 ${visual.iconClass}`} />
                            {category.name}
                          </Badge>
                        )
                      })()
                    ))}
                  </div>
                </div>
              </div>

              {draftImageUrls.length > 0 && (
                <div className="rounded-2xl border bg-slate-50 p-4 shadow-sm">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Image preview</p>
                      <p className="text-xs text-slate-600">{draftImageUrls.length} image{draftImageUrls.length > 1 ? 's' : ''} ready to attach to the product.</p>
                    </div>
                    <Badge variant="secondary" className="bg-slate-900 text-white">Primary first</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    {draftImageUrls.map((url, index) => (
                      <div key={`${url}-${index}`} className="overflow-hidden rounded-xl border bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                        <div className="aspect-square bg-slate-100">
                          <img src={resolveMediaUrl(url)} alt={`Product image ${index + 1}`} className="h-full w-full object-cover" />
                        </div>
                        <div className="border-t px-3 py-2 text-[11px] text-slate-600">
                          Image {index + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {Object.keys(productFormErrors).length > 0 && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
                  <p className="font-semibold">Please review these required fields before saving:</p>
                  <p className="mt-1">{Object.values(productFormErrors).filter(Boolean).join(' | ')}</p>
                </div>
              )}

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button onClick={handleSaveProduct} disabled={savingProduct || !canManageCatalog || !isProductFormReady} className="sm:min-w-44">
                  {savingProduct ? 'Saving...' : editingProductId ? 'Update Product' : 'Create Product'}
                </Button>
                {editingProductId && <Button variant="outline" onClick={resetProductForm}>Cancel Edit</Button>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>My Products</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {myProducts.length === 0 && <p className="text-gray-600">No products yet.</p>}
              {myProducts.map((product) => (
                <div key={product.id} className="rounded-md border p-3 flex items-center justify-between gap-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                  <div className="flex items-center gap-3">
                    <div className="h-16 w-16 overflow-hidden rounded-md border bg-slate-100">
                      {product.imageUrls && product.imageUrls.length > 0 ? (
                        <img
                          src={resolveMediaUrl(product.imageUrls[0])}
                          alt={`${product.name} thumbnail`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[10px] text-slate-500">No image</div>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold">{product.name}</p>
                      <p className="text-sm text-gray-600">${Number(product.price).toFixed(2)} | Stock: {product.stock}</p>
                      <p className="text-xs text-gray-500">Images: {(product.imageUrls || []).length}</p>
                      {(() => {
                        const categoryName = categoryNameById.get(String(product.categoryId)) || 'Uncategorized'
                        const visual = getCategoryVisual(categoryName)
                        const Icon = visual.icon
                        return (
                          <Badge variant="outline" className={`mt-1 flex w-fit items-center gap-1.5 border ${visual.chipClass}`}>
                            <Icon className={`h-3 w-3 ${visual.iconClass}`} />
                            {categoryName}
                          </Badge>
                        )
                      })()}
                    </div>
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
