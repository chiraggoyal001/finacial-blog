import { supabase } from './supabase';

export type EmailPayload =
  | { type: 'signup'; email: string; first_name: string; last_name: string }
  | { type: 'subscription'; email: string; first_name: string; last_name: string }
  | { type: 'confirmation'; email: string; first_name: string; last_name: string; event_id: string }
  | { type: 'promotion'; email: string; first_name: string; last_name: string; event_id: string };

/**
 * Fire-and-forget email trigger via Supabase Edge Function.
 * Never throws — logs errors to console silently.
 */
export async function triggerEmail(payload: EmailPayload): Promise<void> {
  try {
    if (import.meta.env.DEV) {
      console.log('[Email] Invoking send-email edge function with payload:', payload);
    }

    const { data, error } = await supabase.functions.invoke('send-email', {
      body: payload,
    });

    if (error) {
      console.warn('[Email] Failed to send via Edge Function:', error);
    } else if (import.meta.env.DEV) {
      console.log('[Email] Edge Function dispatch response:', data);
    }
  } catch (err) {
    // Silently log — email failures should never block user actions
    console.warn('[Email] Network error during Edge Function dispatch:', err);
  }
}
