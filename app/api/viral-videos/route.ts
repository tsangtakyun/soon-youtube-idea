import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'
import { createAdminSupabase } from '@/lib/supabase'

const REGIONS = [
  '中國大陸', '香港', '台灣', '日本', '韓國',
  '泰國', '印尼', '菲律賓', '越南', '馬來西亞',
  '新加坡', '印度', '其他亞洲', '其他',
]

export { REGIONS }

export async function POST(request: Request) {
  try {
    const { videoUrl, description, region } = await request.json()

    if (!videoUrl?.trim()) {
      return NextResponse.json({ error: '請輸入 YouTube 影片 URL' }, { status: 400 })
    }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    // Step A: Algrow scrape 單條片
    const algrowKey = process.env.ALGROW_API_KEY
    const algrowBase = process.env.ALGROW_API_BASE_URL

    let videoData = {
      title_original: '',
      views: 0,
      likes: 0,
      comments: 0,
      duration: '',
      publish_date: '',
      video_id: '',
    }

    let channelData = {
      channel_name: '',
      channel_url: '',
      subscribers: 0,
    }

    if (algrowKey && algrowBase) {
      try {
        // 拉片數據
        const scrapeRes = await fetch(`${algrowBase}/youtube/scrape`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${algrowKey}` },
          body: JSON.stringify({ url: videoUrl }),
          cache: 'no-store',
        })
        if (scrapeRes.ok) {
          const scrapeData = await scrapeRes.json()
          const video = scrapeData?.videos?.[0]
          if (video) {
            videoData = {
              title_original: video.title ?? '',
              views: video.view_count ?? 0,
              likes: video.like_count ?? 0,
              comments: video.comment_count ?? 0,
              duration: video.duration_human ?? '',
              publish_date: video.publish_date ?? '',
              video_id: video.video_id ?? '',
            }
          }
        }

        // 拉 channel 數據
        const channelRes = await fetch(`${algrowBase}/youtube/search/longform`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${algrowKey}` },
          body: JSON.stringify({ q: videoUrl }),
          cache: 'no-store',
        })
        if (channelRes.ok) {
          const channelJson = await channelRes.json()
          const ch = channelJson?.channels?.[0]
          if (ch) {
            channelData = {
              channel_name: ch.name ?? '',
              channel_url: ch.url ?? '',
              subscribers: ch.subscriber_count ?? 0,
            }
          }
        }
      } catch {
        // Algrow 失敗唔阻住流程，繼續用空數據
      }
    }

    // Step B: Claude 做兩件事 — 翻譯片名 + 分析內容角度
    const aiPrompt = [
      '你係 SOON 內部研究助手，專門分析亞洲 YouTube 爆款內容。',
      '',
      `YouTube 影片片名（英文）：${videoData.title_original || '（未能獲取）'}`,
      `影片 URL：${videoUrl}`,
      `用家描述：${description || '（無）'}`,
      `地區：${region || '（未指定）'}`,
      `Views：${videoData.views.toLocaleString()}`,
      `Subscribers：${channelData.subscribers.toLocaleString()}`,
      '',
      '請輸出 JSON，包含以下兩個欄位：',
      '1. title_zh：將片名翻譯成繁體中文（如原名已是中文則保留，意譯而非直譯，要自然）',
      '2. ai_analysis：用繁體中文分析呢條片嘅內容角度，100-150字，包括：',
      '   - 講緊咩話題（核心主題）',
      '   - 點解會吸引人睇（切入角度）',
      '   - 對 SOON 嘅參考價值',
      '',
      '只輸出 JSON，格式：{"title_zh": "...", "ai_analysis": "..."}',
    ].join('\n')

    let title_zh = videoData.title_original
    let ai_analysis = ''

    try {
      const aiRes = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 600,
        messages: [{ role: 'user', content: aiPrompt }],
      })
      const raw = aiRes.content.map((p) => ('text' in p ? p.text : '')).join('').trim()
      const jsonStart = raw.indexOf('{')
      const jsonEnd = raw.lastIndexOf('}')
      if (jsonStart !== -1 && jsonEnd !== -1) {
        const parsed = JSON.parse(raw.slice(jsonStart, jsonEnd + 1))
        title_zh = parsed.title_zh || title_zh
        ai_analysis = parsed.ai_analysis || ''
      }
    } catch {
      // AI 失敗唔阻住儲存
    }

    // Step C: 計算 outlier_ratio
    const outlier_ratio = channelData.subscribers > 0
      ? videoData.views / channelData.subscribers
      : 0

    // Step D: 儲落 Supabase
    const supabase = createAdminSupabase()
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase 未設定' }, { status: 500 })
    }

    const { data, error } = await supabase
      .from('viral_videos')
      .insert({
        video_url: videoUrl.trim(),
        video_id: videoData.video_id,
        title_original: videoData.title_original,
        title_zh,
        views: videoData.views,
        likes: videoData.likes,
        comments: videoData.comments,
        duration: videoData.duration,
        publish_date: videoData.publish_date,
        channel_name: channelData.channel_name,
        channel_url: channelData.channel_url,
        subscribers: channelData.subscribers,
        description: description?.trim() || null,
        region: region || null,
        ai_analysis,
        outlier_ratio,
      })
      .select('id')
      .single()

    if (error) {
      return NextResponse.json({ error: `儲存失敗：${error.message}` }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      id: data?.id,
      title_original: videoData.title_original,
      title_zh,
      views: videoData.views,
      likes: videoData.likes,
      comments: videoData.comments,
      duration: videoData.duration,
      channel_name: channelData.channel_name,
      subscribers: channelData.subscribers,
      outlier_ratio,
      ai_analysis,
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : '未知錯誤' },
      { status: 500 }
    )
  }
}

export async function GET() {
  const supabase = createAdminSupabase()
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase 未設定' }, { status: 500 })
  }

  const { data, error } = await supabase
    .from('viral_videos')
    .select('*')
    .order('outlier_ratio', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ videos: data })
}
