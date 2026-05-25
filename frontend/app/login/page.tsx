'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/authStore'
import { login, fetchMe } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { TrendingUp, Lock, User, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const { setTokens, setUser } = useAuthStore()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const data = await login(username, password)
      setTokens(data.access_token, data.refresh_token)
      
      const user = await fetchMe(data.access_token)
      setUser(user)
      
      router.push('/')
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background overflow-hidden selection:bg-primary selection:text-primary-foreground">
      {/* Background gradients */}
      <div className="absolute inset-0 z-0 bg-radial-gradient">
        <div className="absolute top-[20%] left-[20%] w-[300px] h-[300px] rounded-full bg-primary/10 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[20%] right-[20%] w-[400px] h-[400px] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none" />
      </div>

      <div className="relative z-10 w-full max-w-md px-4">
        <div className="flex flex-col items-center mb-6">
          <div className="bg-primary/10 border border-primary/30 p-2.5 rounded-lg mb-2">
            <TrendingUp className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-xl font-extrabold tracking-wider font-sans uppercase">
            Strategy Research Terminal
          </h1>
          <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest mt-1">
            Quantitative Backtesting Engine
          </p>
        </div>

        <Card className="border border-border/80 bg-card/60 backdrop-blur-md shadow-2xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-lg font-bold">Sign in</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Enter your username and password to access your terminal
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <div className="flex items-center space-x-2 rounded-md bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
                  Username
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/60" />
                  <Input
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/60" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-9"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" disabled={loading} className="w-full font-semibold">
                {loading ? 'Signing in...' : 'Sign in'}
              </Button>
              <div className="text-xs text-center text-muted-foreground">
                Don&apos;t have an account?{' '}
                <Link href="/register" className="text-primary hover:underline font-semibold">
                  Register here
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
