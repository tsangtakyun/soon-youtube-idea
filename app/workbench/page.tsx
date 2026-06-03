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

type ClaimRow = {
  paragraph: number
  claim: string
}

type TopicPayload = {
  id: string
  ew_channel_id: string
  series_id: string | null
  thesis: string
  material: string
  series?: {
    id: string
    name: string
    domain: string
  } | null
}

type SavedScriptSummary = {
  id: string
  title: string
  topic: string
  ew_channel_id: string
  updated_at?: string
  created_at?: string
}

type SavedScriptPayload = SavedScriptSummary & {
  background: string
  hook_variant: string
  target_minutes: number
  parts: ScriptPart[]
  research_sources: ResearchSource[]
}

function stringifyUnknownError(value: unknown): string {
  if (!value) return ''
  if (typeof value === 'string') return value
  if (value instanceof Error) return value.message
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>
    for (const key of ['message', 'error', 'detail', 'details']) {
      const nested = stringifyUnknownError(record[key])
      if (nested) return nested
    }
    try {
      return JSON.stringify(value)
    } catch {
      return ''
    }
  }
  return String(value)
}

function apiErrorMessage(data: unknown, fallback: string) {
  const record = data && typeof data === 'object' ? (data as Record<string, unknown>) : null
  return stringifyUnknownError(record?.error ?? record?.message ?? data) || fallback
}

const EMPTY_PARTS: ScriptPart[] = [
  { role: 'hook', roleLabel: '開場', content: '' },
  { role: 'setup', roleLabel: '論點 / 背景', content: '' },
  { role: 'detail', roleLabel: '細節', content: '' },
  { role: 'complication', roleLabel: '轉折', content: '' },
  { role: 'depth', roleLabel: '深層拆解', content: '' },
  { role: 'resolution', roleLabel: '收結', content: '' },
]

const FACT_CHECK_HEAD_REMARK =
  '⚠️ 此稿由 AI 生成。所有具體事實（人名、日期、數字、地點、引述、機構）都可能有誤或屬捏造，使用前必須逐項自行查證。'

const FACT_CHECK_TAIL_REMARK =
  '⚠️ 事實查核提醒｜AI 嘅強項係結構同敘事，唔係事實準確性。呢份稿入面每一個具體事實都可能係錯或者捏造嘅，出街前請確認每個說法都有可靠來源。查核責任在使用者。'

const CSS = `
* { box-sizing: border-box; }
body { margin: 0; background: #f8f4ed; color: #17202a; font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
.wb-shell { min-height: 100vh; background: linear-gradient(180deg, rgba(255,255,255,.62), rgba(248,244,237,.96) 260px), #f8f4ed; color: #17202a; }
.wb-main { width: min(100%, 1640px); margin: 0 auto; padding: 24px 24px 64px; }
.wb-top { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; margin-bottom: 20px; }
.wb-kicker { color: #6f5d4b; font-size: 11px; letter-spacing: .16em; font-weight: 650; text-transform: uppercase; }
.wb-title { margin: 8px 0 8px; font-size: clamp(34px, 4vw, 52px); line-height: 1; color: #111c26; letter-spacing: 0; font-weight: 760; }
.wb-subtitle { margin: 0; color: #5f6873; line-height: 1.7; max-width: 820px; font-size: 14px; }
.wb-link { color: #33251a; text-decoration: none; border: 1px solid #dacbb9; border-radius: 8px; padding: 10px 16px; background: rgba(255,255,255,.55); white-space: nowrap; font-size: 13px; font-weight: 680; }
.wb-link:hover { background: #fffaf2; border-color: #bda68c; }
.wb-grid { display: grid; grid-template-columns: 380px minmax(0, 1fr); gap: 18px; align-items: start; }
.wb-panel { background: rgba(255,255,255,.5); border: 1px solid #dfd2c1; border-radius: 8px; padding: 18px; box-shadow: none; }
.wb-panel h2 { margin: 0 0 14px; font-size: 18px; color: #111c26; }
.wb-field { display: grid; gap: 7px; margin-bottom: 14px; }
.wb-label { font-size: 13px; font-weight: 760; color: #111c26; }
.wb-input, .wb-select, .wb-textarea { width: 100%; border: 1px solid #dacbb9; border-radius: 8px; background: rgba(255,255,255,.72); color: #17202a; font: inherit; padding: 11px 12px; outline: none; }
.wb-input:focus, .wb-select:focus, .wb-textarea:focus { border-color: #6d4df5; box-shadow: 0 0 0 3px rgba(109,77,245,.14); }
.wb-input::placeholder, .wb-textarea::placeholder { color: #8b8178; }
.wb-textarea { min-height: 142px; resize: vertical; line-height: 1.65; }
.wb-select { min-height: 42px; }
.wb-row { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
.wb-btn { border: 1px solid #dacbb9; background: rgba(255,255,255,.55); color: #33251a; border-radius: 8px; padding: 10px 14px; font: inherit; font-size: 13px; font-weight: 680; cursor: pointer; }
.wb-btn.primary { background: #2c1f16; border-color: #2c1f16; color: #fffaf2; }
.wb-btn:disabled { opacity: .55; cursor: not-allowed; }
.wb-saved-row { display: grid; grid-template-columns: minmax(0, 1fr) auto auto; gap: 10px; align-items: end; margin-bottom: 14px; }
.wb-script-actions { margin-top: 16px; padding-top: 16px; border-top: 1px solid #dfd2c1; }
.wb-status { border-radius: 8px; padding: 11px 12px; margin: 12px 0; font-size: 14px; line-height: 1.55; }
.wb-status.info { background: rgba(255,255,255,.55); color: #5f6873; border: 1px solid #dfd2c1; }
.wb-status.error { background: rgba(255,237,234,.72); color: #9c2f22; border: 1px solid rgba(180,67,54,.32); }
.wb-status.success { background: rgba(28,132,80,.1); color: #1d7049; border: 1px solid rgba(28,132,80,.22); }
.wb-copy-fallback { margin-top: 12px; border: 1px solid #dacbb9; border-radius: 8px; background: rgba(255,250,242,.72); padding: 14px; }
.wb-copy-fallback p { margin: 0 0 10px; color: #5f6873; line-height: 1.6; font-size: 13px; }
.wb-copy-fallback textarea { min-height: 260px; }
.wb-card-list { display: grid; gap: 12px; }
.wb-source, .wb-flag, .wb-part { border: 1px solid #dfd2c1; border-radius: 8px; background: rgba(255,250,242,.56); padding: 14px; }
.wb-source-top { display: flex; justify-content: space-between; gap: 12px; align-items: flex-start; }
.wb-source p, .wb-flag p { margin: 0; line-height: 1.65; }
.wb-badge { display: inline-flex; border-radius: 999px; padding: 4px 8px; background: #f2eadf; color: #6f5d4b; font-size: 12px; white-space: nowrap; border: 1px solid #dfd2c1; }
.wb-source a { color: #5a3dd5; font-size: 13px; overflow-wrap: anywhere; }
.wb-flag { border-color: rgba(198,145,66,.34); background: rgba(255,244,224,.72); }
.wb-part h3 { margin: 0 0 10px; font-size: 16px; color: #111c26; }
.wb-part textarea { min-height: 190px; }
.wb-title-input { font-size: 20px; font-weight: 800; }
.wb-fact-remark { border: 1px solid rgba(198,145,66,.48); border-left: 4px solid #b97716; border-radius: 8px; background: rgba(255,244,224,.9); color: #5b3511; padding: 13px 14px; line-height: 1.6; font-weight: 680; margin: 14px 0; }
.wb-claim-panel { margin-top: 16px; border: 1px solid #dfd2c1; border-radius: 8px; background: rgba(255,250,242,.56); padding: 14px; }
.wb-claim-panel h3 { margin: 0 0 8px; font-size: 16px; color: #111c26; }
.wb-claim-panel p { margin: 0 0 12px; color: #5f6873; line-height: 1.6; font-size: 13px; }
.wb-claim-list { margin: 0; padding-left: 20px; display: grid; gap: 9px; }
.wb-claim-list li { line-height: 1.55; color: #17202a; }
.wb-claim-paragraph { color: #6f5d4b; font-weight: 760; }
@media (max-width: 860px) {
  .wb-main { padding: 22px 16px 48px; }
  .wb-grid { grid-template-columns: 1fr; }
  .wb-top { flex-direction: column; }
  .wb-saved-row { grid-template-columns: 1fr; }
}
`

export default function WorkbenchPage() {
  const [channels, setChannels] = useState<Channel[]>([])
  const [channelId, setChannelId] = useState('')
  const [seriesId, setSeriesId] = useState('')
  const [seriesName, setSeriesName] = useState('')
  const [thesis, setThesis] = useState('')
  const [material, setMaterial] = useState('')
  const [topicId, setTopicId] = useState('')
  const [hookVariant, setHookVariant] = useState('mystery')
  const [narrativeMode, setNarrativeMode] = useState('first_person_quest')
  const [targetMinutes, setTargetMinutes] = useState(10)
  const [researchSources, setResearchSources] = useState<ResearchSource[]>([])
  const [flags, setFlags] = useState<Flag[]>([])
  const [searchSkipped, setSearchSkipped] = useState(false)
  const [scriptId, setScriptId] = useState('')
  const [savedScripts, setSavedScripts] = useState<SavedScriptSummary[]>([])
  const [selectedSavedScriptId, setSelectedSavedScriptId] = useState('')
  const [loadingSavedScript, setLoadingSavedScript] = useState(false)
  const [deletingSavedScriptId, setDeletingSavedScriptId] = useState('')
  const [title, setTitle] = useState('')
  const [parts, setParts] = useState<ScriptPart[]>(EMPTY_PARTS)
  const [status, setStatus] = useState('')
  const [statusType, setStatusType] = useState<'info' | 'error' | 'success'>('info')
  const [researching, setResearching] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [extractingClaims, setExtractingClaims] = useState(false)
  const [exportingDoc, setExportingDoc] = useState(false)
  const [manualCopyText, setManualCopyText] = useState('')
  const [claimRows, setClaimRows] = useState<ClaimRow[]>([])
  const [claimStatus, setClaimStatus] = useState('')
  const thesisRef = useRef<HTMLTextAreaElement | null>(null)
  const materialRef = useRef<HTMLTextAreaElement | null>(null)
  const manualCopyRef = useRef<HTMLTextAreaElement | null>(null)

  const selectedChannel = useMemo(
    () => channels.find((channel) => channel.id === channelId),
    [channels, channelId]
  )

  async function loadSavedScripts(nextChannelId = channelId) {
    const query = nextChannelId ? `?channel_id=${encodeURIComponent(nextChannelId)}` : ''
    const response = await fetch(`/api/workbench/scripts${query}`, { cache: 'no-store' })
    const data = await response.json()
    if (!response.ok) throw new Error(apiErrorMessage(data, '讀取已儲存劇本失敗。'))
    setSavedScripts(Array.isArray(data.scripts) ? data.scripts : [])
  }

  async function openSavedScript(nextScriptId: string) {
    if (!nextScriptId) return
    setLoadingSavedScript(true)
    setStatus('正在載入已儲存劇本。')
    setStatusType('info')

    try {
      const response = await fetch(`/api/workbench/scripts?id=${encodeURIComponent(nextScriptId)}`, { cache: 'no-store' })
      const data = await response.json()
      if (!response.ok) throw new Error(apiErrorMessage(data, '讀取已儲存劇本失敗。'))

      const saved = data.script as SavedScriptPayload
      setScriptId(saved.id)
      setSelectedSavedScriptId(saved.id)
      setChannelId(saved.ew_channel_id ?? channelId)
      setSeriesId('')
      setSeriesName('')
      setThesis(saved.topic ?? '')
      setMaterial(saved.background ?? '')
      setHookVariant(saved.hook_variant || 'mystery')
      setTargetMinutes(Number(saved.target_minutes ?? 10) || 10)
      setTitle(saved.title ?? saved.topic ?? '')
      setParts(Array.isArray(saved.parts) && saved.parts.length ? saved.parts : EMPTY_PARTS)
      setResearchSources(Array.isArray(saved.research_sources) ? saved.research_sources : [])
      setFlags([])
      setSearchSkipped(false)
      setClaimRows([])
      setClaimStatus('')
      setStatus(`已載入已儲存劇本：${saved.title || saved.topic}`)
      setStatusType('success')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : '讀取已儲存劇本失敗。')
      setStatusType('error')
    } finally {
      setLoadingSavedScript(false)
    }
  }

  async function deleteSavedScript(nextScriptId: string) {
    if (!nextScriptId) return
    const selected = savedScripts.find((saved) => saved.id === nextScriptId)
    const confirmed = window.confirm(`刪除已儲存劇本「${selected?.title || selected?.topic || nextScriptId}」？`)
    if (!confirmed) return

    setDeletingSavedScriptId(nextScriptId)
    setStatus('正在刪除已儲存劇本。')
    setStatusType('info')

    try {
      const response = await fetch(`/api/workbench/scripts?id=${encodeURIComponent(nextScriptId)}`, {
        method: 'DELETE',
      })
      const data = await response.json()
      if (!response.ok) throw new Error(apiErrorMessage(data, '刪除已儲存劇本失敗。'))

      setSavedScripts((current) => current.filter((saved) => saved.id !== nextScriptId))
      if (selectedSavedScriptId === nextScriptId) setSelectedSavedScriptId('')
      if (scriptId === nextScriptId) {
        setScriptId('')
        setTitle('')
        setParts(EMPTY_PARTS)
        setResearchSources([])
        setFlags([])
        setClaimRows([])
        setClaimStatus('')
      }
      setStatus('已刪除已儲存劇本。')
      setStatusType('success')
      await loadSavedScripts(channelId)
    } catch (error) {
      setStatus(error instanceof Error ? error.message : '刪除已儲存劇本失敗。')
      setStatusType('error')
    } finally {
      setDeletingSavedScriptId('')
    }
  }

  useEffect(() => {
    async function loadInitialData() {
      const response = await fetch('/api/workbench/channels', { cache: 'no-store' })
      const data = await response.json()
      if (!response.ok) throw new Error(apiErrorMessage(data, '讀取頻道失敗。'))

      const rows = Array.isArray(data.channels) ? data.channels : []
      setChannels(rows)
      if (rows.length === 1) setChannelId(rows[0].id)
      if (rows.length > 1) {
        const here = rows.find((row: Channel) => row.name.toLowerCase() === 'here')
        setChannelId(here?.id ?? rows[0].id)
      }

      const params = new URLSearchParams(window.location.search)
      const incomingScriptId = params.get('scriptId')?.trim() || params.get('script_id')?.trim()
      if (incomingScriptId) {
        await openSavedScript(incomingScriptId)
        return
      }

      const incomingTopicId = params.get('topic_id')?.trim()
      if (!incomingTopicId) return

      const topicResponse = await fetch(`/api/topics?id=${encodeURIComponent(incomingTopicId)}`, { cache: 'no-store' })
      const topicData = await topicResponse.json()
      if (!topicResponse.ok) throw new Error(apiErrorMessage(topicData, '讀取題材失敗。'))

      const topic = topicData.topic as TopicPayload | undefined
      if (!topic) throw new Error('找不到題材。')

      setTopicId(topic.id)
      setChannelId(topic.ew_channel_id)
      setSeriesId(topic.series_id ?? '')
      setSeriesName(topic.series?.name ?? '')
      setThesis(topic.thesis ?? '')
      setMaterial(topic.material ?? '')
      setStatus('已載入題材，可以開始研究。')
      setStatusType('success')
    }

    loadInitialData().catch((error) => {
      setStatus(error instanceof Error ? error.message : '讀取資料失敗。')
      setStatusType('error')
    })
  }, [])

  useEffect(() => {
    if (!channelId) {
      setSavedScripts([])
      return
    }
    loadSavedScripts(channelId).catch(() => {
      setSavedScripts([])
    })
  }, [channelId])

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
      if (!response.ok) throw new Error(apiErrorMessage(data, '研究失敗。'))
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
    if (!seriesId) {
      setStatus('請由題目庫揀一條題目（含系列）推上嚟，先可以生成 Here 系列劇本。')
      setStatusType('error')
      return
    }

    setGenerating(true)
    setStatus('正在生成劇本。')
    setStatusType('info')

    try {
      const response = await fetch('/api/workbench/generate-with-engine', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          topic: thesis,
          background: material,
          channel_id: channelId,
          series_id: seriesId,
          hookVariant,
          target_minutes: targetMinutes,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(apiErrorMessage(data, '生成劇本失敗。'))
      const structuredScript = data.structuredScript ?? {}
      setScriptId(data.script?.id ?? '')
      setTitle(structuredScript.title ?? thesis)
      setParts(Array.isArray(structuredScript.parts) && structuredScript.parts.length ? structuredScript.parts : EMPTY_PARTS)
      setStatus('劇本已生成，可以微調後儲存。')
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
      if (!response.ok) throw new Error(apiErrorMessage(data, '儲存劇本失敗。'))

      if (data.script?.id) {
        setScriptId(data.script.id)
        setSelectedSavedScriptId(data.script.id)
      }

      if (topicId && data.script?.id) {
        const topicResponse = await fetch('/api/topics', {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ id: topicId, status: 'scripted', script_id: data.script.id }),
        })
        const topicData = await topicResponse.json()
        if (!topicResponse.ok) throw new Error(apiErrorMessage(topicData, '劇本已儲存，但回寫題材狀態失敗。'))
      }

      setStatus(`已儲存：${data.script?.title ?? title}`)
      setStatusType('success')
      await loadSavedScripts(channelId)
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

  function currentScriptText() {
    return [
      title.trim(),
      '',
      ...parts.flatMap((part) => [`## ${part.roleLabel}`, part.content.trim(), '']),
    ]
      .join('\n')
      .trim()
  }

  async function copyTextToClipboard(value: string) {
    const textarea = document.createElement('textarea')
    textarea.value = value
    textarea.setAttribute('readonly', '')
    textarea.style.position = 'fixed'
    textarea.style.left = '-9999px'
    textarea.style.top = '0'
    textarea.style.width = '1px'
    textarea.style.height = '1px'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.focus()
    textarea.select()
    textarea.setSelectionRange(0, textarea.value.length)

    try {
      if (document.execCommand('copy')) return true
    } catch {
      // Ignore and try the Clipboard API below.
    } finally {
      document.body.removeChild(textarea)
    }

    if (!navigator.clipboard?.writeText) return false

    try {
      await Promise.race([
        navigator.clipboard.writeText(value),
        new Promise((_, reject) => window.setTimeout(() => reject(new Error('clipboard timeout')), 700)),
      ])
      return true
    } catch {
      return false
    }
  }

  function escapeHtml(value: string) {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
  }

  async function copyScript() {
    const script = currentScriptText()
    if (!script) {
      setStatus('No script to copy yet.')
      setStatusType('error')
      return
    }

    setManualCopyText(script)
    setStatus('Copy box opened. If auto-copy is blocked, press Select all and copy manually.')
    setStatusType('info')
    window.setTimeout(() => {
      manualCopyRef.current?.focus()
      manualCopyRef.current?.select()
    }, 0)

    const copied = await copyTextToClipboard(script)
    if (copied) {
      setStatus('Copied full script. A manual copy box is also open below.')
      setStatusType('success')
    }
  }

  function exportPdf() {
    const script = currentScriptText()
    if (!script) {
      setStatus('未有劇本可以匯出 PDF。')
      setStatusType('error')
      return
    }

    const printWindow = window.open('', '_blank', 'noopener,noreferrer')
    if (!printWindow) {
      setStatus('未能開啟 PDF 匯出視窗。')
      setStatusType('error')
      return
    }

    const safeTitle = escapeHtml(title.trim() || 'YouTube Script')
    const safeSections = parts
      .filter((part) => part.content.trim())
      .map(
        (part, index) => `
          <section>
            <h2>${index + 1}. ${escapeHtml(part.roleLabel)}</h2>
            <p>${escapeHtml(part.content.trim()).replace(/\n/g, '<br />')}</p>
          </section>
        `
      )
      .join('')

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${safeTitle}</title>
          <style>
            @page { margin: 18mm; }
            body { color: #17202a; font-family: Arial, "Microsoft JhengHei", sans-serif; line-height: 1.7; }
            h1 { font-size: 26px; margin: 0 0 24px; }
            h2 { font-size: 16px; margin: 24px 0 8px; }
            p { font-size: 12px; margin: 0; white-space: normal; }
            section { break-inside: avoid; border-top: 1px solid #ddd; padding-top: 12px; }
          </style>
        </head>
        <body>
          <h1>${safeTitle}</h1>
          ${safeSections}
          <script>
            window.onload = () => {
              window.focus();
              window.print();
            };
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
    setStatus('已開啟 PDF 匯出視窗，可選擇儲存為 PDF。')
    setStatusType('success')
  }

  async function exportToDocs() {
    if (!currentScriptText()) {
      setStatus('未有劇本可以匯出到文件中心。')
      setStatusType('error')
      return
    }

    setExportingDoc(true)
    setStatus('正在匯出到文件中心。')
    setStatusType('info')

    try {
      const response = await fetch('/api/workbench/export-doc', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ title, thesis, material, parts }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(apiErrorMessage(data, '匯出到文件中心失敗。'))

      setStatus(`已匯出到文件中心：${data.doc?.title ?? title}`)
      setStatusType('success')
      if (typeof data.openUrl === 'string') window.open(data.openUrl, '_blank', 'noopener,noreferrer')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : '匯出到文件中心失敗。')
      setStatusType('error')
    } finally {
      setExportingDoc(false)
    }
  }

  async function extractClaims() {
    const script = currentScriptText()
    if (!script) {
      setClaimStatus('未有稿件可以抽 claim。')
      return
    }

    setExtractingClaims(true)
    setClaimStatus('正在抽取具體事實 claim。')
    try {
      const response = await fetch('/api/workbench/extract-claims', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ script }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(apiErrorMessage(data, '抽 claim 失敗。'))
      setClaimRows(Array.isArray(data.claims) ? data.claims : [])
      setClaimStatus((data.claims ?? []).length ? '已抽出 claim。' : '未抽到具體 fact claim。')
    } catch (error) {
      setClaimStatus(error instanceof Error ? error.message : '抽 claim 失敗。')
    } finally {
      setExtractingClaims(false)
    }
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

          <div className="wb-grid">
            <section className="wb-panel">
              <h2>輸入資料</h2>
              <div className="wb-saved-row">
                <label className="wb-field" style={{ marginBottom: 0 }}>
                  <span className="wb-label">開啟已儲存劇本</span>
                  <select
                    className="wb-select"
                    value={selectedSavedScriptId}
                    onChange={(event) => setSelectedSavedScriptId(event.target.value)}
                    disabled={!savedScripts.length || loadingSavedScript}
                  >
                    <option value="">{savedScripts.length ? '選擇已儲存劇本' : '暫時未有已儲存劇本'}</option>
                    {savedScripts.map((saved) => (
                      <option key={saved.id} value={saved.id}>
                        {saved.title || saved.topic || '未命名劇本'}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  className="wb-btn"
                  type="button"
                  onClick={() => void openSavedScript(selectedSavedScriptId)}
                  disabled={!selectedSavedScriptId || loadingSavedScript || Boolean(deletingSavedScriptId)}
                >
                  {loadingSavedScript ? '載入中...' : '開啟'}
                </button>
                <button
                  className="wb-btn"
                  type="button"
                  onClick={() => void deleteSavedScript(selectedSavedScriptId)}
                  disabled={!selectedSavedScriptId || loadingSavedScript || Boolean(deletingSavedScriptId)}
                >
                  {deletingSavedScriptId && deletingSavedScriptId === selectedSavedScriptId ? '刪除中...' : '刪除'}
                </button>
              </div>

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
                  {seriesName ? (
                    <>
                      目前系列：{seriesName}
                      <br />
                    </>
                  ) : null}
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
                <span className="wb-label">手上資料 / 來源（可留空）</span>
                <textarea
                  ref={materialRef}
                  className="wb-textarea"
                  value={material}
                  onChange={(event) => setMaterial(event.target.value)}
                  placeholder="貼新聞、背景、連結；留空之後 AI 會自行補查"
                />
              </label>

              <div className="wb-row">
                <label className="wb-field" style={{ flex: '1 1 170px', marginBottom: 0 }}>
                  <span className="wb-label">開場變體</span>
                  <select className="wb-select" value={hookVariant} onChange={(event) => setHookVariant(event.target.value)}>
                    <option value="thesis">論點型</option>
                    <option value="mystery">懸念型</option>
                    <option value="contrast">對比型</option>
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
              {searchSkipped ? <div className="wb-status info">網絡搜尋暫時未執行；結果只根據輸入資料和模型理解做結構檢查。</div> : null}

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
                          照出
                        </button>
                        <button className="wb-btn" type="button" onClick={() => materialRef.current?.focus()}>
                          補資料
                        </button>
                        <button className="wb-btn" type="button" onClick={() => thesisRef.current?.focus()}>
                          修改論點
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
              {scriptId ? <div className="wb-status info">目前開啟嘅已儲存劇本 ID：{scriptId}</div> : null}
              <div className="wb-fact-remark">{FACT_CHECK_HEAD_REMARK}</div>
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
              <div className="wb-row wb-script-actions">
                <button className="wb-btn primary" type="button" onClick={saveScript} disabled={saving}>
                  {saving ? '儲存中...' : '儲存'}
                </button>
                <button
                  className="wb-btn"
                  type="button"
                  onMouseDown={(event) => {
                    event.preventDefault()
                    void copyScript()
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      void copyScript()
                    }
                  }}
                >
                  複製全文
                </button>
                <button className="wb-btn" type="button" onClick={exportPdf}>
                  下載 PDF
                </button>
                <button className="wb-btn" type="button" onClick={() => void exportToDocs()} disabled={exportingDoc}>
                  {exportingDoc ? '匯出中...' : '匯出到文件中心'}
                </button>
                <button className="wb-btn" type="button" onClick={() => void extractClaims()} disabled={extractingClaims}>
                  {extractingClaims ? '抽取中...' : '抽 claim'}
                </button>
              </div>
              {manualCopyText ? (
                <div className="wb-copy-fallback">
                  <p>如果瀏覽器未能自動複製，請按「選取全文」再用 Ctrl/Cmd+C 複製。</p>
                  <textarea
                    ref={manualCopyRef}
                    className="wb-textarea"
                    readOnly
                    value={manualCopyText}
                    onFocus={(event) => event.currentTarget.select()}
                  />
                  <div className="wb-row" style={{ marginTop: 10 }}>
                    <button
                      className="wb-btn primary"
                      type="button"
                      onClick={() => {
                        manualCopyRef.current?.focus()
                        manualCopyRef.current?.select()
                      }}
                    >
                      選取全文
                    </button>
                    <button className="wb-btn" type="button" onClick={() => setManualCopyText('')}>
                      關閉
                    </button>
                  </div>
                </div>
              ) : null}
              <div className="wb-fact-remark">{FACT_CHECK_TAIL_REMARK}</div>
              {claimStatus || claimRows.length ? (
                <div className="wb-claim-panel">
                  <h3>Specific factual claims</h3>
                  <p>只列出稿中的具體事實陳述，不判斷真偽、不查證、不修改原文。</p>
                  {claimStatus ? <div className="wb-status info">{claimStatus}</div> : null}
                  {claimRows.length ? (
                    <ol className="wb-claim-list">
                      {claimRows.map((claim, index) => (
                        <li key={`${claim.paragraph}-${index}`}>
                          <span className="wb-claim-paragraph">第 {claim.paragraph || '?'} 段：</span>
                          {claim.claim}
                        </li>
                      ))}
                    </ol>
                  ) : null}
                </div>
              ) : null}
            </section>
          ) : null}
        </main>
      </div>
    </>
  )
}

