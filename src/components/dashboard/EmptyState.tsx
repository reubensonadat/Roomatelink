import { Inbox } from 'lucide-react'

interface EmptyStateProps {
  onRefresh: () => void
}

export function EmptyState({ onRefresh }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-24 h-24 rounded-full bg-muted/20 flex items-center justify-center mb-6">
        <Inbox className="w-12 h-12 text-muted-foreground/60" />
      </div>
      <h2 className="text-xl font-bold text-foreground">No matches yet</h2>
      <p className="text-center text-muted-foreground max-w-md mt-2">
        We're still finding compatible roommates for you. Complete your questionnaire to get started!
      </p>
      <button
        onClick={onRefresh}
        className="mt-8 px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-all"
      >
        Check Back Later
      </button>
    </div>
  )
}
