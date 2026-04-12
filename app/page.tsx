'use client'

import { useEffect, useState } from 'react'

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
  '中國大陸', '香港', '台灣', '日本', '韓國',
  '泰國', '印尼', '菲律賓', '越南', '馬來西亞',
  '新加坡', '印度', '其他亞洲', '其他',
]

function fmtNum(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`
  return String(n)
}

function outlierLabel(ratio: number) {
  if (ratio >= 5) return { label: '十分爆', color: '#ff6b6b' }
  if (ratio >= 2) return { label: '爆', color: '#ffa94d' }
  if (ratio >= 0.5) return { label: '普通', color: '#a9e34b' }
  return { label: '低', color: '#868e96' }
}

const CSS = `
* { box-sizing: border-box; margin: 0; padding: 0; }
body { background: #13141f; color: #e8eaf6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
.shell { display: grid; grid-template-columns: 280px minmax(0, 1fr); min-height: 100vh; }
.sidebar { background: #1a1c2e; border-right: 1px solid rgba(255,255,255,0.07); padding: 24px 18px; display: flex; flex-direction: column; gap: 20px; position: sticky; top: 0; height: 100vh; overflow-y: auto; }
.logo { font-size: 13px; letter-spacing: 0.2em; color: #7c83d6; text-transform: uppercase; }
.logo-title { font-size: 22px; font-weight: 700; color: #e8eaf6; margin-top: 4px; line-height: 1.2; }
.divider { height: 1px; background: rgba(255,255,255,0.07); }
.section-label { font-size: 11px; letter-spacing: 0.16em; color: #6b74c4; text-transform: uppercase; }
.field-group { display: flex; flex-direction: column; gap: 8px; }
.field-label { font-size: 13px; color: #a5adde; }
input, textarea, select { width: 100%; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; color: #e8eaf6; padding: 10px 12px; font-size: 14px; font-family: inherit; outline: none; transition: border-color 0.15s; }
input:focus, textarea:focus, select:focus { border-color: rgba(124,131,214,0.6); }
input::placeholder, textarea::placeholder { color: rgba(165,173,222,0.35); }
textarea { min-height: 80px; resize: vertical; }
select option { background: #1a1c2e; }
.btn-primary { width: 100%; padding: 13px; border-radius: 12px; border: none; background: linear-gradient(135deg, #7c83d6, #5c6bc0); color: #fff; font-size: 15px; font-weight: 700; cursor: pointer; transition: opacity 0.15s; }
.btn-primary:disabled { opacity: 0.45; cursor: not-allowed; }
.status-box { padding: 12px 14px; border-radius: 10px; font-size: 13px; line-height: 1.6; }
.status-box.success { background: rgba(105,219,124,0.12); color: #8ce99a; }
.status-box.error { background: rgba(255,107,107,0.12); color: #ffa8a8; }
.status-box.loading { background: rgba(124,131,214,0.12); color: #bac0f0; }
.preview-box { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 12px; padding: 14px; display: flex; flex-direction: column; gap: 8px; }
.preview-title { font-size: 15px; font-weight: 600; color: #e8eaf6; line-height: 1.4; }
.preview-meta { font-size: 12px; color: #6b74c4; }
.preview-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 4px; }
.preview-stat { background: rgba(255,255,255,0.04); border-radius: 8px; padding: 8px; text-align: center; }
.preview-stat-num { font-size: 16px; font-weight: 700; color: #e8eaf6; }
.preview-stat-label { font-size: 10px; color: #6b74c4; text-transform: uppercase; letter-spacing: 0.1em; margin-top: 3px; }
.main { padding: 28px 28px 60px; display: flex; flex-direction: column; gap: 24px; }
.main-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
.main-title { font-size: 36px; font-weight: 700; letter-spacing: -0.03em; line-height: 1; }
.main-sub { font-size: 14px; color: #7c83d6; margin-top: 6px; }
.sort-row { display: flex; align-items: center; gap: 10px; font-size: 13px; color: #7c83d6; }
.sort-row select { width: auto; padding: 7px 10px; font-size: 13px; }
.stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
.stat-card { background: #1a1c2e; border: 1px solid rgba(255,255,255,0.07); border-radius: 16px; padding: 18px 20px; }
.stat-card-num { font-size: 32px; font-weight: 700; line-height: 1; }
.stat-card-label { font-size: 12px; color: #6b74c4; letter-spacing: 0.12em; text-transform: uppercase; margin-top: 8px; }
.tabs { display: flex; gap: 8px; }
.tab { padding: 8px 18px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.07); background: transparent; color: #6b74c4; font-size: 14px; cursor: pointer; transition: all 0.15s; }
.tab.active { background: rgba(124,131,214,0.2); color: #e8eaf6; border-color: rgba(124,131,214,0.4); }
.scan-btn { padding: 10px 18px; border-radius: 12px; border: 1px solid rgba(124,131,214,0.4); background: rgba(124,131,214,0.1); color: #a5adde; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.15s; white-space: nowrap; }
.scan-btn:hover { background: rgba(124,131,214,0.2); color: #e8eaf6; }
.scan-btn:disabled { opacity: 0.45; cursor: not-allowed; }
.scan-result { font-size: 12px; color: #8ce99a; margin-top: 4px; text-align: right; }
.scan-result.error { color: #ffa8a8; }
.table-wrap { background: #1a1c2e; border: 1px solid rgba(255,255,255,0.07); border-radius: 20px; overflow: hidden; }
.table-head { display: grid; grid-template-columns: minmax(0,2fr) 100px 100px 100px 120px 90px 70px 60px 60px; padding: 14px 20px; border-bottom: 1px solid rgba(255,255,255,0.07); font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: #6b74c4; }
.table-body { display: flex; flex-direction: column; }
.video-row { display: grid; grid-template-columns: minmax(0,2fr) 100px 100px 100px 120px 90px 70px 60px 60px; padding: 16px 20px; border-bottom: 1px solid rgba(255,255,255,0.05); align-items: start; transition: background 0.1s; cursor: pointer; }
.video-row:hover { background: rgba(255,255,255,0.02); }
.video-row:last-child { border-bottom: none; }
.video-title-zh { font-size: 15px; font-weight: 600; color: #e8eaf6; line-height: 1.35; }
.video-title-en { font-size: 12px; color: #6b74c4; margin-top: 4px; line-height: 1.4; }
.video-channel { font-size: 12px; color: #7c83d6; margin-top: 6px; }
.video-region { display: inline-block; margin-top: 6px; font-size: 11px; padding: 3px 8px; border-radius: 999px; background: rgba(124,131,214,0.15); color: #a5adde; }
.col-val { font-size: 15px; font-weight: 600; color: #e8eaf6; padding-top: 2px; }
.col-sub { font-size: 11px; color: #6b74c4; margin-top: 3px; }
.outlier-badge { display: inline-flex; align-items: center; justify-content: center; border-radius: 8px; padding: 6px 10px; font-size: 13px; font-weight: 700; }
.action-btn { border: none; border-radius: 8px; padding: 6px 10px; font-size: 12px; cursor: pointer; font-weight: 600; transition: opacity 0.15s; }
.action-btn:hover { opacity: 0.8; }
.btn-select { background: rgba(105,219,124,0.15); color: #8ce99a; }
.btn-delete { background: rgba(255,107,107,0.15); color: #ffa8a8; }
.btn-unselect { background: rgba(255,165,0,0.15); color: #ffa94d; }
.btn-outline { background: rgba(124,131,214,0.15); color: #a5adde; }
.expand-row { grid-column: 1 / -1; background: rgba(255,255,255,0.02); border-top: 1px solid rgba(255,255,255,0.05); padding: 16px 20px; display: flex; flex-direction: column; gap: 10px; }
.expand-label { font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: #6b74c4; margin-bottom: 4px; }
.expand-text { font-size: 14px; color: #c5caf0; line-height: 1.7; }
.expand-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.topics-section { display: flex; flex-direction: column; gap: 12px; }
.topic-card { background: #1a1c2e; border: 1px solid rgba(255,255,255,0.07); border-radius: 16px; padding: 18px 20px; cursor: pointer; transition: background 0.1s; }
.topic-card:hover { background: rgba(255,255,255,0.02); }
.topic-card.new { border-color: rgba(124,131,214,0.35); }
.topic-card-main { display: grid; grid-template-columns: minmax(0,1fr) 110px 110px; gap: 16px; align-items: start; }
.topic-zh { font-size: 18px; font-weight: 700; color: #e8eaf6; line-height: 1.3; }
.topic-en { font-size: 12px; color: #6b74c4; margin-top: 4px; }
.topic-channels { font-size: 12px; color: #7c83d6; margin-top: 8px; line-height: 1.6; }
.new-badge { display: inline-block; font-size: 10px; padding: 2px 8px; border-radius: 999px; background: rgba(124,131,214,0.2); color: #a5adde; letter-spacing: 0.1em; text-transform: uppercase; margin-left: 8px; vertical-align: middle; }
.topic-metric { text-align: center; }
.topic-metric-num { font-size: 28px; font-weight: 700; color: #e8eaf6; }
.topic-metric-label { font-size: 11px; color: #6b74c4; text-transform: uppercase; letter-spacing: 0.12em; margin-top: 4px; }
.topic-expand { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 14px; margin-top: 14px; }
.topic-expand-label { font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: #6b74c4; margin-bottom: 6px; }
.topic-expand-text { font-size: 14px; color: #c5caf0; line-height: 1.7; }
.selected-section { display: flex; flex-direction: column; gap: 12px; }
.selected-card { background: #1a1c2e; border: 1px solid rgba(105,219,124,0.2); border-radius: 16px; padding: 18px 20px; display: grid; grid-template-columns: minmax(0,1fr) auto; gap: 16px; align-items: start; }
.selected-title { font-size: 18px; font-weight: 700; color: #e8eaf6; line-height: 1.3; }
.selected-meta { font-size: 13px; color: #7c83d6; margin-top: 6px; }
.selected-stats { display: flex; gap: 16px; margin-top: 10px; }
.selected-stat { font-size: 13px; color: #a5adde; }
.selected-stat span { color: #e8eaf6; font-weight: 700; }
.empty-state { padding: 60px 20px; text-align: center; color: #6b74c4; font-size: 15px; line-height: 1.8; }
@media (max-width: 1100px) {
  .shell { grid-template-columns: 1fr; }
  .sidebar { position: static; height: auto; }
  .table-head, .video-row { grid-template-columns: 1fr 1fr 1fr; }
  .stats-row { grid-template-columns: repeat(2, 1fr); }
  .topic-card-main { grid-template-columns: 1fr; }
}
`

export default function HomePage() {
  const [videoUrl, setVideoUrl] = useState('')
  const [description, setDescription] = useState('')
  const [region, setRegion] = useState('')
  const [isPending, setIsPending] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'loading'; msg: string } | null>(null)
  const [preview, setPreview] = useState<Partial<ViralVideo> | null>(null)
  const [videos, setVideos] = useState<ViralVideo[]>([])
  const [topics, setTopics] = useState<TopicSignal[]>([])
  const [sortBy, setSortBy] = useState<'outlier_ratio' | 'views' | 'created_at'>('outlier_ratio')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [loadingVideos, setLoadingVideos] = useState(true)
  const [activeTab, setActiveTab] = useState<'videos' | 'topics' | 'selected'>('topics')
  const [isScanning, setIsScanning] = useState(false)
  const [scanResult, setScanResult] = useState<{ msg: string; ok: boolean } | null>(null)
  const [outliningId, setOutliningId] = useState<string | null>(null)
  const [outlineProgress, setOutlineProgress] = useState(0)

  useEffect(() => { fetchVideos(); fetchTopics() }, [])

  useEffect(() => {
    if (!outliningId) {
      setOutlineProgress(0)
      return
    }

    const timer = window.setInterval(() => {
      setOutlineProgress((current) => {
        if (current >= 92) return current
        if (current < 30) return current + 9
        if (current < 60) return current + 6
        return current + 3
      })
    }, 350)

    return () => window.clearInterval(timer)
  }, [outliningId])

  async function fetchVideos() {
    setLoadingVideos(true)
    try {
      const res = await fetch('/api/viral-videos')
      const data = await res.json()
      setVideos(data.videos ?? [])
    } catch { /* silent */ } finally { setLoadingVideos(false) }
  }

  async function fetchTopics() {
    try {
      const res = await fetch('/api/topic-signals')
      const data = await res.json()
      setTopics(data.topics ?? [])
    } catch { /* silent */ }
  }

  async function handleScan() {
    setIsScanning(true); setScanResult(null)
    try {
      const res = await fetch('/api/scan', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        setScanResult({ ok: true, msg: `✓ 掃描完成：${data.results.videos_saved} 條新片，${data.results.topics_saved} 個新話題` })
        await fetchVideos(); await fetchTopics()
      } else { setScanResult({ ok: false, msg: `✗ ${data.error ?? '掃描失敗'}` }) }
    } catch { setScanResult({ ok: false, msg: '✗ 網絡錯誤' }) }
    finally { setIsScanning(false) }
  }

  async function handleSubmit() {
    if (!videoUrl.trim()) return
    setIsPending(true)
    setStatus({ type: 'loading', msg: '正在拉取數據同分析中，請稍候…' })
    setPreview(null)
    try {
      const res = await fetch('/api/viral-videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoUrl, description, region }),
      })
      const data = await res.json()
      if (!res.ok) { setStatus({ type: 'error', msg: data.error ?? '未知錯誤' }); return }
      setPreview(data)
      setStatus({ type: 'success', msg: `✓ 已儲存：${data.title_zh || data.title_original}` })
      setVideoUrl(''); setDescription(''); setRegion('')
      await fetchVideos()
    } catch (err) {
      setStatus({ type: 'error', msg: err instanceof Error ? err.message : '網絡錯誤' })
    } finally { setIsPending(false) }
  }

  async function handleGenerateOutline(id: string) {
    setOutliningId(id)
    setOutlineProgress(6)
    try {
      const res = await fetch('/api/outline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId: id }),
      })
      const data = await res.json()
      if (data.success) {
        setOutlineProgress(100)
        window.open(`/outline/${data.outlineId}`, '_blank')
      }
    } finally {
      window.setTimeout(() => {
        setOutliningId((current) => (current === id ? null : current))
        setOutlineProgress(0)
      }, 450)
    }
  }

  async function handleDelete(id: string) {
    try {
      await fetch(`/api/viral-videos?id=${id}`, { method: 'DELETE' })
      setVideos(prev => prev.filter(v => v.id !== id))
    } catch { /* silent */ }
  }

  async function handleSelect(id: string, selected: boolean) {
    try {
      await fetch('/api/viral-videos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, selected }),
      })
      setVideos(prev => prev.map(v => v.id === id ? { ...v, selected } : v))
    } catch { /* silent */ }
  }

  const unselected = [...videos].filter(v => !v.selected).sort((a, b) => {
    if (sortBy === 'outlier_ratio') return b.outlier_ratio - a.outlier_ratio
    if (sortBy === 'views') return b.views - a.views
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })
  const selected = videos.filter(v => v.selected)

  const totalViews = videos.reduce((s, v) => s + v.views, 0)
  const avgOutlier = videos.length ? (videos.reduce((s, v) => s + v.outlier_ratio, 0) / videos.length).toFixed(1) : '0.0'
  const topOutlier = videos.length ? Math.max(...videos.map(v => v.outlier_ratio)).toFixed(1) : '0.0'
  const newTopics = topics.filter(t => t.status === 'new').length

  function VideoTable({ list }: { list: ViralVideo[] }) {
    return (
      <div className="table-wrap">
        <div className="table-head">
          <div>影片</div><div>Views</div><div>Likes</div><div>Comments</div><div>Subscribers</div><div>爆款指數</div><div>地區</div><div>已選</div><div>刪除</div>
        </div>
        <div className="table-body">
          {loadingVideos ? (
            <div className="empty-state">載入中…</div>
          ) : list.length === 0 ? (
            <div className="empty-state">尚未有影片</div>
          ) : list.map(v => {
            const ol = outlierLabel(v.outlier_ratio)
            const isExp = expandedId === v.id
            return (
              <div key={v.id}>
                <div className="video-row" onClick={() => setExpandedId(isExp ? null : v.id)}>
                  <div>
                    <div className="video-title-zh">{v.title_zh || v.title_original}</div>
                    {v.title_zh && v.title_original && <div className="video-title-en">{v.title_original}</div>}
                    <div className="video-channel">{v.channel_name}</div>
                    {v.region && <span className="video-region">{v.region}</span>}
                  </div>
                  <div><div className="col-val">{fmtNum(v.views)}</div></div>
                  <div><div className="col-val">{fmtNum(v.likes)}</div></div>
                  <div><div className="col-val">{fmtNum(v.comments)}</div></div>
                  <div><div className="col-val">{fmtNum(v.subscribers)}</div></div>
                  <div>
                    <div className="outlier-badge" style={{ background: ol.color + '22', color: ol.color }}>{v.outlier_ratio.toFixed(1)}x</div>
                    <div className="col-sub">{ol.label}</div>
                  </div>
                  <div><div className="col-val" style={{ fontSize: '13px' }}>{v.region ?? '—'}</div></div>
                  <div onClick={e => e.stopPropagation()}>
                    {v.selected ? (
                      <button className="action-btn btn-unselect" onClick={() => handleSelect(v.id, false)} type="button">取消</button>
                    ) : (
                      <button className="action-btn btn-select" onClick={() => handleSelect(v.id, true)} type="button">已選</button>
                    )}
                  </div>
                  <div onClick={e => e.stopPropagation()}>
                    <button className="action-btn btn-delete" onClick={() => handleDelete(v.id)} type="button">刪除</button>
                  </div>
                </div>
                {isExp && (
                  <div className="expand-row">
                    <div className="expand-grid">
                      {v.ai_analysis && <div><div className="expand-label">AI 內容分析</div><div className="expand-text">{v.ai_analysis}</div></div>}
                      {v.description && <div><div className="expand-label">你的觀察</div><div className="expand-text">{v.description}</div></div>}
                    </div>
                    <a href={v.video_url} target="_blank" rel="noreferrer" style={{ color: '#7c83d6', fontSize: '13px' }} onClick={e => e.stopPropagation()}>→ 睇原片 ↗</a>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="shell">
        <aside className="sidebar">
          <div>
            <div className="logo">SOON · Internal</div>
            <div className="logo-title">爆款影片<br />收藏庫</div>
          </div>
          <div className="divider" />
          <div className="section-label">新增影片</div>
          <div className="field-group">
            <div className="field-label">01 · YouTube URL</div>
            <input value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=..." onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
          </div>
          <div className="field-group">
            <div className="field-label">02 · 描述（你的觀察）</div>
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="點解覺得呢條片值得收藏？有咩特別嘅切入角度或爆款原因…" />
          </div>
          <div className="field-group">
            <div className="field-label">03 · 國家 / 地區</div>
            <select value={region} onChange={e => setRegion(e.target.value)}>
              <option value="">選擇地區…</option>
              {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <button className="btn-primary" onClick={handleSubmit} disabled={isPending || !videoUrl.trim()} type="button">
            {isPending ? '分析中…' : '分析並儲存'}
          </button>
          {status && <div className={`status-box ${status.type}`}>{status.msg}</div>}
          {preview && (
            <div className="preview-box">
              <div className="preview-title">{preview.title_zh}</div>
              <div className="preview-meta">{preview.title_original}</div>
              <div className="preview-stats">
                <div className="preview-stat"><div className="preview-stat-num">{fmtNum(preview.views ?? 0)}</div><div className="preview-stat-label">Views</div></div>
                <div className="preview-stat"><div className="preview-stat-num">{fmtNum(preview.subscribers ?? 0)}</div><div className="preview-stat-label">Subs</div></div>
                <div className="preview-stat"><div className="preview-stat-num">{(preview.outlier_ratio ?? 0).toFixed(1)}x</div><div className="preview-stat-label">爆款</div></div>
              </div>
            </div>
          )}
        </aside>
        <main className="main">
          <div className="main-header">
            <div>
              <div className="main-title">Youtube Idea Collection</div>
              <div className="main-sub">按 Views ÷ Subscribers 排列 · 數字愈高愈爆</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button className="scan-btn" onClick={handleScan} disabled={isScanning} type="button">
                  {isScanning ? '掃描中…' : '🔍 掃描新爆款'}
                </button>
                <div className="sort-row">
                  排序：
                  <select value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)}>
                    <option value="outlier_ratio">爆款指數</option>
                    <option value="views">播放量</option>
                    <option value="created_at">最新加入</option>
                  </select>
                </div>
              </div>
              {scanResult && <div className={`scan-result${scanResult.ok ? '' : ' error'}`}>{scanResult.msg}</div>}
            </div>
          </div>
          <div className="stats-row">
            <div className="stat-card"><div className="stat-card-num">{videos.length}</div><div className="stat-card-label">已收藏影片</div></div>
            <div className="stat-card"><div className="stat-card-num">{fmtNum(totalViews)}</div><div className="stat-card-label">總播放量</div></div>
            <div className="stat-card"><div className="stat-card-num">{avgOutlier}x</div><div className="stat-card-label">平均爆款指數</div></div>
            <div className="stat-card"><div className="stat-card-num">{topOutlier}x</div><div className="stat-card-label">最高爆款指數</div></div>
          </div>
          <div className="tabs">
            <button className={`tab${activeTab === 'topics' ? ' active' : ''}`} onClick={() => setActiveTab('topics')} type="button">話題信號 {newTopics > 0 && `(${newTopics} 新)`}</button>
            <button className={`tab${activeTab === 'videos' ? ' active' : ''}`} onClick={() => setActiveTab('videos')} type="button">影片收藏 ({unselected.length})</button>
            <button className={`tab${activeTab === 'selected' ? ' active' : ''}`} onClick={() => setActiveTab('selected')} type="button">已選題目 {selected.length > 0 && `(${selected.length})`}</button>
          </div>
          {activeTab === 'topics' && (
            <div className="topics-section">
              {topics.length === 0 ? (
                <div className="empty-state">尚未有話題信號。<br />按右上角「🔍 掃描新爆款」開始發現話題。</div>
              ) : (
                [...topics].sort((a, b) => b.max_outlier_ratio - a.max_outlier_ratio).map(topic => {
                  const isExp = expandedId === topic.id
                  return (
                    <div key={topic.id} className={`topic-card${topic.status === 'new' ? ' new' : ''}`} onClick={() => setExpandedId(isExp ? null : topic.id)}>
                      <div className="topic-card-main">
                        <div>
                          <div className="topic-zh">{topic.topic_zh}{topic.status === 'new' && <span className="new-badge">New</span>}</div>
                          {topic.topic_en && <div className="topic-en">{topic.topic_en}</div>}
                          {topic.related_channels?.length > 0 && <div className="topic-channels">{topic.related_channels.slice(0, 4).join(' · ')}</div>}
                        </div>
                        <div className="topic-metric"><div className="topic-metric-num">{topic.signal_count}</div><div className="topic-metric-label">信號數量</div></div>
                        <div className="topic-metric"><div className="topic-metric-num">{topic.max_outlier_ratio.toFixed(1)}x</div><div className="topic-metric-label">最高爆款</div></div>
                      </div>
                      {isExp && (
                        <div className="topic-expand">
                          {topic.ai_analysis && <div><div className="topic-expand-label">點解爆</div><div className="topic-expand-text">{topic.ai_analysis}</div></div>}
                          {topic.soon_angle && <div><div className="topic-expand-label">SOON 角度</div><div className="topic-expand-text">{topic.soon_angle}</div></div>}
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          )}
          {activeTab === 'videos' && <VideoTable list={unselected} />}
          {activeTab === 'selected' && (
            <div className="selected-section">
              {selected.length === 0 ? (
                <div className="empty-state">尚未選擇任何題目。<br />在「影片收藏」tab 按「已選」將題目移來這裡。</div>
              ) : selected.map(v => {
                const ol = outlierLabel(v.outlier_ratio)
                return (
                  <div key={v.id} className="selected-card">
                    <div>
                      <div className="selected-title">{v.title_zh || v.title_original}</div>
                      {v.title_zh && <div className="selected-meta">{v.title_original}</div>}
                      <div className="selected-meta" style={{ marginTop: '4px' }}>{v.channel_name}{v.region ? ` · ${v.region}` : ''}</div>
                      <div className="selected-stats">
                        <div className="selected-stat">Views <span>{fmtNum(v.views)}</span></div>
                        <div className="selected-stat">Subs <span>{fmtNum(v.subscribers)}</span></div>
                        <div className="selected-stat">爆款 <span style={{ color: ol.color }}>{v.outlier_ratio.toFixed(1)}x</span></div>
                      </div>
                      {v.ai_analysis && <div style={{ marginTop: '10px', fontSize: '13px', color: '#a5adde', lineHeight: '1.6' }}>{v.ai_analysis}</div>}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                      <a href={v.video_url} target="_blank" rel="noreferrer" style={{ color: '#7c83d6', fontSize: '13px' }}>睇原片 ↗</a>
                      <button className="action-btn btn-outline" onClick={() => handleGenerateOutline(v.id)} type="button" disabled={outliningId === v.id} style={outliningId === v.id ? { opacity: 0.85, cursor: 'not-allowed' } : undefined}>
                        {outliningId === v.id ? `生成中 ${outlineProgress}%` : '生成大綱 →'}
                      </button>
                      <button className="action-btn btn-unselect" onClick={() => handleSelect(v.id, false)} type="button">移出已選</button>
                      <button className="action-btn btn-delete" onClick={() => handleDelete(v.id)} type="button">刪除</button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </main>
      </div>
    </>
  )
}
