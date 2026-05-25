import{o as a}from"./chunk-4N6VE7H7-BLQoz5xV.js";import{c as o}from"./utils-CytzSlOG.js";function i({children:e,className:r,...t}){return a.jsxs("div",{className:o("relative w-full overflow-hidden transition-colors duration-500",r),...t,children:[a.jsx("style",{children:`
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
          
          /* Conic gradient colors - Dark Mode (Teal & Coral Aurora) */
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
        `}),a.jsx("div",{className:"absolute inset-0 pointer-events-none bg-gradient-to-br from-primary/5 via-background to-accent/30 dark:from-background dark:via-background dark:to-background transition-colors duration-500"}),a.jsx("div",{className:"absolute top-1/2 left-1/2 w-[220%] h-[220%] -translate-x-1/2 -translate-y-1/2 pointer-events-none overflow-hidden opacity-25 dark:opacity-12 blur-[80px] md:blur-[120px] transition-all duration-1000 pastel-bg-layer-1"}),a.jsx("div",{className:"absolute top-1/2 left-1/2 w-[180%] h-[180%] -translate-x-1/2 -translate-y-1/2 pointer-events-none overflow-hidden opacity-15 dark:opacity-8 blur-[80px] md:blur-[120px] transition-all duration-1000 pastel-bg-layer-2"}),a.jsx("div",{className:"absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-transparent to-background"}),a.jsx("div",{className:"relative z-10 w-full h-full",children:e})]})}export{i as P};
