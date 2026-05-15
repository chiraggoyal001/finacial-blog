import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { DbArticle } from '@/lib/types';

export interface Recommendation {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  image: string;
  tags: any;
  views: number;
  likes: number;
  created_at: string;
  content_type: 'article' | 'module';
  relevance_score: number;
}

export const useRecommendations = (limit: number = 6, options?: { staleTime?: number; gcTime?: number }) => {
  const { user, isLoggedIn } = useAuth();

  return useQuery({
    queryKey: ['recommendations', user?.id, limit],
    queryFn: async () => {
      // If user has no interests, we pass null and RPC handles default ranking
      const { data, error } = await supabase.rpc('get_personalized_recommendations', {
        p_user_interests: user?.interests || [],
        p_limit: limit
      });

      if (error) throw error;
      return data as Recommendation[];
    },
    // Only run if logged in (or we could run it for guests with empty interests)
    enabled: true,
    staleTime: options?.staleTime ?? 0,
    gcTime: options?.gcTime ?? 1000 * 60 * 30,
  });
};
