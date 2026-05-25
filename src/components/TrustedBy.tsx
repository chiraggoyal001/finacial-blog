import React from "react";
import { ShieldCheck, GraduationCap, Star } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

export function TrustedBy() {
  const { t } = useTranslation();

  return (
    <div className="w-full mt-12 pt-8 border-t border-border/30 space-y-10">
      
      {/* Logos Cloud */}
      <div className="text-center space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/70 dark:text-muted-foreground/60">
          {t("home.trustedBy")}
        </h3>
        
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 md:gap-x-16 pt-2">
          
          {/* Zerodha Logo */}
          <div className="group flex items-center gap-2 cursor-pointer transition-all duration-300 transform hover:scale-105">
            <svg 
              className="h-6 w-6 text-muted-foreground/50 dark:text-muted-foreground/40 group-hover:text-[#387ed1] transition-colors duration-300"
              viewBox="0 0 24 24" 
              fill="currentColor"
            >
              {/* Custom Kite-like SVG shape representing Zerodha */}
              <path d="M12 2L2 12h5v10h10V12h5L12 2zm1 14h-2v-4h2v4zm0-6h-2V8h2v2z" />
            </svg>
            <span className="font-display font-bold text-sm tracking-widest text-muted-foreground/60 dark:text-muted-foreground/50 group-hover:text-[#387ed1] transition-colors duration-300">
              ZERODHA
            </span>
          </div>

          {/* Groww Logo */}
          <div className="group flex items-center gap-2 cursor-pointer transition-all duration-300 transform hover:scale-105">
            <div className="h-6 w-6 rounded-full bg-muted-foreground/20 dark:bg-muted-foreground/10 group-hover:bg-[#00d09c]/10 flex items-center justify-center transition-all duration-300">
              <svg 
                className="h-3.5 w-3.5 text-muted-foreground/60 dark:text-muted-foreground/50 group-hover:text-[#00d09c] transition-colors duration-300"
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="3.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M18 20V10M12 20V4M6 20v-6" />
              </svg>
            </div>
            <span className="font-sans font-extrabold text-base tracking-tight text-muted-foreground/60 dark:text-muted-foreground/50 group-hover:text-[#00d09c] transition-colors duration-300">
              groww
            </span>
          </div>

          {/* Bloomberg Logo */}
          <div className="group cursor-pointer transition-all duration-300 transform hover:scale-105">
            <span className="font-display font-black text-base tracking-tighter text-muted-foreground/50 dark:text-muted-foreground/40 group-hover:text-foreground transition-colors duration-300">
              Bloomberg
            </span>
          </div>

          {/* Moneycontrol Logo */}
          <div className="group flex items-center gap-1 cursor-pointer transition-all duration-300 transform hover:scale-105">
            <span className="font-sans font-bold text-sm tracking-tight text-muted-foreground/50 dark:text-muted-foreground/40 group-hover:text-[#f39c12] transition-colors duration-300">
              money
            </span>
            <span className="font-sans font-light text-sm tracking-tight text-muted-foreground/60 dark:text-muted-foreground/50 group-hover:text-[#f39c12] group-hover:font-semibold transition-colors duration-300">
              control
            </span>
            <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 dark:bg-muted-foreground/40 group-hover:bg-[#e74c3c] transition-colors duration-300" />
          </div>

          {/* Upstox Logo */}
          <div className="group flex items-center gap-2 cursor-pointer transition-all duration-300 transform hover:scale-105">
            <svg 
              className="h-5 w-5 text-muted-foreground/50 dark:text-muted-foreground/40 group-hover:text-[#4d2d8f] transition-colors duration-300"
              viewBox="0 0 24 24" 
              fill="currentColor"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2h2v1.93zm6.9-2.53c-.26-.81-1-1.4-1.9-1.4h-1v-3c0-.55-.45-1-1-1h-6v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 1.83-.62 3.51-1.67 4.88z" />
            </svg>
            <span className="font-sans font-bold text-sm tracking-wider text-muted-foreground/60 dark:text-muted-foreground/50 group-hover:text-[#4d2d8f] transition-colors duration-300">
              upstox
            </span>
          </div>

        </div>
      </div>

      {/* Trust Badges Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-5xl mx-auto pt-4 px-2">
        
        {/* Badge 1: 100% Fact Checked */}
        <div className="flex items-center gap-4 bg-card/40 backdrop-blur-md dark:bg-card/15 border border-border/40 dark:border-border/10 rounded-2xl p-4 shadow-elevation-1 hover:-translate-y-1 hover:shadow-elevation-2 hover:border-primary/20 dark:hover:border-primary/20 transition-all duration-300 group">
          <div className="h-10 w-10 rounded-xl bg-primary/10 dark:bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
            <ShieldCheck className="h-5.5 w-5.5" />
          </div>
          <div>
            <h4 className="font-display font-bold text-sm text-foreground">
              {t("home.badgeVerified")}
            </h4>
            <p className="text-xs text-muted-foreground">
              {t("home.badgeVerifiedDesc")}
            </p>
          </div>
        </div>

        {/* Badge 2: Structured learning path */}
        <div className="flex items-center gap-4 bg-card/40 backdrop-blur-md dark:bg-card/15 border border-border/40 dark:border-border/10 rounded-2xl p-4 shadow-elevation-1 hover:-translate-y-1 hover:shadow-elevation-2 hover:border-primary/20 dark:hover:border-primary/20 transition-all duration-300 group">
          <div className="h-10 w-10 rounded-xl bg-primary/10 dark:bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
            <GraduationCap className="h-5.5 w-5.5" />
          </div>
          <div>
            <h4 className="font-display font-bold text-sm text-foreground">
              {t("home.badgeCompliant")}
            </h4>
            <p className="text-xs text-muted-foreground">
              {t("home.badgeCompliantDesc")}
            </p>
          </div>
        </div>

        {/* Badge 3: Rating */}
        <div className="flex items-center gap-4 bg-card/40 backdrop-blur-md dark:bg-card/15 border border-border/40 dark:border-border/10 rounded-2xl p-4 shadow-elevation-1 hover:-translate-y-1 hover:shadow-elevation-2 hover:border-secondary/20 dark:hover:border-secondary/20 transition-all duration-300 group">
          <div className="h-10 w-10 rounded-xl bg-secondary/10 dark:bg-secondary/5 flex items-center justify-center text-secondary group-hover:bg-secondary group-hover:text-secondary-foreground transition-all duration-300">
            <Star className="h-5.5 w-5.5 fill-current" />
          </div>
          <div>
            <h4 className="font-display font-bold text-sm text-foreground">
              {t("home.badgeRating")}
            </h4>
            <p className="text-xs text-muted-foreground">
              {t("home.badgeRatingDesc")}
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}

export default TrustedBy;
