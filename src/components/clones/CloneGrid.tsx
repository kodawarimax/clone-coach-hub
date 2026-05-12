'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Circle, RefreshCw, Plus } from 'lucide-react';
import NewCloneWizard from './NewCloneWizard';

const GOLD = '#C8860F';

interface Clone {
  slug: string;
  display_name?: string;
  name?: string;
  description?: string;
  model?: string;
  specialties?: string[];
  status?: 'online' | 'offline' | 'unknown';
  featured?: boolean;
}

function StatusDot({ status }: { status?: string }) {
  const color = status === 'online' ? '#10B981' : status === 'offline' ? '#EF4444' : '#CBD5E0';
  return <Circle size={8} fill={color} color={color} />;
}

export default function CloneGrid() {
  const [clones, setClones] = useState<Clone[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);

  const load = () => {
    setLoading(true);
    fetch('/api/clones')
      .then((r) => r.json())
      .then((d) => setClones(d.clones || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  if (loading) return <div style={{ textAlign: 'center', padding: '60px 0', color: '#A0AEC0', fontSize: 14 }}>読み込み中...</div>;

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1A2E4A', margin: 0 }}>AI Clone 一覧 ({clones.length})</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={load} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', border: '1px solid #E2E8F0', borderRadius: 8, background: '#fff', color: '#718096', fontSize: 12, cursor: 'pointer' }}>
            <RefreshCw size={13} />更新
          </button>
          <button onClick={() => setShowWizard(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', border: 'none', borderRadius: 8, background: `linear-gradient(135deg, #C8860F, #F5C842)`, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            <Plus size={13} />新規作成
          </button>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
        {clones.map((c) => (
          <Link key={c.slug} href={`/clones/${c.slug}`} style={{ textDecoration: 'none' }}>
            <div style={{
              background: '#fff', borderRadius: 12, padding: '14px 16px',
              border: '1px solid #E2E8F0', cursor: 'pointer',
              transition: 'all 140ms', boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              display: 'flex', flexDirection: 'column', gap: 8,
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = GOLD + '60'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#E2E8F0'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#2D3748' }}>{c.display_name || c.name || c.slug}</span>
                <StatusDot status={c.status} />
              </div>
              <div style={{ fontSize: 10, color: '#A0AEC0', fontFamily: 'monospace' }}>{c.slug}</div>
              {c.model && <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, background: `${GOLD}15`, color: GOLD, fontWeight: 600, alignSelf: 'flex-start' }}>{c.model}</span>}
              {c.description && <div style={{ fontSize: 11, color: '#718096', lineHeight: 1.4 }}>{c.description.slice(0, 60)}{c.description.length > 60 ? '...' : ''}</div>}
              {c.specialties && c.specialties.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                  {c.specialties.slice(0, 3).map((s) => (
                    <span key={s} style={{ fontSize: 9, padding: '1px 5px', borderRadius: 10, background: '#EDF2F7', color: '#4A5568' }}>{s}</span>
                  ))}
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
      {showWizard && <NewCloneWizard onClose={() => setShowWizard(false)} onCreated={() => { setShowWizard(false); load(); }} />}
    </div>
  );
}
