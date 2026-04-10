'use client'

import { useMemo, useState, useTransition } from 'react'

type InputMode = 'keyword' | 'channel_url' | 'video_url'

type TopicCategory = 'breaking' | 'culture' | 'rich' | 'poor' | 'evergreen'

const CATEGORY_META: Record<TopicCategory, { emoji: string; label: string; color: string }> = {
  breaking: { emoji: '🔴', label: 'Breaking', color: '#ff7c66' },
  culture: { emoji: '🟡', label: 'Culture', color: '#f1d266' },
  rich: { emoji: '🟠', label: 'Rich', color: '#ffaf66' },
  poor: { emoji: '🟤', label: 'Poor', color: '#d6a17b' },
  evergreen: { emoji: '⚪', label: 'Evergreen', color: '#d9def6' },
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
  { value: 'keyword', label: '關鍵字', hint: '例如：香港身份認同、Gen Z 不想返工、東南亞中產消費' },
  { value: 'channel_url', label: '頻道 URL', hint: '由成功頻道倒推可以複製的題材方向' },
  { value: 'video_url', label: '影片 URL', hint: '由一條爆款片拆解模式，再延伸成新的題材卡' },
]

const PAGE_CSS = `
:root {
  --bg: #1d2037;
  --panel: #262a46;
  --panel-strong: #20233d;
  --panel-soft: rgba(255,255,255,0.05);
  --line: rgba(255,255,255,0.08);
  --text: #eef1ff;
  --text2: #c3caee;
  --text3: #97a0d7;
  --primary: linear-gradient(135deg, #7d6bff 0%, #5f89ff 100%);
}

* { box-sizing: border-box; }

.workspace-shell {
  display: grid;
  grid-template-columns: 306px minmax(0, 1fr);
  gap: 18px;
  min-height: calc(100vh - 96px);
}

.sidebar {
  position: sticky;
  top: 86px;
  align-self: start;
  background: rgba(35, 39, 66, 0.96);
  border: 1px solid var(--line);
  border-radius: 28px;
  padding: 18px;
  display: grid;
  gap: 14px;
  box-shadow: 0 20px 40px rgba(6, 9, 20, 0.24);
}

.workspace-chip {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  border-radius: 20px;
  border: 1px solid var(--line);
  background: rgba(255,255,255,0.04);
  color: var(--text);
  padding: 14px 16px;
  font-size: 14px;
  font-weight: 700;
}

.workspace-chip-logo {
  width: 12px;
  height: 12px;
  border-radius: 999px;
  background: linear-gradient(135deg, #7d6bff 0%, #5f89ff 100%);
  box-shadow: 0 0 0 6px rgba(125,107,255,0.12);
}

.sidebar-sub {
  color: var(--text3);
  font-size: 12px;
  line-height: 1.6;
  margin-top: 6px;
}

.sidebar-section-title {
  font-size: 11px;
  letter-spacing: 0.14em;
  color: var(--text3);
  text-transform: uppercase;
}

.step-block {
  display: grid;
  gap: 10px;
  padding: 14px;
  border-radius: 20px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.04);
}

.step-num {
  font-size: 12px;
  letter-spacing: 0.14em;
  color: var(--text3);
}

.step-label {
  font-size: 20px;
  font-weight: 700;
  color: var(--text);
}

.field,
.select {
  width: 100%;
  border-radius: 16px;
  border: 1px solid var(--line);
  background: rgba(255,255,255,0.06);
  color: var(--text);
  padding: 13px 14px;
  font-size: 14px;
  outline: none;
}

.field::placeholder {
  color: rgba(203, 210, 242, 0.5);
}

.hint {
  color: var(--text3);
  font-size: 12px;
  line-height: 1.6;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chip {
  border-radius: 999px;
  border: 1px solid var(--line);
  background: rgba(255,255,255,0.04);
  color: var(--text2);
  padding: 10px 14px;
  font-size: 13px;
  cursor: pointer;
}

.chip.sel {
  background: var(--primary);
  color: #fff;
  border-color: transparent;
}

.watch-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  border-radius: 14px;
  background: rgba(255,255,255,0.05);
  padding: 10px 12px;
}

.watch-link {
  color: var(--text);
  text-decoration: none;
  font-size: 14px;
  flex: 1;
}

.watch-meta {
  color: var(--text3);
  font-size: 12px;
  margin-left: 8px;
}

.ghost-btn,
.delete-btn,
.submit-btn,
.small-link,
.copy-btn {
  border: none;
  cursor: pointer;
}

.ghost-btn {
  border-radius: 999px;
  border: 1px solid var(--line);
  background: rgba(255,255,255,0.05);
  color: var(--text);
  padding: 10px 14px;
  font-size: 13px;
}

.delete-btn {
  background: none;
  color: var(--text3);
  padding: 0 0 0 8px;
  font-size: 16px;
}

.submit-btn {
  border-radius: 18px;
  background: var(--primary);
  color: #fff;
  padding: 15px 18px;
  font-size: 15px;
  font-weight: 700;
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.status-box,
.error-box {
  border-radius: 16px;
  padding: 12px 14px;
  font-size: 13px;
  line-height: 1.7;
}

.status-box {
  background: rgba(255,255,255,0.05);
  color: var(--text2);
}

.error-box {
  background: rgba(200,86,86,0.14);
  color: #ffb3b3;
}

.main-panel {
  display: grid;
  gap: 18px;
}

.workspace-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  gap: 18px;
}

.brand-label {
  color: var(--text3);
  font-size: 12px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  margin-bottom: 8px;
}

.page-title {
  margin: 0;
  font-size: 54px;
  line-height: 0.98;
  letter-spacing: -0.03em;
}

.header-meta {
  margin-top: 10px;
  color: var(--text2);
  font-size: 16px;
  line-height: 1.7;
  max-width: 760px;
}

.header-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.header-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  padding: 12px 16px;
  text-decoration: none;
  font-size: 14px;
  border: 1px solid var(--line);
}

.header-btn.primary {
  background: var(--primary);
  border-color: transparent;
  color: #fff;
}

.header-btn.secondary {
  background: rgba(255,255,255,0.05);
  color: var(--text);
}

.hero-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) 340px;
  gap: 18px;
}

.hero-card,
.metric-card,
.board-card,
.idea-card,
.empty-card {
  background: rgba(38,42,70,0.96);
  border: 1px solid var(--line);
  border-radius: 28px;
  box-shadow: 0 20px 40px rgba(6, 9, 20, 0.22);
}

.hero-card {
  padding: 26px;
  display: grid;
  gap: 14px;
}

.hero-eyebrow,
.card-eyebrow {
  color: var(--text3);
  font-size: 12px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.hero-headline {
  font-size: 42px;
  line-height: 1.04;
  font-weight: 700;
  letter-spacing: -0.03em;
}

.hero-copy {
  color: var(--text2);
  font-size: 16px;
  line-height: 1.75;
  max-width: 760px;
}

.metric-stack {
  display: grid;
  gap: 12px;
}

.metric-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.metric-card {
  padding: 18px;
}

.metric-number {
  font-size: 32px;
  font-weight: 700;
  letter-spacing: -0.03em;
}

.metric-label {
  margin-top: 8px;
  color: var(--text3);
  font-size: 12px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.metric-copy {
  margin-top: 8px;
  color: var(--text2);
  font-size: 13px;
  line-height: 1.6;
}

.board-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) 360px;
  gap: 18px;
}

.board-card {
  padding: 22px;
}

.board-list {
  display: grid;
  gap: 12px;
}

.ref-row {
  padding: 14px 16px;
  border-radius: 16px;
  background: rgba(255,255,255,0.05);
  display: grid;
  gap: 6px;
}

.ref-title {
  font-size: 15px;
  line-height: 1.45;
}

.ref-meta {
  color: var(--text2);
  font-size: 13px;
  line-height: 1.6;
}

.tag {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 3px 10px;
  font-size: 11px;
  border: 1px solid var(--line);
  background: rgba(255,255,255,0.04);
  color: var(--text2);
}

.idea-list {
  display: grid;
  gap: 16px;
}

.idea-card {
  padding: 22px;
  display: grid;
  gap: 16px;
}

.idea-top {
  display: flex;
  justify-content: space-between;
  align-items: start;
  gap: 14px;
}

.idea-title {
  margin-top: 8px;
  font-size: 30px;
  line-height: 1.12;
  letter-spacing: -0.02em;
}

.idea-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.info-box {
  padding: 14px 16px;
  border-radius: 16px;
  background: rgba(255,255,255,0.05);
}

.info-label {
  color: var(--text3);
  font-size: 12px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  margin-bottom: 6px;
}

.info-copy {
  color: var(--text);
  font-size: 14px;
  line-height: 1.7;
}

.idea-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.small-link,
.copy-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  padding: 10px 14px;
  font-size: 13px;
  text-decoration: none;
}

.small-link {
  background: rgba(255,255,255,0.05);
  color: var(--text);
  border: 1px solid var(--line);
}

.small-link.primary {
  background: var(--primary);
  color: #fff;
  border: none;
}

.copy-btn {
  background: rgba(255,255,255,0.05);
  color: var(--text);
  border: 1px solid var(--line);
}

.empty-card {
  padding: 28px;
  color: var(--text2);
  line-height: 1.8;
}

@media (max-width: 1100px) {
  .workspace-shell,
  .hero-grid,
  .board-grid {
    grid-template-columns: 1fr;
  }

  .sidebar {
    position: static;
  }
}

@media (max-width: 760px) {
  .page-title { font-size: 38px; }
  .hero-headline { font-size: 30px; }
  .idea-grid,
  .metric-grid {
    grid-template-columns: 1fr;
  }
}
`

function fmtCompact(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${Math.round(value / 1_000)}K`
  return String(value)
}

export default function HomePage() {
  const [mode, setMode] = useState<InputMode>('keyword')
  const [query, setQuery] = useState('')
  const [language, setLanguage] = useState('zh-HK')
  const [market, setMarket] = useState('Global')
  const [error, setError] = useState('')
  const [result, setResult] = useState<YoutubeIdeaResult | null>(null)
  const [isPending, startTransition] = useTransition()
  const [watchlist, setWatchlist] = useState(DEFAULT_WATCHLIST)
  const [newChannelName, setNewChannelName] = useState('')
  const [newChannelUrl, setNewChannelUrl] = useState('')
  const [showAddChannel, setShowAddChannel] = useState(false)

  const modeHint = useMemo(
    () => modeOptions.find((item) => item.value === mode)?.hint ?? '',
    [mode]
  )

  const referenceCount = result?.algrowRows?.length ?? 0
  const generatedCount = result?.ideas?.length ?? 0
  const totalReferenceViews = (result?.algrowRows ?? []).reduce((sum, row) => sum + Number(row.views ?? 0), 0)
  const statusCopy =
    result?.saveStatus === 'saved'
      ? `已儲存至題材庫 · ${result.savedIdeaId ?? ''}`
      : result?.saveStatus === 'failed'
        ? `入庫失敗 · ${result.saveError}`
        : generatedCount
          ? '題材卡已生成，等待你篩選同帶入劇本規劃。'
          : 'Algrow 會先拉出 reference signals，再生成 5 張題材卡。'

  function handlePreset(preset: typeof PRESET_TOPICS[0]) {
    setMode('keyword')
    setQuery(preset.query)
    setMarket('Global')
  }

  function handleAddChannel() {
    if (!newChannelName.trim() || !newChannelUrl.trim()) return
    setWatchlist((prev) => [
      ...prev,
      { name: newChannelName.trim(), url: newChannelUrl.trim(), subs: '—' },
    ])
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
    <>
      <style>{PAGE_CSS}</style>
      <div className="workspace-shell">
        <aside className="sidebar">
          <div>
            <div className="workspace-chip">
              <span className="workspace-chip-logo" />
              <span>Youtube Idea Reader</span>
            </div>
            <div className="sidebar-sub">保留 Algrow reference flow，用 board 方式整理 YouTube 題材研究。</div>
          </div>

          <div className="sidebar-section-title">研究輸入</div>

          <div className="step-block">
            <span className="step-num">01</span>
            <span className="step-label">輸入來源</span>
            <div className="chips">
              {modeOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`chip${mode === option.value ? ' sel' : ''}`}
                  onClick={() => setMode(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <input
              className="field"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={modeHint}
            />
            <div className="hint">{modeHint}</div>
          </div>

          <div className="step-block">
            <span className="step-num">02</span>
            <span className="step-label">預設方向</span>
            <div className="chips">
              {PRESET_TOPICS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  className={`chip${query === preset.query ? ' sel' : ''}`}
                  onClick={() => handlePreset(preset)}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="step-block">
            <span className="step-num">03</span>
            <span className="step-label">語言與市場</span>
            <select className="select" value={language} onChange={(event) => setLanguage(event.target.value)}>
              <option value="zh-HK">繁中 / 廣東話</option>
              <option value="zh-TW">繁中 / 台灣</option>
              <option value="en">English</option>
            </select>
            <select className="select" value={market} onChange={(event) => setMarket(event.target.value)}>
              <option value="Global">Global</option>
              <option value="Southeast Asia">Southeast Asia</option>
              <option value="East Asia">East Asia</option>
              <option value="Hong Kong">Hong Kong</option>
              <option value="Taiwan">Taiwan</option>
            </select>
          </div>

          <div className="step-block">
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'center' }}>
              <div>
                <div className="step-num">04</div>
                <div className="step-label" style={{ fontSize: '18px', marginTop: '6px' }}>Watchlist</div>
              </div>
              <button type="button" className="ghost-btn" onClick={() => setShowAddChannel((prev) => !prev)}>
                {showAddChannel ? '取消' : '新增'}
              </button>
            </div>

            {showAddChannel ? (
              <>
                <input
                  className="field"
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                  placeholder="頻道名稱"
                />
                <input
                  className="field"
                  value={newChannelUrl}
                  onChange={(e) => setNewChannelUrl(e.target.value)}
                  placeholder="YouTube 頻道連結"
                />
                <button type="button" className="submit-btn" onClick={handleAddChannel}>
                  確認新增
                </button>
              </>
            ) : null}

            <div style={{ display: 'grid', gap: '8px' }}>
              {watchlist.map((channel, index) => (
                <div key={`${channel.name}-${index}`} className="watch-row">
                  <a className="watch-link" href={channel.url} target="_blank" rel="noreferrer">
                    {channel.name}
                    <span className="watch-meta">{channel.subs}</span>
                  </a>
                  <button type="button" className="delete-btn" onClick={() => handleRemoveChannel(index)}>
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          {error ? <div className="error-box">{error}</div> : null}
          <div className="status-box">{statusCopy}</div>

          <button type="button" className="submit-btn" onClick={handleGenerate} disabled={isPending || !query.trim()}>
            {isPending ? 'AI 生成中...' : '生成 5 張題材卡'}
          </button>
        </aside>

        <main className="main-panel">
          <div className="workspace-header">
            <div>
              <div className="brand-label">SOON YouTube Internal</div>
              <h1 className="page-title">Youtube Idea Reader</h1>
              <div className="header-meta">
                保留 Algrow 作為 reference source，先讀爆款 signal，再整理成可直接帶去 Script Generator 的題材卡。
              </div>
            </div>
            <div className="header-actions">
              <a className="header-btn secondary" href="/library">
                題材庫
              </a>
              <a className="header-btn secondary" href="https://idea-brainstorm.vercel.app" target="_blank" rel="noreferrer">
                IG 題材工作台
              </a>
              <a className="header-btn primary" href="https://script-generator-xi.vercel.app" target="_blank" rel="noreferrer">
                劇本生成
              </a>
            </div>
          </div>

          <section className="hero-grid">
            <div className="hero-card">
              <div className="hero-eyebrow">今日概況</div>
              <div className="hero-headline">先用 Algrow 看訊號，再將 YouTube 爆款整理成可執行的題材板。</div>
              <div className="hero-copy">
                你可以由關鍵字、頻道 URL 或單條影片 URL 開始。系統會先抓 reference signals，再輸出 5 張題材卡，方便你篩選角度、複製摘要，或者直接推去劇本工作台。
              </div>
            </div>

            <div className="metric-stack">
              <div className="metric-grid">
                <div className="metric-card">
                  <div className="metric-number">{generatedCount}</div>
                  <div className="metric-label">題材卡</div>
                  <div className="metric-copy">本輪生成完成的 YouTube 題材卡數量</div>
                </div>
                <div className="metric-card">
                  <div className="metric-number">{referenceCount}</div>
                  <div className="metric-label">Reference</div>
                  <div className="metric-copy">今輪由 Algrow 讀到的參考影片數量</div>
                </div>
                <div className="metric-card">
                  <div className="metric-number">{fmtCompact(totalReferenceViews)}</div>
                  <div className="metric-label">Views</div>
                  <div className="metric-copy">參考影片總播放量</div>
                </div>
                <div className="metric-card">
                  <div className="metric-number">{result?.saveStatus === 'saved' ? '已存' : result?.saveStatus === 'failed' ? '失敗' : '待命'}</div>
                  <div className="metric-label">狀態</div>
                  <div className="metric-copy">{statusCopy}</div>
                </div>
              </div>
            </div>
          </section>

          <section className="board-grid">
            <section className="board-card">
              <div className="card-eyebrow">Algrow Reference Signals</div>
              <div className="board-list" style={{ marginTop: '14px' }}>
                {(result?.algrowRows ?? []).length ? (
                  result!.algrowRows.map((row, index) => {
                    const views = Number(row.views ?? 0)
                    const subs = Number(row.subs ?? row.subscriber_count ?? 0)
                    const outlierRatio = subs > 0 ? (views / subs).toFixed(1) : null
                    return (
                      <div key={`${String(row.title)}-${index}`} className="ref-row">
                        <div className="ref-title">{String(row.title ?? '')}</div>
                        <div className="ref-meta">
                          {String(row.channel ?? '')} · {fmtCompact(views)} views
                          {outlierRatio ? <span className="tag" style={{ marginLeft: '8px' }}>{outlierRatio}× outlier</span> : null}
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="empty-card" style={{ padding: '18px 20px' }}>
                    生成後，這裡會顯示由 Algrow 帶回來的 reference signals，方便你先判斷值得沿住邊條線發展。
                  </div>
                )}
              </div>
            </section>

            <aside className="board-card">
              <div className="card-eyebrow">工作流狀態</div>
              <div className="board-list" style={{ marginTop: '14px' }}>
                <div className="ref-row">
                  <div className="ref-title">1. 輸入研究來源</div>
                  <div className="ref-meta">由關鍵字、頻道 URL 或影片 URL 啟動</div>
                </div>
                <div className="ref-row">
                  <div className="ref-title">2. Algrow 拉取 reference</div>
                  <div className="ref-meta">先看 signal，再決定值唔值得深入發展</div>
                </div>
                <div className="ref-row">
                  <div className="ref-title">3. 輸出 5 張題材卡</div>
                  <div className="ref-meta">逐張 review 角度、延伸系列、補充資料</div>
                </div>
                <div className="ref-row">
                  <div className="ref-title">4. 帶去 Script Generator</div>
                  <div className="ref-meta">可直接複製摘要，或者打開劇本工作台接力</div>
                </div>
              </div>
            </aside>
          </section>

          <section className="idea-list">
            {generatedCount ? (
              result!.ideas.map((idea, index) => {
                const cat = CATEGORY_META[idea.category] ?? CATEGORY_META.evergreen
                return (
                  <article key={`${idea.title}-${index}`} className="idea-card">
                    <div className="idea-top">
                      <div>
                        <div className="card-eyebrow">Idea Card {index + 1}</div>
                        <div className="idea-title">{idea.title}</div>
                      </div>
                      <span className="tag" style={{ color: cat.color, borderColor: `${cat.color}50` }}>
                        {cat.emoji} {cat.label}
                      </span>
                    </div>

                    <div className="idea-grid">
                      {[
                        ['核心角度', idea.coreAngle],
                        ['切入原因', idea.whyNow],
                        ['受眾適配', idea.audienceFit],
                        ['爆款模式', idea.breakoutPattern],
                        ['需補充資料', idea.backingInfoNeeded.join(' / ')],
                        ['延伸系列', idea.seriesExtensions.join(' / ')],
                      ].map(([label, value]) => (
                        <div key={label} className="info-box">
                          <div className="info-label">{label}</div>
                          <div className="info-copy">{value}</div>
                        </div>
                      ))}
                    </div>

                    <div className="idea-actions">
                      {idea.references?.map((url) => (
                        <a key={url} className="small-link" href={url} target="_blank" rel="noreferrer">
                          參考影片 ↗
                        </a>
                      ))}
                      <a className="small-link primary" href="https://script-generator-xi.vercel.app" target="_blank" rel="noreferrer">
                        → Script Generator
                      </a>
                      <button
                        type="button"
                        className="copy-btn"
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
                      >
                        複製摘要
                      </button>
                    </div>
                  </article>
                )
              })
            ) : (
              <section className="empty-card">
                右邊會用 board 形式展示 YouTube 題材卡。你只要喺左邊輸入研究來源，系統就會保留 Algrow 資料流，先讀 signal，再整理出 5 張可用於後續腳本規劃的題材卡。
              </section>
            )}
          </section>
        </main>
      </div>
    </>
  )
}
