import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

// =====================================================
// TYPE DEFINITIONS
// =====================================================

export interface AffiliateVisibilityRules {
  pages: string[];           // e.g. ["homepage", "articles", "modules", "videos", "junior", "events", "profile"]
  sections: string[];        // e.g. ["sidebar", "inline_content", "footer", "banner"]
  content_ids: string[];     // specific content UUIDs to show on
  content_categories: string[]; // category-matched placement
}

export interface AffiliateScheduling {
  start_at?: string;         // ISO datetime
  end_at?: string;           // ISO datetime
  timezone?: string;         // e.g. "Asia/Calcutta"
  recurrence?: {
    type: 'daily' | 'weekly';
    days?: number[];          // 0=Sun, 1=Mon...
    time_start?: string;      // HH:MM
    time_end?: string;        // HH:MM
  };
}

export interface AffiliateTargeting {
  age_range?: [number, number];
  regions?: string[];
  interests?: string[];
  subscription_status?: 'subscribed' | 'unsubscribed' | 'all';
  xp_range?: [number, number];
  professions?: string[];
  onboarding_completed?: boolean;
}

export interface DbAffiliateLink {
  id: string;
  name: string;
  url: string;
  logo_url?: string;
  description?: string;
  category: string;
  is_active: boolean;
  click_count: number;
  created_at: string;
  updated_at: string;
  // New visibility fields
  visibility_rules: AffiliateVisibilityRules;
  scheduling: AffiliateScheduling;
  targeting_rules: AffiliateTargeting;
  chatbot_controlled: boolean;
  chatbot_prompt?: string;
}

export interface DbBookmark {
  id: string;
  user_id: string;
  content_type: 'article' | 'module' | 'video';
  content_id: string;
  created_at: string;
}

// =====================================================
// AFFILIATE LINKS (Admin & Public)
// =====================================================

export const useAffiliateLinks = (options?: { activeOnly?: boolean }) => {
  return useQuery({
    queryKey: ['affiliate-links', options],
    queryFn: async () => {
      let query = supabase.from('affiliate_links').select('*');
      if (options?.activeOnly) query = query.eq('is_active', true);
      const { data, error } = await query.order('name');
      if (error) {
        console.error('Error fetching affiliate links:', error);
        return [] as DbAffiliateLink[];
      }
      return (data || []) as DbAffiliateLink[];
    },
    retry: 1,
    staleTime: 0, // Always refetch after mutations to ensure latest state
    refetchOnWindowFocus: true,
  });
};

export const useCreateAffiliate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (link: Omit<DbAffiliateLink, 'id' | 'created_at' | 'updated_at' | 'click_count'>) => {
      const { data, error } = await supabase.from('affiliate_links').insert(link).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['affiliate-links'] }),
  });
};

export const useUpdateAffiliate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DbAffiliateLink> & { id: string }) => {
      const { data, error } = await supabase.from('affiliate_links').update(updates).eq('id', id).select().maybeSingle();
      if (error) {
        console.error('Error updating affiliate link:', error);
        throw error;
      }
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['affiliate-links'] }),
    onError: (error: any) => {
      console.error('Failed to update affiliate link:', error?.message || error);
    },
  });
};

export const useDeleteAffiliate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('affiliate_links').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['affiliate-links'] }),
  });
};

export const useTrackAffiliateClick = () => {
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc('track_affiliate_click', { p_id: id });
      if (error) throw error;
    },
  });
};

// =====================================================
// VISIBILITY FILTER HOOK
// =====================================================

/**
 * Checks if a given time is within an affiliate's scheduling window.
 */
function isWithinSchedule(scheduling: AffiliateScheduling): boolean {
  if (!scheduling || Object.keys(scheduling).length === 0) return true;

  const timezone = scheduling.timezone || 'UTC';
  const now = new Date();

  // Convert "now" to the target timezone for accurate comparison
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(now);
  const getPart = (type: string) => parseInt(parts.find(p => p.type === type)?.value || '0', 10);
  const tzNow = new Date(
    getPart('year'), getPart('month') - 1, getPart('day'),
    getPart('hour'), getPart('minute'), getPart('second')
  );

  // Check start_at
  if (scheduling.start_at) {
    const start = new Date(scheduling.start_at);
    if (tzNow < start) return false;
  }

  // Check end_at
  if (scheduling.end_at) {
    const end = new Date(scheduling.end_at);
    if (tzNow > end) return false;
  }

  // Check recurrence
  if (scheduling.recurrence) {
    const rec = scheduling.recurrence;
    if (rec.type === 'weekly' && rec.days && rec.days.length > 0) {
      const currentDay = tzNow.getDay(); // 0=Sun
      if (!rec.days.includes(currentDay)) return false;
    }
    if (rec.time_start && rec.time_end) {
      const currentMinutes = tzNow.getHours() * 60 + tzNow.getMinutes();
      const [startH, startM] = rec.time_start.split(':').map(Number);
      const [endH, endM] = rec.time_end.split(':').map(Number);
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;
      if (currentMinutes < startMinutes || currentMinutes > endMinutes) return false;
    }
  }

  return true;
}

/**
 * Checks if a user matches an affiliate's targeting rules.
 */
function matchesTargeting(rules: AffiliateTargeting, userProfile: {
  age?: number | null;
  region?: string | null;
  interests?: string[];
  isSubscribed?: boolean;
  xp?: number | null;
  profession?: string | null;
  onboardingCompleted?: boolean;
}): boolean {
  if (!rules || Object.keys(rules).length === 0) return true;

  // Age range
  if (rules.age_range) {
    const age = userProfile.age;
    if (age === null || age === undefined) return false;
    if (age < rules.age_range[0] || age > rules.age_range[1]) return false;
  }

  // Regions
  if (rules.regions && rules.regions.length > 0) {
    if (!userProfile.region || !rules.regions.includes(userProfile.region)) return false;
  }

  // Interests
  if (rules.interests && rules.interests.length > 0) {
    const userInterests = userProfile.interests || [];
    const hasMatch = rules.interests.some(i => userInterests.includes(i));
    if (!hasMatch) return false;
  }

  // Subscription status
  if (rules.subscription_status && rules.subscription_status !== 'all') {
    const isSubscribed = userProfile.isSubscribed ?? false;
    if (rules.subscription_status === 'subscribed' && !isSubscribed) return false;
    if (rules.subscription_status === 'unsubscribed' && isSubscribed) return false;
  }

  // XP range
  if (rules.xp_range) {
    const xp = userProfile.xp ?? 0;
    if (xp < rules.xp_range[0] || xp > rules.xp_range[1]) return false;
  }

  // Professions
  if (rules.professions && rules.professions.length > 0) {
    if (!userProfile.profession || !rules.professions.includes(userProfile.profession)) return false;
  }

  // Onboarding completed
  if (rules.onboarding_completed !== undefined) {
    if (userProfile.onboardingCompleted !== rules.onboarding_completed) return false;
  }

  return true;
}

export interface VisibilityContext {
  page: string;              // Current page identifier e.g. "homepage", "articles", "modules"
  section?: string;          // e.g. "sidebar", "inline_content"
  content_id?: string;       // Current content being viewed (e.g. article UUID)
  content_category?: string; // e.g. "Demat", "Insurance"
}

/**
 * Hook to get affiliates that are visible in the current context.
 * Only returns admin-controlled (non-chatbot) affiliates that match all rules.
 * Use this for website display (sidebar, inline, etc.)
 */
export function useVisibleAffiliates(context: VisibilityContext) {
  const { user } = useAuth();
  const { data: affiliates, isLoading, error } = useAffiliateLinks({ activeOnly: true });

  // Build user profile for targeting checks
  const userProfile = {
    age: user?.age ?? null,
    region: user?.region ?? null,
    interests: user?.interests ?? [],
    isSubscribed: user?.isSubscribed ?? false,
    xp: user?.xp ?? null,
    profession: (user as any)?.profession ?? null,
    onboardingCompleted: user?.onboardingCompleted ?? false,
  };

  const visible = (affiliates || []).filter(link => {
    // Skip chatbot-controlled affiliates (they're for chat only)
    if (link.chatbot_controlled) return false;

    const rules: AffiliateVisibilityRules = link.visibility_rules || { pages: [], sections: [], content_ids: [], content_categories: [] };
    const scheduling: AffiliateScheduling = link.scheduling || {};
    const targeting: AffiliateTargeting = link.targeting_rules || {};

    // 1. Page visibility check
    if (rules.pages && rules.pages.length > 0) {
      if (!rules.pages.includes(context.page) && !rules.pages.includes('all')) {
        return false;
      }
    }

    // 2. Section check
    if (rules.sections && rules.sections.length > 0 && context.section) {
      if (!rules.sections.includes(context.section)) return false;
    }

    // 3. Content IDs check
    if (rules.content_ids && rules.content_ids.length > 0 && context.content_id) {
      if (!rules.content_ids.includes(context.content_id)) return false;
    }

    // 4. Content categories check
    if (rules.content_categories && rules.content_categories.length > 0 && context.content_category) {
      if (!rules.content_categories.includes(context.content_category)) return false;
    }

    // 5. Scheduling check
    if (!isWithinSchedule(scheduling)) return false;

    // 6. Targeting check
    if (!matchesTargeting(targeting, userProfile)) return false;

    return true;
  });

  return {
    visibleAffiliates: visible,
    isLoading,
    error,
  };
}

// =====================================================
// CHATBOT AFFILIATES HOOK
// =====================================================

/**
 * Hook to get chatbot-controlled affiliates.
 * These are sent to the AI so it can decide when/whom to recommend.
 */
export function useChatbotAffiliates() {
  const { data: affiliates, isLoading, error } = useAffiliateLinks({ activeOnly: true });

  const chatbotAffiliates = (affiliates || []).filter(link => link.chatbot_controlled);

  return {
    chatbotAffiliates,
    isLoading,
    error,
  };
}

// =====================================================
// USER BOOKMARKS
// =====================================================

export const useBookmarks = (userId: string) => {
  return useQuery({
    queryKey: ['bookmarks', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_bookmarks')
        .select('*')
        .eq('user_id', userId);
      if (error) throw error;
      return data as DbBookmark[];
    },
    enabled: !!userId,
  });
};

export const useToggleBookmark = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ user_id, content_type, content_id, isBookmarked }: { 
      user_id: string, 
      content_type: string, 
      content_id: string, 
      isBookmarked: boolean 
    }) => {
      if (isBookmarked) {
        const { error } = await supabase
          .from('user_bookmarks')
          .delete()
          .eq('user_id', user_id)
          .eq('content_type', content_type)
          .eq('content_id', content_id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_bookmarks')
          .insert({ user_id, content_type, content_id });
        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks', variables.user_id] });
    },
  });
};