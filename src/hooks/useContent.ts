import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { triggerEmail } from '@/lib/sendEmail';
import type { 
  DbArticle, 
  DbModule, 
  DbModuleChapter,
  DbVideoSeries,
  DbVideoChapter,
  DbEvent,
  DbJuniorModule,
  DbJuniorChapter 
} from '@/lib/types';

// =====================================================
// ARTICLES
// =====================================================

export const useArticles = (filters?: { category?: string; published?: boolean }, options?: { staleTime?: number; gcTime?: number }) => {
  return useQuery({
    queryKey: ['articles', filters],
    queryFn: async () => {
      let query = supabase.from('articles').select('*');
      if (filters?.category) query = query.eq('category', filters.category);
      if (filters?.published !== undefined) {
        query = query.eq('is_published', filters.published);
        if (filters.published) {
          const now = new Date().toISOString();
          query = query.or(`scheduled_for.is.null,scheduled_for.lte.${now}`);
        }
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data as DbArticle[];
    },
    staleTime: options?.staleTime ?? 0,
    gcTime: options?.gcTime ?? 1000 * 60 * 30,
  });
};

export const useArticle = (id: string, options?: { publishedOnly?: boolean }) => {
  return useQuery({
    queryKey: ['article', id, options],
    queryFn: async () => {
      let query = supabase.from('articles').select('*').eq('id', id);
      
      if (options?.publishedOnly) {
        const now = new Date().toISOString();
        query = query.eq('is_published', true).or(`scheduled_for.is.null,scheduled_for.lte.${now}`);
      }
      
      const { data, error } = await query.single();
      if (error) throw error;
      return data as DbArticle;
    },
    enabled: !!id,
  });
};

export const useCreateArticle = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (article: Omit<DbArticle, 'id' | 'created_at' | 'updated_at' | 'views' | 'likes' | 'avg_rating' | 'rating_count'>) => {
      const { data, error } = await supabase.from('articles').insert(article).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      queryClient.invalidateQueries({ queryKey: ['admin-analytics'] });
    },
  });
};

export const useUpdateArticle = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DbArticle> & { id: string }) => {
      const { data, error } = await supabase
        .from('articles')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      queryClient.invalidateQueries({ queryKey: ['article', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['admin-analytics'] });
    },
  });
};

export const useDeleteArticle = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('articles').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      queryClient.invalidateQueries({ queryKey: ['admin-analytics'] });
    },
  });
};

// =====================================================
// MODULES
// =====================================================

export const useModules = (filters?: { published?: boolean }, options?: { staleTime?: number; gcTime?: number }) => {
  return useQuery({
    queryKey: ['modules', filters],
    queryFn: async () => {
      let query = supabase.from('modules').select('*');
      if (filters?.published !== undefined) {
        query = query.eq('is_published', filters.published);
        if (filters.published) {
          const now = new Date().toISOString();
          query = query.or(`scheduled_for.is.null,scheduled_for.lte.${now}`);
        }
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data as DbModule[];
    },
    staleTime: options?.staleTime ?? 0,
    gcTime: options?.gcTime ?? 1000 * 60 * 30,
  });
};

export const useModule = (id: string, options?: { publishedOnly?: boolean }) => {
  return useQuery({
    queryKey: ['module', id, options],
    queryFn: async () => {
      let query = supabase.from('modules').select('*').eq('id', id);
      
      if (options?.publishedOnly) {
        const now = new Date().toISOString();
        query = query.eq('is_published', true).or(`scheduled_for.is.null,scheduled_for.lte.${now}`);
      }
      
      const { data: moduleData, error: moduleError } = await query.single();
      if (moduleError) throw moduleError;
      
      // Fetch chapters
      const { data: chapters, error: chaptersError } = await supabase
        .from('module_chapters')
        .select('*')
        .eq('module_id', id)
        .order('sort_order', { ascending: true });
      if (chaptersError) throw chaptersError;
      
      return { ...moduleData, chapters } as DbModule;
    },
    enabled: !!id,
  });
};

export const useCreateModule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (module: Omit<DbModule, 'id' | 'created_at' | 'updated_at' | 'views' | 'likes' | 'avg_rating' | 'rating_count' | 'chapters'>) => {
      const { data, error } = await supabase.from('modules').insert(module).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules'] });
      queryClient.invalidateQueries({ queryKey: ['admin-analytics'] });
    },
  });
};

export const useUpdateModule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DbModule> & { id: string }) => {
      const { data, error } = await supabase
        .from('modules')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['modules'] });
      queryClient.invalidateQueries({ queryKey: ['module', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['admin-analytics'] });
    },
  });
};

export const useDeleteModule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('modules').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules'] });
      queryClient.invalidateQueries({ queryKey: ['admin-analytics'] });
    },
  });
};

// =====================================================
// MODULE CHAPTERS
// =====================================================

export const useModuleChapters = (moduleId: string) => {
  return useQuery({
    queryKey: ['moduleChapters', moduleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('module_chapters')
        .select('*')
        .eq('module_id', moduleId)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data as DbModuleChapter[];
    },
    enabled: !!moduleId,
  });
};

export const useCreateModuleChapter = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (chapter: Omit<DbModuleChapter, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase.from('module_chapters').insert(chapter).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['moduleChapters', variables.module_id] });
      queryClient.invalidateQueries({ queryKey: ['module', variables.module_id] });
    },
  });
};

export const useUpdateModuleChapter = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DbModuleChapter> & { id: string }) => {
      const { data, error } = await supabase
        .from('module_chapters')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['moduleChapters', variables.module_id] });
      queryClient.invalidateQueries({ queryKey: ['module', variables.module_id] });
    },
  });
};

export const useDeleteModuleChapter = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, moduleId }: { id: string; moduleId: string }) => {
      const { error } = await supabase.from('module_chapters').delete().eq('id', id);
      if (error) throw error;
      return { id, moduleId };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['moduleChapters', variables.moduleId] });
      queryClient.invalidateQueries({ queryKey: ['module', variables.moduleId] });
    },
  });
};

// =====================================================
// VIDEO SERIES
// =====================================================

export const useVideoSeries = (filters?: { published?: boolean }, options?: { staleTime?: number; gcTime?: number }) => {
  return useQuery({
    queryKey: ['videoSeries', filters],
    queryFn: async () => {
      let query = supabase.from('video_series').select('*');
      if (filters?.published !== undefined) {
        query = query.eq('is_published', filters.published);
        if (filters.published) {
          const now = new Date().toISOString();
          query = query.or(`scheduled_for.is.null,scheduled_for.lte.${now}`);
        }
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data as DbVideoSeries[];
    },
    staleTime: options?.staleTime ?? 0,
    gcTime: options?.gcTime ?? 1000 * 60 * 30,
  });
};

export const useVideoSeriesItem = (id: string, options?: { publishedOnly?: boolean }) => {
  return useQuery({
    queryKey: ['videoSeriesItem', id, options],
    queryFn: async () => {
      let query = supabase.from('video_series').select('*').eq('id', id);
      
      if (options?.publishedOnly) {
        const now = new Date().toISOString();
        query = query.eq('is_published', true).or(`scheduled_for.is.null,scheduled_for.lte.${now}`);
      }
      
      const { data: series, error: seriesError } = await query.single();
      if (seriesError) throw seriesError;
      
      const { data: chapters, error: chaptersError } = await supabase
        .from('video_chapters')
        .select('*')
        .eq('series_id', id)
        .order('sort_order', { ascending: true });
      if (chaptersError) throw chaptersError;
      
      return { ...series, chapters } as DbVideoSeries;
    },
    enabled: !!id,
  });
};

export const useCreateVideoSeries = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (series: Omit<DbVideoSeries, 'id' | 'created_at' | 'updated_at' | 'views' | 'likes' | 'avg_rating' | 'rating_count' | 'chapters'>) => {
      const { data, error } = await supabase.from('video_series').insert(series).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videoSeries'] });
      queryClient.invalidateQueries({ queryKey: ['admin-analytics'] });
    },
  });
};

export const useUpdateVideoSeries = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DbVideoSeries> & { id: string }) => {
      const { data, error } = await supabase
        .from('video_series')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['videoSeries'] });
      queryClient.invalidateQueries({ queryKey: ['videoSeriesItem', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['admin-analytics'] });
    },
  });
};

export const useDeleteVideoSeries = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('video_series').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videoSeries'] });
      queryClient.invalidateQueries({ queryKey: ['admin-analytics'] });
    },
  });
};

// =====================================================
// VIDEO CHAPTERS
// =====================================================

export const useCreateVideoChapter = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (chapter: Omit<DbVideoChapter, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase.from('video_chapters').insert(chapter).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['videoSeriesItem', variables.series_id] });
    },
  });
};

export const useUpdateVideoChapter = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DbVideoChapter> & { id: string }) => {
      const { data, error } = await supabase
        .from('video_chapters')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['videoSeriesItem', variables.series_id] });
    },
  });
};

export const useDeleteVideoChapter = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, seriesId }: { id: string; seriesId: string }) => {
      const { error } = await supabase.from('video_chapters').delete().eq('id', id);
      if (error) throw error;
      return { id, seriesId };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['videoSeriesItem', variables.seriesId] });
    },
  });
};

// =====================================================
// EVENTS
// =====================================================

export const useEvents = (filters?: { upcoming?: boolean; published?: boolean }, options?: { staleTime?: number; gcTime?: number }) => {
  return useQuery({
    queryKey: ['events', filters],
    queryFn: async () => {
      let query = supabase.from('events').select('*');
      if (filters?.upcoming !== undefined) {
        const now = new Date().toISOString();
        if (filters.upcoming) {
          query = query.gt('start_time', now);
        } else {
          query = query.lt('end_time', now);
        }
      }
      if (filters?.published !== undefined) {
        query = query.eq('is_published', filters.published);
        if (filters.published) {
          const now = new Date().toISOString();
          query = query.or(`scheduled_for.is.null,scheduled_for.lte.${now}`);
        }
      }

      const { data, error } = await query.order('start_time', { ascending: true });
      if (error) throw error;
      return data as DbEvent[];
    },
    staleTime: options?.staleTime ?? 0,
    gcTime: options?.gcTime ?? 1000 * 60 * 30,
  });
};

export const useTips = (options?: { staleTime?: number; gcTime?: number }) => {
  return useQuery({
    queryKey: ['tips'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('category', 'Tip')
        .eq('is_published', true);
      if (error) throw error;
      return data as DbArticle[];
    },
    staleTime: options?.staleTime ?? 0,
    gcTime: options?.gcTime ?? 1000 * 60 * 30,
  });
};
export const useEvent = (id: string, options?: { publishedOnly?: boolean }) => {
  return useQuery({
    queryKey: ['event', id, options],
    queryFn: async () => {
      let query = supabase.from('events').select('*').eq('id', id);
      
      if (options?.publishedOnly) {
        const now = new Date().toISOString();
        query = query.eq('is_published', true).or(`scheduled_for.is.null,scheduled_for.lte.${now}`);
      }
      
      const { data, error } = await query.single();
      if (error) throw error;
      return data as DbEvent;
    },
    enabled: !!id,
  });
};

// =====================================================
// EVENT REGISTRATIONS
// =====================================================

export const useUserEventRegistration = (eventId: string, userId?: string) => {
  return useQuery({
    queryKey: ['event-registration', eventId, userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from('event_registrations')
        .select('*')
        .eq('event_id', eventId)
        .eq('user_id', userId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!eventId && !!userId,
  });
};

export const useRegisterForEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { eventId: string; email?: string; firstName?: string; lastName?: string }) => {
      const { data, error } = await supabase.rpc('register_for_event', { p_event_id: params.eventId });
      if (error) throw error;
      return { ...data, _email: params.email, _firstName: params.firstName, _lastName: params.lastName, _eventId: params.eventId };
    },
    onSuccess: (result, params) => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['event', params.eventId] });
      queryClient.invalidateQueries({ queryKey: ['event-registration', params.eventId] });

      // Fire confirmation email if registered (not waitlisted)
      const status = (result as any)?.status;
      if (status === 'registered' && params.email) {
        triggerEmail({
          type: 'confirmation',
          email: params.email,
          first_name: params.firstName || '',
          last_name: params.lastName || '',
          event_id: params.eventId,
        });
      }
    },
  });
};

export const useUnregisterFromEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (eventId: string) => {
      const { error } = await supabase.rpc('unregister_from_event', { p_event_id: eventId });
      if (error) throw error;
    },
    onSuccess: (_, eventId) => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      queryClient.invalidateQueries({ queryKey: ['event-registration', eventId] });
    },
  });
};

export const useEventAttendees = (eventId: string) => {
  return useQuery({
    queryKey: ['event-attendees', eventId],
    queryFn: async () => {
      if (!eventId) return [];
      const { data, error } = await supabase
        .from('event_registrations')
        .select('*, profiles(*)')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!eventId,
  });
};

// In-memory LRU cache for instant repeat queries (faster than React Query's network cache)
const searchCache = new Map<string, { data: any[]; timestamp: number }>();
const SEARCH_CACHE_MAX = 50;
const SEARCH_CACHE_TTL = 1000 * 60 * 5; // 5 minutes

function getCachedSearch(key: string): any[] | null {
  const entry = searchCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > SEARCH_CACHE_TTL) {
    searchCache.delete(key);
    return null;
  }
  return entry.data;
}

function setCachedSearch(key: string, data: any[]) {
  if (searchCache.size >= SEARCH_CACHE_MAX) {
    // Delete oldest entry
    const oldest = searchCache.entries().next().value;
    if (oldest) searchCache.delete(oldest[0]);
  }
  searchCache.set(key, { data, timestamp: Date.now() });
}

export const useSearchContent = (query: string, limit: number = 12) => {
  return useQuery({
    queryKey: ['search', query, limit],
    queryFn: async () => {
      if (!query.trim()) return [];
      
      // Check in-memory cache first for instant response
      const cacheKey = `${query}_${limit}`;
      const cached = getCachedSearch(cacheKey);
      if (cached) return cached;
      
      const { data, error } = await supabase.rpc('search_content', {
        p_query: query,
        p_limit: limit
      });
      if (error) throw error;
      
      // Store in in-memory cache
      setCachedSearch(cacheKey, data || []);
      return (data || []) as any[];
    },
    enabled: !!query.trim(),
    staleTime: 1000 * 10, // 10s - fresh for 10s, then refetch in background
    gcTime: 1000 * 60 * 5, // 5min garbage collection
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: false, // Don't refetch on tab switch for search
  });
};


export const useCreateEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (event: Omit<DbEvent, 'id' | 'created_at' | 'updated_at' | 'registered'>) => {
      const { data, error } = await supabase.from('events').insert(event).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['admin-analytics'] });
    },
  });
};

export const useUpdateEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DbEvent> & { id: string }) => {
      const { data, error } = await supabase
        .from('events')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['event', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['admin-analytics'] });
    },
  });
};

export const useDeleteEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('events').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['admin-analytics'] });
    },
  });
};

// =====================================================
// JUNIOR MODULES
// =====================================================

export const useJuniorModules = (filters?: { published?: boolean }, options?: { staleTime?: number; gcTime?: number }) => {
  return useQuery({
    queryKey: ['juniorModules', filters],
    queryFn: async () => {
      let query = supabase.from('junior_modules').select('*');
      if (filters?.published !== undefined) {
        query = query.eq('is_published', filters.published);
        if (filters.published) {
          const now = new Date().toISOString();
          query = query.or(`scheduled_for.is.null,scheduled_for.lte.${now}`);
        }
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data as DbJuniorModule[];
    },
    staleTime: options?.staleTime ?? 0,
    gcTime: options?.gcTime ?? 1000 * 60 * 30,
  });
};
export const useJuniorModule = (id: string, options?: { publishedOnly?: boolean }) => {
  return useQuery({
    queryKey: ['juniorModule', id, options],
    queryFn: async () => {
      let query = supabase.from('junior_modules').select('*').eq('id', id);
      
      if (options?.publishedOnly) {
        const now = new Date().toISOString();
        query = query.eq('is_published', true).or(`scheduled_for.is.null,scheduled_for.lte.${now}`);
      }
      
      const { data: module, error: moduleError } = await query.single();
      if (moduleError) throw moduleError;
      
      const { data: chapters, error: chaptersError } = await supabase
        .from('junior_chapters')
        .select('*')
        .eq('module_id', id)
        .order('sort_order', { ascending: true });
      if (chaptersError) throw chaptersError;
      
      return { ...module, chapters } as DbJuniorModule;
    },
    enabled: !!id,
  });
};

export const useCreateJuniorModule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (module: Omit<DbJuniorModule, 'id' | 'created_at' | 'updated_at' | 'views' | 'likes' | 'avg_rating' | 'rating_count' | 'chapters'>) => {
      const { data, error } = await supabase.from('junior_modules').insert(module).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['juniorModules'] });
      queryClient.invalidateQueries({ queryKey: ['admin-analytics'] });
    },
  });
};

export const useUpdateJuniorModule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DbJuniorModule> & { id: string }) => {
      const { data, error } = await supabase
        .from('junior_modules')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['juniorModules'] });
      queryClient.invalidateQueries({ queryKey: ['juniorModule', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['admin-analytics'] });
    },
  });
};

export const useDeleteJuniorModule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('junior_modules').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['juniorModules'] });
      queryClient.invalidateQueries({ queryKey: ['admin-analytics'] });
    },
  });
};

// =====================================================
// JUNIOR CHAPTERS
// =====================================================

export const useCreateJuniorChapter = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (chapter: Omit<DbJuniorChapter, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase.from('junior_chapters').insert(chapter).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['juniorModule', variables.module_id] });
    },
  });
};

export const useUpdateJuniorChapter = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DbJuniorChapter> & { id: string }) => {
      const { data, error } = await supabase
        .from('junior_chapters')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['juniorModule', variables.module_id] });
    },
  });
};

export const useDeleteJuniorChapter = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, moduleId }: { id: string; moduleId: string }) => {
      const { error } = await supabase.from('junior_chapters').delete().eq('id', id);
      if (error) throw error;
      return { id, moduleId };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['juniorModule', variables.moduleId] });
    },
  });
};

// =====================================================
// USER LIKES
// =====================================================

export const useLikeContent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ contentType, contentId }: { contentType: string; contentId: string }) => {
      const { data, error } = await supabase
        .from('user_likes')
        .insert({ content_type: contentType, content_id: contentId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      queryClient.invalidateQueries({ queryKey: ['modules'] });
      queryClient.invalidateQueries({ queryKey: ['videoSeries'] });
      queryClient.invalidateQueries({ queryKey: ['juniorModules'] });
    },
  });
};

export const useUnlikeContent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ contentType, contentId }: { contentType: string; contentId: string }) => {
      const { error } = await supabase
        .from('user_likes')
        .delete()
        .eq('content_type', contentType)
        .eq('content_id', contentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      queryClient.invalidateQueries({ queryKey: ['modules'] });
      queryClient.invalidateQueries({ queryKey: ['videoSeries'] });
      queryClient.invalidateQueries({ queryKey: ['juniorModules'] });
    },
  });
};

export const useUserLikes = (contentType?: string) => {
  return useQuery({
    queryKey: ['userLikes', contentType],
    queryFn: async () => {
      let query = supabase.from('user_likes').select('*');
      if (contentType) query = query.eq('content_type', contentType);
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
};
