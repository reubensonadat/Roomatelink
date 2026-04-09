import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Phase 12: Architectural Toy — The Metropolis Cycle
 * Featuring a 6-stage real estate progression with manual click-triggered construction.
 */
const DrawingHouseLoader: React.FC = () => {
  const [variation, setVariation] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // User-provided SVG Architecture Paths (Ordered from Townhouse to Metropolis)
  const architecturePaths = [
    "M19 21H5C4.44772 21 4 20.5523 4 20V11L1 11L11.3273 1.6115C11.7087 1.26475 12.2913 1.26475 12.6727 1.6115L23 11L20 11V20C20 20.5523 19.5523 21 19 21ZM13 19H18V9.15745L12 3.7029L6 9.15745V19H11V13H13V19Z", // Townhouse
    "M3 19V5.70046C3 5.27995 3.26307 4.90437 3.65826 4.76067L13.3291 1.24398C13.5886 1.14961 13.8755 1.28349 13.9699 1.54301C13.9898 1.59778 14 1.65561 14 1.71388V6.6667L20.3162 8.77211C20.7246 8.90822 21 9.29036 21 9.72079V19H23V21H1V19H3ZM5 19H12V3.85543L5 6.40089V19ZM19 19V10.4416L14 8.77488V19H19Z", // Mid-rise
    "M21 19H23V21H1V19H3V4C3 3.44772 3.44772 3 4 3H14C14.5523 3 15 3.44772 15 4V19H19V11H17V9H20C20.5523 9 21 9.44772 21 10V19ZM5 5V19H13V5H5ZM7 11H11V13H7V11ZM7 7H11V9H7V7Z", // Apartment A
    "M10 10.1111V1L21 7V21H3V7L10 10.1111ZM12 4.36908V13.1886L5 10.0775V19H19V8.18727L12 4.36908Z", // Modern High-Rise
    "M21 20H23V22H1V20H3V3C3 2.44772 3.44772 3 4 3H20C20.5523 2 21 2.44772 21 3V20ZM19 20V4H5V20H19ZM8 11H11V13H8V11ZM8 7H11V9H8V7ZM8 15H11V17H8V15ZM13 15H16V17H13V15ZM13 11H16V13H13V11ZM13 7H16V9H13V7Z", // Skyscraper A
    "M20 6H23V8H22V19H23V21H1V19H2V8H1V6H4V4C4 3.44772 4.44772 3 5 3H19C19.5523 3 20 3.44772 20 4V6ZM20 8H4V19H7V12H9V19H11V12H13V19H15V12H17V19H20V8ZM6 5V6H18V5H6Z" // Metropolis Skyline
  ];

  const handleNext = useCallback((e?: React.MouseEvent | React.TouchEvent) => {
    if (e) e.stopPropagation();
    setVariation((prev) => (prev + 1) % architecturePaths.length);
  }, [architecturePaths.length]);

  // Auto-cycle every 4 seconds (slightly slower to appreciate the complex paths)
  useEffect(() => {
    const timer = setInterval(handleNext, 4000);
    return () => clearInterval(timer);
  }, [handleNext]);

  return (
    <div className="flex flex-col items-center justify-center select-none">
      <div 
        className="relative w-28 h-28 cursor-pointer group flex items-center justify-center p-2"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleNext}
      >
        {/* Dynamic Bloom Effect */}
        <div className="absolute inset-4 bg-primary/10 rounded-full blur-3xl opacity-40 group-hover:opacity-60 transition-opacity" />
        
        <svg
          viewBox="0 0 24 24"
          className="relative w-full h-full fill-transparent stroke-current text-primary overflow-visible"
        >
          {/* Main Architectural Silhouette - Build & Dissolve Loop */}
          <AnimatePresence mode="popLayout">
            <motion.path
              key={variation}
              d={architecturePaths[variation]}
              strokeWidth="0.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0, opacity: 0, scale: 0.95 }}
              animate={{ 
                pathLength: [0, 1, 1, 0],
                pathOffset: [0, 0, 1, 1],
                opacity: [0, 1, 1, 0],
                scale: [0.95, 1, 1, 0.95]
              }}
              exit={{ 
                opacity: 0, 
                scale: 1.05,
                filter: "blur(8px)",
                transition: { duration: 0.4, ease: "easeIn" }
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: [0.22, 1, 0.36, 1],
                times: [0, 0.4, 0.6, 1]
              }}
              style={{
                filter: "drop-shadow(0 0 4px hsl(var(--primary) / 0.4))"
              }}
            />
          </AnimatePresence>

        </svg>

        {/* Registry ID - Boutique Hardware Label */}
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex flex-col items-center">
            <motion.span
                key={variation}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 0.5, y: 0 }}
                className="text-[9px] font-black tracking-[0.25em] text-primary uppercase whitespace-nowrap"
            >
                LOT-{String(variation + 1).padStart(3, '0')}
            </motion.span>
        </div>
      </div>
      
      {/* Interaction Hint */}
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered ? 0.3 : 0 }}
        className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground mt-2"
      >
        Click to Build Next
      </motion.p>
    </div>
  );
};

export default DrawingHouseLoader;
