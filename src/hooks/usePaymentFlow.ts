import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'
import { useAuth } from '../context/AuthContext'

// ─── Types ────────────────────────────────────────────

interface UsePaymentFlowReturn {
  // Discount states
  discountCode: string
  setDiscountCode: (code: string) => void
  isApplyingDiscount: boolean
  discountApplied: boolean
  setDiscountApplied: (applied: boolean) => void
  discountError: string
  finalPrice: number
  
  // Payment verification states
  isVerifyingPayment: boolean
  verifyCountdown: number
  showPaymentFallback: boolean
  
  // Unlock animation states
  isUnlocking: boolean
  unlockedCount: number
  
  // Modal states
  isPaymentModalOpen: boolean
  setIsPaymentModalOpen: (open: boolean) => void
  isPioneerModalOpen: boolean
  setIsPioneerModalOpen: (open: boolean) => void
  
  // Handlers
  handleApplyDiscount: () => Promise<void>
  handlePaymentSuccess: (reference: any) => Promise<void>
  handlePaymentFallbackCheck: () => Promise<void>
  handlePioneerClaim: () => Promise<void>
  handleStartPayment: () => void
  handleStartUnlock: () => void
  handleCancelVerification: () => void
}

// ─── Hook ────────────────────────────────────────────────────

export function usePaymentFlow(): UsePaymentFlowReturn {
  const { user, profile, refreshProfile } = useAuth()
  
  // Payment & Discount States
  const [discountCode, setDiscountCode] = useState('')
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(false)
  const [discountApplied, setDiscountApplied] = useState(false)
  const [discountError, setDiscountError] = useState('')
  const [finalPrice, setFinalPrice] = useState(25)

  // Payment Verification States
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false)
  const [verifyCountdown, setVerifyCountdown] = useState(8)
  const [showPaymentFallback, setShowPaymentFallback] = useState(false)

  // Unlock Animation States (managed internally)
  const [isUnlocking, setIsUnlocking] = useState(false)
  const [unlockedCount, setUnlockedCount] = useState(0)

  // Modal States
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [isPioneerModalOpen, setIsPioneerModalOpen] = useState(false)

  // ─── Internal Effects ────────────────────────────────────────

  // Verification Countdown Effect
  useEffect(() => {
    if (!isVerifyingPayment) {
      setVerifyCountdown(8)
      setShowPaymentFallback(false)
      return
    }

    if (verifyCountdown > 0) {
      const t = setTimeout(() => setVerifyCountdown((prev: number) => prev - 1), 1000)
      return () => clearTimeout(t)
    } else {
      setShowPaymentFallback(true)
    }
  }, [isVerifyingPayment, verifyCountdown])

  // Unlock Animation Effect
  useEffect(() => {
    if (isUnlocking) {
      const timer = setTimeout(() => {
        setUnlockedCount((prev: number) => prev + 1)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [isUnlocking, unlockedCount])

  // ─── Handlers ──────────────────────────────────────────────

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) return
    setIsApplyingDiscount(true)
    setDiscountError('')
    
    try {
      // Real-Time Database Validation (Beast Mode)
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('code', discountCode.toUpperCase())
        .maybeSingle()

      if (error) throw error

      if (data) {
        // Apply the requested 10 GHS discount
        const discountAmount = data.discount_amount || 10
        setFinalPrice(25 - discountAmount)
        setDiscountApplied(true)
        toast.success(`Success! ₵${discountAmount} Privilege Discount Applied.`)
      } else {
        setDiscountError('Invalid or expired privilege code.')
      }
    } catch (err: any) {
      console.error('Promo sync failed:', err)
      setDiscountError('Handshake error. Check connection.')
    } finally {
      setIsApplyingDiscount(false)
    }
  }

  const handlePaymentSuccess = async (reference: any) => {
    setIsPaymentModalOpen(false)
    setIsVerifyingPayment(true)
    
    // Retry logic with exponential backoff (max 2 retries = 3 total attempts)
    const maxRetries = 2
    let retryCount = 0
    let success = false
    
    while (retryCount <= maxRetries && !success) {
      try {
        const { error } = await supabase
          .from('users')
          .update({ has_paid: true, payment_reference: reference.reference })
          .eq('id', profile?.id)
        
        if (error) throw error
        
        // Zero-Flicker Sync: Refresh Auth Context
        await refreshProfile()
        
        success = true
        setIsVerifyingPayment(false)
        setIsUnlocking(true)
        setUnlockedCount(0)
        toast.success('Payment verified successfully!')
      } catch (error) {
        retryCount++
        
        if (retryCount <= maxRetries) {
          // Exponential backoff: 2s, 4s
          const delay = Math.pow(2, retryCount) * 1000
          toast.loading(`Verifying payment... (Attempt ${retryCount + 1}/${maxRetries + 1})`)
          await new Promise(resolve => setTimeout(resolve, delay))
        } else {
          // All retries failed
          setIsVerifyingPayment(false)
          toast.error('Payment verification failed. Please try again or contact support.')
          console.error('Payment verification failed after retries:', error)
        }
      }
    }
  }

  const handlePaymentFallbackCheck = async () => {
    if (!user || !profile) return
    
    try {
      // 1. Trigger the upgraded paystack-webhook GET sync
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error("No active session")

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/paystack-webhook?email=${encodeURIComponent(user.email || '')}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || ''
        }
      })

      const result = await res.json()

      if (result.success) {
        // Zero-Flicker Sync: Refresh Auth Context
        await refreshProfile()
        
        setIsVerifyingPayment(false)
        setIsUnlocking(true)
        setUnlockedCount(0)
        toast.success(result.message || 'Payment Verified! Access Restored.')
      } else {
        toast.info(result.message || 'No payment found yet. Please wait a moment.')
      }
    } catch (err: any) {
      console.error('Handshake failed:', err)
      toast.error('Could not reach verification server.')
    }
  }

  const handlePioneerClaim = async () => {
    if (!profile) return
    
    try {
      const { error } = await supabase
        .from('users')
        .update({ has_paid: true, is_pioneer: true })
        .eq('id', profile.id)

      if (error) throw error

      setIsPioneerModalOpen(false)
      setUnlockedCount(0)
      
      // Zero-Flicker Sync: Refresh Auth Context Profile
      await refreshProfile()
      
      toast.success('Pioneer Access Granted!')
    } catch (err) {
      console.error('Pioneer claim failed:', err)
      toast.error('Failed to claim access. Try again.')
    }
  }

  const handleStartPayment = () => {
    const isPioneerUser = !!profile?.is_pioneer
    const hasPaid = !!profile?.has_paid
    
    if (isPioneerUser && !hasPaid) {
      setIsPioneerModalOpen(true)
    } else {
      setIsPaymentModalOpen(true)
    }
  }

  const handleStartUnlock = () => {
    setIsUnlocking(true)
    setUnlockedCount(0)
  }

  const handleCancelVerification = () => {
    setIsVerifyingPayment(false)
  }

  return {
    // Discount states
    discountCode,
    setDiscountCode,
    isApplyingDiscount,
    discountApplied,
    setDiscountApplied,
    discountError,
    finalPrice,
    
    // Payment verification states
    isVerifyingPayment,
    verifyCountdown,
    showPaymentFallback,
    
    // Unlock animation states
    isUnlocking,
    unlockedCount,
    
    // Modal states
    isPaymentModalOpen,
    setIsPaymentModalOpen,
    isPioneerModalOpen,
    setIsPioneerModalOpen,
    
    // Handlers
    handleApplyDiscount,
    handlePaymentSuccess,
    handlePaymentFallbackCheck,
    handlePioneerClaim,
    handleStartPayment,
    handleStartUnlock,
    handleCancelVerification,
  }
}
