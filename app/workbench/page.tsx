'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

type Channel = {
  id: string
  name: string
  positioning: string
  tone: string
}

type ResearchSource = {
  point: string
  source_url: string
  credibility: string
  supports: 'for' | 'against' | 'context'
}

type Flag = {
  type: 'contradiction' | 'no_source' | 'too_broad'
  message: string
}

type ScriptPart = {
  role: string
  roleLabel: string
  content: string
}

type TopicPayload = {
  id: string
  ew_channel_id: string
  thesis: string
  material: string
}

const EMPTY_PARTS: ScriptPart[] = [
  { role: 'hook', roleLabel: '鈎子', content: '' },
  { role: 'setup', roleLabel: '論點 / 鋪陳', content: '' },
  { role: 'detail', roleLabel: '細節', content: '' },
  { role: 'complication', roleLabel: '複雜化', content: '' },
  { role: 'depth', roleLabel: '根本原因', content: '' },
  { role: 'resolution', roleLabel: '收束', content: '' },
]

const CSS = `
* { box-sizing: border-box; }
body { background: #080808; color: #f6f2ec; font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
.wb-shell { min-height: 100vh; background: #080808; color: #f6f2ec; }
.wb-main { width: min(1220px, calc(100% - 48px)); margin: 0 auto; padding: 34px 0 72px; }
.wb-top { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; margin-bottom: 20px; }
.wb-kicker { color: #b98955; font-size: 12px; letter-spacing: .14em; font-weight: 800; }
.wb-title { margin: 8px 0 10px; font-size: clamp(38px, 5vw, 64px); line-height: 1.02; color: #fffaf2; }
.wb-subtitle { margin: 0; color: #bfb6ad; line-height: 1.85; max-width: 760px; }
.wb-link { color: #f6f2ec; text-decoration: none; border: 1px solid rgba(255,255,255,.18); border-radius: 8px; padding: 9px 12px; background: rgba(255,255,255,.06); white-space: nowrap; font-weight: 700; }
.wb-link:hover { background: rgba(255,255,255,.11); border-color: rgba(255,255,255,.3); }
.wb-banner { margin: 22px 0 24px; border: 1px solid rgba(255,255,255,.12); border-radius: 8px; overflow: hidden; background: #121212; box-shadow: 0 24px 60px rgba(0,0,0,.36); }
.wb-banner img { display: block; width: 100%; height: clamp(180px, 24vw, 330px); object-fit: cover; }
.wb-grid { display: grid; grid-template-columns: 380px minmax(0, 1fr); gap: 18px; align-items: start; }
.wb-panel { background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.12); border-radius: 8px; padding: 18px; box-shadow: 0 18px 44px rgba(0,0,0,.22); }
.wb-panel h2 { margin: 0 0 14px; font-size: 18px; color: #fffaf2; }
.wb-field { display: grid; gap: 7px; margin-bottom: 14px; }
.wb-label { font-size: 13px; font-weight: 800; color: #fffaf2; }
.wb-input, .wb-select, .wb-textarea { width: 100%; border: 1px solid rgba(255,255,255,.16); border-radius: 8px; background: #121212; color: #fffaf2; font: inherit; padding: 11px 12px; outline: none; }
.wb-input:focus, .wb-select:focus, .wb-textarea:focus { border-color: #b98955; box-shadow: 0 0 0 3px rgba(185,137,85,.18); }
.wb-input::placeholder, .wb-textarea::placeholder { color: #7d746c; }
.wb-textarea { min-height: 142px; resize: vertical; line-height: 1.65; }
.wb-select { min-height: 42px; }
.wb-row { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
.wb-btn { border: 1px solid rgba(255,255,255,.18); background: rgba(255,255,255,.06); color: #f6f2ec; border-radius: 8px; padding: 10px 14px; font: inherit; font-weight: 800; cursor: pointer; }
.wb-btn.primary { background: #f6f2ec; border-color: #f6f2ec; color: #15110d; }
.wb-btn:disabled { opacity: .55; cursor: not-allowed; }
.wb-status { border-radius: 8px; padding: 11px 12px; margin: 12px 0; font-size: 14px; line-height: 1.55; }
.wb-status.info { background: rgba(238,246,255,.08); color: #cfe3ff; border: 1px solid rgba(207,227,255,.24); }
.wb-status.error { background: rgba(120,20,20,.16); color: #ffc9c1; border: 1px solid rgba(255,120,120,.32); }
.wb-status.success { background: rgba(22,101,52,.18); color: #a7e5ba; border: 1px solid rgba(167,229,186,.24); }
.wb-card-list { display: grid; gap: 12px; }
.wb-source, .wb-flag, .wb-part { border: 1px solid rgba(255,255,255,.12); border-radius: 8px; background: #121212; padding: 14px; }
.wb-source-top { display: flex; justify-content: space-between; gap: 12px; align-items: flex-start; }
.wb-source p, .wb-flag p { margin: 0; line-height: 1.65; }
.wb-badge { display: inline-flex; border-radius: 999px; padding: 4px 8px; background: rgba(185,137,85,.16); color: #e0b77c; font-size: 12px; white-space: nowrap; border: 1px solid rgba(185,137,85,.28); }
.wb-source a { color: #9ccfff; font-size: 13px; overflow-wrap: anywhere; }
.wb-flag { border-color: rgba(241,194,125,.38); background: rgba(241,194,125,.1); }
.wb-part h3 { margin: 0 0 10px; font-size: 16px; color: #fffaf2; }
.wb-part textarea { min-height: 190px; }
.wb-title-input { font-size: 20px; font-weight: 800; }
@media (max-width: 860px) {
  .wb-main { width: min(100% - 32px, 1220px); }
  .wb-grid { grid-template-columns: 1fr; }
  .wb-top { flex-direction: column; }
}
`

export default function WorkbenchPage() {
  const [channels, setChannels] = useState<Channel[]>([])
  const [channelId, setChannelId] = useState('')
  const [thesis, setThesis] = useState('')
  const [material, setMaterial] = useState('')
  const [topicId, setTopicId] = useState('')
  const [hookVariant, setHookVariant] = useState('thesis')
  const [narrativeMode, setNarrativeMode] = useState('detached_narration')
  const [targetMinutes, setTargetMinutes] = useState(8)
  const [researchSources, setResearchSources] = useState<ResearchSource[]>([])
  const [flags, setFlags] = useState<Flag[]>([])
  const [searchSkipped, setSearchSkipped] = useState(false)
  const [title, setTitle] = useState('')
  const [parts, setParts] = useState<ScriptPart[]>(EMPTY_PARTS)
  const [status, setStatus] = useState('')
  const [statusType, setStatusType] = useState<'info' | 'error' | 'success'>('info')
  const [researching, setResearching] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const thesisRef = useRef<HTMLTextAreaElement | null>(null)
  const materialRef = useRef<HTMLTextAreaElement | null>(null)

  const selectedChannel = useMemo(
    () => channels.find((channel) => channel.id === channelId),
    [channels, channelId]
  )

  useEffect(() => {
    async function loadInitialData() {
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

      const incomingTopicId = new URLSearchParams(window.location.search).get('topic_id')?.trim()
      if (!incomingTopicId) return

      const topicResponse = await fetch(`/api/topics?id=${encodeURIComponent(incomingTopicId)}`, { cache: 'no-store' })
      const topicData = await topicResponse.json()
      if (!topicResponse.ok) throw new Error(topicData.error || '讀取題材失敗。')

      const topic = topicData.topic as TopicPayload | undefined
      if (!topic) throw new Error('找不到這條題材。')

      setTopicId(topic.id)
      setChannelId(topic.ew_channel_id)
      setThesis(topic.thesis ?? '')
      setMaterial(topic.material ?? '')
      setStatus('已從題材庫帶入論點和資料。')
      setStatusType('success')
    }

    loadInitialData().catch((error) => {
      setStatus(error instanceof Error ? error.message : '讀取資料失敗。')
      setStatusType('error')
    })
  }, [])

  async function runResearch() {
    if (!channelId || !thesis.trim()) {
      setStatus('請先選擇頻道並填寫論點。')
      setStatusType('error')
      return
    }

    setResearching(true)
    setStatus('正在研究和拆解論點。')
    setStatusType('info')
    setTitle('')
    setParts(EMPTY_PARTS)

    try {
      const response = await fetch('/api/workbench/research', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ thesis, material, channel_id: channelId, target_minutes: targetMinutes }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || '研究失敗。')
      setResearchSources(data.research_sources ?? [])
      setFlags(data.flags ?? [])
      setSearchSkipped(Boolean(data.search_skipped))
      setStatus(data.search_skipped ? '研究完成；網絡搜尋暫時未執行。' : '研究完成。')
      setStatusType('success')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : '研究失敗。')
      setStatusType('error')
    } finally {
      setResearching(false)
    }
  }

  async function generateScript() {
    setGenerating(true)
    setStatus('正在生成六段式劇本。')
    setStatusType('info')

    try {
      const response = await fetch('/api/workbench/generate-script', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          thesis,
          material,
          channel_id: channelId,
          research_sources: researchSources,
          hook_variant: hookVariant,
          narrative_mode: narrativeMode,
          target_minutes: targetMinutes,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || '生成劇本失敗。')
      setTitle(data.title ?? thesis)
      setParts(data.parts ?? EMPTY_PARTS)
      setStatus('劇本已生成，可以直接編輯。')
      setStatusType('success')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : '生成劇本失敗。')
      setStatusType('error')
    } finally {
      setGenerating(false)
    }
  }

  async function saveScript() {
    setSaving(true)
    setStatus('正在儲存劇本。')
    setStatusType('info')

    try {
      const response = await fetch('/api/workbench/save-script', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          thesis,
          material,
          title,
          parts,
          research_sources: researchSources,
          channel_id: channelId,
          hook_variant: hookVariant,
          target_minutes: targetMinutes,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || '儲存劇本失敗。')

      if (topicId && data.script?.id) {
        const topicResponse = await fetch('/api/topics', {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ id: topicId, status: 'scripted', script_id: data.script.id }),
        })
        const topicData = await topicResponse.json()
        if (!topicResponse.ok) throw new Error(topicData.error || '劇本已儲存，但回寫題材狀態失敗。')
      }

      setStatus(`已儲存：${data.script?.title ?? title}`)
      setStatusType('success')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : '儲存劇本失敗。')
      setStatusType('error')
    } finally {
      setSaving(false)
    }
  }

  function updatePart(index: number, content: string) {
    setParts((current) => current.map((part, partIndex) => (partIndex === index ? { ...part, content } : part)))
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="wb-shell">
        <main className="wb-main">
          <header className="wb-top">
            <div>
              <div className="wb-kicker">SCRIPT</div>
              <h1 className="wb-title">YouTube 劇本生產線</h1>
              <p className="wb-subtitle">
                先定論點，AI 負責研究、拆解和整理成六段式劇本；只有結構性問題先提示，其餘照你的方向推進。
              </p>
            </div>
            <a className="wb-link" href="/">返回題材庫</a>
          </header>

          <div className="wb-banner">
            <img src="/youtube-banner.jpg" alt="YouTube 劇本生產線" />
          </div>

          <div className="wb-grid">
            <section className="wb-panel">
              <h2>輸入資料</h2>
              <label className="wb-field">
                <span className="wb-label">頻道</span>
                <select className="wb-select" value={channelId} onChange={(event) => setChannelId(event.target.value)}>
                  <option value="">請選擇頻道</option>
                  {channels.map((channel) => (
                    <option key={channel.id} value={channel.id}>
                      {channel.name}
                    </option>
                  ))}
                </select>
              </label>

              {selectedChannel ? (
                <div className="wb-status info">
                  {selectedChannel.positioning}
                  <br />
                  語氣：{selectedChannel.tone}
                </div>
              ) : null}

              <label className="wb-field">
                <span className="wb-label">你的論點</span>
                <textarea
                  ref={thesisRef}
                  className="wb-textarea"
                  value={thesis}
                  onChange={(event) => setThesis(event.target.value)}
                  placeholder="一句講清楚你想拆解的系統，以及你的切入角度"
                />
              </label>

              <label className="wb-field">
                <span className="wb-label">你手上的資料 / 來源（可留空）</span>
                <textarea
                  ref={materialRef}
                  className="wb-textarea"
                  value={material}
                  onChange={(event) => setMaterial(event.target.value)}
                  placeholder="貼新聞、背景、連結；留空時 AI 會自行補查"
                />
              </label>

              <div className="wb-row">
                <label className="wb-field" style={{ flex: '1 1 170px', marginBottom: 0 }}>
                  <span className="wb-label">開場變體</span>
                  <select className="wb-select" value={hookVariant} onChange={(event) => setHookVariant(event.target.value)}>
                    <option value="thesis">論點型</option>
                    <option value="mystery">懸念型</option>
                    <option value="contrast">對照型</option>
                  </select>
                </label>

                <label className="wb-field" style={{ flex: '1 1 180px', marginBottom: 0 }}>
                  <span className="wb-label">敘事模式</span>
                  <select className="wb-select" value={narrativeMode} onChange={(event) => setNarrativeMode(event.target.value)}>
                    <option value="detached_narration">抽離旁白</option>
                    <option value="first_person_quest">第一人稱求證</option>
                  </select>
                </label>

                <label className="wb-field" style={{ width: 120, marginBottom: 0 }}>
                  <span className="wb-label">片長（分鐘）</span>
                  <input
                    className="wb-input"
                    type="number"
                    min={6}
                    max={30}
                    value={targetMinutes}
                    onChange={(event) => setTargetMinutes(Number(event.target.value))}
                  />
                </label>
              </div>

              <div className="wb-row" style={{ marginTop: 16 }}>
                <button className="wb-btn primary" type="button" onClick={runResearch} disabled={researching}>
                  {researching ? '研究中...' : '研究 + 拆解'}
                </button>
              </div>
            </section>

            <section className="wb-panel">
              <h2>研究結果</h2>
              {status ? <div className={`wb-status ${statusType}`}>{status}</div> : null}
              {searchSkipped ? <div className="wb-status info">網絡搜尋暫時未執行；結果以現有材料和模型分析為主。</div> : null}

              {researchSources.length ? (
                <div className="wb-card-list">
                  {researchSources.map((source, index) => (
                    <article className="wb-source" key={`${source.source_url}-${index}`}>
                      <div className="wb-source-top">
                        <p>{source.point}</p>
                        <span className="wb-badge">{source.credibility}</span>
                      </div>
                      <div className="wb-row" style={{ marginTop: 10 }}>
                        <span className="wb-badge">{source.supports}</span>
                        <a href={source.source_url} target="_blank" rel="noreferrer">
                          {source.source_url}
                        </a>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="wb-status info">未有研究結果。先輸入論點，再按「研究 + 拆解」。</div>
              )}

              {flags.length ? (
                <div className="wb-card-list" style={{ marginTop: 14 }}>
                  {flags.map((flag, index) => (
                    <article className="wb-flag" key={`${flag.type}-${index}`}>
                      <p>{flag.message}</p>
                      <div className="wb-row" style={{ marginTop: 12 }}>
                        <button className="wb-btn primary" type="button" onClick={generateScript} disabled={generating}>
                          照寫
                        </button>
                        <button className="wb-btn" type="button" onClick={() => materialRef.current?.focus()}>
                          我補料
                        </button>
                        <button className="wb-btn" type="button" onClick={() => thesisRef.current?.focus()}>
                          我改論點
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : researchSources.length ? (
                <div className="wb-row" style={{ marginTop: 16 }}>
                  <button className="wb-btn primary" type="button" onClick={generateScript} disabled={generating}>
                    {generating ? '生成中...' : '生成劇本'}
                  </button>
                </div>
              ) : null}
            </section>
          </div>

          {title || parts.some((part) => part.content) ? (
            <section className="wb-panel" style={{ marginTop: 18 }}>
              <h2>劇本草稿</h2>
              <label className="wb-field">
                <span className="wb-label">標題</span>
                <input className="wb-input wb-title-input" value={title} onChange={(event) => setTitle(event.target.value)} />
              </label>
              <div className="wb-card-list">
                {parts.map((part, index) => (
                  <article className="wb-part" key={part.role}>
                    <h3>{index + 1}. {part.roleLabel}</h3>
                    <textarea className="wb-textarea" value={part.content} onChange={(event) => updatePart(index, event.target.value)} />
                  </article>
                ))}
              </div>
              <div className="wb-row" style={{ marginTop: 16 }}>
                <button className="wb-btn primary" type="button" onClick={saveScript} disabled={saving}>
                  {saving ? '儲存中...' : '儲存'}
                </button>
              </div>
            </section>
          ) : null}
        </main>
      </div>
    </>
  )
}
