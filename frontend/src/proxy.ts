import { NextRequest, NextResponse } from 'next/server'

const authOnlyRoutes = ['/profile', '/orders', '/checkout', '/addresses', '/reviews', '/cart']

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('lc_access_token')?.value
  const role = request.cookies.get('lc_role')?.value

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
    if (role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', request.url))
    }
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
    '/vendor/:path*',
    '/admin/:path*',
  ],
}
