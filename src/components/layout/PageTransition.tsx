import { Outlet, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'

/**
 * PageTransition - Layout Route wrapper that applies cinematic motion to all nested routes
 * 
 * Uses Framer Motion variants to create iOS-style page transitions:
 * - Subtle opacity crossfade (0.8 to 1)
 * - Gentle Y-axis translation (±10px)
 * - Micro-scale for depth perception (0.995 to 1)
 * - Premium iOS spring easing curve [0.22, 1, 0.36, 1]
 * 
 * This is a Layout Route component, so it renders <Outlet /> to display nested routes.
 * All routes wrapped by this component automatically inherit the transition effect.
 */

const pageVariants = {
  enter: {
    opacity: 0.8,
    y: 10,
    scale: 0.995,
    transition: {
      duration: 0.35,
      ease: [0.22, 1, 0.36, 1] // iOS spring-like bezier
    }
  },
  center: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: [0.22, 1, 0.36, 1]
    }
  },
  exit: {
    opacity: 0.8,
    y: -10,
    scale: 0.995,
    transition: {
      duration: 0.2, // Fast exit for snappy feel
      ease: [0.22, 1, 0.36, 1]
    }
  }
}

export function PageTransition() {
  const location = useLocation()

  return (
    <motion.div
      key={location.pathname}
      variants={pageVariants}
      initial="enter"
      animate="center"
      exit="exit"
      className="w-full h-full"
    >
      <Outlet />
    </motion.div>
  )
}
