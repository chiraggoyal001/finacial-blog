import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemma-4-31b-it:generateContent'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { message, history } = await req.json()

    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not set')
    }

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!)
    
    // Fetch dynamic AI prompt from database
    const { data: settings } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'ai_prompt')
      .single()

    const systemPrompt = settings?.value?.text || "You are a helpful financial literacy assistant."

    // Fetch chatbot-controlled affiliates to give AI awareness of available recommendations
    const { data: affiliateData } = await supabase
      .rpc('get_chatbot_affiliates')

    const affiliates = affiliateData || []
    
    // Build the affiliates context for the AI
    let affiliatesContext = '';
    if (Array.isArray(affiliates) && affiliates.length > 0) {
      affiliatesContext = '\n\nYou have the following affiliate/partner recommendations available. You MAY recommend these to users when relevant, but you are NOT required to. Use your judgment based on the conversation context:\n';
      affiliates.forEach((aff: unknown) => {
        const affiliate = aff as { name: string; category: string; description?: string; chatbot_prompt?: string; url: string };
        affiliatesContext += `\n- **${affiliate.name}** (${affiliate.category}): ${affiliate.description || ''}`;
        if (affiliate.chatbot_prompt) {
          affiliatesContext += `\n  Guideline: ${affiliate.chatbot_prompt}`;
        }
        affiliatesContext += `\n  URL: ${affiliate.url}`;
      });
      affiliatesContext += '\n\nWhen recommending, provide the link naturally in conversation. Only recommend when it genuinely helps the user.';
    }

    // Construct the contents for Gemini
    const contents: { role: string; parts: { text: string }[] }[] = [];

    // History needs to be mapped to { role: "user" | "model", parts: [{ text: string }] }
    if (history && Array.isArray(history)) {
      history.forEach((msg: unknown) => {
        const messageItem = msg as { role: string; content: string };
        contents.push({
          role: messageItem.role === 'bot' ? 'model' : 'user',
          parts: [{ text: messageItem.content }]
        });
      });
    }

    // Add current message with system instruction and affiliate context
    const fullSystemInstruction = `${systemPrompt}${affiliatesContext}`;
    contents.push({
      role: 'user',
      parts: [{ text: `SYSTEM INSTRUCTION: ${fullSystemInstruction}\n\nUSER MESSAGE: ${message}` }]
    });

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: contents,
      }),
    })

    const data = await response.json()
    
    if (data.error) {
      throw new Error(data.error.message || 'Gemini API Error')
    }

    // Extract the text response from Gemini API structure
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I couldn't generate a response."

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      },
    )
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})