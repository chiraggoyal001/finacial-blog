import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface QuizSubmissionResult {
  xp_awarded: number;
  total_xp: number;
  percentile: number;
}

export const useSubmitQuiz = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ quizId, score, total }: { quizId: string, score: number, total: number }) => {
      const { data, error } = await supabase.rpc('submit_quiz_and_get_stats', {
        p_quiz_id: quizId,
        p_score: score,
        p_total: total
      });

      if (error) throw error;
      return data as QuizSubmissionResult;
    },
    onSuccess: () => {
      // Invalidate profiles to refresh user XP in the header/profile
      queryClient.invalidateQueries({ queryKey: ['admin-profiles'] });
    },
  });
};
