'use client'

import React, { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { updateCosts } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X, ShieldAlert, CheckCircle2 } from 'lucide-react'

interface AccountSettingsProps {
  isOpen: boolean
  onClose: () => void
}

export default function AccountSettings({ isOpen, onClose }: AccountSettingsProps) {
  const { user, accessToken, setUser } = useAuthStore()
  
  const [commissionModel, setCommissionModel] = useState('flat')
  const [commissionValue, setCommissionValue] = useState(0)
  const [slippageBps, setSlippageBps] = useState(0)
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Initialize values when user state is available
  useEffect(() => {
    if (user) {
      setCommissionModel(user.commission_model)
      setCommissionValue(user.commission_value)
      setSlippageBps(user.slippage_bps)
    }
  }, [user, isOpen])

  if (!isOpen || !user) return null

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setLoading(true)

    try {
      if (!accessToken) throw new Error('Not authenticated')
      
      const updatedUser = await updateCosts(accessToken, {
        commission_model: commissionModel,
        commission_value: Number(commissionValue),
        slippage_bps: Number(slippageBps),
      })
      
      setUser(updatedUser)
      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        onClose()
      }, 1200)
    } catch (err: any) {
      setError(err.message || 'Failed to update transaction settings.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 p-4">
      <div className="relative w-full max-w-md rounded-lg border border-border bg-card shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/80">
          <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-foreground">
            TRANSACTION COSTS
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-all cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="p-4 space-y-5">
          {error && (
            <div className="flex items-center space-x-2 rounded bg-destructive/10 border border-destructive/20 p-2.5 text-xs text-destructive">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          
          {success && (
            <div className="flex items-center space-x-2 rounded bg-emerald-500/10 border border-emerald-500/20 p-2.5 text-xs text-emerald-500">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Settings saved successfully!</span>
            </div>
          )}

          {/* Commission Model Selection */}
          <div className="space-y-3">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
              Commission Model
            </span>
            <div className="space-y-2">
              {/* Flat Option */}
              <label className="flex items-center justify-between p-2.5 rounded border border-border/60 hover:bg-accent/25 transition-all cursor-pointer">
                <div className="flex items-center space-x-2.5 text-xs">
                  <input
                    type="radio"
                    name="commission_model"
                    value="flat"
                    checked={commissionModel === 'flat'}
                    onChange={() => {
                      setCommissionModel('flat')
                      setCommissionValue(0)
                    }}
                    className="accent-primary h-3.5 w-3.5"
                  />
                  <span>Flat per trade</span>
                </div>
                {commissionModel === 'flat' && (
                  <div className="flex items-center space-x-1 w-24">
                    <span className="text-[10px] text-muted-foreground font-mono">$</span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={commissionValue}
                      onChange={(e) => setCommissionValue(Number(e.target.value))}
                      className="h-7 text-xs px-1.5 py-0 font-mono text-right"
                    />
                  </div>
                )}
              </label>

              {/* Per Share Option */}
              <label className="flex items-center justify-between p-2.5 rounded border border-border/60 hover:bg-accent/25 transition-all cursor-pointer">
                <div className="flex items-center space-x-2.5 text-xs">
                  <input
                    type="radio"
                    name="commission_model"
                    value="per_share"
                    checked={commissionModel === 'per_share'}
                    onChange={() => {
                      setCommissionModel('per_share')
                      setCommissionValue(0)
                    }}
                    className="accent-primary h-3.5 w-3.5"
                  />
                  <span>Per share</span>
                </div>
                {commissionModel === 'per_share' && (
                  <div className="flex items-center space-x-1 w-24">
                    <span className="text-[10px] text-muted-foreground font-mono">$</span>
                    <Input
                      type="number"
                      step="0.0001"
                      min="0"
                      value={commissionValue}
                      onChange={(e) => setCommissionValue(Number(e.target.value))}
                      className="h-7 text-xs px-1.5 py-0 font-mono text-right"
                    />
                  </div>
                )}
              </label>

              {/* Percentage Option */}
              <label className="flex items-center justify-between p-2.5 rounded border border-border/60 hover:bg-accent/25 transition-all cursor-pointer">
                <div className="flex items-center space-x-2.5 text-xs">
                  <input
                    type="radio"
                    name="commission_model"
                    value="percentage"
                    checked={commissionModel === 'percentage'}
                    onChange={() => {
                      setCommissionModel('percentage')
                      setCommissionValue(0)
                    }}
                    className="accent-primary h-3.5 w-3.5"
                  />
                  <span>% of notional</span>
                </div>
                {commissionModel === 'percentage' && (
                  <div className="flex items-center space-x-1 w-24">
                    <Input
                      type="number"
                      step="0.001"
                      min="0"
                      value={commissionValue * 100}
                      onChange={(e) => setCommissionValue(Number(e.target.value) / 100.0)}
                      className="h-7 text-xs px-1.5 py-0 font-mono text-right"
                    />
                    <span className="text-[10px] text-muted-foreground font-mono">%</span>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Slippage */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
              Slippage
            </label>
            <div className="flex items-center space-x-2">
              <Input
                type="number"
                min="0"
                value={slippageBps}
                onChange={(e) => setSlippageBps(Number(e.target.value))}
                className="w-24 h-8 text-xs font-mono text-center"
              />
              <span className="text-xs text-muted-foreground">basis points</span>
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-2">
            <Button
              type="submit"
              disabled={loading}
              className="w-full font-mono text-xs font-bold uppercase tracking-widest"
            >
              {loading ? 'Saving Settings...' : 'Save Settings'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
