import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'
import { createAdminSupabase } from '@/lib/supabase'

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

    const prompt = [
      '你係 SOON 內部創作導演。',
      '根據以下影片資訊，為 SOON YouTube 頻道生成一個完整的內容大綱（繁體中文）。',
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
      '請生成一個完整大綱，包含：',
      '1. 建議片名（英文，吸引眼球）',
      '2. 核心角度（SOON 香港視角如何切入）',
      '3. 七個片段詳細內容（每段列出具體訮證点或情節方向）',
      '4. 建議研究方向（哪些資料要找）',
      '5. 建議現場拍攝位置（香港哪裏可以拍）',
      '',
      '請用繁體中文回答，格式清晰。',
    ].join('\n')

    const aiRes = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    })

    const content = aiRes.content.map((p) => ('text' in p ? p.text : '')).join('').trim()

    const { data: outline, error: outlineError } = await supabase
      .from('outlines')
      .insert({
        video_id: videoId,
        title_zh: video.title_zh || video.title_original,
        content,
        status: 'draft',
      })
      .select('id')
      .single()

    if (outlineError) {
      return NextResponse.json({ error: `儲存失敗：${outlineError.message}` }, { status: 500 })
    }

    return NextResponse.json({ success: true, outlineId: outline.id, content })
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
  const { id, content } = await request.json()
  if (!id) return NextResponse.json({ error: '缺少 id' }, { status: 400 })

  const supabase = createAdminSupabase()
  if (!supabase) return NextResponse.json({ error: 'Supabase 未設定' }, { status: 500 })

  const { error } = await supabase.from('outlines').update({ content }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
