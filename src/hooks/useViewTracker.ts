import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

export function useTrackView(contentType: string, contentId: string | undefined) {
  const hasTracked = useRef(false);

  useEffect(() => {
    if (!contentId || hasTracked.current) return;
    
    const track = async () => {
      try {
        hasTracked.current = true;
        await supabase.rpc('track_content_view', {
          p_content_type: contentType,
          p_content_id: contentId,
        });
      } catch (error) {
        // Silently fail - view tracking is non-critical
        console.error('Failed to track view:', error);
      }
    };

    // Track after a short delay to avoid counting quick navigations
    const timer = setTimeout(track, 3000);
    return () => clearTimeout(timer);
  }, [contentType, contentId]);
}