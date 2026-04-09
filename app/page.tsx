'use client'

import { useMemo, useState, useTransition } from 'react'

type InputMode = 'keyword' | 'channel_url' | 'video_url'

type IdeaCard = {
  title: string
  coreAngle: string
  whyNow: string
  audienceFit: string
  breakoutPattern: string
  backingInfoNeeded: string[]
  seriesExtensions: string[]
  references: string[]
}

type YoutubeIdeaResult = {
  ideas: IdeaCard[]
  algrowRows: Array<Record<string, unknown>>
  savedIdeaId: string | null
  saveStatus: 'saved' | 'skipped' | 'failed'
  saveError: string
}

const modeOptions: Array<{ value: InputMode; label: string; hint: string }> = [
  { value: 'keyword', label: '關鍵字', hint: '例如：香港餐飲 YouTube、旅遊攻略、創業故事' },
  { value: 'channel_url', label: '頻道 URL', hint: '由一條成功 channel 倒推可複製題材方向' },
  { value: 'video_url', label: '影片 URL', hint: '由單條爆款影片拆 pattern，再延伸出 5 個 ideas' },
]

export default function HomePage() {
  const [mode, setMode] = useState<InputMode>('keyword')
  const [query, setQuery] = useState('')
  const [language, setLanguage] = useState('zh-HK')
  const [market, setMarket] = useState('Hong Kong')
  const [error, setError] = useState('')
  const [result, setResult] = useState<YoutubeIdeaResult | null>(null)
  const [isPending, startTransition] = useTransition()

  const modeHint = useMemo(() => modeOptions.find((item) => item.value === mode)?.hint ?? '', [mode])

  function handleGenerate() {
    setError('')
    if (!query.trim()) {
      setError('請先填入關鍵字、頻道 URL 或影片 URL。')
      return
    }

    startTransition(async () => {
      try {
        const response = await fetch('/api/youtube-ideas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode,
            query,
            language,
            market,
          }),
        })

        const data = await response.json()
        if (!response.ok) {
          throw new Error(data.error || '未能生成 YouTube 題材卡。')
        }

        setResult(data)
      } catch (requestError) {
        setResult(null)
        setError(requestError instanceof Error ? requestError.message : '未能生成 YouTube 題材卡。')
      }
    })
  }

  return (
    <main style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #f6f1e8 0%, #ece3d6 100%)', padding: '42px 24px 90px', color: '#1a1a18' }}>
      <div style={{ maxWidth: '1180px', margin: '0 auto', display: 'grid', gap: '20px' }}>
        <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.08fr) 0.92fr', gap: '20px' }}>
          <section style={{ padding: '30px', borderRadius: '28px', background: 'rgba(255,255,255,0.78)', border: '1px solid rgba(26,26,24,0.10)' }}>
            <p style={{ margin: '0 0 8px', fontSize: '12px', letterSpacing: '0.18em', color: '#8b7c69' }}>SOON YOUTUBE IDEA SYSTEM</p>
            <h1 style={{ margin: '0 0 12px', fontSize: '62px', lineHeight: 0.98, fontWeight: 500 }}>YouTube 題材庫</h1>
            <p style={{ margin: '0 0 18px', fontSize: '20px', lineHeight: 1.7, color: '#5b5348', maxWidth: '760px' }}>
              用關鍵字、頻道 URL 或影片 URL，先由 YouTube 爆款 pattern 倒推出 5 張值得拍嘅題材卡。呢一步先做 research 同 angle planning，唔係直接寫死 script。
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              {modeOptions.map((option) => {
                const selected = mode === option.value
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setMode(option.value)}
                    style={{
                      borderRadius: '999px',
                      border: selected ? '1px solid #1a1a18' : '1px solid rgba(26,26,24,0.12)',
                      background: selected ? '#1a1a18' : '#fff',
                      color: selected ? '#f5efe5' : '#1a1a18',
                      padding: '12px 16px',
                      cursor: 'pointer',
                    }}
                  >
                    {option.label}
                  </button>
                )
              })}
            </div>
          </section>

          <section style={{ padding: '26px', borderRadius: '28px', background: '#1d1d1b', color: '#f5f0e6' }}>
            <div style={{ fontSize: '12px', letterSpacing: '0.14em', color: '#b8b0a2', marginBottom: '10px' }}>WHY THIS MATTERS</div>
            <div style={{ display: 'grid', gap: '12px' }}>
              {[
                'YouTube 題材庫唔應該一開始就寫死 hook，同 script system 分開先最乾淨。',
                '先搵值得做嘅題材方向，再決定 backing information、系列延伸同 script planning。',
                '將單條爆款 pattern 拆成可複製內容系列，先係 YouTube 最值錢嘅位。',
              ].map((item) => (
                <div key={item} style={{ padding: '14px 16px', borderRadius: '16px', background: 'rgba(255,255,255,0.08)', lineHeight: 1.7 }}>
                  {item}
                </div>
              ))}
            </div>
          </section>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 0.94fr) 1.06fr', gap: '20px', alignItems: 'start' }}>
          <section style={{ padding: '24px', borderRadius: '24px', background: 'rgba(255,255,255,0.82)', border: '1px solid rgba(26,26,24,0.10)', display: 'grid', gap: '14px' }}>
            <div style={{ fontSize: '12px', letterSpacing: '0.16em', color: '#8b7c69' }}>INPUT</div>
            <label style={{ display: 'grid', gap: '8px' }}>
              <div style={{ fontSize: '15px', color: '#5b5348' }}>{mode === 'keyword' ? '關鍵字' : mode === 'channel_url' ? '頻道 URL' : '影片 URL'}</div>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={modeHint}
                style={{ width: '100%', padding: '14px 16px', borderRadius: '16px', border: '1px solid rgba(26,26,24,0.14)', background: '#fff' }}
              />
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <label style={{ display: 'grid', gap: '8px' }}>
                <div style={{ fontSize: '15px', color: '#5b5348' }}>語言</div>
                <select value={language} onChange={(event) => setLanguage(event.target.value)} style={{ width: '100%', padding: '14px 16px', borderRadius: '16px', border: '1px solid rgba(26,26,24,0.14)', background: '#fff' }}>
                  <option value="zh-HK">繁中 / 廣東話</option>
                  <option value="zh-TW">繁中 / 台灣</option>
                  <option value="en">English</option>
                </select>
              </label>
              <label style={{ display: 'grid', gap: '8px' }}>
                <div style={{ fontSize: '15px', color: '#5b5348' }}>市場</div>
                <select value={market} onChange={(event) => setMarket(event.target.value)} style={{ width: '100%', padding: '14px 16px', borderRadius: '16px', border: '1px solid rgba(26,26,24,0.14)', background: '#fff' }}>
                  <option value="Hong Kong">Hong Kong</option>
                  <option value="Taiwan">Taiwan</option>
                  <option value="Global">Global</option>
                </select>
              </label>
            </div>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isPending || !query.trim()}
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '999px', background: '#1a1a18', color: '#f5efe5', padding: '14px 18px', border: 'none', cursor: 'pointer', width: 'fit-content', opacity: isPending || !query.trim() ? 0.72 : 1 }}
            >
              {isPending ? 'AI 生成中...' : '生成 5 張 YouTube 題材卡'}
            </button>
            {error ? (
              <div style={{ padding: '14px 16px', borderRadius: '16px', background: '#fbf1ef', color: '#7d493f', lineHeight: 1.7 }}>
                {error}
              </div>
            ) : (
              <div style={{ padding: '14px 16px', borderRadius: '16px', background: '#f7f1e5', color: '#7b6d57', lineHeight: 1.7 }}>
                第一版如果未設好 Algrow endpoint，系統會先用 sample reference rows + Claude / deterministic fallback 生 ideas，等你可以先搭完整 workflow。
              </div>
            )}
          </section>

          <section style={{ display: 'grid', gap: '16px' }}>
            <section style={{ padding: '24px', borderRadius: '24px', background: 'rgba(255,255,255,0.82)', border: '1px solid rgba(26,26,24,0.10)' }}>
              <div style={{ fontSize: '12px', letterSpacing: '0.16em', color: '#8b7c69', marginBottom: '8px' }}>REFERENCE SIGNALS</div>
              {result?.algrowRows?.length ? (
                <div style={{ display: 'grid', gap: '12px' }}>
                  {result.algrowRows.map((row, index) => (
                    <div key={`${String(row.title)}-${index}`} style={{ padding: '14px 16px', borderRadius: '16px', background: '#fbf8f1' }}>
                      <div style={{ fontSize: '18px', lineHeight: 1.4 }}>{String(row.title ?? '')}</div>
                      <div style={{ color: '#7b6d57', lineHeight: 1.7 }}>
                        {String(row.channel ?? '')} · {String(row.views ?? '')} views · {String(row.publishedAt ?? '')}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ color: '#7b6d57', lineHeight: 1.7 }}>
                  生成之後，呢度會見到 Algrow / sample 參考 rows。
                </div>
              )}
            </section>

            {result ? (
              <section style={{ padding: '24px', borderRadius: '24px', background: 'rgba(255,255,255,0.82)', border: '1px solid rgba(26,26,24,0.10)' }}>
                <div style={{ fontSize: '12px', letterSpacing: '0.16em', color: '#8b7c69', marginBottom: '8px' }}>WORKFLOW STATUS</div>
                <div style={{ display: 'grid', gap: '12px' }}>
                  <div style={{ padding: '14px 16px', borderRadius: '16px', background: '#fbf8f1', lineHeight: 1.7 }}>
                    已生成 5 張 YouTube 題材卡，可以開始做 internal review、延伸系列討論，再帶去 script planning。
                  </div>
                  <div
                    style={{
                      padding: '14px 16px',
                      borderRadius: '16px',
                      background: result.saveStatus === 'saved' ? '#edf6ea' : result.saveStatus === 'failed' ? '#fbf1ef' : '#f7f1e5',
                      color: result.saveStatus === 'saved' ? '#42623f' : result.saveStatus === 'failed' ? '#7d493f' : '#7b6d57',
                      lineHeight: 1.7,
                    }}
                  >
                    {result.saveStatus === 'saved'
                      ? `已儲存到 YouTube 題材庫${result.savedIdeaId ? ` · ${result.savedIdeaId}` : ''}`
                      : result.saveStatus === 'failed'
                        ? `題材卡已生成，但暫時未成功入庫：${result.saveError || '請稍後再試'}`
                        : '暫時未設定 server-side Supabase，今次只做生成。'}
                  </div>
                </div>
              </section>
            ) : null}
          </section>
        </section>

        <section style={{ display: 'grid', gap: '16px' }}>
          {(result?.ideas ?? []).map((idea, index) => (
            <section key={`${idea.title}-${index}`} style={{ padding: '24px', borderRadius: '24px', background: 'rgba(255,255,255,0.82)', border: '1px solid rgba(26,26,24,0.10)', display: 'grid', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', gap: '12px' }}>
                <div>
                  <div style={{ fontSize: '12px', letterSpacing: '0.16em', color: '#8b7c69', marginBottom: '8px' }}>IDEA CARD {index + 1}</div>
                  <div style={{ fontSize: '36px', lineHeight: 1.06 }}>{idea.title}</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                {[
                  ['核心角度', idea.coreAngle],
                  ['點解值得做', idea.whyNow],
                  ['Audience Fit', idea.audienceFit],
                  ['爆款 Pattern', idea.breakoutPattern],
                  ['Backings 要補乜', idea.backingInfoNeeded.join(' / ')],
                  ['可延伸系列', idea.seriesExtensions.join(' / ')],
                ].map(([label, value]) => (
                  <div key={label} style={{ padding: '14px 16px', borderRadius: '16px', background: '#fbf8f1', lineHeight: 1.7 }}>
                    <div style={{ fontSize: '12px', letterSpacing: '0.12em', color: '#8b7c69', marginBottom: '6px' }}>{label}</div>
                    <div>{value}</div>
                  </div>
                ))}
              </div>
              {idea.references?.length ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {idea.references.map((url) => (
                    <a key={url} href={url} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '999px', background: '#1a1a18', color: '#f5efe5', padding: '10px 14px', textDecoration: 'none' }}>
                      參考影片
                    </a>
                  ))}
                </div>
              ) : null}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                <a
                  href="https://script-generator-xi.vercel.app"
                  target="_blank"
                  rel="noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '999px', background: '#efe7da', color: '#1a1a18', padding: '10px 14px', textDecoration: 'none', border: '1px solid rgba(26,26,24,0.12)' }}
                >
                  進入 Script Generator
                </a>
                <button
                  type="button"
                  onClick={() => {
                    const brief = [
                      `題材：${idea.title}`,
                      `核心角度：${idea.coreAngle}`,
                      `點解值得做：${idea.whyNow}`,
                      `Audience Fit：${idea.audienceFit}`,
                      `爆款 Pattern：${idea.breakoutPattern}`,
                      `Backing Information：${idea.backingInfoNeeded.join(' / ')}`,
                      `可延伸系列：${idea.seriesExtensions.join(' / ')}`,
                    ].join('\n')
                    navigator.clipboard.writeText(brief)
                  }}
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '999px', background: '#fff', color: '#1a1a18', padding: '10px 14px', border: '1px solid rgba(26,26,24,0.12)', cursor: 'pointer' }}
                >
                  Copy Research Brief
                </button>
              </div>
            </section>
          ))}
        </section>
      </div>
    </main>
  )
}
