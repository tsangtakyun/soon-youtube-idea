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
        background: 'linear-gradient(180deg, #252845 0%, #21233d 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 20px', height: '62px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.22)',
      }}
    >
      <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', fontSize: '15px', fontWeight: 700, color: '#f5f7ff', textDecoration: 'none' }}>
        <span style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '999px', background: '#ff7d4d' }} />
          <span style={{ width: '10px', height: '10px', borderRadius: '999px', background: '#8b7dff' }} />
          <span style={{ width: '10px', height: '10px', borderRadius: '999px', background: '#5f89ff' }} />
        </span>
        SOON Internal
      </Link>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <Link href="/" style={{ fontSize: '13px', color: '#eef1ff', textDecoration: 'none', padding: '9px 14px', letterSpacing: '0.03em', borderRadius: '999px', background: 'rgba(139,125,255,0.22)', border: '1px solid rgba(255,255,255,0.08)' }}>
          題材
        </Link>
        <Link href="/trends" style={{ fontSize: '13px', color: '#cfd5ff', textDecoration: 'none', padding: '9px 14px', letterSpacing: '0.03em', borderRadius: '999px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          🔥 趨勢雷達
        </Link>
        <Link href="/library" style={{ fontSize: '13px', color: '#cfd5ff', textDecoration: 'none', padding: '9px 14px', letterSpacing: '0.03em', borderRadius: '999px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          題材庫
        </Link>
        <a href="https://idea-brainstorm.vercel.app" style={{ fontSize: '13px', color: '#cfd5ff', textDecoration: 'none', padding: '9px 14px', letterSpacing: '0.03em', borderRadius: '999px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          IG 題材庫
        </a>
      </div>
    </nav>
  )
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-HK">
      <body style={{ paddingTop: '78px', margin: 0, fontFamily: '"SF Pro Rounded", "SF Pro Display", ui-sans-serif, system-ui, sans-serif', background: '#1d2037', color: '#eef1ff' }}>
        <NavBar />
        {children}
      </body>
    </html>
  )
}
