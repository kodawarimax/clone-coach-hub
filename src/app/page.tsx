import Link from 'next/link';
import { Bot, Users, ArrowRight, Clock, Zap } from 'lucide-react';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { TOKEN } from '@/lib/tokens';

const CLIENTS_DIR = process.env.CLONE_CLIENTS_DIR
  ?? path.join(os.homedir(), 'Claude', 'Service', 'Clone', 'clients');

const EXCLUDE = new Set([
  '_archive', '_template', 'check_prompt', 'verify_prompt', 'verify_test',
  'test_client', 'test_client_001', 'test_ryusen', 'test_verify_full', 'tokens.json',
]);

const COACH_IDS = [
  { id: 'kitahara', label: '北原COO', emoji: '🎯', color: '#C8860F' },
  { id: 'sakurada', label: '桜田部長', emoji: '💼', color: '#3B82F6' },
  { id: 'nogachan', label: 'のがちゃん', emoji: '💪', color: '#EF4444' },
];

const COACH_DIRS: Record<string, string> = {
  kitahara: 'kitahara',
  sakurada: 'sakurada_coo',
  nogachan: 'nogachan',
};

interface CloneInfo {
  slug: string;
  displayName: string;
  description: string;
  specialties: string[];
}

async function getSystemStatus() {
  let clones: CloneInfo[] = [];
  let totalCount = 0;

  try {
    const entries = await fs.readdir(CLIENTS_DIR, { withFileTypes: true });
    const dirs = entries.filter((e) => e.isDirectory() && !EXCLUDE.has(e.name));
    totalCount = dirs.length;
    clones = (
      await Promise.all(
        dirs.map(async (e) => {
          try {
            const raw = await fs.readFile(
              path.join(CLIENTS_DIR, e.name, 'profile.json'), 'utf-8'
            );
            const p = JSON.parse(raw);
            return {
              slug: e.name,
              displayName: p.display_name || p.name || e.name,
              description: (p.description || '').slice(0, 60),
              specialties: (p.specialties || []).slice(0, 3),
            } as CloneInfo;
          } catch { return null; }
        })
      )
    ).filter((c): c is CloneInfo => c !== null);
  } catch {}

  // コーチのコンテンツ最終更新日を取得
  const coachUpdates: { id: string; label: string; emoji: string; color: string; updatedAt: string; title: string }[] = [];
  for (const coach of COACH_IDS) {
    try {
      const fp = path.join(CLIENTS_DIR, COACH_DIRS[coach.id], 'memory', 'current_content.md');
      const raw = await fs.readFile(fp, 'utf-8');
      const dateMatch = raw.match(/\*\*更新日\*\*:\s*(.+)/);
      const titleMatch = raw.match(/\*\*タイトル\*\*:\s*(.+)/);
      coachUpdates.push({
        ...coach,
        updatedAt: dateMatch ? dateMatch[1].trim() : '未設定',
        title: titleMatch ? titleMatch[1].trim().slice(0, 30) : '未設定',
      });
    } catch {
      coachUpdates.push({ ...coach, updatedAt: '未設定', title: '未設定' });
    }
  }

  return { clones, totalCount, coachUpdates };
}

export default async function DashboardPage() {
  const { clones, totalCount, coachUpdates } = await getSystemStatus();

  const GOLD = TOKEN.color.gold;
  const NAVY = TOKEN.color.navy;

  return (
    <div style={{ padding: '24px', maxWidth: 1100 }}>
      {/* ページタイトル */}
      <h1 style={{ fontSize: 18, fontWeight: 700, color: NAVY, margin: '0 0 20px 0' }}>
        ダッシュボード
      </h1>

      {/* サマリーカード */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 24 }}>
        <Link href="/clones" style={{ textDecoration: 'none' }}>
          <div style={{
            background: '#fff', borderRadius: 14, padding: '18px 20px',
            border: `1.5px solid ${GOLD}30`, boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer',
          }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: `${GOLD}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Bot size={24} color={GOLD} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: '#718096', marginBottom: 2 }}>AI Clone</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: GOLD, lineHeight: 1 }}>{totalCount}</div>
              <div style={{ fontSize: 11, color: '#A0AEC0', marginTop: 2 }}>クローン登録済み</div>
            </div>
            <ArrowRight size={16} color="#CBD5E0" />
          </div>
        </Link>
        <Link href="/coach" style={{ textDecoration: 'none' }}>
          <div style={{
            background: '#fff', borderRadius: 14, padding: '18px 20px',
            border: '1.5px solid #3B82F630', boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer',
          }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: '#3B82F612', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Users size={24} color="#3B82F6" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: '#718096', marginBottom: 2 }}>Coach</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#3B82F6', lineHeight: 1 }}>3</div>
              <div style={{ fontSize: 11, color: '#A0AEC0', marginTop: 2 }}>北原 / 桜田 / のがちゃん</div>
            </div>
            <ArrowRight size={16} color="#CBD5E0" />
          </div>
        </Link>
      </div>

      {/* 2カラム: クローン一覧 + コーチステータス */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 16, alignItems: 'start' }}>

        {/* クローン一覧（最新8件） */}
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #EDF2F7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: NAVY }}>クローン一覧</span>
            <Link href="/clones" style={{ fontSize: 11, color: GOLD, textDecoration: 'none', fontWeight: 600 }}>すべて見る →</Link>
          </div>
          {clones.slice(0, 8).map((c, i) => (
            <Link key={c.slug} href={`/clones/${c.slug}`} style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex', alignItems: 'center', padding: '10px 18px', gap: 12,
                borderTop: i > 0 ? '1px solid #EDF2F7' : 'none',
                background: '#fff', cursor: 'pointer',
              }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: `${GOLD}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Bot size={15} color={GOLD} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#2D3748', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.displayName}</div>
                  <div style={{ fontSize: 10, color: '#A0AEC0', fontFamily: 'monospace' }}>{c.slug}</div>
                </div>
                {c.specialties.length > 0 && (
                  <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 20, background: `${GOLD}15`, color: GOLD, fontWeight: 600, whiteSpace: 'nowrap' }}>
                    {c.specialties[0]}
                  </span>
                )}
              </div>
            </Link>
          ))}
          {clones.length > 8 && (
            <div style={{ padding: '10px 18px', borderTop: '1px solid #EDF2F7', textAlign: 'center' }}>
              <Link href="/clones" style={{ fontSize: 12, color: GOLD, textDecoration: 'none' }}>+ {clones.length - 8}件を見る</Link>
            </div>
          )}
        </div>

        {/* コーチステータス */}
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #EDF2F7' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: NAVY }}>コーチ コンテンツ状況</span>
          </div>
          {coachUpdates.map((c, i) => (
            <Link key={c.id} href="/coach" style={{ textDecoration: 'none' }}>
              <div style={{
                padding: '12px 18px', borderTop: i > 0 ? '1px solid #EDF2F7' : 'none',
                background: '#fff', cursor: 'pointer',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                  <span style={{ fontSize: 16 }}>{c.emoji}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: c.color }}>{c.label}</span>
                  <span style={{ marginLeft: 'auto', fontSize: 10, color: '#A0AEC0', display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Clock size={10} />{c.updatedAt}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: '#718096', lineHeight: 1.4, paddingLeft: 24 }}>
                  {c.title || '（コンテンツ未設定）'}
                </div>
              </div>
            </Link>
          ))}
          <div style={{ padding: '12px 18px', borderTop: '1px solid #EDF2F7' }}>
            <Link href="/coach" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px', background: `${GOLD}0a`, borderRadius: 8, color: GOLD, fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
              <Zap size={13} />コーチコンテンツを更新
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
