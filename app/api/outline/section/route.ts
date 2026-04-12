import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'
import { createAdminSupabase } from '@/lib/supabase'

const SECTION_META: Record<string, { title: string; purpose: string; principle: string; methods: string[] }> = {
  hook: {
    title: '第 1 段｜HOOK（45秒）',
    purpose: '令觀眾唔 skip',
    principle: '唔好自我介紹，唔好解釋「我今日講咍」，直接入場景。',
    methods: ['一個反常識嚅事實', '一個荒誕場景描述', '一條問題，答案出乎意料'],
  },
  phenomenon: {
    title: '第 2 段｜現象呈現（45秒-3分鐘）',
    purpose: '帶觀眾入話題，建立共同語言',
    principle: '用具體生活化材料令觀眾快速代入。',
    methods: ['具體例子、數字、社交媒體截圖', '製造「原來係咍」反應', '輕鬆語氣入場'],
  },
  root: {
    title: '第 3 段｜歷史或文化根源（3-5分鐘）',
    purpose: 'SOON 同其他 channel 最大分別',
    principle: '香港視角必須具體出現，唔可以只係一句帶過。',
    methods: ['歷史、政治、經濟、家庭結構任何角度', '香港嚅情況或類似經歷', '具體数據或案例'],
  },
  conflict: {
    title: '第 4 段｜現代演變或衝突（5-9分鐘）',
    purpose: '推進故事，製造張力',
    principle: '要有升級感，最少一個真實人物或事件。',
    methods: ['現象而家發展到咍地步', '逐層升級由普通到極端', '真實案例人物故事'],
  },
  ad: {
    title: '第 5 段｜廣告位（9-10分鐘）',
    purpose: '自然過渡，唔生硬',
    principle: '廣告要承接前文情緒。',
    methods: ['用前一段情節或情緒做橋接', '廣告唔超過 60-90 秒', '如果唔有廣告就 sell SOON 自己'],
  },
  'soon-angle': {
    title: '第 6 段｜SOON 角度｜分析同立場（10-15分鐘）',
    purpose: 'SOON 最重要的部分，同其他 channel 分開嚅地方',
    principle: '一定要有清楚判斷同足夠證據。',
    methods: ['呢個現象背後反映咍', '香港 vs 亞洲其他地方對比', '有具體立場和證據'],
  },
  ending: {
    title: '第 7 段｜結尾（15-18分鐘）',
    purpose: '畫圓，留下餘韻',
    principle: '唔好硬煞，唔好做「記得 like and subscribe」式結尾。',
    methods: ['返回 HOOK 嚅場景或問題，用新角度回應', '一個開放性問題留俵觀眾思考', '一句有力結語'],
  },
}

export async function POST(request: Request) {
  try {
    const { outlineId, sectionKey, videoContext } = await request.json()
    if (!outlineId || !sectionKey) return NextResponse.json({ error: '缺少參數' }, { status: 400 })

    const meta = SECTION_META[sectionKey]
    if (!meta) return NextResponse.json({ error: '無效 sectionKey' }, { status: 400 })

    const supabase = createAdminSupabase()
    if (!supabase) return NextResponse.json({ error: 'Supabase 未設定' }, { status: 500 })

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const prompt = [
      `你是 SOON YouTube 頻道的內部創作導演。SOON 定位是 "The Insider's Asia"，香港人視角分析亞洲現象。`,
      '',
      `影片資訊: ${videoContext || '(無)'}`,
      '',
      `請為以下片段生成大綱方向指引：`,
      `片段: ${meta.title}`,
      `目的: ${meta.purpose}`,
      `原則: ${meta.principle}`,
      `做法選擇: ${meta.methods.join(' / ')}`,
      '',
      '只輸出 JSON，格式如下：',
      '{',
      '  "content": "繁體中文大綱方向指引，60-80字：呢段講咍 + 切入方式 + 要找内容方向"',
      '}',
    ].join('\n')

    const aiRes = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 300,
      system: '你只輸出有效 JSON object。不要 markdown 或其他文字。',
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = aiRes.content.map((p) => ('text' in p ? p.text : '')).join('').trim()
    const s = raw.indexOf('{')
    const e = raw.lastIndexOf('}')
    let content = ''
    try {
      if (s !== -1 && e !== -1) {
        const parsed = JSON.parse(raw.slice(s, e + 1))
        content = String(parsed.content || '')
      }
    } catch { content = raw }

    // 更新 Supabase outline 的 sections
    const { data: outline } = await supabase.from('outlines').select('content').eq('id', outlineId).single()
    if (outline?.content) {
      try {
        const doc = JSON.parse(outline.content)
        doc.sections = (doc.sections || []).map((sec: { key: string; content: string }) =>
          sec.key === sectionKey ? { ...sec, content } : sec
        )
        await supabase.from('outlines').update({ content: JSON.stringify(doc) }).eq('id', outlineId)
      } catch { /* skip */ }
    }

    return NextResponse.json({ success: true, content })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : '未知錯誤' }, { status: 500 })
  }
}
