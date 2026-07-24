interface Env {
	SUPABASE_URL: string;
	SUPABASE_ANON_KEY: string;
	GEMINI_API_KEY: string;
}

// Verify JWT Token by calling Supabase Auth API
async function verifySupabaseToken(token: string, supabaseUrl: string, supabaseAnonKey: string): Promise<boolean> {
	try {
		const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
			headers: {
				"Authorization": `Bearer ${token}`,
				"apikey": supabaseAnonKey,
			},
		});
		return response.ok; // 200 = valid token, 401 = invalid token
	} catch {
		return false;
	}
}

export default {
	async fetch(request: Request, env: Env) {
		// CORS headers
		const corsHeaders = {
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Methods": "POST, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type, Authorization",
			"Access-Control-Max-Age": "86400",
		};

		// CORS preflight response
		if (request.method === "OPTIONS") {
			return new Response(null, { headers: corsHeaders });
		}

		if (request.method !== "POST") {
			return new Response("Method Not Allowed", {
				status: 405,
				headers: corsHeaders,
			});
		}

		const url = new URL(request.url);
		if (url.pathname !== "/chat") {
			return new Response("Not Found", {
				status: 404,
				headers: corsHeaders,
			});
		}

		// 1. Verify User Session with Supabase JWT token
		const authHeader = request.headers.get("Authorization");
		if (!authHeader || !authHeader.startsWith("Bearer ")) {
			return new Response("Unauthorized", {
				status: 401,
				headers: corsHeaders,
			});
		}

		const token = authHeader.split(" ")[1];
		const isValidToken = await verifySupabaseToken(token, env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
		if (!isValidToken) {
			return new Response("Unauthorized: Invalid Token", {
				status: 401,
				headers: corsHeaders,
			});
		}

		// 2. Parse Request JSON
		let body: any;
		try {
			body = await request.json();
		} catch {
			return new Response("Bad Request: Invalid JSON body", {
				status: 400,
				headers: corsHeaders,
			});
		}

		const { message, audio, audioMimeType, history, language, scenario_prompt } = body;
		if (!message && !audio) {
			return new Response("Bad Request: Missing message or audio data", {
				status: 400,
				headers: corsHeaders,
			});
		}

		const targetLang = language || "Japanese";
		const systemPrompt = `You are an expert language teacher and conversation partner. Your goal is to help the user practice their conversation (Kaiwa) skills in ${targetLang}.
First, read the user's custom context/scenario: "${scenario_prompt || 'Free conversation. Speak naturally.'}".
You must act as the character/role defined in this scenario. Respond naturally in ${targetLang} as that character.
Second, analyze the user's message. Note: The user may send a text message or an audio file. If they send an audio file, transcribe it exactly in ${targetLang} and set the "user_transcription" field to this transcription. If they send a text message, set "user_transcription" to null.
Analyze the user's input (either the text message or the transcription of their audio):
1. Check if the user's message/transcription has any grammatical errors, spelling mistakes, or unnatural phrasing in ${targetLang}. If so, provide a corrected version and a concise explanation in Vietnamese. If it's perfect, set grammar_correction to null.
2. Formulate your reply in ${targetLang} as your character. Keep it conversational, friendly, and relatively short (1-3 sentences) to maintain a natural messaging flow.
3. Translate your reply into Vietnamese.
4. Suggest 2-3 distinct, natural options of what the user can reply next in ${targetLang}. These options should help them continue the conversation and practice different expressions.

You MUST respond strictly in the following JSON format:
{
  "user_transcription": "Transcription of the user's audio in the target language, or null if text input was sent",
  "reply": "Your character's reply in the target language",
  "translation": "Translation of your reply in Vietnamese",
  "grammar_correction": {
    "corrected": "Corrected version of the user's message/transcription",
    "explanation": "Brief explanation in Vietnamese of the corrections"
  } or null,
  "suggestions": [
    "Suggested reply option 1 in the target language",
    "Suggested reply option 2 in the target language",
    "Suggested reply option 3 in the target language"
  ]
}`;

		// Convert chat history to Gemini API format
		const geminiHistory = (history || []).map((h: any) => ({
			role: h.sender === 'user' ? 'user' : 'model',
			parts: [{ text: h.content }]
		}));

		// Construct current user input part (supports base64 audio and text)
		const userParts: any[] = [];
		if (audio) {
			userParts.push({
				inlineData: {
					mimeType: audioMimeType || "audio/m4a",
					data: audio
				}
			});
			// Also pass a text cue to tell Gemini to transcribe and reply to the audio
			userParts.push({
				text: "Listen to this audio, transcribe it, and reply in accordance to the system prompt."
			});
		} else {
			userParts.push({ text: message });
		}

		const geminiKey = env.GEMINI_API_KEY || "";
		if (!geminiKey || geminiKey === "YOUR_GEMINI_API_KEY") {
			return new Response(JSON.stringify({ error: "Gemini API key is not configured on Cloudflare Worker." }), {
				status: 500,
				headers: {
					"Content-Type": "application/json",
					...corsHeaders,
				}
			});
		}

		try {
			const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${geminiKey}`, {
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
						...geminiHistory,
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
							required: ['user_transcription', 'reply', 'translation', 'suggestions']
						}
					}
				})
			});

			if (!geminiResponse.ok) {
				const errorText = await geminiResponse.text();
				return new Response(JSON.stringify({ error: `Gemini API error: ${errorText}` }), {
					status: 502,
					headers: {
						"Content-Type": "application/json",
						...corsHeaders,
					}
				});
			}

			const geminiData: any = await geminiResponse.json();
			const textResult = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

			if (!textResult) {
				return new Response(JSON.stringify({ error: "Empty response from Gemini API" }), {
					status: 502,
					headers: {
						"Content-Type": "application/json",
						...corsHeaders,
					}
				});
			}

			return new Response(textResult, {
				status: 200,
				headers: {
					"Content-Type": "application/json",
					...corsHeaders,
				}
			});

		} catch (err: any) {
			return new Response(JSON.stringify({ error: `Fetch error: ${err.message}` }), {
				status: 500,
				headers: {
					"Content-Type": "application/json",
					...corsHeaders,
				}
			});
		}
	}
};
