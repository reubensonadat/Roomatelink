import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";

// Custom SVG icons for a premium, non-generic feel
function MatchesIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round" fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.15 : 0} />
      <path d="M5 21v-2a4 4 0 0 1 4-4h2a4 4 0 0 1 4 4v2" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChatIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round" fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.15 : 0} />
    </svg>
  );
}

function ProfileIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="8" r="5" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.15 : 0} />
      <path d="M20 21a8 8 0 1 0-16 0" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SettingsIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2Z" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.15 : 0} />
    </svg>
  );
}

const NAV_ITEMS = [
  { name: 'Matches', url: '/dashboard', Icon: MatchesIcon },
  { name: 'Messages', url: '/dashboard/messages', Icon: ChatIcon },
  { name: 'Profile', url: '/dashboard/profile', Icon: ProfileIcon },
  { name: 'Settings', url: '/dashboard/settings', Icon: SettingsIcon }
];

export function DashboardNav() {
  const location = useLocation();
  
  // Smart dynamic index matching for React Router
  const activeIndex = NAV_ITEMS.reduce((bestIndex, item, index) => {
    const isDirectMatch = location.pathname === item.url;
    const isSubPathMatch = location.pathname.startsWith(item.url) && item.url !== '/dashboard';
    const isAliasMatch = (item.name === 'Profile' && location.pathname.includes('profile')) ||
                         (item.name === 'Settings' && location.pathname.includes('settings'));

    if (isDirectMatch || isSubPathMatch || isAliasMatch) {
      if (bestIndex === -1 || item.url.length > NAV_ITEMS[bestIndex].url.length) {
        return index;
      }
    }
    // Handle the root /dashboard path specifically
    if (location.pathname === '/dashboard' && item.url === '/dashboard') return index;
    return bestIndex;
  }, -1);

  return (
    <nav className="fixed bottom-4 sm:bottom-6 left-4 right-4 z-50 bg-background/95 backdrop-blur-xl border border-border/50 max-w-[480px] mx-auto rounded-[24px] shadow-[0_20px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_20px_40px_rgba(0,0,0,0.4)] transition-all duration-300 group-data-[modal-open=true]:opacity-0 group-data-[modal-open=true]:pointer-events-none group-data-[modal-open=true]:translate-y-20 md:bottom-8">
      <div className="relative flex items-center justify-around h-[68px] sm:h-[72px] px-1">
        {NAV_ITEMS.map((item, i) => {
          const isActive = i === activeIndex;
          return (
            <Link
              key={item.name}
              to={item.url}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 py-1 relative z-10 min-h-[44px] min-w-[44px]"
            >
              {/* Animated background pill */}
              <div className="relative flex items-center justify-center">
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-primary/10 rounded-[22px]"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <motion.div
                  className="relative p-1.5 sm:p-2 z-10"
                  animate={{
                    scale: isActive ? 1 : 0.9,
                    y: isActive ? -2 : 0,
                  }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                >
                  <item.Icon active={isActive} />
                </motion.div>
              </div>
              <motion.span
                animate={{
                  opacity: isActive ? 1 : 0.5,
                  scale: isActive ? 1 : 0.95,
                }}
                transition={{ duration: 0.2 }}
                className={`text-[9px] sm:text-[10px] font-bold ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
              >
                {item.name}
              </motion.span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
