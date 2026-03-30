"use client";

import React, { useState, useCallback } from "react";
import { motion, useMotionValue, useTransform, useAnimation } from "framer-motion";

interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh?: () => Promise<void>;
  className?: string;
}

export function PullToRefresh({ children, onRefresh, className = "" }: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const y = useMotionValue(0);
  const controls = useAnimation();

  // Spinner opacity and rotation tied to drag distance
  const spinnerOpacity = useTransform(y, [0, 60], [0, 1]);
  const spinnerScale = useTransform(y, [0, 60], [0.5, 1]);
  const spinnerRotation = useTransform(y, [0, 100], [0, 360]);

  const handleDragEnd = useCallback(async () => {
    const currentY = y.get();

    if (currentY > 60 && !isRefreshing) {
      setIsRefreshing(true);

      // Hold position while "refreshing"
      await controls.start({ y: 60, transition: { type: "spring", stiffness: 400, damping: 30 } });

      // Simulate refresh
      if (onRefresh) {
        await onRefresh();
      } else {
        await new Promise(resolve => setTimeout(resolve, 1200));
      }

      setIsRefreshing(false);
    }

    // Snap back
    controls.start({ y: 0, transition: { type: "spring", stiffness: 400, damping: 30 } });
  }, [y, isRefreshing, controls, onRefresh]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Spinner indicator */}
      <motion.div
        style={{ opacity: spinnerOpacity, scale: spinnerScale }}
        className="absolute top-0 left-0 right-0 flex justify-center pt-4 z-30 pointer-events-none"
      >
        <motion.div
          style={{ rotate: isRefreshing ? undefined : spinnerRotation }}
          animate={isRefreshing ? { rotate: 360 } : {}}
          transition={isRefreshing ? { repeat: Infinity, duration: 0.8, ease: "linear" } : {}}
          className="w-8 h-8 rounded-full border-[3px] border-primary border-t-transparent"
        />
      </motion.div>

      {/* Draggable content */}
      <motion.div
        style={{ y }}
        animate={controls}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.4 }}
        onDragEnd={handleDragEnd}
        className="w-full"
      >
        {children}
      </motion.div>
    </div>
  );
}
