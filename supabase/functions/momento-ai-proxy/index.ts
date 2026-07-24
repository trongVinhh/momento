import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Verify JWT
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: { user }, error: authErr } = await supabaseClient.auth.getUser()
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const reqBody = await req.json()
    const { action, vietnamese_idea, message, audio, audioMimeType, history, language, scenario_prompt } = reqBody

    if (action === 'translate_idea') {
      const targetLang = language || "Japanese"
      const systemPrompt = `You are a professional language translator. Translate the following Vietnamese sentence/idea into natural ${targetLang}.
Take into account the conversation scenario context if provided: "${scenario_prompt || 'General conversation'}".
The translation should sound conversational, polite, and natural for that specific scenario.

You MUST respond strictly in the following JSON format:
{
  "translation": "The natural translation of the Vietnamese sentence in ${targetLang}",
  "reading": "If targetLang is Japanese, provide the complete Kana-only (Hiragana/Katakana) reading of the translation without any Kanji. For non-Japanese languages, set this to null."
}`

      const geminiKey = Deno.env.get('GEMINI_API_KEY')
      if (!geminiKey) throw new Error("GEMINI_API_KEY is not configured")

      const geminiModel = "gemini-3.5-flash-lite"
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: systemPrompt }]
            },
            {
              role: 'user',
              parts: [{ text: `Vietnamese idea to translate: "${vietnamese_idea}"` }]
            }
          ],
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: 'OBJECT',
              properties: {
                translation: { type: 'STRING', description: 'The translated text in the target language' },
                reading: { type: 'STRING', nullable: true, description: 'The Hiragana/Kana reading (no Kanji) of the translation' }
              },
              required: ['translation', 'reading']
            }
          }
        })
      })

      if (!response.ok) {
        const errText = await response.text()
        throw new Error(`Gemini translation error: ${errText}`)
      }

      const resJson = await response.json()
      const contentText = resJson.candidates?.[0]?.content?.parts?.[0]?.text
      if (!contentText) throw new Error("Empty translation response from Gemini")
      
      return new Response(contentText, {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const targetLang = language || "Japanese"
    const systemPrompt = `You are an expert language teacher and conversation partner. Your goal is to help the user practice their conversation (Kaiwa) skills in ${targetLang}.
First, read the user's custom context/scenario: "${scenario_prompt || 'Free conversation. Speak naturally.'}".
You must act as the character/role defined in this scenario. Respond naturally in ${targetLang} as that character.
Second, analyze the user's message. Note: The user may send a text message or an audio file. If they send an audio file, transcribe it exactly in ${targetLang} and set the "user_transcription" field to this transcription. If they send a text message, set "user_transcription" to null.
Analyze the user's input (either the text message or the transcription of their audio):
1. Check if the user's message/transcription has any grammatical errors, spelling mistakes, or unnatural phrasing in ${targetLang}. If so, provide a corrected version and a concise explanation in Vietnamese. If it's perfect, set grammar_correction to null.
2. Formulate your reply in ${targetLang} as your character. Keep it conversational, friendly, and relatively short (1-3 sentences) to maintain a natural messaging flow.
3. Translate your reply into Vietnamese.
4. Suggest 2-3 distinct, natural options of what the user can reply next in ${targetLang}. These options should help them continue the conversation and practice different expressions.
5. If targetLang is Japanese, segment your reply into characters/words and map them to their corresponding Hiragana readings in the "furigana" array field. Each item must have a "text" (Kanji/Kana/punctuation) and a "ruby" (Hiragana pronunciation for Kanji, or null if it's already Hiragana/Katakana or punctuation). For example, if reply is "日本語を学びます", furigana should be: [{"text": "日", "ruby": "に"}, {"text": "本", "ruby": "ほん"}, {"text": "語", "ruby": "ご"}, {"text": "を", "ruby": null}, {"text": "学", "ruby": "まな"}, {"text": "び", "ruby": null}, {"text": "ま", "ruby": null}, {"text": "す", "ruby": null}]. If targetLang is not Japanese, set the "furigana" array to null.

You MUST respond strictly in the following JSON format:
{
  "user_transcription": "Transcription of the user's audio in the target language, or null if text input was sent",
  "reply": "Your character's reply in the target language",
  "translation": "Translation of your reply in Vietnamese",
  "furigana": [
    { "text": "Kanji or word", "ruby": "hiragana or null" }
  ] or null,
  "grammar_correction": {
    "corrected": "Corrected version of the user's message/transcription",
    "explanation": "Brief explanation in Vietnamese of the corrections"
  } or null,
  "suggestions": [
    "Suggested reply option 1 in the target language",
    "Suggested reply option 2 in the target language",
    "Suggested reply option 3 in the target language"
  ]
}`

    const geminiHistory = (history || []).map((h: any) => ({
      role: h.sender === 'user' ? 'user' : 'model',
      parts: [{ text: h.content }]
    }))

    const userParts: any[] = []
    if (audio) {
      userParts.push({
        inlineData: {
          mimeType: audioMimeType || "audio/m4a",
          data: audio
        }
      })
      userParts.push({
        text: "Listen to this audio, transcribe it, and reply in accordance to the system prompt."
      })
    } else {
      userParts.push({ text: message || "" })
    }

    const geminiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiKey) {
      return new Response(JSON.stringify({ error: "Gemini API key is not configured." }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    let model = "gemini-3.5-flash-lite"
    let geminiResponse = await callGeminiAPI(model, geminiKey, systemPrompt, geminiHistory, userParts)

    if (!geminiResponse.ok) {
      const clonedResp = geminiResponse.clone()
      const errJson = await clonedResp.json().catch(() => ({}))
      const errMsg = errJson.error?.message || ""
      const isQuotaError = geminiResponse.status === 429 ||
        errMsg.toLowerCase().includes("quota") ||
        errMsg.toLowerCase().includes("limit") ||
        errMsg.toLowerCase().includes("exhausted")

      if (isQuotaError) {
        console.warn(`Model ${model} hit rate/quota limit. Falling back to gemini-1.5-flash...`)
        model = "gemini-1.5-flash"
        geminiResponse = await callGeminiAPI(model, geminiKey, systemPrompt, geminiHistory, userParts)
      }
    }

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text()
      return new Response(JSON.stringify({ error: `Gemini API error (model ${model}): ${errText}` }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const geminiData = await geminiResponse.json()
    const textResult = geminiData.candidates?.[0]?.content?.parts?.[0]?.text
    if (!textResult) {
      return new Response(JSON.stringify({ error: "Empty response from Gemini API" }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(textResult, {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

async function callGeminiAPI(model: string, key: string, systemPrompt: string, history: any[], userParts: any[]) {
  const apiVersion = "v1beta"
  return await fetch(`https://generativelanguage.googleapis.com/${apiVersion}/models/${model}:generateContent?key=${key}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: systemPrompt }]
        },
        ...history,
        {
          role: 'user',
          parts: userParts
        }
      ],
       generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            user_transcription: { type: 'STRING', description: 'Transcription of user audio in the target language, or null if text was sent' },
            reply: { type: 'STRING', description: 'Your conversational reply in the target language as your character' },
            translation: { type: 'STRING', description: 'Translation of your reply in Vietnamese' },
            furigana: {
              type: 'ARRAY',
              nullable: true,
              description: 'Segment-by-segment furigana mapping for Japanese. For non-Japanese, set this to null.',
              items: {
                type: 'OBJECT',
                properties: {
                  text: { type: 'STRING', description: 'The Kanji, Kana or word segment' },
                  ruby: { type: 'STRING', nullable: true, description: 'The Hiragana reading for the Kanji segment, or null if no reading is needed' }
                },
                required: ['text']
              }
            },
            grammar_correction: {
              type: 'OBJECT',
              nullable: true,
              properties: {
                corrected: { type: 'STRING', description: 'Corrected version of the user\'s message' },
                explanation: { type: 'STRING', description: 'Brief explanation in Vietnamese' }
              },
              required: ['corrected', 'explanation']
            },
            suggestions: {
              type: 'ARRAY',
              items: { type: 'STRING' },
              description: '2-3 natural suggested replies in the target language for the user'
            }
          },
          required: ['user_transcription', 'reply', 'translation', 'suggestions', 'furigana']
        }
      }
    })
  })
}

