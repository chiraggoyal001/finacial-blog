import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { ABTest, ABTestVariant, ABTestAssignment } from '@/lib/types';

// =====================================================
// A/B TESTS
// =====================================================

export const useABTests = (status?: string) => {
  return useQuery({
    queryKey: ['abTests', status],
    queryFn: async () => {
      let query = supabase.from('ab_tests').select('*');
      if (status) query = query.eq('status', status);
      
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data as ABTest[];
    },
  });
};

export const useABTest = (id: string) => {
  return useQuery({
    queryKey: ['abTest', id],
    queryFn: async () => {
      const { data: test, error: testError } = await supabase
        .from('ab_tests')
        .select('*')
        .eq('id', id)
        .single();
      if (testError) throw testError;
      
      const { data: variants, error: variantsError } = await supabase
        .from('ab_test_variants')
        .select('*')
        .eq('test_id', id);
      if (variantsError) throw variantsError;
      
      return { ...test, variants } as ABTest & { variants: ABTestVariant[] };
    },
    enabled: !!id,
  });
};

export const useCreateABTest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (test: Omit<ABTest, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase.from('ab_tests').insert(test).select().single();
      if (error) throw error;
      return data as ABTest;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['abTests'] }),
  });
};

export const useUpdateABTest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ABTest> & { id: string }) => {
      const { data, error } = await supabase
        .from('ab_tests')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as ABTest;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['abTests'] });
      queryClient.invalidateQueries({ queryKey: ['abTest', variables.id] });
    },
  });
};

export const useDeleteABTest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('ab_tests').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['abTests'] }),
  });
};

// =====================================================
// A/B TEST VARIANTS
// =====================================================

export const useCreateABTestVariant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (variant: Omit<ABTestVariant, 'id' | 'created_at' | 'views' | 'clicks' | 'conversions'>) => {
      const { data, error } = await supabase.from('ab_test_variants').insert(variant).select().single();
      if (error) throw error;
      return data as ABTestVariant;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['abTest', variables.test_id] });
    },
  });
};

export const useUpdateABTestVariant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ABTestVariant> & { id: string; test_id: string }) => {
      const { data, error } = await supabase
        .from('ab_test_variants')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as ABTestVariant;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['abTest', variables.test_id] });
    },
  });
};

export const useDeleteABTestVariant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, testId }: { id: string; testId: string }) => {
      const { error } = await supabase.from('ab_test_variants').delete().eq('id', id);
      if (error) throw error;
      return { id, testId };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['abTest', variables.testId] });
    },
  });
};

// =====================================================
// A/B TEST ASSIGNMENTS (User-side)
// =====================================================

export const useActiveABTests = () => {
  return useQuery({
    queryKey: ['activeABTests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ab_tests')
        .select('*, ab_test_variants(*)')
        .eq('status', 'running');
      if (error) throw error;
      return data as (ABTest & { ab_test_variants: ABTestVariant[] })[];
    },
  });
};

export const useUserABAssignment = (testId: string, userId: string) => {
  return useQuery({
    queryKey: ['abAssignment', testId, userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from('ab_test_assignments')
        .select('*, ab_test_variants(*)')
        .eq('test_id', testId)
        .eq('user_id', userId)
        .single();
      if (error) return null;
      return data as ABTestAssignment & { ab_test_variants: ABTestVariant };
    },
    enabled: !!testId && !!userId,
  });
};

export const useAssignABVariant = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      testId, 
      userId 
    }: { 
      testId: string; 
      userId: string;
    }) => {
      // Check if already assigned
      const { data: existing } = await supabase
        .from('ab_test_assignments')
        .select('*, ab_test_variants(*)')
        .eq('test_id', testId)
        .eq('user_id', userId)
        .single();
      
      if (existing) {
        return { assignment: existing, variant: (existing as any).ab_test_variants as ABTestVariant };
      }
      
      // Get variants
      const { data: variants, error: variantsError } = await supabase
        .from('ab_test_variants')
        .select('*')
        .eq('test_id', testId);
      
      if (variantsError || !variants?.length) {
        throw new Error('No variants found for this test');
      }
      
      // Weighted random assignment based on traffic_percentage
      const totalWeight = variants.reduce((sum, v) => sum + (v.traffic_percentage || 50), 0);
      let random = Math.random() * totalWeight;
      let selectedVariant = variants[0];
      
      for (const variant of variants) {
        random -= (variant.traffic_percentage || 50);
        if (random <= 0) {
          selectedVariant = variant;
          break;
        }
      }
      
      // Create assignment
      const { data: assignment, error: assignError } = await supabase
        .from('ab_test_assignments')
        .insert({
          test_id: testId,
          user_id: userId,
          variant_id: selectedVariant.id,
        })
        .select('*, ab_test_variants(*)')
        .single();
      
      if (assignError) throw assignError;
      
      return { 
        assignment: assignment as ABTestAssignment, 
        variant: (assignment as any).ab_test_variants as ABTestVariant 
      };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['abAssignment', variables.testId, variables.userId] });
    },
  });
};

// =====================================================
// A/B TEST METRICS
// =====================================================

export const useRecordABTestView = () => {
  return useMutation({
    mutationFn: async (variantId: string) => {
      const { error } = await supabase.rpc('increment_variant_views', { variant_id: variantId });
      if (error) {
        // Fallback: direct update if RPC doesn't exist
        await supabase
          .from('ab_test_variants')
          .update({ views: supabase.rpc('increment', { x: 1 }) })
          .eq('id', variantId);
      }
    },
  });
};

export const useRecordABTestClick = () => {
  return useMutation({
    mutationFn: async (variantId: string) => {
      const { error } = await supabase.rpc('increment_variant_clicks', { variant_id: variantId });
      if (error) {
        // Fallback
        const { data: variant } = await supabase
          .from('ab_test_variants')
          .select('clicks')
          .eq('id', variantId)
          .single();
        if (variant) {
          await supabase
            .from('ab_test_variants')
            .update({ clicks: (variant.clicks || 0) + 1 })
            .eq('id', variantId);
        }
      }
    },
  });
};

export const useRecordABTestConversion = () => {
  return useMutation({
    mutationFn: async (variantId: string) => {
      const { error } = await supabase.rpc('increment_variant_conversions', { variant_id: variantId });
      if (error) {
        // Fallback
        const { data: variant } = await supabase
          .from('ab_test_variants')
          .select('conversions')
          .eq('id', variantId)
          .single();
        if (variant) {
          await supabase
            .from('ab_test_variants')
            .update({ conversions: (variant.conversions || 0) + 1 })
            .eq('id', variantId);
        }
      }
    },
  });
};

// =====================================================
// HELPER HOOK: Get Variant for Current User (REFACTORED)
// =====================================================

export const useABTestVariantForUser = (testName: string, userId?: string) => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['abTestVariant', testName, userId],
    queryFn: async () => {
      if (!userId) return null;
      
      // 1. Find the test by name
      const { data: test, error: testError } = await supabase
        .from('ab_tests')
        .select('id')
        .eq('name', testName)
        .eq('status', 'running')
        .single();
      
      if (testError || !test) return null;
      
      // 2. Check if user already has an assignment
      const { data: assignment, error: assignError } = await supabase
        .from('ab_test_assignments')
        .select('*, ab_test_variants(*)')
        .eq('test_id', test.id)
        .eq('user_id', userId)
        .single();
      
      if (!assignError && assignment) {
        return (assignment as any).ab_test_variants as ABTestVariant;
      }
      
      // 3. If no assignment, create one (LOGIC MOVED OUT OF MUTATION CALL)
      // Get variants
      const { data: variants } = await supabase
        .from('ab_test_variants')
        .select('*')
        .eq('test_id', test.id);
      
      if (!variants?.length) return null;
      
      // Weighted random assignment
      const totalWeight = variants.reduce((sum, v) => sum + (v.traffic_percentage || 50), 0);
      let random = Math.random() * totalWeight;
      let selectedVariant = variants[0];
      
      for (const variant of variants) {
        random -= (variant.traffic_percentage || 50);
        if (random <= 0) {
          selectedVariant = variant;
          break;
        }
      }
      
      // Persist assignment
      const { data: newAssignment } = await supabase
        .from('ab_test_assignments')
        .insert({
          test_id: test.id,
          user_id: userId,
          variant_id: selectedVariant.id,
        })
        .select('*, ab_test_variants(*)')
        .single();
      
      return (newAssignment as any)?.ab_test_variants as ABTestVariant || selectedVariant;
    },
    enabled: !!userId && !!testName,
    staleTime: Infinity, // Assignments shouldn't change
  });
};
