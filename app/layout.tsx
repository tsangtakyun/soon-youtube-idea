import type { Metadata } from 'next'
import Link from 'next/link'

import './globals.css'

export const metadata: Metadata = {
  title: 'SOON · Youtube Idea Reader',
  description: 'SOON 內部 YouTube 題材閱讀與研究工作台。',
}

function NavBar() {
  return (
    <nav
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
        background: '#0f0f0f',
        borderBottom: '0.5px solid var(--soon-border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 20px', height: '62px',
      }}
    >
      <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', fontSize: '15px', fontWeight: 700, color: 'var(--soon-text)', textDecoration: 'none' }}>
        <span style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '999px', background: 'var(--soon-purple)' }} />
          <span style={{ width: '10px', height: '10px', borderRadius: '999px', background: 'var(--soon-purple-light)' }} />
          <span style={{ width: '10px', height: '10px', borderRadius: '999px', background: 'var(--soon-success)' }} />
        </span>
        SOON Internal
      </Link>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <Link href="/" style={{ fontSize: '13px', color: '#fff', textDecoration: 'none', padding: '9px 14px', letterSpacing: '0.03em', borderRadius: 'var(--soon-radius)', background: 'var(--soon-purple)', border: '0.5px solid rgba(124,58,237,0.3)' }}>
          題材
        </Link>
        <Link href="/trends" style={{ fontSize: '13px', color: 'var(--soon-text-secondary)', textDecoration: 'none', padding: '9px 14px', letterSpacing: '0.03em', borderRadius: 'var(--soon-radius)', background: 'transparent', border: '0.5px solid var(--soon-border)' }}>
          🔥 趨勢雷達
        </Link>
        <Link href="/library" style={{ fontSize: '13px', color: 'var(--soon-text-secondary)', textDecoration: 'none', padding: '9px 14px', letterSpacing: '0.03em', borderRadius: 'var(--soon-radius)', background: 'transparent', border: '0.5px solid var(--soon-border)' }}>
          題材庫
        </Link>
        <a href="https://idea-brainstorm.vercel.app" style={{ fontSize: '13px', color: 'var(--soon-text-secondary)', textDecoration: 'none', padding: '9px 14px', letterSpacing: '0.03em', borderRadius: 'var(--soon-radius)', background: 'transparent', border: '0.5px solid var(--soon-border)' }}>
          IG 題材庫
        </a>
      </div>
    </nav>
  )
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-HK">
      <head>
        <link rel="stylesheet" href="/soon-design-system.css" />
      </head>
      <body style={{ paddingTop: '78px', margin: 0, fontFamily: 'system-ui, sans-serif', background: 'var(--soon-bg)', color: 'var(--soon-text)' }}>
        <NavBar />
        {children}
      </body>
    </html>
  )
}
