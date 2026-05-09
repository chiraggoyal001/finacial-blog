import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    // Listen for auth state changes which handles the OAuth redirect reliably
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        toast.success('Logged in successfully!');
        navigate('/');
      }
    });

    // Check if there are any error parameters in the URL
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const searchParams = new URLSearchParams(window.location.search);
    
    const error = hashParams.get('error') || searchParams.get('error');
    const errorDescription = hashParams.get('error_description') || searchParams.get('error_description');

    if (error) {
      setErrorMsg(errorDescription || 'Authentication failed');
      toast.error(errorDescription || 'Authentication failed');
      const timer = setTimeout(() => navigate('/login'), 2000);
      return () => clearTimeout(timer);
    }

    // Also try to get session just in case the event fired before we subscribed
    supabase.auth.getSession().then(({ data: { session }, error: sessionError }) => {
      if (sessionError) {
        setErrorMsg(sessionError.message);
        toast.error('Authentication failed: ' + sessionError.message);
        const timer = setTimeout(() => navigate('/login'), 2000);
        return () => clearTimeout(timer);
      } else if (session) {
        toast.success('Logged in successfully!');
        navigate('/');
      } else {
        // Give it a safety timeout for the redirect to finish processing
        const timer = setTimeout(() => {
          supabase.auth.getSession().then(({ data: { session: delayedSession } }) => {
            if (!delayedSession) {
              toast.error('Authentication timed out');
              navigate('/login');
            }
          });
        }, 3000);
        // Important: we don't clear this timeout on unmount inside this block
        // because the outer effect cleanup will handle subscription, but the timer should run if we're stuck
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
      <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      {errorMsg ? (
        <p className="text-red-500 text-sm text-center max-w-sm px-4">{errorMsg}</p>
      ) : (
        <p className="text-muted-foreground text-sm">Completing login...</p>
      )}
    </div>
  );
}
