import { useState, useRef } from 'react';
import { generateMusicBrief, type MusicBrief } from '../lib/grok';
import { generateMusic, pollSunoTask, type SunoTrack } from '../lib/suno';
import './generate.css';

// ── Stage machine ─────────────────────────────────────────────────────────────
type Stage = 'idle' | 'grok' | 'review' | 'suno' | 'done' | 'error';

// ── Prompt examples ───────────────────────────────────────────────────────────
const EXAMPLES = [
  'An uplifting summer pop anthem about chasing dreams at the beach 🌊',
  'Dark cinematic orchestral piece — tension building to a dramatic climax',
  'Lo-fi hip-hop with rain sounds and nostalgic lyrics about a lost friendship',
  'Energetic EDM track for a montage — euphoric, big drop, no lyrics',
];

export default function GeneratePage() {
  const [prompt, setPrompt] = useState('');
  const [stage, setStage] = useState<Stage>('idle');
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');
  const [brief, setBrief] = useState<MusicBrief | null>(null);
  const [tracks, setTracks] = useState<SunoTrack[]>([]);
  const [error, setError] = useState('');

  // editable brief fields
  const [editLyrics, setEditLyrics] = useState('');
  const [editStyle, setEditStyle] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editInstrumental, setEditInstrumental] = useState(false);
  const [editNegTags, setEditNegTags] = useState('');
  const [editVocalGender, setEditVocalGender] = useState<'m' | 'f'>('f');

  const abortRef = useRef(false);

  // ── Step 1: Ask Grok ────────────────────────────────────────────────────────
  async function handleGenerateBrief() {
    if (!prompt.trim()) return;
    abortRef.current = false;
    setError('');
    setStage('grok');
    setProgress(15);
    setProgressMsg('Grok is composing your music brief…');

    try {
      const b = await generateMusicBrief(prompt.trim());
      setBrief(b);
      setEditLyrics(b.lyrics);
      setEditStyle(b.style);
      setEditTitle(b.title);
      setEditInstrumental(b.instrumental);
      setEditNegTags(b.negative_tags ?? '');
      setEditVocalGender(b.vocal_gender ?? 'f');
      setProgress(100);
      setStage('review');
    } catch (e: unknown) {
      setError(String(e instanceof Error ? e.message : e));
      setStage('error');
    }
  }

  // ── Step 2: Generate with Suno ──────────────────────────────────────────────
  async function handleGenerateMusic() {
    if (!brief) return;
    abortRef.current = false;
    setError('');
    setStage('suno');
    setProgress(10);
    setProgressMsg('Submitting to Suno…');

    try {
      const taskId = await generateMusic({
        prompt: editInstrumental ? '' : editLyrics,
        style: editStyle,
        title: editTitle,
        instrumental: editInstrumental,
        model: 'V4_5',
        negativeTags: editNegTags || undefined,
        vocalGender: editVocalGender,
      });

      setProgress(25);
      setProgressMsg(`Job submitted (${taskId.slice(0, 8)}…). Polling for results…`);

      // fake smooth progress while polling
      const ticker = setInterval(() => {
        setProgress((p) => Math.min(p + 1.5, 88));
      }, 3000);

      const result = await pollSunoTask(taskId);
      clearInterval(ticker);

      setTracks(result);
      setProgress(100);
      setStage('done');
    } catch (e: unknown) {
      setError(String(e instanceof Error ? e.message : e));
      setStage('error');
    }
  }

  const isLoading = stage === 'grok' || stage === 'suno';

  return (
    <div className="gen-page">
      {/* ambient blobs */}
      <div className="gen-blob gen-blob--a" />
      <div className="gen-blob gen-blob--b" />

      {/* nav */}
      <nav className="gen-nav">
        <div className="gen-nav-brand">
          <span>🎬</span> VidGen
        </div>
        <a href="/dashboard" className="gen-nav-back">← Dashboard</a>
      </nav>

      <div className="gen-body">

        {/* hero */}
        <div className="gen-hero">
          <div className="gen-hero-eyebrow">✨ AI Music Studio</div>
          <h1>Turn your idea into<br /><span className="grad">a complete song</span></h1>
          <p>Describe any song in plain English — Grok composes the brief, Suno generates the audio.</p>
        </div>

        {/* ── Step 1: Prompt ──────────────────────────────────────────────────── */}
        <div className="gen-step">
          <div className="gen-step-header">
            <div className={`step-badge${stage === 'grok' ? ' loading' : stage !== 'idle' ? ' done' : ''}`}>1</div>
            <div>
              <div className="gen-step-title">Describe your song</div>
              <div className="gen-step-sub">Tell Grok what kind of music you want — any idea works</div>
            </div>
          </div>

          <textarea
            id="song-prompt"
            className="prompt-textarea"
            placeholder="e.g. A melancholic indie folk song about moving to a new city, fingerpicked guitar, soft female vocals…"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isLoading}
          />

          <div className="prompt-examples">
            {EXAMPLES.map((ex) => (
              <button key={ex} className="prompt-chip" onClick={() => setPrompt(ex)} disabled={isLoading}>
                {ex.length > 55 ? ex.slice(0, 52) + '…' : ex}
              </button>
            ))}
          </div>

          <button
            id="btn-generate-brief"
            className="gen-btn gen-btn--primary"
            onClick={handleGenerateBrief}
            disabled={isLoading || !prompt.trim()}
          >
            {stage === 'grok' ? '⏳ Generating brief…' : '✨ Generate Music Brief'}
          </button>

          {stage === 'grok' && (
            <>
              <div className="progress-wrap">
                <div className="progress-bar" style={{ width: `${progress}%` }} />
              </div>
              <div className="progress-status">
                <div className="progress-dot" />
                {progressMsg}
              </div>
            </>
          )}
        </div>

        {/* ── Step 2: Review brief ────────────────────────────────────────────── */}
        {(stage === 'review' || stage === 'suno' || stage === 'done') && brief && (
          <div className="gen-step">
            <div className="gen-step-header">
              <div className={`step-badge${stage === 'suno' ? ' loading' : stage === 'done' ? ' done' : ''}`}>2</div>
              <div>
                <div className="gen-step-title">Review & edit the music brief</div>
                <div className="gen-step-sub">Grok's creative plan — tweak anything before generating</div>
              </div>
            </div>

            <div className="brief-grid">
              <div className="brief-field">
                <div className="brief-label">Title</div>
                <div
                  id="brief-title"
                  className="brief-value editable"
                  contentEditable={stage === 'review'}
                  suppressContentEditableWarning
                  onBlur={(e) => setEditTitle(e.currentTarget.textContent ?? '')}
                >
                  {editTitle}
                </div>
              </div>
              <div className="brief-field">
                <div className="brief-label">Genre / Mood</div>
                <div className="brief-value">{brief.genre} · {brief.mood}</div>
              </div>
              <div className="brief-field">
                <div className="brief-label">BPM Range</div>
                <div className="brief-value">{brief.bpm_range}</div>
              </div>
              <div className="brief-field">
                <div className="brief-label">Key · Vocals</div>
                <div className="brief-value">{brief.key} · {brief.vocal_style}</div>
              </div>
              <div className="brief-field" style={{ gridColumn: '1 / -1' }}>
                <div className="brief-label">Style Tags (sent to Suno)</div>
                <div
                  id="brief-style"
                  className="brief-value editable"
                  contentEditable={stage === 'review'}
                  suppressContentEditableWarning
                  onBlur={(e) => setEditStyle(e.currentTarget.textContent ?? '')}
                >
                  {editStyle}
                </div>
              </div>
              <div className="brief-field" style={{ gridColumn: '1 / -1' }}>
                <div className="brief-label">Negative Tags (avoid these)</div>
                <div
                  id="brief-neg-tags"
                  className="brief-value editable"
                  contentEditable={stage === 'review'}
                  suppressContentEditableWarning
                  onBlur={(e) => setEditNegTags(e.currentTarget.textContent ?? '')}
                >
                  {editNegTags}
                </div>
              </div>
            </div>

            {/* vocal gender toggle */}
            <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div className="instrumental-toggle">
                <div
                  id="toggle-instrumental"
                  className={`toggle-switch${editInstrumental ? ' on' : ''}`}
                  onClick={() => stage === 'review' && setEditInstrumental((v) => !v)}
                />
                <span className="toggle-label">Instrumental only (no lyrics/vocals)</span>
              </div>
              {!editInstrumental && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span className="toggle-label">Vocal gender:</span>
                  <button
                    id="btn-vocal-m"
                    onClick={() => stage === 'review' && setEditVocalGender('m')}
                    className="prompt-chip"
                    style={editVocalGender === 'm' ? { color: '#4f8dff', borderColor: 'rgba(79,141,255,0.4)' } : {}}
                  >♂ Male</button>
                  <button
                    id="btn-vocal-f"
                    onClick={() => stage === 'review' && setEditVocalGender('f')}
                    className="prompt-chip"
                    style={editVocalGender === 'f' ? { color: '#4f8dff', borderColor: 'rgba(79,141,255,0.4)' } : {}}
                  >♀ Female</button>
                </div>
              )}
            </div>

            {/* lyrics */}
            {!editInstrumental && (
              <>
                <div className="brief-label" style={{ marginTop: '1.25rem' }}>Lyrics</div>
                <textarea
                  id="brief-lyrics"
                  className="brief-lyrics-area"
                  value={editLyrics}
                  onChange={(e) => setEditLyrics(e.target.value)}
                  disabled={stage !== 'review'}
                />
              </>
            )}

            <button
              id="btn-generate-music"
              className="gen-btn gen-btn--primary"
              style={{ marginTop: '1.5rem' }}
              onClick={handleGenerateMusic}
              disabled={stage !== 'review'}
            >
              {stage === 'suno' ? '🎵 Generating music…' : '🎵 Generate with Suno'}
            </button>

            {stage === 'suno' && (
              <>
                <div className="progress-wrap">
                  <div className="progress-bar" style={{ width: `${progress}%` }} />
                </div>
                <div className="progress-status">
                  <div className="progress-dot" />
                  {progressMsg}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Step 3: Results ──────────────────────────────────────────────────── */}
        {stage === 'done' && tracks.length > 0 && (
          <div className="gen-step">
            <div className="gen-step-header">
              <div className="step-badge done">3</div>
              <div>
                <div className="gen-step-title">Your tracks are ready 🎉</div>
                <div className="gen-step-sub">Suno generated {tracks.length} variation{tracks.length > 1 ? 's' : ''} — pick your favourite</div>
              </div>
            </div>

            <div className="result-tracks">
              {tracks.map((t, i) => (
                <div key={t.id ?? i} className="track-card">
                  <div className="track-num">{i + 1}</div>
                  <div className="track-info" style={{ flex: 1 }}>
                    <div className="track-title">{t.title ?? editTitle}</div>
                    <div className="track-meta">{t.duration ? `${Math.round(t.duration)}s` : ''}</div>
                    {(t.audioUrl || t.streamAudioUrl) && (
                      <div className="track-audio">
                        <audio controls preload="none">
                          <source src={t.audioUrl ?? t.streamAudioUrl} type="audio/mpeg" />
                        </audio>
                      </div>
                    )}
                    {t.audioUrl && (
                      <a
                        href={t.audioUrl}
                        download={`${editTitle || 'track'}-${i + 1}.mp3`}
                        className="prompt-chip"
                        style={{ display: 'inline-flex', marginTop: 8, alignItems: 'center', gap: 4 }}
                      >
                        ⬇ Download MP3
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button
              id="btn-generate-another"
              className="gen-btn gen-btn--primary"
              style={{ marginTop: '1.5rem', background: 'rgba(79,141,255,0.15)', boxShadow: 'none', border: '1px solid rgba(79,141,255,0.3)' }}
              onClick={() => { setStage('idle'); setTracks([]); setBrief(null); setPrompt(''); setProgress(0); }}
            >
              ✨ Create another song
            </button>
          </div>
        )}

        {/* Error */}
        {(stage === 'error' || error) && (
          <div className="gen-error">
            <span>⚠️</span>
            <span>{error || 'An unknown error occurred.'}</span>
          </div>
        )}

      </div>
    </div>
  );
}
