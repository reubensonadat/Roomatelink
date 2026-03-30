"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Moon, Sun } from "lucide-react"
// @ts-ignore — react-dom types may not be installed
import { flushSync } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

export type ThemeTransitionType = "horizontal" | "vertical"

type AnimatedThemeToggleButtonProps = {
  type: ThemeTransitionType
  className?: string
}

function useThemeState() {
  const [darkMode, setDarkMode] = useState(false)

  // Initialize theme on mount to prevent SSR mismatch
  useEffect(() => {
    if (typeof window !== "undefined") {
      setDarkMode(document.documentElement.classList.contains("dark"))
    }
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return

    const sync = () => setDarkMode(document.documentElement.classList.contains("dark"))
    const observer = new MutationObserver(sync)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
    return () => observer.disconnect()
  }, [])

  return [darkMode, setDarkMode] as const
}

function triggerThemeTransition(type: ThemeTransitionType) {
  if (typeof window === "undefined" || typeof document === "undefined") return

  if (type === "horizontal") {
    document.documentElement.animate(
      {
        clipPath: [
          "inset(50% 0 50% 0)",
          "inset(0 0 0 0)"
        ]
      },
      {
        duration: 700,
        easing: "ease-in-out",
        pseudoElement: "::view-transition-new(root)",
      }
    )
  } else if (type === "vertical") {
    document.documentElement.animate(
      {
        clipPath: [
          "inset(0 50% 0 50%)",
          "inset(0 0 0 0)"
        ]
      },
      {
        duration: 700,
        easing: "ease-in-out",
        pseudoElement: "::view-transition-new(root)",
      }
    )
  }
}

export const AnimatedThemeToggleButton = ({
  type,
  className
}: AnimatedThemeToggleButtonProps) => {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [darkMode, setDarkMode] = useThemeState()

  const handleToggle = useCallback(async () => {
    if (!buttonRef.current) return

    const toggled = !darkMode

    // Check if View Transition API is supported
    if (typeof document.startViewTransition === 'function') {
      try {
        await document.startViewTransition(() => {
          flushSync(() => {
            setDarkMode(toggled)
            document.documentElement.classList.toggle("dark", toggled)
            localStorage.setItem("theme", toggled ? "dark" : "light")
          })
        }).ready

        triggerThemeTransition(type)
      } catch {
        // Fallback if view transition fails
        setDarkMode(toggled)
        document.documentElement.classList.toggle("dark", toggled)
        localStorage.setItem("theme", toggled ? "dark" : "light")
      }
    } else {
      // Simple fallback for unsupported browsers
      setDarkMode(toggled)
      document.documentElement.classList.toggle("dark", toggled)
      localStorage.setItem("theme", toggled ? "dark" : "light")
    }
  }, [darkMode, type, setDarkMode])

  return (
    <button
      ref={buttonRef}
      onClick={handleToggle}
      aria-label={`Toggle theme - ${type}`}
      type="button"
      className={cn(
        "flex items-center justify-center p-2 rounded-full outline-none focus:outline-none active:outline-none focus:ring-0 cursor-pointer border mx-3 transition-colors",
        darkMode ? "bg-neutral-900 border-neutral-700" : "bg-white border-border",
        className
      )}
      style={{ width: 44, height: 44 }}
    >
      <AnimatePresence mode="wait" initial={false}>
        {darkMode ? (
          <motion.span
            key="sun"
            initial={{ opacity: 0, scale: 0.55, rotate: 25 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.33 }}
            className="text-yellow-400"
          >
            <Sun />
          </motion.span>
        ) : (
          <motion.span
            key="moon"
            initial={{ opacity: 0, scale: 0.55, rotate: -25 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.33 }}
            className="text-blue-900"
          >
            <Moon />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  )
}
