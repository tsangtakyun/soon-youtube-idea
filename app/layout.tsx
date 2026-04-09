import type { Metadata } from 'next'
import Link from 'next/link'

import './globals.css'

export const metadata: Metadata = {
  title: 'SOON · YouTube 題材庫',
  description: 'AI 驅動 YouTube 題材發現工具，為 SOON 團隊及 creator 使用。',
}

function NavBar() {
  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        backgroundColor: '#F5F2EC',
        borderBottom: '1px solid #e0ddd6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 32px',
        height: '54px',
        fontFamily: 'Georgia, Times New Roman, serif',
      }}
    >
      <Link href="/" style={{ fontSize: '13px', letterSpacing: '0.16em', color: '#888', textDecoration: 'none' }}>
        SOON YOUTUBE
      </Link>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <Link href="/" style={{ fontSize: '13px', color: '#1a1a1a', textDecoration: 'none', padding: '6px 14px', borderBottom: '1px solid #1a1a1a', letterSpacing: '0.03em' }}>
          YouTube Idea Finder
        </Link>
        <a href="https://idea-brainstorm.vercel.app" style={{ fontSize: '13px', color: '#888', textDecoration: 'none', padding: '6px 14px', letterSpacing: '0.03em' }}>
          IG 題材庫
        </a>
      </div>
    </nav>
  )
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-HK">
      <body style={{ paddingTop: '54px', fontFamily: 'Georgia, Times New Roman, serif' }}>
        <NavBar />
        {children}
      </body>
    </html>
  )
}
