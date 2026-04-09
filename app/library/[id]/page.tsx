import Link from 'next/link'
import { notFound } from 'next/navigation'

import { getSavedYoutubeIdeaById } from '@/lib/supabase'

type Params = Promise<{ id: string }>

export default async function SavedIdeaDetailPage({ params }: { params: Params }) {
  const { id } = await params
  const { row } = await getSavedYoutubeIdeaById(id)

  if (!row) {
    notFound()
  }

  const ideaCards = Array.isArray(row.ai_cards) ? row.ai_cards : []
  const references = Array.isArray(row.reference_data) ? row.reference_data : []

  return (
    <main style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #f6f1e8 0%, #ece3d6 100%)', padding: '42px 24px 90px', color: '#1a1a18' }}>
      <div style={{ maxWidth: '1180px', margin: '0 auto', display: 'grid', gap: '20px' }}>
        <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.06fr) 0.94fr', gap: '20px' }}>
          <section style={{ padding: '30px', borderRadius: '28px', background: 'rgba(255,255,255,0.78)', border: '1px solid rgba(26,26,24,0.10)' }}>
            <p style={{ margin: '0 0 8px', fontSize: '12px', letterSpacing: '0.18em', color: '#8b7c69' }}>IDEA DETAIL</p>
            <h1 style={{ margin: '0 0 12px', fontSize: '54px', lineHeight: 0.98, fontWeight: 500 }}>{row.input_query}</h1>
            <p style={{ margin: 0, fontSize: '20px', lineHeight: 1.7, color: '#5b5348', maxWidth: '760px' }}>
              呢組題材卡由 {row.input_mode} 模式生成，現時已保存於 library，可以直接帶去後續 script planning 或 research handoff。
            </p>
          </section>
          <section style={{ padding: '26px', borderRadius: '28px', background: '#1d1d1b', color: '#f5f0e6', display: 'grid', gap: '12px' }}>
            <div style={{ fontSize: '12px', letterSpacing: '0.14em', color: '#b8b0a2' }}>NEXT STEP</div>
            <div style={{ padding: '14px 16px', borderRadius: '16px', background: 'rgba(255,255,255,0.08)', lineHeight: 1.7 }}>
              先 review 呢 5 張題材卡，再揀一張最值得拍嘅角度，之後帶去 script generator。
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              <Link href="/library" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '999px', background: '#f5efe5', color: '#1d1d1b', textDecoration: 'none', padding: '12px 16px' }}>
                返回 Library
              </Link>
              <a href="https://script-generator-xi.vercel.app" target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '999px', background: 'rgba(255,255,255,0.12)', color: '#f5efe5', textDecoration: 'none', padding: '12px 16px', border: '1px solid rgba(255,255,255,0.12)' }}>
                進入 Script Generator
              </a>
            </div>
          </section>
        </section>

        <section style={{ display: 'grid', gap: '16px' }}>
          <section style={{ padding: '24px', borderRadius: '24px', background: 'rgba(255,255,255,0.82)', border: '1px solid rgba(26,26,24,0.10)' }}>
            <div style={{ fontSize: '12px', letterSpacing: '0.16em', color: '#8b7c69', marginBottom: '8px' }}>REFERENCE SIGNALS</div>
            <div style={{ display: 'grid', gap: '12px' }}>
              {references.map((reference, index) => (
                <div key={`${String(reference.title)}-${index}`} style={{ padding: '14px 16px', borderRadius: '16px', background: '#fbf8f1' }}>
                  <div style={{ fontSize: '18px', lineHeight: 1.4 }}>{String(reference.title ?? '')}</div>
                  <div style={{ color: '#7b6d57', lineHeight: 1.7 }}>
                    {String(reference.channel ?? '')} · {String(reference.views ?? '')} views · {String(reference.publishedAt ?? '')}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {ideaCards.map((ideaCard, index) => (
            <section key={`${String(ideaCard.title)}-${index}`} style={{ padding: '24px', borderRadius: '24px', background: 'rgba(255,255,255,0.82)', border: '1px solid rgba(26,26,24,0.10)', display: 'grid', gap: '14px' }}>
              <div>
                <div style={{ fontSize: '12px', letterSpacing: '0.16em', color: '#8b7c69', marginBottom: '8px' }}>IDEA CARD {index + 1}</div>
                <div style={{ fontSize: '36px', lineHeight: 1.06 }}>{String(ideaCard.title ?? '')}</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                {[
                  ['核心角度', String(ideaCard.coreAngle ?? '')],
                  ['點解值得做', String(ideaCard.whyNow ?? '')],
                  ['Audience Fit', String(ideaCard.audienceFit ?? '')],
                  ['爆款 Pattern', String(ideaCard.breakoutPattern ?? '')],
                  ['Backings 要補乜', Array.isArray(ideaCard.backingInfoNeeded) ? ideaCard.backingInfoNeeded.join(' / ') : ''],
                  ['可延伸系列', Array.isArray(ideaCard.seriesExtensions) ? ideaCard.seriesExtensions.join(' / ') : ''],
                ].map(([label, value]) => (
                  <div key={label} style={{ padding: '14px 16px', borderRadius: '16px', background: '#fbf8f1', lineHeight: 1.7 }}>
                    <div style={{ fontSize: '12px', letterSpacing: '0.12em', color: '#8b7c69', marginBottom: '6px' }}>{label}</div>
                    <div>{value}</div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </section>
      </div>
    </main>
  )
}
