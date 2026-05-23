import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export interface DbProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  avatar_url?: string;
  is_subscribed: boolean;
  onboarding_completed: boolean;
  created_at: string;
  signup_method: string;
  role?: string;
}

export interface ExtendedProfile extends DbProfile {
  total_activities: number;
  total_sessions: number;
  last_active_at: string | null;
  region?: string;
  profession?: string;
  xp?: number;
  interests?: string[];
  age?: number;
}

export interface SystemSetting {
  id: string;
  key: string;
  value: any;
  updated_at: string;
}

// =====================================================
// ARTICLES (ADMIN)
// =====================================================

export interface UseAdminArticlesParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  status?: string;
}

export const useAdminArticles = (params?: UseAdminArticlesParams) => {
  return useQuery({
    queryKey: ['admin-articles', params],
    queryFn: async () => {
      let query = supabase.from('articles').select('*', { count: 'exact' });
      
      if (params?.search) {
        query = query.or(`title.ilike.%${params.search}%,category.ilike.%${params.search}%,author_name.ilike.%${params.search}%`);
      }
      if (params?.category && params.category !== 'all') {
        query = query.eq('category', params.category);
      }
      if (params?.status === 'published') query = query.eq('is_published', true);
      if (params?.status === 'draft') query = query.eq('is_published', false);

      const page = params?.page || 1;
      const limit = params?.limit || 25;
      query = query.range((page - 1) * limit, page * limit - 1).order('created_at', { ascending: false });

      const { data, count, error } = await query;
      if (error) throw error;
      return { data, totalCount: count || 0 };
    }
  });
};

// =====================================================
// MODULES (ADMIN)
// =====================================================

export interface UseAdminModulesParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

export const useAdminModules = (params?: UseAdminModulesParams) => {
  return useQuery({
    queryKey: ['admin-modules', params],
    queryFn: async () => {
      let query = supabase.from('modules').select('*', { count: 'exact' });
      
      if (params?.search) {
        query = query.or(`title.ilike.%${params.search}%,description.ilike.%${params.search}%`);
      }
      if (params?.status === 'published') query = query.eq('is_published', true);
      if (params?.status === 'draft') query = query.eq('is_published', false);

      const page = params?.page || 1;
      const limit = params?.limit || 25;
      query = query.range((page - 1) * limit, page * limit - 1).order('created_at', { ascending: false });

      const { data, count, error } = await query;
      if (error) throw error;
      return { data, totalCount: count || 0 };
    }
  });
};

// =====================================================
// VIDEOS (ADMIN)
// =====================================================

export const useAdminVideos = (params?: UseAdminModulesParams) => {
  return useQuery({
    queryKey: ['admin-videos', params],
    queryFn: async () => {
      let query = supabase.from('video_series').select('*', { count: 'exact' });
      
      if (params?.search) {
        query = query.or(`title.ilike.%${params.search}%,description.ilike.%${params.search}%`);
      }
      if (params?.status === 'published') query = query.eq('is_published', true);
      if (params?.status === 'draft') query = query.eq('is_published', false);

      const page = params?.page || 1;
      const limit = params?.limit || 25;
      query = query.range((page - 1) * limit, page * limit - 1).order('created_at', { ascending: false });

      const { data, count, error } = await query;
      if (error) throw error;
      return { data, totalCount: count || 0 };
    }
  });
};

// =====================================================
// EVENTS (ADMIN)
// =====================================================

export const useAdminEvents = (params?: UseAdminModulesParams) => {
  return useQuery({
    queryKey: ['admin-events', params],
    queryFn: async () => {
      let query = supabase.from('events').select('*', { count: 'exact' });
      
      if (params?.search) {
        query = query.or(`title.ilike.%${params.search}%,location.ilike.%${params.search}%`);
      }
      if (params?.status === 'published') query = query.eq('is_published', true);
      if (params?.status === 'draft') query = query.eq('is_published', false);

      const page = params?.page || 1;
      const limit = params?.limit || 25;
      query = query.range((page - 1) * limit, page * limit - 1).order('created_at', { ascending: false });

      const { data, count, error } = await query;
      if (error) throw error;
      return { data, totalCount: count || 0 };
    }
  });
};

// =====================================================
// JUNIOR (ADMIN)
// =====================================================

export const useAdminJunior = (params?: UseAdminModulesParams) => {
  return useQuery({
    queryKey: ['admin-junior', params],
    queryFn: async () => {
      let query = supabase.from('junior_modules').select('*', { count: 'exact' });
      
      if (params?.search) {
        query = query.or(`title.ilike.%${params.search}%,description.ilike.%${params.search}%`);
      }
      if (params?.status === 'published') query = query.eq('is_published', true);
      if (params?.status === 'draft') query = query.eq('is_published', false);

      const page = params?.page || 1;
      const limit = params?.limit || 25;
      query = query.range((page - 1) * limit, page * limit - 1).order('created_at', { ascending: false });

      const { data, count, error } = await query;
      if (error) throw error;
      return { data, totalCount: count || 0 };
    }
  });
};

// =====================================================
// AB TESTS (ADMIN)
// =====================================================

export interface UseAdminABTestsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

export const useAdminABTests = (params?: UseAdminABTestsParams) => {
  return useQuery({
    queryKey: ['admin-ab-tests', params],
    queryFn: async () => {
      let query = supabase.from('ab_tests').select('*', { count: 'exact' });
      
      if (params?.search) {
        query = query.or(`name.ilike.%${params.search}%,description.ilike.%${params.search}%`);
      }
      if (params?.status && params.status !== 'all') {
        query = query.eq('status', params.status);
      }

      const page = params?.page || 1;
      const limit = params?.limit || 25;
      query = query.range((page - 1) * limit, page * limit - 1).order('created_at', { ascending: false });

      const { data, count, error } = await query;
      if (error) throw error;
      return { data, totalCount: count || 0 };
    }
  });
};

// =====================================================
// AFFILIATES (ADMIN)
// =====================================================

export interface UseAdminAffiliatesParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  category?: string;
}

export const useAdminAffiliates = (params?: UseAdminAffiliatesParams) => {
  return useQuery({
    queryKey: ['admin-affiliates', params],
    queryFn: async () => {
      let query = supabase.from('affiliate_links').select('*', { count: 'exact' });
      
      if (params?.search) {
        query = query.or(`name.ilike.%${params.search}%,category.ilike.%${params.search}%,description.ilike.%${params.search}%`);
      }
      if (params?.status === 'active') query = query.eq('is_active', true);
      if (params?.status === 'paused') query = query.eq('is_active', false);
      if (params?.category && params.category !== 'all') {
        query = query.eq('category', params.category);
      }

      const page = params?.page || 1;
      const limit = params?.limit || 25;
      query = query.range((page - 1) * limit, page * limit - 1).order('created_at', { ascending: false });

      const { data, count, error } = await query;
      if (error) throw error;
      return { data, totalCount: count || 0 };
    }
  });
};

// =====================================================
// USER MANAGEMENT
// =====================================================

export interface UseProfilesParams {
  page?: number;
  limit?: number;
  search?: string;
  roleFilter?: string;
  subFilter?: string;
  onboardingFilter?: string;
  signupMethodFilter?: string;
  regionFilter?: string;
  professionFilter?: string;
  ageGroupFilter?: string;
  activityFilter?: string;
  interestFilter?: string;
}

export const useProfiles = (params?: UseProfilesParams) => {
  return useQuery({
    queryKey: ['admin-profiles', params],
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          email,
          avatar_url,
          is_subscribed,
          onboarding_completed,
          created_at,
          signup_method,
          region,
          profession,
          xp,
          interests,
          age
        `, { count: 'exact' });

      // Apply Search
      if (params?.search) {
        query = query.or(`email.ilike.%${params.search}%,first_name.ilike.%${params.search}%,last_name.ilike.%${params.search}%`);
      }

      // Apply basic filters
      if (params?.subFilter === 'subscribed') query = query.eq('is_subscribed', true);
      if (params?.subFilter === 'free') query = query.eq('is_subscribed', false);
      if (params?.onboardingFilter === 'completed') query = query.eq('onboarding_completed', true);
      if (params?.onboardingFilter === 'pending') query = query.eq('onboarding_completed', false);
      if (params?.signupMethodFilter && params.signupMethodFilter !== 'all') query = query.eq('signup_method', params.signupMethodFilter);
      if (params?.regionFilter && params.regionFilter !== 'all') query = query.eq('region', params.regionFilter);
      if (params?.professionFilter && params.professionFilter !== 'all') query = query.eq('profession', params.professionFilter);
      
      if (params?.ageGroupFilter && params.ageGroupFilter !== 'all') {
        switch (params.ageGroupFilter) {
          case '18-25': query = query.gte('age', 18).lte('age', 25); break;
          case '26-35': query = query.gte('age', 26).lte('age', 35); break;
          case '36-50': query = query.gte('age', 36).lte('age', 50); break;
          case '50+': query = query.gt('age', 50); break;
        }
      }

      if (params?.interestFilter && params.interestFilter !== 'all') {
        query = query.contains('interests', [params.interestFilter]);
      }

      // Pagination
      const page = params?.page || 1;
      const limit = params?.limit || 25;
      query = query.range((page - 1) * limit, page * limit - 1).order('created_at', { ascending: false });

      const { data: profiles, count, error: profileError } = await query;
      if (profileError) throw profileError;

      const profileIds = profiles?.map(p => p.id) || [];

      // Get roles for fetched users
      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id, role_id, roles!inner(name)')
        .in('user_id', profileIds.length > 0 ? profileIds : ['00000000-0000-0000-0000-000000000000']);

      // Get activity counts for fetched users
      const { data: activities } = await supabase
        .from('user_activities')
        .select('user_id, id, session_id, created_at')
        .in('user_id', profileIds.length > 0 ? profileIds : ['00000000-0000-0000-0000-000000000000']);

      // Build a map of user_id -> role
      const roleMap: Record<string, string> = {};
      for (const r of roles || []) {
        const roleName = (r as any).roles?.name;
        if (roleName) {
          roleMap[r.user_id] = roleName;
        }
      }

      // Build activity aggregates per user
      const activityMap: Record<string, { total: number; sessions: Set<string>; lastActive: string | null }> = {};
      for (const a of activities || []) {
        if (!activityMap[a.user_id]) {
          activityMap[a.user_id] = { total: 0, sessions: new Set(), lastActive: null };
        }
        activityMap[a.user_id].total++;
        if (a.session_id) activityMap[a.user_id].sessions.add(a.session_id);
        if (a.created_at && (!activityMap[a.user_id].lastActive || a.created_at > activityMap[a.user_id].lastActive!)) {
          activityMap[a.user_id].lastActive = a.created_at;
        }
      }

      // Merge into extended profiles
      let extendedProfiles: ExtendedProfile[] = (profiles || []).map(p => {
        const a = activityMap[p.id];
        return {
          ...p,
          role: roleMap[p.id] || 'user',
          total_activities: a?.total || 0,
          total_sessions: a?.sessions.size || 0,
          last_active_at: a?.lastActive || null,
        };
      });

      // Role filter must be done post-fetch since it's joined
      if (params?.roleFilter && params.roleFilter !== 'all') {
        extendedProfiles = extendedProfiles.filter(p => p.role === params.roleFilter);
      }

      // Activity filter must also be done post-fetch since it's aggregated
      if (params?.activityFilter && params.activityFilter !== 'all') {
        const now = new Date();
        extendedProfiles = extendedProfiles.filter(u => {
          if (!u.last_active_at) return params.activityFilter === 'inactive-90';
          const lastActive = new Date(u.last_active_at);
          const diffDays = (now.getTime() - lastActive.getTime()) / 86400000;
          switch (params.activityFilter) {
            case 'active-7': return diffDays <= 7;
            case 'active-30': return diffDays <= 30;
            case 'active-90': return diffDays <= 90;
            case 'inactive-90': return diffDays > 90;
            default: return true;
          }
        });
      }

      return {
        data: extendedProfiles,
        totalCount: count || 0
      };
    },
  });
};

export const useUpdateUserSubscription = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, isSubscribed }: { userId: string, isSubscribed: boolean }) => {
      const { data, error } = await supabase
        .from('profiles')
        .update({ is_subscribed: isSubscribed })
        .eq('id', userId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-profiles'] });
    },
  });
};

export const useUpdateUserRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: 'admin' | 'user' }) => {
      // Get role IDs
      const { data: roles, error: rolesError } = await supabase
        .from('roles')
        .select('id, name')
        .in('name', ['admin', 'user']);
      
      if (rolesError) throw rolesError;

      const roleMap: Record<string, string> = {};
      for (const r of roles || []) {
        roleMap[r.name] = r.id;
      }

      const targetRoleId = roleMap[newRole];
      if (!targetRoleId) throw new Error(`Role "${newRole}" not found`);

      // Delete existing role assignments for this user
      const { error: deleteError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (deleteError) throw deleteError;

      // Insert new role
      const { error: insertError } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role_id: targetRoleId });

      if (insertError) throw insertError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-profiles'] });
      toast.success('User role updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update user role: ' + (error as Error).message);
    },
  });
};

export const useSuspendUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, suspend }: { userId: string; suspend: boolean }) => {
      if (suspend) {
        // 1. Ensure 'suspended' role exists
        const { data: suspendRole } = await supabase.from('roles').select('id').eq('name', 'suspended').maybeSingle();
        let suspendedRoleId = suspendRole?.id;

        if (!suspendedRoleId) {
          const { data: newRole } = await supabase.from('roles').insert({ name: 'suspended', permissions: {} }).select().single();
          suspendedRoleId = newRole?.id;
        }

        if (suspendedRoleId) {
          // 2. Delete existing roles and assign 'suspended'
          await supabase.from('user_roles').delete().eq('user_id', userId);
          await supabase.from('user_roles').insert({ user_id: userId, role_id: suspendedRoleId });
        }
      } else {
        // Unsuspend (restore to 'user')
        const { data: userRole } = await supabase.from('roles').select('id').eq('name', 'user').single();
        if (userRole) {
          await supabase.from('user_roles').delete().eq('user_id', userId);
          await supabase.from('user_roles').insert({ user_id: userId, role_id: userRole.id });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-profiles'] });
    },
  });
};

// =====================================================
// SYSTEM SETTINGS
// =====================================================

export const useSystemSettings = () => {
  return useQuery({
    queryKey: ['system-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*');
      
      if (error) throw error;
      
      const settingsMap: Record<string, any> = {};
      data.forEach(s => {
        settingsMap[s.key] = { ...s.value, id: s.id };
      });
      
      return settingsMap;
    },
  });
};

export const useUpdateSystemSetting = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ key, value }: { key: string, value: any }) => {
      const { data, error } = await supabase
        .from('system_settings')
        .update({ value })
        .eq('key', key)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
    },
  });
};

// =====================================================
// ANALYTICS
// =====================================================

export const useAnalytics = () => {
  return useQuery({
    queryKey: ['admin-analytics'],
    queryFn: async () => {
      const [dailyActive, performance] = await Promise.all([
        supabase.from('daily_active_users').select('*').limit(30),
        supabase.from('content_performance').select('*').order('views', { ascending: false }).limit(10)
      ]);
      
      if (dailyActive.error) throw dailyActive.error;
      if (performance.error) throw performance.error;
      
      return {
        dailyActive: dailyActive.data,
        contentPerformance: performance.data
      };
    },
  });
};