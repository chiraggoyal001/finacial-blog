import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface ReadingProgress {
  [postId: string]: number; // 0-100 percentage
}

interface ReadingProgressContextType {
  progress: ReadingProgress;
  setProgress: (postId: string, percent: number) => void;
  getProgress: (postId: string) => number;
  isRead: (postId: string) => boolean;
}

const ReadingProgressContext = createContext<ReadingProgressContextType | undefined>(undefined);

const STORAGE_KEY = "reading-progress";

export const ReadingProgressProvider = ({ children }: { children: ReactNode }) => {
  const [progress, setProgressState] = useState<ReadingProgress>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return {};
        }
      }
    }
    return {};
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [progress]);

  const setProgress = (postId: string, percent: number) => {
    setProgressState((prev) => ({
      ...prev,
      [postId]: Math.min(100, Math.max(prev[postId] || 0, percent)),
    }));
  };

  const getProgress = (postId: string) => progress[postId] || 0;
  const isRead = (postId: string) => (progress[postId] || 0) >= 100;

  return (
    <ReadingProgressContext.Provider value={{ progress, setProgress, getProgress, isRead }}>
      {children}
    </ReadingProgressContext.Provider>
  );
};

export const useReadingProgress = () => {
  const context = useContext(ReadingProgressContext);
  if (!context) throw new Error("useReadingProgress must be used within ReadingProgressProvider");
  return context;
};
