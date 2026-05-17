'use client'

import { useMemo, useState } from 'react'

type InputMode = 'keyword' | 'channel_url' | 'video_url'

type ReferenceRow = {
  title?: string
  channel?: string
  url?: string
  views?: number
  publishedAt?: string
}

type IdeaCard = {
  title?: string
  category?: string
  coreAngle?: string
  whyNow?: string
  audienceFit?: string
  breakoutPattern?: string
  backingInfoNeeded?: string[]
  seriesExtensions?: string[]
  references?: string[]
}

type YoutubeIdeaResponse = {
  sourceMode?: string
  sourceQuery?: string
  algrowRows?: ReferenceRow[]
  ideas?: IdeaCard[]
  savedIdeaId?: string | null
  saveStatus?: 'saved' | 'skipped' | 'failed'
  saveError?: string
  error?: string
}

const MODES: Array<{ id: InputMode; label: string; placeholder: string }> = [
  { id: 'keyword', label: '關鍵字', placeholder: '例：香港茶餐廳、AI 創業、日本樓價' },
  { id: 'channel_url', label: 'Channel URL', placeholder: '貼上 YouTube channel URL' },
  { id: 'video_url', label: 'Video URL', placeholder: '貼上 YouTube video URL' },
]

const MARKETS = ['HK', 'TW', 'JP', 'KR', 'US', 'GLOBAL']
const LANGUAGES = ['zh-HK', 'zh-TW', 'en']

function fmtNum(value?: number) {
  const n = Number(value ?? 0)
  if (!Number.isFinite(n) || n <= 0) return '-'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`
  return String(n)
}

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

function buildScriptHandoff(card: IdeaCard, query: string, references: ReferenceRow[]) {
  const topic = text(card.title) || query
  const referenceSignals = references
    .slice(0, 5)
    .map((reference, index) => {
      const line = [
        text(reference.title),
        text(reference.channel),
        reference.views ? `${fmtNum(reference.views)} views` : '',
        text(reference.publishedAt),
      ].filter(Boolean).join(' | ')
      return line ? `${index + 1}. ${line}` : ''
    })
    .filter(Boolean)

  const background = [
    query ? `原始搜尋：${query}` : '',
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

export default function HomePage() {
  const [mode, setMode] = useState<InputMode>('keyword')
  const [query, setQuery] = useState('')
  const [market, setMarket] = useState('HK')
  const [language, setLanguage] = useState('zh-HK')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<YoutubeIdeaResponse | null>(null)
  const [activeCardIndex, setActiveCardIndex] = useState(0)

  const references = useMemo(() => result?.algrowRows ?? [], [result])
  const ideas = useMemo(() => result?.ideas ?? [], [result])
  const activeCard = ideas[activeCardIndex] ?? ideas[0]

  async function handleGenerate() {
    if (!query.trim()) {
      setError('請先輸入關鍵字或 YouTube 連結。')
      return
    }

    setLoading(true)
    setError('')
    setResult(null)
    setActiveCardIndex(0)

    try {
      const res = await fetch('/api/youtube-ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, query: query.trim(), market, language }),
      })
      const data = (await res.json()) as YoutubeIdeaResponse
      if (!res.ok || data.error) {
        throw new Error(data.error || '未能生成 YouTube 題材。')
      }
      setResult(data)
      if (data.saveStatus === 'failed') {
        setError(`已生成，但未能儲存到資料庫：${data.saveError || '未知錯誤'}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '未能生成 YouTube 題材，請重試。')
    } finally {
      setLoading(false)
    }
  }

  function pushToScript(card: IdeaCard) {
    const handoff = buildScriptHandoff(card, result?.sourceQuery || query, references)
    window.parent.postMessage({
      type: 'SOON_NAVIGATE_TOOL',
      pipeline: 'youtube',
      tool: 'script',
      topic: handoff.topic,
      background: handoff.background,
    }, '*')
  }

  return (
    <main style={{ minHeight: '100vh', background: '#0a0a0f', color: '#f0f0f5', padding: '32px 28px 80px', fontFamily: 'system-ui, sans-serif' }}>
      <section style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '24px', marginBottom: '24px' }}>
        <div>
          <p style={{ margin: '0 0 6px', fontSize: '12px', letterSpacing: '0.18em', color: '#5a5a72' }}>SOON · INTERNAL</p>
          <h1 style={{ margin: 0, fontSize: '38px', lineHeight: 1.05, fontWeight: 700 }}>YouTube 題材靈感工作台</h1>
          <p style={{ margin: '8px 0 0', color: '#9090a8', fontSize: '14px' }}>
            用關鍵字、Channel 或影片連結，生成可推去劇本嘅 YouTube 題材方向。
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
          <a href="/library" style={{ textDecoration: 'none', color: '#7c5cfc', border: '1px solid #7c5cfc', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', fontWeight: 500 }}>
            影片收藏
          </a>
          <button onClick={handleGenerate} disabled={loading} style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? '分析中...' : '生成題材'}
          </button>
        </div>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: '360px minmax(0, 1fr)', gap: '20px', alignItems: 'start' }}>
        <aside style={{ background: '#16161f', border: '1px solid #2a2a3a', borderRadius: '14px', padding: '20px', position: 'sticky', top: '24px' }}>
          <p style={{ margin: '0 0 16px', color: '#9090a8', fontSize: '12px', letterSpacing: '0.12em' }}>新增搜尋</p>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            {MODES.map((item) => (
              <button
                key={item.id}
                onClick={() => setMode(item.id)}
                style={{
                  flex: 1,
                  background: mode === item.id ? '#7c5cfc' : 'transparent',
                  color: mode === item.id ? '#fff' : '#9090a8',
                  border: mode === item.id ? '1px solid #7c5cfc' : '1px solid #2a2a3a',
                  borderRadius: '8px',
                  padding: '8px',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                {item.label}
              </button>
            ))}
          </div>

          <label style={{ display: 'grid', gap: '8px', marginBottom: '14px' }}>
            <span style={{ fontSize: '12px', color: '#9090a8' }}>關鍵字 / URL</span>
            <textarea
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={MODES.find((item) => item.id === mode)?.placeholder}
              style={{ minHeight: '110px', resize: 'vertical', background: '#111118', color: '#f0f0f5', border: '1px solid #2a2a3a', borderRadius: '10px', padding: '12px', outline: 'none' }}
            />
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
            <label style={{ display: 'grid', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: '#9090a8' }}>市場</span>
              <select value={market} onChange={(event) => setMarket(event.target.value)} style={{ background: '#111118', color: '#f0f0f5', border: '1px solid #2a2a3a', borderRadius: '10px', padding: '10px' }}>
                {MARKETS.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label style={{ display: 'grid', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: '#9090a8' }}>語言</span>
              <select value={language} onChange={(event) => setLanguage(event.target.value)} style={{ background: '#111118', color: '#f0f0f5', border: '1px solid #2a2a3a', borderRadius: '10px', padding: '10px' }}>
                {LANGUAGES.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
          </div>

          <button onClick={handleGenerate} disabled={loading} style={{ width: '100%', background: '#7c5cfc', color: '#fff', border: 'none', borderRadius: '10px', padding: '12px', fontSize: '14px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? 'AI 分析題材方向中...' : '分析並儲存題材'}
          </button>

          {error && (
            <div style={{ marginTop: '12px', padding: '10px 12px', borderRadius: '8px', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.35)', color: '#fbbf24', fontSize: '12px', lineHeight: 1.6 }}>
              {error}
            </div>
          )}

          {result?.savedIdeaId && (
            <a href={`/library/${result.savedIdeaId}`} style={{ display: 'block', marginTop: '12px', color: '#10b981', fontSize: '12px', textDecoration: 'none' }}>
              已儲存到影片收藏，打開詳情 →
            </a>
          )}
        </aside>

        <section style={{ display: 'grid', gap: '18px' }}>
          {!result && !loading && (
            <section style={{ minHeight: '420px', border: '1px solid #2a2a3a', background: '#16161f', borderRadius: '14px', display: 'grid', placeItems: 'center', textAlign: 'center', padding: '32px' }}>
              <div>
                <p style={{ margin: '0 0 8px', color: '#f0f0f5', fontSize: '22px', fontWeight: 700 }}>準備生成新版 YouTube 題材</p>
                <p style={{ margin: 0, color: '#9090a8', fontSize: '14px', lineHeight: 1.8 }}>
                  左邊輸入關鍵字或 YouTube 連結後，系統會生成「話題信號」同「已選題目」。
                </p>
              </div>
            </section>
          )}

          {loading && (
            <section style={{ minHeight: '420px', border: '1px solid #2a2a3a', background: '#16161f', borderRadius: '14px', display: 'grid', placeItems: 'center', textAlign: 'center', padding: '32px' }}>
              <div style={{ display: 'grid', gap: '10px', color: '#9090a8', fontSize: '14px' }}>
                <p style={{ margin: 0 }}>AI 分析題材方向中...</p>
                <p style={{ margin: 0 }}>整理 YouTube 參考信號...</p>
              </div>
            </section>
          )}

          {result && (
            <>
              <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                <div style={{ background: '#16161f', border: '1px solid #2a2a3a', borderRadius: '12px', padding: '18px' }}>
                  <div style={{ fontSize: '28px', fontWeight: 700 }}>{references.length}</div>
                  <div style={{ color: '#9090a8', fontSize: '12px', marginTop: '6px' }}>話題信號</div>
                </div>
                <div style={{ background: '#16161f', border: '1px solid #2a2a3a', borderRadius: '12px', padding: '18px' }}>
                  <div style={{ fontSize: '28px', fontWeight: 700 }}>{ideas.length}</div>
                  <div style={{ color: '#9090a8', fontSize: '12px', marginTop: '6px' }}>已選題目</div>
                </div>
                <div style={{ background: '#16161f', border: '1px solid #2a2a3a', borderRadius: '12px', padding: '18px' }}>
                  <div style={{ fontSize: '28px', fontWeight: 700 }}>{result.saveStatus === 'saved' ? '已儲存' : '未儲存'}</div>
                  <div style={{ color: '#9090a8', fontSize: '12px', marginTop: '6px' }}>保存狀態</div>
                </div>
              </section>

              <section style={{ background: '#16161f', border: '1px solid #2a2a3a', borderRadius: '14px', padding: '20px' }}>
                <h2 style={{ margin: '0 0 14px', fontSize: '16px' }}>已選題目</h2>
                <div style={{ display: 'grid', gap: '12px' }}>
                  {ideas.map((card, index) => (
                    <article
                      key={`${card.title}-${index}`}
                      onClick={() => setActiveCardIndex(index)}
                      style={{
                        border: activeCardIndex === index ? '1px solid #7c5cfc' : '1px solid #2a2a3a',
                        background: activeCardIndex === index ? 'rgba(124,92,252,0.12)' : '#111118',
                        borderRadius: '12px',
                        padding: '16px',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start' }}>
                        <div>
                          <span style={{ display: 'inline-flex', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.5)', borderRadius: '999px', padding: '3px 8px', fontSize: '11px', marginBottom: '8px' }}>
                            {categoryLabel(card.category)}
                          </span>
                          <h3 style={{ margin: 0, fontSize: '20px', lineHeight: 1.3 }}>{card.title}</h3>
                        </div>
                        <button onClick={(event) => { event.stopPropagation(); pushToScript(card) }} style={{ background: '#f59e0b', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 12px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                          推上劇本生成
                        </button>
                      </div>
                      <p style={{ margin: '10px 0 0', color: '#9090a8', lineHeight: 1.7, fontSize: '13px' }}>{card.coreAngle}</p>
                    </article>
                  ))}
                </div>
              </section>

              {activeCard && (
                <section style={{ background: '#16161f', border: '1px solid #2a2a3a', borderRadius: '14px', padding: '20px' }}>
                  <h2 style={{ margin: '0 0 14px', fontSize: '16px' }}>題材詳情</h2>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px' }}>
                    {[
                      ['為何現在值得做', activeCard.whyNow],
                      ['適合觀眾', activeCard.audienceFit],
                      ['爆款模式', activeCard.breakoutPattern],
                      ['需要補資料', joinList(activeCard.backingInfoNeeded)],
                      ['延伸系列', joinList(activeCard.seriesExtensions)],
                      ['參考影片', joinList(activeCard.references)],
                    ].map(([label, value]) => (
                      <div key={label} style={{ background: '#111118', border: '1px solid #2a2a3a', borderRadius: '10px', padding: '14px', minHeight: '92px' }}>
                        <div style={{ color: '#5a5a72', fontSize: '11px', letterSpacing: '0.12em', marginBottom: '8px' }}>{label}</div>
                        <div style={{ color: '#f0f0f5', fontSize: '13px', lineHeight: 1.7 }}>{value || '-'}</div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <section style={{ background: '#16161f', border: '1px solid #2a2a3a', borderRadius: '14px', padding: '20px' }}>
                <h2 style={{ margin: '0 0 14px', fontSize: '16px' }}>話題信號</h2>
                <div style={{ display: 'grid', gap: '10px' }}>
                  {references.map((reference, index) => (
                    <a
                      key={`${reference.title}-${index}`}
                      href={reference.url || '#'}
                      target="_blank"
                      rel="noreferrer"
                      style={{ textDecoration: 'none', color: '#f0f0f5', background: '#111118', border: '1px solid #2a2a3a', borderRadius: '10px', padding: '14px', display: 'grid', gap: '6px' }}
                    >
                      <div style={{ fontSize: '14px', fontWeight: 600 }}>{reference.title || '未命名影片'}</div>
                      <div style={{ color: '#9090a8', fontSize: '12px' }}>
                        {[reference.channel, fmtNum(reference.views), reference.publishedAt].filter(Boolean).join(' · ')}
                      </div>
                    </a>
                  ))}
                </div>
              </section>
            </>
          )}
        </section>
      </section>
    </main>
  )
}
