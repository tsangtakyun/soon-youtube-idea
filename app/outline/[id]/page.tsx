'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'

type Outline = {
  id: string
  created_at: string
  video_id: string | null
  title_zh: string | null
  content: string | null
  status: string
}

const CSS = `
* { box-sizing: border-box; margin: 0; padding: 0; }
body { background: #13141f; color: #e8eaf6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
.page { max-width: 900px; margin: 0 auto; padding: 40px 28px 80px; display: flex; flex-direction: column; gap: 28px; }
.topbar { display: flex; align-items: center; gap: 16px; }
.back-btn { padding: 8px 14px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1); background: transparent; color: #7c83d6; font-size: 14px; cursor: pointer; transition: all 0.15s; }
.back-btn:hover { background: rgba(124,131,214,0.1); }
.page-title { font-size: 28px; font-weight: 700; letter-spacing: -0.02em; }
.page-sub { font-size: 14px; color: #6b74c4; margin-top: 4px; }
.meta-card { background: #1a1c2e; border: 1px solid rgba(255,255,255,0.07); border-radius: 16px; padding: 18px 20px; display: flex; flex-direction: column; gap: 6px; }
.meta-title { font-size: 18px; font-weight: 600; color: #e8eaf6; }
.meta-sub { font-size: 13px; color: #6b74c4; }
.editor-wrap { display: flex; flex-direction: column; gap: 12px; }
.editor-label { font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: #6b74c4; }
.editor { width: 100%; min-height: 500px; background: #1a1c2e; border: 1px solid rgba(255,255,255,0.07); border-radius: 16px; color: #e8eaf6; padding: 20px; font-size: 15px; font-family: inherit; line-height: 1.8; outline: none; resize: vertical; transition: border-color 0.15s; }
.editor:focus { border-color: rgba(124,131,214,0.5); }
.action-row { display: flex; gap: 12px; align-items: center; }
.btn-save { padding: 12px 24px; border-radius: 12px; border: none; background: linear-gradient(135deg, #7c83d6, #5c6bc0); color: #fff; font-size: 15px; font-weight: 700; cursor: pointer; transition: opacity 0.15s; }
.btn-save:disabled { opacity: 0.45; cursor: not-allowed; }
.btn-regen { padding: 12px 20px; border-radius: 12px; border: 1px solid rgba(124,131,214,0.4); background: rgba(124,131,214,0.1); color: #a5adde; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.15s; }
.btn-regen:hover { background: rgba(124,131,214,0.2); color: #e8eaf6; }
.btn-regen:disabled { opacity: 0.45; cursor: not-allowed; }
.save-status { font-size: 13px; color: #8ce99a; }
.save-status.error { color: #ffa8a8; }
.loading-box { background: #1a1c2e; border: 1px solid rgba(124,131,214,0.3); border-radius: 16px; padding: 40px; text-align: center; color: #7c83d6; font-size: 15px; line-height: 1.8; }
.loading-dot { display: inline-block; animation: pulse 1.2s ease-in-out infinite; }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
`

export default function OutlinePage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string

  const [outline, setOutline] = useState<Outline | null>(null)
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<{ msg: string; ok: boolean } | null>(null)
  const [regenerating, setRegenerating] = useState(false)

  const fetchOutline = useCallback(async () => {
    try {
      const res = await fetch(`/api/outline?id=${id}`)
      const data = await res.json()
      if (data.outline) {
        setOutline(data.outline)
        setContent(data.outline.content ?? '')
      }
    } catch { /* silent */ } finally { setLoading(false) }
  }, [id])

  useEffect(() => { fetchOutline() }, [fetchOutline])

  async function handleSave() {
    setSaving(true)
    setSaveStatus(null)
    try {
      const res = await fetch('/api/outline', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, content }),
      })
      const data = await res.json()
      setSaveStatus(data.success ? { ok: true, msg: '✓ 已儲存' } : { ok: false, msg: `✗ ${data.error}` })
    } catch { setSaveStatus({ ok: false, msg: '✗ 網絡錯誤' }) }
    finally { setSaving(false) }
  }

  async function handleRegenerate() {
    if (!outline?.video_id) return
    setRegenerating(true)
    setSaveStatus(null)
    try {
      const res = await fetch('/api/outline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId: outline.video_id }),
      })
      const data = await res.json()
      if (data.success) {
        setContent(data.content)
        // 更新当前 outline id 跳轉到新的
        router.replace(`/outline/${data.outlineId}`)
      } else {
        setSaveStatus({ ok: false, msg: `✗ ${data.error}` })
      }
    } catch { setSaveStatus({ ok: false, msg: '✗ 網絡錯誤' }) }
    finally { setRegenerating(false) }
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="page">
        <div className="topbar">
          <button className="back-btn" onClick={() => router.push('/')} type="button">← 返回</button>
        </div>

        <div>
          <div className="page-title">內容大綱</div>
          <div className="page-sub">SOON 內容模版 · 可以直接編輯</div>
        </div>

        {outline && (
          <div className="meta-card">
            <div className="meta-title">{outline.title_zh}</div>
            <div className="meta-sub">創建於 {new Date(outline.created_at).toLocaleDateString('zh-HK')} · {outline.status}</div>
          </div>
        )}

        {loading ? (
          <div className="loading-box">
            <span className="loading-dot">●</span> 載入大綱中…
          </div>
        ) : (
          <div className="editor-wrap">
            <div className="editor-label">內容大綱（可直接編輯）</div>
            <textarea
              className="editor"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="大綱內容…"
            />
            <div className="action-row">
              <button className="btn-save" onClick={handleSave} disabled={saving} type="button">
                {saving ? '儲存中…' : '儲存修改'}
              </button>
              <button className="btn-regen" onClick={handleRegenerate} disabled={regenerating} type="button">
                {regenerating ? 'AI 重新生成中…' : '🤖 重新生成'}
              </button>
              {saveStatus && (
                <span className={`save-status${saveStatus.ok ? '' : ' error'}`}>{saveStatus.msg}</span>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
