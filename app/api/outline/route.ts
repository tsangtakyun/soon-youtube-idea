import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'
import { createAdminSupabase } from '@/lib/supabase'

// 骨架生成：片名 × 3、核心角度、caption
export async function POST(request: Request) {
  try {
    const { videoId } = await request.json()
    if (!videoId) return NextResponse.json({ error: '缺少 videoId' }, { status: 400 })

    const supabase = createAdminSupabase()
    if (!supabase) return NextResponse.json({ error: 'Supabase 未設定' }, { status: 500 })

    const { data: video, error: videoError } = await supabase
      .from('viral_videos').select('*').eq('id', videoId).single()
    if (videoError || !video) return NextResponse.json({ error: '找不到影片' }, { status: 404 })

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const prompt = [`你是 SOON YouTube 頻道的內部創作導演。SOON 的定位是 "The Insider's Asia"，香港人視角分析亞洲現象，英文內容。`,
      '',
      `參考影片: ${video.title_zh || video.title_original}`,
      `英文片名: ${video.title_original}`,
      `頻道: ${video.channel_name} | Views: ${video.views?.toLocaleString()}`,
      `AI 分析: ${video.ai_analysis || '(無)'}`,
      `地區: ${video.region || '(未知)'}`,
      '',
      '請為 SOON 生成内容骨架。只輸出 JSON，不要其他文字：',
      '',
      '{',
      '  "pageTitle": "大綱標題（繁體中文）",',
      '  "suggestedTitles": [',
      '    "建議片名1: 用數字或震撾事實銀頭（英文）",',
      '    "建議片名2: 用問題或懸念銀頭（英文）",',
      '    "建議片名3: 用香港視角切入（英文）"',
      '  ],',
      '  "caption": "YouTube caption：首句 hook + 2-3句內容介紹 + hashtag（繁體中文）",',
      '  "coreAngle": "SOON 香港視角如何切入，1-2句（繁體中文）"',
      '}',
    ].join('\n')

    const aiRes = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 800,
      system: '你只輸出有效 JSON object。不要輸出 markdown、解釋或其他文字。',
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = aiRes.content.map((p) => ('text' in p ? p.text : '')).join('').trim()
    const s = raw.indexOf('{')
    const e = raw.lastIndexOf('}')

    let structured: Record<string, unknown>
    try {
      structured = s !== -1 && e !== -1 ? JSON.parse(raw.slice(s, e + 1)) : {}
    } catch {
      structured = {}
    }

    const content = JSON.stringify({
      pageTitle: String(structured.pageTitle || video.title_zh || video.title_original || 'SOON 內容大綱'),
      suggestedTitles: Array.isArray(structured.suggestedTitles)
        ? structured.suggestedTitles.map(String).slice(0, 3)
        : ['', '', ''],
      caption: String(structured.caption || ''),
      coreAngle: String(structured.coreAngle || ''),
      sections: [
        { key: 'hook', content: '' },
        { key: 'phenomenon', content: '' },
        { key: 'root', content: '' },
        { key: 'conflict', content: '' },
        { key: 'ad', content: '' },
        { key: 'soon-angle', content: '' },
        { key: 'ending', content: '' },
      ],
    })

    const pageTitle = JSON.parse(content).pageTitle

    const { data: outline, error: outlineError } = await supabase
      .from('outlines')
      .insert({ video_id: videoId, title_zh: pageTitle, content, status: 'draft' })
      .select('id').single()

    if (outlineError) return NextResponse.json({ error: `儲存失敗: ${outlineError.message}` }, { status: 500 })

    return NextResponse.json({ success: true, outlineId: outline.id, content })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : '未知錯誤' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const supabase = createAdminSupabase()
  if (!supabase) return NextResponse.json({ error: 'Supabase 未設定' }, { status: 500 })
  if (id) {
    const { data, error } = await supabase.from('outlines').select('*').eq('id', id).single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ outline: data })
  }
  const { data, error } = await supabase.from('outlines').select('*').order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ outlines: data })
}

export async function PATCH(request: Request) {
  const { id, title_zh, content } = await request.json()
  if (!id) return NextResponse.json({ error: '缺少 id' }, { status: 400 })
  const supabase = createAdminSupabase()
  if (!supabase) return NextResponse.json({ error: 'Supabase 未設定' }, { status: 500 })
  const payload: Record<string, unknown> = {}
  if (typeof title_zh === 'string') payload.title_zh = title_zh
  if (typeof content === 'string') payload.content = content
  const { error } = await supabase.from('outlines').update(payload).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
