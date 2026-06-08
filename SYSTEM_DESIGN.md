# VidGen - System Design Document

This document provides an AI-friendly overview of the VidGen application architecture, data flow, and components. It is designed to quickly onboard AI coding assistants and developers.

## 1. Project Overview
**VidGen** is an AI-powered media generation application. It has two pipelines: (1) an **AI Music Studio** that converts natural-language prompts into audio tracks via Grok + Suno, and (2) a **Video/Image Generation** pipeline using the **Kling AI API** for text-to-video, image-to-video, and text-to-image generation.

## 2. Tech Stack
- **Frontend Framework**: React 19 + TypeScript + Vite.
- **Routing**: React Router (`react-router-dom`).
- **Authentication/Backend**: Supabase (used for user authentication, Login/Signup).
- **Styling**: Vanilla CSS with customized, modern UI designs (glassmorphism, gradients, CSS variables).
- **External APIs**:
  - **xAI Grok API** (`grok-3-mini`): Translates user prompts into structured JSON music briefs.
  - **Suno API** (via `api.sunoapi.org`): Generates audio tracks based on music briefs.
  - **Kling AI API** (`api-singapore.klingai.com`): Generates videos and images. Auth uses short-lived HS256 JWTs signed with Access Key + Secret Key.

## 3. Architecture & Data Flow
The core application logic resides in the client-side React code. API keys are injected via Vite environment variables (`VITE_GROK_API_KEY`, `VITE_SUNO_API_KEY`, `VITE_KLING_ACCESS_KEY`, `VITE_KLING_SECRET_KEY`).

### Core Pipeline (The Generate Page)
The `Generate.tsx` page acts as a state machine managing the music generation pipeline. It has 6 stages: `idle` -> `grok` -> `review` -> `suno` -> `done` (or `error`).

1. **Step 1: User Prompt (`grok` stage)**
   - User inputs a plain-English idea.
   - `handleGenerateBrief()` calls `grok.ts` (`generateMusicBrief`).
   - Grok returns a structured JSON `MusicBrief` (title, genre, style, lyrics, etc.).

2. **Step 2: Review & Edit (`review` stage)**
   - The UI presents the generated `MusicBrief`.
   - The user can edit the title, style tags, negative tags, lyrics, and toggle instrumental or vocal gender.

3. **Step 3: Suno Generation (`suno` stage)**
   - `handleGenerateMusic()` submits the finalized brief to `suno.ts` (`generateMusic`).
   - A `taskId` is returned.
   - The app polls `pollSunoTask(taskId)` every 5 seconds until the status reaches `SUCCESS` or `FIRST_SUCCESS`.

4. **Step 4: Results (`done` stage)**
   - The generated tracks (typically 2 variations) are returned.
   - Users can play the audio via the HTML5 `<audio>` element or download the MP3.

## 4. Key Files & Modules

### `src/lib/` (API & Services)
- **`grok.ts`**: Handles communication with the xAI API. Contains the `MusicBrief` type and the `SYSTEM_PROMPT` instructing Grok to return a strict JSON schema.
- **`suno.ts`**: Interacts with `api.sunoapi.org`. Contains `SunoGenerateParams`, `SunoTrack` types, and handles the asynchronous polling logic for Suno tasks (`generateMusic` and `pollSunoTask`).
- **`kling.ts`**: Kling AI API client for video and image generation. Key responsibilities:
  - `generateKlingToken()`: Signs a short-lived HS256 JWT using `jose` from the env credentials on every request.
  - `createText2VideoTask()` / `pollKlingVideoTask()`: Submit and await text-to-video jobs.
  - `createImage2VideoTask()` / `pollKlingVideoTask()`: Submit and await image-to-video jobs.
  - `createText2ImageTask()` / `pollKlingImageTask()`: Submit and await text-to-image jobs.
  - All polling uses exponential backoff with special handling for concurrency-limit errors (code 1303).
- **`supabase.ts`**: Initializes the Supabase client for authentication.

### `src/pages/` (Views)
- **`Generate.tsx`**: The main generation pipeline view. Contains the core state machine for the application.
- **`DashBoard.tsx`**: The authenticated landing page displaying user stats and quick actions.
- **`LogIn.tsx` / `SignUp.tsx`**: Authentication flows using Supabase.

### `src/components/` (UI Components)
- **`Hero.tsx`, `Features.tsx`, `Pricing.tsx`, `Footer.tsx`**: Static landing page components for marketing the product.

### `src/routes/` (Routing Logic)
- **`ProtectedRoute.tsx`**: Wrapper to ensure only authenticated users can access the dashboard and generation pages.

## 5. Security & Limitations
- **Client-Side APIs**: Currently, all API calls (Grok, Suno, Kling) are made directly from the frontend, exposing credentials in the client bundle. A future architectural upgrade should move these requests to a backend service (e.g., Supabase Edge Functions) to secure all secrets.
- **Kling JWT**: The `kling.ts` module generates a fresh JWT per-request using `jose`. The token is valid for 30 minutes. Because it is signed entirely in the browser, the Secret Key is still client-side — the same backend caveat applies.
- **Suno Webhooks**: The Suno API supports webhooks (`callBackUrl`), but because the app runs locally (localhost), it relies on HTTP polling.
- **Kling Concurrency**: Kling enforces per-account concurrency limits. The poller in `kling.ts` handles error code 1303 (concurrency exceeded) with exponential backoff, per Kling's recommended strategy.

## 6. AI Agent Guidelines for Future Work
When modifying this codebase:
- **Styling**: Maintain the existing premium, dark-mode, glassmorphic aesthetic. Do not introduce TailwindCSS; use the existing Vanilla CSS patterns found in `index.css` and page-specific CSS files.
- **State Management**: The pipeline in `Generate.tsx` relies on complex sequential state. When adding features, ensure they hook safely into the `Stage` type (`idle | grok | review | suno | done | error`).
- **API Changes**: If altering the JSON schema for Grok, remember to update both the `MusicBrief` TypeScript interface and the `SYSTEM_PROMPT` in `grok.ts`.
- **Kling Video Generation**: Use `createText2VideoTask()` or `createImage2VideoTask()` then `pollKlingVideoTask()`. Await the returned `KlingVideoTask` — videos are in `.task_result.videos[]`. Similarly, `createText2ImageTask()` + `pollKlingImageTask()` for images (`.task_result.images[]`).
- **Kling Models**: Default model is `kling-v1`. Also available: `kling-v1-5`, `kling-v1-6`, `kling-v2`, `kling-v2-1`. Pro mode (`mode: 'pro'`) produces higher quality but may be slower.
