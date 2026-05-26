-- =====================================================
-- Migration: Bot Configuration Settings
-- Adds system_settings rows for all bot management config
-- that was previously hardcoded in Python source files.
-- =====================================================

-- 1. Default system prompt (fallback when ai_prompt is not set)
INSERT INTO system_settings (key, value) VALUES
  ('bot_default_system_prompt', '{
    "text": "You are Gyaan, a friendly and knowledgeable financial literacy assistant for an Indian finance education blog. You help users understand personal finance, investing, taxation, and money management in the Indian context. Be warm, clear, and educational."
  }'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 2. Compliance rules injected into every prompt
INSERT INTO system_settings (key, value) VALUES
  ('bot_compliance_rules', '{
    "rules": [
      "Never provide specific investment advice or guaranteed returns.",
      "Never use words like ''guaranteed'', ''risk-free'', ''assured returns''.",
      "Always clarify that information is educational, not personalized advice.",
      "If asked about specific stocks/funds to buy, redirect to a SEBI-registered adviser.",
      "Never fabricate financial data, statistics, or regulatory information.",
      "If you are unsure, say so honestly rather than guessing."
    ]
  }'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 3. SEBI disclaimer appended to responses
INSERT INTO system_settings (key, value) VALUES
  ('bot_sebi_disclaimer', '{
    "text": "\n\n---\n⚠️ **Disclaimer**: This information is for educational purposes only and does not constitute financial advice. Please consult a SEBI-registered investment adviser before making investment decisions."
  }'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 4. Blocked phrases (words/patterns the bot must never say)
INSERT INTO system_settings (key, value) VALUES
  ('bot_blocked_phrases', '{
    "patterns": [
      "guaranteed returns",
      "risk-free",
      "assured returns",
      "100% safe",
      "no risk",
      "certain profit",
      "sure-shot",
      "doubt-free",
      "can''t lose",
      "will definitely go up"
    ]
  }'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 5. Advice patterns (language that suggests specific investment advice)
INSERT INTO system_settings (key, value) VALUES
  ('bot_advice_patterns', '{
    "patterns": [
      "you should buy",
      "you should sell",
      "you should invest in",
      "I recommend buying",
      "I recommend selling",
      "I recommend investing",
      "buy this stock",
      "buy this fund",
      "sell this stock",
      "sell this fund",
      "invest all your money in",
      "this is the best investment",
      "this is the best stock",
      "this is the best fund"
    ]
  }'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 6. Escalation response prefixes for each escalation level
INSERT INTO system_settings (key, value) VALUES
  ('bot_escalation_responses', '{
    "urgent": "🆘 I can see you are going through a very difficult time. Please reach out to these helplines immediately:\n\n📞 **iCall**: 9152987821\n📞 **Vandrevala Foundation**: 1860-2662-345\n📞 **AASRA**: 9820466726\n\nFor your financial situation, I strongly recommend speaking with a qualified financial adviser who can provide personalized guidance.\n\n",
    "recommend": "This sounds like a situation where professional guidance would be really valuable. I would recommend connecting with a SEBI-registered investment adviser or a certified financial planner (CFP) who can review your specific circumstances.\n\n",
    "suggest": "💡 For a decision of this complexity, you might benefit from consulting a qualified financial adviser. I can share some general information, but personalized advice requires understanding your full financial picture.\n\n"
  }'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 7. Nudge opener templates for proactive chat initiation
INSERT INTO system_settings (key, value) VALUES
  ('bot_nudge_templates', '{
    "article_goal": "I noticed you have been reading about {topic}. Would you like me to help you understand how this applies to your financial goals?",
    "calc_use": "I see you were exploring the {calc_type} calculator. Would you like me to explain what those numbers mean for your situation?",
    "return_visit": "You have visited ''{article_title}'' a few times. Is there something specific about {topic} you would like to discuss?",
    "deadline": "Tax filing season is approaching! Would you like some guidance on {topic}?",
    "general": "Hi! Based on your recent reading, I thought I might be able to help with some financial questions. What would you like to know?"
  }'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 8. Static fallback response when circuit breaker is open
INSERT INTO system_settings (key, value) VALUES
  ('bot_fallback_response', '{
    "text": "I am experiencing technical difficulties right now. Here are some helpful resources:\n\n📚 **Modules** — Check out our learning modules for structured courses\n📰 **Newsletter** — Subscribe to our newsletter for weekly updates\n🎓 **Junior Section** — Fun financial lessons for young learners\n📅 **Events** — Join our community events and bootcamps\n\nPlease try again in a few moments!"
  }'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 9. Update RLS policy: bot_* keys should be readable by the service role
-- but NOT by anonymous/public users (they contain internal instructions)
-- The existing "Admins can manage system settings" policy covers admin writes.
-- We need to ensure the backend (service role) can read them.
-- Service role bypasses RLS, so no additional policy needed for backend reads.
-- Public policy already restricts to only 'system_banner' — that's correct.
