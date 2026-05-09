import { supabase } from "./supabase";

// Activity types for tracking user behavior
export type ActivityType =
  | "page_view"
  | "article_read"
  | "article_like"
  | "video_watch"
  | "video_complete"
  | "quiz_start"
  | "quiz_complete"
  | "quiz_abandon"
  | "module_start"
  | "module_complete"
  | "chapter_complete"
  | "search"
  | "event_view"
  | "event_register"
  | "newsletter_subscribe"
  | "newsletter_unsubscribe"
  | "chatbot_open"
  | "chatbot_message"
  | "feedback_submit"
  | "profile_update"
  | "onboarding_complete"
  | "onboarding_skip"
  | "login"
  | "logout"
  | "signup";

export type EntityType =
  | "article"
  | "video"
  | "module"
  | "chapter"
  | "quiz"
  | "event"
  | "page"
  | "search"
  | "chatbot"
  | "profile";

// Generate a session ID for grouping activities
const getSessionId = () => {
  let sessionId = sessionStorage.getItem("analytics_session_id");
  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem("analytics_session_id", sessionId);
  }
  return sessionId;
};

// Track a user activity
export const trackActivity = async (
  actionType: ActivityType,
  entityType?: EntityType,
  entityId?: string,
  entityTitle?: string,
  metadata?: Record<string, any>
): Promise<void> => {
  try {
    // Get current session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return; // Only track logged-in users

    // Get IP address (optional, will fail silently if unavailable)
    let ipAddress = null;
    try {
      const response = await fetch("https://api.ipify.org?format=json");
      const data = await response.json();
      ipAddress = data.ip;
    } catch {
      // IP fetch failed, continue without it
    }

    // Insert activity record
    const { error } = await supabase.from("user_activities").insert({
      user_id: session.user.id,
      action_type: actionType,
      entity_type: entityType || null,
      entity_id: entityId || null,
      entity_title: entityTitle || null,
      metadata: metadata || {},
      session_id: getSessionId(),
      ip_address: ipAddress,
      user_agent: navigator.userAgent,
    });

    if (error) {
      console.error("Error tracking activity:", error);
    }
  } catch (error) {
    // Silently fail - analytics should not break the app
    console.error("Analytics tracking error:", error);
  }
};

// React hook for easy tracking in components
export const useAnalytics = () => {
  return {
    // Page and navigation tracking
    trackPageView: (page: string, title?: string) =>
      trackActivity("page_view", "page", page, title),

    // Content engagement
    trackArticleRead: (articleId: string, articleTitle: string, durationSeconds?: number) =>
      trackActivity("article_read", "article", articleId, articleTitle, {
        duration: durationSeconds,
        timestamp: new Date().toISOString(),
      }),

    trackArticleLike: (articleId: string, articleTitle: string) =>
      trackActivity("article_like", "article", articleId, articleTitle),

    // Video tracking
    trackVideoWatch: (videoId: string, videoTitle: string, watchPercent: number) =>
      trackActivity(
        watchPercent >= 90 ? "video_complete" : "video_watch",
        "video",
        videoId,
        videoTitle,
        { watchPercent, timestamp: new Date().toISOString() }
      ),

    // Quiz tracking
    trackQuizStart: (quizId: string, quizTitle: string) =>
      trackActivity("quiz_start", "quiz", quizId, quizTitle),

    trackQuizComplete: (quizId: string, quizTitle: string, score: number, total: number) =>
      trackActivity("quiz_complete", "quiz", quizId, quizTitle, {
        score,
        total,
        percentage: Math.round((score / total) * 100),
      }),

    trackQuizAbandon: (quizId: string, quizTitle: string, questionsAnswered: number, totalQuestions: number) =>
      trackActivity("quiz_abandon", "quiz", quizId, quizTitle, {
        questionsAnswered,
        totalQuestions,
      }),

    // Module tracking
    trackModuleStart: (moduleId: string, moduleTitle: string) =>
      trackActivity("module_start", "module", moduleId, moduleTitle),

    trackModuleComplete: (moduleId: string, moduleTitle: string, chaptersCompleted: number, totalChapters: number) =>
      trackActivity("module_complete", "module", moduleId, moduleTitle, {
        chaptersCompleted,
        totalChapters,
      }),

    trackChapterComplete: (chapterId: string, chapterTitle: string, moduleId: string) =>
      trackActivity("chapter_complete", "chapter", chapterId, chapterTitle, { moduleId }),

    // Search tracking
    trackSearch: (query: string, resultsCount: number, filters?: string[]) =>
      trackActivity("search", "search", undefined, undefined, {
        query,
        resultsCount,
        filters,
        timestamp: new Date().toISOString(),
      }),

    // Event tracking
    trackEventView: (eventId: string, eventTitle: string) =>
      trackActivity("event_view", "event", eventId, eventTitle),

    trackEventRegister: (eventId: string, eventTitle: string) =>
      trackActivity("event_register", "event", eventId, eventTitle),

    // Newsletter tracking
    trackNewsletterSubscribe: (source: string) =>
      trackActivity("newsletter_subscribe", undefined, undefined, undefined, { source }),

    trackNewsletterUnsubscribe: (reason?: string) =>
      trackActivity("newsletter_unsubscribe", undefined, undefined, undefined, { reason }),

    // Chatbot tracking
    trackChatbotOpen: () => trackActivity("chatbot_open", "chatbot"),

    trackChatbotMessage: (messageLength: number, hasResponse: boolean) =>
      trackActivity("chatbot_message", "chatbot", undefined, undefined, {
        messageLength,
        hasResponse,
        timestamp: new Date().toISOString(),
      }),

    // Feedback tracking
    trackFeedbackSubmit: (feedbackType: string, rating?: number) =>
      trackActivity("feedback_submit", undefined, undefined, undefined, {
        feedbackType,
        rating,
      }),

    // Profile tracking
    trackProfileUpdate: (fieldsUpdated: string[]) =>
      trackActivity("profile_update", "profile", undefined, undefined, { fieldsUpdated }),

    trackOnboardingComplete: () => trackActivity("onboarding_complete", "profile"),

    trackOnboardingSkip: (filledFields: number) =>
      trackActivity("onboarding_skip", "profile", undefined, undefined, { filledFields }),

    // Auth tracking
    trackLogin: () => trackActivity("login"),
    trackLogout: () => trackActivity("logout"),
    trackSignup: (method: "email" | "google" | "x" | "apple") =>
      trackActivity("signup", undefined, undefined, undefined, { method }),
  };
};

// Get user's activity summary (for profile analytics)
export const getUserActivitySummary = async (userId: string) => {
  try {
    // Get total activities
    const { count: totalActivities } = await supabase
      .from("user_activities")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    // Get unique sessions
    const { data: sessions } = await supabase
      .from("user_activities")
      .select("session_id")
      .eq("user_id", userId)
      .limit(1000);

    const uniqueSessions = new Set(sessions?.map((s) => s.session_id)).size;

    // Get most active areas
    const { data: activityTypes } = await supabase
      .from("user_activities")
      .select("action_type")
      .eq("user_id", userId);

    const activityCounts = activityTypes?.reduce((acc, curr) => {
      acc[curr.action_type] = (acc[curr.action_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Get last active timestamp
    const { data: lastActivity } = await supabase
      .from("user_activities")
      .select("created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    return {
      totalActivities: totalActivities || 0,
      uniqueSessions,
      activityCounts: activityCounts || {},
      lastActiveAt: lastActivity?.created_at || null,
      topInterests: Object.entries(activityCounts || {})
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([type]) => type),
    };
  } catch (error) {
    console.error("Error getting activity summary:", error);
    return null;
  }
};

// Get user engagement score (higher = more engaged)
export const getEngagementScore = async (userId: string): Promise<number> => {
  try {
    const { data: activities } = await supabase
      .from("user_activities")
      .select("action_type")
      .eq("user_id", userId);

    if (!activities || activities.length === 0) return 0;

    // Weight different activities by engagement value
    const weights: Record<string, number> = {
      quiz_complete: 10,
      module_complete: 8,
      article_read: 5,
      video_complete: 5,
      chapter_complete: 4,
      video_watch: 3,
      quiz_start: 3,
      module_start: 2,
      page_view: 1,
      search: 1,
    };

    return activities.reduce((score, activity) => {
      return score + (weights[activity.action_type] || 1);
    }, 0);
  } catch (error) {
    return 0;
  }
};
