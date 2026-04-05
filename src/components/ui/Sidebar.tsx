import { Link, useLocation } from "react-router-dom"
import { Users, MessageCircle, User, Settings, CheckCircle2 } from 'lucide-react'
import { cn } from "../../lib/utils"
import { useAuth } from "../../context/AuthContext"

const NAV_ITEMS = [
  { name: 'Matches', url: '/dashboard', icon: Users },
  { name: 'Messages', url: '/dashboard/messages', icon: MessageCircle },
  { name: 'Profile', url: '/dashboard/profile', icon: User },
  { name: 'Settings', url: '/dashboard/settings', icon: Settings }
]

export function Sidebar() {
  const { profile } = useAuth()
  const location = useLocation()
  
  // Logic from legacy for profile completion detection
  const isComplete = !!(profile?.course && profile?.level)
  
  return (
    <aside className="hidden md:flex flex-col w-64 h-screen fixed left-0 top-0 border-r border-border bg-background/50 backdrop-blur-xl z-40 p-6">
      
      {/* Brand */}
      <div className="flex flex-col mb-10 px-2">
        <Link to="/" className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
          <div className="w-9 h-9 bg-card rounded-[10px] flex items-center justify-center shadow-xs overflow-hidden p-[5px] border border-border/50">
            <img src="/logo.png" alt="Roommate Link" className="w-full h-full object-contain" />
          </div>
          <span className="font-bold text-lg tracking-tight text-foreground">Roommate Link</span>
        </Link>
      </div>

      <nav className="flex flex-col gap-2 flex-1 mt-4">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.url
          const Icon = item.icon
          return (
            <Link 
              key={item.name} 
              to={item.url}
              className={cn(
                "flex items-center gap-4 px-4 py-3 rounded-[1rem] font-medium text-[15px] transition-all duration-200",
                isActive 
                  ? "bg-foreground text-background shadow-xs font-semibold"
                  : "text-foreground/60 hover:bg-muted/60 hover:text-foreground"
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* Account Info at bottom */}
      <div className="mt-auto pt-6 flex items-center gap-3 px-3 cursor-pointer hover:opacity-75 transition-opacity">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center overflow-hidden border ${isComplete ? 'bg-primary/10 border-primary/20' : 'bg-muted border-border'}`}>
           {isComplete ? <CheckCircle2 className="w-5 h-5 text-primary" /> : <User className="w-5 h-5 text-foreground/50" />}
        </div>
        <div className="flex flex-col">
           <span className="text-sm font-bold leading-tight">Student Profile</span>
           <span className={`text-xs font-medium ${isComplete ? 'text-primary' : 'text-foreground/50'}`}>
             {isComplete ? 'Active Profile' : 'Pending Setup'}
           </span>
        </div>
      </div>
    </aside>
  )
}
