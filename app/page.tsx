'use client'

import { useEffect, useMemo, useState } from 'react'

type ViralVideo = {
  id: string
  created_at: string
  video_url: string
  video_id: string
  title_original: string
  title_zh: string
  views: number
  likes: number
  comments: number
  duration: string
  publish_date: string
  channel_name: string
  channel_url: string
  subscribers: number
  description: string | null
  region: string | null
  ai_analysis: string | null
  outlier_ratio: number
  source: string | null
  selected: boolean | null
}

type TopicSignal = {
  id: string
  created_at: string
  topic_zh: string
  topic_en: string | null
  signal_count: number
  max_outlier_ratio: number
  avg_outlier_ratio: number
  related_channels: string[] | null
  ai_analysis: string | null
  soon_angle: string | null
  status: string | null
}

type ScanKeyword = {
  id: string
  keyword: string
  category: string | null
  active: boolean
}

const REGIONS = [
  'Hong Kong',
  'East Asia',
  'Southeast Asia',
  'Rich Asia',
  'Poor Asia',
  'Culture',
  'Travel',
  'Food',
  'Lifestyle',
]

const KEYWORD_CATEGORIES = [
  'Hong Kong',
  'East Asia',
  'Southeast Asia',
  'Food',
  'Travel',
  'Culture',
  'Rich Asia',
  'Poor Asia',
  'Lifestyle',
]

const GUIDE_QUESTIONS = [
  {
    key: 'topic',
    question: '你嘅頻道主要係做咩題材？',
    placeholder: '例：美食探店、旅遊 vlog、文化評論、生活分享...',
    options: ['美食探店', '旅遊探索', '文化評論', '生活 vlog', '社會現象', '科技資訊', '財經理財', '娛樂搞笑'],
  },
  {
    key: 'market',
    question: '你主要做邊個市場？',
    placeholder: '例：香港、台灣、東南亞、全亞洲...',
    options: ['香港', '台灣', '東南亞', '日本/韓國', '全亞洲', '海外華人'],
  },
  {
    key: 'audience',
    question: '你嘅目標觀眾係咩人？',
    placeholder: '例：本地港人、海外港人、年輕人、家庭...',
    options: ['本地港人', '海外港人', '亞洲年輕人', '家庭觀眾', '商務人士', '旅遊愛好者'],
  },
] as const

type GuideKey = typeof GUIDE_QUESTIONS[number]['key']
type GuideAnswers = Record<GuideKey, string>

const CSS = `
* { box-sizing: border-box; }
body { background: #0a0a0f; color: #f0f0f5; font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
.yt-shell { min-height: 100vh; background: #0a0a0f; width: 100%; }
.yt-main { width: 100%; padding: 32px 32px 64px; display: flex; flex-direction: column; gap: 20px; }
.yt-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin-bottom: 16px; }
.yt-kicker { font-size: 12px; letter-spacing: .18em; color: #5a5a72; text-transform: uppercase; }
.yt-title { font-size: 28px; line-height: 1.15; margin: 0; color: #f0f0f5; font-weight: 700; }
.yt-subtitle { margin-top: 6px; font-size: 13px; color: #9090a8; }
.yt-actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; justify-content: flex-end; }
.yt-action-btn { border-radius: 8px; padding: 8px 16px; font-size: 13px; font-weight: 500; cursor: pointer; font-family: inherit; white-space: nowrap; }
.yt-action-btn:disabled { opacity: .55; cursor: not-allowed; }
.yt-hero { width: 100%; height: 160px; object-fit: cover; object-position: center; border-radius: 12px; display: block; margin-bottom: 20px; }
.yt-status { border-radius: 10px; padding: 12px; font-size: 13px; line-height: 1.5; }
.yt-status.loading { background: rgba(124,92,252,.12); color: #c4b5fd; }
.yt-status.success { background: rgba(16,185,129,.12); color: #34d399; }
.yt-status.error { background: rgba(239,68,68,.12); color: #fca5a5; }
.yt-sort { background: #111118; color: #f0f0f5; border: 1px solid #2a2a3a; border-radius: 10px; padding: 9px 12px; font-size: 13px; }
.yt-card { background: #16161f; border: 1px solid #2a2a3a; border-radius: 14px; overflow: hidden; }
.yt-table-head, .yt-video-row { display: grid; grid-template-columns: minmax(0, 2fr) 100px 100px 100px 120px 110px 90px 180px; gap: 10px; align-items: center; }
.yt-table-head { padding: 13px 18px; color: #5a5a72; font-size: 11px; letter-spacing: .08em; text-transform: uppercase; border-bottom: 1px solid #2a2a3a; }
.yt-video-row { padding: 16px 18px; border-bottom: 1px solid rgba(255,255,255,.06); cursor: pointer; }
.yt-video-row:hover { background: rgba(255,255,255,.025); }
.yt-video-row:last-child { border-bottom: none; }
.yt-video-title { font-size: 15px; font-weight: 650; color: #f0f0f5; line-height: 1.35; }
.yt-video-original { font-size: 12px; color: #9090a8; line-height: 1.4; margin-top: 4px; }
.yt-meta { font-size: 12px; color: #7c5cfc; margin-top: 6px; }
.yt-region { display: inline-flex; margin-top: 7px; border: 1px solid #3a3a50; border-radius: 999px; padding: 3px 8px; font-size: 11px; color: #a7a7c4; }
.yt-cell-main { font-size: 15px; font-weight: 650; color: #f0f0f5; }
.yt-cell-sub { font-size: 11px; color: #5a5a72; margin-top: 3px; }
.yt-outlier { display: inline-flex; border-radius: 8px; padding: 6px 10px; font-size: 13px; font-weight: 700; }
.yt-row-actions { display: flex; gap: 6px; justify-content: flex-end; flex-wrap: wrap; }
.yt-small-btn { border: none; border-radius: 8px; padding: 6px 9px; font-size: 12px; font-weight: 600; cursor: pointer; white-space: nowrap; }
.yt-btn-select { background: rgba(16,185,129,.16); color: #34d399; }
.yt-btn-remove { background: rgba(245,158,11,.16); color: #fbbf24; }
.yt-btn-delete { background: rgba(239,68,68,.16); color: #fca5a5; }
.yt-btn-script { background: #f59e0b; color: #fff; }
.yt-expand { padding: 16px 18px; border-top: 1px solid #2a2a3a; background: rgba(255,255,255,.02); display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.yt-expand-label { font-size: 11px; color: #5a5a72; letter-spacing: .08em; text-transform: uppercase; margin-bottom: 6px; }
.yt-expand-text { font-size: 13px; color: #c9c9dd; line-height: 1.7; white-space: pre-wrap; }
.yt-topic-grid { display: flex; flex-direction: column; gap: 12px; }
.yt-topic { background: #16161f; border: 1px solid #2a2a3a; border-radius: 14px; padding: 18px; cursor: pointer; }
.yt-topic:hover { background: #1c1c28; }
.yt-topic-main { display: grid; grid-template-columns: minmax(0, 1fr) 110px 130px; gap: 16px; align-items: center; }
.yt-topic-title { font-size: 18px; font-weight: 700; color: #fff; }
.yt-topic-en { color: #9090a8; font-size: 12px; margin-top: 4px; }
.yt-topic-channels { color: #a7a7c4; font-size: 12px; margin-top: 8px; }
.yt-topic-metric { text-align: center; }
.yt-topic-num { font-size: 28px; font-weight: 700; color: #fff; }
.yt-topic-label { color: #5a5a72; font-size: 11px; margin-top: 4px; }
.yt-empty { color: #9090a8; text-align: center; padding: 72px 20px; line-height: 1.8; }
.yt-label { font-size: 12px; color: #a7a7c4; margin-bottom: 8px; }
.yt-input, .yt-textarea, .yt-select { width: 100%; background: #111118; color: #f0f0f5; border: 1px solid #2a2a3a; border-radius: 10px; padding: 11px 12px; font-size: 14px; outline: none; }
.yt-textarea { min-height: 82px; resize: vertical; line-height: 1.5; }
.yt-input:focus, .yt-textarea:focus, .yt-select:focus { border-color: #7c5cfc; }
.yt-select option { background: #111118; color: #f0f0f5; }
.yt-primary { width: 100%; background: #7c5cfc; color: #fff; border: none; border-radius: 10px; padding: 12px 14px; font-size: 14px; font-weight: 600; cursor: pointer; }
.yt-primary:disabled { opacity: .45; cursor: not-allowed; }
.yt-panel-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 49; }
.yt-panel { position: fixed; top: 0; right: 0; width: 400px; max-width: 100vw; height: 100vh; background: #111118; border-left: 1px solid #2a2a3a; z-index: 50; padding: 24px; overflow-y: auto; }
.yt-keyword-row { display: grid; grid-template-columns: minmax(0, 1fr) 92px 54px; align-items: center; gap: 10px; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,.06); }
.yt-switch { width: 42px; height: 24px; border-radius: 999px; border: 1px solid #2a2a3a; background: #16161f; padding: 2px; cursor: pointer; }
.yt-switch span { display: block; width: 18px; height: 18px; border-radius: 999px; background: #5a5a72; transition: transform .16s ease, background .16s ease; }
.yt-switch.active { background: rgba(124,92,252,.24); border-color: #7c5cfc; }
.yt-switch.active span { transform: translateX(16px); background: #7c5cfc; }
@media (max-width: 1200px) {
  .yt-main { padding: 24px; }
  .yt-header { flex-direction: column; }
  .yt-actions { justify-content: flex-start; }
  .yt-table-head { display: none; }
  .yt-video-row { grid-template-columns: 1fr; }
  .yt-topic-main { grid-template-columns: 1fr; }
}
`

function formatNumber(value: number) {
  if (!Number.isFinite(value)) return '0'
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${Math.round(value / 1_000)}K`
  return String(value)
}

function outlierStyle(ratio: number) {
  if (ratio >= 5) return { label: '超高', color: '#ef4444' }
  if (ratio >= 2) return { label: '高', color: '#f59e0b' }
  if (ratio >= 0.5) return { label: '正常', color: '#22c55e' }
  return { label: '低', color: '#6b7280' }
}

export default function HomePage() {
  const [videoUrl, setVideoUrl] = useState('')
  const [description, setDescription] = useState('')
  const [region, setRegion] = useState('')
  const [videos, setVideos] = useState<ViralVideo[]>([])
  const [topics, setTopics] = useState<TopicSignal[]>([])
  const [keywords, setKeywords] = useState<ScanKeyword[]>([])
  const [keywordInput, setKeywordInput] = useState('')
  const [keywordCategory, setKeywordCategory] = useState('Culture')
  const [activeTab, setActiveTab] = useState<'signals' | 'collection' | 'selected'>('signals')
  const [sortBy, setSortBy] = useState<'outlier_ratio' | 'views' | 'created_at'>('outlier_ratio')
  const [expandedId, setExpandedId] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [addPanelOpen, setAddPanelOpen] = useState(false)
  const [keywordPanelOpen, setKeywordPanelOpen] = useState(false)
  const [aiGuideOpen, setAiGuideOpen] = useState(false)
  const [guideStep, setGuideStep] = useState(0)
  const [guideAnswers, setGuideAnswers] = useState<GuideAnswers>({ topic: '', market: '', audience: '' })
  const [suggestedKeywords, setSuggestedKeywords] = useState<Array<{ keyword: string; category: string; reason: string }>>([])
  const [suggestLoading, setSuggestLoading] = useState(false)
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<number>>(new Set())
  const [, setUserId] = useState('')
  const [status, setStatus] = useState<{ type: 'loading' | 'success' | 'error'; msg: string } | null>(null)
  const [outliningId, setOutliningId] = useState('')

  useEffect(() => {
    void fetchAll()
  }, [])

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data?.type !== 'SOON_AUTH') return
      setUserId(event.data.userId || '')
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [])

  async function fetchAll() {
    setLoading(true)
    try {
      const [videoRes, topicRes] = await Promise.all([
        fetch('/api/viral-videos', { cache: 'no-store' }),
        fetch('/api/topic-signals', { cache: 'no-store' }),
      ])
      const videoData = await videoRes.json()
      const topicData = await topicRes.json()
      setVideos(videoData.videos ?? [])
      setTopics(topicData.topics ?? [])
    } catch (error) {
      setStatus({ type: 'error', msg: error instanceof Error ? error.message : '載入資料失敗' })
    } finally {
      setLoading(false)
    }
  }

  async function fetchKeywords() {
    const res = await fetch('/api/scan-keywords', { cache: 'no-store' })
    const data = await res.json()
    setKeywords(data.keywords ?? [])
  }

  async function handleScan() {
    setScanning(true)
    setStatus({ type: 'loading', msg: '正在掃描 YouTube 最新爆款影片...' })
    try {
      const res = await fetch('/api/scan', { method: 'POST' })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || '掃描失敗')
      setStatus({
        type: 'success',
        msg: `掃描完成：新增 ${data.results?.videos_saved ?? 0} 條影片，整理 ${data.results?.topics_saved ?? 0} 個話題信號。`,
      })
      await fetchAll()
    } catch (error) {
      setStatus({ type: 'error', msg: error instanceof Error ? error.message : '掃描失敗' })
    } finally {
      setScanning(false)
    }
  }

  async function handleSubmit() {
    if (!videoUrl.trim()) return
    setSaving(true)
    setStatus({ type: 'loading', msg: '正在分析並儲存影片...' })
    try {
      const res = await fetch('/api/viral-videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoUrl, description, region }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '儲存失敗')
      setStatus({ type: 'success', msg: `已儲存：${data.title_zh || data.title_original || '新影片'}` })
      setVideoUrl('')
      setDescription('')
      setRegion('')
      setAddPanelOpen(false)
      await fetchAll()
    } catch (error) {
      setStatus({ type: 'error', msg: error instanceof Error ? error.message : '儲存失敗' })
    } finally {
      setSaving(false)
    }
  }

  async function handleSelect(id: string, selected: boolean) {
    await fetch('/api/viral-videos', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, selected }),
    })
    setVideos((current) => current.map((video) => (video.id === id ? { ...video, selected } : video)))
  }

  async function handleDelete(id: string) {
    if (!window.confirm('確定刪除呢條影片？')) return
    await fetch(`/api/viral-videos?id=${id}`, { method: 'DELETE' })
    setVideos((current) => current.filter((video) => video.id !== id))
  }

  async function handleGenerateOutline(video: ViralVideo) {
    setOutliningId(video.id)
    setStatus({ type: 'loading', msg: '正在生成題材大綱...' })
    try {
      const res = await fetch('/api/outline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId: video.id }),
      })
      const data = await res.json()
      if (!res.ok || !data.success || !data.outlineId) throw new Error(data.error || '生成大綱失敗')
      let topic = video.title_zh || video.title_original || ''
      let background = video.ai_analysis || video.description || ''
      try {
        const content = typeof data.content === 'string' ? JSON.parse(data.content) : data.content
        topic = content?.pageTitle || topic
        background = content?.coreAngle || content?.caption || background
      } catch {
        // Keep fallback values.
      }
      window.parent.postMessage({
        type: 'SOON_NAVIGATE_TOOL',
        pipeline: 'youtube',
        tool: 'script',
        topic,
        background,
      }, '*')
    } catch (error) {
      setStatus({ type: 'error', msg: error instanceof Error ? error.message : '生成大綱失敗' })
    } finally {
      setOutliningId('')
    }
  }

  async function handleKeywordToggle(id: string, active: boolean) {
    const res = await fetch(`/api/scan-keywords?id=${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active }),
    })
    if (res.ok) {
      setKeywords((current) => current.map((keyword) => (keyword.id === id ? { ...keyword, active } : keyword)))
    }
  }

  async function handleAddKeyword() {
    if (!keywordInput.trim()) return
    const res = await fetch('/api/scan-keywords', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keyword: keywordInput.trim(), category: keywordCategory }),
    })
    if (res.ok) {
      setKeywordInput('')
      await fetchKeywords()
    }
  }

  async function handleSuggestKeywords() {
    if (guideStep < 2) {
      setGuideStep((step) => step + 1)
      return
    }

    setSuggestLoading(true)
    try {
      const res = await fetch('/api/suggest-keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: guideAnswers }),
      })
      const data = await res.json()
      const suggestions = Array.isArray(data.keywords) ? data.keywords : []
      setSuggestedKeywords(suggestions)
      setSelectedSuggestions(new Set(suggestions.map((_: unknown, index: number) => index)))
      setGuideStep(3)
    } catch {
      setSuggestedKeywords([])
    } finally {
      setSuggestLoading(false)
    }
  }

  async function handleAddSelectedSuggestions() {
    const toAdd = suggestedKeywords.filter((_, index) => selectedSuggestions.has(index))
    for (const keyword of toAdd) {
      await fetch('/api/scan-keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: keyword.keyword,
          category: keyword.category,
          active: true,
        }),
      })
    }

    await fetchKeywords()
    setAiGuideOpen(false)
    setGuideStep(0)
    setGuideAnswers({ topic: '', market: '', audience: '' })
    setSuggestedKeywords([])
    setSelectedSuggestions(new Set())
  }

  const sortedVideos = useMemo(() => {
    return [...videos].sort((a, b) => {
      if (sortBy === 'views') return b.views - a.views
      if (sortBy === 'created_at') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      return b.outlier_ratio - a.outlier_ratio
    })
  }, [videos, sortBy])

  const unselectedVideos = sortedVideos.filter((video) => !video.selected)
  const selectedVideos = sortedVideos.filter((video) => video.selected)
  const newTopics = topics.filter((topic) => topic.status === 'new').length
  const currentGuideQuestion = GUIDE_QUESTIONS[Math.min(guideStep, 2)]
  const currentGuideValue = guideAnswers[currentGuideQuestion.key]

  function VideoList({ list }: { list: ViralVideo[] }) {
    return (
      <div className="yt-card">
        <div className="yt-table-head">
          <div>影片</div>
          <div>Views</div>
          <div>Likes</div>
          <div>Comments</div>
          <div>Subscribers</div>
          <div>爆款指數</div>
          <div>地區</div>
          <div>操作</div>
        </div>
        {loading ? (
          <div className="yt-empty">載入中...</div>
        ) : list.length === 0 ? (
          <div className="yt-empty">未有影片資料</div>
        ) : (
          list.map((video) => {
            const expanded = expandedId === video.id
            const outlier = outlierStyle(video.outlier_ratio || 0)
            const title = video.title_zh || video.title_original || '未命名影片'
            return (
              <div key={video.id}>
                <div className="yt-video-row" onClick={() => setExpandedId(expanded ? '' : video.id)}>
                  <div>
                    <div className="yt-video-title">{title}</div>
                    {video.title_original && video.title_original !== title && (
                      <div className="yt-video-original">{video.title_original}</div>
                    )}
                    <div className="yt-meta">{video.channel_name}</div>
                    {video.region && <span className="yt-region">{video.region}</span>}
                  </div>
                  <div className="yt-cell-main">{formatNumber(video.views)}</div>
                  <div className="yt-cell-main">{formatNumber(video.likes)}</div>
                  <div className="yt-cell-main">{formatNumber(video.comments)}</div>
                  <div className="yt-cell-main">{formatNumber(video.subscribers)}</div>
                  <div>
                    <span className="yt-outlier" style={{ background: `${outlier.color}22`, color: outlier.color }}>
                      {(video.outlier_ratio || 0).toFixed(1)}x
                    </span>
                    <div className="yt-cell-sub">{outlier.label}</div>
                  </div>
                  <div className="yt-cell-main" style={{ fontSize: 13 }}>{video.region || '-'}</div>
                  <div className="yt-row-actions" onClick={(event) => event.stopPropagation()}>
                    {video.selected ? (
                      <button className="yt-small-btn yt-btn-remove" onClick={() => handleSelect(video.id, false)} type="button">
                        移出
                      </button>
                    ) : (
                      <button className="yt-small-btn yt-btn-select" onClick={() => handleSelect(video.id, true)} type="button">
                        選取
                      </button>
                    )}
                    <button
                      className="yt-small-btn yt-btn-script"
                      onClick={() => handleGenerateOutline(video)}
                      disabled={outliningId === video.id}
                      type="button"
                    >
                      {outliningId === video.id ? '生成中...' : '推去劇本'}
                    </button>
                    <button className="yt-small-btn yt-btn-delete" onClick={() => handleDelete(video.id)} type="button">
                      刪除
                    </button>
                  </div>
                </div>
                {expanded && (
                  <div className="yt-expand">
                    <div>
                      <div className="yt-expand-label">AI 分析</div>
                      <div className="yt-expand-text">{video.ai_analysis || '未有分析'}</div>
                    </div>
                    <div>
                      <div className="yt-expand-label">描述 / 來源</div>
                      <div className="yt-expand-text">{video.description || '未有描述'}</div>
                      <a href={video.video_url} target="_blank" rel="noreferrer" style={{ color: '#7c5cfc', fontSize: 13 }}>
                        打開 YouTube 影片
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    )
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="yt-shell">
        <main className="yt-main">
          <header className="yt-header">
            <div>
              <div className="yt-kicker">SOON 創意營運</div>
              <h1 className="yt-title">YouTube 題材靈感工作台</h1>
              <div className="yt-subtitle">目前已收藏 {videos.length} 條影片</div>
            </div>
            <div className="yt-actions">
              <button
                className="yt-action-btn"
                onClick={() => setActiveTab('signals')}
                style={{
                  background: activeTab === 'signals' ? '#7c5cfc' : 'transparent',
                  border: activeTab === 'signals' ? 'none' : '1px solid #7c5cfc',
                  color: activeTab === 'signals' ? 'white' : '#7c5cfc',
                }}
                type="button"
              >
                話題信號
              </button>
              <button
                className="yt-action-btn"
                onClick={() => setActiveTab('collection')}
                style={{
                  background: activeTab === 'collection' ? '#f59e0b' : 'transparent',
                  border: activeTab === 'collection' ? 'none' : '1px solid #f59e0b',
                  color: activeTab === 'collection' ? 'white' : '#f59e0b',
                }}
                type="button"
              >
                影片收藏
              </button>
              <button
                className="yt-action-btn"
                onClick={() => setActiveTab('selected')}
                style={{
                  background: activeTab === 'selected' ? '#0ea5e9' : 'transparent',
                  border: activeTab === 'selected' ? 'none' : '1px solid #0ea5e9',
                  color: activeTab === 'selected' ? 'white' : '#0ea5e9',
                }}
                type="button"
              >
                已選題目
              </button>
              <button
                className="yt-action-btn"
                onClick={handleScan}
                disabled={scanning}
                style={{ background: '#10b981', color: 'white', border: 'none' }}
                type="button"
              >
                {scanning ? '掃描中...' : '🔍 搜掘新爆款'}
              </button>
              <button
                className="yt-action-btn"
                onClick={() => {
                  setKeywordPanelOpen(true)
                  void fetchKeywords()
                }}
                style={{ background: 'transparent', border: '1px solid #2a2a3a', color: '#9090a8' }}
                type="button"
              >
                ⚙️ 關鍵字設定
              </button>
              <button
                className="yt-action-btn"
                onClick={() => setAddPanelOpen(true)}
                style={{ background: '#7c5cfc', color: 'white', border: 'none' }}
                type="button"
              >
                + 新增影片
              </button>
            </div>
          </header>

          <img className="yt-hero" src="/youtube-banner.jpg" alt="YouTube 題材靈感工作台" />
          {status && <div className={`yt-status ${status.type}`}>{status.msg}</div>}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: 13, color: '#9090a8' }}>
              {activeTab === 'signals' && `話題信號 ${newTopics > 0 ? `(${newTopics} 新)` : ''}`}
              {activeTab === 'collection' && `影片收藏 (${unselectedVideos.length})`}
              {activeTab === 'selected' && `已選題目 (${selectedVideos.length})`}
            </div>
            <select className="yt-sort" value={sortBy} onChange={(event) => setSortBy(event.target.value as typeof sortBy)}>
              <option value="outlier_ratio">排序：爆款指數</option>
              <option value="views">排序：播放量</option>
              <option value="created_at">排序：新增時間</option>
            </select>
          </div>

          {activeTab === 'signals' && (
            <section className="yt-topic-grid">
              {topics.length === 0 ? (
                <div className="yt-empty">
                  尚未有話題信號。<br />按「搜掘新爆款」開始發現近期題材。
                </div>
              ) : (
                [...topics]
                  .sort((a, b) => (b.max_outlier_ratio || 0) - (a.max_outlier_ratio || 0))
                  .map((topic) => {
                    const expanded = expandedId === topic.id
                    return (
                      <article className="yt-topic" key={topic.id} onClick={() => setExpandedId(expanded ? '' : topic.id)}>
                        <div className="yt-topic-main">
                          <div>
                            <div className="yt-topic-title">{topic.topic_zh || '未命名話題'}</div>
                            {topic.topic_en && <div className="yt-topic-en">{topic.topic_en}</div>}
                            {topic.related_channels && topic.related_channels.length > 0 && (
                              <div className="yt-topic-channels">{topic.related_channels.slice(0, 5).join(' · ')}</div>
                            )}
                          </div>
                          <div className="yt-topic-metric">
                            <div className="yt-topic-num">{topic.signal_count}</div>
                            <div className="yt-topic-label">信號數量</div>
                          </div>
                          <div className="yt-topic-metric">
                            <div className="yt-topic-num">{(topic.max_outlier_ratio || 0).toFixed(1)}x</div>
                            <div className="yt-topic-label">最高爆款</div>
                          </div>
                        </div>
                        {expanded && (
                          <div className="yt-expand">
                            <div>
                              <div className="yt-expand-label">AI 分析</div>
                              <div className="yt-expand-text">{topic.ai_analysis || '未有分析'}</div>
                            </div>
                            <div>
                              <div className="yt-expand-label">SOON 角度</div>
                              <div className="yt-expand-text">{topic.soon_angle || '未有建議'}</div>
                            </div>
                          </div>
                        )}
                      </article>
                    )
                  })
              )}
            </section>
          )}

          {activeTab === 'collection' && <VideoList list={unselectedVideos} />}
          {activeTab === 'selected' && <VideoList list={selectedVideos} />}
        </main>
      </div>

      {addPanelOpen && <div className="yt-panel-backdrop" onClick={() => setAddPanelOpen(false)} />}
      {addPanelOpen && (
        <div className="yt-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <span style={{ fontSize: 16, fontWeight: 600, color: '#f0f0f5' }}>新增影片</span>
            <button
              onClick={() => setAddPanelOpen(false)}
              style={{ background: 'transparent', border: 'none', color: '#9090a8', fontSize: 20, cursor: 'pointer' }}
              type="button"
            >
              ×
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <div className="yt-label">01 · YouTube URL</div>
              <input
                className="yt-input"
                value={videoUrl}
                onChange={(event) => setVideoUrl(event.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
              />
            </div>
            <div>
              <div className="yt-label">02 · 描述（你的觀察）</div>
              <textarea
                className="yt-textarea"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="點解覺得呢條片值得收藏？有咩特別嘅切入角度或爆款原因..."
              />
            </div>
            <div>
              <div className="yt-label">03 · 國家 / 地區</div>
              <select className="yt-select" value={region} onChange={(event) => setRegion(event.target.value)}>
                <option value="">選擇地區...</option>
                {REGIONS.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>
            <button className="yt-primary" onClick={handleSubmit} disabled={saving || !videoUrl.trim()} type="button">
              {saving ? '分析中...' : '分析並儲存'}
            </button>
          </div>
        </div>
      )}

      {keywordPanelOpen && <div className="yt-panel-backdrop" onClick={() => setKeywordPanelOpen(false)} />}
      {keywordPanelOpen && (
        <div className="yt-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <span style={{ fontSize: 16, fontWeight: 600, color: '#f0f0f5' }}>關鍵字設定</span>
            <button
              onClick={() => setKeywordPanelOpen(false)}
              style={{ background: 'transparent', border: 'none', color: '#9090a8', fontSize: 20, cursor: 'pointer' }}
              type="button"
            >
              ×
            </button>
          </div>

          <button
            onClick={() => setAiGuideOpen((open) => !open)}
            style={{
              width: '100%',
              padding: '12px',
              background: 'linear-gradient(135deg, #7c5cfc, #f59e0b)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              marginBottom: '16px',
            }}
            type="button"
          >
            ✨ AI 幫我設定關鍵字
          </button>

          {aiGuideOpen && guideStep < 3 && (
            <div style={{ background: '#16161f', border: '1px solid #2a2a3a', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
                {[0, 1, 2].map((index) => (
                  <div
                    key={index}
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: index <= guideStep ? '#7c5cfc' : '#2a2a3a',
                    }}
                  />
                ))}
              </div>

              <p style={{ fontSize: '15px', fontWeight: 600, color: '#f0f0f5', margin: '0 0 12px' }}>
                {currentGuideQuestion.question}
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                {currentGuideQuestion.options.map((option) => (
                  <button
                    key={option}
                    onClick={() => setGuideAnswers((prev) => ({ ...prev, [currentGuideQuestion.key]: option }))}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '999px',
                      border: currentGuideValue === option ? '1px solid #7c5cfc' : '1px solid #2a2a3a',
                      background: currentGuideValue === option ? 'rgba(124,92,252,0.2)' : 'transparent',
                      color: '#f0f0f5',
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                    type="button"
                  >
                    {option}
                  </button>
                ))}
              </div>

              <input
                placeholder={currentGuideQuestion.placeholder}
                value={currentGuideValue}
                onChange={(event) => setGuideAnswers((prev) => ({ ...prev, [currentGuideQuestion.key]: event.target.value }))}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: '#111118',
                  border: '1px solid #2a2a3a',
                  borderRadius: '8px',
                  color: '#f0f0f5',
                  fontSize: '13px',
                }}
              />

              <button
                onClick={handleSuggestKeywords}
                disabled={!currentGuideValue || suggestLoading}
                style={{
                  width: '100%',
                  marginTop: '12px',
                  padding: '10px',
                  background: '#7c5cfc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: !currentGuideValue || suggestLoading ? 'not-allowed' : 'pointer',
                  opacity: !currentGuideValue || suggestLoading ? 0.5 : 1,
                }}
                type="button"
              >
                {suggestLoading ? 'AI 分析中...' : guideStep < 2 ? '下一步 →' : '✨ 生成關鍵字建議'}
              </button>
            </div>
          )}

          {aiGuideOpen && guideStep === 3 && suggestedKeywords.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <p style={{ fontSize: '13px', color: '#9090a8', margin: '0 0 12px' }}>
                根據你嘅頻道特性，AI 建議以下關鍵字：
              </p>

              {suggestedKeywords.map((keyword, index) => (
                <div
                  key={`${keyword.keyword}-${index}`}
                  onClick={() => {
                    const next = new Set(selectedSuggestions)
                    if (next.has(index)) next.delete(index)
                    else next.add(index)
                    setSelectedSuggestions(next)
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    padding: '12px',
                    marginBottom: '8px',
                    background: selectedSuggestions.has(index) ? 'rgba(124,92,252,0.1)' : '#16161f',
                    border: `1px solid ${selectedSuggestions.has(index) ? '#7c5cfc' : '#2a2a3a'}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '4px',
                    flexShrink: 0,
                    marginTop: '2px',
                    background: selectedSuggestions.has(index) ? '#7c5cfc' : 'transparent',
                    border: `1px solid ${selectedSuggestions.has(index) ? '#7c5cfc' : '#3a3a50'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {selectedSuggestions.has(index) && <span style={{ color: 'white', fontSize: '12px' }}>✓</span>}
                  </div>
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 500, color: '#f0f0f5', margin: 0 }}>{keyword.keyword}</p>
                    <p style={{ fontSize: '11px', color: '#9090a8', margin: '2px 0 0' }}>
                      {keyword.category} · {keyword.reason}
                    </p>
                  </div>
                </div>
              ))}

              <button
                onClick={handleAddSelectedSuggestions}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  marginTop: '8px',
                }}
                type="button"
              >
                ✅ 加入已選 {selectedSuggestions.size} 個關鍵字
              </button>

              <button
                onClick={() => {
                  setGuideStep(0)
                  setSuggestedKeywords([])
                  setSelectedSuggestions(new Set())
                }}
                style={{
                  width: '100%',
                  padding: '10px',
                  marginTop: '8px',
                  background: 'transparent',
                  color: '#9090a8',
                  border: '1px solid #2a2a3a',
                  borderRadius: '8px',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
                type="button"
              >
                重新設定
              </button>
            </div>
          )}

          <div style={{ marginBottom: 20 }}>
            <div className="yt-label">新增掃描關鍵字</div>
            <input
              className="yt-input"
              value={keywordInput}
              onChange={(event) => setKeywordInput(event.target.value)}
              placeholder="例如：香港人移居海外生活"
              style={{ marginBottom: 8 }}
            />
            <select
              className="yt-select"
              value={keywordCategory}
              onChange={(event) => setKeywordCategory(event.target.value)}
              style={{ marginBottom: 8 }}
            >
              {KEYWORD_CATEGORIES.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <button className="yt-primary" type="button" onClick={handleAddKeyword} disabled={!keywordInput.trim()}>
              + 新增關鍵字
            </button>
          </div>

          <div className="yt-label">現有關鍵字</div>
          {keywords.length === 0 ? (
            <div style={{ color: '#5a5a72', fontSize: 13, padding: '20px 0' }}>未有關鍵字</div>
          ) : (
            keywords.map((keyword) => (
              <div className="yt-keyword-row" key={keyword.id}>
                <div>
                  <div style={{ color: '#f0f0f5', fontSize: 13, lineHeight: 1.4 }}>{keyword.keyword}</div>
                  <div style={{ color: '#5a5a72', fontSize: 11, marginTop: 3 }}>{keyword.category || 'Uncategorized'}</div>
                </div>
                <div style={{ color: keyword.active ? '#34d399' : '#5a5a72', fontSize: 12 }}>
                  {keyword.active ? 'Active' : 'Inactive'}
                </div>
                <button
                  type="button"
                  className={`yt-switch ${keyword.active ? 'active' : ''}`}
                  onClick={() => handleKeywordToggle(keyword.id, !keyword.active)}
                  aria-label={`Toggle ${keyword.keyword}`}
                >
                  <span />
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </>
  )
}
