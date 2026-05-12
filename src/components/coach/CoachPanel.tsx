'use client';
import { useState, useEffect, useCallback } from 'react';
import { Youtube, FileText, Settings, BookOpen, Save, RotateCcw, ChevronRight } from 'lucide-react';

const GOLD = '#C8860F';
const GOLD_BRIGHT = '#F5C842';

type CoachId = 'kitahara' | 'sakurada' | 'nogachan';
type Section = 'content' | 'weekly_plan' | 'profile' | 'knowledge';

interface CoachInfo {
  id: CoachId;
  displayName: string;
  emoji: string;
  accentColor: string;
  description: string;
  specialties: string[];
}

interface ContentForm {
  updatedAt: string;
  title: string;
  type: string;
  url: string;
  duration: string;
  category: string;
  coachInstructions: string;
}

interface KnowledgeFile {
  name: string;
  size: number;
  modified: string;
}

const TODAY = new Date().toISOString().slice(0, 10);

const CATEGORY_OPTIONS = [
  'management', 'accounting_basics', 'finance', 'habit', 'sns', 'startup',
  'standing_abs', 'lower_body', 'stretch', 'hiit', 'nutrition', 'other',
];

function formatBytes(b: number) {
  if (b < 1024) return `${b}B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)}KB`;
  return `${(b / (1024 * 1024)).toFixed(1)}MB`;
}

function inputStyle(_accentColor: string): React.CSSProperties {
  return {
    width: '100%', padding: '8px 10px', border: `1px solid #E2E8F0`,
    borderRadius: 8, fontSize: 13, color: '#2D3748', background: '#fff',
    outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 120ms',
  };
}

function SaveButton({ onClick, saving, label = '保存' }: { onClick: () => void; saving: boolean; label?: string }) {
  return (
    <button
      onClick={onClick}
      disabled={saving}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '9px 20px',
        background: saving ? '#E2E8F0' : `linear-gradient(135deg, ${GOLD}, ${GOLD_BRIGHT})`,
        color: saving ? '#A0AEC0' : '#fff',
        border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700,
        cursor: saving ? 'not-allowed' : 'pointer',
        transition: 'opacity 120ms',
      }}
    >
      <Save size={14} />
      {saving ? '保存中...' : label}
    </button>
  );
}

export default function CoachManagementPanel() {
  const [coaches, setCoaches] = useState<CoachInfo[]>([]);
  const [selectedCoach, setSelectedCoach] = useState<CoachId>('kitahara');
  const [activeSection, setActiveSection] = useState<Section>('content');
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [saving, setSaving] = useState(false);

  // section data
  const [contentForm, setContentForm] = useState<ContentForm>({
    updatedAt: TODAY, title: '', type: 'youtube', url: '', duration: '',
    category: 'management', coachInstructions: '',
  });
  const [weeklyPlan, setWeeklyPlan] = useState('');
  const [profile, setProfile] = useState<{ displayName: string; description: string; specialties: string[]; model: string; voiceId: string } | null>(null);
  const [knowledgeFiles, setKnowledgeFiles] = useState<KnowledgeFile[]>([]);
  const [loadingSection, setLoadingSection] = useState(false);

  const showToast = useCallback((msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Load coach list
  useEffect(() => {
    fetch('/api/coach-data')
      .then((r) => r.json())
      .then((d) => setCoaches(d.coaches || []))
      .catch(() => {});
  }, []);

  // Load section data when coach or section changes
  useEffect(() => {
    setLoadingSection(true);
    const apiSection =
      activeSection === 'content' ? 'current_content'
      : activeSection === 'weekly_plan' ? 'weekly_plan'
      : activeSection === 'profile' ? 'profile'
      : 'knowledge';

    fetch(`/api/coach-data/${selectedCoach}?section=${apiSection}`)
      .then((r) => r.json())
      .then((d) => {
        if (activeSection === 'content' && d.parsed) {
          setContentForm({ ...d.parsed, updatedAt: d.parsed.updatedAt || TODAY });
        } else if (activeSection === 'weekly_plan') {
          setWeeklyPlan(d.content || '');
        } else if (activeSection === 'profile') {
          setProfile(d.profile || null);
        } else if (activeSection === 'knowledge') {
          setKnowledgeFiles(d.files || []);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingSection(false));
  }, [selectedCoach, activeSection]);

  const buildContentMd = (f: ContentForm) =>
    `# 本日の学習コンテンツ（セッション開始時に参照）\n**更新日**: ${f.updatedAt}\n**タイトル**: ${f.title}\n**種別**: ${f.type}\n**URL**: ${f.url}\n**尺**: ${f.duration}\n**カテゴリ**: ${f.category}\n**ステータス**: セッション前に表示済み\n\n---\n## コーチへの指示（必須）\n${f.coachInstructions}\n`;

  const handleSave = async () => {
    setSaving(true);
    try {
      if (activeSection === 'content') {
        const content = buildContentMd({ ...contentForm, updatedAt: TODAY });
        const r = await fetch(`/api/coach-data/${selectedCoach}?section=current_content`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content }),
        });
        if (!r.ok) throw new Error();
        setContentForm((f) => ({ ...f, updatedAt: TODAY }));
        showToast('コンテンツを保存しました');
      } else if (activeSection === 'weekly_plan') {
        const r = await fetch(`/api/coach-data/${selectedCoach}?section=weekly_plan`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: weeklyPlan }),
        });
        if (!r.ok) throw new Error();
        showToast('週次プランを保存しました');
      } else if (activeSection === 'profile' && profile) {
        const r = await fetch(`/api/coach-data/${selectedCoach}?section=profile`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ updates: { description: profile.description, specialties: profile.specialties } }),
        });
        if (!r.ok) throw new Error();
        showToast('プロフィールを保存しました');
      }
    } catch {
      showToast('保存に失敗しました', false);
    } finally {
      setSaving(false);
    }
  };

  const currentCoach = coaches.find((c) => c.id === selectedCoach);
  const accentColor = currentCoach?.accentColor || GOLD;

  const SECTIONS: { key: Section; label: string; icon: React.ReactNode }[] = [
    { key: 'content', label: 'コンテンツ', icon: <Youtube size={14} /> },
    { key: 'weekly_plan', label: '週次プラン', icon: <FileText size={14} /> },
    { key: 'profile', label: 'プロフィール', icon: <Settings size={14} /> },
    { key: 'knowledge', label: 'ナレッジ', icon: <BookOpen size={14} /> },
  ];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#F7F8FA', overflow: 'hidden' }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 16, right: 16, zIndex: 9999,
          padding: '10px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
          background: toast.ok ? '#10B981' : '#EF4444', color: '#fff',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          animation: 'fadeIn 120ms ease',
        }}>
          {toast.msg}
        </div>
      )}

      {/* Coach Selector */}
      <div style={{ padding: '12px 16px 0', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {coaches.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCoach(c.id as CoachId)}
              style={{
                flex: 1, padding: '10px 8px', borderRadius: 10,
                border: `2px solid ${selectedCoach === c.id ? c.accentColor : '#E2E8F0'}`,
                background: selectedCoach === c.id ? `${c.accentColor}12` : '#fff',
                cursor: 'pointer', transition: 'all 120ms',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              }}
            >
              <span style={{ fontSize: 22 }}>{c.emoji}</span>
              <span style={{
                fontSize: 11, fontWeight: 700,
                color: selectedCoach === c.id ? c.accentColor : '#718096',
              }}>{c.displayName}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Section Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #E2E8F0', background: '#fff', flexShrink: 0, marginTop: 12 }}>
        {SECTIONS.map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setActiveSection(key)}
            style={{
              flex: 1, padding: '10px 4px', fontSize: 12, fontWeight: activeSection === key ? 700 : 500,
              color: activeSection === key ? accentColor : '#718096',
              background: 'none', border: 'none',
              borderBottom: activeSection === key ? `2px solid ${accentColor}` : '2px solid transparent',
              cursor: 'pointer', transition: 'color 120ms',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
              minHeight: 44,
            }}
          >
            {icon}<span>{label}</span>
          </button>
        ))}
      </div>

      {/* Section Body */}
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
        <div style={{ padding: '16px', maxWidth: 680, margin: '0 auto' }}>
          {loadingSection ? (
            <div style={{ textAlign: 'center', color: '#A0AEC0', padding: '40px 0', fontSize: 13 }}>読み込み中...</div>
          ) : (
            <>
              {/* コンテンツタブ */}
              {activeSection === 'content' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ fontSize: 13, color: '#718096', marginBottom: 4 }}>
                    次のセッション開始時にコーチが参照するコンテンツを設定します。
                  </div>

                  {(
                    [
                      { key: 'url', label: 'YouTube URL', placeholder: 'https://www.youtube.com/watch?v=...' },
                      { key: 'title', label: 'タイトル', placeholder: '動画・記事のタイトル' },
                      { key: 'duration', label: '尺', placeholder: '2分34秒' },
                    ] as const
                  ).map(({ key, label, placeholder }) => (
                    <div key={key}>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4A5568', marginBottom: 4 }}>{label}</label>
                      <input
                        value={contentForm[key]}
                        onChange={(e) => setContentForm((f) => ({ ...f, [key]: e.target.value }))}
                        placeholder={placeholder}
                        style={inputStyle(accentColor)}
                      />
                    </div>
                  ))}

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4A5568', marginBottom: 4 }}>カテゴリ</label>
                    <select
                      value={contentForm.category}
                      onChange={(e) => setContentForm((f) => ({ ...f, category: e.target.value }))}
                      style={{ ...inputStyle(accentColor), height: 36 }}
                    >
                      {CATEGORY_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4A5568', marginBottom: 4 }}>コーチへの指示</label>
                    <textarea
                      value={contentForm.coachInstructions}
                      onChange={(e) => setContentForm((f) => ({ ...f, coachInstructions: e.target.value }))}
                      rows={5}
                      placeholder="セッション開始時の一言・コンテンツへの誘導方法など"
                      style={{ ...inputStyle(accentColor), resize: 'vertical', fontFamily: 'monospace', lineHeight: 1.6 }}
                    />
                  </div>

                  {contentForm.url && (
                    <a
                      href={contentForm.url} target="_blank" rel="noopener noreferrer"
                      style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: accentColor, textDecoration: 'none' }}
                    >
                      <Youtube size={14} />プレビュー（別タブで開く）<ChevronRight size={12} />
                    </a>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 8 }}>
                    <SaveButton onClick={handleSave} saving={saving} />
                  </div>
                </div>
              )}

              {/* 週次プランタブ */}
              {activeSection === 'weekly_plan' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ fontSize: 13, color: '#718096' }}>
                    毎週日曜のレビューセッションで更新する週次プランです。
                  </div>
                  <textarea
                    value={weeklyPlan}
                    onChange={(e) => setWeeklyPlan(e.target.value)}
                    rows={18}
                    style={{
                      ...inputStyle(accentColor),
                      resize: 'vertical', fontFamily: 'monospace', fontSize: 12,
                      lineHeight: 1.7, background: '#FAFAFA',
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button
                      onClick={() => {
                        setLoadingSection(true);
                        fetch(`/api/coach-data/${selectedCoach}?section=weekly_plan`)
                          .then((r) => r.json())
                          .then((d) => setWeeklyPlan(d.content || ''))
                          .finally(() => setLoadingSection(false));
                      }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        padding: '8px 14px', border: '1px solid #E2E8F0',
                        borderRadius: 8, background: '#fff', color: '#718096',
                        fontSize: 12, cursor: 'pointer',
                      }}
                    >
                      <RotateCcw size={13} />リセット
                    </button>
                    <SaveButton onClick={handleSave} saving={saving} />
                  </div>
                </div>
              )}

              {/* プロフィールタブ */}
              {activeSection === 'profile' && profile && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{
                    padding: 12, background: `${accentColor}0d`, borderRadius: 10,
                    border: `1px solid ${accentColor}30`, fontSize: 12, color: '#718096',
                  }}>
                    <strong style={{ color: accentColor }}>モデル:</strong> {profile.model}
                    &nbsp;&nbsp;
                    <strong style={{ color: accentColor }}>Voice ID:</strong> {profile.voiceId.slice(0, 12)}...
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4A5568', marginBottom: 4 }}>説明文</label>
                    <textarea
                      value={profile.description}
                      onChange={(e) => setProfile((p) => p ? { ...p, description: e.target.value } : p)}
                      rows={3}
                      style={{ ...inputStyle(accentColor), resize: 'vertical' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4A5568', marginBottom: 4 }}>
                      専門分野（カンマ区切り）
                    </label>
                    <input
                      value={profile.specialties.join(', ')}
                      onChange={(e) => setProfile((p) => p ? {
                        ...p,
                        specialties: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                      } : p)}
                      style={inputStyle(accentColor)}
                    />
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                      {profile.specialties.map((s) => (
                        <span key={s} style={{
                          fontSize: 11, padding: '3px 8px', borderRadius: 20,
                          background: `${accentColor}15`, color: accentColor, fontWeight: 600,
                        }}>{s}</span>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 8 }}>
                    <SaveButton onClick={handleSave} saving={saving} />
                  </div>
                </div>
              )}

              {/* ナレッジタブ */}
              {activeSection === 'knowledge' && (
                <div>
                  <div style={{ fontSize: 13, color: '#718096', marginBottom: 12 }}>
                    ナレッジファイルは読み取り専用です。編集は <code style={{ fontSize: 11, background: '#EDF2F7', padding: '1px 4px', borderRadius: 4 }}>Service/Clone/clients/</code> で行ってください。
                  </div>
                  {knowledgeFiles.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#A0AEC0', padding: '24px 0', fontSize: 13 }}>ファイルなし</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, border: '1px solid #E2E8F0', borderRadius: 10, overflow: 'hidden' }}>
                      {knowledgeFiles.map((f, i) => (
                        <div
                          key={f.name}
                          style={{
                            display: 'flex', alignItems: 'center', padding: '10px 14px', gap: 10,
                            borderTop: i > 0 ? '1px solid #EDF2F7' : 'none',
                            background: '#fff',
                          }}
                        >
                          <BookOpen size={14} color={accentColor} style={{ flexShrink: 0 }} />
                          <span style={{ flex: 1, fontSize: 12, color: '#2D3748', wordBreak: 'break-all' }}>{f.name}</span>
                          <span style={{ fontSize: 11, color: '#A0AEC0', whiteSpace: 'nowrap' }}>{formatBytes(f.size)}</span>
                          <span style={{ fontSize: 10, color: '#CBD5E0', whiteSpace: 'nowrap', marginLeft: 8 }}>
                            {new Date(f.modified).toLocaleDateString('ja-JP')}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
