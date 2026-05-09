import React, { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from "react";
import { User } from "@/lib/types";
import { supabase } from "@/lib/supabase";
import { Skeleton } from "@/components/ui/skeleton";

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  isLoggedIn: boolean;
  isLoading: boolean;
  isSigningOut: boolean;
  needsOnboarding: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; needsOnboarding?: boolean; isAdmin?: boolean }>;
  signup: (data: Partial<User> & { password: string }) => Promise<{ success: boolean; error?: string }>;
  signInWithOAuth: (provider: 'google' | 'twitter') => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (data: Partial<User>) => Promise<{ success: boolean; error?: string }>;
  updateUserAvatar: (avatarUrl: string | null) => void;
  checkProfileCompletion: () => Promise<boolean>;
  markOnboardingComplete: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to convert Supabase user to our User type
const mapSupabaseUser = (supabaseUser: any, userData: any): User => ({
  id: supabaseUser.id,
  firstName: userData?.firstName || supabaseUser.user_metadata?.firstName || "",
  lastName: userData?.lastName || supabaseUser.user_metadata?.lastName || "",
  email: supabaseUser.email || "",
  isSubscribed: userData?.isSubscribed || supabaseUser.user_metadata?.isSubscribed || false,
  mailPreference: userData?.mailPreference || supabaseUser.user_metadata?.mailPreference || "non-intrusive",
  notifyLaunches: userData?.notifyLaunches || supabaseUser.user_metadata?.notifyLaunches || false,
  age: userData?.age || supabaseUser.user_metadata?.age,
  region: userData?.region || supabaseUser.user_metadata?.region,
  interests: userData?.interests || supabaseUser.user_metadata?.interests,
  hobbies: userData?.hobbies || supabaseUser.user_metadata?.hobbies,
  profession: userData?.profession || supabaseUser.user_metadata?.profession,
  description: userData?.description || supabaseUser.user_metadata?.description,
  avatarUrl: userData?.avatarUrl || userData?.avatar_url || supabaseUser.user_metadata?.avatarUrl,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [userRole, setUserRole] = useState<'admin' | 'user' | null>(null);

  // Refs to prevent race conditions and stale closures
  const isProcessingAuth = useRef(false);
  const authTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasCompletedInitialAuth = useRef(false);

  const isAdmin = userRole === 'admin';
  const isLoggedIn = !!user;

  // Fetch user role from database - wrapped in useCallback to prevent stale closures
  const fetchUserRole = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('roles(name)')
        .eq('user_id', userId)
        .single();
      
      if (error || !data) {
        setUserRole('user');
        return;
      }
      
      const roleName = (data.roles as any)?.name as 'admin' | 'user';
      setUserRole(roleName || 'user');
    } catch (error) {
      console.error('Error fetching user role:', error);
      setUserRole('user');
    }
  }, []);

  // Check if user profile needs onboarding and fetch avatar - wrapped in useCallback
  const checkProfileCompletion = useCallback(async (userId: string): Promise<boolean> => {
    try {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("onboarding_completed, avatar_url")
        .eq("id", userId)
        .single();

      if (error || !profile) {
        return true; // Assume needs onboarding if no profile
      }

      // Update user state with avatar URL if available
      if (profile.avatar_url) {
        setUser((prev) => prev ? { ...prev, avatarUrl: profile.avatar_url } : null);
      }

      return !profile.onboarding_completed;
    } catch {
      return true;
    }
  }, []);

  // Create profile in database after signup
  const createUserProfile = async (
    userId: string,
    data: Partial<User> & { signupIp?: string; userAgent?: string }
  ) => {
    try {
      const { error } = await supabase.from("profiles").insert({
        id: userId,
        first_name: data.firstName || "",
        last_name: data.lastName || "",
        email: data.email || "",
        is_subscribed: data.isSubscribed || false,
        mail_preference: data.mailPreference || "non-intrusive",
        notify_launches: data.notifyLaunches || false,
        signup_ip: data.signupIp || null,
        signup_user_agent: data.userAgent || null,
        onboarding_completed: false,
      });

      if (error) {
        console.error("Error creating profile:", error);
      }
    } catch (error) {
      console.error("Error creating profile:", error);
    }
  };

  // Fetch complete user profile including avatar_url - wrapped in useCallback
  const fetchUserProfile = useCallback(async (userId: string): Promise<{ avatarUrl?: string; onboardingCompleted?: boolean }> => {
    try {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("avatar_url, onboarding_completed")
        .eq("id", userId)
        .single();

      if (error || !profile) {
        return {};
      }

      return {
        avatarUrl: profile.avatar_url || undefined,
        onboardingCompleted: profile.onboarding_completed,
      };
    } catch {
      return {};
    }
  }, []);

  // Safety timeout to prevent infinite loading state
  useEffect(() => {
    if (isLoading) {
      // Clear any existing timeout
      if (authTimeoutRef.current) {
        clearTimeout(authTimeoutRef.current);
      }
      // Set a safety timeout to clear loading after 8 seconds
      authTimeoutRef.current = setTimeout(() => {
        if (isLoading && !hasCompletedInitialAuth.current) {
          console.warn('Auth safety timeout triggered - forcing loading state to false');
          setIsLoading(false);
        }
      }, 8000);
    }
    return () => {
      if (authTimeoutRef.current) {
        clearTimeout(authTimeoutRef.current);
      }
    };
  }, [isLoading]);

  // Check for existing session on app load with race condition guards
  useEffect(() => {
    // Guard against duplicate processing
    if (isProcessingAuth.current) return;
    if (hasCompletedInitialAuth.current) return;

    const checkSession = async () => {
      isProcessingAuth.current = true;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          // Fetch profile data FIRST to include avatar_url
          const profileData = await fetchUserProfile(session.user.id);
          
          const mappedUser = mapSupabaseUser(session.user, {
            ...session.user.user_metadata,
            avatarUrl: profileData.avatarUrl,
          });
          setUser(mappedUser);
          
          // Fetch user role from database
          await fetchUserRole(session.user.id);
          
          // Set onboarding status from profile
          setNeedsOnboarding(!profileData.onboardingCompleted);
        }
      } catch (error) {
        console.error("Error checking session:", error);
      } finally {
        hasCompletedInitialAuth.current = true;
        isProcessingAuth.current = false;
        setIsLoading(false);
      }
    };

    checkSession();
  }, [fetchUserProfile, fetchUserRole]);

  // Listen for auth state changes separately from initial check
  useEffect(() => {
    // Use refs for fresh callbacks
    const handleAuthStateChange = async (event: string, session: any) => {
      // Guard against processing during initial auth check
      if (!hasCompletedInitialAuth.current && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
        // Let the initial checkSession handle this
        return;
      }

      if (event === "SIGNED_IN" && session?.user) {
        // Fetch profile data FIRST to include avatar_url
        const profileData = await fetchUserProfile(session.user.id);
        
        const mappedUser = mapSupabaseUser(session.user, {
          ...session.user.user_metadata,
          avatarUrl: profileData.avatarUrl,
        });
        setUser(mappedUser);
        
        // Fetch user role from database
        await fetchUserRole(session.user.id);
        
        // Set onboarding status from profile
        setNeedsOnboarding(!profileData.onboardingCompleted);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setUserRole(null);
        setNeedsOnboarding(false);
        // DO NOT reset setIsSigningOut here — logout() needs it to stay true
        // to prevent login screen flicker during the page transition
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Use void to handle async without awaiting
      void handleAuthStateChange(event, session);
    });

    return () => subscription.unsubscribe();
  }, [fetchUserProfile, fetchUserRole]);

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        const mappedUser = mapSupabaseUser(data.user, data.user.user_metadata);
        setUser(mappedUser);
        
        // Fetch user role from database
        await fetchUserRole(data.user.id);
        
        // Check if user needs onboarding
        const needsOnboardingStatus = await checkProfileCompletion(data.user.id);
        setNeedsOnboarding(needsOnboardingStatus);
        
        // Determine if admin based on email
        const isUserAdmin = ['goyalchirag721@gmail.com', 'anuraggoyal231@gmail.com'].includes(data.user.email || '');
        
        return { success: true, needsOnboarding: needsOnboardingStatus, isAdmin: isUserAdmin };
      }

      return { success: false, error: "Login failed" };
    } catch (error: any) {
      return { success: false, error: error.message || "An unexpected error occurred" };
    }
  };

  const signup = async (data: Partial<User> & { password: string }) => {
    try {
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email || "",
        password: data.password,
        options: {
          data: {
            firstName: data.firstName || "",
            lastName: data.lastName || "",
            isSubscribed: data.isSubscribed || false,
            mailPreference: data.mailPreference || "non-intrusive",
            notifyLaunches: data.notifyLaunches || false,
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (authData.user) {
        const mappedUser = mapSupabaseUser(authData.user, authData.user.user_metadata);
        setUser(mappedUser);
        
        // Create profile in database
        const signupIp = await fetch("https://api.ipify.org?format=json")
          .then((r) => r.json())
          .then((d) => d.ip)
          .catch(() => null);
        
        await createUserProfile(authData.user.id, {
          ...data,
          signupIp,
          userAgent: navigator.userAgent,
        });
        
        // New users always need onboarding
        setNeedsOnboarding(true);
        
        // If email confirmation is required, user might need to verify email first
        if (authData.session) {
          return { success: true };
        } else {
          return { success: true, error: "Please check your email to confirm your account" };
        }
      }

      return { success: false, error: "Signup failed" };
    } catch (error: any) {
      return { success: false, error: error.message || "An unexpected error occurred" };
    }
  };

  const signInWithOAuth = async (provider: 'google' | 'twitter') => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin + '/auth/callback',
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      // OAuth redirects, so we don't get an immediate session
      // The auth callback page will handle the session
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || "An unexpected error occurred" };
    }
  };

  const logout = async () => {
    try {
      setIsSigningOut(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      setNeedsOnboarding(false);
      // isSigningOut stays true here intentionally — the spinner remains
      // visible during page navigation, preventing login screen flicker.
      // The AuthProvider will be re-created with isSigningOut=false after
      // the full page reload.
    } catch (error) {
      console.error("Logout error:", error);
      setIsSigningOut(false);  // Reset on error so user sees error message
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + "/reset-password",
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || "An unexpected error occurred" };
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    try {
      const { error } = await supabase.auth.updateUser({
        data: data,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      // Update local user state with new data
      setUser((prev) => (prev ? { ...prev, ...data } : null));
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || "An unexpected error occurred" };
    }
  };

  // Mark onboarding as complete (called from ProfilePage when profile is saved)
  const markOnboardingComplete = () => {
    setNeedsOnboarding(false);
  };

  // Update user avatar URL in state (called after upload)
  const updateUserAvatar = (avatarUrl: string | null) => {
    setUser((prev) => (prev ? { ...prev, avatarUrl: avatarUrl || undefined } : null));
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, isLoggedIn, isLoading, isSigningOut, needsOnboarding, login, signup, signInWithOAuth, logout, resetPassword, updateProfile, updateUserAvatar, checkProfileCompletion: () => user ? checkProfileCompletion(user.id) : Promise.resolve(false), markOnboardingComplete }}>
      {isLoading ? (
        <div className="min-h-screen flex items-center justify-center">
          <div className="space-y-4 w-full max-w-md px-4">
            <Skeleton className="h-8 w-3/4 mx-auto" />
            <Skeleton className="h-4 w-1/2 mx-auto" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      ) : isSigningOut ? (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center space-y-4">
            <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-muted-foreground">Signing out...</p>
          </div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
