/**
 * kling.ts — Kling AI API Client
 * Base URL:  https://api-singapore.klingai.com
 * Auth:      JWT (HS256) — generated per-request from Access Key + Secret Key
 *
 * Authentication flow:
 *   1. Read VITE_KLING_ACCESS_KEY (ak) and VITE_KLING_SECRET_KEY (sk) from .env
 *   2. Sign a short-lived JWT (HS256) with the sk, carrying { iss: ak, exp, nbf }
 *   3. Set Authorization: Bearer <token> on every request
 *
 * Implemented endpoints:
 *   - Text-to-Video  (POST /v1/videos/text2video)
 *   - Image-to-Video (POST /v1/videos/image2video)
 *   - Text-to-Image  (POST /v1/images/generations)
 *   - Task query     (GET  /v1/videos/text2video/{task_id}  |  image2video | images)
 *
 * All generation endpoints are async — they return a task_id.
 * Use pollKlingTask() to wait for completion.
 */

import { SignJWT } from 'jose';

// ── Constants ──────────────────────────────────────────────────────────────────

const KLING_BASE = '/api/kling';

/** Token lifetime in seconds. Kling docs example: 1800 (30 min). */
const TOKEN_TTL_S = 1800;

/** Seconds before `now` the token is considered valid (clock-skew guard). */
const TOKEN_NBF_SKEW_S = 5;

// ── Types ─────────────────────────────────────────────────────────────────────

export type KlingTaskStatus =
  | 'submitted'
  | 'processing'
  | 'succeed'
  | 'failed';

export type KlingAspectRatio =
  | '16:9'
  | '9:16'
  | '1:1'
  | '4:3'
  | '3:4'
  | '21:9';

export type KlingVideoMode = 'std' | 'pro';
export type KlingVideoDuration = '5' | '10';

// ── Text-to-Video ──────────────────────────────────────────────────────────────

export interface KlingText2VideoParams {
  /** Text prompt describing the video (≤2500 chars). */
  prompt: string;
  /** Negative prompt — what to avoid. */
  negative_prompt?: string;
  /** Model name. Use "kling-v1" (default) or "kling-v1-5", "kling-v1-6", "kling-v2", "kling-v2-1". */
  model_name?: string;
  /** Generation mode: "std" (Standard) | "pro" (Professional). Default: "std". */
  mode?: KlingVideoMode;
  /** Video aspect ratio. Default: "16:9". */
  aspect_ratio?: KlingAspectRatio;
  /** Duration in seconds: "5" | "10". Default: "5". */
  duration?: KlingVideoDuration;
  /** Camera control (optional). */
  camera_control?: {
    type: string;
    config?: Record<string, number>;
  };
  /** Creativity/CFG scale 0–1. Higher = more literal. Default: 0.5. */
  cfg_scale?: number;
  /** External task reference (optional). */
  external_task_id?: string;
}

export interface KlingVideoTask {
  task_id: string;
  task_status: KlingTaskStatus;
  task_status_msg?: string;
  created_at?: number;
  updated_at?: number;
  task_result?: {
    videos?: Array<{
      id: string;
      url: string;
      duration: string;
    }>;
  };
}

// ── Image-to-Video ─────────────────────────────────────────────────────────────

export interface KlingImage2VideoParams {
  /** Text prompt (optional but recommended). */
  prompt?: string;
  /** Negative prompt. */
  negative_prompt?: string;
  /** Model name. Default: "kling-v1". */
  model_name?: string;
  /** Generation mode. Default: "std". */
  mode?: KlingVideoMode;
  /** Duration. Default: "5". */
  duration?: KlingVideoDuration;
  /** CFG scale. Default: 0.5. */
  cfg_scale?: number;
  /** Input image — either a public URL or base64 data URI. */
  image: string;
  /** Optional tail frame image. */
  image_tail?: string;
  /** External task reference. */
  external_task_id?: string;
}

// ── Text-to-Image ──────────────────────────────────────────────────────────────

export interface KlingText2ImageParams {
  /** Text prompt describing the image (≤2500 chars). */
  prompt: string;
  /** Negative prompt. */
  negative_prompt?: string;
  /** Model name. Default: "kling-v1". */
  model_name?: string;
  /** Aspect ratio. Default: "1:1". */
  aspect_ratio?: KlingAspectRatio;
  /** Number of images to generate. Max 9. Default: 1. */
  n?: number;
  /** Image quality: "standard" | "pro". */
  image_quality?: 'standard' | 'pro';
  /** Reference images (optional). */
  reference_images?: Array<{
    reference_image: string; // base64 or URL
    reference_type: number;  // 0=subject, 1=face, 2=style
    reference_weight?: number; // 0–1
  }>;
  /** External task reference. */
  external_task_id?: string;
}

export interface KlingImageTask {
  task_id: string;
  task_status: KlingTaskStatus;
  task_status_msg?: string;
  created_at?: number;
  updated_at?: number;
  task_result?: {
    images?: Array<{
      index: number;
      url: string;
    }>;
  };
}

// ── JWT Auth ───────────────────────────────────────────────────────────────────

function getCredentials(): { ak: string; sk: string } {
  const env = import.meta.env as unknown as Record<string, string>;
  const ak = env['VITE_KLING_ACCESS_KEY'];
  const sk = env['VITE_KLING_SECRET_KEY'];
  if (!ak) throw new Error('VITE_KLING_ACCESS_KEY is not set in .env');
  if (!sk) throw new Error('VITE_KLING_SECRET_KEY is not set in .env');
  return { ak, sk };
}

/**
 * Generates a short-lived HS256 JWT for Kling API authentication.
 * Follows the spec in the Kling API docs exactly:
 *   Header : { alg: "HS256", typ: "JWT" }
 *   Payload: { iss: ak, exp: now+1800, nbf: now-5 }
 */
async function generateKlingToken(): Promise<string> {
  const { ak, sk } = getCredentials();
  const now = Math.floor(Date.now() / 1000);

  const skBytes = new TextEncoder().encode(sk);

  const token = await new SignJWT({})
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuer(ak)
    .setExpirationTime(now + TOKEN_TTL_S)
    .setNotBefore(now - TOKEN_NBF_SKEW_S)
    .sign(skBytes);

  return token;
}

// ── HTTP helpers ───────────────────────────────────────────────────────────────

async function klingFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await generateKlingToken();
  return fetch(`${KLING_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  });
}

/**
 * Unwraps the Kling API response envelope:
 * { code: 0, message: "SUCCEED", request_id: "...", data: { ... } }
 * Throws a typed error if code !== 0 or HTTP status is not ok.
 */
async function unwrap<T>(res: Response): Promise<T> {
  const json = await res.json();
  if (!res.ok || json.code !== 0) {
    const msg = json.message ?? `HTTP ${res.status}`;
    throw Object.assign(new Error(`Kling API error (${json.code}): ${msg}`), {
      code: json.code as number,
      status: res.status,
      request_id: json.request_id as string | undefined,
    });
  }
  return json.data as T;
}

// ── Text-to-Video ──────────────────────────────────────────────────────────────

/**
 * Submits a text-to-video generation task.
 * Returns the task_id — use pollKlingVideoTask() to wait for the result.
 */
export async function createText2VideoTask(
  params: KlingText2VideoParams
): Promise<string> {
  const body: Record<string, unknown> = {
    prompt: params.prompt,
    model_name: params.model_name ?? 'kling-v1',
    mode: params.mode ?? 'std',
    aspect_ratio: params.aspect_ratio ?? '16:9',
    duration: params.duration ?? '5',
    cfg_scale: params.cfg_scale ?? 0.5,
  };

  if (params.negative_prompt) body.negative_prompt = params.negative_prompt;
  if (params.camera_control) body.camera_control = params.camera_control;
  if (params.external_task_id) body.external_task_id = params.external_task_id;

  const res = await klingFetch('/v1/videos/text2video', {
    method: 'POST',
    body: JSON.stringify(body),
  });

  const data = await unwrap<{ task: KlingVideoTask }>(res);
  return data.task.task_id;
}

/**
 * Queries the current status of a text-to-video task.
 */
export async function getVideoTaskStatus(taskId: string): Promise<KlingVideoTask> {
  const res = await klingFetch(`/v1/videos/text2video/${encodeURIComponent(taskId)}`);
  const data = await unwrap<{ task: KlingVideoTask }>(res);
  return data.task;
}

// ── Image-to-Video ─────────────────────────────────────────────────────────────

/**
 * Submits an image-to-video generation task.
 * Returns the task_id — use pollKlingVideoTask() to wait for the result.
 */
export async function createImage2VideoTask(
  params: KlingImage2VideoParams
): Promise<string> {
  const body: Record<string, unknown> = {
    image: params.image,
    model_name: params.model_name ?? 'kling-v1',
    mode: params.mode ?? 'std',
    duration: params.duration ?? '5',
    cfg_scale: params.cfg_scale ?? 0.5,
  };

  if (params.prompt) body.prompt = params.prompt;
  if (params.negative_prompt) body.negative_prompt = params.negative_prompt;
  if (params.image_tail) body.image_tail = params.image_tail;
  if (params.external_task_id) body.external_task_id = params.external_task_id;

  const res = await klingFetch('/v1/videos/image2video', {
    method: 'POST',
    body: JSON.stringify(body),
  });

  const data = await unwrap<{ task: KlingVideoTask }>(res);
  return data.task.task_id;
}

/**
 * Queries the current status of an image-to-video task.
 */
export async function getImage2VideoTaskStatus(taskId: string): Promise<KlingVideoTask> {
  const res = await klingFetch(`/v1/videos/image2video/${encodeURIComponent(taskId)}`);
  const data = await unwrap<{ task: KlingVideoTask }>(res);
  return data.task;
}

// ── Text-to-Image ──────────────────────────────────────────────────────────────

/**
 * Submits a text-to-image generation task.
 * Returns the task_id — use pollKlingImageTask() to wait for the result.
 */
export async function createText2ImageTask(
  params: KlingText2ImageParams
): Promise<string> {
  const body: Record<string, unknown> = {
    prompt: params.prompt,
    model_name: params.model_name ?? 'kling-v1',
    aspect_ratio: params.aspect_ratio ?? '1:1',
    n: params.n ?? 1,
    image_quality: params.image_quality ?? 'standard',
  };

  if (params.negative_prompt) body.negative_prompt = params.negative_prompt;
  if (params.reference_images?.length) body.reference_images = params.reference_images;
  if (params.external_task_id) body.external_task_id = params.external_task_id;

  const res = await klingFetch('/v1/images/generations', {
    method: 'POST',
    body: JSON.stringify(body),
  });

  const data = await unwrap<{ task: KlingImageTask }>(res);
  return data.task.task_id;
}

/**
 * Queries the current status of a text-to-image task.
 */
export async function getImageTaskStatus(taskId: string): Promise<KlingImageTask> {
  const res = await klingFetch(`/v1/images/generations/${encodeURIComponent(taskId)}`);
  const data = await unwrap<{ task: KlingImageTask }>(res);
  return data.task;
}

// ── Generic Polling ────────────────────────────────────────────────────────────

type PollFn<T extends { task_status: KlingTaskStatus }> = (taskId: string) => Promise<T>;

/**
 * Generic exponential-backoff poller for any Kling task type.
 *
 * Concurrency note from Kling docs:
 *   When tasks exceed the concurrency limit (error 1303), we use an
 *   exponential backoff retry strategy with an initial delay ≥ 1 second.
 *
 * @param fetchStatus - Function that queries the task status
 * @param taskId      - Task ID returned from a creation call
 * @param maxAttempts - Max polling attempts (default 60 × ~5s ≈ 5 min)
 * @param intervalMs  - Base polling interval in ms (default 5000)
 */
async function pollKlingTask<T extends { task_status: KlingTaskStatus }>(
  fetchStatus: PollFn<T>,
  taskId: string,
  maxAttempts = 60,
  intervalMs = 5000
): Promise<T> {
  let delay = intervalMs;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    let task: T;

    try {
      task = await fetchStatus(taskId);
    } catch (err: unknown) {
      // Concurrency limit hit (code 1303) — backoff and retry
      const apiErr = err as { code?: number };
      if (apiErr.code === 1303) {
        await new Promise((r) => setTimeout(r, delay));
        delay = Math.min(delay * 2, 30_000); // cap at 30 s
        continue;
      }
      throw err; // all other errors are fatal
    }

    if (task.task_status === 'succeed') return task;

    if (task.task_status === 'failed') {
      throw new Error(
        `Kling task ${taskId} failed: ${(task as unknown as KlingVideoTask).task_status_msg ?? 'no details'}`
      );
    }

    // submitted | processing — wait and retry with a mild back-off
    await new Promise((r) => setTimeout(r, delay));
    delay = Math.min(delay + 1000, 10_000); // gentle ramp, cap at 10 s
  }

  throw new Error(
    `Kling task ${taskId} timed out after ${maxAttempts} attempts (~${Math.round((maxAttempts * intervalMs) / 1000)}s).`
  );
}

/**
 * Polls a text-to-video or image-to-video task until it succeeds or fails.
 * Returns the completed KlingVideoTask (with .task_result.videos populated).
 */
export async function pollKlingVideoTask(
  taskId: string,
  type: 'text2video' | 'image2video' = 'text2video',
  maxAttempts = 60,
  intervalMs = 5000
): Promise<KlingVideoTask> {
  const fetchFn = type === 'text2video' ? getVideoTaskStatus : getImage2VideoTaskStatus;
  return pollKlingTask(fetchFn, taskId, maxAttempts, intervalMs);
}

/**
 * Polls a text-to-image task until it succeeds or fails.
 * Returns the completed KlingImageTask (with .task_result.images populated).
 */
export async function pollKlingImageTask(
  taskId: string,
  maxAttempts = 60,
  intervalMs = 5000
): Promise<KlingImageTask> {
  return pollKlingTask(getImageTaskStatus, taskId, maxAttempts, intervalMs);
}
