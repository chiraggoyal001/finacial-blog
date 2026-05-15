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
// USER MANAGEMENT
// =====================================================

export const useProfiles = () => {
  return useQuery({
    queryKey: ['admin-profiles'],
    queryFn: async () => {
      // Fetch profiles with role info and activity counts
      const { data: profiles, error: profileError } = await supabase
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
        `);

      if (profileError) throw profileError;

      // Get roles for all users
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role_id, roles!inner(name)');

      if (rolesError) throw rolesError;

      // Get activity counts for all users
      const { data: activities, error: actError } = await supabase
        .from('user_activities')
        .select('user_id, id, session_id, created_at');

      if (actError) throw actError;

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
      const extendedProfiles: ExtendedProfile[] = (profiles || []).map(p => {
        const a = activityMap[p.id];
        return {
          ...p,
          role: roleMap[p.id] || 'user',
          total_activities: a?.total || 0,
          total_sessions: a?.sessions.size || 0,
          last_active_at: a?.lastActive || null,
        };
      });

      // Sort by newest first
      extendedProfiles.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      return extendedProfiles;
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
        // Disable user by revoking all roles
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId);
        if (error) throw error;
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