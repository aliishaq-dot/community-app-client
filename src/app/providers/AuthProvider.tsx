import { useEffect, useRef } from 'react'
import { useAuthStore } from '../store/authStore'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const initialize = useAuthStore((s) => s.initialize)
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    initialize()
  }, [initialize])

  return <>{children}</>
}