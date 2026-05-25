import React from 'react';
import { cn } from '@/lib/utils';

export interface PastelGradientBackgroundProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

export function PastelGradientBackground({ 
  children, 
  className,
  ...props 
}: PastelGradientBackgroundProps) {
  return (
    <div 
      className={cn("relative w-full overflow-hidden transition-colors duration-500", className)}
      {...props}
    >
      <style>
        {`
          @keyframes rotate {
            0% {
              transform: translate(-50%, -50%) rotate(0deg);
            }
            100% {
              transform: translate(-50%, -50%) rotate(360deg);
            }
          }
          @keyframes rotate-reverse {
            0% {
              transform: translate(-50%, -50%) rotate(0deg);
            }
            100% {
              transform: translate(-50%, -50%) rotate(-360deg);
            }
          }
          
          /* Conic gradient colors - Light Mode (Dreamy Pastels) */
          .pastel-bg-layer-1 {
            background: conic-gradient(
              from 0deg,
              #ff9aa2,
              #ffb7b2,
              #ffdac1,
              #e2f0cb,
              #a2e4ff,
              #c9afff,
              #ffb7b2,
              #ff9aa2
            );
            animation: rotate 20s linear infinite;
          }
          .pastel-bg-layer-2 {
            background: conic-gradient(
              from 0deg,
              #ff9aa2,
              #ffb7b2,
              #ffdac1,
              #e2f0cb,
              #a2e4ff,
              #c9afff,
              #ffb7b2,
              #ff9aa2
            );
            animation: rotate-reverse 24s linear infinite;
          }
          
          /* Conic gradient colors - Dark Mode (Teal and Coral Aurora) */
          .dark .pastel-bg-layer-1 {
            background: conic-gradient(
              from 0deg,
              #0d5c54, /* Deep Teal */
              #1d3557, /* Dark blue */
              #e76f51, /* Warm Coral */
              #0c1b23, /* Deep slate */
              #2a9d8f, /* Light Teal */
              #0d5c54
            );
          }
          .dark .pastel-bg-layer-2 {
            background: conic-gradient(
              from 0deg,
              #1e3a47,
              #0d5c54,
              #e76f51,
              #11252d,
              #1e3a47
            );
          }
        `}
      </style>

      {/* Container background color overlay */}
      <div 
        className="absolute inset-0 pointer-events-none bg-gradient-to-br from-primary/5 via-background to-accent/30 dark:from-background dark:via-background dark:to-background transition-colors duration-500"
      />

      {/* Rotating Layers */}
      {/* Light mode: 25% opacity for layer-1, 15% for layer-2 for soft blending. Dark mode: 12% and 8% for subtle glowing aurora */}
      <div className="absolute top-1/2 left-1/2 w-[220%] h-[220%] -translate-x-1/2 -translate-y-1/2 pointer-events-none overflow-hidden opacity-25 dark:opacity-12 blur-[80px] md:blur-[120px] transition-all duration-1000 pastel-bg-layer-1" />
      <div className="absolute top-1/2 left-1/2 w-[180%] h-[180%] -translate-x-1/2 -translate-y-1/2 pointer-events-none overflow-hidden opacity-15 dark:opacity-8 blur-[80px] md:blur-[120px] transition-all duration-1000 pastel-bg-layer-2" />

      {/* Radial overlay to smooth and blend it into the rest of the page */}
      <div 
        className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-transparent to-background"
      />

      {/* Content */}
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </div>
  );
}

export default PastelGradientBackground;
