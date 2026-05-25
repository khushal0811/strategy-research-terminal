'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { User, LogOut, Settings, ChevronDown } from 'lucide-react'

interface UserMenuProps {
  onOpenSettings: () => void
}

export default function UserMenu({ onOpenSettings }: UserMenuProps) {
  const router = useRouter()
  const { user, logout } = useAuthStore()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!user) {
    return (
      <button
        onClick={() => router.push('/login')}
        className="flex items-center space-x-1.5 px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground border border-border bg-card hover:bg-accent/40 rounded transition-all cursor-pointer select-none"
      >
        <User className="h-3 w-3" />
        <span>Sign In</span>
      </button>
    )
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-1.5 px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-foreground border border-border bg-card hover:bg-accent/40 rounded transition-all cursor-pointer select-none"
      >
        <User className="h-3.5 w-3.5 text-primary" />
        <span>{user.username}</span>
        <ChevronDown className={`h-3 w-3 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-48 rounded border border-border bg-card shadow-lg z-50 overflow-hidden py-1">
          <button
            onClick={() => {
              setIsOpen(false)
              onOpenSettings()
            }}
            className="flex items-center w-full px-3 py-2 text-xs text-foreground hover:bg-accent/40 transition-all font-sans text-left cursor-pointer"
          >
            <Settings className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
            <span>Account Settings</span>
          </button>
          
          <div className="h-px bg-border/60 my-1" />
          
          <button
            onClick={() => {
              setIsOpen(false)
              logout()
              router.push('/login')
            }}
            className="flex items-center w-full px-3 py-2 text-xs text-destructive hover:bg-destructive/10 transition-all font-sans text-left cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5 mr-2" />
            <span>Logout</span>
          </button>
        </div>
      )}
    </div>
  )
}
