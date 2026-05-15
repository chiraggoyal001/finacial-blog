import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export const useUserRating = (contentType: string, contentId: string) => {
  return useQuery({
    queryKey: ['userRating', contentType, contentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('content_ratings')
        .select('rating')
        .eq('content_type', contentType)
        .eq('content_id', contentId)
        .maybeSingle();
      if (error) throw error;
      return data?.rating || null;
    },
    enabled: !!contentId,
  });
};

export const useRateContent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      contentType,
      contentId,
      rating,
    }: {
      contentType: string;
      contentId: string;
      rating: number;
    }) => {
      const { data, error } = await supabase.rpc('rate_content', {
        p_content_type: contentType,
        p_content_id: contentId,
        p_rating: rating,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['userRating', variables.contentType, variables.contentId] });
      // Also invalidate the parent content queries so avg_rating updates in lists
      const contentQueryMap: Record<string, string> = {
        article: 'articles',
        module: 'modules',
        video: 'videoSeries',
        junior: 'juniorModules',
      };
      const queryKey = contentQueryMap[variables.contentType];
      if (queryKey) {
        queryClient.invalidateQueries({ queryKey: [queryKey] });
      }
      queryClient.invalidateQueries({ queryKey: ['admin-analytics'] });
    },
  });
};