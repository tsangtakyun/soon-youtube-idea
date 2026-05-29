'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

type Channel = {
  id: string
  name: string
  positioning: string
  value_shift: string
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
body { background: #fbfaf7; color: #241f1a; font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
.wb-shell { min-height: 100vh; background: #fbfaf7; }
.wb-main { width: min(1180px, calc(100% - 32px)); margin: 0 auto; padding: 32px 0 72px; }
.wb-top { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; margin-bottom: 28px; }
.wb-kicker { color: #9a6a32; font-size: 12px; letter-spacing: .14em; text-transform: uppercase; font-weight: 700; }
.wb-title { margin: 6px 0 8px; font-size: 32px; line-height: 1.15; letter-spacing: 0; }
.wb-subtitle { margin: 0; color: #746a5f; line-height: 1.7; max-width: 720px; }
.wb-link { color: #7c4a14; text-decoration: none; border: 1px solid #e7d4bc; border-radius: 8px; padding: 9px 12px; background: #fff; white-space: nowrap; }
.wb-grid { display: grid; grid-template-columns: 360px minmax(0, 1fr); gap: 18px; align-items: start; }
.wb-panel { background: #fff; border: 1px solid #e7ded2; border-radius: 8px; padding: 18px; box-shadow: 0 10px 28px rgba(44, 31, 18, .05); }
.wb-panel h2 { margin: 0 0 12px; font-size: 18px; }
.wb-field { display: grid; gap: 7px; margin-bottom: 14px; }
.wb-label { font-size: 13px; font-weight: 700; color: #40362d; }
.wb-input, .wb-select, .wb-textarea { width: 100%; border: 1px solid #d9cbbc; border-radius: 8px; background: #fffdf9; color: #241f1a; font: inherit; padding: 10px 12px; }
.wb-textarea { min-height: 142px; resize: vertical; line-height: 1.65; }
.wb-select { min-height: 42px; }
.wb-row { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
.wb-btn { border: 1px solid #d8c7b2; background: #fff; color: #463425; border-radius: 8px; padding: 10px 14px; font: inherit; font-weight: 700; cursor: pointer; }
.wb-btn.primary { background: #9a5c1d; border-color: #9a5c1d; color: #fff; }
.wb-btn.ghost { background: #f8f1e8; }
.wb-btn:disabled { opacity: .55; cursor: not-allowed; }
.wb-status { border-radius: 8px; padding: 11px 12px; margin: 12px 0; font-size: 14px; line-height: 1.55; }
.wb-status.info { background: #eef6ff; color: #1d4e89; border: 1px solid #cfe3ff; }
.wb-status.error { background: #fff0f0; color: #9f1d1d; border: 1px solid #f6c9c9; }
.wb-status.success { background: #eefaf2; color: #166534; border: 1px solid #c9eed5; }
.wb-card-list { display: grid; gap: 12px; }
.wb-source, .wb-flag, .wb-part { border: 1px solid #e7ded2; border-radius: 8px; background: #fffdf9; padding: 14px; }
.wb-source-top { display: flex; justify-content: space-between; gap: 12px; align-items: flex-start; }
.wb-source p, .wb-flag p { margin: 0; line-height: 1.65; }
.wb-badge { display: inline-flex; border-radius: 999px; padding: 4px 8px; background: #f3eadf; color: #7c4a14; font-size: 12px; white-space: nowrap; }
.wb-source a { color: #0f5f8f; font-size: 13px; overflow-wrap: anywhere; }
.wb-flag { border-color: #f1c27d; background: #fff8ed; }
.wb-part h3 { margin: 0 0 10px; font-size: 16px; }
.wb-part textarea { min-height: 190px; }
.wb-title-input { font-size: 20px; font-weight: 800; }
@media (max-width: 860px) {
  .wb-grid { grid-template-columns: 1fr; }
  .wb-top { flex-direction: column; }
}
`

export default function WorkbenchPage() {
  const [channels, setChannels] = useState<Channel[]>([])
  const [channelId, setChannelId] = useState('')
  const [thesis, setThesis] = useState('')
  const [material, setMaterial] = useState('')
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
      setStatus(data.search_skipped ? '研究完成；web search 暫時跳過，已根據現有材料拆解。' : '研究完成。')
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
    setStatus('正在生成 6-part 劇本。')
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
      setStatus('劇本已生成，可以逐段編輯。')
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
      if (!response.ok) throw new Error(data.error || '儲存失敗。')
      setStatus(`已儲存：${data.script?.title ?? title}`)
      setStatusType('success')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : '儲存失敗。')
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
              <div className="wb-kicker">Editorial Workbench</div>
              <h1 className="wb-title">論點 → 劇本生產線</h1>
              <p className="wb-subtitle">
                你先定論點，AI 負責研究、拆解同整理成 Fern 6-Part 劇本；有結構性大窿先提示，其餘照你的方向推進。
              </p>
            </div>
            <a className="wb-link" href="/">返回掃描器</a>
          </header>

          <div className="wb-grid">
            <section className="wb-panel">
              <h2>輸入</h2>
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
                <span className="wb-label">你嘅論點</span>
                <textarea
                  ref={thesisRef}
                  className="wb-textarea"
                  value={thesis}
                  onChange={(event) => setThesis(event.target.value)}
                  placeholder="一句講你想拆嘅系統，連你嘅切入角度"
                />
              </label>
              <label className="wb-field">
                <span className="wb-label">你手上嘅資料 / 來源（可留空）</span>
                <textarea
                  ref={materialRef}
                  className="wb-textarea"
                  value={material}
                  onChange={(event) => setMaterial(event.target.value)}
                  placeholder="貼新聞、背景、連結；留空 AI 會自己查"
                />
              </label>
              <div className="wb-row">
                <label className="wb-field" style={{ flex: '1 1 170px', marginBottom: 0 }}>
                  <span className="wb-label">hook 變體</span>
                  <select className="wb-select" value={hookVariant} onChange={(event) => setHookVariant(event.target.value)}>
                    <option value="thesis">論點型 thesis</option>
                    <option value="mystery">懸念型 mystery</option>
                    <option value="contrast">對照型 contrast</option>
                  </select>
                </label>
                <label className="wb-field" style={{ flex: '1 1 180px', marginBottom: 0 }}>
                  <span className="wb-label">敘事模式</span>
                  <select className="wb-select" value={narrativeMode} onChange={(event) => setNarrativeMode(event.target.value)}>
                    <option value="detached_narration">抽離旁白</option>
                    <option value="first_person_quest">第一人稱 quest</option>
                  </select>
                </label>
                <label className="wb-field" style={{ width: 120, marginBottom: 0 }}>
                  <span className="wb-label">分鐘</span>
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
              {searchSkipped ? <div className="wb-status info">web search 暫時未執行；結果以現有材料和模型分析為主。</div> : null}

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
