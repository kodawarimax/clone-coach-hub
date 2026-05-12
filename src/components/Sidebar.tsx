'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Bot, Users } from 'lucide-react';

const GOLD = '#C8860F';
const GOLD_BRIGHT = '#F5C842';
const NAVY = '#1A2E4A';

const NAV = [
  { href: '/', icon: LayoutDashboard, label: 'ダッシュ' },
  { href: '/clones', icon: Bot, label: 'AI Clone' },
  { href: '/coach', icon: Users, label: 'Coach' },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <nav style={{
      width: 64, minHeight: '100vh', background: NAVY,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      paddingTop: 16, gap: 4, flexShrink: 0,
    }}>
      {NAV.map(({ href, icon: Icon, label }) => {
        const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
        return (
          <Link key={href} href={href} style={{ textDecoration: 'none', width: '100%' }}>
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              padding: '10px 0', gap: 4, cursor: 'pointer',
              borderLeft: active ? `3px solid ${GOLD_BRIGHT}` : '3px solid transparent',
              background: active ? 'rgba(200,134,15,0.12)' : 'transparent',
            }}>
              <Icon size={20} color={active ? GOLD_BRIGHT : 'rgba(255,255,255,0.5)'} />
              <span style={{ fontSize: 9, color: active ? GOLD_BRIGHT : 'rgba(255,255,255,0.4)', fontWeight: 600 }}>{label}</span>
            </div>
          </Link>
        );
      })}
    </nav>
  );
}
