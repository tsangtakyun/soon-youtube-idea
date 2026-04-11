import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'
import { createAdminSupabase } from '@/lib/supabase'

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3'

async function fetchYouTubeData(videoUrl: string) {
  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey) return null

  // 從 URL 提取 video ID
  const match = videoUrl.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  const videoId = match?.[1]
  if (!videoId) return null

  try {
    // 拉片數據
    const videoRes = await fetch(
      `${YOUTUBE_API_BASE}/videos?part=snippet,statistics,contentDetails&id=${videoId}&key=${apiKey}`
    )
    const videoJson = await videoRes.json()
    const video = videoJson.items?.[0]
    if (!video) return null

    const channelId = video.snippet?.channelId

    // 拉 channel 數據
    const channelRes = await fetch(
      `${YOUTUBE_API_BASE}/channels?part=snippet,statistics&id=${channelId}&key=${apiKey}`
    )
    const channelJson = await channelRes.json()
    const channel = channelJson.items?.[0]

    // 處理 duration（PT16M6S → 16m 6s）
    const rawDuration = video.contentDetails?.duration ?? ''
    const durationMatch = rawDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
    let duration = ''
    if (durationMatch) {
      const h = durationMatch[1]
      const m = durationMatch[2]
      const s = durationMatch[3]
      if (h) duration += `${h}h `
      if (m) duration += `${m}m `
      if (s) duration += `${s}s`
      duration = duration.trim()
    }

    return {
      video_id: videoId,
      title_original: video.snippet?.title ?? '',
      views: parseInt(video.statistics?.viewCount ?? '0'),
      likes: parseInt(video.statistics?.likeCount ?? '0'),
      comments: parseInt(video.statistics?.commentCount ?? '0'),
      duration,
      publish_date: video.snippet?.publishedAt ?? '',
      channel_name: channel?.snippet?.title ?? video.snippet?.channelTitle ?? '',
      channel_url: channelId ? `https://www.youtube.com/channel/${channelId}` : '',
      subscribers: parseInt(channel?.statistics?.subscriberCount ?? '0'),
    }
  } catch {
    return null
  }
}

export async function POST(request: Request) {
  try {
    const { videoUrl, description, region } = await request.json()

    if (!videoUrl?.trim()) {
      return NextResponse.json({ error: '請輸入 YouTube 影片 URL' }, { status: 400 })
    }

    // Step A: YouTube Data API
    const ytData = await fetchYouTubeData(videoUrl.trim())

    const videoData = {
      video_id: ytData?.video_id ?? '',
      title_original: ytData?.title_original ?? '',
      views: ytData?.views ?? 0,
      likes: ytData?.likes ?? 0,
      comments: ytData?.comments ?? 0,
      duration: ytData?.duration ?? '',
      publish_date: ytData?.publish_date ?? '',
      channel_name: ytData?.channel_name ?? '',
      channel_url: ytData?.channel_url ?? '',
      subscribers: ytData?.subscribers ?? 0,
    }

    // Step B: Claude 翻譯片名 + 分析內容角度
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const aiPrompt = [
      '你係 SOON 內部研究助手，專門分析亞洲 YouTube 爆款內容。',
      '',
      `YouTube 影片片名（英文）：${videoData.title_original || '（未能獲取）'}`,
      `影片 URL：${videoUrl}`,
      `用家描述：${description || '（無）'}`,
      `地區：${region || '（未指定）'}`,
      `Views：${videoData.views.toLocaleString()}`,
      `Likes：${videoData.likes.toLocaleString()}`,
      `Subscribers：${videoData.subscribers.toLocaleString()}`,
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
    const outlier_ratio = videoData.subscribers > 0
      ? videoData.views / videoData.subscribers
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
        channel_name: videoData.channel_name,
        channel_url: videoData.channel_url,
        subscribers: videoData.subscribers,
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
      channel_name: videoData.channel_name,
      subscribers: videoData.subscribers,
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
