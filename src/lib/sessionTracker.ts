/**
 * Session Signal Tracker — Frontend Context Capture
 * 
 * Sends browsing signals to the chatbot backend for the 48-hour
 * behavioral context window. Used by the proactive nudge engine.
 * 
 * Signals tracked:
 * - Page views (article slug, depth, time)
 * - Scroll depth (real-time)
 * - Calculator usage
 * - Search queries (3+ words)
 * - Return visits
 */

const CHATBOT_API_URL = import.meta.env.VITE_CHATBOT_API_URL || "http://localhost:8000";

// Debounce helper
function debounce<T extends (...args: unknown[]) => void>(fn: T, ms: number): T {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return ((...args: unknown[]) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  }) as T;
}

/**
 * Send a session signal to the backend.
 * Fires and forgets — never blocks the UI.
 */
async function sendSignal(userId: string, signalType: string, payload: Record<string, unknown>) {
  try {
    await fetch(`${CHATBOT_API_URL}/api/session-signal`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        signal_type: signalType,
        payload,
      }),
    });
  } catch {
    // Silently fail — signals are best-effort
  }
}

/**
 * Track scroll depth on an article page.
 * Reports the maximum depth reached.
 */
export function trackScrollDepth(userId: string, slug: string) {
  let maxDepth = 0;
  let startTime = Date.now();
  let lastReportedDepth = 0;

  const handleScroll = debounce(() => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    
    if (docHeight <= 0) return;
    
    const depth = Math.min(100, Math.round((scrollTop / docHeight) * 100));
    maxDepth = Math.max(maxDepth, depth);

    // Report every 20% increment
    if (maxDepth - lastReportedDepth >= 20) {
      lastReportedDepth = maxDepth;
      sendSignal(userId, "scroll_depth", {
        slug,
        depth: maxDepth,
        time_spent: Math.round((Date.now() - startTime) / 1000),
      });
    }
  }, 500);

  window.addEventListener("scroll", handleScroll, { passive: true });

  // Report on page leave
  const handleLeave = () => {
    const timeSpent = Math.round((Date.now() - startTime) / 1000);
    
    // Use sendBeacon for reliable delivery on page exit
    if (navigator.sendBeacon) {
      navigator.sendBeacon(
        `${CHATBOT_API_URL}/api/session-signal`,
        JSON.stringify({
          user_id: userId,
          signal_type: "page_view",
          payload: {
            slug,
            depth: maxDepth,
            time_spent: timeSpent,
          },
        })
      );
    }
  };

  // Visibility change (tab switch / minimize)
  const handleVisibility = () => {
    if (document.visibilityState === "hidden") {
      handleLeave();
    }
  };

  window.addEventListener("beforeunload", handleLeave);
  document.addEventListener("visibilitychange", handleVisibility);

  // Cleanup function
  return () => {
    window.removeEventListener("scroll", handleScroll);
    window.removeEventListener("beforeunload", handleLeave);
    document.removeEventListener("visibilitychange", handleVisibility);
  };
}

/**
 * Track calculator usage.
 */
export function trackCalculatorUse(
  userId: string,
  calculatorType: string,
  inputs: Record<string, unknown>,
  result?: unknown,
) {
  sendSignal(userId, "calc_use", {
    calculator_type: calculatorType,
    inputs,
    result,
  });
}

/**
 * Track search queries (3+ words only).
 */
export function trackSearch(userId: string, query: string) {
  const words = query.trim().split(/\s+/);
  if (words.length < 3) return; // Skip short queries

  sendSignal(userId, "search", { query: query.trim() });
}

/**
 * Track return visits to an article.
 */
export function trackReturnVisit(userId: string, slug: string) {
  // Check localStorage for previous visit
  const visitKey = `chatbot_visited_${slug}`;
  const previousVisit = localStorage.getItem(visitKey);

  if (previousVisit) {
    sendSignal(userId, "return_visit", { slug });
  }

  localStorage.setItem(visitKey, new Date().toISOString());
}

/**
 * Initialize all tracking for an article page.
 * Call this from the article page component's useEffect.
 */
export function initArticleTracking(userId: string | null, slug: string, tags: string[] = []) {
  if (!userId) return () => {};

  // Track return visit
  trackReturnVisit(userId, slug);

  // Track scroll depth (returns cleanup function)
  const cleanupScroll = trackScrollDepth(userId, slug);

  // Track initial page view
  sendSignal(userId, "page_view", {
    slug,
    tags,
    depth: 0,
    time_spent: 0,
  });

  return cleanupScroll;
}
