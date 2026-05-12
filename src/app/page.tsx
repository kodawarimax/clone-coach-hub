import Link from 'next/link';
import { Bot, Users, ArrowRight } from 'lucide-react';

const GOLD = '#C8860F';

async function getCloneCount(): Promise<number> {
  try {
    const { promises: fs } = await import('fs');
    const path = await import('path');
    const os = await import('os');
    const CLIENTS_DIR = path.join(os.homedir(), 'Claude', 'Service', 'Clone', 'clients');
    const EXCLUDE = new Set(['_archive', '_template', 'check_prompt', 'verify_prompt', 'verify_test', 'test_client', 'test_client_001', 'test_ryusen', 'test_verify_full', 'tokens.json']);
    const entries = await fs.readdir(CLIENTS_DIR, { withFileTypes: true });
    return entries.filter((e) => e.isDirectory() && !EXCLUDE.has(e.name)).length;
  } catch { return 0; }
}

export default async function DashboardPage() {
  const cloneCount = await getCloneCount();
  const sections = [
    {
      href: '/clones', icon: Bot, title: 'AI Clone 管理',
      count: `${cloneCount} クローン`, desc: '一覧・詳細編集・ログ・再起動',
      color: GOLD,
    },
    {
      href: '/coach', icon: Users, title: 'Coach 管理',
      count: '3 コーチ', desc: '北原 / 桜田 / のがちゃん',
      color: '#3B82F6',
    },
  ];
  return (
    <div style={{ padding: '32px 24px' }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1A2E4A', marginBottom: 24 }}>ダッシュボード</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {sections.map(({ href, icon: Icon, title, count, desc, color }) => (
          <Link key={href} href={href} style={{ textDecoration: 'none' }}>
            <div style={{
              background: '#fff', borderRadius: 14, padding: 20,
              border: `1.5px solid ${color}30`,
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              transition: 'all 140ms', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', gap: 12,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Icon size={28} color={color} />
                <ArrowRight size={16} color="#CBD5E0" />
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#2D3748' }}>{title}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color, marginTop: 4 }}>{count}</div>
                <div style={{ fontSize: 12, color: '#718096', marginTop: 2 }}>{desc}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
