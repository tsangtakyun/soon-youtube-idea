'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

import type { ChannelDna, ChannelSeries, RubricCriterion } from '@/lib/channel-dna'
import {
  type EngineHookVariant,
  type EngineTone,
  VALID_ENGINE_HOOK_VARIANTS,
  VALID_ENGINE_TONES,
} from '@/lib/workbench-engine'

type Status = { type: 'loading' | 'success' | 'error'; message: string } | null

const EMPTY_SERIES: ChannelSeries = {
  name: '',
  domain: '',
  description: '',
  default_tone: 'documentary',
  default_hook: 'mystery',
}
const EMPTY_CHANNEL: ChannelDna = {
  name: '',
  positioning: '',
  value_shift: '',
  tone: '',
  rubric_config: { criteria: [], confirmed: false, generated_at: '' },
  series: [{ ...EMPTY_SERIES }],
}

const TONE_LABELS: Record<EngineTone, string> = {
  documentary: '紀錄片式 / Documentary',
  explainer: '解釋型 / Explainer',
  sharp_commentary: '銳利評論 / Sharp commentary',
  storyteller: '故事敘事 / Storyteller',
}

const HOOK_LABELS: Record<EngineHookVariant, string> = {
  mystery: '懸念開場 / Mystery',
  thesis: '論點先行 / Thesis',
  trojan_horse: '借題切入 / Trojan horse',
  contrast: '強烈對比 / Contrast',
  confession: '自白式 / Confession',
  statistic_shock: '數字震撼 / Statistic shock',
  glory_reversal: '光環反轉 / Glory reversal',
  conceptual_clickbait: '概念鉤子 / Conceptual clickbait',
}

function toneLabel(tone: EngineTone) {
  return `${tone} - ${TONE_LABELS[tone]}`
}

function hookLabel(hook: EngineHookVariant) {
  return `${hook} - ${HOOK_LABELS[hook]}`
}

const CSS = `
* { box-sizing: border-box; }
body { margin: 0; background: #f8f4ed !important; color: #17202a !important; font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
.dna-shell { min-height: 100vh; background: linear-gradient(180deg, rgba(255,255,255,.62), rgba(248,244,237,.96) 260px), #f8f4ed; color: #17202a; }
.dna-main { width: min(100%, 1640px); margin: 0 auto; padding: 24px 24px 64px; }
.dna-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 24px; margin-bottom: 34px; }
.dna-kicker { font-size: 11px; color: #6f5d4b; letter-spacing: .16em; font-weight: 650; text-transform: uppercase; }
.dna-title { margin: 8px 0 8px; font-size: clamp(34px, 4vw, 52px); line-height: 1; letter-spacing: 0; color: #111c26; font-weight: 760; }
.dna-subtitle { color: #5f6873; line-height: 1.7; max-width: 820px; font-size: 14px; margin: 0; }
.dna-link { color: #33251a; text-decoration: none; border: 1px solid #dacbb9; border-radius: 8px; padding: 10px 16px; background: rgba(255,255,255,.55); white-space: nowrap; font-size: 13px; font-weight: 680; }
.dna-link:hover { background: #fffaf2; border-color: #bda68c; }
.dna-card { background: rgba(255,255,255,.5); border: 1px solid #dfd2c1; border-radius: 8px; box-shadow: none; }
.dna-section { padding: 22px; }
.dna-section h2, .dna-section h3 { color: #111c26; letter-spacing: 0; }
.dna-grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
.dna-field { display: grid; gap: 8px; }
.dna-label { font-size: 13px; color: #111c26; font-weight: 760; }
.dna-hint { font-size: 12px; color: #6f5d4b; line-height: 1.5; }
.dna-input, .dna-textarea, .dna-select { width: 100%; border: 1px solid #dacbb9; background: rgba(255,255,255,.72); color: #17202a; border-radius: 8px; padding: 12px 13px; font: inherit; outline: none; }
.dna-textarea { min-height: 110px; resize: vertical; line-height: 1.65; }
.dna-select { min-height: 44px; }
.dna-input:focus, .dna-textarea:focus, .dna-select:focus { border-color: #6d4df5; box-shadow: 0 0 0 3px rgba(109,77,245,.14); }
.dna-steps { display: flex; gap: 8px; margin-bottom: 16px; }
.dna-step { height: 8px; flex: 1; border-radius: 99px; background: #e4d7c7; }
.dna-step.active { background: #2c1f16; }
.dna-actions { display: flex; justify-content: space-between; gap: 12px; margin-top: 22px; flex-wrap: wrap; }
.dna-btn { border: 1px solid #dacbb9; background: rgba(255,255,255,.55); color: #33251a; border-radius: 8px; padding: 11px 15px; font: inherit; font-size: 13px; font-weight: 680; cursor: pointer; }
.dna-btn.primary { border-color: #2c1f16; background: #2c1f16; color: #fffaf2; }
.dna-btn.danger { border-color: rgba(180,67,54,.32); color: #9c2f22; background: rgba(255,237,234,.72); }
.dna-btn:disabled { opacity: .55; cursor: not-allowed; }
.dna-series-list { display: grid; gap: 12px; }
.dna-series-row { display: grid; grid-template-columns: 1fr; gap: 12px; align-items: start; padding: 14px; border: 1px solid #dfd2c1; border-radius: 8px; background: rgba(255,250,242,.56); }
.dna-series-actions { display: flex; gap: 8px; flex-wrap: wrap; }
.dna-series-edit-grid { display: grid; grid-template-columns: 1fr; gap: 12px; }
.dna-inline-label { display: grid; gap: 7px; }
.dna-rubric-grid { display: grid; grid-template-columns: 1fr; gap: 12px; }
.dna-rubric { padding: 14px; border: 1px solid #dfd2c1; border-radius: 8px; background: rgba(255,250,242,.56); display: grid; gap: 10px; }
.dna-section-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 14px; }
.dna-section-head h2 { margin: 0 0 8px; }
.dna-section-head p { margin: 0; }
.dna-rubric-head { display: flex; justify-content: space-between; gap: 10px; align-items: baseline; }
.dna-rubric-label { font-weight: 760; font-size: 15px; color: #111c26; }
.dna-rubric-source { font-size: 11px; color: #6f5d4b; white-space: nowrap; }
.dna-status { margin-bottom: 16px; border-radius: 8px; padding: 12px 14px; font-size: 14px; line-height: 1.5; }
.dna-status.loading { background: rgba(255,255,255,.55); color: #5f6873; border: 1px solid #dfd2c1; }
.dna-status.success { background: rgba(28,132,80,.1); color: #1d7049; border: 1px solid rgba(28,132,80,.22); }
.dna-status.error { background: rgba(255,237,234,.72); color: #9c2f22; border: 1px solid rgba(180,67,54,.32); }
.dna-summary { display: grid; grid-template-columns: 1fr; gap: 18px; align-items: start; }
.dna-list { display: grid; gap: 10px; }
.dna-muted { color: #5f6873; font-size: 13px; line-height: 1.65; }
.dna-meta { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 8px; }
.dna-pill { border: 1px solid #dacbb9; border-radius: 999px; padding: 4px 9px; background: rgba(255,255,255,.62); color: #33251a; font-size: 12px; font-weight: 680; }
.dna-divider { height: 1px; background: #dfd2c1; margin: 20px 0; }
@media (max-width: 960px) {
  .dna-main { padding: 22px 16px 48px; }
  .dna-grid, .dna-summary { grid-template-columns: 1fr; }
  .dna-series-row { grid-template-columns: 1fr; }
  .dna-section-head { flex-direction: column; }
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
  const [editingSeriesId, setEditingSeriesId] = useState<string | null>(null)
  const [editingSeries, setEditingSeries] = useState<ChannelSeries>({ ...EMPTY_SERIES })
  const [savingSeries, setSavingSeries] = useState(false)

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
      setStatus({ type: 'error', message: '請先填完整頻道基因和至少一個系列題材。' })
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
      setStatus({ type: 'success', message: '已生成五條準則，請逐條檢查和修改。' })
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
          description: newSeries.description,
          default_tone: newSeries.default_tone,
          default_hook: newSeries.default_hook,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || '新增失敗')
      setChannel((current) => ({ ...current, series: [...current.series, data.series] }))
      setNewSeries({ ...EMPTY_SERIES })
      setStatus({ type: 'success', message: '已新增系列。題材空隙會留待後續模組計算。' })
    } catch (error) {
      setStatus({ type: 'error', message: error instanceof Error ? error.message : '新增失敗' })
    } finally {
      setAddingSeries(false)
    }
  }

  function startEditingSeries(item: ChannelSeries) {
    if (!item.id) return
    setEditingSeriesId(item.id)
    setEditingSeries({
      id: item.id,
      name: item.name,
      domain: item.domain,
      description: item.description ?? '',
      default_tone: item.default_tone ?? 'documentary',
      default_hook: item.default_hook ?? 'mystery',
      whitespace_context: item.whitespace_context,
    })
  }

  function cancelEditingSeries() {
    setEditingSeriesId(null)
    setEditingSeries({ ...EMPTY_SERIES })
  }

  async function saveEditedSeries() {
    if (!editingSeriesId || !editingSeries.name.trim() || !editingSeries.domain.trim()) return
    setSavingSeries(true)
    try {
      const response = await fetch('/api/channel-dna/series', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingSeriesId,
          name: editingSeries.name,
          domain: editingSeries.domain,
          description: editingSeries.description,
          default_tone: editingSeries.default_tone,
          default_hook: editingSeries.default_hook,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || '更新系列失敗')
      setChannel((current) => ({
        ...current,
        series: current.series.map((item) => (item.id === editingSeriesId ? data.series : item)),
      }))
      cancelEditingSeries()
      setStatus({ type: 'success', message: '系列已更新' })
    } catch (error) {
      setStatus({ type: 'error', message: error instanceof Error ? error.message : '更新系列失敗' })
    } finally {
      setSavingSeries(false)
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
            placeholder="這條頻道的語氣是怎樣？"
          />
        </label>
        <label className="dna-field">
          <span className="dna-label">定位句</span>
          <span className="dna-hint">用一句話說明這條頻道做甚麼。</span>
          <textarea
            className="dna-textarea"
            value={channel.positioning}
            onChange={(event) => updateField('positioning', event.target.value)}
          />
        </label>
        <label className="dna-field">
          <span className="dna-label">觀點 / 價值</span>
          <span className="dna-hint">你希望觀眾看完之後改變甚麼想法？</span>
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
                placeholder="這個系列會處理甚麼題材？"
              />
            </label>
            <label className="dna-field">
              <span className="dna-label">Description</span>
              <textarea
                className="dna-textarea"
                value={item.description ?? ''}
                onChange={(event) =>
                  setChannel((current) => ({
                    ...current,
                    series: withUpdatedSeries(current.series, index, { description: event.target.value }),
                  }))
                }
                placeholder="Editorial direction for this series"
              />
            </label>
            <label className="dna-field">
              <span className="dna-label">Default tone</span>
              <select
                className="dna-select"
                value={item.default_tone ?? ''}
                onChange={(event) =>
                  setChannel((current) => ({
                    ...current,
                    series: withUpdatedSeries(current.series, index, { default_tone: event.target.value }),
                  }))
                }
              >
                <option value="">No default</option>
                {VALID_ENGINE_TONES.map((tone) => (
                  <option key={tone} value={tone}>
                    {toneLabel(tone)}
                  </option>
                ))}
              </select>
            </label>
            <label className="dna-field">
              <span className="dna-label">Default hook</span>
              <select
                className="dna-select"
                value={item.default_hook ?? ''}
                onChange={(event) =>
                  setChannel((current) => ({
                    ...current,
                    series: withUpdatedSeries(current.series, index, { default_hook: event.target.value }),
                  }))
                }
              >
                <option value="">No default</option>
                {VALID_ENGINE_HOOK_VARIANTS.map((hook) => (
                  <option key={hook} value={hook}>
                    {hookLabel(hook)}
                  </option>
                ))}
              </select>
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
          + 新增一個系列
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
              <div className="dna-kicker">頻道基因設定</div>
              <h1 className="dna-title">頻道基因</h1>
              <p className="dna-subtitle">
                先定義頻道定位、價值、語氣和系列題材，再由 AI 提出專屬評分準則。
                AI 只負責提出，把尺由你確認。
              </p>
            </div>
            <Link className="dna-link" href="/">
              返回首頁
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
                    五條題目固定，但下面每條「實際標準」都應該貼住你剛才輸入的頻道基因。
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
                <h2>頻道基因摘要</h2>
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
                      {editingSeriesId === item.id ? (
                        <div className="dna-series-edit-grid">
                          <label className="dna-inline-label">
                            <span className="dna-label">系列名稱</span>
                            <input
                              aria-label={`Edit series name ${item.id}`}
                              className="dna-input"
                              value={editingSeries.name}
                              onChange={(event) =>
                                setEditingSeries((current) => ({ ...current, name: event.target.value }))
                              }
                            />
                          </label>
                          <label className="dna-inline-label">
                            <span className="dna-label">題材範圍</span>
                            <input
                              aria-label={`Edit series domain ${item.id}`}
                              className="dna-input"
                              value={editingSeries.domain}
                              onChange={(event) =>
                                setEditingSeries((current) => ({ ...current, domain: event.target.value }))
                              }
                            />
                          </label>
                          <label className="dna-inline-label">
                            <span className="dna-label">Editorial direction / 系列方向</span>
                            <textarea
                              aria-label={`Edit series description ${item.id}`}
                              className="dna-textarea"
                              value={editingSeries.description ?? ''}
                              onChange={(event) =>
                                setEditingSeries((current) => ({ ...current, description: event.target.value }))
                              }
                            />
                          </label>
                          <label className="dna-inline-label">
                            <span className="dna-label">Default tone / 預設語氣</span>
                            <select
                              aria-label={`Edit series tone ${item.id}`}
                              className="dna-select"
                              value={editingSeries.default_tone ?? ''}
                              onChange={(event) =>
                                setEditingSeries((current) => ({ ...current, default_tone: event.target.value }))
                              }
                            >
                              {VALID_ENGINE_TONES.map((tone) => (
                                <option key={tone} value={tone}>
                                  {toneLabel(tone)}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className="dna-inline-label">
                            <span className="dna-label">Default hook / 預設開場鉤子</span>
                            <select
                              aria-label={`Edit series hook ${item.id}`}
                              className="dna-select"
                              value={editingSeries.default_hook ?? ''}
                              onChange={(event) =>
                                setEditingSeries((current) => ({ ...current, default_hook: event.target.value }))
                              }
                            >
                              {VALID_ENGINE_HOOK_VARIANTS.map((hook) => (
                                <option key={hook} value={hook}>
                                  {hookLabel(hook)}
                                </option>
                              ))}
                            </select>
                          </label>
                          <div className="dna-series-actions">
                            <button
                              className="dna-btn primary"
                              type="button"
                              onClick={() => void saveEditedSeries()}
                              disabled={savingSeries || !editingSeries.name.trim() || !editingSeries.domain.trim()}
                            >
                              {savingSeries ? '儲存中...' : '儲存'}
                            </button>
                            <button className="dna-btn" type="button" onClick={cancelEditingSeries}>
                              取消
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div>
                            <strong>{item.name}</strong>
                            <div className="dna-muted">{item.domain}</div>
                            {item.description ? <div className="dna-muted">{item.description}</div> : null}
                            <div className="dna-meta">
                              <span className="dna-pill">tone: {item.default_tone || 'none'}</span>
                              <span className="dna-pill">hook: {item.default_hook || 'none'}</span>
                            </div>
                          </div>
                          <div className="dna-series-actions">
                            <button className="dna-btn" type="button" onClick={() => startEditingSeries(item)}>
                              編輯
                            </button>
                            <button className="dna-btn danger" type="button" onClick={() => void deleteSeries(index)}>
                              刪除
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
                <div className="dna-divider" />
                <h3>新增系列</h3>
                <div className="dna-series-row">
                  <label className="dna-inline-label">
                    <span className="dna-label">系列名稱</span>
                    <input
                      className="dna-input"
                      value={newSeries.name}
                      onChange={(event) => setNewSeries((current) => ({ ...current, name: event.target.value }))}
                      placeholder="系列名稱"
                    />
                  </label>
                  <label className="dna-inline-label">
                    <span className="dna-label">題材範圍</span>
                    <input
                      className="dna-input"
                      value={newSeries.domain}
                      onChange={(event) => setNewSeries((current) => ({ ...current, domain: event.target.value }))}
                      placeholder="題材"
                    />
                  </label>
                  <label className="dna-inline-label">
                    <span className="dna-label">Editorial direction / 系列方向</span>
                    <textarea
                      className="dna-textarea"
                      value={newSeries.description ?? ''}
                      onChange={(event) =>
                        setNewSeries((current) => ({ ...current, description: event.target.value }))
                      }
                      placeholder="Description / editorial direction"
                    />
                  </label>
                  <label className="dna-inline-label">
                    <span className="dna-label">Default tone / 預設語氣</span>
                    <select
                      className="dna-select"
                      value={newSeries.default_tone ?? ''}
                      onChange={(event) =>
                        setNewSeries((current) => ({ ...current, default_tone: event.target.value }))
                      }
                    >
                      {VALID_ENGINE_TONES.map((tone) => (
                        <option key={tone} value={tone}>
                          {toneLabel(tone)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="dna-inline-label">
                    <span className="dna-label">Default hook / 預設開場鉤子</span>
                    <select
                      className="dna-select"
                      value={newSeries.default_hook ?? ''}
                      onChange={(event) =>
                        setNewSeries((current) => ({ ...current, default_hook: event.target.value }))
                      }
                    >
                      {VALID_ENGINE_HOOK_VARIANTS.map((hook) => (
                        <option key={hook} value={hook}>
                          {hookLabel(hook)}
                        </option>
                      ))}
                    </select>
                  </label>
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
                <div className="dna-section-head">
                  <div>
                    <h2>五條評分準則</h2>
                    <p className="dna-muted">
                      這五條會成為後續題材、論點和角度模組的評判尺。
                    </p>
                  </div>
                  <button
                    className="dna-btn primary"
                    type="button"
                    onClick={saveChannel}
                    disabled={saving || channel.rubric_config.criteria.length !== 5}
                  >
                    {saving ? '儲存中...' : '儲存準則'}
                  </button>
                </div>
                {renderRubricEditor()}
              </section>
            </div>
          )}
        </main>
      </div>
    </>
  )
}
