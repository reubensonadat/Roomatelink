import { ExpandableProfileHub } from './ExpandableProfileHub'

interface DashboardHeaderProps {
  userName: string
  avatarUrl?: string
  matchCount: number
  hasPaid: boolean
  onRefresh: () => void
  onNavigateToProfile: () => void
  onNavigateToSettings: () => void
}

export function DashboardHeader(props: DashboardHeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-20 pointer-events-none">
      <div className="w-full max-w-7xl mx-auto px-4 h-full flex items-center justify-between pointer-events-auto">
        <ExpandableProfileHub {...props} />
      </div>
    </header>
  )
}
