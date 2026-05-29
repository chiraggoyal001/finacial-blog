import React, { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from "react";
import { User } from "@/lib/types";
import { supabase } from "@/lib/supabase";
import { triggerEmail } from "@/lib/sendEmail";

interface AuthContextType {
  user: User | null;
  userRole: string | null;
  isLoggedIn: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  isSigningOut: boolean;
  needsOnboarding: boolean;
  setNeedsOnboarding: (val: boolean) => void;
  login: (email: string, password: string) => Promise<{ success: boolean; isAdmin?: boolean; needsOnboarding?: boolean; error?: string }>;
  signup: (params: { email: string; password: string; firstName: string; lastName: string; isSubscribed?: boolean; mailPreference?: string; notifyLaunches?: boolean }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  updateAvatar: (url: string) => void;
  signInWithOAuth: (provider: 'google') => Promise<{ success: boolean; error?: string }>;
  markOnboardingComplete: () => void;
  updateUserAvatar: (url: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
export { AuthContext };

const mapSupabaseUser = (supabaseUser: any, profileData: any): User => ({
  id: supabaseUser.id,
  email: supabaseUser.email || "",
  firstName: profileData.firstName || profileData.first_name || "",
  lastName: profileData.lastName || profileData.last_name || "",
  avatarUrl: profileData.avatarUrl || profileData.avatar_url || "",
  isSubscribed: profileData.isSubscribed || profileData.is_subscribed || false,
  onboardingCompleted: profileData.onboardingCompleted || profileData.onboarding_completed || false,
  mailPreference: profileData.mailPreference || "non-intrusive",
  notifyLaunches: profileData.notifyLaunches || false,
  age: profileData.age,
  region: profileData.region,
  interests: profileData.interests || [],
  xp: profileData.xp || 0,
});

const ADMIN_EMAILS = ['goyalchirag721@gmail.com', 'anuraggoyal231@gmail.com'];

/** 
 * Determines the effective user role, falling back to the email-based admin check
 * if the database role query is null, undefined, or empty.
 */
const getEffectiveRole = (dbRole: string | null | undefined, email: string | undefined): string => {
  if (dbRole === 'admin') return 'admin';
  if (!dbRole || dbRole === 'user') {
    if (email && ADMIN_EMAILS.includes(email.toLowerCase())) {
      return 'admin';
    }
  }
  return dbRole || 'user';
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  
  const hasCompletedInitialAuth = useRef(false);
  const isProcessingLogin = useRef(false);
  const authTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Profile data fetcher (Consolidated) with fallback when no profile row exists
  const fetchProfileAndSetUser = useCallback(async (supabaseUser: any) => {
    if (!supabaseUser) return;
    
    try {
      const [{ data: profile }, { data: roleData }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', supabaseUser.id).maybeSingle(),
        supabase.from('user_roles').select('*, roles(*)').eq('user_id', supabaseUser.id).maybeSingle()
      ]);

      if (profile) {
        const mappedUser = mapSupabaseUser(supabaseUser, profile);
        setUser(mappedUser);
        setUserRole(getEffectiveRole((roleData as any)?.roles?.name, supabaseUser.email));
        setNeedsOnboarding(!profile.onboarding_completed);
      } else {
        // No profile row found — the DB trigger may not have fired yet, or the user
        // signed up via OAuth and the trigger is still processing. Set a minimal user
        // from the auth session so the user isn't stuck in "logged out" limbo.
        const fallbackUser: User = {
          id: supabaseUser.id,
          email: supabaseUser.email || '',
          firstName: supabaseUser.user_metadata?.firstName || supabaseUser.user_metadata?.given_name || '',
          lastName: supabaseUser.user_metadata?.lastName || supabaseUser.user_metadata?.family_name || '',
          avatarUrl: supabaseUser.user_metadata?.avatar_url || supabaseUser.user_metadata?.picture || '',
          isSubscribed: false,
          onboardingCompleted: false,
          mailPreference: 'non-intrusive',
          notifyLaunches: false,
          age: undefined,
          region: undefined,
          interests: [],
          xp: 0,
        };
        setUser(fallbackUser);
        setUserRole(getEffectiveRole((roleData as any)?.roles?.name, supabaseUser.email));
        setNeedsOnboarding(true);
        console.warn('No profile row found for user; using fallback user object. Trigger may be delayed.');
      }
    } catch (err) {
      console.error('Error fetching full profile:', err);
      // Even on error, set a minimal user from auth data so the user isn't stuck
      const fallbackUser: User = {
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        firstName: supabaseUser.user_metadata?.firstName || '',
        lastName: supabaseUser.user_metadata?.lastName || '',
        avatarUrl: supabaseUser.user_metadata?.avatar_url || '',
        isSubscribed: false,
        onboardingCompleted: false,
        mailPreference: 'non-intrusive',
        notifyLaunches: false,
        age: undefined,
        region: undefined,
        interests: [],
        xp: 0,
      };
      setUser(fallbackUser);
      // Even on error, use email fallback for admin detection
      setUserRole(getEffectiveRole(null, supabaseUser.email));
      setNeedsOnboarding(true);
    }
  }, []);

  // Initialize session once
  useEffect(() => {
    let mounted = true;

    const initSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted && session?.user) {
          await fetchProfileAndSetUser(session.user);
        }
      } catch (err) {
        console.error('Session init error:', err);
      } finally {
        if (mounted) {
          setIsLoading(false);
          hasCompletedInitialAuth.current = true;
        }
      }
    };
    void initSession();

    // Setup global auth state listener
    // IMPORTANT: onAuthStateChange fires 'SIGNED_IN' for the existing session immediately
    // when subscribed. We skip this initial event because initSession() already handles it.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      // Skip the initial SIGNED_IN event that fires for an existing session -
      // initSession() already fetched the profile above
      if (event === 'SIGNED_IN' && hasCompletedInitialAuth.current) {
        // Skip if login() already eagerly called fetchProfileAndSetUser
        if (isProcessingLogin.current) {
          isProcessingLogin.current = false;
          return;
        }
        // This is a new sign-in (not the initial one), fetch the profile
        if (session?.user) {
          await fetchProfileAndSetUser(session.user);
        }
      } else if (event === 'USER_UPDATED' && session?.user) {
        await fetchProfileAndSetUser(session.user);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setUserRole(null);
        setNeedsOnboarding(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfileAndSetUser]);

  // Profiles Realtime Subscription — listens for both INSERT and UPDATE so that
  // if the DB trigger creates a profile row after we've set a fallback user
  // (e.g. during OAuth), we seamlessly swap in the real profile data.
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`profile-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
        (payload) => {
          const up = payload.new as Record<string, any>;
          // No new data or a DELETE event — nothing to update
          if (!up || !up.id || payload.eventType === 'DELETE') return;
          
          // Use the supabase user data from the auth session to rebuild the mapped user
          supabase.auth.getUser().then(({ data: { user: authUser } }) => {
            if (!authUser) return;
            
            // Fetch full profile + role to rebuild the state properly
            Promise.all([
              supabase.from('profiles').select('*').eq('id', up.id).maybeSingle(),
              supabase.from('user_roles').select('*, roles(*)').eq('user_id', up.id).maybeSingle()
            ]).then(([{ data: freshProfile }, { data: roleData }]) => {
              if (freshProfile) {
                const mappedUser = mapSupabaseUser(authUser, freshProfile);
                setUser(mappedUser);
                setUserRole((roleData as any)?.roles?.name || 'user');
                setNeedsOnboarding(!freshProfile.onboarding_completed);
              }
            }).catch(() => {
              // Fallback — at least apply the changed fields from the payload
              setUser(prev => {
                if (!prev || prev.id !== up.id) return prev;
                return {
                  ...prev,
                  xp: up.xp ?? prev.xp,
                  isSubscribed: up.is_subscribed ?? prev.isSubscribed,
                  onboardingCompleted: up.onboarding_completed ?? prev.onboardingCompleted,
                  avatarUrl: up.avatar_url ?? prev.avatarUrl,
                  interests: up.interests ?? prev.interests,
                  firstName: up.first_name ?? prev.firstName,
                  lastName: up.last_name ?? prev.lastName,
                  age: up.age ?? prev.age,
                  region: up.region ?? prev.region,
                };
              });
              if (up.onboarding_completed !== undefined) {
                setNeedsOnboarding(!up.onboarding_completed);
              }
            });
          });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const login = async (email: string, password: string) => {
    isProcessingLogin.current = true;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { isProcessingLogin.current = false; return { success: false, error: error.message }; }
    
    try {
      const [{ data: profile }, { data: roleData }] = await Promise.all([
        supabase.from('profiles').select('onboarding_completed').eq('id', data.user.id).maybeSingle(),
        supabase.from('user_roles').select('*, roles(*)').eq('user_id', data.user.id).maybeSingle()
      ]);
      const isAdmin = getEffectiveRole((roleData as any)?.roles?.name, data.user.email) === 'admin';
      const needsOnboardingVal = profile ? !profile.onboarding_completed : false;
      
      // Eagerly set local user state before the onAuthStateChange event fires,
      // preventing a flash where ProtectedRoute redirects to /login
      // after a successful login.
      await fetchProfileAndSetUser(data.user);
      
      return { success: true, isAdmin, needsOnboarding: needsOnboardingVal };
    } catch {
      // Even if profile/role fetch fails, eagerly set state from auth data
      await fetchProfileAndSetUser(data.user);
      return { success: true };
    }
  };

  const signup = async (params: { email: string; password: string; firstName: string; lastName: string; isSubscribed?: boolean; mailPreference?: string; notifyLaunches?: boolean }) => {
    const { email, password, firstName, lastName, isSubscribed, mailPreference, notifyLaunches } = params;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { 
        data: { firstName, lastName },
        emailRedirectTo: `${window.location.origin}/auth/callback`
      },
    });
    if (error) return { success: false, error: error.message };

    if (data?.user) {
      const profileUpdates: Record<string, any> = {
        first_name: firstName,
        last_name: lastName,
        email,
        signup_method: 'email',
      };
      if (isSubscribed !== undefined) profileUpdates.is_subscribed = isSubscribed;
      if (mailPreference !== undefined) profileUpdates.mail_preference = mailPreference;
      if (notifyLaunches !== undefined) profileUpdates.notify_launches = notifyLaunches;

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({ id: data.user.id, ...profileUpdates });

      if (profileError) {
        console.error('Error saving profile after signup:', profileError);
      } else {
        // Fire welcome email (fire-and-forget)
        triggerEmail({
          type: 'signup',
          email,
          first_name: firstName,
          last_name: lastName,
        });

        // Fire subscription email if user opted to subscribe during signup
        if (isSubscribed) {
          triggerEmail({
            type: 'subscription',
            email,
            first_name: firstName,
            last_name: lastName,
          });
        }
      }
    }

    return { success: true };
  };

  const logout = async () => {
    try {
      setIsSigningOut(true);
      await supabase.auth.signOut();
      setUser(null);
      setUserRole(null);
      setNeedsOnboarding(false);
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setIsSigningOut(false);
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    try {
      if (!user) throw new Error("Not logged in");

      const profileUpdates: any = {};
      if (data.firstName !== undefined) profileUpdates.first_name = data.firstName;
      if (data.lastName !== undefined) profileUpdates.last_name = data.lastName;
      if (data.age !== undefined) profileUpdates.age = data.age;
      if (data.region !== undefined) profileUpdates.region = data.region;
      if (data.interests !== undefined) profileUpdates.interests = data.interests;
      if (data.hobbies !== undefined) profileUpdates.hobbies = data.hobbies;
      if (data.profession !== undefined) profileUpdates.profession = data.profession;
      if (data.description !== undefined) profileUpdates.description = data.description;
      if (data.mailPreference !== undefined) profileUpdates.mail_preference = data.mailPreference;
      if (data.notifyLaunches !== undefined) profileUpdates.notify_launches = data.notifyLaunches;
      if (data.onboardingCompleted !== undefined) profileUpdates.onboarding_completed = data.onboardingCompleted;

      const { error: profileError } = await supabase
        .from('profiles')
        .update(profileUpdates)
        .eq('id', user.id);

      if (profileError) throw profileError;

      setUser(prev => prev ? { ...prev, ...data } : null);
      if (data.onboardingCompleted !== undefined) {
        setNeedsOnboarding(!data.onboardingCompleted);
      }
      
      return { success: true };
    } catch (error: any) {
      console.error('Profile update error:', error);
      return { success: false, error: error.message };
    }
  };

  const updateAvatar = (url: string) => {
    setUser(prev => prev ? { ...prev, avatarUrl: url } : null);
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  };

  const signInWithOAuth = async (provider: 'google') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({ 
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        }
      });
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || `${provider} login failed` };
    }
  };

  const markOnboardingComplete = () => {
    setNeedsOnboarding(false);
  };

  const updateUserAvatar = (url: string | null) => {
    setUser(prev => prev ? { ...prev, avatarUrl: url || '' } : null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userRole,
        isLoggedIn: !!user,
        isAdmin: userRole === "admin",
        isLoading,
        isSigningOut,
        needsOnboarding,
        setNeedsOnboarding,
        login,
        signup,
        logout,
        updateProfile,
        resetPassword,
        updateAvatar,
        signInWithOAuth,
        markOnboardingComplete,
        updateUserAvatar,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};