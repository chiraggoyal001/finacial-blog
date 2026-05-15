import React, { useState, useEffect } from 'react';
import { Timer } from 'lucide-react';

interface CountdownTimerProps {
  targetDate: string;
}

export const CountdownTimer = ({ targetDate }: CountdownTimerProps) => {
  const [timeLeft, setTimeLeft] = useState<any>(null);

  useEffect(() => {
    const calculate = () => {
      const difference = +new Date(targetDate) - +new Date();
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      } else {
        setTimeLeft(null);
      }
    };

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  if (!timeLeft) return null;

  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl bg-secondary/5 border border-secondary/20">
      <div className="p-2 rounded-full bg-secondary/10 text-secondary">
        <Timer className="h-5 w-5 animate-pulse" />
      </div>
      <div className="flex gap-4">
        {[
          { label: 'Days', value: timeLeft.days },
          { label: 'Hrs', value: timeLeft.hours },
          { label: 'Min', value: timeLeft.minutes },
          { label: 'Sec', value: timeLeft.seconds },
        ].map(item => (
          <div key={item.label} className="text-center">
            <p className="text-lg font-black text-foreground tabular-nums leading-none">{item.value.toString().padStart(2, '0')}</p>
            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-tighter mt-1">{item.label}</p>
          </div>
        ))}
      </div>
      <p className="text-xs font-medium text-muted-foreground ml-auto hidden sm:block">Until Start</p>
    </div>
  );
};
