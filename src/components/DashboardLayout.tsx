import { useLocation, Outlet } from "react-router-dom"
import { Sidebar } from "./ui/Sidebar"
import { DashboardNav } from "./DashboardNav"
 
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
    <div className="flex min-h-screen relative bg-background transition-colors duration-300 overflow-x-hidden pt-[env(safe-area-inset-top,20px)]">
  
      {/* Desktop Left Sidebar */}
      <Sidebar />
  
      {/* Main Content Area — shifts right on desktop for 256px sidebar */}
      <div className={`flex-1 md:pl-64 flex flex-col min-h-screen ${isInsideChat ? 'pb-0' : 'pb-36 sm:pb-40'} md:pb-0`}>
        <main className={`flex-1 w-full bg-background ${isInsideChat ? '' : 'max-w-[480px]'} mx-auto md:max-w-none`}>
          <Outlet />
        </main>
      </div>
  
      {/* Mobile Bottom Tab Bar — hidden on unauthorized routes, inside chat, or when modal is open (Iron Curtain) */}
      {showNav && !isInsideChat && (
        <div className="md:hidden fixed bottom-6 left-6 right-6 z-50 bg-card border border-border shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-[24px] overflow-hidden transition-opacity duration-300 group-[.modal-open]:opacity-0 group-[.modal-open]:pointer-events-none [.modal-open_&]:hidden">
          <DashboardNav />
        </div>
      )}
    </div>
  )
}
