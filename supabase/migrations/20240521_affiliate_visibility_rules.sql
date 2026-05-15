-- =====================================================
-- Migration: Affiliate Visibility & Targeting Rules
-- Date: 2024-05-21
-- =====================================================

-- 1. Add new columns to affiliate_links
ALTER TABLE affiliate_links ADD COLUMN IF NOT EXISTS visibility_rules JSONB DEFAULT '{}';
ALTER TABLE affiliate_links ADD COLUMN IF NOT EXISTS scheduling JSONB DEFAULT '{}';
ALTER TABLE affiliate_links ADD COLUMN IF NOT EXISTS targeting_rules JSONB DEFAULT '{}';
ALTER TABLE affiliate_links ADD COLUMN IF NOT EXISTS chatbot_controlled BOOLEAN DEFAULT false;
ALTER TABLE affiliate_links ADD COLUMN IF NOT EXISTS chatbot_prompt TEXT;

-- 2. RPC function for chatbot to get eligible affiliates
CREATE OR REPLACE FUNCTION get_chatbot_affiliates()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', al.id,
      'name', al.name,
      'url', al.url,
      'logo_url', al.logo_url,
      'description', al.description,
      'category', al.category,
      'chatbot_prompt', al.chatbot_prompt
    )
  ) INTO v_result
  FROM affiliate_links al
  WHERE al.is_active = true AND al.chatbot_controlled = true;
  
  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;