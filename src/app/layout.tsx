import type { Metadata } from 'next';
import './globals.css';
import Sidebar from '@/components/Sidebar';

export const metadata: Metadata = {
  title: 'Clone & Coach Hub',
  description: 'AI Clone & Coach Management',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body style={{ margin: 0, background: '#F7F8FA' }}>
        <div style={{ display: 'flex', minHeight: '100vh' }}>
          <Sidebar />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <header style={{
              height: 48, background: '#1A2E4A', display: 'flex', alignItems: 'center',
              padding: '0 20px', flexShrink: 0,
            }}>
              <span style={{
                fontSize: 16, fontWeight: 700, color: '#F5C842',
                fontFamily: "'Hiragino Mincho ProN','Yu Mincho',serif",
                letterSpacing: '0.05em',
              }}>
                🏮 Clone &amp; Coach Hub
              </span>
            </header>
            <main style={{ flex: 1, overflow: 'auto' }}>
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
