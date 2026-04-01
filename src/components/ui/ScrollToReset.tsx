import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export function ScrollToReset() {
  const { pathname } = useLocation()

  useEffect(() => {
    // Standard Behavior: Scroll to top of window on every route change
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}
