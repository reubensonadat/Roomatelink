"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/ui/sidebar"
import { DashboardNav } from "@/components/dashboard-nav"
import { PWAInstallPrompt } from "@/components/ui/pwa-install-prompt"


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname();
  // Hide bottom nav and extra padding when inside an active chat
  const isInsideChat = pathname.startsWith('/dashboard/messages/') && pathname !== '/dashboard/messages';

  return (
    <div className="flex min-h-screen relative bg-background transition-colors duration-300 overflow-x-hidden">

      {/* Desktop Left Sidebar */}
      <Sidebar />

      {/* Main Content Area — shifts right on desktop for the 256px sidebar */}
      <div className={`flex-1 md:pl-64 flex flex-col min-h-screen ${isInsideChat ? 'pb-0' : 'pb-20 sm:pb-24'} md:pb-0`}>
        <main className={`flex-1 w-full bg-background ${isInsideChat ? '' : 'max-w-[480px]'} mx-auto md:max-w-none`}>
          {children}
        </main>
      </div>

      {/* Mobile Bottom Tab Bar — hidden inside chat */}
      {!isInsideChat && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-t border-border/40">
          <DashboardNav />
        </div>
      )}

      <PWAInstallPrompt />

    </div>
  )
}
