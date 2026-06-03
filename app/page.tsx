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
  location: string
  material: string
  status: 'idea' | 'scripted' | string
  script_id: string | null
  created_at: string
  series?: SeriesOption | null
  script?: { id: string; title: string } | null
}

type StatusType = 'info' | 'error' | 'success'
type SortMode = 'newest' | 'oldest' | 'idea_first' | 'scripted_first' | 'series'

const SORT_OPTIONS: Array<{ value: SortMode; label: string }> = [
  { value: 'newest', label: '排序：最新建立' },
  { value: 'oldest', label: '排序：最舊建立' },
  { value: 'idea_first', label: '排序：待處理優先' },
  { value: 'scripted_first', label: '排序：已建立劇本優先' },
  { value: 'series', label: '排序：系列 A-Z' },
]

const CSS = `
* { box-sizing: border-box; }
body {
  margin: 0;
  background: #f8f4ed;
  color: #17202a;
  font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}
.idea-shell {
  min-height: 100vh;
  background:
    linear-gradient(180deg, rgba(255,255,255,.62), rgba(248,244,237,.96) 260px),
    #f8f4ed;
  color: #17202a;
}
.idea-main {
  width: min(100%, 1640px);
  margin: 0 auto;
  padding: 24px 24px 64px;
}
.idea-top {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  align-items: flex-start;
  margin-bottom: 34px;
}
.idea-kicker {
  color: #6f5d4b;
  font-size: 11px;
  letter-spacing: .16em;
  font-weight: 650;
  text-transform: uppercase;
}
.idea-title {
  margin: 8px 0 8px;
  color: #111c26;
  font-size: clamp(34px, 4vw, 52px);
  line-height: 1;
  letter-spacing: 0;
  font-weight: 760;
}
.idea-subtitle {
  margin: 0;
  color: #5f6873;
  font-size: 14px;
  line-height: 1.7;
}
.idea-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
  padding-top: 2px;
}
.idea-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  border: 1px solid #dacbb9;
  background: rgba(255,255,255,.55);
  color: #33251a;
  border-radius: 8px;
  padding: 10px 16px;
  text-decoration: none;
  font: inherit;
  font-size: 13px;
  font-weight: 680;
  cursor: pointer;
  transition: background .15s ease, border-color .15s ease, transform .15s ease;
}
.idea-btn:hover {
  background: #fffaf2;
  border-color: #bda68c;
  transform: translateY(-1px);
}
.idea-btn.primary {
  background: #2c1f16;
  border-color: #2c1f16;
  color: #fffaf2;
}
.idea-btn.primary:hover {
  background: #3b2a1e;
  border-color: #3b2a1e;
}
.idea-btn.ghost {
  background: transparent;
}
.idea-btn.danger {
  border-color: rgba(180,67,54,.38);
  color: #9c2f22;
  background: rgba(255,237,234,.62);
}
.idea-btn.danger:hover {
  border-color: rgba(180,67,54,.56);
  background: rgba(255,226,221,.78);
}
.topic-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 40;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 22px;
  background: rgba(17, 24, 39, .34);
}
.topic-modal {
  width: min(420px, 100%);
  max-height: min(760px, calc(100vh - 44px));
  overflow: auto;
  border: 1px solid #dacbb9;
  border-radius: 8px;
  background: #fffaf2;
  box-shadow: 0 24px 70px rgba(44, 31, 22, .22);
  padding: 18px;
}
.topic-modal-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
  margin-bottom: 16px;
}
.topic-modal-head h2 {
  margin: 0;
  color: #201812;
  font-size: 20px;
  letter-spacing: 0;
}
.topic-form-field {
  display: grid;
  gap: 7px;
  margin-bottom: 14px;
}
.topic-form-label {
  font-size: 13px;
  font-weight: 760;
  color: #40362d;
}
.topic-form-select,
.topic-form-textarea {
  width: 100%;
  border: 1px solid #dacbb9;
  border-radius: 8px;
  background: rgba(255,255,255,.72);
  color: #241f1a;
  font: inherit;
  padding: 11px 12px;
  outline: none;
}
.topic-form-select {
  min-height: 46px;
}
.topic-form-textarea {
  min-height: 126px;
  resize: vertical;
  line-height: 1.65;
}
.topic-form-select:focus,
.topic-form-textarea:focus {
  border-color: #6d4df5;
  box-shadow: 0 0 0 3px rgba(109,77,245,.14);
}
.topic-form-actions {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}
.idea-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 14px;
  margin: 0 0 14px;
  flex-wrap: wrap;
}
.idea-toolbar-left {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}
.idea-section-title {
  margin: 0;
  color: #111c26;
  font-size: 20px;
  font-weight: 760;
}
.idea-count {
  color: #6f5d4b;
  font-size: 13px;
  border: 1px solid #dfd2c1;
  background: rgba(255,255,255,.42);
  border-radius: 999px;
  padding: 7px 12px;
}
.idea-select {
  min-height: 40px;
  min-width: 180px;
  border: 1px solid #dacbb9;
  border-radius: 8px;
  background: rgba(255,255,255,.72);
  color: #33251a;
  padding: 9px 12px;
  outline: none;
  font: inherit;
  font-size: 13px;
}
.idea-select:focus {
  border-color: #6d4df5;
  box-shadow: 0 0 0 3px rgba(109,77,245,.14);
}
.idea-status {
  margin: 14px 0;
  border-radius: 8px;
  padding: 14px 16px;
  border: 1px solid #dfd2c1;
  background: rgba(255,255,255,.55);
  color: #5f6873;
  line-height: 1.6;
}
.idea-status.error {
  border-color: rgba(180,67,54,.32);
  color: #9c2f22;
  background: rgba(255,237,234,.72);
}
.idea-status.success {
  border-color: rgba(28,132,80,.22);
  color: #1d7049;
  background: rgba(28,132,80,.1);
}
.topic-list {
  border: 1px solid #dfd2c1;
  border-radius: 8px;
  overflow: hidden;
  background: rgba(255,255,255,.5);
}
.topic-head,
.topic-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 220px;
  gap: 16px;
  align-items: center;
}
.topic-head {
  padding: 12px 16px;
  color: #6f5d4b;
  background: rgba(255,250,242,.76);
  border-bottom: 1px solid #dfd2c1;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: .08em;
  text-transform: uppercase;
}
.topic-head > div:last-child {
  text-align: right;
}
.topic-card {
  padding: 16px;
  border-bottom: 1px solid #dfd2c1;
  background: transparent;
}
.topic-card:last-child {
  border-bottom: none;
}
.topic-card:hover {
  background: rgba(255,250,242,.72);
}
.topic-main {
  min-width: 0;
}
.topic-thesis {
  margin: 0;
  color: #111c26;
  font-size: 22px;
  font-weight: 780;
  line-height: 1.35;
  letter-spacing: 0;
}
.topic-detail-lines {
  display: grid;
  gap: 5px;
  margin-top: 9px;
}
.topic-detail-line {
  margin: 0;
  color: #4e5965;
  font-size: 13px;
  line-height: 1.58;
}
.topic-material {
  margin: 10px 0 0;
  color: #6f5d4b;
  font-size: 12px;
  line-height: 1.55;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.topic-material.expanded {
  display: block;
  overflow: visible;
}
.topic-expand-button {
  margin-top: 8px;
  border: 0;
  background: transparent;
  color: #7a4b18;
  font: inherit;
  font-size: 12px;
  font-weight: 760;
  padding: 0;
  cursor: pointer;
}
.topic-expand-button:hover {
  text-decoration: underline;
}
.topic-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
  margin-top: 13px;
}
.topic-badge {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 5px 10px;
  background: #f2eadf;
  color: #6f5d4b;
  font-size: 11px;
  border: 1px solid #dfd2c1;
  white-space: nowrap;
}
.topic-badge.done {
  background: rgba(28,132,80,.1);
  color: #1d7049;
  border-color: rgba(28,132,80,.22);
}
.topic-badge.pending {
  background: rgba(109,77,245,.08);
  color: #5a3dd5;
  border-color: rgba(109,77,245,.2);
}
.topic-location-field {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 28px;
  border: 1px solid #dfd2c1;
  border-radius: 999px;
  background: rgba(255,255,255,.64);
  padding: 3px 8px 3px 10px;
}
.topic-location-field span {
  color: #6f5d4b;
  font-size: 11px;
  white-space: nowrap;
}
.topic-location-input {
  width: 86px;
  border: 0;
  outline: none;
  background: transparent;
  color: #33251a;
  font: inherit;
  font-size: 12px;
  padding: 2px 0;
}
.topic-location-input::placeholder {
  color: #a89580;
}
.topic-location-input:focus {
  width: 132px;
}
.topic-location-input:disabled {
  color: #8a7a68;
}
.topic-card-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
  min-width: 0;
}
.topic-edit-grid {
  display: grid;
  gap: 12px;
}
.topic-edit-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.topic-empty {
  border: 1px dashed #d8c7b4;
  border-radius: 8px;
  padding: 28px;
  color: #6f5d4b;
  line-height: 1.8;
  background: rgba(255,255,255,.45);
}
@media (max-width: 760px) {
  .idea-main { padding: 22px 16px 48px; }
  .idea-top { flex-direction: column; margin-bottom: 24px; }
  .idea-actions { width: 100%; justify-content: flex-start; }
  .idea-btn { width: 100%; }
  .topic-head { display: none; }
  .topic-card { grid-template-columns: 1fr; }
  .topic-card-actions { justify-content: flex-start; }
}
`

function formatDate(value: string) {
  if (!value) return ''
  return new Intl.DateTimeFormat('zh-HK', { dateStyle: 'medium' }).format(new Date(value))
}

function splitTopicThesis(value: string) {
  const text = value.replace(/\s+/g, ' ').trim()
  if (!text) return { lead: '', details: [] as string[] }

  const sentenceMatches = text.match(/[^。！？!?]+[。！？!?]?/g)
  const sentences = sentenceMatches?.map((part) => part.trim()).filter(Boolean) ?? [text]
  const [lead, ...details] = sentences
  return { lead: lead ?? text, details }
}

function splitCompactLines(value: string) {
  const text = value.replace(/\s+/g, ' ').trim()
  if (!text) return []
  return text.match(/[^。！？!?]+[。！？!?]?/g)?.map((part) => part.trim()).filter(Boolean) ?? [text]
}

function seriesLabel(series?: SeriesOption | null) {
  if (!series) return '未分類'
  return series.domain ? `${series.name}｜${series.domain}` : series.name
}

function normalizeTopics(value: unknown): Topic[] {
  if (!Array.isArray(value)) return []
  return value.map((topic) => ({
    ...topic,
    location: String((topic as Topic).location ?? ''),
  })) as Topic[]
}

export default function HomePage() {
  const [channels, setChannels] = useState<Channel[]>([])
  const [channelId, setChannelId] = useState('')
  const [seriesOptions, setSeriesOptions] = useState<SeriesOption[]>([])
  const [topics, setTopics] = useState<Topic[]>([])
  const [showAddTopic, setShowAddTopic] = useState(false)
  const [newTopicSeriesId, setNewTopicSeriesId] = useState('')
  const [newTopicThesis, setNewTopicThesis] = useState('')
  const [newTopicLocation, setNewTopicLocation] = useState('')
  const [newTopicMaterial, setNewTopicMaterial] = useState('')
  const [sortMode, setSortMode] = useState<SortMode>('newest')
  const [seriesFilterId, setSeriesFilterId] = useState('')
  const [locationFilter, setLocationFilter] = useState('')
  const [editingTopicId, setEditingTopicId] = useState('')
  const [editTopicSeriesId, setEditTopicSeriesId] = useState('')
  const [editTopicThesis, setEditTopicThesis] = useState('')
  const [editTopicLocation, setEditTopicLocation] = useState('')
  const [editTopicMaterial, setEditTopicMaterial] = useState('')
  const [locationDrafts, setLocationDrafts] = useState<Record<string, string>>({})
  const [expandedTopicIds, setExpandedTopicIds] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [statusType, setStatusType] = useState<StatusType>('info')
  const [savingTopic, setSavingTopic] = useState(false)
  const [savingTopicEdit, setSavingTopicEdit] = useState(false)
  const [savingLocationId, setSavingLocationId] = useState('')

  const selectedChannel = useMemo(
    () => channels.find((channel) => channel.id === channelId),
    [channels, channelId]
  )

  const locationOptions = useMemo(() => {
    return Array.from(
      new Set(topics.map((topic) => topic.location?.trim()).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b, 'zh-HK'))
  }, [topics])

  const filteredTopics = useMemo(() => {
    return topics.filter((topic) => {
      const matchesSeries = !seriesFilterId || topic.series_id === seriesFilterId
      const matchesLocation = !locationFilter || topic.location?.trim() === locationFilter
      return matchesSeries && matchesLocation
    })
  }, [topics, seriesFilterId, locationFilter])

  const sortedTopics = useMemo(() => {
    const statusRank = (topic: Topic) => (topic.status === 'scripted' ? 1 : 0)
    return [...filteredTopics].sort((a, b) => {
      if (sortMode === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      if (sortMode === 'idea_first') return statusRank(a) - statusRank(b)
      if (sortMode === 'scripted_first') return statusRank(b) - statusRank(a)
      if (sortMode === 'series') return (a.series?.name ?? '').localeCompare(b.series?.name ?? '', 'en')
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  }, [filteredTopics, sortMode])

  useEffect(() => {
    async function loadChannels() {
      const response = await fetch('/api/workbench/channels', { cache: 'no-store' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || '讀取頻道失敗')

      const rows = Array.isArray(data.channels) ? data.channels : []
      setChannels(rows)
      if (!rows.length) {
        setStatus('暫時未有頻道設定。請先建立頻道，再整理 YouTube 題材。')
        setStatusType('info')
        return
      }

      const here = rows.find((row: Channel) => row.name.toLowerCase() === 'here')
      setChannelId(here?.id ?? rows[0].id)
    }

    loadChannels().catch((error) => {
      setStatus(error instanceof Error ? error.message : '讀取頻道失敗')
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
        if (!response.ok) throw new Error(data.error || '讀取題材失敗')
        setTopics(normalizeTopics(data.topics))
        setSeriesOptions(Array.isArray(data.series_options) ? data.series_options : [])
        setNewTopicSeriesId('')
        setSeriesFilterId('')
        setLocationFilter('')
      } catch (error) {
        setStatus(error instanceof Error ? error.message : '讀取題材失敗')
        setStatusType('error')
      } finally {
        setLoading(false)
      }
    }

    void loadTopics()
  }, [channelId])

  useEffect(() => {
    setLocationDrafts((current) => {
      const next: Record<string, string> = {}
      topics.forEach((topic) => {
        next[topic.id] = current[topic.id] ?? topic.location ?? ''
      })
      return next
    })
  }, [topics])

  function pushToScript(topic: Topic) {
    const params = new URLSearchParams(window.location.search)
    if (params.get('embedded') === 'true' && window.parent !== window) {
      window.parent.postMessage(
        {
          type: 'SOON_NAVIGATE_TOOL',
          pipeline: 'youtube',
          tool: 'script',
          topicId: topic.id,
          topic: topic.thesis,
          background: topic.material,
        },
        '*'
      )
      return
    }

    window.location.href = `/workbench?topic_id=${encodeURIComponent(topic.id)}`
  }

  function openSavedScript(topic: Topic) {
    if (!topic.script_id) return
    const params = new URLSearchParams(window.location.search)
    if (params.get('embedded') === 'true' && window.parent !== window) {
      window.parent.postMessage(
        {
          type: 'SOON_NAVIGATE_TOOL',
          pipeline: 'youtube',
          tool: 'script',
          scriptId: topic.script_id,
        },
        '*'
      )
      return
    }

    window.location.href = `/workbench?script_id=${encodeURIComponent(topic.script_id)}`
  }

  function closeAddTopic() {
    if (savingTopic) return
    setShowAddTopic(false)
  }

  async function openAddTopic() {
    setShowAddTopic(true)
    if (!channelId) return

    try {
      const response = await fetch(`/api/topics?ew_channel_id=${encodeURIComponent(channelId)}`, { cache: 'no-store' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || '讀取系列失敗')
      setSeriesOptions(Array.isArray(data.series_options) ? data.series_options : [])
      setTopics(Array.isArray(data.topics) ? normalizeTopics(data.topics) : topics)
      setNewTopicSeriesId('')
    } catch {
      // Keep the modal usable with the already-loaded options.
    }
  }

  async function createTopic() {
    if (!channelId || !newTopicThesis.trim()) {
      setStatus('請先選擇頻道並填寫論點。')
      setStatusType('error')
      return
    }

    setSavingTopic(true)
    setStatus('')
    try {
      const selectedSeries = seriesOptions.find((series) => series.id === newTopicSeriesId)
      const response = await fetch('/api/topics', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ew_channel_id: channelId,
          series_id: newTopicSeriesId || null,
          series_name: selectedSeries?.name ?? '',
          thesis: newTopicThesis,
          location: newTopicLocation,
          material: newTopicMaterial,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || '新增題材失敗。')
      const [createdTopic] = normalizeTopics([data.topic])
      setTopics((current) => [createdTopic, ...current])
      setNewTopicSeriesId('')
      setNewTopicThesis('')
      setNewTopicLocation('')
      setNewTopicMaterial('')
      setShowAddTopic(false)
      setStatus('題材已加入題目庫。')
      setStatusType('success')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : '新增題材失敗。')
      setStatusType('error')
    } finally {
      setSavingTopic(false)
    }
  }

  function startEditingTopic(topic: Topic) {
    setEditingTopicId(topic.id)
    setEditTopicSeriesId(topic.series_id ?? '')
    setEditTopicThesis(topic.thesis)
    setEditTopicLocation(topic.location ?? '')
    setEditTopicMaterial(topic.material ?? '')
    setStatus('')
  }

  function cancelEditingTopic() {
    if (savingTopicEdit) return
    setEditingTopicId('')
    setEditTopicSeriesId('')
    setEditTopicThesis('')
    setEditTopicLocation('')
    setEditTopicMaterial('')
  }

  async function saveTopicEdit() {
    if (!editingTopicId || !editTopicThesis.trim()) {
      setStatus('請先填寫題材論點。')
      setStatusType('error')
      return
    }

    setSavingTopicEdit(true)
    setStatus('')
    try {
      const selectedSeries = seriesOptions.find((series) => series.id === editTopicSeriesId)
      const response = await fetch('/api/topics', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          id: editingTopicId,
          series_id: editTopicSeriesId || null,
          series_name: selectedSeries?.name ?? '',
          thesis: editTopicThesis,
          location: editTopicLocation,
          material: editTopicMaterial,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || '更新題材失敗。')
      const [updatedTopic] = normalizeTopics([data.topic])
      setTopics((current) => current.map((topic) => (topic.id === editingTopicId ? updatedTopic : topic)))
      setEditingTopicId('')
      setEditTopicSeriesId('')
      setEditTopicThesis('')
      setEditTopicLocation('')
      setEditTopicMaterial('')
      setStatus('題材已更新。')
      setStatusType('success')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : '更新題材失敗。')
      setStatusType('error')
    } finally {
      setSavingTopicEdit(false)
    }
  }

  async function saveTopicLocation(topic: Topic) {
    const nextLocation = (locationDrafts[topic.id] ?? '').trim()
    if (nextLocation === (topic.location ?? '').trim()) return

    setSavingLocationId(topic.id)
    setStatus('')
    try {
      const response = await fetch('/api/topics', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: topic.id, location: nextLocation }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || '更新地方失敗。')
      const updatedTopic = { ...data.topic, location: String(data.topic?.location ?? nextLocation) } as Topic
      setTopics((current) => current.map((row) => (row.id === topic.id ? updatedTopic : row)))
      setLocationDrafts((current) => ({ ...current, [topic.id]: updatedTopic.location }))
    } catch (error) {
      setStatus(error instanceof Error ? error.message : '更新地方失敗。')
      setStatusType('error')
      setLocationDrafts((current) => ({ ...current, [topic.id]: topic.location ?? '' }))
    } finally {
      setSavingLocationId('')
    }
  }

  function toggleTopicExpanded(topicId: string) {
    setExpandedTopicIds((current) => ({
      ...current,
      [topicId]: !current[topicId],
    }))
  }

  async function deleteTopic(topic: Topic) {
    const confirmed = window.confirm(`刪除「${topic.thesis.slice(0, 32)}」？`)
    if (!confirmed) return

    setStatus('')
    try {
      const response = await fetch(`/api/topics?id=${encodeURIComponent(topic.id)}`, { method: 'DELETE' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || '刪除題材失敗。')
      setTopics((current) => current.filter((row) => row.id !== topic.id))
      if (editingTopicId === topic.id) cancelEditingTopic()
      setStatus('題材已刪除。')
      setStatusType('success')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : '刪除題材失敗。')
      setStatusType('error')
    }
  }

  return (
    <>
      <style>{CSS}</style>
      <main className="idea-shell">
        <section className="idea-main">
          <header className="idea-top">
            <div>
              <div className="idea-kicker">SOON 創意管理</div>
              <h1 className="idea-title">YouTube 題材庫</h1>
              <p className="idea-subtitle">整理頻道題材、論點資料，直接推上六段式劇本流程。</p>
            </div>
            <div className="idea-actions">
              <a className="idea-btn" href="/channel">頻道設定</a>
              <button className="idea-btn primary" type="button" onClick={() => void openAddTopic()}>
                新增題材
              </button>
            </div>
          </header>

          <div className="idea-toolbar">
            <div className="idea-toolbar-left">
              <h2 className="idea-section-title">所有題材</h2>
              {channels.length > 1 ? (
                <select className="idea-select" value={channelId} onChange={(event) => setChannelId(event.target.value)}>
                  {channels.map((channel) => (
                    <option key={channel.id} value={channel.id}>{channel.name}</option>
                  ))}
                </select>
              ) : null}
              <span className="idea-count">
                {selectedChannel ? `${selectedChannel.name} · ${topics.length} 個題材` : `${topics.length} 個題材`}
              </span>
            </div>
            <div className="idea-actions">
              <select
                aria-label="按系列篩選"
                className="idea-select"
                value={seriesFilterId}
                onChange={(event) => setSeriesFilterId(event.target.value)}
              >
                <option value="">全部系列</option>
                {seriesOptions.map((series) => (
                  <option key={series.id} value={series.id}>
                    {series.name}
                  </option>
                ))}
              </select>
              <select
                aria-label="按國家或地方篩選"
                className="idea-select"
                value={locationFilter}
                onChange={(event) => setLocationFilter(event.target.value)}
              >
                <option value="">全部地方</option>
                {locationOptions.map((location) => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </select>
              <select
                aria-label="排序方法"
                className="idea-select"
                value={sortMode}
                onChange={(event) => setSortMode(event.target.value as SortMode)}
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <a className="idea-btn" href="/workbench">直接開六段式劇本</a>
            </div>
          </div>

          {status ? <div className={`idea-status ${statusType}`}>{status}</div> : null}

          {loading ? (
            <div className="idea-status">正在讀取題材庫...</div>
          ) : topics.length ? (
            <div className="topic-list">
              <datalist id="topic-location-options">
                {locationOptions.map((location) => (
                  <option key={location} value={location} />
                ))}
              </datalist>
              <div className="topic-head">
                <div>題材</div>
                <div>操作</div>
              </div>
              {sortedTopics.length === 0 ? (
                <div className="topic-empty">
                  這個篩選暫時沒有題材。可以換另一個系列或地方。
                </div>
              ) : sortedTopics.map((topic) => {
                const scripted = topic.status === 'scripted'
                const editing = editingTopicId === topic.id
                const topicCopy = splitTopicThesis(topic.thesis)
                const expanded = Boolean(expandedTopicIds[topic.id])
                const materialLines = splitCompactLines(topic.material)
                const compactLines = topicCopy.details.length ? topicCopy.details : materialLines
                const visibleLines = expanded ? compactLines : compactLines.slice(0, 2)
                const hasExpandableContent = compactLines.length > 2 || Boolean(topic.material && topicCopy.details.length)
                return (
                  <article className="topic-card" key={topic.id}>
                    <div className="topic-main">
                      {editing ? (
                        <div className="topic-edit-grid">
                          <label className="topic-form-field">
                            <span className="topic-form-label">系列（可留空）</span>
                            <select
                              className="topic-form-select"
                              value={editTopicSeriesId}
                              onChange={(event) => setEditTopicSeriesId(event.target.value)}
                            >
                              <option value="">不指定系列</option>
                              {seriesOptions.map((series) => (
                                <option key={series.id} value={series.id}>
                                  {series.name}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className="topic-form-field">
                            <span className="topic-form-label">論點</span>
                            <textarea
                              className="topic-form-textarea"
                              value={editTopicThesis}
                              onChange={(event) => setEditTopicThesis(event.target.value)}
                            />
                          </label>
                          <label className="topic-form-field">
                            <span className="topic-form-label">國家 / 地方（可留空）</span>
                            <input
                              className="topic-form-select"
                              list="topic-location-options"
                              value={editTopicLocation}
                              onChange={(event) => setEditTopicLocation(event.target.value)}
                              placeholder="例：日本、香港、緬甸..."
                            />
                          </label>
                          <label className="topic-form-field">
                            <span className="topic-form-label">手上資料 / 來源（可留空）</span>
                            <textarea
                              className="topic-form-textarea"
                              value={editTopicMaterial}
                              onChange={(event) => setEditTopicMaterial(event.target.value)}
                            />
                          </label>
                        </div>
                      ) : (
                        <>
                          <p className="topic-thesis">{topicCopy.lead}</p>
                          {visibleLines.length ? (
                            <div className="topic-detail-lines">
                              {visibleLines.map((line, index) => (
                                <p className="topic-detail-line" key={`${topic.id}-detail-${index}`}>
                                  {line}
                                </p>
                              ))}
                            </div>
                          ) : null}
                          {expanded && topic.material && topicCopy.details.length ? <p className="topic-material expanded">{topic.material}</p> : null}
                          {hasExpandableContent ? (
                            <button className="topic-expand-button" type="button" onClick={() => toggleTopicExpanded(topic.id)}>
                              {expanded ? '收起' : '全部展開'}
                            </button>
                          ) : null}
                          <div className="topic-meta">
                            <span className="topic-badge">{seriesLabel(topic.series)}</span>
                            <label className="topic-location-field">
                              <span>地方</span>
                              <input
                                className="topic-location-input"
                                list="topic-location-options"
                                value={locationDrafts[topic.id] ?? topic.location ?? ''}
                                onChange={(event) =>
                                  setLocationDrafts((current) => ({
                                    ...current,
                                    [topic.id]: event.target.value,
                                  }))
                                }
                                onBlur={() => void saveTopicLocation(topic)}
                                onKeyDown={(event) => {
                                  if (event.key === 'Enter') {
                                    event.preventDefault()
                                    event.currentTarget.blur()
                                  }
                                }}
                                placeholder="新增地方"
                                title="可選現有地方，或直接輸入新地方"
                                disabled={savingLocationId === topic.id}
                              />
                            </label>
                            <span className={`topic-badge ${scripted ? 'done' : 'pending'}`}>
                              {scripted ? '已建立劇本' : '待處理'}
                            </span>
                            <span className="topic-badge">{formatDate(topic.created_at)}</span>
                          </div>
                        </>
                      )}
                    </div>
                    <div className="topic-card-actions">
                      {editing ? (
                        <>
                          <button
                            className="idea-btn primary"
                            type="button"
                            onClick={() => void saveTopicEdit()}
                            disabled={savingTopicEdit}
                          >
                            {savingTopicEdit ? '儲存中...' : '儲存'}
                          </button>
                          <button
                            className="idea-btn ghost"
                            type="button"
                            onClick={cancelEditingTopic}
                            disabled={savingTopicEdit}
                          >
                            取消
                          </button>
                        </>
                      ) : (
                        <>
                          {scripted && topic.script_id ? (
                            <button
                              className="idea-btn"
                              type="button"
                              onClick={() => openSavedScript(topic)}
                            >
                              開啟已儲存劇本
                            </button>
                          ) : null}
                          <button
                            className="idea-btn primary"
                            type="button"
                            onClick={() => pushToScript(topic)}
                          >
                            推上劇本生產線
                          </button>
                          <button
                            className="idea-btn"
                            type="button"
                            onClick={() => startEditingTopic(topic)}
                          >
                            編輯
                          </button>
                          <button
                            className="idea-btn danger"
                            type="button"
                            onClick={() => void deleteTopic(topic)}
                          >
                            刪除
                          </button>
                        </>
                      )}
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

        {showAddTopic ? (
          <div className="topic-modal-backdrop" role="presentation" onClick={closeAddTopic}>
            <section
              aria-modal="true"
              className="topic-modal"
              role="dialog"
              aria-labelledby="add-topic-title"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="topic-modal-head">
                <h2 id="add-topic-title">新增題目</h2>
                <button className="idea-btn ghost" type="button" onClick={closeAddTopic} disabled={savingTopic}>
                  關閉
                </button>
              </div>
              <label className="topic-form-field">
                <span className="topic-form-label">頻道</span>
                <select className="topic-form-select" value={channelId} onChange={(event) => setChannelId(event.target.value)}>
                  <option value="">請選擇頻道</option>
                  {channels.map((channel) => (
                    <option key={channel.id} value={channel.id}>
                      {channel.name}
                    </option>
                  ))}
                </select>
              </label>
              {selectedChannel ? <div className="idea-status">目前題目會加入：{selectedChannel.name}</div> : null}
              <label className="topic-form-field">
                <span className="topic-form-label">系列（可留空）</span>
                <select className="topic-form-select" value={newTopicSeriesId} onChange={(event) => setNewTopicSeriesId(event.target.value)}>
                  <option value="">不指定系列</option>
                  {seriesOptions.map((series) => (
                    <option key={series.id} value={series.id}>
                      {series.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="topic-form-field">
                <span className="topic-form-label">論點</span>
                <textarea
                  className="topic-form-textarea"
                  value={newTopicThesis}
                  onChange={(event) => setNewTopicThesis(event.target.value)}
                  placeholder="一句講清楚你想拆解的系統，以及你的切入角度"
                />
              </label>
              <label className="topic-form-field">
                <span className="topic-form-label">國家 / 地方（可留空）</span>
                <input
                  className="topic-form-select"
                  list="topic-location-options"
                  value={newTopicLocation}
                  onChange={(event) => setNewTopicLocation(event.target.value)}
                  placeholder="例：日本、香港、緬甸..."
                />
              </label>
              <label className="topic-form-field">
                <span className="topic-form-label">手上資料 / 來源（可留空）</span>
                <textarea
                  className="topic-form-textarea"
                  value={newTopicMaterial}
                  onChange={(event) => setNewTopicMaterial(event.target.value)}
                  placeholder="貼新聞、背景、連結；留空之後可由 AI 補查"
                />
              </label>
              <div className="topic-form-actions">
                <button className="idea-btn primary" type="button" onClick={createTopic} disabled={savingTopic}>
                  {savingTopic ? '新增中...' : '加入題目庫'}
                </button>
              </div>
            </section>
          </div>
        ) : null}
      </main>
    </>
  )
}
