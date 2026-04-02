interface DashboardHeaderProps {
  matchCount: number
}

export function DashboardHeader({ matchCount }: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/40 px-4 sm:px-5 pt-safe-top pb-4">
      <div className="w-full max-w-2xl lg:max-w-4xl mx-auto">
        <h1 className="text-[24px] sm:text-[28px] md:text-[32px] lg:text-[34px] font-black tracking-tight text-foreground leading-tight flex items-center gap-2 sm:gap-3">
          Top Matches
        </h1>
        <p className="text-[13px] sm:text-[14px] md:text-[15px] font-bold text-muted-foreground mt-1">
          {matchCount} highly compatible roommates found.
        </p>
      </div>
    </header>
  )
}
