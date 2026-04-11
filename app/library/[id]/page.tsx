import Link from 'next/link'
import { notFound } from 'next/navigation'

import { getSavedYoutubeIdeaById } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

type PageParams = { id: string }

export default async function SavedIdeaDetailPage({
  params,
}: {
  params: Promise<PageParams> | PageParams
}) {
  const { id } = await Promise.resolve(params)
  const { row } = await getSavedYoutubeIdeaById(id)

  if (!row) {
    notFound()
  }

  const ideaCards = Array.isArray(row.ai_cards) ? row.ai_cards : []
  const references = Array.isArray(row.reference_data) ? row.reference_data : []

  return (
    <main style={{ minHeight: '100vh', background: 'radial-gradient(circle at top left, rgba(107,124,255,0.18), transparent 26%), #1d2037', padding: '28px 24px 90px', color: '#eef1ff' }}>
      <div style={{ maxWidth: '1180px', margin: '0 auto', display: 'grid', gap: '20px' }}>
        <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.06fr) 0.94fr', gap: '20px' }}>
          <section style={{ padding: '30px', borderRadius: '28px', background: 'rgba(42,46,79,0.94)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p style={{ margin: '0 0 8px', fontSize: '12px', letterSpacing: '0.18em', color: '#97a0d7' }}>IDEA DETAIL</p>
            <h1 style={{ margin: '0 0 12px', fontSize: '54px', lineHeight: 0.98, fontWeight: 500 }}>{row.input_query}</h1>
            <p style={{ margin: 0, fontSize: '20px', lineHeight: 1.7, color: '#c7ceef', maxWidth: '760px' }}>
              呢組題材卡由 {row.input_mode} 模式生成，現時已保存於 library，可以直接帶去後續 script planning 或 research handoff。
            </p>
          </section>
          <section style={{ padding: '26px', borderRadius: '28px', background: 'rgba(32,35,61,0.96)', color: '#f5f7ff', display: 'grid', gap: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '12px', letterSpacing: '0.14em', color: '#97a0d7' }}>NEXT STEP</div>
            <div style={{ padding: '14px 16px', borderRadius: '16px', background: 'rgba(255,255,255,0.05)', lineHeight: 1.7 }}>
              先 review 呢 5 張題材卡，再揀一張最值得拍嘅角度，之後帶去 script generator。
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              <Link href="/library" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '999px', background: 'rgba(255,255,255,0.05)', color: '#f5f7ff', textDecoration: 'none', padding: '12px 16px', border: '1px solid rgba(255,255,255,0.08)' }}>
                返回 Library
              </Link>
              <a href="https://script-generator-xi.vercel.app" target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '999px', background: 'linear-gradient(135deg, #7d6bff 0%, #5f89ff 100%)', color: '#f5f7ff', textDecoration: 'none', padding: '12px 16px', border: 'none' }}>
                進入 Script Generator
              </a>
            </div>
          </section>
        </section>

        <section style={{ display: 'grid', gap: '16px' }}>
          <section style={{ padding: '24px', borderRadius: '24px', background: 'rgba(42,46,79,0.94)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '12px', letterSpacing: '0.16em', color: '#97a0d7', marginBottom: '8px' }}>REFERENCE SIGNALS</div>
            <div style={{ display: 'grid', gap: '12px' }}>
              {references.map((reference, index) => (
                <div key={`${String(reference.title)}-${index}`} style={{ padding: '14px 16px', borderRadius: '16px', background: 'rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: '18px', lineHeight: 1.4 }}>{String(reference.title ?? '')}</div>
                  <div style={{ color: '#c7ceef', lineHeight: 1.7 }}>
                    {String(reference.channel ?? '')} · {String(reference.views ?? '')} views · {String(reference.publishedAt ?? '')}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {ideaCards.map((ideaCard, index) => (
            <section key={`${String(ideaCard.title)}-${index}`} style={{ padding: '24px', borderRadius: '24px', background: 'rgba(42,46,79,0.94)', border: '1px solid rgba(255,255,255,0.08)', display: 'grid', gap: '14px' }}>
              <div>
                <div style={{ fontSize: '12px', letterSpacing: '0.16em', color: '#97a0d7', marginBottom: '8px' }}>IDEA CARD {index + 1}</div>
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
                  <div key={label} style={{ padding: '14px 16px', borderRadius: '16px', background: 'rgba(255,255,255,0.05)', lineHeight: 1.7 }}>
                    <div style={{ fontSize: '12px', letterSpacing: '0.12em', color: '#97a0d7', marginBottom: '6px' }}>{label}</div>
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
