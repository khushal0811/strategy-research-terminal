import { create } from 'zustand'

interface AuthState {
  accessToken:  string | null
  refreshToken: string | null
  user: {
    id:               string
    username:         string
    email:            string
    commission_model: string
    commission_value: number
    slippage_bps:     number
  } | null

  setTokens: (access: string, refresh: string) => void
  setUser:   (user: AuthState['user']) => void
  logout:    () => void
  hydrate:   () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  // Start as null — will be hydrated from localStorage on client mount.
  // Cannot read localStorage here directly because Zustand initialises
  // during SSR in Next.js App Router where window is undefined, and the
  // initialiser does not re-run on the client after hydration.
  accessToken:  null,
  refreshToken: null,
  user: null,

  setTokens: (access, refresh) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token',  access)
      localStorage.setItem('refresh_token', refresh)
    }
    set({ accessToken: access, refreshToken: refresh })
  },

  setUser: (user) => set({ user }),

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
    }
    set({ accessToken: null, refreshToken: null, user: null })
  },

  // Called once on client mount to restore tokens from localStorage.
  // This is the correct pattern for Zustand + Next.js App Router.
  hydrate: () => {
    if (typeof window === 'undefined') return
    const access  = localStorage.getItem('access_token')
    const refresh = localStorage.getItem('refresh_token')
    if (access) {
      set({ accessToken: access, refreshToken: refresh })
    }
  },
}))
