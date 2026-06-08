/**
 * suno.ts — sunoapi.org client
 *
 * Flow:
 *   1. POST /api/v1/generate          → returns { data: { taskId } }
 *   2. GET  /api/v1/generate/record-info?taskId=... (poll)
 *      → data.status: PENDING | TEXT_SUCCESS | FIRST_SUCCESS | SUCCESS | *FAILED
 *      → data.response.sunoData[]: { id, audioUrl, streamAudioUrl, imageUrl, title, duration, ... }
 *
 * Callbacks (callBackUrl) require a publicly reachable HTTPS server — not usable
 * from localhost. We use polling as the authoritative approach.
 */

const SUNO_BASE = '/api/suno/api/v1';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SunoGenerateParams {
  /** Full lyrics (custom mode, instrumental=false). Pass '' for instrumental. */
  prompt: string;
  /** Style/genre tags — up to 1000 chars for V4_5 */
  style: string;
  /** Song title — up to 100 chars */
  title: string;
  /** true = no vocals, only style+title required */
  instrumental?: boolean;
  /** Model version — V4_5 is a good default (up to 8 min) */
  model?: 'V4_5' | 'V4_5ALL' | 'V4_5PLUS' | 'V5' | 'V5_5' | 'V4';
  /** Comma-separated styles to avoid */
  negativeTags?: string;
  /** 'm' | 'f' */
  vocalGender?: 'm' | 'f';
}

/** Shape of each track in data.response.sunoData[] from record-info */
export interface SunoTrack {
  id: string;
  audioUrl: string;
  streamAudioUrl?: string;
  imageUrl?: string;
  title: string;
  tags?: string;
  duration?: number;
  prompt?: string;
  modelName?: string;
}

// Suno task statuses
type SunoStatus =
  | 'PENDING'
  | 'TEXT_SUCCESS'
  | 'FIRST_SUCCESS'
  | 'SUCCESS'
  | 'CREATE_TASK_FAILED'
  | 'GENERATE_AUDIO_FAILED'
  | 'CALLBACK_EXCEPTION'
  | 'SENSITIVE_WORD_ERROR';

// ── Auth ──────────────────────────────────────────────────────────────────────

function getKey(): string {
  const key = (import.meta.env as unknown as Record<string, string>)['VITE_SUNO_API_KEY'];
  if (!key) throw new Error('VITE_SUNO_API_KEY is not set in .env');
  return key;
}

// ── Step 1: Submit job ────────────────────────────────────────────────────────

/**
 * Submits a music generation job to Suno.
 * Returns the taskId for polling.
 *
 * NOTE: callBackUrl is intentionally omitted — localhost is not publicly
 * reachable. Use pollSunoTask() to retrieve results instead.
 */
export async function generateMusic(params: SunoGenerateParams): Promise<string> {
  const body: Record<string, unknown> = {
    customMode: true,
    instrumental: params.instrumental ?? false,
    model: params.model ?? 'V4_5',
    title: params.title.slice(0, 100),
    style: params.style.slice(0, 1000),
    // Required by the API even though we use polling — callback fires to /dev/null
    callBackUrl: 'https://example.com/suno-callback-noop',
  };

  // prompt = lyrics in custom mode (only required if NOT instrumental)
  if (!params.instrumental && params.prompt) {
    body.prompt = params.prompt;
  }

  if (params.negativeTags) body.negativeTags = params.negativeTags;
  if (params.vocalGender) body.vocalGender = params.vocalGender;

  const res = await fetch(`${SUNO_BASE}/generate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const json = await res.json();
  if (!res.ok || json.code !== 200) {
    throw new Error(`Suno generate error ${res.status}: ${json.msg ?? JSON.stringify(json)}`);
  }

  return json.data.taskId as string;
}

// ── Step 2: Poll for results ──────────────────────────────────────────────────

/**
 * Polls GET /api/v1/generate/record-info?taskId=... until status is SUCCESS.
 *
 * Status progression:
 *   PENDING → TEXT_SUCCESS → FIRST_SUCCESS → SUCCESS
 *
 * FIRST_SUCCESS = first track is ready (can show early).
 * SUCCESS        = all tracks ready (usually 2 tracks).
 *
 * We wait for SUCCESS so both tracks are available.
 * If you want faster feedback, return on FIRST_SUCCESS too.
 */
export async function pollSunoTask(
  taskId: string,
  maxAttempts = 50,     // 50 × 5s = 4m10s max wait
  intervalMs = 5000
): Promise<SunoTrack[]> {
  const url = `${SUNO_BASE}/generate/record-info?taskId=${encodeURIComponent(taskId)}`;
  const headers = { Authorization: `Bearer ${getKey()}` };

  for (let i = 0; i < maxAttempts; i++) {
    const res = await fetch(url, { headers });
    const json = await res.json();

    if (!res.ok || json.code !== 200) {
      throw new Error(`Suno poll error ${res.status}: ${json.msg ?? ''}`);
    }

    const taskData = json.data as {
      status: SunoStatus;
      errorMessage?: string;
      response?: { sunoData?: SunoTrack[] };
    };

    const status = taskData.status;

    // Terminal failure states
    if (
      status === 'CREATE_TASK_FAILED' ||
      status === 'GENERATE_AUDIO_FAILED' ||
      status === 'SENSITIVE_WORD_ERROR'
    ) {
      throw new Error(
        `Suno task failed (${status}): ${taskData.errorMessage ?? 'no details'}`
      );
    }

    // FIRST_SUCCESS gives us at least one track — good enough to show results
    if (status === 'FIRST_SUCCESS' || status === 'SUCCESS') {
      const tracks = taskData.response?.sunoData ?? [];
      if (tracks.length > 0) return tracks;
    }

    // Still processing — wait and retry
    await new Promise((r) => setTimeout(r, intervalMs));
  }

  throw new Error(`Suno task timed out after ${maxAttempts} attempts (~${(maxAttempts * intervalMs) / 1000}s).`);
}
