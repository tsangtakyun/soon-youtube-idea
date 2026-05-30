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
body { background: #080808; color: #f6f2ec; font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
.idea-shell { min-height: 100vh; background: #080808; color: #f6f2ec; }
.idea-main { width: min(1220px, calc(100% - 48px)); margin: 0 auto; padding: 30px 0 72px; }
.idea-top { display: flex; justify-content: space-between; gap: 18px; align-items: flex-start; margin-bottom: 20px; }
.idea-kicker { color: #b98955; font-size: 12px; letter-spacing: .16em; font-weight: 800; text-transform: uppercase; }
.idea-title { margin: 8px 0 0; color: #fffaf2; font-size: clamp(38px, 6vw, 72px); line-height: .98; letter-spacing: 0; }
.idea-actions { display: flex; gap: 10px; flex-wrap: wrap; justify-content: flex-end; }
.idea-btn { display: inline-flex; align-items: center; justify-content: center; border: 1px solid rgba(255,255,255,.18); background: rgba(255,255,255,.06); color: #f6f2ec; border-radius: 8px; padding: 10px 14px; text-decoration: none; font: inherit; font-weight: 800; cursor: pointer; transition: background .15s ease, border-color .15s ease, transform .15s ease; }
.idea-btn:hover { background: rgba(255,255,255,.11); border-color: rgba(255,255,255,.3); transform: translateY(-1px); }
.idea-btn.primary { background: #f6f2ec; border-color: #f6f2ec; color: #15110d; }
.idea-btn.primary:hover { background: #fff; border-color: #fff; }
.idea-banner { margin: 22px 0 24px; border: 1px solid rgba(255,255,255,.12); border-radius: 8px; overflow: hidden; background: #121212; box-shadow: 0 24px 60px rgba(0,0,0,.36); }
.idea-banner img { display: block; width: 100%; height: clamp(180px, 24vw, 330px); object-fit: cover; }
.idea-toolbar { display: flex; justify-content: space-between; align-items: center; gap: 14px; margin: 20px 0 14px; flex-wrap: wrap; }
.idea-toolbar-left { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
.idea-count { color: #bfb6ad; font-size: 14px; }
.idea-select { min-height: 42px; min-width: 180px; border: 1px solid rgba(255,255,255,.18); border-radius: 8px; background: #121212; color: #f6f2ec; padding: 10px 12px; outline: none; font: inherit; }
.idea-select:focus { border-color: #b98955; box-shadow: 0 0 0 3px rgba(185,137,85,.18); }
.idea-status { margin: 14px 0; border-radius: 8px; padding: 12px 14px; border: 1px solid rgba(255,255,255,.12); background: rgba(255,255,255,.05); color: #d8d0c7; line-height: 1.6; }
.idea-status.error { border-color: rgba(239,194,189,.4); color: #ffc9c1; }
.topic-list { display: grid; gap: 12px; }
.topic-card { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 18px; align-items: center; padding: 18px; border: 1px solid rgba(255,255,255,.12); border-radius: 8px; background: rgba(255,255,255,.06); box-shadow: 0 18px 44px rgba(0,0,0,.22); }
.topic-card:hover { border-color: rgba(185,137,85,.48); background: rgba(255,255,255,.08); }
.topic-main { min-width: 0; }
.topic-thesis { margin: 0; color: #fffaf2; font-size: 20px; font-weight: 850; line-height: 1.45; }
.topic-material { margin: 8px 0 0; color: #bfb6ad; line-height: 1.65; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.topic-meta { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px; }
.topic-badge { display: inline-flex; align-items: center; border-radius: 999px; padding: 4px 9px; background: rgba(185,137,85,.16); color: #e0b77c; font-size: 12px; border: 1px solid rgba(185,137,85,.28); }
.topic-badge.done { background: rgba(22,101,52,.22); color: #a7e5ba; border-color: rgba(167,229,186,.24); }
.topic-badge.pending { background: rgba(255,246,223,.12); color: #f1cf85; border-color: rgba(241,207,133,.22); }
.topic-card-actions { display: flex; justify-content: flex-end; min-width: 170px; }
.topic-empty { border: 1px dashed rgba(255,255,255,.2); border-radius: 8px; padding: 22px; color: #bfb6ad; line-height: 1.8; background: rgba(255,255,255,.04); }
@media (max-width: 760px) {
  .idea-main { width: min(100% - 32px, 1220px); padding-top: 24px; }
  .idea-top { flex-direction: column; }
  .idea-actions { width: 100%; justify-content: flex-start; }
  .topic-card { grid-template-columns: 1fr; }
  .topic-card-actions { justify-content: flex-start; min-width: 0; }
  .idea-btn { width: 100%; }
}
`

function formatDate(value: string) {
  if (!value) return ''
  return new Intl.DateTimeFormat('zh-HK', { dateStyle: 'medium' }).format(new Date(value))
}

export default function HomePage() {
  const [channels, setChannels] = useState<Channel[]>([])
  const [channelId, setChannelId] = useState('')
  const [topics, setTopics] = useState<Topic[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [statusType, setStatusType] = useState<'info' | 'error'>('info')

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
      if (!rows.length) {
        setStatus('尚未設定頻道基因。請先到右上角設定頻道。')
        setStatusType('info')
        return
      }

      const here = rows.find((row: Channel) => row.name.toLowerCase() === 'here')
      setChannelId(here?.id ?? rows[0].id)
    }

    loadChannels().catch((error) => {
      setStatus(error instanceof Error ? error.message : '讀取頻道失敗。')
      setStatusType('error')
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (!channelId) {
      setLoading(false)
      return
    }

    async function loadTopics() {
      setLoading(true)
      setStatus('')
      try {
        const response = await fetch(`/api/topics?ew_channel_id=${encodeURIComponent(channelId)}`, { cache: 'no-store' })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || '讀取題材失敗。')
        setTopics(Array.isArray(data.topics) ? data.topics : [])
      } catch (error) {
        setStatus(error instanceof Error ? error.message : '讀取題材失敗。')
        setStatusType('error')
      } finally {
        setLoading(false)
      }
    }

    void loadTopics()
  }, [channelId])

  function pushToScript(topic: Topic) {
    window.location.href = `/workbench?topic_id=${encodeURIComponent(topic.id)}`
  }

  return (
    <>
      <style>{CSS}</style>
      <main className="idea-shell">
        <section className="idea-main">
          <header className="idea-top">
            <div>
              <div className="idea-kicker">SOON 編輯工作台</div>
              <h1 className="idea-title">YouTube 題材庫</h1>
            </div>
            <div className="idea-actions">
              <a className="idea-btn" href="/channel">頻道基因</a>
              <a className="idea-btn primary" href="/topics">新增題材</a>
            </div>
          </header>

          <div className="idea-banner">
            <img src="/youtube-banner.jpg" alt="YouTube 題材庫" />
          </div>

          <div className="idea-toolbar">
            <div className="idea-toolbar-left">
              {channels.length > 1 ? (
                <select className="idea-select" value={channelId} onChange={(event) => setChannelId(event.target.value)}>
                  {channels.map((channel) => (
                    <option key={channel.id} value={channel.id}>{channel.name}</option>
                  ))}
                </select>
              ) : null}
              <span className="idea-count">
                {selectedChannel ? `${selectedChannel.name} · ${topics.length} 條題材` : `${topics.length} 條題材`}
              </span>
            </div>
            <a className="idea-btn" href="/workbench">直接開六段式劇本</a>
          </div>

          {status ? <div className={`idea-status ${statusType}`}>{status}</div> : null}

          {loading ? (
            <div className="idea-status">正在讀取題材庫。</div>
          ) : topics.length ? (
            <div className="topic-list">
              {topics.map((topic) => {
                const scripted = topic.status === 'scripted'
                return (
                  <article className="topic-card" key={topic.id}>
                    <div className="topic-main">
                      <p className="topic-thesis">{topic.thesis}</p>
                      {topic.material ? <p className="topic-material">{topic.material}</p> : null}
                      <div className="topic-meta">
                        <span className="topic-badge">{topic.series?.name ?? '未指定系列'}</span>
                        <span className={`topic-badge ${scripted ? 'done' : 'pending'}`}>
                          {scripted ? '已生成劇本' : '未生成'}
                        </span>
                        <span className="topic-badge">{formatDate(topic.created_at)}</span>
                      </div>
                    </div>
                    <div className="topic-card-actions">
                      <button
                        className="idea-btn primary"
                        type="button"
                        onClick={() => pushToScript(topic)}
                      >
                        推上六段式劇本
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>
          ) : (
            <div className="topic-empty">
              題材庫暫時未有內容。請先新增題材，之後每條題材都可以直接推上六段式劇本。
            </div>
          )}
        </section>
      </main>
    </>
  )
}
