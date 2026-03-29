import { NextRequest, NextResponse } from 'next/server'

const authOnlyRoutes = ['/profile', '/orders', '/checkout', '/addresses', '/reviews', '/cart', '/dashboard', '/auth/change-password']

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('lc_access_token')?.value
  const role = request.cookies.get('lc_role')?.value
  const isAdminRole = role === 'ADMIN' || role === 'ADMIN_L1' || role === 'ADMIN_L2'
  const isLevelOneAdminRole = role === 'ADMIN' || role === 'ADMIN_L1'

  const isAuthOnlyRoute = authOnlyRoutes.some((route) =>
    pathname === route || pathname.startsWith(`${route}/`)
  )

  if (isAuthOnlyRoute && !token) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  if (pathname.startsWith('/vendor')) {
    if (!token) {
      return NextResponse.redirect(new URL('/auth/vendor/login', request.url))
    }
    if (role !== 'VENDOR') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  const isAdminProtectedRoute = pathname.startsWith('/admin') && pathname !== '/admin/login'

  if (isAdminProtectedRoute) {
    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
    if (!isAdminRole) {
      return NextResponse.redirect(new URL('/', request.url))
    }
    const isLevelOneOnlyRoute = pathname.startsWith('/admin/development') || pathname.startsWith('/admin/admin-users')
    if (isLevelOneOnlyRoute && !isLevelOneAdminRole) {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url))
    }
  }

  const isShoppingRoute = pathname.startsWith('/cart') || pathname.startsWith('/orders') || pathname.startsWith('/checkout')
  if (isShoppingRoute && isAdminRole) {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/profile/:path*',
    '/orders/:path*',
    '/checkout/:path*',
    '/addresses/:path*',
    '/reviews/:path*',
    '/cart/:path*',
    '/dashboard/:path*',
    '/auth/change-password/:path*',
    '/vendor/:path*',
    '/admin/:path*',
  ],
}
