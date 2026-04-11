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

.shell {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  min-height: 100vh;
}

.sidebar {
  background: #1a1c2e;
  border-right: 1px solid rgba(255,255,255,0.07);
  padding: 24px 18px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
}

.logo {
  font-size: 13px;
  letter-spacing: 0.2em;
  color: #7c83d6;
  text-transform: uppercase;
}

.logo-title {
  font-size: 22px;
  font-weight: 700;
  color: #e8eaf6;
  margin-top: 4px;
  line-height: 1.2;
}

.divider {
  height: 1px;
  background: rgba(255,255,255,0.07);
}

.section-label {
  font-size: 11px;
  letter-spacing: 0.16em;
  color: #6b74c4;
  text-transform: uppercase;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field-label {
  font-size: 13px;
  color: #a5adde;
}

input, textarea, select {
  width: 100%;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 10px;
  color: #e8eaf6;
  padding: 10px 12px;
  font-size: 14px;
  font-family: inherit;
  outline: none;
  transition: border-color 0.15s;
}

input:focus, textarea:focus, select:focus {
  border-color: rgba(124,131,214,0.6);
}

input::placeholder, textarea::placeholder {
  color: rgba(165,173,222,0.35);
}

textarea {
  min-height: 80px;
  resize: vertical;
}

select option {
  background: #1a1c2e;
}

.btn-primary {
  width: 100%;
  padding: 13px;
  border-radius: 12px;
  border: none;
  background: linear-gradient(135deg, #7c83d6, #5c6bc0);
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.15s;
}

.btn-primary:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.status-box {
  padding: 12px 14px;
  border-radius: 10px;
  font-size: 13px;
  line-height: 1.6;
}

.status-box.success { background: rgba(105,219,124,0.12); color: #8ce99a; }
.status-box.error { background: rgba(255,107,107,0.12); color: #ffa8a8; }
.status-box.loading { background: rgba(124,131,214,0.12); color: #bac0f0; }

.preview-box {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 12px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.preview-title {
  font-size: 15px;
  font-weight: 600;
  color: #e8eaf6;
  line-height: 1.4;
}

.preview-meta {
  font-size: 12px;
  color: #6b74c4;
}

.preview-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-top: 4px;
}

.preview-stat {
  background: rgba(255,255,255,0.04);
  border-radius: 8px;
  padding: 8px;
  text-align: center;
}

.preview-stat-num {
  font-size: 16px;
  font-weight: 700;
  color: #e8eaf6;
}

.preview-stat-label {
  font-size: 10px;
  color: #6b74c4;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-top: 3px;
}

.main {
  padding: 28px 28px 60px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.main-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
}

.main-title {
  font-size: 36px;
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1;
}

.main-sub {
  font-size: 14px;
  color: #7c83d6;
  margin-top: 6px;
}

.sort-row {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: #7c83d6;
}

.sort-row select {
  width: auto;
  padding: 7px 10px;
  font-size: 13px;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.stat-card {
  background: #1a1c2e;
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 16px;
  padding: 18px 20px;
}

.stat-card-num {
  font-size: 32px;
  font-weight: 700;
  line-height: 1;
}

.stat-card-label {
  font-size: 12px;
  color: #6b74c4;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  margin-top: 8px;
}

.table-wrap {
  background: #1a1c2e;
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 20px;
  overflow: hidden;
}

.table-head {
  display: grid;
  grid-template-columns: minmax(0,2fr) 100px 100px 100px 120px 90px 90px 80px;
  gap: 0;
  padding: 14px 20px;
  border-bottom: 1px solid rgba(255,255,255,0.07);
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #6b74c4;
}

.table-body {
  display: flex;
  flex-direction: column;
}

.video-row {
  display: grid;
  grid-template-columns: minmax(0,2fr) 100px 100px 100px 120px 90px 90px 80px;
  gap: 0;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255,255,255,0.05);
  align-items: start;
  transition: background 0.1s;
  cursor: pointer;
}

.video-row:hover { background: rgba(255,255,255,0.02); }
.video-row:last-child { border-bottom: none; }

.video-title-zh {
  font-size: 15px;
  font-weight: 600;
  color: #e8eaf6;
  line-height: 1.35;
}

.video-title-en {
  font-size: 12px;
  color: #6b74c4;
  margin-top: 4px;
  line-height: 1.4;
}

.video-channel {
  font-size: 12px;
  color: #7c83d6;
  margin-top: 6px;
}

.video-region {
  display: inline-block;
  margin-top: 6px;
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 999px;
  background: rgba(124,131,214,0.15);
  color: #a5adde;
}

.col-val {
  font-size: 15px;
  font-weight: 600;
  color: #e8eaf6;
  padding-top: 2px;
}

.col-sub {
  font-size: 11px;
  color: #6b74c4;
  margin-top: 3px;
}

.outlier-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 13px;
  font-weight: 700;
}

.expand-row {
  grid-column: 1 / -1;
  background: rgba(255,255,255,0.02);
  border-top: 1px solid rgba(255,255,255,0.05);
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.expand-label {
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #6b74c4;
  margin-bottom: 4px;
}

.expand-text {
  font-size: 14px;
  color: #c5caf0;
  line-height: 1.7;
}

.expand-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.empty-state {
  padding: 60px 20px;
  text-align: center;
  color: #6b74c4;
  font-size: 15px;
  line-height: 1.8;
}

@media (max-width: 1100px) {
  .shell { grid-template-columns: 1fr; }
  .sidebar { position: static; height: auto; }
  .table-head, .video-row {
    grid-template-columns: 1fr 1fr 1fr;
  }
  .stats-row { grid-template-columns: repeat(2, 1fr); }
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
  const [sortBy, setSortBy] = useState<'outlier_ratio' | 'views' | 'created_at'>('outlier_ratio')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [loadingVideos, setLoadingVideos] = useState(true)

  useEffect(() => {
    fetchVideos()
  }, [])

  async function fetchVideos() {
    setLoadingVideos(true)
    try {
      const res = await fetch('/api/viral-videos')
      const data = await res.json()
      setVideos(data.videos ?? [])
    } catch {
      // fail silently
    } finally {
      setLoadingVideos(false)
    }
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

      if (!res.ok) {
        setStatus({ type: 'error', msg: data.error ?? '未知錯誤' })
        return
      }

      setPreview(data)
      setStatus({ type: 'success', msg: `✓ 已儲存：${data.title_zh || data.title_original}` })
      setVideoUrl('')
      setDescription('')
      setRegion('')
      await fetchVideos()
    } catch (err) {
      setStatus({ type: 'error', msg: err instanceof Error ? err.message : '網絡錯誤' })
    } finally {
      setIsPending(false)
    }
  }

  const sorted = [...videos].sort((a, b) => {
    if (sortBy === 'outlier_ratio') return b.outlier_ratio - a.outlier_ratio
    if (sortBy === 'views') return b.views - a.views
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  const totalViews = videos.reduce((s, v) => s + v.views, 0)
  const avgOutlier = videos.length
    ? (videos.reduce((s, v) => s + v.outlier_ratio, 0) / videos.length).toFixed(1)
    : '0.0'
  const topOutlier = videos.length
    ? Math.max(...videos.map((v) => v.outlier_ratio)).toFixed(1)
    : '0.0'

  return (
    <>
      <style>{CSS}</style>
      <div className="shell">

        {/* Sidebar */}
        <aside className="sidebar">
          <div>
            <div className="logo">SOON · Internal</div>
            <div className="logo-title">爆款影片<br />收藏庫</div>
          </div>

          <div className="divider" />

          <div className="section-label">新增影片</div>

          <div className="field-group">
            <div className="field-label">01 · YouTube URL</div>
            <input
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
          </div>

          <div className="field-group">
            <div className="field-label">02 · 描述（你的觀察）</div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="點解覺得呢條片值得收藏？有咩特別嘅切入角度或爆款原因…"
            />
          </div>

          <div className="field-group">
            <div className="field-label">03 · 國家 / 地區</div>
            <select value={region} onChange={(e) => setRegion(e.target.value)}>
              <option value="">選擇地區…</option>
              {REGIONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <button
            className="btn-primary"
            onClick={handleSubmit}
            disabled={isPending || !videoUrl.trim()}
            type="button"
          >
            {isPending ? '分析中…' : '分析並儲存'}
          </button>

          {status && (
            <div className={`status-box ${status.type}`}>{status.msg}</div>
          )}

          {preview && (
            <div className="preview-box">
              <div className="preview-title">{preview.title_zh}</div>
              <div className="preview-meta">{preview.title_original}</div>
              <div className="preview-stats">
                <div className="preview-stat">
                  <div className="preview-stat-num">{fmtNum(preview.views ?? 0)}</div>
                  <div className="preview-stat-label">Views</div>
                </div>
                <div className="preview-stat">
                  <div className="preview-stat-num">{fmtNum(preview.subscribers ?? 0)}</div>
                  <div className="preview-stat-label">Subs</div>
                </div>
                <div className="preview-stat">
                  <div className="preview-stat-num">{(preview.outlier_ratio ?? 0).toFixed(1)}x</div>
                  <div className="preview-stat-label">爆款</div>
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* Main */}
        <main className="main">
          <div className="main-header">
            <div>
              <div className="main-title">爆款 Collection</div>
              <div className="main-sub">按 Views ÷ Subscribers 排列 · 數字愈高愈爆</div>
            </div>
            <div className="sort-row">
              排序：
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              >
                <option value="outlier_ratio">爆款指數</option>
                <option value="views">播放量</option>
                <option value="created_at">最新加入</option>
              </select>
            </div>
          </div>

          <div className="stats-row">
            <div className="stat-card">
              <div className="stat-card-num">{videos.length}</div>
              <div className="stat-card-label">已收藏影片</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-num">{fmtNum(totalViews)}</div>
              <div className="stat-card-label">總播放量</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-num">{avgOutlier}x</div>
              <div className="stat-card-label">平均爆款指數</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-num">{topOutlier}x</div>
              <div className="stat-card-label">最高爆款指數</div>
            </div>
          </div>

          <div className="table-wrap">
            <div className="table-head">
              <div>影片</div>
              <div>Views</div>
              <div>Likes</div>
              <div>Comments</div>
              <div>Subscribers</div>
              <div>爆款指數</div>
              <div>地區</div>
              <div>時長</div>
            </div>

            <div className="table-body">
              {loadingVideos ? (
                <div className="empty-state">載入中…</div>
              ) : sorted.length === 0 ? (
                <div className="empty-state">
                  尚未收藏任何影片。<br />
                  在左側貼入 YouTube URL 開始分析。
                </div>
              ) : (
                sorted.map((v) => {
                  const ol = outlierLabel(v.outlier_ratio)
                  const isExpanded = expandedId === v.id
                  return (
                    <div key={v.id}>
                      <div
                        className="video-row"
                        onClick={() => setExpandedId(isExpanded ? null : v.id)}
                      >
                        <div>
                          <div className="video-title-zh">{v.title_zh || v.title_original}</div>
                          {v.title_zh && v.title_original && (
                            <div className="video-title-en">{v.title_original}</div>
                          )}
                          <div className="video-channel">{v.channel_name}</div>
                          {v.region && <span className="video-region">{v.region}</span>}
                        </div>
                        <div>
                          <div className="col-val">{fmtNum(v.views)}</div>
                        </div>
                        <div>
                          <div className="col-val">{fmtNum(v.likes)}</div>
                        </div>
                        <div>
                          <div className="col-val">{fmtNum(v.comments)}</div>
                        </div>
                        <div>
                          <div className="col-val">{fmtNum(v.subscribers)}</div>
                        </div>
                        <div>
                          <div
                            className="outlier-badge"
                            style={{ background: ol.color + '22', color: ol.color }}
                          >
                            {v.outlier_ratio.toFixed(1)}x
                          </div>
                          <div className="col-sub">{ol.label}</div>
                        </div>
                        <div>
                          <div className="col-val" style={{ fontSize: '13px' }}>{v.region ?? '—'}</div>
                        </div>
                        <div>
                          <div className="col-val" style={{ fontSize: '13px' }}>{v.duration ?? '—'}</div>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="expand-row">
                          <div className="expand-grid">
                            {v.ai_analysis && (
                              <div>
                                <div className="expand-label">AI 內容分析</div>
                                <div className="expand-text">{v.ai_analysis}</div>
                              </div>
                            )}
                            {v.description && (
                              <div>
                                <div className="expand-label">你的觀察</div>
                                <div className="expand-text">{v.description}</div>
                              </div>
                            )}
                          </div>
                          <div>
                            
                              href={v.video_url}
                              target="_blank"
                              rel="noreferrer"
                              style={{ color: '#7c83d6', fontSize: '13px' }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              → 睇原片 ↗
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  )
}
