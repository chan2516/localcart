'use client'

import { useMemo } from 'react'
import { usePathname } from 'next/navigation'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'

type AppChromeProps = {
  children: React.ReactNode
}

const CHROME_HIDDEN_PREFIXES = ['/auth/', '/admin/login']

export function AppChrome({ children }: AppChromeProps) {
  const pathname = usePathname()

  const hideChrome = useMemo(
    () => CHROME_HIDDEN_PREFIXES.some((prefix) => pathname.startsWith(prefix)),
    [pathname]
  )

  if (hideChrome) {
    return <main className="min-h-screen">{children}</main>
  }

  return (
    <>
      <Header />
      <main className="min-h-screen">{children}</main>
      <Footer />
    </>
  )
}
