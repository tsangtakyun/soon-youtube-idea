import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'
import { createAdminSupabase } from '@/lib/supabase'

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3'
const ALGROW_API_BASE = process.env.ALGROW_API_BASE_URL
const ALGROW_API_KEY = process.env.ALGROW_API_KEY

async function searchAlgrow(keyword: string) {
  if (!ALGROW_API_BASE || !ALGROW_API_KEY) return []
  try {
    const res = await fetch(`${ALGROW_API_BASE}/youtube/search/longform`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ALGROW_API_KEY}`,
      },
      body: JSON.stringify({ q: keyword, page: 1 }),
      cache: 'no-store',
    })
    if (!res.ok) return []
    const data = await res.json()
    return data?.channels ?? []
  } catch {
    return []
  }
}

async function getYouTubeVideoData(videoUrl: string) {
  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey) return null
  const match = videoUrl.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  const videoId = match?.[1]
  if (!videoId) return null
  try {
    const res = await fetch(
      `${YOUTUBE_API_BASE}/videos?part=snippet,statistics,contentDetails&id=${videoId}&key=${apiKey}`
    )
    const json = await res.json()
    const video = json.items?.[0]
    if (!video) return null
    const channelId = video.snippet?.channelId
    const chRes = await fetch(
      `${YOUTUBE_API_BASE}/channels?part=statistics&id=${channelId}&key=${apiKey}`
    )
    const chJson = await chRes.json()
    const ch = chJson.items?.[0]
    const subs = parseInt(ch?.statistics?.subscriberCount ?? '0')
    const views = parseInt(video.statistics?.viewCount ?? '0')
    return {
      video_id: videoId,
      title_original: video.snippet?.title ?? '',
      views,
      likes: parseInt(video.statistics?.likeCount ?? '0'),
      comments: parseInt(video.statistics?.commentCount ?? '0'),
      duration: video.contentDetails?.duration ?? '',
      publish_date: video.snippet?.publishedAt ?? '',
      channel_name: video.snippet?.channelTitle ?? '',
      channel_url: channelId ? `https://www.youtube.com/channel/${channelId}` : '',
      subscribers: subs,
      outlier_ratio: subs > 0 ? views / subs : 0,
    }
  } catch {
    return null
  }
}

async function analyseTopics(
  topicMap: Map<string, { urls: string[]; channels: string[]; ratios: number[] }>,
  keyword: string
) {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const entries = Array.from(topicMap.entries())
    .map(([title, data]) => `片名：${title}\nOutlier：${Math.max(...data.ratios).toFixed(1)}x\nChannels：${data.channels.join(', ')}`)
    .join('\n\n')

  const prompt = [
    '你係 SOON 內部研究助手。',
    `搜尋關鍵字：${keyword}`,
    '',
    '以下係搜尋到嘅爆款影片：',
    entries,
    '',
    '請分析呢批片，輸出 JSON array，每個元素係一個話題信號：',
    '[{',
    '  "topic_zh": "話題名稱（繁體中文，簡潔）",',
    '  "topic_en": "Topic name in English",',
    '  "ai_analysis": "點解呢個話題爆，100字以內（繁中）",',
    '  "soon_angle": "SOON 可以用咩獨特角度切入，50字以內（繁中）"',
    '}]',
    '',
    '只輸出 JSON array，唔好其他文字。',
  ].join('\n')

  try {
    const res = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    })
    const raw = res.content.map((p) => ('text' in p ? p.text : '')).join('').trim()
    const start = raw.indexOf('[')
    const end = raw.lastIndexOf(']')
    if (start === -1 || end === -1) return []
    return JSON.parse(raw.slice(start, end + 1))
  } catch {
    return []
  }
}

export async function POST() {
  const supabase = createAdminSupabase()
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase 未設定' }, { status: 500 })
  }

  // 拉 keywords
  const { data: keywords } = await supabase
    .from('scan_keywords')
    .select('*')
    .eq('active', true)

  if (!keywords?.length) {
    return NextResponse.json({ error: '冇關鍵字' }, { status: 400 })
  }

  const results = {
    keywords_scanned: 0,
    videos_found: 0,
    videos_saved: 0,
    topics_saved: 0,
    errors: [] as string[],
  }

  // 記錄已存在嘅 video URLs，避免重複
  const { data: existingVideos } = await supabase
    .from('viral_videos')
    .select('video_url')
  const existingUrls = new Set((existingVideos ?? []).map((v) => v.video_url))

  for (const kw of keywords) {
    results.keywords_scanned++

    // 用 Algrow 搵 channels
    const channels = await searchAlgrow(kw.keyword)
    if (!channels.length) continue

    // 收集呢個 keyword 下嘅爆款片
    const topicMap = new Map<string, {
      urls: string[]
      channels: string[]
      ratios: number[]
    }>()

    for (const ch of channels.slice(0, 10)) {
      const recentVideos = ch.recent_videos ?? []

      for (const vid of recentVideos.slice(0, 3)) {
        const vidUrl = vid.url
        if (!vidUrl) continue

        const chSubs = ch.subscriber_count ?? 0
        const vidViews = vid.view_count ?? 0
        const outlierRatio = chSubs > 0 ? vidViews / chSubs : 0

        // 只處理 outlier > 1x 嘅片
        if (outlierRatio < 1) continue

        results.videos_found++

        // 未收藏過先加
        if (!existingUrls.has(vidUrl)) {
          const ytData = await getYouTubeVideoData(vidUrl)

          if (ytData && ytData.views > 0) {
            // 翻譯片名
            const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
            let title_zh = ytData.title_original
            let ai_analysis = ''

            try {
              const aiRes = await anthropic.messages.create({
                model: 'claude-sonnet-4-6',
                max_tokens: 400,
                messages: [{
                  role: 'user',
                  content: [
                    '輸出 JSON：{"title_zh": "片名繁體中文意譯", "ai_analysis": "內容角度分析80字以內繁中"}',
                    `片名：${ytData.title_original}`,
                    `Views：${ytData.views}，Subs：${ytData.subscribers}`,
                  ].join('\n'),
                }],
              })
              const raw = aiRes.content.map((p) => ('text' in p ? p.text : '')).join('').trim()
              const s = raw.indexOf('{')
              const e = raw.lastIndexOf('}')
              if (s !== -1 && e !== -1) {
                const parsed = JSON.parse(raw.slice(s, e + 1))
                title_zh = parsed.title_zh || title_zh
                ai_analysis = parsed.ai_analysis || ''
              }
            } catch { /* 失敗跳過 */ }

            const { error } = await supabase.from('viral_videos').insert({
              video_url: vidUrl,
              video_id: ytData.video_id,
              title_original: ytData.title_original,
              title_zh,
              views: ytData.views,
              likes: ytData.likes,
              comments: ytData.comments,
              duration: ytData.duration,
              publish_date: ytData.publish_date,
              channel_name: ytData.channel_name,
              channel_url: ytData.channel_url,
              subscribers: ytData.subscribers,
              region: kw.category,
              ai_analysis,
              outlier_ratio: ytData.outlier_ratio,
            })

            if (!error) {
              results.videos_saved++
              existingUrls.add(vidUrl)
            }
          }
        }

        // 記錄話題 map
        const title = vid.title ?? ''
        if (!topicMap.has(title)) {
          topicMap.set(title, { urls: [], channels: [], ratios: [] })
        }
        const entry = topicMap.get(title)!
        entry.urls.push(vidUrl)
        entry.channels.push(ch.name ?? '')
        entry.ratios.push(outlierRatio)
      }
    }

    // 分析話題信號
    if (topicMap.size > 0) {
      const topics = await analyseTopics(topicMap, kw.keyword)

      for (const topic of topics) {
        if (!topic.topic_zh) continue

        const allUrls = Array.from(topicMap.values()).flatMap((v) => v.urls)
        const allChannels = Array.from(topicMap.values()).flatMap((v) => v.channels)
        const allRatios = Array.from(topicMap.values()).flatMap((v) => v.ratios)
        const maxRatio = allRatios.length ? Math.max(...allRatios) : 0
        const avgRatio = allRatios.length
          ? allRatios.reduce((a, b) => a + b, 0) / allRatios.length
          : 0

        const { error } = await supabase.from('topic_signals').insert({
          topic_zh: topic.topic_zh,
          topic_en: topic.topic_en,
          keywords: [kw.keyword],
          signal_count: topicMap.size,
          max_outlier_ratio: maxRatio,
          avg_outlier_ratio: avgRatio,
          related_video_urls: allUrls.slice(0, 10),
          related_channels: [...new Set(allChannels)].slice(0, 10),
          ai_analysis: topic.ai_analysis,
          soon_angle: topic.soon_angle,
          status: 'new',
        })

        if (!error) results.topics_saved++
      }
    }
  }

  return NextResponse.json({ success: true, results })
}

export async function GET() {
  return NextResponse.json({
    message: 'Use POST to trigger scan',
    tip: 'Vercel Cron will call this daily',
  })
}
