import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { triggerEmail } from '@/lib/sendEmail';
import { toast } from 'sonner';

export default function AuthCallback() {
  const navigate = useNavigate();
  const processedRef = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Helper to create profile for OAuth users (uses upsert to handle existing profiles)
  const createOAuthProfile = useCallback(async (user: any) => {
    try {
      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        first_name: user.user_metadata?.first_name || user.user_metadata?.given_name || user.user_metadata?.name?.split(' ')[0] || '',
        last_name: user.user_metadata?.last_name || user.user_metadata?.family_name || user.user_metadata?.name?.split(' ').slice(1).join(' ') || '',
        email: user.email || '',
        is_subscribed: false,
        mail_preference: 'non-intrusive',
        notify_launches: false,
        avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
        signup_method: user.app_metadata?.provider || 'oauth',
        onboarding_completed: false,
      });

      if (error) {
        console.error('Error creating OAuth profile:', error);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Error creating OAuth profile:', err);
      return false;
    }
  }, []);

  // Helper to check if user needs onboarding
  const checkAndRedirect = useCallback(async (userId: string, nextUrl: string = '/') => {
    try {
      if (nextUrl === '/reset-password') {
        navigate('/reset-password');
        return;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('onboarding_completed, signup_method, first_name')
        .eq('id', userId)
        .maybeSingle();

      if (error || !profile) {
        // If no profile exists, create one for OAuth users
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const created = await createOAuthProfile(user);
          if (created) {
            // Fire welcome email for new OAuth user
            triggerEmail({
              type: 'signup',
              email: user.email || '',
              first_name: user.user_metadata?.first_name || user.user_metadata?.given_name || user.user_metadata?.name?.split(' ')[0] || '',
              last_name: user.user_metadata?.last_name || user.user_metadata?.family_name || user.user_metadata?.name?.split(' ').slice(1).join(' ') || '',
            });
            // New OAuth profile created, redirect to onboarding
            toast.success('Welcome! Please complete your profile.');
            navigate('/onboarding');
            return;
          }
        }
        // If we couldn't create profile or get user, show error
        toast.error('Profile not found');
        navigate('/login');
        return;
      }

      const needsOnboarding = !profile.onboarding_completed || !profile.first_name;

      if (needsOnboarding) {
        // New OAuth user or incomplete profile - redirect to onboarding
        const method = profile.signup_method || 'email';
        if (method !== 'email') {
          toast.success(`Welcome! Please complete your profile.`);
        } else {
          toast.success('Please complete your profile to continue.');
        }
        navigate('/onboarding');
      } else {
        // Existing complete profile - go home or to nextUrl
        toast.success('Logged in successfully!');
        navigate(nextUrl);
      }
    } catch {
      toast.success('Logged in successfully!');
      navigate(nextUrl);
    }
  }, [navigate, createOAuthProfile]);

  useEffect(() => {
    // Guard against double-execution in StrictMode
    if (processedRef.current) return;
    processedRef.current = true;

    // Check for error parameters in the URL first
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const searchParams = new URLSearchParams(window.location.search);

    const error = hashParams.get('error') || searchParams.get('error');
    const errorDescription = hashParams.get('error_description') || searchParams.get('error_description');
    const nextUrl = searchParams.get('next') || '/';

    if (error) {
      toast.error(errorDescription || 'Authentication failed');
      timerRef.current = setTimeout(() => navigate('/login'), 2000);
      return;
    }

    const code = searchParams.get('code');
    if (code) {
      // Manual exchange to ensure reliable PKCE flow
      supabase.auth.exchangeCodeForSession(code).then(({ data, error: exchangeError }) => {
        if (exchangeError) {
          toast.error('Authentication failed: ' + exchangeError.message);
          navigate('/login');
        } else if (data.session) {
          void checkAndRedirect(data.session.user.id, nextUrl);
        } else {
          navigate('/login');
        }
      }).catch((err) => {
        toast.error('Authentication failed: ' + (err.message || err));
        navigate('/login');
      });
      return;
    }

    // Check if we already have a session (for OAuth redirect)
    supabase.auth.getSession().then(({ data: { session }, error: sessionError }) => {
      if (sessionError) {
        toast.error('Authentication failed: ' + sessionError.message);
        timerRef.current = setTimeout(() => navigate('/login'), 2000);
        return;
      }

      if (session) {
        void checkAndRedirect(session.user.id, nextUrl);
        return;
      }

      // No session yet - listen for SIGNED_IN event (OAuth may still be processing)
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session) {
          subscription.unsubscribe();
          void checkAndRedirect(session.user.id, nextUrl);
        }
      });

      // Safety timeout if OAuth never completes
      timerRef.current = setTimeout(() => {
        subscription.unsubscribe();
        supabase.auth.getSession().then(({ data: { session: delayedSession } }) => {
          if (delayedSession) {
            void checkAndRedirect(delayedSession.user.id, nextUrl);
          } else {
            toast.error('Authentication timed out');
            navigate('/login');
          }
        });
      }, 10000); // 10 second safety timeout
    });

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [navigate, checkAndRedirect]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
      <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      <p className="text-muted-foreground text-sm">Completing login...</p>
    </div>
  );
}