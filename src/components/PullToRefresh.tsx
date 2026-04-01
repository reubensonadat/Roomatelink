import { useEffect } from 'react'
import { toast } from 'sonner'

interface PullToRefreshProps {
  children: React.ReactNode
  onRefresh: () => Promise<void>
}

export function PullToRefresh({ children, onRefresh }: PullToRefreshProps) {
  useEffect(() => {
    let startY = 0
    let isPulling = false

    const handleTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY
      isPulling = false
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling) {
        const currentY = e.touches[0].clientY
        const diff = currentY - startY

        if (diff > 150 && diff < 300) {
          isPulling = true
        }
      }
    }

    const handleTouchEnd = async () => {
      if (isPulling) {
        await onRefresh()
      }
      isPulling = false
    }

    const element = document.getElementById('pull-to-refresh-container')
    if (element) {
      element.addEventListener('touchstart', handleTouchStart, { passive: true })
      element.addEventListener('touchmove', handleTouchMove, { passive: true })
      element.addEventListener('touchend', handleTouchEnd, { passive: true })

      return () => {
        element.removeEventListener('touchstart', handleTouchStart)
        element.removeEventListener('touchmove', handleTouchMove)
        element.removeEventListener('touchend', handleTouchEnd)
      }
    }
  }, [onRefresh])

  return (
    <div id="pull-to-refresh-container" className="flex-1 overflow-y-auto">
      {children}
    </div>
  )
}
