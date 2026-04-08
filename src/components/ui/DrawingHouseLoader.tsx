import React from "react";

const DrawingHouseLoader: React.FC = () => {
  return (
    <div className="flex items-center justify-center">
      <svg
        viewBox="0 0 24 24"
        className="house-draw w-[45px] h-[45px] fill-transparent stroke-current text-indigo-600 stroke-[1.5px] stroke-linecap-round stroke-linejoin-round"
      >
        {/* Geometric House Path - Path length is calculated to 90 */}
        <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>

      <style>{`
        .house-draw {
          --pathlength: 90;
          stroke-dashoffset: var(--pathlength);
          stroke-dasharray: 0 var(--pathlength);
          animation: draw-house 4s cubic-bezier(0.5, 0.1, 0.5, 1) infinite both;
        }

        @keyframes draw-house {
          0% {
            stroke-dashoffset: var(--pathlength);
            stroke-dasharray: 0 var(--pathlength);
            opacity: 0.5;
          }
          50% {
            opacity: 1;
          }
          90%, 100% {
            stroke-dashoffset: 0;
            stroke-dasharray: var(--pathlength) 0;
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default DrawingHouseLoader;
