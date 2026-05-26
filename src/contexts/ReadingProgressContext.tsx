import React, { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useUserProgressList, useUpsertProgress } from "@/hooks/useUserProgress";

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
  const { user, isLoggedIn } = useAuth();
  const { data: dbProgressList } = useUserProgressList(user?.id);
  const upsertProgress = useUpsertProgress();
  
  const [progress, setProgressState] = useState<ReadingProgress>({});

  // Load progress from localStorage once hydrated on the client
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setProgressState(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse reading progress from localStorage", e);
      }
    }
  }, []);

  // Track whether DB data has been merged into state to prevent re-triggering
  const dbMergedRef = useRef(false);

  // Sync DB progress to state on load (only once)
  useEffect(() => {
    if (dbMergedRef.current) return; // Prevent re-merging
    if (isLoggedIn && dbProgressList) {
      const dbMap: ReadingProgress = {};
      dbProgressList.forEach(p => {
        dbMap[p.content_id] = p.progress_percent;
      });
      
      setProgressState(prev => {
        const merged = { ...prev, ...dbMap };
        // If state changed by merge, update localStorage
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        return merged;
      });
      dbMergedRef.current = true;
    }
  }, [isLoggedIn, dbProgressList]);

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [progress]);

  // Debounced DB Sync for progress
  const debounceTimerRef = useRef<Record<string, NodeJS.Timeout>>({});

  const setProgress = (postId: string, percent: number) => {
    const currentProgress = progress[postId] || 0;
    const newPercent = Math.min(100, Math.max(currentProgress, percent));
    
    if (newPercent <= currentProgress) return;

    // 1. Update local state instantly (Optimistic)
    setProgressState((prev) => ({
      ...prev,
      [postId]: newPercent,
    }));

    // 2. Sync to DB if logged in (Debounced)
    if (isLoggedIn && user?.id) {
      if (debounceTimerRef.current[postId]) {
        clearTimeout(debounceTimerRef.current[postId]);
      }

      debounceTimerRef.current[postId] = setTimeout(async () => {
        try {
          await upsertProgress.mutateAsync({
            userId: user.id,
            contentId: postId,
            progressPercent: newPercent,
            isRead: newPercent >= 100
          });
          delete debounceTimerRef.current[postId];
        } catch (error) {
          console.error('Failed to sync progress to DB:', error);
        }
      }, 3000); // 3 second debounce to avoid hitting DB on every scroll tick
    }
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
