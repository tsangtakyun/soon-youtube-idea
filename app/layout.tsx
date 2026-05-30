import type { Metadata } from 'next'

import { EmbeddedMode } from '@/components/EmbeddedMode'
import './globals.css'

export const metadata: Metadata = {
  title: 'SOON 編輯工作台',
  description: 'SOON YouTube 的頻道基因、題材庫和論點生產線。',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-HK">
      <head>
        <link rel="stylesheet" href="/soon-design-system.css" />
      </head>
      <body
        style={{
          paddingTop: 0,
          margin: 0,
          fontFamily: 'var(--soon-font)',
          background: 'var(--soon-bg)',
          color: 'var(--soon-text)',
        }}
      >
        <EmbeddedMode />
        {children}
      </body>
    </html>
  )
}
