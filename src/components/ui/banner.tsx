"use client";

import { type HTMLAttributes, useEffect, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import * as React from "react";
import { buttonVariants } from "@/components/ui/button";

export type BannerVariant = "rainbow" | "normal" | "coral" | "teal";

export interface BannerProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * @defaultValue 3rem
   */
  height?: string;

  xColor?: string;

  /**
   * @defaultValue 'normal'
   */
  variant?: BannerVariant;

  /**
   * For rainbow variant only, customise the colors
   */
  rainbowColors?: string[];

  /**
   * Change layout banner height css variables
   *
   * @defaultValue true
   */
  changeLayout?: boolean;
}

export function Banner({
  id,
  xColor,
  variant = "normal",
  changeLayout = true,
  height = "3rem",
  rainbowColors = [
    "hsla(174, 100%, 21%, 0.65)", // Deep Teal
    "hsla(12, 89%, 62%, 0.65)",  // Warm Coral
    "hsla(174, 30%, 92%, 0.5)",   // Light Accent Teal
    "hsla(40, 20%, 98%, 0.4)",    // Warm Cream background
  ],
  ...props
}: BannerProps) {
  const [open, setOpen] = useState(true);
  const globalKey = id ? `nd-banner-${id}` : null;

  useEffect(() => {
    if (globalKey) {
      setOpen(localStorage.getItem(globalKey) !== "true");
    }
  }, [globalKey]);

  if (!open) return null;

  return (
    <div
      id={id}
      {...props}
      className={cn(
        "sticky top-0 z-40 flex flex-row items-center justify-center px-4 text-center text-sm font-medium transition-all duration-300",
        variant === "normal" && "bg-accent/40 text-foreground border-b border-border/40",
        variant === "rainbow" && "bg-background/80 text-foreground border-b border-border/20 backdrop-blur-md",
        variant === "coral" && "bg-secondary text-secondary-foreground",
        variant === "teal" && "bg-primary text-primary-foreground",
        !open && "hidden",
        props.className,
      )}
      style={{
        height,
      }}
    >
      {changeLayout && open ? (
        <style>
          {globalKey
            ? `:root:not(.${globalKey}) { --fd-banner-height: ${height}; --banner-height: ${height}; }`
            : `:root { --fd-banner-height: ${height}; --banner-height: ${height}; }`}
        </style>
      ) : null}
      {globalKey ? (
        <style>{`.${globalKey} #${id} { display: none; }`}</style>
      ) : null}
      {globalKey ? (
        <script
          dangerouslySetInnerHTML={{
            __html: `if (localStorage.getItem('${globalKey}') === 'true') document.documentElement.classList.add('${globalKey}');`,
          }}
        />
      ) : null}

      {variant === "rainbow"
        ? flow({
            colors: rainbowColors,
          })
        : null}
      
      <div className="relative z-10 flex items-center justify-center gap-2">
        {props.children}
      </div>

      {id ? (
        <button
          type="button"
          aria-label="Close Banner"
          onClick={() => {
            setOpen(false);
            if (globalKey) {
              localStorage.setItem(globalKey, "true");
              window.dispatchEvent(new Event("banner-status-changed"));
            }
          }}
          className={cn(
            buttonVariants({
              variant: "ghost",
              className:
                "absolute cursor-pointer end-2 md:end-10 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground hover:bg-accent/40 rounded-full",
              size: "icon",
            }),
          )}
        >
          <X className="h-4 w-4" color={xColor || "currentColor"} />
        </button>
      ) : null}
    </div>
  );
}

const maskImage =
  "linear-gradient(to bottom, white, transparent), radial-gradient(circle at top center, white, transparent)";

function flow({ colors }: { colors: string[] }) {
  return (
    <>
      <div
        className="absolute inset-0 z-[-1]"
        style={
          {
            maskImage,
            maskComposite: "intersect",
            WebkitMaskImage: maskImage,
            WebkitMaskComposite: "source-in",
            animation: "fd-moving-banner 20s linear infinite",
            backgroundImage: `repeating-linear-gradient(70deg, ${[...colors, colors[0]].map((color, i) => `${color} ${(i * 100) / (colors.length + 1)}%`).join(", ")})`,
            backgroundSize: "200% 100%",
            filter: "saturate(1.5)",
          } as object
        }
      />
      <style>
        {`@keyframes fd-moving-banner {
            from { background-position: 0% 0;  }
            to { background-position: 100% 0;  }
         }`}
      </style>
    </>
  );
}
