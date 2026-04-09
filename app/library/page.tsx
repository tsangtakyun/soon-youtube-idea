import Link from 'next/link'

import { listSavedYoutubeIdeas } from '@/lib/supabase'

function modeLabel(mode: string) {
  if (mode === 'keyword') return '關鍵字'
  if (mode === 'channel_url') return '頻道 URL'
  if (mode === 'video_url') return '影片 URL'
  return mode
}

export default async function SavedLibraryPage() {
  const { rows, error } = await listSavedYoutubeIdeas()

  return (
    <main style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #f6f1e8 0%, #ece3d6 100%)', padding: '42px 24px 90px', color: '#1a1a18' }}>
      <div style={{ maxWidth: '1180px', margin: '0 auto', display: 'grid', gap: '20px' }}>
        <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.1fr) 0.9fr', gap: '20px' }}>
          <section style={{ padding: '30px', borderRadius: '28px', background: 'rgba(255,255,255,0.78)', border: '1px solid rgba(26,26,24,0.10)' }}>
            <p style={{ margin: '0 0 8px', fontSize: '12px', letterSpacing: '0.18em', color: '#8b7c69' }}>SAVED LIBRARY</p>
            <h1 style={{ margin: '0 0 12px', fontSize: '56px', lineHeight: 0.98, fontWeight: 500 }}>已保存 YouTube 題材庫</h1>
            <p style={{ margin: 0, fontSize: '20px', lineHeight: 1.7, color: '#5b5348', maxWidth: '720px' }}>
              呢度會保留每次生成過嘅題材卡。你可以返入單張題材 detail，再決定邊張值得帶去下一步 script planning。
            </p>
          </section>
          <section style={{ padding: '26px', borderRadius: '28px', background: '#1d1d1b', color: '#f5f0e6', display: 'grid', gap: '12px' }}>
            <div style={{ fontSize: '12px', letterSpacing: '0.14em', color: '#b8b0a2' }}>LIBRARY STATUS</div>
            <div style={{ padding: '14px 16px', borderRadius: '16px', background: 'rgba(255,255,255,0.08)', lineHeight: 1.7 }}>
              目前保存：{rows.length} 組搜索結果
            </div>
            <div style={{ padding: '14px 16px', borderRadius: '16px', background: 'rgba(255,255,255,0.08)', lineHeight: 1.7 }}>
              每組結果都包含 reference signals 同 5 張 AI 題材卡。
            </div>
            <Link href="/" style={{ display: 'inline-flex', width: 'fit-content', alignItems: 'center', justifyContent: 'center', borderRadius: '999px', background: '#f5efe5', color: '#1d1d1b', textDecoration: 'none', padding: '12px 16px' }}>
              重新生成新題材
            </Link>
          </section>
        </section>

        {error ? (
          <section style={{ padding: '18px 20px', borderRadius: '18px', background: '#fbf1ef', color: '#7d493f', lineHeight: 1.7 }}>
            {error}
          </section>
        ) : null}

        <section style={{ display: 'grid', gap: '16px' }}>
          {rows.length ? (
            rows.map((row) => {
              const firstCard = Array.isArray(row.ai_cards) ? row.ai_cards[0] : null
              return (
                <section key={row.id} style={{ padding: '24px', borderRadius: '24px', background: 'rgba(255,255,255,0.82)', border: '1px solid rgba(26,26,24,0.10)', display: 'grid', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'grid', gap: '8px' }}>
                      <div style={{ fontSize: '12px', letterSpacing: '0.14em', color: '#8b7c69' }}>{modeLabel(row.input_mode)} · {row.market} · {row.language}</div>
                      <div style={{ fontSize: '34px', lineHeight: 1.08 }}>{row.input_query}</div>
                      <div style={{ color: '#7b6d57', lineHeight: 1.7 }}>
                        {typeof firstCard?.title === 'string' ? `第一張建議：${firstCard.title}` : '已保存 5 張題材卡'}
                      </div>
                    </div>
                    <Link
                      href={`/library/${row.id}`}
                      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '999px', background: '#1a1a18', color: '#f5efe5', textDecoration: 'none', padding: '12px 16px' }}
                    >
                      查看詳情
                    </Link>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                    <div style={{ padding: '14px 16px', borderRadius: '16px', background: '#fbf8f1', lineHeight: 1.7 }}>
                      <div style={{ fontSize: '12px', letterSpacing: '0.12em', color: '#8b7c69', marginBottom: '6px' }}>Reference Rows</div>
                      <div>{Array.isArray(row.reference_data) ? row.reference_data.length : 0}</div>
                    </div>
                    <div style={{ padding: '14px 16px', borderRadius: '16px', background: '#fbf8f1', lineHeight: 1.7 }}>
                      <div style={{ fontSize: '12px', letterSpacing: '0.12em', color: '#8b7c69', marginBottom: '6px' }}>AI Cards</div>
                      <div>{Array.isArray(row.ai_cards) ? row.ai_cards.length : 0}</div>
                    </div>
                    <div style={{ padding: '14px 16px', borderRadius: '16px', background: '#fbf8f1', lineHeight: 1.7 }}>
                      <div style={{ fontSize: '12px', letterSpacing: '0.12em', color: '#8b7c69', marginBottom: '6px' }}>Created</div>
                      <div>{new Date(row.created_at).toLocaleString('en-GB')}</div>
                    </div>
                  </div>
                </section>
              )
            })
          ) : (
            <section style={{ padding: '24px', borderRadius: '24px', background: 'rgba(255,255,255,0.82)', border: '1px solid rgba(26,26,24,0.10)', lineHeight: 1.7, color: '#7b6d57' }}>
              目前未有已保存 YouTube 題材。你可以先去首頁生成第一批題材卡。
            </section>
          )}
        </section>
      </div>
    </main>
  )
}
