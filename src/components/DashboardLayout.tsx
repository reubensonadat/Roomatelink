import { useLocation, Outlet } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { DashboardNav } from "./dashboard/DashboardNav"
import { Sidebar } from "./dashboard/Sidebar"
 
export function DashboardLayout() {
  const location = useLocation()
  
  // Navigation visibility logic: Only show on specific Hub pages as requested
  const allowedNavRoutes = [
    '/dashboard',
    '/dashboard/settings',
    '/dashboard/profile',
    '/dashboard/messages',
    '/profile',
    '/settings',
  ]
  
  const showNav = allowedNavRoutes.some(route => 
    location.pathname === route || location.pathname.startsWith(route)
  )

  // Hide for transactional focus states like deep chat
  const isInsideChat = location.pathname.startsWith('/dashboard/messages/') && location.pathname !== '/dashboard/messages'
  
  return (
    <div 
      className="flex min-h-screen relative bg-background transition-colors duration-300 overflow-x-hidden pt-[env(safe-area-inset-top,4rem)] group"
      data-modal-open={document.body.classList.contains('modal-open')}
    >
      {/* Desktop Left Sidebar — only for authorized routes */}
      {showNav && <Sidebar />}
  
      {/* Main Content Area — shifts right on desktop for the 256px sidebar */}
      <div className={`flex-1 flex flex-col min-h-screen ${showNav ? 'md:pl-64' : ''} ${isInsideChat ? 'pb-0' : 'pb-36 sm:pb-40'} md:pb-0`}>
        <main className={`flex-1 w-full bg-background ${isInsideChat ? '' : 'max-w-[480px]'} mx-auto md:max-w-none relative`}>
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ 
                type: "spring",
                stiffness: 400,
                damping: 35,
                mass: 0.8
              }}
              className="w-full h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
  
      {/* Mobile Bottom Tab Bar — hidden inside chat, on desktop, or when modal is open */}
      <div className="md:hidden">
        {showNav && !isInsideChat && (
          <DashboardNav />
        )}
      </div>
    </div>
  )
}
