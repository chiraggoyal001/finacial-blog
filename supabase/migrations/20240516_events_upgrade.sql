-- =====================================================
-- EVENTS SYSTEM UPGRADE
-- =====================================================

-- 1. Add new columns to events
ALTER TABLE events ADD COLUMN IF NOT EXISTS virtual_lobby_url TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS recording_url TEXT;

-- 2. Create Event Registrations Table
CREATE TABLE IF NOT EXISTS event_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'registered' CHECK (status IN ('registered', 'waitlisted', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- Enable RLS
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own registrations') THEN
        CREATE POLICY "Users can view their own registrations" ON event_registrations FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can view all registrations') THEN
        CREATE POLICY "Admins can view all registrations" ON event_registrations FOR SELECT USING (is_admin(auth.uid()));
    END IF;
END
$$;

-- 3. RPC to register for an event (handles capacity and waitlist)
CREATE OR REPLACE FUNCTION register_for_event(p_event_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_capacity INTEGER;
  v_current_count INTEGER;
  v_status TEXT;
  v_result JSONB;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get event capacity
  SELECT capacity INTO v_capacity FROM events WHERE id = p_event_id;
  
  -- Get current active registrations
  SELECT COUNT(*) INTO v_current_count 
  FROM event_registrations 
  WHERE event_id = p_event_id AND status = 'registered';

  -- Determine status
  IF v_current_count < v_capacity THEN
    v_status := 'registered';
  ELSE
    v_status := 'waitlisted';
  END IF;

  -- Insert or Update (if previously cancelled)
  INSERT INTO event_registrations (event_id, user_id, status)
  VALUES (p_event_id, v_user_id, v_status)
  ON CONFLICT (event_id, user_id) 
  DO UPDATE SET status = v_status, created_at = NOW();

  -- Increment the 'registered' count in events table for quick caching if it's not waitlisted
  IF v_status = 'registered' THEN
    UPDATE events SET registered = registered + 1 WHERE id = p_event_id;
  END IF;

  RETURN jsonb_build_object(
    'status', v_status,
    'message', CASE WHEN v_status = 'registered' THEN 'Successfully registered!' ELSE 'Event is full. You are on the waitlist.' END
  );
END;
$$;

-- 4. RPC to unregister
CREATE OR REPLACE FUNCTION unregister_from_event(p_event_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_old_status TEXT;
BEGIN
  v_user_id := auth.uid();
  
  -- Get old status before deleting
  SELECT status INTO v_old_status 
  FROM event_registrations 
  WHERE event_id = p_event_id AND user_id = v_user_id;

  -- Delete the registration
  DELETE FROM event_registrations 
  WHERE event_id = p_event_id AND user_id = v_user_id;

  -- If was registered, decrement the counter
  IF v_old_status = 'registered' THEN
    UPDATE events SET registered = GREATEST(0, registered - 1) WHERE id = p_event_id;
    
    -- Potential: Promote first person from waitlist
    -- For simplicity in this v1, we just decrement.
  END IF;
END;
$$;
