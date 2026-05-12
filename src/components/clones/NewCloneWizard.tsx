'use client';
import { useState } from 'react';
import { X, Plus, Minus, Mic, CheckCircle, Loader } from 'lucide-react';

const GOLD = '#C8860F';
const GOLD_BRIGHT = '#F5C842';
const NAVY = '#1A2E4A';
const SLUG_RE = /^[a-z][a-z0-9_-]*$/;

const STEP_LABELS = ['基本情報・人格', 'ナレッジ', '声', '確認'] as const;
const MODELS = ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash'];

interface Form {
  display_name: string;
  slug: string;
  description: string;
  specialties: string;
  model: string;
  system_prompt: string;
  notebook_urls: string[];
  google_drive_url: string;
  youtube_voice_url: string;
  fish_audio_voice_id: string;
}

const defaultForm = (): Form => ({
  display_name: '', slug: '', description: '', specialties: '',
  model: 'gemini-2.5-flash', system_prompt: '',
  notebook_urls: [''], google_drive_url: '',
  youtube_voice_url: '', fish_audio_voice_id: '',
});

const inputSt: React.CSSProperties = {
  width: '100%', padding: '8px 10px', border: '1px solid #E2E8F0',
  borderRadius: 8, fontSize: 13, color: '#2D3748', background: '#fff',
  boxSizing: 'border-box', outline: 'none',
};

export default function NewCloneWizard({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Form>(defaultForm());
  const [voiceLoading, setVoiceLoading] = useState(false);
  const [voiceDone, setVoiceDone] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const set = (k: keyof Form, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  const toSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 30);

  const slugOk = SLUG_RE.test(form.slug);

  const addNb = () => set('notebook_urls', [...form.notebook_urls, '']);
  const removeNb = (i: number) => set('notebook_urls', form.notebook_urls.filter((_, idx) => idx !== i));
  const updateNb = (i: number, v: string) => set('notebook_urls', form.notebook_urls.map((u, idx) => idx === i ? v : u));

  const cloneVoice = async () => {
    if (!form.slug || !form.youtube_voice_url) return;
    setVoiceLoading(true);
    setError('');
    try {
      const r = await fetch(`/api/clone-admin?action=voice_url&slug=${form.slug}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ youtube_url: form.youtube_voice_url }),
      });
      const d = await r.json();
      if (d.voice_id) { set('fish_audio_voice_id', d.voice_id); setVoiceDone(true); }
      else setError(d.error || '声クローンに失敗しました');
    } catch { setError('声クローンに失敗しました'); }
    finally { setVoiceLoading(false); }
  };

  const handleCreate = async () => {
    setCreating(true);
    setError('');
    try {
      const notebookUrls = form.notebook_urls.map(u => u.trim()).filter(Boolean);
      const body: Record<string, unknown> = {
        slug: form.slug, display_name: form.display_name,
        description: form.description,
        specialties: form.specialties.split(',').map(s => s.trim()).filter(Boolean),
        model: form.model, system_prompt: form.system_prompt,
        fish_audio_voice_id: form.fish_audio_voice_id,
      };
      if (notebookUrls.length) body.knowledge_urls = notebookUrls;
      if (form.google_drive_url.trim()) body.google_drive_url = form.google_drive_url.trim();
      const r = await fetch('/api/clones', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!r.ok) { const d = await r.json(); throw new Error(d.error || '作成失敗'); }
      onCreated();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '作成に失敗しました');
      setCreating(false);
    }
  };

  const canNext = [
    !!(form.display_name.trim() && slugOk),
    true,
    !!(form.youtube_voice_url.trim() || form.fish_audio_voice_id.trim()),
    true,
  ][step];

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(15,30,50,0.7)',
      zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16,
    }}>
      <div style={{
        background: '#fff', borderRadius: 14, width: '100%', maxWidth: 540,
        maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: NAVY }}>
          <span style={{ fontWeight: 700, fontSize: 15, color: GOLD_BRIGHT }}>新規クローン作成</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.6)' }}>
            <X size={18} />
          </button>
        </div>

        {/* Step tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', background: '#FAFAFA', flexShrink: 0 }}>
          {STEP_LABELS.map((label, i) => (
            <button key={i} onClick={() => i < step && setStep(i)} style={{
              flex: 1, padding: '10px 4px', fontSize: 11, fontWeight: step === i ? 700 : 400,
              color: step === i ? GOLD : step > i ? '#10B981' : '#9CA3AF',
              background: 'none', border: 'none', cursor: i < step ? 'pointer' : 'default',
              borderBottom: step === i ? `2px solid ${GOLD}` : '2px solid transparent',
            }}>
              {step > i ? '✓ ' : `${i + 1}. `}{label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          {error && (
            <div style={{ padding: '8px 12px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, color: '#DC2626', fontSize: 12, marginBottom: 14 }}>
              {error}
            </div>
          )}

          {/* STEP 0: 基本情報 + 人格 */}
          {step === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4A5568', marginBottom: 4 }}>表示名 *</label>
                <input value={form.display_name} onChange={e => { set('display_name', e.target.value); if (!form.slug) set('slug', toSlug(e.target.value)); }} placeholder="例: 田中コーチ" style={inputSt} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4A5568', marginBottom: 4 }}>
                  スラッグ（ID）* &nbsp;
                  <span style={{ fontWeight: 400, color: slugOk || !form.slug ? '#A0AEC0' : '#EF4444' }}>
                    {!form.slug ? '小文字英数字・_・-' : slugOk ? '✓' : '形式エラー'}
                  </span>
                </label>
                <input value={form.slug} onChange={e => set('slug', e.target.value)} placeholder="tanaka_coach" style={{ ...inputSt, borderColor: form.slug && !slugOk ? '#FCA5A5' : '#E2E8F0' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4A5568', marginBottom: 4 }}>説明文</label>
                <input value={form.description} onChange={e => set('description', e.target.value)} placeholder="一言説明" style={inputSt} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4A5568', marginBottom: 4 }}>専門分野（カンマ区切り）</label>
                <input value={form.specialties} onChange={e => set('specialties', e.target.value)} placeholder="コーチング, 習慣形成" style={inputSt} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4A5568', marginBottom: 4 }}>モデル</label>
                <select value={form.model} onChange={e => set('model', e.target.value)} style={{ ...inputSt, height: 36 }}>
                  {MODELS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4A5568', marginBottom: 4 }}>システムプロンプト（人格定義）</label>
                <textarea value={form.system_prompt} onChange={e => set('system_prompt', e.target.value)} rows={5} placeholder="あなたは..." style={{ ...inputSt, resize: 'vertical', fontFamily: 'monospace', fontSize: 12, lineHeight: 1.6 }} />
              </div>
            </div>
          )}

          {/* STEP 1: ナレッジベース */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ fontSize: 12, color: '#718096' }}>NotebookLM の URL を追加するとナレッジが自動同期されます（任意）。</div>
              {form.notebook_urls.map((url, i) => (
                <div key={i} style={{ display: 'flex', gap: 6 }}>
                  <input value={url} onChange={e => updateNb(i, e.target.value)} placeholder="https://notebooklm.google.com/notebook/..." style={{ ...inputSt, flex: 1 }} />
                  {form.notebook_urls.length > 1 && (
                    <button onClick={() => removeNb(i)} style={{ padding: '8px', border: '1px solid #E2E8F0', borderRadius: 8, background: '#fff', cursor: 'pointer', color: '#718096' }}>
                      <Minus size={14} />
                    </button>
                  )}
                </div>
              ))}
              <button onClick={addNb} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', border: `1px dashed ${GOLD}60`, borderRadius: 8, background: `${GOLD}08`, color: GOLD, fontSize: 12, cursor: 'pointer', fontWeight: 600, alignSelf: 'flex-start' }}>
                <Plus size={13} />URL を追加
              </button>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4A5568', marginBottom: 4 }}>Google Drive URL（任意）</label>
                <input value={form.google_drive_url} onChange={e => set('google_drive_url', e.target.value)} placeholder="https://drive.google.com/..." style={inputSt} />
              </div>
            </div>
          )}

          {/* STEP 2: 声のクローン */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ fontSize: 12, color: '#718096' }}>YouTubeの声サンプル動画URLから Fish Audio で声をクローンします。</div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4A5568', marginBottom: 4 }}>YouTube 声サンプル URL *</label>
                <input value={form.youtube_voice_url} onChange={e => set('youtube_voice_url', e.target.value)} placeholder="https://www.youtube.com/watch?v=..." style={inputSt} />
              </div>
              {form.youtube_voice_url && !voiceDone && (
                <button onClick={cloneVoice} disabled={voiceLoading} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', background: voiceLoading ? '#E2E8F0' : `linear-gradient(135deg, ${GOLD}, ${GOLD_BRIGHT})`, color: voiceLoading ? '#A0AEC0' : '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: voiceLoading ? 'not-allowed' : 'pointer', alignSelf: 'flex-start' }}>
                  {voiceLoading ? <Loader size={14} /> : <Mic size={14} />}
                  {voiceLoading ? '声クローン中...' : '声をクローンする'}
                </button>
              )}
              {voiceDone && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8 }}>
                  <CheckCircle size={16} color="#10B981" />
                  <span style={{ fontSize: 12, color: '#065F46', fontWeight: 600 }}>声クローン完了！ Voice ID: {form.fish_audio_voice_id.slice(0, 16)}...</span>
                </div>
              )}
              <div style={{ marginTop: 4 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4A5568', marginBottom: 4 }}>Fish Audio Voice ID（手動入力も可）</label>
                <input value={form.fish_audio_voice_id} onChange={e => { set('fish_audio_voice_id', e.target.value); if (e.target.value) setVoiceDone(true); }} placeholder="既存の Voice ID を入力" style={inputSt} />
              </div>
            </div>
          )}

          {/* STEP 3: 確認 */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 13, color: '#718096', marginBottom: 4 }}>以下の内容でクローンを作成します。</div>
              {[
                { label: 'スラッグ', value: form.slug },
                { label: '表示名', value: form.display_name },
                { label: 'モデル', value: form.model },
                { label: 'Voice ID', value: form.fish_audio_voice_id ? `${form.fish_audio_voice_id.slice(0, 16)}...` : '（未設定）' },
                { label: 'NotebookLM', value: form.notebook_urls.filter(Boolean).length ? `${form.notebook_urls.filter(Boolean).length}件` : '（なし）' },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', padding: '8px 12px', background: '#F7F8FA', borderRadius: 8, gap: 12 }}>
                  <span style={{ fontSize: 12, color: '#718096', width: 100, flexShrink: 0 }}>{label}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#2D3748' }}>{value}</span>
                </div>
              ))}
              {form.system_prompt && (
                <div>
                  <div style={{ fontSize: 12, color: '#718096', marginBottom: 4 }}>システムプロンプト</div>
                  <pre style={{ fontSize: 11, color: '#4A5568', background: '#F7F8FA', padding: '10px 12px', borderRadius: 8, overflow: 'auto', maxHeight: 120, whiteSpace: 'pre-wrap', margin: 0 }}>{form.system_prompt}</pre>
                </div>
              )}
              <div style={{ padding: '10px 14px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8, fontSize: 12, color: '#92400E' }}>
                作成後の本番デプロイは Cloneページの「デプロイ」ボタンから別途実行してください。
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', flexShrink: 0 }}>
          <button onClick={step > 0 ? () => setStep(s => s - 1) : onClose} style={{ padding: '9px 18px', border: '1px solid #E2E8F0', borderRadius: 8, background: '#fff', color: '#718096', fontSize: 13, cursor: 'pointer' }}>
            {step > 0 ? '← 戻る' : 'キャンセル'}
          </button>
          {step < 3 ? (
            <button onClick={() => setStep(s => s + 1)} disabled={!canNext} style={{ padding: '9px 20px', background: canNext ? `linear-gradient(135deg, ${GOLD}, ${GOLD_BRIGHT})` : '#E2E8F0', color: canNext ? '#fff' : '#A0AEC0', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: canNext ? 'pointer' : 'not-allowed' }}>
              次へ →
            </button>
          ) : (
            <button onClick={handleCreate} disabled={creating} style={{ padding: '9px 20px', background: creating ? '#E2E8F0' : `linear-gradient(135deg, ${GOLD}, ${GOLD_BRIGHT})`, color: creating ? '#A0AEC0' : '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: creating ? 'not-allowed' : 'pointer' }}>
              {creating ? '作成中...' : '✓ クローンを作成'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
