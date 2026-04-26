import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User } from "@/lib/types";
import { ADMIN_EMAILS } from "@/lib/data";
import { supabase } from "@/lib/supabase";
import { Skeleton } from "@/components/ui/skeleton";

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (data: Partial<User> & { password: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (data: Partial<User>) => Promise<{ success: boolean; error?: string }>;
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
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAdmin = user ? ADMIN_EMAILS.includes(user.email) : false;
  const isLoggedIn = !!user;

  // Check for existing session on app load
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const mappedUser = mapSupabaseUser(session.user, session.user.user_metadata);
          setUser(mappedUser);
        }
      } catch (error) {
        console.error("Error checking session:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();

    // Listen for auth state changes (login, logout, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        const mappedUser = mapSupabaseUser(session.user, session.user.user_metadata);
        setUser(mappedUser);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

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
        return { success: true };
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

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error("Logout error:", error);
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

  return (
    <AuthContext.Provider value={{ user, isAdmin, isLoggedIn, isLoading, login, signup, logout, resetPassword, updateProfile }}>
      {isLoading ? (
        <div className="min-h-screen flex items-center justify-center">
          <div className="space-y-4 w-full max-w-md px-4">
            <Skeleton className="h-8 w-3/4 mx-auto" />
            <Skeleton className="h-4 w-1/2 mx-auto" />
            <Skeleton className="h-32 w-full" />
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
