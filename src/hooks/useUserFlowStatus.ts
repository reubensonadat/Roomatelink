import { useMemo } from 'react'
import { useAuth } from '../context/AuthContext'

// ─── Types ────────────────────────────────────────────

interface UseUserFlowStatusReturn {
  isProfileComplete: boolean
  hasPaid: boolean
  getLandingRoute: () => string
}

// ─── Hook ────────────────────────────────────────────────────

export function useUserFlowStatus(): UseUserFlowStatusReturn {
  const { profile } = useAuth()
  
  // hasPaid is derived directly from profile - never manually mutated
  const hasPaid = useMemo(() => {
    return !!(profile?.has_paid || profile?.is_pioneer)
  }, [profile?.has_paid, profile?.is_pioneer])

  // Profile is complete if they have course and level
  const isProfileComplete = useMemo(() => {
    return !!(profile?.course && profile?.level)
  }, [profile?.course, profile?.level])

  // Centralized decision engine for "Where do I go next?"
  const getLandingRoute = () => {
    if (!profile || !profile.course || !profile.level) {
      return '/dashboard/profile' // Redirect to onboarding/profile setup
    }
    // Note: We don't check questionnaire here anymore because Dashboard 
    // handles that state internally to show the DNA mapping prompt.
    // If we wanted a hard redirect, we would add it here.
    return '/dashboard'
  }

  return {
    isProfileComplete,
    hasPaid,
    getLandingRoute
  }
}
