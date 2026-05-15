-- =====================================================
-- AFFILIATE & BOOKMARKS MIGRATION
-- =====================================================

-- 1. Affiliate Links Table
CREATE TABLE IF NOT EXISTS affiliate_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  logo_url TEXT,
  description TEXT,
  category TEXT DEFAULT 'Other',
  is_active BOOLEAN DEFAULT true,
  click_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. User Bookmarks Table
CREATE TABLE IF NOT EXISTS user_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content_type TEXT NOT NULL, -- 'article' | 'module' | 'video'
  content_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, content_type, content_id)
);

-- Enable RLS
ALTER TABLE affiliate_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_bookmarks ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can read active affiliate links') THEN
        CREATE POLICY "Public can read active affiliate links" ON affiliate_links FOR SELECT USING (is_active = true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can manage affiliate links') THEN
        CREATE POLICY "Admins can manage affiliate links" ON affiliate_links FOR ALL USING (is_admin(auth.uid()));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage own bookmarks') THEN
        CREATE POLICY "Users can manage own bookmarks" ON user_bookmarks FOR ALL USING (auth.uid() = user_id);
    END IF;
END
$$;

-- Triggers for updated_at
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_affiliate_links_updated_at') THEN
        CREATE TRIGGER update_affiliate_links_updated_at BEFORE UPDATE ON affiliate_links
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END
$$;

-- RPC to track affiliate clicks safely
CREATE OR REPLACE FUNCTION track_affiliate_click(p_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE affiliate_links SET click_count = click_count + 1 WHERE id = p_id;
END;
$$;
