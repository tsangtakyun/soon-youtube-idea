'use client'

import { useEffect, useMemo, useState } from 'react'
import { buildHandoffUrlFromOutline } from '@/lib/script-handoff'

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
  related_channels: string[]
  ai_analysis: string | null
  soon_angle: string | null
  status: string
}

const REGIONS = [
  '香港',
  '日本',
  '韓國',
  '台灣',
  '東南亞',
  '中國',
  '歐美',
  'Rich Asia',
  'Poor Asia',
  'Culture',
  'Travel',
  'Food',
  'Lifestyle',
]

const CSS = `
* { box-sizing: border-box; }
body { background: #0a0a0f; color: #f0f0f5; font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
.yt-shell { min-height: 100vh; background: #0a0a0f; display: grid; grid-template-columns: 280px minmax(0, 1fr); }
.yt-sidebar { background: #16161f; border-right: 1px solid #2a2a3a; padding: 28px 20px; display: flex; flex-direction: column; gap: 20px; }
.yt-kicker { font-size: 12px; letter-spacing: .18em; color: #7c5cfc; text-transform: uppercase; }
.yt-side-title { font-size: 24px; font-weight: 700; color: #fff; line-height: 1.2; margin-top: 6px; }
.yt-divider { height: 1px; background: #2a2a3a; }
.yt-label { font-size: 12px; color: #a7a7c4; margin-bottom: 8px; }
.yt-input, .yt-textarea, .yt-select { width: 100%; background: #111118; color: #f0f0f5; border: 1px solid #2a2a3a; border-radius: 10px; padding: 11px 12px; font-size: 14px; outline: none; }
.yt-textarea { min-height: 82px; resize: vertical; line-height: 1.5; }
.yt-input:focus, .yt-textarea:focus, .yt-select:focus { border-color: #7c5cfc; }
.yt-select option { background: #111118; color: #f0f0f5; }
.yt-primary { width: 100%; background: #7c5cfc; color: #fff; border: none; border-radius: 10px; padding: 12px 14px; font-size: 14px; font-weight: 600; cursor: pointer; }
.yt-primary:disabled { opacity: .45; cursor: not-allowed; }
.yt-status { border-radius: 10px; padding: 12px; font-size: 13px; line-height: 1.5; }
.yt-status.loading { background: rgba(124,92,252,.12); color: #c4b5fd; }
.yt-status.success { background: rgba(16,185,129,.12); color: #34d399; }
.yt-status.error { background: rgba(239,68,68,.12); color: #fca5a5; }
.yt-main { padding: 32px 32px 64px; display: flex; flex-direction: column; gap: 24px; }
.yt-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
.yt-title { font-size: 40px; line-height: 1.05; letter-spacing: -.04em; margin: 0; color: #fff; }
.yt-subtitle { margin-top: 8px; font-size: 14px; color: #a7a7c4; }
.yt-actions { display: flex; gap: 10px; align-items: center; }
.yt-scan { background: transparent; color: #0ea5e9; border: 1px solid #0ea5e9; border-radius: 10px; padding: 9px 14px; font-size: 13px; font-weight: 600; cursor: pointer; }
.yt-scan:disabled { opacity: .45; cursor: not-allowed; }
.yt-sort { background: #111118; color: #f0f0f5; border: 1px solid #2a2a3a; border-radius: 10px; padding: 9px 12px; font-size: 13px; }
.yt-stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
.yt-stat-card { background: #16161f; border: 1px solid #2a2a3a; border-radius: 14px; padding: 18px 20px; }
.yt-stat-num { font-size: 32px; font-weight: 700; color: #fff; }
.yt-stat-label { margin-top: 6px; font-size: 12px; color: #a7a7c4; }
.yt-tabs { display: flex; gap: 8px; }
.yt-tab { background: transparent; color: #a7a7c4; border: 1px solid #2a2a3a; border-radius: 10px; padding: 8px 18px; font-size: 14px; cursor: pointer; }
.yt-tab.active { background: #7c5cfc; color: #fff; border-color: #7c5cfc; }
.yt-card { background: #16161f; border: 1px solid #2a2a3a; border-radius: 14px; overflow: hidden; }
.yt-table-head, .yt-video-row { display: grid; grid-template-columns: minmax(0, 2fr) 100px 100px 100px 120px 110px 90px 160px; gap: 10px; align-items: center; }
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
@media (max-width: 1200px) {
  .yt-shell { grid-template-columns: 1fr; }
  .yt-sidebar { border-right: none; border-bottom: 1px solid #2a2a3a; }
  .yt-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .yt-table-head { display: none; }
  .yt-video-row { grid-template-columns: 1fr; }
}
`

function repairText(value: unknown) {
  if (typeof value !== 'string') return ''
  if (!/[ÃÂæäåçèéïð]/.test(value)) return value
  try {
    const bytes = Array.from(value, (char) => char.charCodeAt(0) & 0xff)
    const decoded = new TextDecoder('utf-8').decode(new Uint8Array(bytes))
    return decoded.includes('�') ? value : decoded
  } catch {
    return value
  }
}

function formatNumber(value: number) {
  if (!Number.isFinite(value)) return '0'
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${Math.round(value / 1_000)}K`
  return String(value)
}

function outlierStyle(ratio: number) {
  if (ratio >= 5) return { label: '高爆', color: '#ef4444' }
  if (ratio >= 2) return { label: '潛力', color: '#f59e0b' }
  if (ratio >= 0.5) return { label: '正常', color: '#22c55e' }
  return { label: '低', color: '#6b7280' }
}

export default function HomePage() {
  const [videoUrl, setVideoUrl] = useState('')
  const [description, setDescription] = useState('')
  const [region, setRegion] = useState('')
  const [videos, setVideos] = useState<ViralVideo[]>([])
  const [topics, setTopics] = useState<TopicSignal[]>([])
  const [activeTab, setActiveTab] = useState<'topics' | 'videos' | 'selected'>('topics')
  const [sortBy, setSortBy] = useState<'outlier_ratio' | 'views' | 'created_at'>('outlier_ratio')
  const [expandedId, setExpandedId] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [status, setStatus] = useState<{ type: 'loading' | 'success' | 'error'; msg: string } | null>(null)
  const [outliningId, setOutliningId] = useState('')

  useEffect(() => {
    void fetchAll()
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

  async function handleScan() {
    setScanning(true)
    setStatus({ type: 'loading', msg: '正在掃描 YouTube 爆款資料...' })
    try {
      const res = await fetch('/api/scan', { method: 'POST' })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || '掃描失敗')
      setStatus({
        type: 'success',
        msg: `掃描完成：新增 ${data.results?.videos_saved ?? 0} 條影片，${data.results?.topics_saved ?? 0} 個話題信號`,
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
      setStatus({ type: 'success', msg: `已儲存：${repairText(data.title_zh || data.title_original)}` })
      setVideoUrl('')
      setDescription('')
      setRegion('')
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
    setStatus({ type: 'loading', msg: '正在生成劇本大綱...' })
    try {
      const res = await fetch('/api/outline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId: video.id }),
      })
      const data = await res.json()
      if (!res.ok || !data.success || !data.outlineId) throw new Error(data.error || '生成大綱失敗')
      const handoffUrl = buildHandoffUrlFromOutline({
        id: data.outlineId,
        video_id: video.id,
        content: typeof data.content === 'string' ? data.content : JSON.stringify(data.content ?? {}),
      })
      window.location.href = handoffUrl
    } catch (error) {
      setStatus({ type: 'error', msg: error instanceof Error ? error.message : '生成大綱失敗' })
    } finally {
      setOutliningId('')
    }
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
  const totalViews = videos.reduce((sum, video) => sum + (video.views || 0), 0)
  const avgOutlier = videos.length
    ? (videos.reduce((sum, video) => sum + (video.outlier_ratio || 0), 0) / videos.length).toFixed(1)
    : '0.0'
  const topOutlier = videos.length ? Math.max(...videos.map((video) => video.outlier_ratio || 0)).toFixed(1) : '0.0'
  const newTopics = topics.filter((topic) => topic.status === 'new').length

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
            const title = repairText(video.title_zh) || repairText(video.title_original) || '未命名影片'
            const original = repairText(video.title_original)
            return (
              <div key={video.id}>
                <div className="yt-video-row" onClick={() => setExpandedId(expanded ? '' : video.id)}>
                  <div>
                    <div className="yt-video-title">{title}</div>
                    {original && original !== title && <div className="yt-video-original">{original}</div>}
                    <div className="yt-meta">{repairText(video.channel_name)}</div>
                    {video.region && <span className="yt-region">{repairText(video.region)}</span>}
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
                  <div className="yt-cell-main" style={{ fontSize: 13 }}>{repairText(video.region) || '-'}</div>
                  <div className="yt-row-actions" onClick={(event) => event.stopPropagation()}>
                    {video.selected ? (
                      <button className="yt-small-btn yt-btn-remove" onClick={() => handleSelect(video.id, false)} type="button">
                        取消
                      </button>
                    ) : (
                      <button className="yt-small-btn yt-btn-select" onClick={() => handleSelect(video.id, true)} type="button">
                        收藏
                      </button>
                    )}
                    <button
                      className="yt-small-btn yt-btn-script"
                      onClick={() => handleGenerateOutline(video)}
                      disabled={outliningId === video.id}
                      type="button"
                    >
                      {outliningId === video.id ? '生成中' : '推上劇本'}
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
                      <div className="yt-expand-text">{repairText(video.ai_analysis) || '未有分析'}</div>
                    </div>
                    <div>
                      <div className="yt-expand-label">描述 / 連結</div>
                      <div className="yt-expand-text">{repairText(video.description) || '未有描述'}</div>
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
        <aside className="yt-sidebar">
          <div>
            <div className="yt-kicker">SOON Internal</div>
            <div className="yt-side-title">爆款影片<br />收藏庫</div>
          </div>
          <div className="yt-divider" />
          <div className="yt-kicker">新增影片</div>
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
          {status && <div className={`yt-status ${status.type}`}>{status.msg}</div>}
        </aside>

        <main className="yt-main">
          <header className="yt-header">
            <div>
              <div className="yt-kicker">SOON Internal</div>
              <h1 className="yt-title">YouTube Idea Collection</h1>
              <div className="yt-subtitle">按 Views ÷ Subscribers 排列，快速捕捉可轉化成 SOON 內容嘅高爆訊號。</div>
            </div>
            <div className="yt-actions">
              <button className="yt-scan" onClick={handleScan} disabled={scanning} type="button">
                {scanning ? '掃描中...' : '🔍 掃描新爆款'}
              </button>
              <select className="yt-sort" value={sortBy} onChange={(event) => setSortBy(event.target.value as typeof sortBy)}>
                <option value="outlier_ratio">排序：爆款指數</option>
                <option value="views">排序：觀看數</option>
                <option value="created_at">排序：最新加入</option>
              </select>
            </div>
          </header>

          <section className="yt-stats">
            <div className="yt-stat-card"><div className="yt-stat-num">{videos.length}</div><div className="yt-stat-label">已收藏影片</div></div>
            <div className="yt-stat-card"><div className="yt-stat-num">{formatNumber(totalViews)}</div><div className="yt-stat-label">總播放量</div></div>
            <div className="yt-stat-card"><div className="yt-stat-num">{avgOutlier}x</div><div className="yt-stat-label">平均爆款指數</div></div>
            <div className="yt-stat-card"><div className="yt-stat-num">{topOutlier}x</div><div className="yt-stat-label">最高爆款指數</div></div>
          </section>

          <nav className="yt-tabs">
            <button className={`yt-tab${activeTab === 'topics' ? ' active' : ''}`} onClick={() => setActiveTab('topics')} type="button">
              話題信號 {newTopics > 0 ? `(${newTopics})` : ''}
            </button>
            <button className={`yt-tab${activeTab === 'videos' ? ' active' : ''}`} onClick={() => setActiveTab('videos')} type="button">
              影片收藏 ({unselectedVideos.length})
            </button>
            <button className={`yt-tab${activeTab === 'selected' ? ' active' : ''}`} onClick={() => setActiveTab('selected')} type="button">
              已選題目 ({selectedVideos.length})
            </button>
          </nav>

          {activeTab === 'topics' && (
            <section className="yt-topic-grid">
              {topics.length === 0 ? (
                <div className="yt-empty">尚未有話題信號。<br />按右上角「掃描新爆款」開始發現題材。</div>
              ) : (
                [...topics]
                  .sort((a, b) => (b.max_outlier_ratio || 0) - (a.max_outlier_ratio || 0))
                  .map((topic) => {
                    const expanded = expandedId === topic.id
                    return (
                      <article className="yt-topic" key={topic.id} onClick={() => setExpandedId(expanded ? '' : topic.id)}>
                        <div className="yt-topic-main">
                          <div>
                            <div className="yt-topic-title">{repairText(topic.topic_zh) || '未命名話題'}</div>
                            {topic.topic_en && <div className="yt-topic-en">{repairText(topic.topic_en)}</div>}
                            {topic.related_channels?.length > 0 && (
                              <div className="yt-topic-channels">{topic.related_channels.slice(0, 5).map(repairText).join(' · ')}</div>
                            )}
                          </div>
                          <div className="yt-topic-metric">
                            <div className="yt-topic-num">{topic.signal_count}</div>
                            <div className="yt-topic-label">信號數</div>
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
                              <div className="yt-expand-text">{repairText(topic.ai_analysis) || '未有分析'}</div>
                            </div>
                            <div>
                              <div className="yt-expand-label">SOON 角度</div>
                              <div className="yt-expand-text">{repairText(topic.soon_angle) || '未有建議'}</div>
                            </div>
                          </div>
                        )}
                      </article>
                    )
                  })
              )}
            </section>
          )}

          {activeTab === 'videos' && <VideoList list={unselectedVideos} />}
          {activeTab === 'selected' && <VideoList list={selectedVideos} />}
        </main>
      </div>
    </>
  )
}
