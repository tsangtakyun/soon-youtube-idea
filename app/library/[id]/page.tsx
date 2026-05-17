import Link from 'next/link'
import { notFound } from 'next/navigation'

import { getSavedYoutubeIdeaById } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

type PageParams = { id: string }

function text(value: unknown) {
  if (value === null || value === undefined) return ''
  return String(value).trim()
}

function joinList(value: unknown) {
  return Array.isArray(value) ? value.map((item) => text(item)).filter(Boolean).join(' / ') : ''
}

function categoryLabel(category?: string) {
  const map: Record<string, string> = {
    breaking: '即時熱點',
    culture: '文化觀察',
    rich: '高端/階層',
    poor: '平民/反差',
    evergreen: '長青題材',
  }
  return category ? map[category] ?? category : '題材方向'
}

function buildHandoff(card: Record<string, unknown>, inputQuery: string, references: Array<Record<string, unknown>>) {
  const topic = text(card.title) || inputQuery
  const referenceSignals = references
    .slice(0, 5)
    .map((reference, index) => {
      const line = [
        text(reference.title),
        text(reference.channel),
        text(reference.views) ? `${text(reference.views)} views` : '',
        text(reference.publishedAt),
      ].filter(Boolean).join(' | ')
      return line ? `${index + 1}. ${line}` : ''
    })
    .filter(Boolean)

  const background = [
    inputQuery ? `原始搜尋：${inputQuery}` : '',
    text(card.coreAngle) ? `核心角度：${text(card.coreAngle)}` : '',
    text(card.whyNow) ? `為何現在值得做：${text(card.whyNow)}` : '',
    text(card.audienceFit) ? `適合觀眾：${text(card.audienceFit)}` : '',
    text(card.breakoutPattern) ? `爆款模式：${text(card.breakoutPattern)}` : '',
    joinList(card.backingInfoNeeded) ? `需要補資料：${joinList(card.backingInfoNeeded)}` : '',
    joinList(card.seriesExtensions) ? `延伸系列：${joinList(card.seriesExtensions)}` : '',
    referenceSignals.length ? `參考信號：\n${referenceSignals.join('\n')}` : '',
  ].filter(Boolean).join('\n\n')

  return { topic, background }
}

function handoffHref(card: Record<string, unknown>, inputQuery: string, references: Array<Record<string, unknown>>) {
  const handoff = buildHandoff(card, inputQuery, references)
  const params = new URLSearchParams({
    creator_mode: '1',
    topic: handoff.topic,
    background: handoff.background,
  })
  return `https://script-generator-youtube.vercel.app?${params.toString()}`
}

export default async function SavedIdeaDetailPage({
  params,
}: {
  params: Promise<PageParams>
}) {
  const { id } = await params
  const { row } = await getSavedYoutubeIdeaById(id)

  if (!row) {
    notFound()
  }

  const ideaCards = Array.isArray(row.ai_cards) ? row.ai_cards : []
  const references = Array.isArray(row.reference_data) ? row.reference_data : []

  return (
    <main style={{ minHeight: '100vh', background: '#0a0a0f', color: '#f0f0f5', padding: '32px 28px 80px', fontFamily: 'system-ui, sans-serif' }}>
      <section style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '20px', marginBottom: '24px' }}>
        <div>
          <p style={{ margin: '0 0 6px', fontSize: '12px', letterSpacing: '0.18em', color: '#5a5a72' }}>IDEA DETAIL</p>
          <h1 style={{ margin: 0, fontSize: '34px', lineHeight: 1.12 }}>{row.input_query}</h1>
          <p style={{ margin: '8px 0 0', color: '#9090a8', fontSize: '14px' }}>
            {references.length} 個話題信號 · {ideaCards.length} 個已選題目
          </p>
        </div>
        <Link href="/library" style={{ color: '#7c5cfc', border: '1px solid #7c5cfc', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', textDecoration: 'none', fontWeight: 600 }}>
          返回影片收藏
        </Link>
      </section>

      <section style={{ display: 'grid', gap: '16px' }}>
        <section style={{ background: '#16161f', border: '1px solid #2a2a3a', borderRadius: '14px', padding: '20px' }}>
          <h2 style={{ margin: '0 0 14px', fontSize: '16px' }}>話題信號</h2>
          <div style={{ display: 'grid', gap: '10px' }}>
            {references.map((reference, index) => (
              <a
                key={`${text(reference.title)}-${index}`}
                href={text(reference.url) || '#'}
                target="_blank"
                rel="noreferrer"
                style={{ textDecoration: 'none', color: '#f0f0f5', background: '#111118', border: '1px solid #2a2a3a', borderRadius: '10px', padding: '14px' }}
              >
                <div style={{ fontSize: '14px', fontWeight: 600 }}>{text(reference.title) || '未命名影片'}</div>
                <div style={{ color: '#9090a8', fontSize: '12px', marginTop: '6px' }}>
                  {[text(reference.channel), text(reference.views) ? `${text(reference.views)} views` : '', text(reference.publishedAt)].filter(Boolean).join(' · ')}
                </div>
              </a>
            ))}
          </div>
        </section>

        {ideaCards.map((card, index) => (
          <section key={`${text(card.title)}-${index}`} style={{ background: '#16161f', border: '1px solid #2a2a3a', borderRadius: '14px', padding: '20px', display: 'grid', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '18px', alignItems: 'flex-start' }}>
              <div>
                <span style={{ display: 'inline-flex', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.5)', borderRadius: '999px', padding: '3px 8px', fontSize: '11px', marginBottom: '8px' }}>
                  {categoryLabel(text(card.category))}
                </span>
                <h2 style={{ margin: 0, fontSize: '24px', lineHeight: 1.25 }}>{text(card.title)}</h2>
              </div>
              <a href={handoffHref(card, row.input_query, references)} target="_blank" rel="noreferrer" style={{ color: '#fff', background: '#f59e0b', borderRadius: '8px', padding: '8px 14px', textDecoration: 'none', fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                推上劇本生成
              </a>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px' }}>
              {([
                ['核心角度', card.coreAngle],
                ['為何現在值得做', card.whyNow],
                ['適合觀眾', card.audienceFit],
                ['爆款模式', card.breakoutPattern],
                ['需要補資料', joinList(card.backingInfoNeeded)],
                ['延伸系列', joinList(card.seriesExtensions)],
              ] as Array<[string, unknown]>).map(([label, value]) => (
                <div key={label} style={{ background: '#111118', border: '1px solid #2a2a3a', borderRadius: '10px', padding: '14px', minHeight: '92px' }}>
                  <div style={{ color: '#5a5a72', fontSize: '11px', letterSpacing: '0.12em', marginBottom: '8px' }}>{label}</div>
                  <div style={{ color: '#f0f0f5', fontSize: '13px', lineHeight: 1.7 }}>{text(value) || '-'}</div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </section>
    </main>
  )
}
