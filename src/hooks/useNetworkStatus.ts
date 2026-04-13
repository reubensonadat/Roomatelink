import { useState, useEffect } from 'react'

export type NetworkStatus = 'online' | 'offline'

interface UseNetworkStatusReturn {
  isOnline: boolean
  status: NetworkStatus
}

/**
 * Hook to track browser network connectivity status.
 * 
 * Uses navigator.onLine for initial state and listens to online/offline events
 * to detect network changes. This is critical for mobile devices where TCP
 * connections can hang without proper detection.
 * 
 * @returns {UseNetworkStatusReturn} Object containing isOnline boolean and status string
 */
export function useNetworkStatus(): UseNetworkStatusReturn {
  const [isOnline, setIsOnline] = useState(() => {
    // Initialize with current browser state
    if (typeof navigator !== 'undefined' && 'onLine' in navigator) {
      return navigator.onLine
    }
    return true // Default to online if navigator not available
  })

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    // Listen for network state changes
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return {
    isOnline,
    status: isOnline ? 'online' : 'offline',
  }
}
