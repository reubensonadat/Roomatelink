import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

// ─── Types ────────────────────────────────────────────────────────────────

interface UseFoundRoommatePromptReturn {
  isModalOpen: boolean
  dayNumber: number | null
  handleConfirm: () => Promise<void>
  handleClose: () => void
}

// ─── Constants ─────────────────────────────────────────────────────────────

const PROMPT_INTERVALS = [7, 30, 50] as const

const STORAGE_KEYS = {
  PROFILE_CREATED: 'roommate_profile_created_date',
  PROFILE_FOUND: 'roommate_found_roommate',
  PROMPT_SHOWN: 'roommate_prompt_shown',
} as const

// ─── Hook ─────────────────────────────────────────────────────────────────

export function useFoundRoommatePrompt(): UseFoundRoommatePromptReturn {
  const { profile } = useAuth()

  const [profileFoundRoommate, setProfileFoundRoommate] = useState(false)
  const [currentDayNumber, setCurrentDayNumber] = useState<number | null>(null)

  // ─── Found Roommate Logic Effect ────────────────────────────────────────
  useEffect(() => {
    if (profileFoundRoommate) return

    const profileCreatedStr = localStorage.getItem(STORAGE_KEYS.PROFILE_CREATED)
    const foundStatus = localStorage.getItem(STORAGE_KEYS.PROFILE_FOUND)

    // If already marked as found, sync state and exit
    if (foundStatus === 'true') {
      setProfileFoundRoommate(true)
      return
    }

    // Initialize profile creation date if not set
    if (!profileCreatedStr) {
      localStorage.setItem(STORAGE_KEYS.PROFILE_CREATED, Date.now().toString())
      return
    }

    // Calculate days since profile creation
    const profileCreatedDate = parseInt(profileCreatedStr)
    const daysSinceCreation = Math.floor((Date.now() - profileCreatedDate) / (1000 * 60 * 60 * 24))
    const promptShownStr = localStorage.getItem(STORAGE_KEYS.PROMPT_SHOWN)
    const lastShownDay = promptShownStr ? parseInt(promptShownStr) : -1

    // Find if we should show a prompt at this day
    const targetDay = PROMPT_INTERVALS.find(day => daysSinceCreation >= day && lastShownDay < day)

    if (targetDay) {
      setCurrentDayNumber(targetDay)
      localStorage.setItem(STORAGE_KEYS.PROMPT_SHOWN, targetDay.toString())
    }
  }, [profileFoundRoommate])

  // ─── Handlers ───────────────────────────────────────────────────────────

  const handleConfirm = async () => {
    if (!profile) return

    try {
      const { error } = await supabase
        .from('users')
        .update({ is_matched: true })
        .eq('id', profile.id)

      if (!error) {
        localStorage.setItem(STORAGE_KEYS.PROFILE_FOUND, 'true')
        setProfileFoundRoommate(true)
        setCurrentDayNumber(null)
      }
    } catch (err) {
      console.error('Failed to update roommate status:', err)
    }
  }

  const handleClose = () => {
    setCurrentDayNumber(null)
  }

  // ─── Return ─────────────────────────────────────────────────────────────

  return {
    isModalOpen: currentDayNumber !== null,
    dayNumber: currentDayNumber,
    handleConfirm,
    handleClose,
  }
}
