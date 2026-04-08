import { AnimatePresence } from 'framer-motion'
import type { ReactNode } from 'react'

interface AnimatedRoutesProps {
  children: ReactNode
}

/**
 * AnimatedRoutes - Orchestrates page transitions using React Router v6
 *
 * Wraps Routes in AnimatePresence with mode="wait" to ensure exit animations
 * complete before enter animations begin. The PageTransition Layout Route
 * component handles location tracking internally via useLocation().
 */
export function AnimatedRoutes({ children }: AnimatedRoutesProps) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      {children}
    </AnimatePresence>
  )
}
