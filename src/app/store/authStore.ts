import { create } from 'zustand'

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

interface User {
  id: string
  username: string
  email: string
}

interface AuthState {
  accessToken: string | null
  user: User | null
  status: AuthStatus
  setSession: (token: string, user: User) => void
  clear: () => void
  setStatus: (status: AuthStatus) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  status: 'unauthenticated' as AuthStatus,
  setSession: (accessToken, user) => set({ accessToken, user, status: 'authenticated' }),
  clear: () => set({ accessToken: null, user: null, status: 'unauthenticated' }),
  setStatus: (status) => set({ status }),
}))