import React from "react"
import { motion } from "framer-motion"
import { cn } from "../../lib/utils"


export interface OrbitalLoaderProps {
  message?: string
  messagePlacement?: "top" | "bottom" | "left" | "right"
}

export function OrbitalLoader({
  className,
  message,
  messagePlacement,
  ...props
}: React.ComponentProps<"div"> & OrbitalLoaderProps) {
  const placementClasses = {
    bottom: "flex-col",
    top: "flex-col-reverse",
    right: "flex-row",
    left: "flex-row-reverse",
  }[messagePlacement || "bottom"]

  return (
    <div className={cn("flex gap-2 items-center justify-center", placementClasses)}>
      <div className={cn("relative w-16 h-16", className)} {...props}>
        <motion.div
          className="absolute inset-0 border-2 border-transparent border-t-primary rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
        />
        <motion.div
          className="absolute inset-2 border-2 border-transparent border-t-primary rounded-full"
          animate={{ rotate: -360 }}
          transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
        />
        <motion.div
          className="absolute inset-4 border-2 border-transparent border-t-primary rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 0.8, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
        />
      </div>
      {message && <div>{message}</div>}
    </div>
  )
}
