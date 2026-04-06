import React from "react";
import { Lightbulb } from "lucide-react";

interface ProTipProps {
  children: React.ReactNode;
}

const ProTip = ({ children }: ProTipProps) => (
  <div className="relative my-6 rounded-xl border border-secondary/30 bg-gradient-to-r from-secondary/5 via-secondary/10 to-secondary/5 p-4 pl-12 overflow-hidden">
    <div className="absolute left-3 top-4 w-6 h-6 rounded-full bg-secondary/20 flex items-center justify-center">
      <Lightbulb className="h-3.5 w-3.5 text-secondary" />
    </div>
    <div className="absolute top-0 left-0 w-1 h-full bg-secondary rounded-l-xl" />
    <p className="text-xs font-semibold uppercase tracking-wider text-secondary mb-1">Pro Tip</p>
    <div className="text-sm text-foreground/90 leading-relaxed">{children}</div>
  </div>
);

export default ProTip;
