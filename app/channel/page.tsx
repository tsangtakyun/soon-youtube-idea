'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

import type { ChannelDna, ChannelSeries, RubricCriterion } from '@/lib/channel-dna'

type Status = { type: 'loading' | 'success' | 'error'; message: string } | null

const EMPTY_SERIES: ChannelSeries = { name: '', domain: '' }
const EMPTY_CHANNEL: ChannelDna = {
  name: '',
  positioning: '',
  value_shift: '',
  tone: '',
  rubric_config: { criteria: [], confirmed: false, generated_at: '' },
  series: [{ ...EMPTY_SERIES }],
}

const CSS = `
* { box-sizing: border-box; }
body { background: #f6f3ee !important; color: #202027 !important; }
.dna-shell { min-height: 100vh; background: #f6f3ee; color: #202027; }
.dna-main { width: min(1120px, calc(100vw - 40px)); margin: 0 auto; padding: 32px 0 72px; }
.dna-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; margin-bottom: 22px; }
.dna-kicker { font-size: 12px; color: #7b7369; letter-spacing: .14em; text-transform: uppercase; }
.dna-title { margin: 6px 0 8px; font-size: 34px; line-height: 1.08; letter-spacing: -0.01em; }
.dna-subtitle { color: #645d55; line-height: 1.6; max-width: 660px; font-size: 15px; }
.dna-link { color: #5746d9; text-decoration: none; font-size: 14px; font-weight: 600; }
.dna-card { background: #fffaf3; border: 1px solid #e3dbcf; border-radius: 8px; box-shadow: 0 10px 24px rgba(57,43,25,.06); }
.dna-section { padding: 22px; }
.dna-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
.dna-field { display: grid; gap: 8px; }
.dna-label { font-size: 13px; color: #514b45; font-weight: 700; }
.dna-hint { font-size: 12px; color: #8b8175; line-height: 1.45; }
.dna-input, .dna-textarea { width: 100%; border: 1px solid #d9cfc2; background: #fffdf9; color: #202027; border-radius: 8px; padding: 12px 13px; font: inherit; outline: none; }
.dna-textarea { min-height: 104px; resize: vertical; line-height: 1.6; }
.dna-input:focus, .dna-textarea:focus { border-color: #7967ff; box-shadow: 0 0 0 3px rgba(121,103,255,.14); }
.dna-steps { display: flex; gap: 8px; margin-bottom: 16px; }
.dna-step { height: 8px; flex: 1; border-radius: 99px; background: #e2d8cb; }
.dna-step.active { background: #6b5cff; }
.dna-actions { display: flex; justify-content: space-between; gap: 12px; margin-top: 22px; flex-wrap: wrap; }
.dna-btn { border: 1px solid #d7ccbf; background: #fffdf9; color: #27242f; border-radius: 8px; padding: 11px 15px; font: inherit; font-weight: 700; cursor: pointer; }
.dna-btn.primary { border-color: #6b5cff; background: #6b5cff; color: white; }
.dna-btn.danger { border-color: #ef9a9a; color: #b3261e; background: #fff7f6; }
.dna-btn:disabled { opacity: .55; cursor: not-allowed; }
.dna-series-list { display: grid; gap: 12px; }
.dna-series-row { display: grid; grid-template-columns: minmax(0, .65fr) minmax(0, 1fr) auto; gap: 12px; align-items: start; padding: 14px; border: 1px solid #eadfce; border-radius: 8px; background: #fffdf9; }
.dna-rubric-grid { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 12px; }
.dna-rubric { padding: 14px; border: 1px solid #e4d9ca; border-radius: 8px; background: #fffdf9; display: grid; gap: 10px; }
.dna-rubric-head { display: flex; justify-content: space-between; gap: 10px; align-items: baseline; }
.dna-rubric-label { font-weight: 800; font-size: 15px; }
.dna-rubric-source { font-size: 11px; color: #8b8175; white-space: nowrap; }
.dna-status { margin-bottom: 16px; border-radius: 8px; padding: 12px 14px; font-size: 14px; line-height: 1.5; }
.dna-status.loading { background: #edeaff; color: #4432b8; }
.dna-status.success { background: #e9f8ef; color: #157347; }
.dna-status.error { background: #fff0ef; color: #b3261e; }
.dna-summary { display: grid; grid-template-columns: minmax(0, .85fr) minmax(0, 1.15fr); gap: 18px; align-items: start; }
.dna-list { display: grid; gap: 10px; }
.dna-muted { color: #7d746a; font-size: 13px; line-height: 1.55; }
.dna-divider { height: 1px; background: #e5dacd; margin: 20px 0; }
@media (max-width: 960px) {
  .dna-grid, .dna-summary, .dna-rubric-grid { grid-template-columns: 1fr; }
  .dna-series-row { grid-template-columns: 1fr; }
  .dna-top { flex-direction: column; }
}
`

function withUpdatedSeries(series: ChannelSeries[], index: number, patch: Partial<ChannelSeries>) {
  return series.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item))
}

export default function ChannelPage() {
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState(0)
  const [channel, setChannel] = useState<ChannelDna>(EMPTY_CHANNEL)
  const [status, setStatus] = useState<Status>(null)
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [addingSeries, setAddingSeries] = useState(false)
  const [newSeries, setNewSeries] = useState<ChannelSeries>({ ...EMPTY_SERIES })

  const hasSavedChannel = Boolean(channel.id)
  const domains = useMemo(
    () => channel.series.map((item) => item.domain.trim()).filter(Boolean),
    [channel.series]
  )

  useEffect(() => {
    void loadChannel()
  }, [])

  async function loadChannel() {
    setLoading(true)
    try {
      const response = await fetch('/api/channel-dna', { cache: 'no-store' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || '載入失敗')
      if (data.channel) {
        setChannel({
          ...data.channel,
          series: data.channel.series?.length ? data.channel.series : [{ ...EMPTY_SERIES }],
        })
        setStep(2)
      }
    } catch (error) {
      setStatus({ type: 'error', message: error instanceof Error ? error.message : '載入失敗' })
    } finally {
      setLoading(false)
    }
  }

  function updateField<K extends keyof ChannelDna>(key: K, value: ChannelDna[K]) {
    setChannel((current) => ({ ...current, [key]: value }))
  }

  function updateCriterion(index: number, standard: string) {
    setChannel((current) => ({
      ...current,
      rubric_config: {
        ...current.rubric_config,
        criteria: current.rubric_config.criteria.map((criterion, criterionIndex) =>
          criterionIndex === index ? { ...criterion, standard } : criterion
        ),
      },
    }))
  }

  function canGenerate() {
    return (
      channel.positioning.trim() &&
      channel.value_shift.trim() &&
      channel.tone.trim() &&
      domains.length > 0
    )
  }

  async function generateRubric() {
    if (!canGenerate()) {
      setStatus({ type: 'error', message: '請先填完整頻道基因同至少一個系列題材。' })
      return
    }

    setGenerating(true)
    setStatus({ type: 'loading', message: 'AI 正在提出專屬評分準則...' })
    try {
      const response = await fetch('/api/channel-dna/generate-rubric', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          positioning: channel.positioning,
          value_shift: channel.value_shift,
          tone: channel.tone,
          domains,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || '生成失敗')
      setChannel((current) => ({
        ...current,
        rubric_config: {
          criteria: data.criteria as RubricCriterion[],
          confirmed: false,
          generated_at: new Date().toISOString(),
        },
      }))
      setStep(2)
      setStatus({ type: 'success', message: '已生成五條準則，請逐條檢查同修改。' })
    } catch (error) {
      setStatus({ type: 'error', message: error instanceof Error ? error.message : '生成失敗' })
    } finally {
      setGenerating(false)
    }
  }

  async function saveChannel() {
    setSaving(true)
    setStatus({ type: 'loading', message: '正在儲存頻道基因...' })
    try {
      const response = await fetch('/api/channel-dna', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...channel,
          rubric_config: {
            ...channel.rubric_config,
            confirmed: true,
          },
          series: channel.series.filter((item) => item.name.trim() && item.domain.trim()),
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || '儲存失敗')
      setChannel({
        ...data.channel,
        series: data.channel.series?.length ? data.channel.series : [{ ...EMPTY_SERIES }],
      })
      setStep(2)
      setStatus({ type: 'success', message: '頻道基因已確認並儲存。' })
    } catch (error) {
      setStatus({ type: 'error', message: error instanceof Error ? error.message : '儲存失敗' })
    } finally {
      setSaving(false)
    }
  }

  async function addSavedSeries() {
    if (!channel.id || !newSeries.name.trim() || !newSeries.domain.trim()) return
    setAddingSeries(true)
    try {
      const response = await fetch('/api/channel-dna/series', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel_id: channel.id,
          name: newSeries.name,
          domain: newSeries.domain,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || '新增失敗')
      setChannel((current) => ({ ...current, series: [...current.series, data.series] }))
      setNewSeries({ ...EMPTY_SERIES })
      setStatus({ type: 'success', message: '已新增系列。題材空隙會留待後續 module 計算。' })
    } catch (error) {
      setStatus({ type: 'error', message: error instanceof Error ? error.message : '新增失敗' })
    } finally {
      setAddingSeries(false)
    }
  }

  async function deleteSeries(index: number) {
    const target = channel.series[index]
    if (!target) return
    if (target.id) {
      const response = await fetch(`/api/channel-dna/series?id=${target.id}`, { method: 'DELETE' })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        setStatus({ type: 'error', message: data.error || '刪除失敗' })
        return
      }
    }
    setChannel((current) => ({
      ...current,
      series: current.series.filter((_, itemIndex) => itemIndex !== index),
    }))
  }

  function renderChannelFields() {
    return (
      <div className="dna-grid">
        <label className="dna-field">
          <span className="dna-label">頻道名稱</span>
          <input
            className="dna-input"
            value={channel.name}
            onChange={(event) => updateField('name', event.target.value)}
          />
        </label>
        <label className="dna-field">
          <span className="dna-label">語氣</span>
          <input
            className="dna-input"
            value={channel.tone}
            onChange={(event) => updateField('tone', event.target.value)}
            placeholder="你把聲係點？"
          />
        </label>
        <label className="dna-field">
          <span className="dna-label">定位句</span>
          <span className="dna-hint">你條頻道一句講晒係做咩？</span>
          <textarea
            className="dna-textarea"
            value={channel.positioning}
            onChange={(event) => updateField('positioning', event.target.value)}
          />
        </label>
        <label className="dna-field">
          <span className="dna-label">觀點 / 價值</span>
          <span className="dna-hint">你想觀眾睇完改變咗咩諗法？</span>
          <textarea
            className="dna-textarea"
            value={channel.value_shift}
            onChange={(event) => updateField('value_shift', event.target.value)}
          />
        </label>
      </div>
    )
  }

  function renderSeriesEditor() {
    return (
      <div className="dna-series-list">
        {channel.series.map((item, index) => (
          <div className="dna-series-row" key={item.id ?? index}>
            <label className="dna-field">
              <span className="dna-label">系列名稱</span>
              <input
                className="dna-input"
                value={item.name}
                onChange={(event) =>
                  setChannel((current) => ({
                    ...current,
                    series: withUpdatedSeries(current.series, index, { name: event.target.value }),
                  }))
                }
                placeholder="如「迷思」"
              />
            </label>
            <label className="dna-field">
              <span className="dna-label">題材</span>
              <input
                className="dna-input"
                value={item.domain}
                onChange={(event) =>
                  setChannel((current) => ({
                    ...current,
                    series: withUpdatedSeries(current.series, index, { domain: event.target.value }),
                  }))
                }
                placeholder="你會拎咩題材嚟講？"
              />
            </label>
            <button
              className="dna-btn danger"
              type="button"
              onClick={() => void deleteSeries(index)}
              disabled={channel.series.length === 1 && !item.name && !item.domain}
            >
              刪除
            </button>
          </div>
        ))}
        <button
          className="dna-btn"
          type="button"
          onClick={() =>
            setChannel((current) => ({
              ...current,
              series: [...current.series, { ...EMPTY_SERIES }],
            }))
          }
        >
          + 加多個系列
        </button>
      </div>
    )
  }

  function renderRubricEditor() {
    return channel.rubric_config.criteria.length === 0 ? (
      <div className="dna-muted">未有評分準則。請先按「生成評分準則」。</div>
    ) : (
      <div className="dna-rubric-grid">
        {channel.rubric_config.criteria.map((criterion, index) => (
          <article className="dna-rubric" key={criterion.key}>
            <div className="dna-rubric-head">
              <span className="dna-rubric-label">{criterion.label}</span>
              <span className="dna-rubric-source">來自：{criterion.source}</span>
            </div>
            <textarea
              className="dna-textarea"
              value={criterion.standard}
              onChange={(event) => updateCriterion(index, event.target.value)}
            />
          </article>
        ))}
      </div>
    )
  }

  const showWizard = !hasSavedChannel

  return (
    <>
      <style>{CSS}</style>
      <div className="dna-shell">
        <main className="dna-main">
          <header className="dna-top">
            <div>
              <div className="dna-kicker">Editorial Workbench · Module 1</div>
              <h1 className="dna-title">頻道基因</h1>
              <p className="dna-subtitle">
                先定義頻道定位、價值、語氣同系列題材，再由 AI 提出專屬評分準則。
                AI 只係提出，把尺由你確認。
              </p>
            </div>
            <Link className="dna-link" href="/">
              返回趨勢掃描器
            </Link>
          </header>

          {status && <div className={`dna-status ${status.type}`}>{status.message}</div>}
          {loading ? (
            <section className="dna-card dna-section">載入中...</section>
          ) : showWizard ? (
            <section className="dna-card dna-section">
              <div className="dna-steps">
                {[0, 1, 2].map((item) => (
                  <div className={`dna-step ${item <= step ? 'active' : ''}`} key={item} />
                ))}
              </div>

              {step === 0 && (
                <>
                  <h2>第一步：頻道基因</h2>
                  {renderChannelFields()}
                </>
              )}

              {step === 1 && (
                <>
                  <h2>第二步：建立系列</h2>
                  <p className="dna-muted">每個系列代表你頻道其中一個長期題材分支。</p>
                  {renderSeriesEditor()}
                </>
              )}

              {step === 2 && (
                <>
                  <h2>第三步：生成 + 確認評分準則</h2>
                  <p className="dna-muted">
                    五條題目固定，但下面每條「實際標準」都應該貼住你剛才輸入嘅頻道基因。
                  </p>
                  <div className="dna-actions" style={{ justifyContent: 'flex-start' }}>
                    <button className="dna-btn primary" type="button" onClick={generateRubric} disabled={generating}>
                      {generating ? '生成中...' : '生成評分準則'}
                    </button>
                  </div>
                  <div className="dna-divider" />
                  {renderRubricEditor()}
                </>
              )}

              <div className="dna-actions">
                <button className="dna-btn" type="button" onClick={() => setStep((current) => Math.max(0, current - 1))} disabled={step === 0}>
                  上一步
                </button>
                {step < 2 ? (
                  <button className="dna-btn primary" type="button" onClick={() => setStep((current) => Math.min(2, current + 1))}>
                    下一步
                  </button>
                ) : (
                  <button
                    className="dna-btn primary"
                    type="button"
                    onClick={saveChannel}
                    disabled={saving || channel.rubric_config.criteria.length !== 5}
                  >
                    {saving ? '儲存中...' : '確認並儲存'}
                  </button>
                )}
              </div>
            </section>
          ) : (
            <div className="dna-summary">
              <section className="dna-card dna-section">
                <h2>頻道基因 summary</h2>
                {renderChannelFields()}
                <div className="dna-actions">
                  <button className="dna-btn" type="button" onClick={generateRubric} disabled={generating}>
                    {generating ? '重新生成中...' : '重新生成準則'}
                  </button>
                  <button className="dna-btn primary" type="button" onClick={saveChannel} disabled={saving}>
                    {saving ? '儲存中...' : '確認並儲存修改'}
                  </button>
                </div>
                <div className="dna-divider" />
                <h3>系列列表</h3>
                <div className="dna-list">
                  {channel.series.map((item, index) => (
                    <div className="dna-series-row" key={item.id ?? index}>
                      <div>
                        <strong>{item.name}</strong>
                        <div className="dna-muted">{item.domain}</div>
                      </div>
                      <div className="dna-muted">題材空隙：後續 module 計算</div>
                      <button className="dna-btn danger" type="button" onClick={() => void deleteSeries(index)}>
                        刪除
                      </button>
                    </div>
                  ))}
                </div>
                <div className="dna-divider" />
                <h3>新增系列</h3>
                <div className="dna-series-row">
                  <input
                    className="dna-input"
                    value={newSeries.name}
                    onChange={(event) => setNewSeries((current) => ({ ...current, name: event.target.value }))}
                    placeholder="系列名稱"
                  />
                  <input
                    className="dna-input"
                    value={newSeries.domain}
                    onChange={(event) => setNewSeries((current) => ({ ...current, domain: event.target.value }))}
                    placeholder="題材"
                  />
                  <button
                    className="dna-btn primary"
                    type="button"
                    onClick={addSavedSeries}
                    disabled={addingSeries || !newSeries.name.trim() || !newSeries.domain.trim()}
                  >
                    新增
                  </button>
                </div>
              </section>

              <section className="dna-card dna-section">
                <h2>五條評分準則</h2>
                <p className="dna-muted">
                  這五條會成為後續 Subject / Thesis / Angle module 嘅評判尺。
                </p>
                {renderRubricEditor()}
              </section>
            </div>
          )}
        </main>
      </div>
    </>
  )
}
