'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Save, RotateCcw, Terminal, ArrowLeft, AlertTriangle, Upload } from 'lucide-react';

const GOLD = '#C8860F';
const GOLD_BRIGHT = '#F5C842';
const NAVY = '#1A2E4A';

interface CloneProfile {
  slug: string;
  display_name?: string;
  name?: string;
  description?: string;
  model?: string;
  specialties?: string[];
  system_prompt?: string;
  status?: string;
}

const PATCH_ALLOWED = ['display_name', 'description', 'specialties', 'system_prompt', 'model'];

export default function CloneDetail({ slug }: { slug: string }) {
  const router = useRouter();
  const [profile, setProfile] = useState<CloneProfile | null>(null);
  const [form, setForm] = useState<Partial<CloneProfile>>({});
  const [logs, setLogs] = useState<string>('');
  const [showLogs, setShowLogs] = useState(false);
  const [saving, setSaving] = useState(false);
  const [restarting, setRestarting] = useState(false);
  const [confirmRestart, setConfirmRestart] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [confirmDeploy, setConfirmDeploy] = useState(false);
  const [deployReason, setDeployReason] = useState('');
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    fetch(`/api/clones/${slug}`)
      .then((r) => r.json())
      .then((d) => {
        setProfile(d);
        setForm({
          display_name: d.display_name || '',
          description: d.description || '',
          specialties: d.specialties || [],
          system_prompt: d.system_prompt || '',
          model: d.model || '',
        });
      })
      .catch(() => {});
  }, [slug]);

  const fetchLogs = () => {
    setShowLogs(true);
    setLogs('ログ取得中...');
    fetch(`/api/clones/${slug}/logs?lines=50`)
      .then((r) => r.json())
      .then((d) => setLogs(d.logs || '（ログなし）'))
      .catch(() => setLogs('ログ取得に失敗しました'));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates: Record<string, unknown> = {};
      for (const key of PATCH_ALLOWED) {
        if (key in form) updates[key] = form[key as keyof typeof form];
      }
      const r = await fetch(`/api/clones/${slug}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!r.ok) throw new Error();
      showToast('保存しました');
    } catch { showToast('保存に失敗しました', false); }
    finally { setSaving(false); }
  };

  const handleRestart = async () => {
    setRestarting(true);
    setConfirmRestart(false);
    try {
      const r = await fetch(`/api/clones/${slug}/restart`, { method: 'POST' });
      if (!r.ok) throw new Error();
      showToast('再起動を開始しました');
    } catch { showToast('再起動に失敗しました', false); }
    finally { setRestarting(false); }
  };

  const handleDeploy = async () => {
    if (!deployReason.trim()) return;
    setDeploying(true);
    setConfirmDeploy(false);
    try {
      const r = await fetch(`/api/clones/${slug}/deploy`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmed: true, reason: deployReason }),
      });
      if (!r.ok) throw new Error();
      showToast('デプロイを開始しました');
      setDeployReason('');
    } catch { showToast('デプロイに失敗しました', false); }
    finally { setDeploying(false); }
  };

  const inputSt: React.CSSProperties = {
    width: '100%', padding: '8px 10px', border: '1px solid #E2E8F0',
    borderRadius: 8, fontSize: 13, color: '#2D3748', background: '#fff',
    boxSizing: 'border-box',
  };

  if (!profile) return <div style={{ textAlign: 'center', padding: '60px', color: '#A0AEC0' }}>読み込み中...</div>;

  return (
    <div style={{ padding: '24px', maxWidth: 700, margin: '0 auto' }}>
      {toast && (
        <div style={{
          position: 'fixed', top: 16, right: 16, zIndex: 9999,
          padding: '10px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
          background: toast.ok ? '#10B981' : '#EF4444', color: '#fff',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}>
          {toast.msg}
        </div>
      )}

      <button
        onClick={() => router.push('/clones')}
        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', border: '1px solid #E2E8F0', borderRadius: 8, background: '#fff', color: '#718096', fontSize: 12, cursor: 'pointer', marginBottom: 20 }}
      >
        <ArrowLeft size={13} />一覧へ戻る
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: NAVY, margin: 0 }}>{profile.display_name || profile.name || slug}</h1>
          <code style={{ fontSize: 12, color: '#A0AEC0' }}>{slug}</code>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={fetchLogs} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 14px', border: '1px solid #E2E8F0', borderRadius: 8, background: '#fff', color: '#718096', fontSize: 12, cursor: 'pointer' }}>
            <Terminal size={13} />ログ
          </button>
          <button
            onClick={() => setConfirmRestart(true)}
            disabled={restarting}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 14px', border: '1px solid #FCA5A5', borderRadius: 8, background: restarting ? '#FEE2E2' : '#FFF5F5', color: '#EF4444', fontSize: 12, cursor: restarting ? 'not-allowed' : 'pointer', fontWeight: 600 }}
          >
            <RotateCcw size={13} />{restarting ? '再起動中...' : '再起動'}
          </button>
          <button
            onClick={() => setConfirmDeploy(true)}
            disabled={deploying}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 14px', border: '1px solid #FDE68A', borderRadius: 8, background: deploying ? '#FFFBEB' : '#FFFDE7', color: '#92400E', fontSize: 12, cursor: deploying ? 'not-allowed' : 'pointer', fontWeight: 600 }}
          >
            <Upload size={13} />{deploying ? 'デプロイ中...' : 'デプロイ'}
          </button>
        </div>
      </div>

      {confirmRestart && (
        <div style={{ padding: 16, background: '#FFF5F5', border: '1px solid #FCA5A5', borderRadius: 10, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
          <AlertTriangle size={18} color="#EF4444" />
          <span style={{ flex: 1, fontSize: 13, color: '#7F1D1D' }}>本当に再起動しますか？</span>
          <button onClick={handleRestart} style={{ padding: '6px 14px', background: '#EF4444', color: '#fff', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>実行</button>
          <button onClick={() => setConfirmRestart(false)} style={{ padding: '6px 14px', background: '#fff', color: '#718096', border: '1px solid #E2E8F0', borderRadius: 7, fontSize: 12, cursor: 'pointer' }}>キャンセル</button>
        </div>
      )}

      {confirmDeploy && (
        <div style={{ padding: 16, background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, marginBottom: 20 }}>
          <div style={{ fontSize: 13, color: '#92400E', fontWeight: 600, marginBottom: 10 }}>本番デプロイ — 理由を入力してください</div>
          <input value={deployReason} onChange={e => setDeployReason(e.target.value)} placeholder="デプロイ理由（例: 人格更新）" style={{ ...inputSt, marginBottom: 10 }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleDeploy} disabled={!deployReason.trim()} style={{ padding: '6px 14px', background: deployReason.trim() ? '#C8860F' : '#E2E8F0', color: deployReason.trim() ? '#fff' : '#A0AEC0', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: deployReason.trim() ? 'pointer' : 'not-allowed' }}>実行</button>
            <button onClick={() => setConfirmDeploy(false)} style={{ padding: '6px 14px', background: '#fff', color: '#718096', border: '1px solid #E2E8F0', borderRadius: 7, fontSize: 12, cursor: 'pointer' }}>キャンセル</button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #E2E8F0' }}>
        {[
          { key: 'display_name', label: '表示名' },
          { key: 'description', label: '説明文' },
        ].map(({ key, label }) => (
          <div key={key}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4A5568', marginBottom: 4 }}>{label}</label>
            <input
              value={(form as Record<string, string>)[key] ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              style={inputSt}
            />
          </div>
        ))}
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4A5568', marginBottom: 4 }}>専門分野（カンマ区切り）</label>
          <input
            value={Array.isArray(form.specialties) ? form.specialties.join(', ') : ''}
            onChange={(e) => setForm((f) => ({ ...f, specialties: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) }))}
            style={inputSt}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4A5568', marginBottom: 4 }}>システムプロンプト</label>
          <textarea
            value={form.system_prompt ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, system_prompt: e.target.value }))}
            rows={8}
            style={{ ...inputSt, resize: 'vertical', fontFamily: 'monospace', fontSize: 12, lineHeight: 1.6 }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 20px', background: saving ? '#E2E8F0' : `linear-gradient(135deg, ${GOLD}, ${GOLD_BRIGHT})`, color: saving ? '#A0AEC0' : '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}
          >
            <Save size={14} />{saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>

      {showLogs && (
        <div style={{ marginTop: 20 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: NAVY, marginBottom: 8 }}>ログ（直近50行）</h3>
          <pre style={{ background: '#0F1E32', color: '#E2E8F0', padding: 16, borderRadius: 10, fontSize: 11, lineHeight: 1.6, overflow: 'auto', maxHeight: 320, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{logs}</pre>
        </div>
      )}
    </div>
  );
}
