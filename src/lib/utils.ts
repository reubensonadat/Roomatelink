import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ─── Tier Info Utility ────────────────────────────────────────────────────

export interface TierInfo {
  label: string
  color: string
  stroke: string
  textColor: string
  bgLight: string
  icon: string
}

export function getTierInfo(pct: number): TierInfo {
  if (pct >= 90) return { label: 'Exceptional', color: 'text-emerald-500', stroke: '#10b981', textColor: 'text-emerald-600 dark:text-emerald-400', bgLight: 'bg-emerald-500/10', icon: '🔥' }
  if (pct >= 80) return { label: 'Strong', color: 'text-green-500', stroke: '#22c55e', textColor: 'text-green-600 dark:text-green-400', bgLight: 'bg-green-500/10', icon: '💚' }
  if (pct >= 70) return { label: 'Good', color: 'text-amber-500', stroke: '#f59e0b', textColor: 'text-amber-600 dark:text-amber-400', bgLight: 'bg-amber-500/10', icon: '💛' }
  return { label: 'Potential', color: 'text-slate-400', stroke: '#94a3b8', textColor: 'text-slate-500 dark:text-slate-400', bgLight: 'bg-slate-400/10', icon: '⚪' }
}

// ─── Audio & Haptic Utilities ─────────────────────────────────────────────

const CLICK_SOUND = "data:audio/wav;base64,UklGRl9vT19XQVZFRm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YTdvT18AZABkAGQAZABkAGQAZABkAGQAZABkAGQAZABkAGQAZABkAGQAZABkAGQAZABkAGQAZABkAGQAZABkAGQAZABkAGQAZABkAGQAZABkAGQAZABkAGQAZABkAGQAZABkAGQAZABkAGQAZABkAGQAZABkAGQAZABkAGQAZABkAGQAZABkAGQAZABkAGQAZABkAGQAZABkAGQAZABkAGQAZABkAGQAZABkAGQAZABkAGQAZABkAGQAZABkAGQAZABkAGQAZABkAGQAZABkAGQAZABkAGQAZABkAGQAZABkAGQAZABkAGQAZABkAGQAZABk"

export const playClickSound = () => {
  try {
    const audio = new Audio(CLICK_SOUND)
    audio.volume = 0.2
    audio.play()
    if (navigator.vibrate) {
      navigator.vibrate(10) // 10ms haptic feedback
    }
  } catch (e) {
    console.warn("Audio playback failed:", e)
  }
}
