-- =====================================================
-- FINAL CRITICAL SCHEMA FIXES
-- =====================================================

-- 1. Ensure user_bookmarks exists
CREATE TABLE IF NOT EXISTS user_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content_type TEXT NOT NULL, 
  content_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, content_type, content_id)
);

-- Enable RLS
ALTER TABLE user_bookmarks ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage own bookmarks') THEN
        CREATE POLICY "Users can manage own bookmarks" ON user_bookmarks FOR ALL USING (auth.uid() = user_id);
    END IF;
END
$$;

-- 2. Increment Variant RPCs (for A/B Testing)
CREATE OR REPLACE FUNCTION increment_variant_views(variant_id UUID)
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  UPDATE ab_test_variants SET views = views + 1 WHERE id = variant_id;
END;
$$;

CREATE OR REPLACE FUNCTION increment_variant_clicks(variant_id UUID)
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  UPDATE ab_test_variants SET clicks = clicks + 1 WHERE id = variant_id;
END;
$$;

CREATE OR REPLACE FUNCTION increment_variant_conversions(variant_id UUID)
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  UPDATE ab_test_variants SET conversions = conversions + 1 WHERE id = variant_id;
END;
$$;

-- 3. Utility Function (if missing)
CREATE OR REPLACE FUNCTION increment(x INTEGER)
RETURNS INTEGER LANGUAGE sql AS $$
  SELECT x + 1;
$$;
