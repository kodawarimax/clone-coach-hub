'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Bot, Users } from 'lucide-react';
import { TOKEN } from '@/lib/tokens';

const GOLD = TOKEN.color.gold;
const GOLD_BRIGHT = TOKEN.color.goldBright;
const NAVY = TOKEN.color.navy;

const NAV = [
  { href: '/', icon: LayoutDashboard, label: 'ダッシュ' },
  { href: '/clones', icon: Bot, label: 'AI Clone' },
  { href: '/coach', icon: Users, label: 'Coach' },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <nav style={{
      width: 160, minHeight: '100vh', background: NAVY,
      display: 'flex', flexDirection: 'column', alignItems: 'stretch',
      paddingTop: 16, gap: 4, flexShrink: 0,
    }}>
      {NAV.map(({ href, icon: Icon, label }) => {
        const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
        return (
          <Link key={href} href={href} style={{ textDecoration: 'none', width: '100%' }}>
            <div style={{
              display: 'flex', flexDirection: 'row', alignItems: 'center',
              padding: '10px 16px', gap: 10, cursor: 'pointer',
              borderLeft: active ? `3px solid ${GOLD_BRIGHT}` : '3px solid transparent',
              background: active ? 'rgba(200,134,15,0.18)' : 'transparent',
            }}>
              <Icon size={20} color={active ? GOLD_BRIGHT : 'rgba(255,255,255,0.5)'} />
              <span style={{ fontSize: 13, color: active ? GOLD_BRIGHT : 'rgba(255,255,255,0.4)', fontWeight: 600 }}>{label}</span>
            </div>
          </Link>
        );
      })}
    </nav>
  );
}
