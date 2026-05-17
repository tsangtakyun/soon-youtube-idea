import Link from 'next/link'

import { listSavedYoutubeIdeas } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

function modeLabel(mode: string) {
  if (mode === 'keyword') return '關鍵字'
  if (mode === 'channel_url') return 'Channel URL'
  if (mode === 'video_url') return 'Video URL'
  return mode
}

export default async function SavedLibraryPage() {
  const { rows, error } = await listSavedYoutubeIdeas()

  return (
    <main style={{ minHeight: '100vh', background: '#0a0a0f', color: '#f0f0f5', padding: '32px 28px 80px', fontFamily: 'system-ui, sans-serif' }}>
      <section style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '20px', marginBottom: '24px' }}>
        <div>
          <p style={{ margin: '0 0 6px', fontSize: '12px', letterSpacing: '0.18em', color: '#5a5a72' }}>SAVED LIBRARY</p>
          <h1 style={{ margin: 0, fontSize: '36px', lineHeight: 1.08 }}>影片收藏</h1>
          <p style={{ margin: '8px 0 0', color: '#9090a8', fontSize: '14px' }}>
            已儲存 {rows.length} 組 YouTube 題材研究。
          </p>
        </div>
        <Link href="/" style={{ color: '#7c5cfc', border: '1px solid #7c5cfc', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', textDecoration: 'none', fontWeight: 600 }}>
          返回工作台
        </Link>
      </section>

      {error ? (
        <section style={{ marginBottom: '16px', padding: '12px 14px', borderRadius: '10px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)', color: '#fca5a5', fontSize: '13px' }}>
          {error}
        </section>
      ) : null}

      <section style={{ display: 'grid', gap: '12px' }}>
        {rows.length ? (
          rows.map((row) => {
            const firstCard = Array.isArray(row.ai_cards) ? row.ai_cards[0] : null
            return (
              <article key={row.id} style={{ background: '#16161f', border: '1px solid #2a2a3a', borderRadius: '14px', padding: '18px', display: 'grid', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '18px' }}>
                  <div>
                    <div style={{ color: '#5a5a72', fontSize: '11px', letterSpacing: '0.12em', marginBottom: '8px' }}>
                      {modeLabel(row.input_mode)} · {row.market} · {row.language}
                    </div>
                    <h2 style={{ margin: 0, fontSize: '22px', lineHeight: 1.3 }}>{row.input_query}</h2>
                    <p style={{ margin: '8px 0 0', color: '#9090a8', fontSize: '13px', lineHeight: 1.7 }}>
                      {typeof firstCard?.title === 'string' ? `第一個題材：${firstCard.title}` : '已儲存 AI 題材卡。'}
                    </p>
                  </div>
                  <Link href={`/library/${row.id}`} style={{ color: '#fff', background: '#7c5cfc', borderRadius: '8px', padding: '8px 14px', textDecoration: 'none', fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                    查看詳情
                  </Link>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  <div style={{ background: '#111118', border: '1px solid #2a2a3a', borderRadius: '10px', padding: '12px' }}>
                    <div style={{ color: '#5a5a72', fontSize: '11px', marginBottom: '6px' }}>話題信號</div>
                    <div>{Array.isArray(row.reference_data) ? row.reference_data.length : 0}</div>
                  </div>
                  <div style={{ background: '#111118', border: '1px solid #2a2a3a', borderRadius: '10px', padding: '12px' }}>
                    <div style={{ color: '#5a5a72', fontSize: '11px', marginBottom: '6px' }}>已選題目</div>
                    <div>{Array.isArray(row.ai_cards) ? row.ai_cards.length : 0}</div>
                  </div>
                  <div style={{ background: '#111118', border: '1px solid #2a2a3a', borderRadius: '10px', padding: '12px' }}>
                    <div style={{ color: '#5a5a72', fontSize: '11px', marginBottom: '6px' }}>建立時間</div>
                    <div>{new Date(row.created_at).toLocaleString('zh-HK')}</div>
                  </div>
                </div>
              </article>
            )
          })
        ) : (
          <section style={{ minHeight: '320px', display: 'grid', placeItems: 'center', textAlign: 'center', background: '#16161f', border: '1px solid #2a2a3a', borderRadius: '14px', color: '#9090a8' }}>
            <div>
              <p style={{ margin: '0 0 8px', color: '#f0f0f5', fontSize: '18px', fontWeight: 700 }}>未有影片收藏</p>
              <p style={{ margin: 0, fontSize: '13px' }}>返回工作台生成題材後，系統會自動儲存到呢度。</p>
            </div>
          </section>
        )}
      </section>
    </main>
  )
}
