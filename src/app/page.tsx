'use client'

import { useAuthStore } from '@/lib/stores/auth-store'
import { useThemeStore } from '@/lib/stores/theme-store'
import { AuthForm } from '@/components/auth/auth-form'
import { MainLayout } from '@/components/layout/main-layout'
import { Dashboard } from '@/components/features/dashboard'
import { useEffect } from 'react'

export default function Home() {
  const { isAuthenticated } = useAuthStore()
  const { theme, setTheme } = useThemeStore()

  // Initialize theme on mount
  useEffect(() => {
    setTheme(theme)
  }, [theme, setTheme])

  if (!isAuthenticated) {
    return <AuthForm />
  }

  return (
    <MainLayout>
      <Dashboard />
    </MainLayout>
  )
}
