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
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken:  typeof window !== 'undefined' ? localStorage.getItem('access_token')  : null,
  refreshToken: typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null,
  user: null,

  setTokens: (access, refresh) => {
    localStorage.setItem('access_token',  access)
    localStorage.setItem('refresh_token', refresh)
    set({ accessToken: access, refreshToken: refresh })
  },

  setUser: (user) => set({ user }),

  logout: () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    set({ accessToken: null, refreshToken: null, user: null })
  },
}))
