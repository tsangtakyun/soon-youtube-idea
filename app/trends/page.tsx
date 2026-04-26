'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type ViralVideoDB = {
  id: string
  video_id: string
  title_zh: string
  title_original: string
  channel_name: string
  views: number
  likes: number
  outlier_ratio: number
  region: string | null
  ai_analysis: string | null
  publish_date: string | null
}

type Category = {
  name: string
  video_count: number
  total_views: number
  avg_outlier: number
}

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`
  return String(n)
}

function OutlierBadge({ ratio }: { ratio: number }) {
  const color = ratio >= 5 ? '#ff6b6b' : ratio >= 2 ? '#ffa94d' : ratio >= 0.5 ? '#a9e34b' : '#868e96'
  const label = ratio >= 5 ? '🔥 極爆' : ratio >= 2 ? '⚡ 爆' : ratio >= 0.5 ? '📈 正常' : '—'
  return (
    <span style={{ background: color + '22', color, border: `1px solid ${color}44`, borderRadius: 6, padding: '3px 8px', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>
      {ratio.toFixed(1)}x {label}
    </span>
  )
}

const CSS = `
* { box-sizing: border-box; margin: 0; padding: 0; }
body { background: #0d0f1a; color: #e8eaf6; font-family: 'SF Mono', 'Fira Code', monospace; }
.page { max-width: 1200px; margin: 0 auto; padding: 32px 24px 80px; display: flex; flex-direction: column; gap: 32px; }
.header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
.header-left h1 { font-size: 28px; font-weight: 800; letter-spacing: -0.04em; color: #fff; }
.header-left p { font-size: 13px; color: #5c6bc0; margin-top: 6px; letter-spacing: 0.05em; text-transform: uppercase; }
.scan-btn { padding: 10px 20px; border-radius: 10px; border: 1px solid rgba(124,131,214,0.4); background: rgba(124,131,214,0.1); color: #a5adde; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s; font-family: inherit; }
.scan-btn:hover { background: rgba(124,131,214,0.2); color: #e8eaf6; }
.scan-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.tabs { display: flex; gap: 4px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07); border-radius: 12px; padding: 4px; width: fit-content; }
.tab { padding: 8px 20px; border-radius: 9px; border: none; background: transparent; color: #6b74c4; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s; font-family: inherit; }
.tab.active { background: rgba(124,131,214,0.25); color: #e8eaf6; }
.stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
.stat-card { background: #13152a; border: 1px solid rgba(255,255,255,0.07); border-radius: 16px; padding: 20px 22px; }
.stat-num { font-size: 34px; font-weight: 800; color: #fff; letter-spacing: -0.03em; line-height: 1; }
.stat-label { font-size: 11px; color: #5c6bc0; letter-spacing: 0.14em; text-transform: uppercase; margin-top: 8px; }
.section { display: flex; flex-direction: column; gap: 12px; }
.section-title { font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: #5c6bc0; }
.viral-list { display: flex; flex-direction: column; gap: 8px; }
.viral-card { background: #13152a; border: 1px solid rgba(255,255,255,0.07); border-radius: 14px; padding: 16px 20px; display: grid; grid-template-columns: minmax(0,1fr) auto; gap: 16px; align-items: start; cursor: pointer; transition: border-color 0.15s; }
.viral-card:hover { border-color: rgba(124,131,214,0.35); }
.viral-card.hot { border-color: rgba(255,107,107,0.3); }
.viral-title { font-size: 15px; font-weight: 600; color: #e8eaf6; line-height: 1.35; }
.viral-meta { font-size: 12px; color: #5c6bc0; margin-top: 5px; display: flex; gap: 12px; flex-wrap: wrap; }
.tag { font-size: 11px; padding: 2px 8px; border-radius: 999px; background: rgba(124,131,214,0.15); color: #a5adde; }
.viral-right { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; }
.cat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.cat-card { background: #13152a; border: 1px solid rgba(255,255,255,0.07); border-radius: 14px; padding: 16px 18px; }
.cat-name { font-size: 15px; font-weight: 700; color: #e8eaf6; }
.cat-stats { display: flex; gap: 16px; margin-top: 10px; }
.cat-stat { font-size: 12px; color: #6b74c4; }
.cat-stat strong { color: #e8eaf6; font-size: 14px; display: block; margin-bottom: 2px; }
.cat-bar { height: 3px; background: rgba(124,131,214,0.15); border-radius: 999px; margin-top: 10px; overflow: hidden; }
.cat-bar-fill { height: 100%; background: linear-gradient(90deg, #7c83d6, #5c6bc0); border-radius: 999px; }
.expand-box { margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.05); }
.expand-label { font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: #5c6bc0; margin-bottom: 5px; }
.expand-text { font-size: 13px; color: #b0b8e8; line-height: 1.7; }
.empty { text-align: center; padding: 60px 20px; color: #5c6bc0; font-size: 14px; line-height: 1.8; }
.region-filter { display: flex; gap: 6px; flex-wrap: wrap; }
.region-btn { padding: 5px 12px; border-radius: 999px; border: 1px solid rgba(255,255,255,0.08); background: transparent; color: #6b74c4; font-size: 12px; cursor: pointer; transition: all 0.15s; font-family: inherit; }
.region-btn.active { background: rgba(124,131,214,0.2); color: #e8eaf6; border-color: rgba(124,131,214,0.4); }
.scan-result { font-size: 12px; color: #8ce99a; text-align: right; }
.scan-result.err { color: #ffa8a8; }
@media (max-width: 900px) {
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
  .cat-grid { grid-template-columns: repeat(2, 1fr); }
  .header { flex-direction: column; }
}
`

export default function TrendsPage() {
  const [activeTab, setActiveTab] = useState<'viral' | 'categories'>('viral')
  const [viralVideos, setViralVideos] = useState<ViralVideoDB[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [scanResult, setScanResult] = useState<{ msg: string; ok: boolean } | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [regionFilter, setRegionFilter] = useState('')

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    try {
      const [viralRes, catRes] = await Promise.all([
        fetch('/api/viral-videos'),
        fetch('/api/trending?type=categories'),
      ])
      const viralData = await viralRes.json()
      const catData = await catRes.json()
      setViralVideos(viralData.videos ?? [])
      setCategories(catData.categories ?? [])
    } catch { /* silent */ }
    finally { setLoading(false) }
  }

  async function handleScan() {
    setScanning(true)
    setScanResult(null)
    try {
      const res = await fetch('/api/scan', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        setScanResult({ ok: true, msg: `✓ 新增 ${data.results.videos_saved} 條影片，${data.results.topics_saved} 個話題` })
        await fetchAll()
      } else {
        setScanResult({ ok: false, msg: `✗ ${data.error ?? '掃描失敗'}` })
      }
    } catch { setScanResult({ ok: false, msg: '✗ 網絡錯誤' }) }
    finally { setScanning(false) }
  }

  const regions = ['', 'HK', 'TW', 'MY', 'SG', '海外']
  const filteredVideos = viralVideos.filter(v =>
    !regionFilter || v.region === regionFilter ||
    (regionFilter === '海外' && !['HK','TW','MY','SG','香港','台灣'].includes(v.region ?? ''))
  )
  const totalViews = viralVideos.reduce((s, v) => s + v.views, 0)
  const avgOutlier = viralVideos.length ? (viralVideos.reduce((s, v) => s + v.outlier_ratio, 0) / viralVideos.length) : 0
  const topOutlier = viralVideos.length ? Math.max(...viralVideos.map(v => v.outlier_ratio)) : 0
  const maxViews = categories.length ? Math.max(...categories.map(c => c.total_views)) : 1

  return (
    <>
      <style>{CSS}</style>
      <div className="page">
        <div className="header">
          <div className="header-left">
            <h1>中文趨勢雷達</h1>
            <p>Chinese YouTube · Viral Discovery · Real-time</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <Link href="/" style={{ padding: '10px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: '#6b74c4', fontSize: 13, textDecoration: 'none' }}>
                ← 返回題材
              </Link>
              <button className="scan-btn" onClick={handleScan} disabled={scanning}>
                {scanning ? '掃描中…' : '🔍 掃描新影片'}
              </button>
            </div>
            {scanResult && <div className={`scan-result${scanResult.ok ? '' : ' err'}`}>{scanResult.msg}</div>}
          </div>
        </div>
        <div className="stats-grid">
          <div className="stat-card"><div className="stat-num">{viralVideos.length}</div><div className="stat-label">已收集影片</div></div>
          <div className="stat-card"><div className="stat-num">{fmt(totalViews)}</div><div className="stat-label">總播放量</div></div>
          <div className="stat-card"><div className="stat-num">{avgOutlier.toFixed(1)}x</div><div className="stat-label">平均爆款指數</div></div>
          <div className="stat-card"><div className="stat-num">{topOutlier.toFixed(1)}x</div><div className="stat-label">最高爆款指數</div></div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div className="tabs">
            <button className={`tab${activeTab === 'viral' ? ' active' : ''}`} onClick={() => setActiveTab('viral')}>🔥 病毒影片 ({viralVideos.length})</button>
            <button className={`tab${activeTab === 'categories' ? ' active' : ''}`} onClick={() => setActiveTab('categories')}>📊 題材分類 ({categories.length})</button>
          </div>
          {activeTab === 'viral' && (
            <div className="region-filter">
              {regions.map(r => (
                <button key={r} className={`region-btn${regionFilter === r ? ' active' : ''}`} onClick={() => setRegionFilter(r)}>
                  {r || '全部'}
                </button>
              ))}
            </div>
          )}
        </div>
        {activeTab === 'viral' && (
          <div className="section">
            <div className="section-title">按爆款指數排列 · {filteredVideos.length} 條影片</div>
            {loading ? <div className="empty">載入中…</div> : filteredVideos.length === 0 ? (
              <div className="empty">未有影片數據<br />按「掃描新影片」開始收集</div>
            ) : (
              <div className="viral-list">
                {[...filteredVideos].sort((a, b) => b.outlier_ratio - a.outlier_ratio).map(v => {
                  const isExp = expandedId === v.id
                  const isHot = v.outlier_ratio >= 5
                  return (
                    <div key={v.id} className={`viral-card${isHot ? ' hot' : ''}`} onClick={() => setExpandedId(isExp ? null : v.id)}>
                      <div>
                        <div className="viral-title">{v.title_zh || v.title_original}</div>
                        {v.title_zh && v.title_original && v.title_zh !== v.title_original && (
                          <div style={{ fontSize: 12, color: '#5c6bc0', marginTop: 3 }}>{v.title_original}</div>
                        )}
                        <div className="viral-meta">
                          <span>📺 {v.channel_name}</span>
                          <span>👁 {fmt(v.views)}</span>
                          <span>👍 {fmt(v.likes)}</span>
                          {v.region && <span className="tag">{v.region}</span>}
                        </div>
                        {isExp && v.ai_analysis && (
                          <div className="expand-box">
                            <div className="expand-label">AI 分析</div>
                            <div className="expand-text">{v.ai_analysis}</div>
                          </div>
                        )}
                      </div>
                      <div className="viral-right">
                        <OutlierBadge ratio={v.outlier_ratio} />
                        {v.publish_date && <div style={{ fontSize: 11, color: '#5c6bc0' }}>{new Date(v.publish_date).toLocaleDateString('zh-HK')}</div>}
                        <a href={`https://www.youtube.com/watch?v=${v.video_id}`} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} style={{ fontSize: 11, color: '#7c83d6', textDecoration: 'none' }}>↗ YouTube</a>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
        {activeTab === 'categories' && (
          <div className="section">
            <div className="section-title">題材分類 · 按總播放量排列</div>
            {loading ? <div className="empty">載入中…</div> : categories.length === 0 ? (
              <div className="empty">未有題材數據<br />掃描影片後自動分類</div>
            ) : (
              <div className="cat-grid">
                {categories.map(c => (
                  <div key={c.name} className="cat-card">
                    <div className="cat-name">{c.name}</div>
                    <div className="cat-stats">
                      <div className="cat-stat"><strong>{fmt(c.total_views)}</strong>總播放</div>
                      <div className="cat-stat"><strong>{c.video_count}</strong>影片數</div>
                      <div className="cat-stat"><strong>{c.avg_outlier}x</strong>平均爆款</div>
                    </div>
                    <div className="cat-bar"><div className="cat-bar-fill" style={{ width: `${(c.total_views / maxViews) * 100}%` }} /></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}
