import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'
import { createAdminSupabase } from '@/lib/supabase'

const SECTION_GUIDES = [
  {
    key: 'hook',
    title: '第 1 段｜HOOK（45秒）',
    purpose: '令觀眾唔 skip',
    methodOptions: ['一個反常識嚅事實', '一個荒誕場景描述', '一條問題，答案出乎意料'],
    principle: '唔好介紹自己，唔好解釋「我今日講和」，直接入場景。',
  },
  {
    key: 'phenomenon',
    title: '第 2 段｜現象呈現（45秒-3分鐘）',
    purpose: '帶觀眾入話題，建立共同語言',
    methodOptions: ['描述呢個現象係點，用具體例子、數字、社交媒體', '製造「原來係和」或「我都見過！」的反應', '保持輕鬆語氣，唔好太快變沉重'],
    principle: '用具體生活化材料令觀眾快速代入。',
  },
  {
    key: 'root',
    title: '第 3 段｜歷史或文化根源（3-5分鐘）',
    purpose: '呢段係 SOON 同其他 channel 最大分別',
    methodOptions: ['解釋點解呢個現象會出現，係有根有據', '可以係歷史、政治、經濟、家庭結構任何角度', '香港視角必須出現：香港嚅情況係咍、我哋點眠、有唔類似經歷'],
    principle: '香港視角一定要具體，唔可以只係一句帶過。',
  },
  {
    key: 'conflict',
    title: '第 4 段｜現代演變或衝突（5-9分鐘）',
    purpose: '推進故事，製造張力',
    methodOptions: ['現象而家發展到咍地步', '有唔矛盾、爭議、或反彈', '逐層升級，由普通到極端', '真實案例（人物故事最有力）'],
    principle: '要有升級感，同埋最少一個真實人物或事件案例。',
  },
  {
    key: 'ad',
    title: '第 5 段｜廣告位（9-10分鐘）',
    purpose: '自然過渡，唔生硬',
    methodOptions: ['用前一段嚅情節或情緒做橋接', '廣告唔超過 60-90 秒'],
    principle: '廣告一定要承接前文情緒，唔可以突兀插入。',
  },
  {
    key: 'soon-angle',
    title: '第 6 段｜SOON 角度｜分析同立場（10-15分鐘）',
    purpose: '呢段係 SOON 最重要嚅部分，同其他 channel 分開嚅地方',
    methodOptions: ['唔係純粹描述現象，係有自己嚅分析同立場', '問：呢個現象背後反映咍？', '香港同亞洲其他地方嚅對比', '可以有爭議性，但要有根據'],
    principle: '一定要有清楚判斷，同時有足夠證據支持。',
  },
  {
    key: 'ending',
    title: '第 7 段｜結尾（15-18分鐘）',
    purpose: '畫圓，留下餘韻',
    methodOptions: ['返番去 HOOK 嚅場景或問題，用新角度回應', '一個開放性問題留俵觀眾思考', '一句有力嚅結語'],
    principle: '唔好硬煞，唔好做「記得 like and subscribe」式結尾。',
  },
] as const

const SOON_TEMPLATE = [
  '# SOON 內容模版',
  '頻道定位: The Insider\'s Asia — 香港人視角，用英文講亞洲現象。局內人分析。',
  '語氣: 直接、有立場、帶少許諷刺，分析型，用講故事方式呂現。',
  '主持: 現場走訪用廣東話或普通話，VO用英文。',
].join('\n')

function buildStructuredOutlinePrompt(video: Record<string, unknown>) {
  const sectionInstructions = SECTION_GUIDES.map((s, i) => [
    `${i + 1}. key: "${s.key}" — ${s.title}`,
    `   目的: ${s.purpose}`,
    `   原則: ${s.principle}`,
    `   做法: ${s.methodOptions.join(' / ')}`,
    `   要求: 用繁體中文寫出方向指引，50-80字：呢段講咍角度、用咍切入方式、需要找咍素材。唔好寫劇本內容。`,
  ].join('\n')).join('\n\n')

  return [
    '你係 SOON 內部創作導演。根據以下影片資訊，為 SOON YouTube 頻道生成完整內容大綱。',
    '所有內容必須使用繁體中文。',
    '',
    `參考影片: ${video.title_zh || video.title_original}`,
    `英文片名: ${video.title_original}`,
    `頻道: ${video.channel_name}`,
    `Views: ${String(video.views || 0)}`,
    `AI 分析: ${video.ai_analysis || '(無)'}`,
    `地區: ${video.region || '(未知)'}`,
    '',
    'SOON 內容模版:',
    SOON_TEMPLATE,
    '',
    '== 輸出要求 ==',
    '',
    '請只輸出一個有效 JSON object，格式如下，所有字段必須實際填寫：',
    '',
    '{',
    '  "pageTitle": "內容大綱標題，繁體中文",',
    '  "suggestedTitles": [',
    '    "建議片名1：用「數字/事實震撾」角度",',
    '    "建議片名2：用「問題/悔惱」角度",',
    '    "建議片名3：用「香港視角切入」角度"',
    '  ],',
    '  "caption": "YouTube caption，包含: 1) 首句 hook 句 2) 2-3句內容介紹 3) 相關 hashtag",',
    '  "coreAngle": "SOON 香港視角切入點，1-2句清晰說明",',
    '  "sections": [',
    '    各段必須實際填寫 content',
    '  ]',
    '}',
    '',
    '== 7 段內容要求 ==',
    '',
    sectionInstructions,
    '',
    '== 重要規則 ==',
    '1. suggestedTitles 必須 3 個全部不同角度嚅片名，不可重複',
    '2. caption 要有 hook、簡介、hashtag，可直接用於 YouTube',
    '3. 每個 section 内容必須 200-400 繁體中文，張实寫出具體內容',
    '4. 必須包含最少 3 個真實案例、最少 2 個數字、香港視角',
    '5. 只輸出 JSON，不要 markdown，不要額外文字',
  ].join('\n')
}

function normalizeStructuredOutline(raw: unknown, fallbackTitle: string) {
  const r = raw as Record<string, unknown>
  const rawSections = Array.isArray(r?.sections) ? r.sections : []
  return {
    pageTitle: String(r?.pageTitle || fallbackTitle || 'SOON 內容大綱'),
    suggestedTitles: Array.from({ length: 3 }, (_, i) => String((r?.suggestedTitles as string[])?.[i] || '')),
    caption: String(r?.caption || ''),
    coreAngle: String(r?.coreAngle || ''),
    sections: SECTION_GUIDES.map((s) => {
      const matched = (rawSections as Record<string, unknown>[]).find((item) => item?.key === s.key)
      return { key: s.key, content: String(matched?.content || '') }
    }),
  }
}

function buildFallbackStructuredOutline(rawText: string, fallbackTitle: string) {
  return {
    pageTitle: fallbackTitle || 'SOON 內容大綱',
    suggestedTitles: [fallbackTitle || 'SOON 片名建議 1', '', ''],
    caption: rawText,
    coreAngle: '',
    sections: SECTION_GUIDES.map((s) => ({ key: s.key, content: '' })),
  }
}

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
    const prompt = buildStructuredOutlinePrompt(video)

    const aiRes = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      system: '你是 SOON 內部創作導演。你只輸出有效 JSON object，不要輸出任何其他文字、markdown 或解釋。第一個字符必須是 {',
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = aiRes.content.map((p) => ('text' in p ? p.text : '')).join('').trim()
    const jsonStart = raw.indexOf('{')
    const jsonEnd = raw.lastIndexOf('}')
    let structured

    if (jsonStart === -1 || jsonEnd === -1) {
      structured = buildFallbackStructuredOutline(raw, video.title_zh || video.title_original)
    } else {
      try {
        const parsed = JSON.parse(raw.slice(jsonStart, jsonEnd + 1))
        structured = normalizeStructuredOutline(parsed, video.title_zh || video.title_original)
      } catch {
        structured = buildFallbackStructuredOutline(raw, video.title_zh || video.title_original)
      }
    }

    const content = JSON.stringify(structured)

    const { data: outline, error: outlineError } = await supabase
      .from('outlines')
      .insert({ video_id: videoId, title_zh: structured.pageTitle, content, status: 'draft' })
      .select('id').single()

    if (outlineError) return NextResponse.json({ error: `儲存失敗：${outlineError.message}` }, { status: 500 })

    return NextResponse.json({ success: true, outlineId: outline.id, content, structured })
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
