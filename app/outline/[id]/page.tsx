'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

type Outline = {
  id: string
  created_at: string
  video_id: string | null
  title_zh: string | null
  content: string | null
  status: string
}

type OutlineSection = {
  key: string
  title: string
  purpose: string
  methodOptions: readonly string[]
  principle: string
  content: string
}

type OutlineDoc = {
  pageTitle: string
  suggestedTitles: string[]
  caption: string
  coreAngle: string
  sections: OutlineSection[]
}

const SECTION_BLUEPRINTS = [
  { key: 'hook', title: '第 1 段｜HOOK（45秒）', purpose: '令觀眾唔 skip', methodOptions: ['一個反常識嚅事實', '一個荒誕場景描述', '一條問題，答案出乎意料'], principle: '唔好自我介紹，唔好解釋「我今日講咍」，直接入場景。' },
  { key: 'phenomenon', title: '第 2 段｜現象呈現（45秒-3分鐘）', purpose: '帶觀眾入話題，建立共同語言', methodOptions: ['具體例子、數字、社交媒體', '製造「原來係咍」反應', '輕鬆語氣入場'], principle: '用具體生活化材料令觀眾快速代入。' },
  { key: 'root', title: '第 3 段｜歷史或文化根源（3-5分鐘）', purpose: 'SOON 同其他 channel 最大分別', methodOptions: ['歷史、政治、經濟、家庭結構任何角度', '香港嚅情況或類似經歷', '具體數據或案例'], principle: '香港視角必須具體出現，唔可以只係一句帶過。' },
  { key: 'conflict', title: '第 4 段｜現代演變或衝突（5-9分鐘）', purpose: '推進故事，製造張力', methodOptions: ['現象而家發展到咍地步', '逐層升級由普通到極端', '真實案例人物故事'], principle: '要有升級感，最少一個真實人物或事件。' },
  { key: 'ad', title: '第 5 段｜廣告位（9-10分鐘）', purpose: '自然過渡，唔生硬', methodOptions: ['用前一段情節或情緒做橋接', '廣告唔超過 60-90 秒', '如果唔有廣告就 sell SOON 自己'], principle: '廣告要承接前文情緒。' },
  { key: 'soon-angle', title: '第 6 段｜SOON 角度｜分析同立場（10-15分鐘）', purpose: 'SOON 最重要的部分，同其他 channel 分開嚅地方', methodOptions: ['呢個現象背後反映咍', '香港 vs 亞洲其他地方對比', '有具體立場和證據'], principle: '一定要有清楚判斷同足夠證據。' },
  { key: 'ending', title: '第 7 段｜結尾（15-18分鐘）', purpose: '畫圓，留下餘韻', methodOptions: ['返回 HOOK 嚅場景或問題，用新角度回應', '一個開放性問題留俵觀眾思考', '一句有力結語'], principle: '唔好硬煞，唔好做「記得 like and subscribe」式結尾。' },
] as const

const CSS = `
* { box-sizing: border-box; margin: 0; padding: 0; }
body { background: #13141f; color: #e8eaf6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
.page { max-width: 1120px; margin: 0 auto; padding: 40px 28px 80px; display: flex; flex-direction: column; gap: 24px; }
.topbar { display: flex; align-items: center; gap: 16px; }
.back-btn { padding: 8px 14px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1); background: transparent; color: #7c83d6; font-size: 14px; cursor: pointer; transition: all 0.15s; }
.back-btn:hover { background: rgba(124,131,214,0.1); }
.page-title { font-size: 32px; font-weight: 700; letter-spacing: -0.02em; }
.page-sub { font-size: 14px; color: #6b74c4; margin-top: 6px; }
.meta-card, .panel, .section-card { background: #1a1c2e; border: 1px solid rgba(255,255,255,0.07); border-radius: 18px; }
.meta-card { padding: 18px 20px; display: flex; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.meta-title { font-size: 18px; font-weight: 600; color: #e8eaf6; }
.meta-sub { font-size: 13px; color: #6b74c4; margin-top: 4px; }
.grid { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 18px; }
.panel { padding: 22px; display: grid; gap: 14px; }
.label { font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: #6b74c4; }
.input, .textarea { width: 100%; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; color: #e8eaf6; padding: 14px 16px; font-size: 15px; font-family: inherit; line-height: 1.7; outline: none; transition: border-color 0.15s; }
.input:focus, .textarea:focus { border-color: rgba(124,131,214,0.5); }
.textarea { min-height: 120px; resize: vertical; }
.title-input { font-size: 30px; font-weight: 700; line-height: 1.2; padding: 16px 18px; }
.three-grid { display: grid; gap: 12px; }
.mini-label { font-size: 12px; color: #7c83d6; margin-bottom: 8px; }
.section-list { display: grid; gap: 16px; }
.section-card { padding: 20px; display: grid; gap: 14px; }
.section-head { display: flex; justify-content: space-between; gap: 14px; align-items: start; flex-wrap: wrap; }
.section-title { font-size: 22px; font-weight: 700; line-height: 1.2; }
.section-purpose { font-size: 13px; color: #8ce99a; }
.guide-box { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.guide { background: rgba(255,255,255,0.03); border-radius: 14px; padding: 14px; }
.guide-title { font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: #6b74c4; margin-bottom: 8px; }
.guide-text, .guide li { font-size: 13px; color: #c5caf0; line-height: 1.7; }
.guide ul { padding-left: 18px; }
.section-footer { display: flex; gap: 10px; align-items: center; }
.btn-gen-section { padding: 8px 14px; border-radius: 10px; border: 1px solid rgba(124,131,214,0.4); background: rgba(124,131,214,0.1); color: #a5adde; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s; white-space: nowrap; }
.btn-gen-section:hover { background: rgba(124,131,214,0.2); color: #e8eaf6; }
.btn-gen-section:disabled { opacity: 0.45; cursor: not-allowed; }
.gen-msg { font-size: 12px; color: #8ce99a; }
.gen-msg.err { color: #ffa8a8; }
.action-row { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
.btn-save { padding: 12px 24px; border-radius: 12px; border: none; background: linear-gradient(135deg, #7c83d6, #5c6bc0); color: #fff; font-size: 15px; font-weight: 700; cursor: pointer; }
.btn-save:disabled { opacity: 0.45; cursor: not-allowed; }
.btn-regen { padding: 12px 20px; border-radius: 12px; border: 1px solid rgba(124,131,214,0.4); background: rgba(124,131,214,0.1); color: #a5adde; font-size: 14px; font-weight: 600; cursor: pointer; }
.btn-regen:disabled { opacity: 0.45; cursor: not-allowed; }
.btn-gen-all { padding: 12px 20px; border-radius: 12px; border: 1px solid rgba(105,219,124,0.3); background: rgba(105,219,124,0.08); color: #8ce99a; font-size: 14px; font-weight: 600; cursor: pointer; }
.btn-gen-all:disabled { opacity: 0.45; cursor: not-allowed; }
.save-msg { font-size: 13px; color: #8ce99a; }
.save-msg.err { color: #ffa8a8; }
.loading { background: #1a1c2e; border: 1px solid rgba(124,131,214,0.3); border-radius: 16px; padding: 40px; text-align: center; color: #7c83d6; font-size: 15px; }
@media (max-width: 900px) {
  .grid { grid-template-columns: 1fr; }
  .guide-box { grid-template-columns: 1fr; }
  .title-input { font-size: 24px; }
  .section-title { font-size: 18px; }
}
`

function createEmptyDoc(title = 'SOON 內容大綱'): OutlineDoc {
  return {
    pageTitle: title,
    suggestedTitles: ['', '', ''],
    caption: '',
    coreAngle: '',
    sections: SECTION_BLUEPRINTS.map((s) => ({ ...s, content: '' })),
  }
}

function parseOutlineContent(content: string | null, fallbackTitle: string): OutlineDoc {
  if (!content) return createEmptyDoc(fallbackTitle)
  try {
    const parsed = JSON.parse(content)
    return {
      pageTitle: String(parsed?.pageTitle || fallbackTitle || 'SOON 內容大綱'),
      suggestedTitles: Array.from({ length: 3 }, (_, i) => String(parsed?.suggestedTitles?.[i] || '')),
      caption: String(parsed?.caption || ''),
      coreAngle: String(parsed?.coreAngle || ''),
      sections: SECTION_BLUEPRINTS.map((s) => {
        const matched = Array.isArray(parsed?.sections)
          ? parsed.sections.find((item: { key?: string }) => item?.key === s.key)
          : null
        return { ...s, content: String(matched?.content || '') }
      }),
    }
  } catch {
    return { ...createEmptyDoc(fallbackTitle), caption: content }
  }
}

export default function OutlinePage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string

  const [outline, setOutline] = useState<Outline | null>(null)
  const [doc, setDoc] = useState<OutlineDoc>(createEmptyDoc())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState<{ msg: string; ok: boolean } | null>(null)
  const [regenerating, setRegenerating] = useState(false)
  const [generatingSection, setGeneratingSection] = useState<string | null>(null)
  const [generatingAll, setGeneratingAll] = useState(false)
  const [sectionMsg, setSectionMsg] = useState<Record<string, { msg: string; ok: boolean }>>({})

  const serializedContent = useMemo(() => JSON.stringify({
    pageTitle: doc.pageTitle,
    suggestedTitles: doc.suggestedTitles,
    caption: doc.caption,
    coreAngle: doc.coreAngle,
    sections: doc.sections.map((s) => ({ key: s.key, content: s.content })),
  }), [doc])

  const fetchOutline = useCallback(async () => {
    try {
      const res = await fetch(`/api/outline?id=${id}`)
      const data = await res.json()
      if (data.outline) {
        setOutline(data.outline)
        setDoc(parseOutlineContent(data.outline.content ?? '', data.outline.title_zh ?? 'SOON 內容大綱'))
      }
    } catch { /* silent */ } finally { setLoading(false) }
  }, [id])

  useEffect(() => { if (id) fetchOutline() }, [id, fetchOutline])

  function updateSuggestedTitle(index: number, value: string) {
    setDoc((cur) => { const next = [...cur.suggestedTitles]; next[index] = value; return { ...cur, suggestedTitles: next } })
  }

  function updateSection(key: string, value: string) {
    setDoc((cur) => ({ ...cur, sections: cur.sections.map((s) => s.key === key ? { ...s, content: value } : s) }))
  }

  async function handleSave() {
    setSaving(true); setSaveMsg(null)
    try {
      const res = await fetch('/api/outline', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, title_zh: doc.pageTitle, content: serializedContent }),
      })
      const data = await res.json()
      if (data.success) {
        setOutline((cur) => cur ? { ...cur, title_zh: doc.pageTitle, content: serializedContent } : cur)
        setSaveMsg({ ok: true, msg: '✓ 已儲存' })
      } else { setSaveMsg({ ok: false, msg: `✗ ${data.error}` }) }
    } catch { setSaveMsg({ ok: false, msg: '✗ 網絡錯誤' }) }
    finally { setSaving(false) }
  }

  async function handleRegenerate() {
    if (!outline?.video_id) return
    setRegenerating(true); setSaveMsg(null)
    try {
      const res = await fetch('/api/outline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId: outline.video_id }),
      })
      const data = await res.json()
      if (data.success) { router.replace(`/outline/${data.outlineId}`) }
      else { setSaveMsg({ ok: false, msg: `✗ ${data.error}` }) }
    } catch { setSaveMsg({ ok: false, msg: '✗ 網絡錯誤' }) }
    finally { setRegenerating(false) }
  }

  async function generateSection(sectionKey: string) {
    setGeneratingSection(sectionKey)
    setSectionMsg((cur) => ({ ...cur, [sectionKey]: { ok: true, msg: 'AI 生成中…' } }))
    try {
      const videoContext = outline?.title_zh || ''
      const res = await fetch('/api/outline/section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outlineId: id, sectionKey, videoContext }),
      })
      const data = await res.json()
      if (data.success) {
        updateSection(sectionKey, data.content)
        setSectionMsg((cur) => ({ ...cur, [sectionKey]: { ok: true, msg: '✓ 已生成' } }))
      } else {
        setSectionMsg((cur) => ({ ...cur, [sectionKey]: { ok: false, msg: `✗ ${data.error}` } }))
      }
    } catch {
      setSectionMsg((cur) => ({ ...cur, [sectionKey]: { ok: false, msg: '✗ 網絡錯誤' } }))
    } finally { setGeneratingSection(null) }
  }

  async function handleGenerateAll() {
    setGeneratingAll(true)
    for (const s of SECTION_BLUEPRINTS) {
      await generateSection(s.key)
    }
    setGeneratingAll(false)
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
          <div className="page-sub">可直接編輯標題、建議片名、caption、核心角度，同 7 段大綱。</div>
        </div>
        {outline && (
          <div className="meta-card">
            <div>
              <div className="meta-title">{outline.title_zh || doc.pageTitle}</div>
              <div className="meta-sub">創建於 {new Date(outline.created_at).toLocaleDateString('zh-HK')} · {outline.status}</div>
            </div>
            <div className="action-row">
              <button className="btn-gen-all" onClick={handleGenerateAll} disabled={generatingAll || !!generatingSection} type="button">
                {generatingAll ? '生成全部段落中…' : '🤖 生成全部段落'}
              </button>
              <button className="btn-save" onClick={handleSave} disabled={saving} type="button">
                {saving ? '儲存中…' : '儲存修改'}
              </button>
              <button className="btn-regen" onClick={handleRegenerate} disabled={regenerating} type="button">
                {regenerating ? 'AI 重新生成中…' : '🤖 重新生成骨架'}
              </button>
              {saveMsg && <span className={`save-msg${saveMsg.ok ? '' : ' err'}`}>{saveMsg.msg}</span>}
            </div>
          </div>
        )}
        {loading ? (
          <div className="loading">載入大綱中…</div>
        ) : (
          <>
            <div className="panel">
              <div className="label">整頁標題</div>
              <input className="input title-input" value={doc.pageTitle} onChange={(e) => setDoc((cur) => ({ ...cur, pageTitle: e.target.value }))} placeholder="輸入內容大綱標題" />
            </div>
            <div className="grid">
              <div className="panel">
                <div className="label">建議片名（生成 3 個）</div>
                <div className="three-grid">
                  {doc.suggestedTitles.map((title, i) => (
                    <div key={i}>
                      <div className="mini-label">建議片名 {i + 1}</div>
                      <input className="input" value={title} onChange={(e) => updateSuggestedTitle(i, e.target.value)} placeholder={`輸入建議片名 ${i + 1}`} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="panel">
                <div className="label">核心角度</div>
                <textarea className="textarea" value={doc.coreAngle} onChange={(e) => setDoc((cur) => ({ ...cur, coreAngle: e.target.value }))} placeholder="SOON 香港視角如何切入？" />
              </div>
            </div>
            <div className="panel">
              <div className="label">Caption 內容</div>
              <textarea className="textarea" style={{ minHeight: '180px' }} value={doc.caption} onChange={(e) => setDoc((cur) => ({ ...cur, caption: e.target.value }))} placeholder="輸入 YouTube caption 草稿" />
            </div>
            <div className="section-list">
              {doc.sections.map((section) => (
                <div key={section.key} className="section-card">
                  <div className="section-head">
                    <div>
                      <div className="section-title">{section.title}</div>
                      <div className="section-purpose">目的：{section.purpose}</div>
                    </div>
                  </div>
                  <div className="guide-box">
                    <div className="guide">
                      <div className="guide-title">做法選擇</div>
                      <ul>{section.methodOptions.map((item) => <li key={item}>{item}</li>)}</ul>
                    </div>
                    <div className="guide">
                      <div className="guide-title">原則</div>
                      <div className="guide-text">{section.principle}</div>
                    </div>
                  </div>
                  <div>
                    <div className="mini-label">本段方向指引</div>
                    <textarea className="textarea" style={{ minHeight: '140px' }} value={section.content} onChange={(e) => updateSection(section.key, e.target.value)} placeholder={`輸入 ${section.title} 大綱方向`} />
                  </div>
                  <div className="section-footer">
                    <button
                      className="btn-gen-section"
                      onClick={() => generateSection(section.key)}
                      disabled={generatingSection === section.key || generatingAll}
                      type="button"
                    >
                      {generatingSection === section.key ? 'AI 生成中…' : '🤖 生成呢段'}
                    </button>
                    {sectionMsg[section.key] && (
                      <span className={`gen-msg${sectionMsg[section.key].ok ? '' : ' err'}`}>
                        {sectionMsg[section.key].msg}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  )
}
