/**
 * grok.ts — xAI Grok API (OpenAI-compatible)
 * Base URL: https://api.x.ai/v1
 * Model:    grok-3-mini (fast) or grok-3 (highest quality)
 *
 * Produces a MusicBrief from the user's natural-language idea.
 * The brief is then passed directly to Suno for generation.
 */

const GROK_BASE = '/api/grok/v1';
const GROK_MODEL = 'grok-3-mini';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MusicBrief {
  /** Short, evocative title (≤100 chars) */
  title: string;
  /** Primary genre, e.g. "cinematic pop" */
  genre: string;
  /** Suno style tags — genre, mood, instrumentation, vocal style (≤1000 chars) */
  style: string;
  /** Lyrics for the song (≤5000 chars for V4_5 model) */
  lyrics: string;
  /** Overall mood: "euphoric", "melancholic", etc. */
  mood: string;
  /** Suggested BPM range: "118-122" */
  bpm_range: string;
  /** Suggested musical key: "D major" */
  key: string;
  /** Vocal character description */
  vocal_style: string;
  /** true = no vocals */
  instrumental: boolean;
  /** Styles/instruments to avoid, e.g. "Heavy Metal, Screaming Vocals" */
  negative_tags: string;
  /** Preferred vocal gender: "m" | "f" */
  vocal_gender: 'm' | 'f';
}

// ── System prompt ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a professional music producer and lyricist.
Given a user idea, output ONLY valid JSON (no markdown, no backticks) matching this schema exactly:

{
  "title": "short evocative song title, max 100 chars",
  "genre": "primary genre, e.g. pop, hip-hop, cinematic",
  "style": "detailed Suno style tags: genre, sub-genre, mood, BPM, key, instrumentation, vocal style — max 1000 chars",
  "lyrics": "complete song lyrics with section markers like [Intro] [Verse 1] [Chorus] [Bridge] [Outro]. Write real lyrics, 200-400 words.",
  "mood": "overall emotional tone, e.g. euphoric, melancholic, tense",
  "bpm_range": "e.g. 118-122",
  "key": "e.g. D major",
  "vocal_style": "vocal character, e.g. breathy female, raspy male, choir",
  "instrumental": false,
  "negative_tags": "styles to AVOID, e.g. Heavy Metal, Screaming",
  "vocal_gender": "m or f"
}

Rules:
- instrumental is false unless the user explicitly wants no vocals.
- style must be rich: include genre, sub-genre, mood, instrumentation, energy level.
- lyrics must be real, evocative, rhyming where appropriate. Include [Section] markers.
- Always output valid JSON. Never wrap in backticks or markdown.`;

// ── Core helper ───────────────────────────────────────────────────────────────

function getKey(): string {
  const key = (import.meta.env as unknown as Record<string, string>)['VITE_GROK_API_KEY'];
  if (!key) throw new Error('VITE_GROK_API_KEY is not set in .env');
  return key;
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Converts a natural-language user prompt into a structured MusicBrief.
 * The brief drives all Suno generation parameters directly.
 */
export async function generateMusicBrief(userPrompt: string): Promise<MusicBrief> {
  const res = await fetch(`${GROK_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: GROK_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Create a complete music brief for this idea: ${userPrompt}` },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw Object.assign(new Error(`Grok API error ${res.status}: ${txt}`), { status: res.status });
  }

  const data = await res.json();
  const raw: string = data.choices[0].message.content;
  return JSON.parse(raw) as MusicBrief;
}
