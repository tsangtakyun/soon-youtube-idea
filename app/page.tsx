'use client'
import { useMemo, useState, useTransition } from 'react'

type InputMode = 'keyword' | 'channel_url' | 'video_url'

type TopicCategory = 'breaking' | 'culture' | 'rich' | 'poor' | 'evergreen'

const CATEGORY_META: Record<TopicCategory, { emoji: string; label: string; color: string }> = {
  breaking: { emoji: '🔴', label: 'Breaking', color: '#7d1f1f' },
  culture: { emoji: '🟡', label: 'Culture', color: '#7d6b1f' },
  rich: { emoji: '🟠', label: 'Rich', color: '#7d4a1f' },
  poor: { emoji: '🟤', label: 'Poor', color: '#5c3d1f' },
  evergreen: { emoji: '⚪', label: 'Evergreen', color: '#5b5348' },
}

type IdeaCard = {
  title: string
  category: TopicCategory
  coreAngle: string
  whyNow: string
  audienceFit: string
  breakoutPattern: string
  backingInfoNeeded: string[]
  seriesExtensions: string[]
  references: string[]
}

type YoutubeIdeaResult = {
  ideas: IdeaCard[]
  algrowRows: Array<Record<string, unknown>>
  savedIdeaId: string | null
  saveStatus: 'saved' | 'skipped' | 'failed'
  saveError: string
}

const PRESET_TOPICS: Array<{ label: string; query: string; category: TopicCategory }> = [
  { label: '🏯 East Asia', query: 'China Japan Korea culture society analysis viral', category: 'culture' },
  { label: '🌴 Southeast Asia', query: 'Southeast Asia Indonesia Thailand Philippines Vietnam society culture', category: 'poor' },
  { label: '💎 Rich Asia', query: 'Asia luxury wealth rich lifestyle society inequality', category: 'rich' },
  { label: '🏚️ Poor Asia', query: 'Asia poverty survival developing country real life', category: 'poor' },
  { label: '🌿 Evergreen', query: 'Asia culture explained insider analysis deep dive', category: 'evergreen' },
]

const DEFAULT_WATCHLIST = [
  { name: 'Wonny', url: 'https://www.youtube.com/channel/UCjz8uBTLs0f7Fnlxc5nzT5g', subs: '145K' },
  { name: 'Dumanity', url: 'https://www.youtube.com/channel/UCLzrP1E-I3kILtq437gdLpA', subs: '113K' },
  { name: 'Dr. Jonathan Tam', url: 'https://www.youtube.com/channel/UCcc_LE8kzIzcloTVAttch5w', subs: '24.9K' },
  { name: 'klaize', url: 'https://www.youtube.com/channel/UC_s-lNUAIWateazelbIX60Q', subs: '58.6K' },
  { name: 'aini', url: 'https://www.youtube.com/channel/UCxxw51w9d_utTp0VNyyG9IA', subs: '329K' },
  { name: 'Cinthia Lin', url: 'https://www.youtube.com/channel/UCAFdoddRINpwc_oHPk5fQig', subs: '44.9K' },
]

const modeOptions: Array<{ value: InputMode; label: string; hint: string }> = [
  { value: 'keyword', label: '關鍵字', hint: '例如：Asia Gen Z refusing work、Hong Kong identity' },
  { value: 'channel_url', label: '頻道 URL', hint: '由成功頻道倒推可複製的題材方向' },
  { value: 'video_url', label: '影片 URL', hint: '由單條爆款影片拆解模式，再延伸出 5 個題材' },
]

export default function HomePage() {
  const [mode, setMode] = useState<InputMode>('keyword')
  const [query, setQuery] = useState('')
  const [language, setLanguage] = useState('en')
  const [market, setMarket] = useState('Global')
  const [error, setError] = useState('')
  const [result, setResult] = useState<YoutubeIdeaResult | null>(null)
  const [isPending, startTransition] = useTransition()

  // Watchlist state
  const [watchlist, setWatchlist] = useState(DEFAULT_WATCHLIST)
  const [newChannelName, setNewChannelName] = useState('')
  const [newChannelUrl, setNewChannelUrl] = useState('')
  const [showAddChannel, setShowAddChannel] = useState(false)

  const modeHint = useMemo(
    () => modeOptions.find((item) => item.value === mode)?.hint ?? '',
    [mode]
  )

  function handlePreset(preset: typeof PRESET_TOPICS[0]) {
    setMode('keyword')
    setQuery(preset.query)
    setMarket('Global')
  }

  function handleAddChannel() {
    if (!newChannelName.trim() || !newChannelUrl.trim()) return
    setWatchlist((prev) => [...prev, { name: newChannelName.trim(), url: newChannelUrl.trim(), subs: '—' }])
    setNewChannelName('')
    setNewChannelUrl('')
    setShowAddChannel(false)
  }

  function handleRemoveChannel(index: number) {
    setWatchlist((prev) => prev.filter((_, i) => i !== index))
  }

  function handleGenerate() {
    setError('')
    if (!query.trim()) {
      setError('請先填入關鍵字、頻道 URL 或影片 URL。')
      return
    }
    startTransition(async () => {
      try {
        const response = await fetch('/api/youtube-ideas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode, query, language, market }),
        })
        const data = await response.json()
        if (!response.ok) {
          throw new Error(data.error || '未能生成 YouTube 題材卡。')
        }
        setResult(data)
      } catch (requestError) {
        setResult(null)
        setError(
          requestError instanceof Error ? requestError.message : '未能生成 YouTube 題材卡。'
        )
      }
    })
  }

  return (
    <main style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #f6f1e8 0%, #ece3d6 100%)', padding: '42px 24px 90px', color: '#1a1a18' }}>
      <div style={{ maxWidth: '1180px', margin: '0 auto', display: 'grid', gap: '20px' }}>

        {/* Header */}
        <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.08fr) 0.92fr', gap: '20px' }}>
          <section style={{ padding: '30px', borderRadius: '28px', background: 'rgba(255,255,255,0.78)', border: '1px solid rgba(26,26,24,0.10)' }}>
            <p style={{ margin: '0 0 8px', fontSize: '12px', letterSpacing: '0.18em', color: '#8b7c69' }}>SOON · THE INSIDER'S ASIA</p>
            <h1 style={{ margin: '0 0 12px', fontSize: '56px', lineHeight: 0.98, fontWeight: 500 }}>Idea Radar</h1>
            <p style={{ margin: '0 0 18px', fontSize: '18px', lineHeight: 1.7, color: '#5b5348', maxWidth: '760px' }}>
              由香港出發，用英文解釋亞洲嘅荒誕、矛盾、同真實。唔係旅行，係理解。
            </p>

            {/* Topic Presets */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', letterSpacing: '0.14em', color: '#8b7c69', marginBottom: '10px' }}>TOPIC PRESETS</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {PRESET_TOPICS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => handlePreset(preset)}
                    style={{
                      borderRadius: '999px',
                      border: '1px solid rgba(26,26,24,0.15)',
                      background: query === preset.query ? '#1a1a18' : '#fff',
                      color: query === preset.query ? '#f5efe5' : '#1a1a18',
                      padding: '10px 16px',
                      cursor: 'pointer',
                      fontSize: '14px',
                    }}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Mode */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {modeOptions.map((option) => {
                const selected = mode === option.value
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setMode(option.value)}
                    style={{
                      borderRadius: '999px',
                      border: selected ? '1px solid #1a1a18' : '1px solid rgba(26,26,24,0.12)',
                      background: selected ? '#1a1a18' : 'rgba(255,255,255,0.6)',
                      color: selected ? '#f5efe5' : '#1a1a18',
                      padding: '10px 14px',
                      cursor: 'pointer',
                      fontSize: '13px',
                    }}
                  >
                    {option.label}
                  </button>
                )
              })}
            </div>
          </section>

          {/* Watchlist */}
          <section style={{ padding: '26px', borderRadius: '28px', background: '#1d1d1b', color: '#f5f0e6' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ fontSize: '12px', letterSpacing: '0.14em', color: '#b8b0a2' }}>WATCHLIST · REFERENCE CHANNELS</div>
              <button
                type="button"
                onClick={() => setShowAddChannel((v) => !v)}
                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#f5f0e6', borderRadius: '999px', padding: '6px 12px', cursor: 'pointer', fontSize: '12px' }}
              >
                {showAddChannel ? '✕ 取消' : '+ 新增'}
              </button>
            </div>

            {showAddChannel && (
              <div style={{ display: 'grid', gap: '8px', marginBottom: '14px', padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.06)' }}>
                <input
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                  placeholder="Channel 名稱"
                  style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.08)', color: '#f5f0e6', fontSize: '13px' }}
                />
                <input
                  value={newChannelUrl}
                  onChange={(e) => setNewChannelUrl(e.target.value)}
                  placeholder="YouTube Channel URL"
                  style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.08)', color: '#f5f0e6', fontSize: '13px' }}
                />
                <button
                  type="button"
                  onClick={handleAddChannel}
                  style={{ padding: '8px 12px', borderRadius: '8px', background: '#f5efe5', color: '#1a1a18', border: 'none', cursor: 'pointer', fontSize: '13px' }}
                >
                  確認新增
                </button>
              </div>
            )}

            <div style={{ display: 'grid', gap: '8px' }}>
              {watchlist.map((ch, index) => (
                <div
                  key={`${ch.name}-${index}`}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '12px', background: 'rgba(255,255,255,0.06)' }}
                >
                  <a href={ch.url} target="_blank" rel="noreferrer" style={{ color: '#f5f0e6', textDecoration: 'none', fontSize: '14px', flex: 1 }}>
                    {ch.name}
                    <span style={{ color: '#b8b0a2', marginLeft: '8px', fontSize: '12px' }}>{ch.subs}</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => handleRemoveChannel(index)}
                    style={{ background: 'none', border: 'none', color: '#b8b0a2', cursor: 'pointer', fontSize: '16px', padding: '0 0 0 8px' }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </section>
        </section>

        {/* Input + Reference */}
        <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 0.94fr) 1.06fr', gap: '20px', alignItems: 'start' }}>
          <section style={{ padding: '24px', borderRadius: '24px', background: 'rgba(255,255,255,0.82)', border: '1px solid rgba(26,26,24,0.10)', display: 'grid', gap: '14px' }}>
            <div style={{ fontSize: '12px', letterSpacing: '0.16em', color: '#8b7c69' }}>INPUT</div>
            <label style={{ display: 'grid', gap: '8px' }}>
              <div style={{ fontSize: '15px', color: '#5b5348' }}>
                {mode === 'keyword' ? '關鍵字' : mode === 'channel_url' ? '頻道 URL' : '影片 URL'}
              </div>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={modeHint}
                style={{ width: '100%', padding: '14px 16px', borderRadius: '16px', border: '1px solid rgba(26,26,24,0.14)', background: '#fff', boxSizing: 'border-box' }}
              />
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <label style={{ display: 'grid', gap: '8px' }}>
                <div style={{ fontSize: '15px', color: '#5b5348' }}>語言</div>
                <select
                  value={language}
                  onChange={(event) => setLanguage(event.target.value)}
                  style={{ width: '100%', padding: '14px 16px', borderRadius: '16px', border: '1px solid rgba(26,26,24,0.14)', background: '#fff' }}
                >
                  <option value="en">English</option>
                  <option value="zh-HK">繁中 / 廣東話</option>
                  <option value="zh-TW">繁中 / 台灣</option>
                </select>
              </label>
              <label style={{ display: 'grid', gap: '8px' }}>
                <div style={{ fontSize: '15px', color: '#5b5348' }}>市場</div>
                <select
                  value={market}
                  onChange={(event) => setMarket(event.target.value)}
                  style={{ width: '100%', padding: '14px 16px', borderRadius: '16px', border: '1px solid rgba(26,26,24,0.14)', background: '#fff' }}
                >
                  <option value="Global">Global (English)</option>
                  <option value="Southeast Asia">Southeast Asia</option>
                  <option value="East Asia">East Asia</option>
                  <option value="Hong Kong">Hong Kong</option>
                  <option value="Taiwan">Taiwan</option>
                </select>
              </label>
            </div>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isPending || !query.trim()}
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '999px', background: '#1a1a18', color: '#f5efe5', padding: '14px 18px', border: 'none', cursor: 'pointer', width: 'fit-content', opacity: isPending || !query.trim() ? 0.72 : 1 }}
            >
              {isPending ? 'AI 生成中...' : '生成 5 張 Idea Cards'}
            </button>
            {error && (
              <div style={{ padding: '14px 16px', borderRadius: '16px', background: '#fbf1ef', color: '#7d493f', lineHeight: 1.7 }}>{error}</div>
            )}
          </section>

          <section style={{ display: 'grid', gap: '16px' }}>
            <section style={{ padding: '24px', borderRadius: '24px', background: 'rgba(255,255,255,0.82)', border: '1px solid rgba(26,26,24,0.10)' }}>
              <div style={{ fontSize: '12px', letterSpacing: '0.16em', color: '#8b7c69', marginBottom: '8px' }}>REFERENCE SIGNALS</div>
              {result?.algrowRows?.length ? (
                <div style={{ display: 'grid', gap: '12px' }}>
                  {result.algrowRows.map((row, index) => {
                    const views = Number(row.views ?? 0)
                    const subs = Number(row.subs ?? row.subscriber_count ?? 0)
                    const outlierRatio = subs > 0 ? (views / subs).toFixed(1) : null
                    return (
                      <div key={`${String(row.title)}-${index}`} style={{ padding: '14px 16px', borderRadius: '16px', background: '#fbf8f1' }}>
                        <div style={{ fontSize: '16px', lineHeight: 1.4 }}>{String(row.title ?? '')}</div>
                        <div style={{ color: '#7b6d57', lineHeight: 1.7, fontSize: '13px', marginTop: '4px' }}>
                          {String(row.channel ?? '')} · {views.toLocaleString()} views
                          {outlierRatio && (
                            <span style={{ marginLeft: '8px', background: '#1a1a18', color: '#f5efe5', borderRadius: '999px', padding: '2px 8px', fontSize: '11px' }}>
                              {outlierRatio}× outlier
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div style={{ color: '#7b6d57', lineHeight: 1.7 }}>生成後，這裡會顯示 reference 數據同 Outlier Ratio。</div>
              )}
            </section>

            {result && (
              <section style={{ padding: '24px', borderRadius: '24px', background: 'rgba(255,255,255,0.82)', border: '1px solid rgba(26,26,24,0.10)' }}>
                <div style={{ fontSize: '12px', letterSpacing: '0.16em', color: '#8b7c69', marginBottom: '8px' }}>STATUS</div>
                <div style={{ padding: '14px 16px', borderRadius: '16px', background: result.saveStatus === 'saved' ? '#edf6ea' : '#f7f1e5', color: result.saveStatus === 'saved' ? '#42623f' : '#7b6d57', lineHeight: 1.7 }}>
                  {result.saveStatus === 'saved' ? `✓ 已儲存 · ${result.savedIdeaId ?? ''}` : result.saveStatus === 'failed' ? `未能入庫：${result.saveError}` : '生成完成，未設定 Supabase。'}
                </div>
              </section>
            )}
          </section>
        </section>

        {/* Idea Cards */}
        <section style={{ display: 'grid', gap: '16px' }}>
          {(result?.ideas ?? []).map((idea, index) => {
            const cat = CATEGORY_META[idea.category] ?? CATEGORY_META.evergreen
            return (
              <section
                key={`${idea.title}-${index}`}
                style={{ padding: '24px', borderRadius: '24px', background: 'rgba(255,255,255,0.82)', border: '1px solid rgba(26,26,24,0.10)', display: 'grid', gap: '14px' }}
              >
                <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', gap: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <div style={{ fontSize: '12px', letterSpacing: '0.16em', color: '#8b7c69' }}>IDEA {index + 1}</div>
                      <span style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '999px', background: '#f0ebe2', color: cat.color, border: `1px solid ${cat.color}40` }}>
                        {cat.emoji} {cat.label}
                      </span>
                    </div>
                    <div style={{ fontSize: '32px', lineHeight: 1.1 }}>{idea.title}</div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                  {[
                    ['核心角度', idea.coreAngle],
                    ['切入原因', idea.whyNow],
                    ['受眾適配', idea.audienceFit],
                    ['爆款模式', idea.breakoutPattern],
                    ['需補充資料', idea.backingInfoNeeded.join(' / ')],
                    ['延伸系列', idea.seriesExtensions.join(' / ')],
                  ].map(([label, value]) => (
                    <div key={label} style={{ padding: '14px 16px', borderRadius: '16px', background: '#fbf8f1', lineHeight: 1.7 }}>
                      <div style={{ fontSize: '12px', letterSpacing: '0.12em', color: '#8b7c69', marginBottom: '6px' }}>{label}</div>
                      <div style={{ fontSize: '14px' }}>{value}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {idea.references?.map((url) => (
                    <a key={url} href={url} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', borderRadius: '999px', background: '#1a1a18', color: '#f5efe5', padding: '10px 14px', textDecoration: 'none', fontSize: '13px' }}>
                      參考影片 ↗
                    </a>
                  ))}
                  
                    href="https://script-generator-xi.vercel.app"
                    target="_blank"
                    rel="noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center', borderRadius: '999px', background: '#efe7da', color: '#1a1a18', padding: '10px 14px', textDecoration: 'none', border: '1px solid rgba(26,26,24,0.12)', fontSize: '13px' }}
                  >
                    → Script Generator
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      const brief = [
                        `題材：${idea.title}`,
                        `分類：${cat.emoji} ${cat.label}`,
                        `核心角度：${idea.coreAngle}`,
                        `切入原因：${idea.whyNow}`,
                        `受眾適配：${idea.audienceFit}`,
                        `爆款模式：${idea.breakoutPattern}`,
                        `需補充資料：${idea.backingInfoNeeded.join(' / ')}`,
                        `延伸系列：${idea.seriesExtensions.join(' / ')}`,
                      ].join('\n')
                      navigator.clipboard.writeText(brief)
                    }}
                    style={{ display: 'inline-flex', alignItems: 'center', borderRadius: '999px', background: '#fff', color: '#1a1a18', padding: '10px 14px', border: '1px solid rgba(26,26,24,0.12)', cursor: 'pointer', fontSize: '13px' }}
                  >
                    複製摘要
                  </button>
                </div>
              </section>
            )
          })}
        </section>

      </div>
    </main>
  )
}
