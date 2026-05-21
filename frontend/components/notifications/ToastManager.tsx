'use client'

import React from 'react'
import { Toaster as SonnerToaster } from '@/components/ui/sonner'

/**
 * ToastManager wraps the shadcn/sonner toaster with custom defaults matching the spec:
 * - Positioned at bottom-right
 * - Auto-dismisses after 6 seconds (6000ms)
 * - Pauses/stays on hover
 * - Handles multiple queued toasts
 */
export default function ToastManager() {
  return (
    <SonnerToaster
      position="bottom-right"
      duration={6000}
      visibleToasts={6}
      closeButton
      richColors
    />
  )
}
