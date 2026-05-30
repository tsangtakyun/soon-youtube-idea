'use client'

import { useEffect, useMemo, useState } from 'react'

type Channel = {
  id: string
  name: string
}

type SeriesOption = {
  id: string
  name: string
  domain: string
}

type Topic = {
  id: string
  ew_channel_id: string
  series_id: string | null
  thesis: string
  material: string
  status: 'idea' | 'scripted' | string
  script_id: string | null
  created_at: string
  series?: SeriesOption | null
  script?: { id: string; title: string } | null
}

const CSS = `
* { box-sizing: border-box; }
body { background: var(--soon-bg); color: var(--soon-text); font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
.topics-shell { min-height: 100vh; background: var(--soon-bg-gradient); }
.topics-main { width: min(1220px, calc(100% - 48px)); margin: 0 auto; padding: 34px 0 72px; }
.topics-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin-bottom: 24px; }
.topics-kicker { color: var(--soon-accent); font-size: 12px; letter-spacing: .14em; font-weight: 800; }
.topics-title { margin: 8px 0 10px; font-size: 38px; line-height: 1.12; letter-spacing: 0; color: var(--soon-text-strong); }
.topics-copy { margin: 0; color: var(--soon-text-secondary); line-height: 1.85; max-width: 760px; }
.topics-link { color: var(--soon-link); text-decoration: none; border: 1px solid #d9c7b2; border-radius: 8px; padding: 9px 12px; background: var(--soon-card-bg); white-space: nowrap; font-weight: 700; }
.topics-grid { display: grid; grid-template-columns: 380px minmax(0, 1fr); gap: 18px; align-items: start; }
.topics-panel { background: var(--soon-card-bg); border: 1px solid var(--soon-card-border); border-radius: 8px; padding: 18px; box-shadow: var(--soon-card-shadow); }
.topics-panel h2 { margin: 0 0 14px; font-size: 18px; color: #201812; }
.topics-field { display: grid; gap: 7px; margin-bottom: 14px; }
.topics-label { font-size: 13px; font-weight: 800; color: #40362d; }
.topics-input, .topics-select, .topics-textarea { width: 100%; border: 1px solid var(--soon-input-border); border-radius: 8px; background: var(--soon-input-bg); color: #241f1a; font: inherit; padding: 11px 12px; outline: none; }
.topics-input:focus, .topics-select:focus, .topics-textarea:focus { border-color: var(--soon-input-focus); box-shadow: 0 0 0 3px var(--soon-input-focus-ring); }
.topics-textarea { min-height: 126px; resize: vertical; line-height: 1.65; }
.topics-select { min-height: 42px; }
.topics-row { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
.topics-btn { border: 1px solid var(--soon-btn-secondary-border); background: #fff; color: var(--soon-btn-secondary-text); border-radius: 8px; padding: 10px 14px; font: inherit; font-weight: 800; cursor: pointer; text-decoration: none; }
.topics-btn.primary { background: var(--soon-btn-primary-bg); border-color: var(--soon-btn-primary-bg); color: #fff; }
.topics-btn.danger { border-color: var(--soon-danger-border); color: var(--soon-danger-text); background: var(--soon-danger-bg); }
.topics-btn:disabled { opacity: .55; cursor: not-allowed; }
.topics-status { border-radius: 8px; padding: 11px 12px; margin: 12px 0; font-size: 14px; line-height: 1.55; }
.topics-status.info { background: var(--soon-info-bg); color: var(--soon-info-text); border: 1px solid var(--soon-info-border); }
.topics-status.error { background: var(--soon-danger-bg); color: var(--soon-danger-text); border: 1px solid var(--soon-danger-border); }
.topics-status.success { background: var(--soon-success-bg); color: var(--soon-success-text); border: 1px solid var(--soon-success-border); }
.topics-list { display: grid; gap: 12px; }
.topics-card { border: 1px solid #e1d7ca; border-radius: 8px; background: var(--soon-input-bg); padding: 16px; }
.topics-card-top { display: flex; justify-content: space-between; gap: 12px; align-items: flex-start; margin-bottom: 10px; }
.topics-thesis { margin: 0; color: #201812; font-weight: 800; line-height: 1.55; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.topics-material { margin: 8px 0 0; color: var(--soon-text-muted); line-height: 1.65; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.topics-meta { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; margin-top: 12px; }
.topics-badge { display: inline-flex; border-radius: 999px; padding: 4px 8px; background: var(--soon-badge-bg); color: var(--soon-link); font-size: 12px; white-space: nowrap; }
.topics-badge.done { background: var(--soon-success-bg); color: var(--soon-success-text); }
.topics-badge.pending { background: var(--soon-pending-bg); color: var(--soon-pending-text); }
.topics-empty { border: 1px dashed var(--soon-btn-secondary-border); border-radius: 8px; padding: 18px; color: var(--soon-text-muted); line-height: 1.7; background: var(--soon-input-bg); }
@media (max-width: 860px) {
  .topics-main { width: min(100% - 32px, 1220px); }
  .topics-grid { grid-template-columns: 1fr; }
  .topics-top { flex-direction: column; }
}
`

function formatDate(value: string) {
  if (!value) return ''
  return new Intl.DateTimeFormat('zh-HK', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

export default function TopicsPage() {
  const [channels, setChannels] = useState<Channel[]>([])
  const [channelId, setChannelId] = useState('')
  const [seriesOptions, setSeriesOptions] = useState<SeriesOption[]>([])
  const [topics, setTopics] = useState<Topic[]>([])
  const [thesis, setThesis] = useState('')
  const [material, setMaterial] = useState('')
  const [seriesId, setSeriesId] = useState('')
  const [status, setStatus] = useState('')
  const [statusType, setStatusType] = useState<'info' | 'error' | 'success'>('info')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const selectedChannel = useMemo(
    () => channels.find((channel) => channel.id === channelId),
    [channels, channelId]
  )

  useEffect(() => {
    async function loadChannels() {
      const response = await fetch('/api/workbench/channels', { cache: 'no-store' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || '讀取頻道失敗。')
      const rows = Array.isArray(data.channels) ? data.channels : []
      setChannels(rows)
      if (rows.length === 1) setChannelId(rows[0].id)
      if (rows.length > 1) {
        const here = rows.find((row: Channel) => row.name.toLowerCase() === 'here')
        setChannelId(here?.id ?? rows[0].id)
      }
    }

    loadChannels().catch((error) => {
      setStatus(error instanceof Error ? error.message : '讀取頻道失敗。')
      setStatusType('error')
    })
  }, [])

  useEffect(() => {
    if (!channelId) return

    async function loadTopics() {
      setLoading(true)
      try {
        const response = await fetch(`/api/topics?ew_channel_id=${encodeURIComponent(channelId)}`, { cache: 'no-store' })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || '讀取題目失敗。')
        setTopics(Array.isArray(data.topics) ? data.topics : [])
        setSeriesOptions(Array.isArray(data.series_options) ? data.series_options : [])
        setSeriesId('')
      } catch (error) {
        setStatus(error instanceof Error ? error.message : '讀取題目失敗。')
        setStatusType('error')
      } finally {
        setLoading(false)
      }
    }

    loadTopics()
  }, [channelId])

  async function createTopic() {
    if (!channelId || !thesis.trim()) {
      setStatus('請先選擇頻道並填寫論點。')
      setStatusType('error')
      return
    }

    setSaving(true)
    setStatus('正在新增題目。')
    setStatusType('info')
    try {
      const response = await fetch('/api/topics', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ew_channel_id: channelId,
          series_id: seriesId || null,
          thesis,
          material,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || '新增題目失敗。')
      setTopics((current) => [data.topic, ...current])
      setThesis('')
      setMaterial('')
      setSeriesId('')
      setStatus('題目已加入題目庫。')
      setStatusType('success')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : '新增題目失敗。')
      setStatusType('error')
    } finally {
      setSaving(false)
    }
  }

  async function deleteTopic(topic: Topic) {
    if (!window.confirm('確定要刪除這條題目？')) return

    setStatus('正在刪除題目。')
    setStatusType('info')
    try {
      const response = await fetch(`/api/topics?id=${encodeURIComponent(topic.id)}`, { method: 'DELETE' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || '刪除題目失敗。')
      setTopics((current) => current.filter((item) => item.id !== topic.id))
      setStatus('題目已刪除。')
      setStatusType('success')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : '刪除題目失敗。')
      setStatusType('error')
    }
  }

  function pushToWorkbench(topic: Topic) {
    window.location.href = `/workbench?topic_id=${encodeURIComponent(topic.id)}`
  }

  return (
    <>
      <style>{CSS}</style>
      <main className="topics-shell">
        <section className="topics-main">
          <header className="topics-top">
            <div>
              <div className="topics-kicker">題目管理</div>
              <h1 className="topics-title">題目庫</h1>
              <p className="topics-copy">
                先把已經想好的論點和手上資料儲存；準備開工時，推上生產線就會自動帶入論點、資料和頻道。
              </p>
            </div>
            <a className="topics-link" href="/">
              返回首頁
            </a>
          </header>

          <div className="topics-grid">
            <section className="topics-panel">
              <h2>新增題目</h2>
              <label className="topics-field">
                <span className="topics-label">頻道</span>
                <select className="topics-select" value={channelId} onChange={(event) => setChannelId(event.target.value)}>
                  <option value="">請選擇頻道</option>
                  {channels.map((channel) => (
                    <option key={channel.id} value={channel.id}>
                      {channel.name}
                    </option>
                  ))}
                </select>
              </label>
              {selectedChannel ? <div className="topics-status info">目前題目會加入：{selectedChannel.name}</div> : null}
              <label className="topics-field">
                <span className="topics-label">系列（可留空）</span>
                <select className="topics-select" value={seriesId} onChange={(event) => setSeriesId(event.target.value)}>
                  <option value="">不指定系列</option>
                  {seriesOptions.map((series) => (
                    <option key={series.id} value={series.id}>
                      {series.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="topics-field">
                <span className="topics-label">論點</span>
                <textarea
                  className="topics-textarea"
                  value={thesis}
                  onChange={(event) => setThesis(event.target.value)}
                  placeholder="一句講清楚你想拆解的系統，以及你的切入角度"
                />
              </label>
              <label className="topics-field">
                <span className="topics-label">手上資料 / 來源（可留空）</span>
                <textarea
                  className="topics-textarea"
                  value={material}
                  onChange={(event) => setMaterial(event.target.value)}
                  placeholder="貼新聞、背景、連結；留空之後可由 AI 補查"
                />
              </label>
              <button className="topics-btn primary" type="button" onClick={createTopic} disabled={saving}>
                {saving ? '新增中...' : '加入題目庫'}
              </button>
              {status ? <div className={`topics-status ${statusType}`}>{status}</div> : null}
            </section>

            <section className="topics-panel">
              <h2>題目列表</h2>
              {loading ? <div className="topics-status info">正在讀取題目。</div> : null}
              {!loading && !topics.length ? (
                <div className="topics-empty">這個頻道暫時未有題目。先新增一條論點，之後就可以推上生產線。</div>
              ) : null}
              <div className="topics-list">
                {topics.map((topic) => {
                  const scripted = topic.status === 'scripted'
                  return (
                    <article className="topics-card" key={topic.id}>
                      <div className="topics-card-top">
                        <p className="topics-thesis">{topic.thesis}</p>
                        <span className={`topics-badge ${scripted ? 'done' : 'pending'}`}>
                          {scripted ? '已生成劇本' : '未做'}
                        </span>
                      </div>
                      {topic.material ? <p className="topics-material">{topic.material}</p> : null}
                      <div className="topics-meta">
                        <span className="topics-badge">{topic.series?.name ?? '未指定系列'}</span>
                        <span className="topics-badge">{formatDate(topic.created_at)}</span>
                        {topic.script?.title ? <span className="topics-badge done">{topic.script.title}</span> : null}
                      </div>
                      <div className="topics-row" style={{ marginTop: 14 }}>
                        {scripted ? (
                          <button className="topics-btn" type="button" disabled>
                            已生成劇本
                          </button>
                        ) : (
                          <button className="topics-btn primary" type="button" onClick={() => pushToWorkbench(topic)}>
                            推上生產線
                          </button>
                        )}
                        <button className="topics-btn danger" type="button" onClick={() => deleteTopic(topic)}>
                          刪除
                        </button>
                      </div>
                    </article>
                  )
                })}
              </div>
            </section>
          </div>
        </section>
      </main>
    </>
  )
}
