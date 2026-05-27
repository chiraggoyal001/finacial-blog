-- =====================================================
-- EVENTS SEGMENT ENHANCEMENTS & WEBHOOK TRIGGERS
-- =====================================================

-- 1. Modify Events Table schema (Consolidate to timestamp)
-- Add new columns
ALTER TABLE events ADD COLUMN IF NOT EXISTS start_time TIMESTAMP WITH TIME ZONE;
ALTER TABLE events ADD COLUMN IF NOT EXISTS end_time TIMESTAMP WITH TIME ZONE;

-- Populate new columns from date and time (only if old columns still exist)
-- Time column format is usually "14:00 - 16:00", we extract start and end times
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'events' AND column_name = 'date'
  ) THEN
    UPDATE events SET
      start_time = COALESCE(
        start_time,
        (date::text || ' ' || COALESCE(nullif(split_part(time, ' - ', 1), ''), '00:00:00'))::timestamp with time zone,
        date::timestamp with time zone
      ),
      end_time = COALESCE(
        end_time,
        (date::text || ' ' || COALESCE(nullif(split_part(time, ' - ', 2), ''), '23:59:59'))::timestamp with time zone,
        date::timestamp with time zone
      );
  END IF;
END $$;

-- Enforce constraints
ALTER TABLE events ALTER COLUMN start_time SET NOT NULL;
ALTER TABLE events ALTER COLUMN end_time SET NOT NULL;

-- Drop old columns
ALTER TABLE events DROP COLUMN IF EXISTS date;
ALTER TABLE events DROP COLUMN IF EXISTS time;
ALTER TABLE events DROP COLUMN IF EXISTS is_upcoming;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_events_start_time ON events(start_time);
CREATE INDEX IF NOT EXISTS idx_events_end_time ON events(end_time);

-- 4. Update Event Registrations Table
ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS reminder_sent_24h BOOLEAN DEFAULT false;
ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS reminder_sent_1h BOOLEAN DEFAULT false;

-- 5. RPC to register for an event (handles concurrency locking)
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
  v_old_status TEXT;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Acquire row-level lock on the event to prevent concurrent registration spikes exceeding capacity
  SELECT capacity, registered INTO v_capacity, v_current_count 
  FROM events 
  WHERE id = p_event_id 
  FOR UPDATE;
  
  -- Get user's current status if they have registered before
  SELECT status INTO v_old_status 
  FROM event_registrations 
  WHERE event_id = p_event_id AND user_id = v_user_id;

  -- Determine status based on current active registrations
  IF v_current_count < v_capacity OR v_capacity IS NULL THEN
    v_status := 'registered';
  ELSE
    v_status := 'waitlisted';
  END IF;

  -- Insert or Update registration
  INSERT INTO event_registrations (event_id, user_id, status, reminder_sent_24h, reminder_sent_1h)
  VALUES (p_event_id, v_user_id, v_status, false, false)
  ON CONFLICT (event_id, user_id) 
  DO UPDATE SET status = v_status, created_at = NOW(), reminder_sent_24h = false, reminder_sent_1h = false;

  -- If status changes to registered from unregistered/waitlisted, increment registered count
  IF v_status = 'registered' AND (v_old_status IS NULL OR v_old_status <> 'registered') THEN
    UPDATE events SET registered = registered + 1 WHERE id = p_event_id;
  END IF;

  RETURN jsonb_build_object(
    'status', v_status,
    'message', CASE WHEN v_status = 'registered' THEN 'Successfully registered!' ELSE 'Event is full. You are on the waitlist.' END
  );
END;
$$;

-- 6. RPC to unregister (handles waitlist auto-promotion)
CREATE OR REPLACE FUNCTION unregister_from_event(p_event_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_old_status TEXT;
  v_promoted_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Get old status before deleting
  SELECT status INTO v_old_status 
  FROM event_registrations 
  WHERE event_id = p_event_id AND user_id = v_user_id;

  -- Delete the registration
  DELETE FROM event_registrations 
  WHERE event_id = p_event_id AND user_id = v_user_id;

  -- If the user was registered, promote the oldest waitlisted user
  IF v_old_status = 'registered' THEN
    -- Lock the event row for updates
    PERFORM 1 FROM events WHERE id = p_event_id FOR UPDATE;

    -- Find oldest waitlisted user
    SELECT user_id INTO v_promoted_user_id 
    FROM event_registrations 
    WHERE event_id = p_event_id AND status = 'waitlisted'
    ORDER BY created_at ASC
    LIMIT 1
    FOR UPDATE;

    IF v_promoted_user_id IS NOT NULL THEN
      -- Promote the waitlisted user (triggering the update webhook on event_registrations)
      UPDATE event_registrations 
      SET status = 'registered', created_at = NOW(), reminder_sent_24h = false, reminder_sent_1h = false
      WHERE event_id = p_event_id AND user_id = v_promoted_user_id;
      
      -- Note: events.registered stays the same since we swapped one active user for another
    ELSE
      -- No one is on the waitlist, decrement active registrations
      UPDATE events SET registered = GREATEST(0, registered - 1) WHERE id = p_event_id;
    END IF;
  END IF;
END;
$$;

