import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'
import { createAdminSupabase } from '@/lib/supabase'

const SECTION_GUIDES = [
  {
    key: 'hook',
    title: '第 1 段｜HOOK（0-45秒）',
    purpose: '令觀眾唔 skip',
    methodOptions: [
      '一個反常識嘅事實',
      '一個荒誕場景描述',
      '一條問題，答案出乎意料',
    ],
    principle: '唔好介紹自己，唔好解釋「我今日講咩」，直接入場景。',
  },
  {
    key: 'phenomenon',
    title: '第 2 段｜現象呈現（45秒-3分鐘）',
    purpose: '帶觀眾入話題，建立共同語言',
    methodOptions: [
      '描述呢個現象係點，用具體例子、數字、社交媒體',
      '製造「原來係咁㗎？」或「我都見過！」的反應',
      '保持輕鬆語氣，唔好太快變沉重',
    ],
    principle: '用具體生活化材料令觀眾快速代入。',
  },
  {
    key: 'root',
    title: '第 3 段｜歷史或文化根源（3-5分鐘）',
    purpose: '呢段係 SOON 同其他 channel 最大分別',
    methodOptions: [
      '解釋點解呢個現象會出現，係有根有據',
      '可以係歷史、政治、經濟、家庭結構任何角度',
      '香港視角必須出現：香港嘅情況係咩、我哋點睇、有冇類似經歷',
    ],
    principle: '香港視角一定要具體，唔可以只係一句帶過。',
  },
  {
    key: 'conflict',
    title: '第 4 段｜現代演變或衝突（5-9分鐘）',
    purpose: '推進故事，製造張力',
    methodOptions: [
      '現象而家發展到咩地步',
      '有冇矛盾、爭議、或反彈',
      '逐層升級，由普通到極端',
      '真實案例（人物故事最有力）',
    ],
    principle: '要有升級感，同埋最少一個真實人物或事件案例。',
  },
  {
    key: 'ad',
    title: '第 5 段｜廣告位（9-10分鐘）',
    purpose: '自然過渡，唔生硬',
    methodOptions: [
      '用前一段嘅情節或情緒做橋接',
      '廣告唔超過 60-90 秒',
    ],
    principle: '廣告一定要承接前文情緒，唔可以突兀插入。',
  },
  {
    key: 'soon-angle',
    title: '第 6 段｜SOON 角度｜分析同立場（10-15分鐘）',
    purpose: '呢段係 SOON 最重要嘅部分，同其他 channel 分開嘅地方',
    methodOptions: [
      '唔係純粹描述現象，係有自己嘅分析同立場',
      '問：呢個現象背後反映咩？',
      '香港同亞洲其他地方嘅對比',
      '可以有爭議性，但要有根據',
    ],
    principle: '一定要有清楚判斷，同時有足夠證據支持。',
  },
  {
    key: 'ending',
    title: '第 7 段｜結尾（15-18分鐘）',
    purpose: '畫圓，留下餘韻',
    methodOptions: [
      '返番去 HOOK 嘅場景或問題，用新角度回應',
      '一個開放性問題留俾觀眾思考',
      '一句有力嘅結語',
    ],
    principle: '唔好硬煞，唔好做「記得 like and subscribe」式結尾。',
  },
] as const

function buildStructuredOutlinePrompt(video: Record<string, any>) {
  return [
    '你係 SOON 內部創作導演。',
    '根據以下影片資訊，為 SOON YouTube 頻道生成一個完整的內容大綱。',
    '所有內容必須使用繁體中文。',
    '',
    `參考影片：${video.title_zh || video.title_original}`,
    `英文片名：${video.title_original}`,
    `頻道：${video.channel_name}`,
    `Views：${video.views?.toLocaleString()}`,
    `AI 分析：${video.ai_analysis || '(無)'}`,
    `地區：${video.region || '(未知)'}`,
    '',
    'SOON 內容模版：',
    SOON_TEMPLATE,
    '',
    '請只輸出有效 JSON object，格式必須如下：',
    '{',
    '  "pageTitle": "整頁標題，繁體中文，可直接當大綱標題",',
    '  "suggestedTitles": ["建議片名1", "建議片名2", "建議片名3"],',
    '  "caption": "影片 caption 草稿，繁體中文，可直接編輯",',
    '  "coreAngle": "SOON 核心角度，繁體中文",',
    '  "sections": [',
    '    { "key": "hook", "content": "第1段詳細內容" },',
    '    { "key": "phenomenon", "content": "第2段詳細內容" },',
    '    { "key": "root", "content": "第3段詳細內容" },',
    '    { "key": "conflict", "content": "第4段詳細內容" },',
    '    { "key": "ad", "content": "第5段詳細內容" },',
    '    { "key": "soon-angle", "content": "第6段詳細內容" },',
    '    { "key": "ending", "content": "第7段詳細內容" }',
    '  ]',
    '}',
    '',
    '生成規則：',
    '- suggestedTitles 必須剛好 3 個',
    '- caption 要有可直接用於 YouTube 的語氣',
    '- sections 必須剛好對應上述 7 段 key',
    '- 每段都要根據以下要求填得具體，可直接再編輯',
    ...SECTION_GUIDES.flatMap((section) => [
      '',
      `${section.title}`,
      `目的：${section.purpose}`,
      '做法選擇：',
      ...section.methodOptions.map((item) => `- ${item}`),
      `原則：${section.principle}`,
    ]),
    '',
    '只輸出 JSON，不要輸出 markdown，不要輸出額外解釋。',
  ].join('\n')
}

function normalizeStructuredOutline(raw: any, fallbackTitle: string) {
  const rawSections = Array.isArray(raw?.sections) ? raw.sections : []
  return {
    pageTitle: String(raw?.pageTitle || fallbackTitle || 'SOON 內容大綱'),
    suggestedTitles: Array.from({ length: 3 }, (_, index) => String(raw?.suggestedTitles?.[index] || '')).slice(0, 3),
    caption: String(raw?.caption || ''),
    coreAngle: String(raw?.coreAngle || ''),
    sections: SECTION_GUIDES.map((section) => {
      const matched = rawSections.find((item: any) => item?.key === section.key)
      return {
        key: section.key,
        content: String(matched?.content || ''),
      }
    }),
  }
}

function buildFallbackStructuredOutline(rawText: string, fallbackTitle: string) {
  return {
    pageTitle: fallbackTitle || 'SOON 內容大綱',
    suggestedTitles: [
      fallbackTitle || 'SOON 片名建議 1',
      `${fallbackTitle || 'SOON'}｜香港視角切入`,
      `${fallbackTitle || 'SOON'}｜亞洲現象拆解`,
    ],
    caption: rawText,
    coreAngle: '以香港視角切入，拆解現象背後嘅文化、制度同亞洲脈絡。',
    sections: SECTION_GUIDES.map((section) => ({
      key: section.key,
      content: '',
    })),
  }
}

const SOON_TEMPLATE = [
  '# SOON 內容模版',
  '頻道定位: The Insider\'s Asia — 香港人視角，用英文講亞洲現象。局內人分析。',
  '語氣: 直接、有立場、帶少許諷刺，分析型，用講故事方式呂現。',
  '主持: 現場走訪用廣東話或普通話，VO用英文。',
  '',
  '片段結構:',
  '1. HOOK (45秒) — 直接入場景，不要自我介紹',
  '2. 現象呈現 (45秒-3分鐘) — 具體例子、數字、社交媒體',
  '3. 歷史或文化根源 (3-5分鐘) — 香港視角必須出現',
  '4. 現代演變或衝突 (5-9分鐘) — 逐層升級，真實案例',
  '5. 廣告位 (9-10分鐘) — 置入廣告或 sell SOON 自己',
  '6. SOON 角度 (10-15分鐘) — 香港 vs 亞洲，有分析有立場',
  '7. 結尾 (15-18劆鐘) — 返回 HOOK，留下餘韻',
  '',
  '必須元素: 最少3個真實案例、最少2個數字、社交媒體反應(小紅書/微博/抖音/Threads/IG)、香港視角。',
].join('\n')

export async function POST(request: Request) {
  try {
    const { videoId } = await request.json()
    if (!videoId) return NextResponse.json({ error: '缺少 videoId' }, { status: 400 })

    const supabase = createAdminSupabase()
    if (!supabase) return NextResponse.json({ error: 'Supabase 未設定' }, { status: 500 })

    const { data: video, error: videoError } = await supabase
      .from('viral_videos')
      .select('*')
      .eq('id', videoId)
      .single()

    if (videoError || !video) {
      return NextResponse.json({ error: '找不到影片' }, { status: 404 })
    }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const prompt = buildStructuredOutlinePrompt(video)

    const aiRes = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
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
      .insert({
        video_id: videoId,
        title_zh: structured.pageTitle,
        content,
        status: 'draft',
      })
      .select('id')
      .single()

    if (outlineError) {
      return NextResponse.json({ error: `儲存失敗：${outlineError.message}` }, { status: 500 })
    }

    return NextResponse.json({ success: true, outlineId: outline.id, content, structured })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : '未知錯誤' },
      { status: 500 }
    )
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
