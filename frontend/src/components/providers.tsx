'use client'

import { ReactNode, useEffect } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/query-client'
import { Toaster } from 'sonner'
import { useAuthStore } from '@/lib/auth-store'

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  const { accessToken, user, loadUserFromStorage, getProfile } = useAuthStore()

  useEffect(() => {
    loadUserFromStorage()
  }, [loadUserFromStorage])

  useEffect(() => {
    if (accessToken && !user) {
      void getProfile()
    }
  }, [accessToken, user, getProfile])

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster position="top-right" />
    </QueryClientProvider>
  )
}
