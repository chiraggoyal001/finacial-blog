import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
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

export const useArticles = (filters?: { category?: string; published?: boolean }) => {
  return useQuery({
    queryKey: ['articles', filters],
    queryFn: async () => {
      let query = supabase.from('articles').select('*');
      if (filters?.category) query = query.eq('category', filters.category);
      if (filters?.published !== undefined) query = query.eq('is_published', filters.published);
      
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data as DbArticle[];
    },
  });
};

export const useArticle = (id: string) => {
  return useQuery({
    queryKey: ['article', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as DbArticle;
    },
    enabled: !!id,
  });
};

export const useCreateArticle = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (article: Omit<DbArticle, 'id' | 'created_at' | 'updated_at' | 'views' | 'likes'>) => {
      const { data, error } = await supabase.from('articles').insert(article).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['articles'] }),
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['articles'] }),
  });
};

// =====================================================
// MODULES
// =====================================================

export const useModules = (filters?: { published?: boolean }) => {
  return useQuery({
    queryKey: ['modules', filters],
    queryFn: async () => {
      let query = supabase.from('modules').select('*');
      if (filters?.published !== undefined) query = query.eq('is_published', filters.published);
      
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data as DbModule[];
    },
  });
};

export const useModule = (id: string) => {
  return useQuery({
    queryKey: ['module', id],
    queryFn: async () => {
      const { data: moduleData, error: moduleError } = await supabase
        .from('modules')
        .select('*')
        .eq('id', id)
        .single();
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
    mutationFn: async (module: Omit<DbModule, 'id' | 'created_at' | 'updated_at' | 'views' | 'likes' | 'chapters'>) => {
      const { data, error } = await supabase.from('modules').insert(module).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['modules'] }),
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['modules'] }),
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

export const useVideoSeries = (filters?: { published?: boolean }) => {
  return useQuery({
    queryKey: ['videoSeries', filters],
    queryFn: async () => {
      let query = supabase.from('video_series').select('*');
      if (filters?.published !== undefined) query = query.eq('is_published', filters.published);
      
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data as DbVideoSeries[];
    },
  });
};

export const useVideoSeriesItem = (id: string) => {
  return useQuery({
    queryKey: ['videoSeriesItem', id],
    queryFn: async () => {
      const { data: series, error: seriesError } = await supabase
        .from('video_series')
        .select('*')
        .eq('id', id)
        .single();
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
    mutationFn: async (series: Omit<DbVideoSeries, 'id' | 'created_at' | 'updated_at' | 'views' | 'likes' | 'chapters'>) => {
      const { data, error } = await supabase.from('video_series').insert(series).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['videoSeries'] }),
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['videoSeries'] }),
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

export const useEvents = (filters?: { upcoming?: boolean; published?: boolean }) => {
  return useQuery({
    queryKey: ['events', filters],
    queryFn: async () => {
      let query = supabase.from('events').select('*');
      if (filters?.upcoming !== undefined) query = query.eq('is_upcoming', filters.upcoming);
      if (filters?.published !== undefined) query = query.eq('is_published', filters.published);
      
      const { data, error } = await query.order('date', { ascending: true });
      if (error) throw error;
      return data as DbEvent[];
    },
  });
};

export const useEvent = (id: string) => {
  return useQuery({
    queryKey: ['event', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as DbEvent;
    },
    enabled: !!id,
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['events'] }),
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['events'] }),
  });
};

// =====================================================
// JUNIOR MODULES
// =====================================================

export const useJuniorModules = (filters?: { published?: boolean }) => {
  return useQuery({
    queryKey: ['juniorModules', filters],
    queryFn: async () => {
      let query = supabase.from('junior_modules').select('*');
      if (filters?.published !== undefined) query = query.eq('is_published', filters.published);
      
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data as DbJuniorModule[];
    },
  });
};

export const useJuniorModule = (id: string) => {
  return useQuery({
    queryKey: ['juniorModule', id],
    queryFn: async () => {
      const { data: module, error: moduleError } = await supabase
        .from('junior_modules')
        .select('*')
        .eq('id', id)
        .single();
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
    mutationFn: async (module: Omit<DbJuniorModule, 'id' | 'created_at' | 'updated_at' | 'views' | 'likes' | 'chapters'>) => {
      const { data, error } = await supabase.from('junior_modules').insert(module).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['juniorModules'] }),
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['juniorModules'] }),
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
