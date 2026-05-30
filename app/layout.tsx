import type { Metadata } from 'next'
import Link from 'next/link'

import { EmbeddedMode } from '@/components/EmbeddedMode'
import './globals.css'

export const metadata: Metadata = {
  title: 'SOON 編輯工作台',
  description: 'SOON YouTube 的頻道基因、題目庫和論點生產線。',
}

const navLinkStyle = {
  fontSize: '13px',
  color: 'var(--soon-text-secondary)',
  textDecoration: 'none',
  padding: '9px 14px',
  letterSpacing: '0.03em',
  borderRadius: 'var(--soon-radius)',
  background: 'transparent',
  border: '0.5px solid var(--soon-border)',
}

function NavBar() {
  return (
    <nav
      className="soon-hide-embedded"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        background: '#0f0f0f',
        borderBottom: '0.5px solid var(--soon-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        height: '62px',
      }}
    >
      <Link
        href="/"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '15px',
          fontWeight: 700,
          color: 'var(--soon-text)',
          textDecoration: 'none',
        }}
      >
        <span style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '999px', background: 'var(--soon-purple)' }} />
          <span style={{ width: '10px', height: '10px', borderRadius: '999px', background: 'var(--soon-purple-light)' }} />
          <span style={{ width: '10px', height: '10px', borderRadius: '999px', background: 'var(--soon-success)' }} />
        </span>
        SOON 工作台
      </Link>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <Link
          href="/"
          style={{
            ...navLinkStyle,
            color: '#fff',
            background: 'var(--soon-purple)',
            border: '0.5px solid rgba(124,58,237,0.3)',
          }}
        >
          首頁
        </Link>
        <Link href="/channel" style={navLinkStyle}>
          頻道基因
        </Link>
        <Link href="/topics" style={navLinkStyle}>
          題目庫
        </Link>
        <Link href="/workbench" style={navLinkStyle}>
          論點生產線
        </Link>
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
      <body
        style={{
          paddingTop: '78px',
          margin: 0,
          fontFamily: 'system-ui, sans-serif',
          background: 'var(--soon-bg)',
          color: 'var(--soon-text)',
        }}
      >
        <EmbeddedMode />
        <NavBar />
        {children}
      </body>
    </html>
  )
}
