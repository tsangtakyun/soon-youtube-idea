'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'

type InputMode = 'keyword' | 'channel_url' | 'video_url'
type TopicCategory = 'breaking' | 'culture' | 'rich' | 'poor' | 'evergreen'
type NavKey = 'home' | 'work' | 'board' | 'analysis'

const CATEGORY_META: Record<TopicCategory, { emoji: string; label: string; color: string }> = {
  breaking: { emoji: '🔴', label: 'Breaking', color: '#ff8b7c' },
  culture: { emoji: '🟡', label: 'Culture', color: '#ffe07c' },
  rich: { emoji: '🟠', label: 'Rich', color: '#ffbc7c' },
  poor: { emoji: '🟤', label: 'Poor', color: '#d8a57d' },
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
  --bg: #1f2140;
  --panel: #2a2d4d;
  --panel-soft: #313457;
  --line: rgba(255,255,255,0.08);
  --text: #eef1ff;
  --text2: #c5ccef;
  --text3: #99a1d8;
  --primary: linear-gradient(135deg, #7b61ff 0%, #4b89ff 100%);
}

* { box-sizing: border-box; }

body { background: var(--bg); }

.workspace-shell {
  display: grid;
  grid-template-columns: 236px minmax(0, 1fr);
  gap: 0;
  min-height: calc(100vh - 80px);
  border: 1px solid var(--line);
  border-radius: 26px;
  overflow: hidden;
  background: rgba(31,33,64,0.92);
  box-shadow: 0 30px 80px rgba(7,10,24,0.34);
}

.sidebar {
  background: #252846;
  border-right: 1px solid var(--line);
  padding: 18px 16px 20px;
  display: grid;
  align-content: start;
  gap: 14px;
}

.workspace-chip {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  border: 1px solid var(--line);
  background: rgba(255,255,255,0.04);
  border-radius: 18px;
  padding: 12px 14px;
  color: var(--text);
  font-size: 14px;
  font-weight: 700;
}

.workspace-chip-logo {
  width: 14px;
  height: 14px;
  border-radius: 999px;
  background: linear-gradient(135deg, #7b61ff 0%, #4b89ff 100%);
}

.workspace-sub {
  color: var(--text3);
  font-size: 12px;
  line-height: 1.65;
}

.sidebar-nav {
  display: grid;
  gap: 6px;
}

.sidebar-nav-item {
  display: flex;
  width: 100%;
  align-items: center;
  border: none;
  background: transparent;
  color: var(--text2);
  font-size: 15px;
  padding: 14px 14px;
  border-radius: 16px;
  cursor: pointer;
}

.sidebar-nav-item.active {
  background: rgba(123,97,255,0.25);
  color: #fff;
}

.sidebar-section-title {
  color: var(--text3);
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  margin-top: 4px;
}

.step-block {
  display: grid;
  gap: 10px;
}

.step-num {
  color: var(--text3);
  font-size: 12px;
  letter-spacing: 0.16em;
}

.step-label {
  color: var(--text);
  font-size: 15px;
  font-weight: 700;
}

.field,
.select,
.textarea {
  width: 100%;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: rgba(255,255,255,0.05);
  color: var(--text);
  padding: 12px 14px;
  font-size: 14px;
  outline: none;
}

.textarea {
  min-height: 92px;
  resize: vertical;
  font-family: inherit;
}

.field::placeholder,
.textarea::placeholder {
  color: rgba(224,229,255,0.42);
}

.muted {
  color: var(--text3);
  font-size: 11px;
  line-height: 1.6;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chip {
  border: 1px solid var(--line);
  border-radius: 999px;
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
  padding: 10px 12px;
  border-radius: 14px;
  background: rgba(255,255,255,0.04);
}

.watch-link {
  color: var(--text);
  text-decoration: none;
  font-size: 13px;
  flex: 1;
}

.watch-meta {
  color: var(--text3);
  margin-left: 8px;
  font-size: 11px;
}

.ghost-btn,
.delete-btn,
.btn-submit,
.top-btn,
.row-btn,
.copy-btn {
  cursor: pointer;
}

.ghost-btn {
  border: 1px solid var(--line);
  background: rgba(255,255,255,0.04);
  color: var(--text);
  border-radius: 999px;
  padding: 8px 12px;
  font-size: 12px;
}

.delete-btn {
  border: none;
  background: none;
  color: var(--text3);
  font-size: 16px;
  padding: 0 0 0 8px;
}

.btn-submit {
  border: none;
  border-radius: 18px;
  background: var(--primary);
  color: #fff;
  padding: 15px 18px;
  font-size: 15px;
  font-weight: 700;
}

.btn-submit:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.sidebar-footer-card,
.error-box {
  border-radius: 18px;
  padding: 14px;
}

.sidebar-footer-card {
  background: rgba(255,255,255,0.04);
  border: 1px solid var(--line);
}

.sidebar-footer-eyebrow {
  color: var(--text3);
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.sidebar-footer-number {
  color: var(--text);
  font-size: 30px;
  font-weight: 700;
  margin-top: 6px;
}

.sidebar-footer-copy {
  color: var(--text2);
  font-size: 12px;
  line-height: 1.65;
  margin-top: 6px;
}

.error-box {
  background: rgba(209,92,92,0.14);
  color: #ffb3b3;
  line-height: 1.7;
  font-size: 13px;
}

.main-panel {
  padding: 22px 22px 30px;
  display: grid;
  gap: 18px;
}

.workspace-header {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 18px;
}

.brand-label {
  color: var(--text3);
  font-size: 12px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.page-title {
  margin: 8px 0 0;
  font-size: 54px;
  line-height: 0.98;
  letter-spacing: -0.04em;
}

.header-meta {
  color: var(--text2);
  font-size: 16px;
  margin-top: 10px;
}

.workspace-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.top-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  border-radius: 14px;
  padding: 12px 16px;
  font-size: 14px;
  border: 1px solid var(--line);
}

.top-btn.ghost {
  background: rgba(255,255,255,0.05);
  color: var(--text);
}

.top-btn.primary {
  background: var(--primary);
  color: #fff;
  border-color: transparent;
}

.hero-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 294px 294px 294px;
  gap: 14px;
}

.hero-card,
.metric-card,
.table-shell,
.summary-card,
.idea-row {
  border-radius: 26px;
  border: 1px solid var(--line);
  background: #2b2e4e;
}

.hero-card {
  padding: 24px 26px;
}

.hero-eyebrow,
.section-eyebrow {
  color: var(--text3);
  font-size: 12px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.hero-copy {
  color: var(--text);
  font-size: 16px;
  line-height: 1.75;
  margin-top: 12px;
  max-width: 760px;
}

.hero-highlight {
  font-size: 22px;
  line-height: 1.35;
  font-weight: 700;
  margin-top: 12px;
}

.metric-card {
  padding: 22px;
}

.metric-number {
  color: var(--text);
  font-size: 44px;
  font-weight: 700;
  line-height: 1;
}

.metric-title {
  color: var(--text);
  font-size: 15px;
  margin-top: 14px;
}

.metric-copy {
  color: var(--text2);
  font-size: 12px;
  line-height: 1.6;
  margin-top: 8px;
}

.board-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 270px;
  gap: 16px;
}

.table-shell {
  overflow: hidden;
}

.table-head {
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) 250px 260px 210px;
  gap: 0;
  padding: 18px 18px 14px;
  border-bottom: 1px solid var(--line);
  color: var(--text3);
  font-size: 13px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.idea-row {
  margin: 0 0 14px;
  padding: 18px;
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) 250px 260px 210px;
  gap: 18px;
  align-items: start;
}

.idea-column {
  min-width: 0;
}

.idea-section-label {
  color: var(--text3);
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  margin-bottom: 10px;
}

.idea-title {
  color: var(--text);
  font-size: 28px;
  line-height: 1.15;
  letter-spacing: -0.03em;
}

.idea-summary {
  color: var(--text2);
  font-size: 14px;
  line-height: 1.7;
  margin-top: 12px;
}

.idea-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
}

.tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 999px;
  border: 1px solid var(--line);
  background: rgba(255,255,255,0.05);
  color: var(--text2);
  padding: 8px 12px;
  font-size: 12px;
}

.score-pill {
  height: 96px;
  border-radius: 24px;
  background: rgba(123,97,255,0.22);
  display: grid;
  place-items: center;
  color: var(--text);
  font-size: 54px;
  font-weight: 700;
}

.score-track {
  margin-top: 16px;
}

.score-track-label {
  color: var(--text2);
  font-size: 12px;
  margin-bottom: 8px;
}

.score-line {
  height: 6px;
  border-radius: 999px;
  background: rgba(255,255,255,0.12);
  overflow: hidden;
}

.score-fill {
  height: 100%;
  border-radius: inherit;
  background: var(--primary);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.stat-box {
  padding: 16px 14px;
  border-radius: 20px;
  background: rgba(255,255,255,0.05);
  border: 1px solid var(--line);
}

.stat-number {
  color: var(--text);
  font-size: 28px;
  font-weight: 700;
}

.stat-label {
  color: var(--text3);
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  margin-top: 10px;
}

.ref-stack {
  display: grid;
  gap: 10px;
}

.ref-box {
  padding: 14px;
  border-radius: 18px;
  background: rgba(255,255,255,0.05);
  border: 1px solid var(--line);
}

.ref-title {
  color: var(--text);
  font-size: 14px;
  line-height: 1.5;
}

.ref-meta {
  color: var(--text2);
  font-size: 12px;
  line-height: 1.6;
  margin-top: 6px;
}

.row-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 16px;
}

.row-btn,
.copy-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  padding: 10px 14px;
  font-size: 13px;
  text-decoration: none;
}

.row-btn {
  background: rgba(255,255,255,0.05);
  color: var(--text);
  border: 1px solid var(--line);
}

.row-btn.primary {
  background: var(--primary);
  color: #fff;
  border-color: transparent;
}

.copy-btn {
  border: 1px solid var(--line);
  background: rgba(255,255,255,0.05);
  color: var(--text);
}

.summary-card {
  padding: 18px;
  display: grid;
  gap: 10px;
  align-content: start;
}

.summary-item {
  padding: 14px;
  border-radius: 18px;
  background: rgba(255,255,255,0.05);
  border: 1px solid var(--line);
}

.summary-title {
  color: var(--text);
  font-size: 14px;
  line-height: 1.5;
}

.summary-copy {
  color: var(--text2);
  font-size: 12px;
  line-height: 1.6;
  margin-top: 6px;
}

.empty-state {
  padding: 26px;
  color: var(--text2);
  line-height: 1.8;
}

@media (max-width: 1400px) {
  .hero-row {
    grid-template-columns: minmax(0, 1fr) 1fr;
  }

  .board-layout {
    grid-template-columns: 1fr;
  }

  .table-head,
  .idea-row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 1120px) {
  .workspace-shell {
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
  const [activeNav, setActiveNav] = useState<NavKey>('home')

  const homeRef = useRef<HTMLElement | null>(null)
  const workRef = useRef<HTMLElement | null>(null)
  const boardRef = useRef<HTMLDivElement | null>(null)
  const analysisRef = useRef<HTMLElement | null>(null)

  const modeHint = useMemo(
    () => modeOptions.find((item) => item.value === mode)?.hint ?? '',
    [mode]
  )

  const referenceRows = result?.algrowRows ?? []
  const ideas = result?.ideas ?? []
  const referenceCount = referenceRows.length
  const generatedCount = ideas.length
  const totalReferenceViews = referenceRows.reduce((sum, row) => sum + Number(row.views ?? 0), 0)
  const averageOutlier =
    referenceRows.length > 0
      ? (
          referenceRows.reduce((sum, row) => {
            const views = Number(row.views ?? 0)
            const subs = Number(row.subs ?? row.subscriber_count ?? 0)
            return sum + (subs > 0 ? views / subs : 0)
          }, 0) / referenceRows.length
        ).toFixed(1)
      : '0.0'

  useEffect(() => {
    const observers = [
      { key: 'home' as NavKey, ref: homeRef },
      { key: 'work' as NavKey, ref: workRef },
      { key: 'board' as NavKey, ref: boardRef },
      { key: 'analysis' as NavKey, ref: analysisRef },
    ]
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (!visible) return
        const next = observers.find((item) => item.ref.current === visible.target)
        if (next) setActiveNav(next.key)
      },
      { threshold: [0.25, 0.45, 0.7] }
    )
    observers.forEach((item) => {
      if (item.ref.current) io.observe(item.ref.current)
    })
    return () => io.disconnect()
  }, [])

  function jumpTo(section: NavKey) {
    setActiveNav(section)
    const target =
      section === 'home'
        ? homeRef.current
        : section === 'work'
          ? workRef.current
          : section === 'board'
            ? boardRef.current
            : analysisRef.current
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

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
        setError(requestError instanceof Error ? requestError.message : '未能生成 YouTube 題材卡。')
      }
    })
  }

  return (
    <>
      <style>{PAGE_CSS}</style>
      <div className="workspace-shell">
        <aside className="sidebar">
          <div>
            <button className="workspace-chip" onClick={() => jumpTo('home')} type="button">
              <span className="workspace-chip-logo" />
              <span>Youtube Idea Reader</span>
            </button>
            <div className="workspace-sub">SOON 內部 YouTube 題材系統，保留 Algrow signal flow 再整理成題材 collection。</div>
          </div>

          <div className="sidebar-nav">
            <button className={`sidebar-nav-item${activeNav === 'home' ? ' active' : ''}`} onClick={() => jumpTo('home')} type="button">首頁</button>
            <button className={`sidebar-nav-item${activeNav === 'work' ? ' active' : ''}`} onClick={() => jumpTo('work')} type="button">我的工作</button>
            <button className={`sidebar-nav-item${activeNav === 'board' ? ' active' : ''}`} onClick={() => jumpTo('board')} type="button">題材板</button>
            <button className={`sidebar-nav-item${activeNav === 'analysis' ? ' active' : ''}`} onClick={() => jumpTo('analysis')} type="button">近期分析</button>
          </div>

          <div className="sidebar-section-title">快速輸入</div>

          <div className="step-block">
            <span className="step-num">01</span>
            <span className="step-label">研究來源</span>
            <div className="chips">
              {modeOptions.map((option) => (
                <button key={option.value} className={`chip${mode === option.value ? ' sel' : ''}`} onClick={() => setMode(option.value)} type="button">
                  {option.label}
                </button>
              ))}
            </div>
            <input className="field" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={modeHint} />
            <div className="muted">{modeHint}</div>
          </div>

          <div className="step-block">
            <span className="step-num">02</span>
            <span className="step-label">預設題材</span>
            <div className="chips">
              {PRESET_TOPICS.map((preset) => (
                <button key={preset.label} className={`chip${query === preset.query ? ' sel' : ''}`} onClick={() => handlePreset(preset)} type="button">
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
              <div>
                <span className="step-num">04</span>
                <div className="step-label" style={{ marginTop: '6px' }}>Watchlist</div>
              </div>
              <button className="ghost-btn" onClick={() => setShowAddChannel((value) => !value)} type="button">
                {showAddChannel ? '取消' : '新增'}
              </button>
            </div>

            {showAddChannel ? (
              <>
                <input className="field" value={newChannelName} onChange={(event) => setNewChannelName(event.target.value)} placeholder="頻道名稱" />
                <input className="field" value={newChannelUrl} onChange={(event) => setNewChannelUrl(event.target.value)} placeholder="YouTube 頻道連結" />
                <button className="btn-submit" onClick={handleAddChannel} type="button">確認新增</button>
              </>
            ) : null}

            <div style={{ display: 'grid', gap: '8px' }}>
              {watchlist.map((channel, index) => (
                <div className="watch-row" key={`${channel.name}-${index}`}>
                  <a className="watch-link" href={channel.url} target="_blank" rel="noreferrer">
                    {channel.name}
                    <span className="watch-meta">{channel.subs}</span>
                  </a>
                  <button className="delete-btn" onClick={() => handleRemoveChannel(index)} type="button">×</button>
                </div>
              ))}
            </div>
          </div>

          {error ? <div className="error-box">{error}</div> : null}

          <button className="btn-submit" onClick={handleGenerate} disabled={isPending || !query.trim()} type="button">
            {isPending ? '分析中…' : '分析並生成題材'}
          </button>

          <div className="sidebar-footer-card">
            <div className="sidebar-footer-eyebrow">當前狀態</div>
            <div className="sidebar-footer-number">{generatedCount}</div>
            <div className="sidebar-footer-copy">已生成題材卡。系統會先讀 Algrow reference，再整理成 collection。</div>
          </div>
        </aside>

        <main className="main-panel">
          <div className="workspace-header">
            <div>
              <div className="brand-label">SOON 創意營運</div>
              <h1 className="page-title">Youtube Idea Collection</h1>
              <div className="header-meta">以 `IG reel ideabrainstorm` 的工作台方式整理 YouTube 題材研究。</div>
            </div>
            <div className="workspace-actions">
              <a className="top-btn ghost" href="/library">題材庫</a>
              <a className="top-btn ghost" href="https://idea-brainstorm.vercel.app" target="_blank" rel="noreferrer">IG 題材台</a>
              <a className="top-btn primary" href="https://script-generator-xi.vercel.app" target="_blank" rel="noreferrer">劇本生成</a>
            </div>
          </div>

          <section className="hero-row" ref={homeRef}>
            <div className="hero-card">
              <div className="hero-eyebrow">今日概況</div>
              <div className="hero-highlight">集中管理 YouTube 題材研究、Algrow 訊號與下一步劇本接力，令前期研究更似真正工作台。</div>
              <div className="hero-copy">呢邊唔係直接寫 script，而係先整理值得拍嘅方向、爆款模式、受眾適配同延伸系列，之後先帶去劇本生成。</div>
            </div>
            <div className="metric-card">
              <div className="section-eyebrow">題材卡</div>
              <div className="metric-number">{generatedCount}</div>
              <div className="metric-title">已生成題材數量</div>
              <div className="metric-copy">每次會輸出 5 張可以直接 review 的題材卡。</div>
            </div>
            <div className="metric-card">
              <div className="section-eyebrow">Reference</div>
              <div className="metric-number">{referenceCount}</div>
              <div className="metric-title">Algrow 參考影片</div>
              <div className="metric-copy">先讀 reference signals，再決定值唔值得延伸。</div>
            </div>
            <div className="metric-card">
              <div className="section-eyebrow">Outlier</div>
              <div className="metric-number">{averageOutlier}x</div>
              <div className="metric-title">平均放大比率</div>
              <div className="metric-copy">快速看演算法偏好，同 IG ideabrainstorm 一樣先看 signal。</div>
            </div>
          </section>

          <section className="board-layout" ref={workRef}>
            <section className="table-shell">
              <div className="table-head">
                <div>題材</div>
                <div>爆款指數</div>
                <div>數據</div>
                <div>參考影片</div>
              </div>

              <div style={{ display: 'grid', gap: '14px', padding: '14px' }}>
                {ideas.length ? (
                  ideas.map((idea, index) => {
                    const cat = CATEGORY_META[idea.category] ?? CATEGORY_META.evergreen
                    const firstReference = referenceRows[index] ?? referenceRows[0] ?? null
                    const refViews = Number(firstReference?.views ?? 0)
                    const refSubs = Number(firstReference?.subs ?? firstReference?.subscriber_count ?? 0)
                    const score = Math.max(76, Math.min(98, Math.round((refSubs > 0 ? (refViews / refSubs) * 10 : 82) + 40)))
                    return (
                      <article key={`${idea.title}-${index}`} className="idea-row">
                        <div className="idea-column">
                          <div className="idea-section-label">題材</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                            <span className="tag">{cat.emoji} {cat.label}</span>
                            <span className="tag">Idea {index + 1}</span>
                          </div>
                          <div className="idea-title">{idea.title}</div>
                          <div className="idea-summary">{idea.coreAngle}</div>
                          <div className="idea-tags">
                            <span className="tag">{idea.whyNow}</span>
                            <span className="tag">{idea.audienceFit}</span>
                            <span className="tag">{idea.breakoutPattern}</span>
                          </div>
                          <div className="row-actions">
                            <a className="row-btn primary" href="https://script-generator-xi.vercel.app" target="_blank" rel="noreferrer">→ 劇本生成</a>
                            <button
                              className="copy-btn"
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
                            >
                              複製摘要
                            </button>
                          </div>
                        </div>

                        <div className="idea-column">
                          <div className="idea-section-label">爆款指數</div>
                          <div className="score-pill">{score}</div>
                          <div className="score-track">
                            <div className="score-track-label">爆款指數</div>
                            <div className="score-line">
                              <div className="score-fill" style={{ width: `${score}%` }} />
                            </div>
                          </div>
                        </div>

                        <div className="idea-column">
                          <div className="idea-section-label">數據</div>
                          <div className="stats-grid">
                            <div className="stat-box">
                              <div className="stat-number">{fmtCompact(refViews)}</div>
                              <div className="stat-label">Views</div>
                            </div>
                            <div className="stat-box">
                              <div className="stat-number">{fmtCompact(refSubs)}</div>
                              <div className="stat-label">Subs</div>
                            </div>
                            <div className="stat-box">
                              <div className="stat-number">{refSubs > 0 ? `${(refViews / refSubs).toFixed(1)}x` : '--'}</div>
                              <div className="stat-label">Outlier</div>
                            </div>
                          </div>
                        </div>

                        <div className="idea-column">
                          <div className="idea-section-label">參考影片</div>
                          <div className="ref-stack">
                            {idea.references?.length ? (
                              idea.references.slice(0, 2).map((url) => (
                                <a key={url} className="ref-box" href={url} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                                  <div className="ref-title">參考影片 ↗</div>
                                  <div className="ref-meta">{url.replace(/^https?:\/\//, '')}</div>
                                </a>
                              ))
                            ) : (
                              <div className="ref-box">
                                <div className="ref-title">等待參考資料</div>
                                <div className="ref-meta">Algrow signal 會顯示喺下方。</div>
                              </div>
                            )}
                          </div>
                        </div>
                      </article>
                    )
                  })
                ) : (
                  <div className="empty-state">
                    生成之後，呢度會好似 IG reel ideabrainstorm 咁，以 collection table 形式列出題材、爆款指數、數據同參考影片。
                  </div>
                )}
              </div>
            </section>

            <aside className="summary-card" ref={analysisRef}>
              <div className="section-eyebrow">Algrow Summary</div>
              <div className="summary-item">
                <div className="summary-title">Reference 總播放量</div>
                <div className="summary-copy">{fmtCompact(totalReferenceViews)} views</div>
              </div>
              <div className="summary-item">
                <div className="summary-title">儲存狀態</div>
                <div className="summary-copy">
                  {result?.saveStatus === 'saved'
                    ? `已儲存至題材庫 · ${result.savedIdeaId ?? ''}`
                    : result?.saveStatus === 'failed'
                      ? `入庫失敗 · ${result.saveError}`
                      : ideas.length
                        ? '已生成，未儲存到題材庫。'
                        : '等待生成。'}
                </div>
              </div>
              <div className="summary-item">
                <div className="summary-title">工作流程</div>
                <div className="summary-copy">輸入來源 → Algrow 拉 reference → 生成題材卡 → 推上劇本生成。</div>
              </div>
              <div className="summary-item" ref={boardRef}>
                <div className="summary-title">Reference Signals</div>
                <div className="summary-copy">你會喺呢邊看到 Algrow 帶回來的影片標題、頻道同 outlier 參考。</div>
              </div>
            </aside>
          </section>
        </main>
      </div>
    </>
  )
}
