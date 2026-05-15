import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface DbUserProgress {
  id: string;
  user_id: string;
  content_id: string;
  progress_percent: number;
  is_read: boolean;
  updated_at: string;
}

export const useUserProgressList = (userId?: string) => {
  return useQuery({
    queryKey: ['user-progress-list', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId);
      
      if (error) throw error;
      return data as DbUserProgress[];
    },
    enabled: !!userId,
  });
};

export const useUpsertProgress = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      userId, 
      contentId, 
      progressPercent, 
      isRead 
    }: { 
      userId: string, 
      contentId: string, 
      progressPercent: number, 
      isRead: boolean 
    }) => {
      const { data, error } = await supabase
        .from('user_progress')
        .upsert({
          user_id: userId,
          content_id: contentId,
          progress_percent: progressPercent,
          is_read: isRead,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,content_id'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-progress-list', variables.userId] });
    },
  });
};
