import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'
import { createAdminSupabase } from '@/lib/supabase'

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3'

type SearchVideo = {
  video_id: string
  title: string
  channel_name: string
  channel_id: string
  published_at: string
}

type VideoStats = {
  views: number
  likes: number
  comments: number
  duration: string
}

type TopicVideo = {
  title: string
  outlier_ratio: number
  channel_name: string
  video_id: string
  ai_analysis: string
}

async function searchYouTubeVideos(keyword: string, maxResults = 20): Promise<SearchVideo[]> {
  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey) return []

  try {
    const publishedAfter = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
    const params = new URLSearchParams({
      part: 'snippet',
      q: keyword,
      type: 'video',
      order: 'viewCount',
      videoDuration: 'medium',
      publishedAfter,
      relevanceLanguage: 'zh',
      maxResults: String(maxResults),
      key: apiKey,
    })

    const res = await fetch(`${YOUTUBE_API_BASE}/search?${params}`)
    if (!res.ok) return []

    const data = await res.json()
    return (data.items ?? []).map((item: Record<string, any>) => ({
      video_id: item.id?.videoId as string,
      title: item.snippet?.title as string,
      channel_name: item.snippet?.channelTitle as string,
      channel_id: item.snippet?.channelId as string,
      published_at: item.snippet?.publishedAt as string,
    })).filter((video: SearchVideo) => video.video_id)
  } catch {
    return []
  }
}

async function getVideoStats(videoIds: string[]) {
  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey || !videoIds.length) return {}

  try {
    const params = new URLSearchParams({
      part: 'statistics,contentDetails',
      id: videoIds.join(','),
      key: apiKey,
    })

    const res = await fetch(`${YOUTUBE_API_BASE}/videos?${params}`)
    if (!res.ok) return {}

    const data = await res.json()
    const map: Record<string, VideoStats> = {}
    for (const item of (data.items ?? [])) {
      const stats = item.statistics ?? {}
      const raw = item.contentDetails?.duration ?? ''
      const match = raw.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
      let duration = ''
      if (match) {
        if (match[1]) duration += `${match[1]}h `
        if (match[2]) duration += `${match[2]}m `
        if (match[3]) duration += `${match[3]}s`
        duration = duration.trim()
      }

      map[item.id] = {
        views: parseInt(stats.viewCount ?? '0', 10),
        likes: parseInt(stats.likeCount ?? '0', 10),
        comments: parseInt(stats.commentCount ?? '0', 10),
        duration,
      }
    }

    return map
  } catch {
    return {}
  }
}

async function getChannelSubs(channelIds: string[]) {
  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey || !channelIds.length) return {}

  try {
    const unique = [...new Set(channelIds)]
    const params = new URLSearchParams({
      part: 'statistics',
      id: unique.join(','),
      key: apiKey,
    })

    const res = await fetch(`${YOUTUBE_API_BASE}/channels?${params}`)
    if (!res.ok) return {}

    const data = await res.json()
    const map: Record<string, { subscribers: number; channel_url: string }> = {}
    for (const item of (data.items ?? [])) {
      map[item.id] = {
        subscribers: parseInt(item.statistics?.subscriberCount ?? '0', 10),
        channel_url: `https://www.youtube.com/channel/${item.id}`,
      }
    }

    return map
  } catch {
    return {}
  }
}

function extractJsonObject(raw: string) {
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start === -1 || end === -1) return null
  try {
    return JSON.parse(raw.slice(start, end + 1))
  } catch {
    return null
  }
}

export async function POST() {
  const supabase = createAdminSupabase()
  if (!supabase) return NextResponse.json({ error: 'Supabase 未設定' }, { status: 500 })

  const { data: keywords, error: keywordError } = await supabase
    .from('scan_keywords')
    .select('*')
    .eq('active', true)

  if (keywordError) return NextResponse.json({ error: keywordError.message }, { status: 500 })
  if (!keywords?.length) return NextResponse.json({ error: '未有啟用中的掃描關鍵字' }, { status: 400 })

  const { data: existingVideos } = await supabase.from('viral_videos').select('video_id')
  const existingIds = new Set((existingVideos ?? []).map((video) => video.video_id).filter(Boolean))

  const results = { keywords_scanned: 0, videos_found: 0, videos_saved: 0, topics_saved: 0 }
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const kwsToScan = [...keywords].sort(() => Math.random() - 0.5).slice(0, 5)

  for (const kw of kwsToScan) {
    results.keywords_scanned++
    const searchResults = await searchYouTubeVideos(kw.keyword, 20)
    if (!searchResults.length) continue

    const newVideos = searchResults.filter((video) => !existingIds.has(video.video_id))
    results.videos_found += newVideos.length
    if (!newVideos.length) continue

    const videoIds = newVideos.map((video) => video.video_id)
    const channelIds = newVideos.map((video) => video.channel_id)
    const [statsMap, channelMap] = await Promise.all([getVideoStats(videoIds), getChannelSubs(channelIds)])
    const topicVideos: TopicVideo[] = []

    for (const vid of newVideos) {
      const stats = statsMap[vid.video_id]
      const channel = channelMap[vid.channel_id]
      if (!stats || stats.views < 50000) continue

      const subscribers = channel?.subscribers ?? 0
      const outlierRatio = subscribers > 0 ? stats.views / subscribers : 0
      if (outlierRatio < 3) continue

      let titleZh = vid.title
      let aiAnalysis = ''
      let contentAngle = ''

      try {
        const aiRes = await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 500,
          system: '你係 SOON 亞洲內容策略研究員，專門分析 YouTube 爆款話題同內容角度。',
          messages: [{
            role: 'user',
            content: `片名：${vid.title}
頻道：${vid.channel_name}（${subscribers} 訂閱）
數據：${stats.views} views，爆款指數 ${outlierRatio.toFixed(1)}x
發布日期：${vid.published_at}

輸出 JSON：
{
  "title_zh": "片名繁體中文意譯（20字內）",
  "ai_analysis": "點解呢條片會爆，核心吸引力係咩（100字內繁中）",
  "content_angle": "內容角度：屬於探秘型/衝突型/教學型/感動型/挑戰型"
}`,
          }],
        })

        const raw = aiRes.content.map((part) => ('text' in part ? part.text : '')).join('').trim()
        const parsed = extractJsonObject(raw)
        if (parsed) {
          titleZh = parsed.title_zh || titleZh
          aiAnalysis = parsed.ai_analysis || ''
          contentAngle = parsed.content_angle || ''
        }
      } catch {
        // Keep YouTube metadata if AI analysis fails.
      }

      const analysisText = contentAngle ? `${aiAnalysis}\n\n${contentAngle}`.trim() : aiAnalysis
      const { error } = await supabase.from('viral_videos').insert({
        video_url: `https://www.youtube.com/watch?v=${vid.video_id}`,
        video_id: vid.video_id,
        title_original: vid.title,
        title_zh: titleZh,
        views: stats.views,
        likes: stats.likes,
        comments: stats.comments,
        duration: stats.duration,
        publish_date: vid.published_at,
        channel_name: vid.channel_name,
        channel_url: channel?.channel_url ?? '',
        subscribers,
        region: kw.category,
        ai_analysis: analysisText,
        outlier_ratio: outlierRatio,
        source: 'youtube_scan',
      })

      if (!error) {
        results.videos_saved++
        existingIds.add(vid.video_id)
        topicVideos.push({
          title: vid.title,
          outlier_ratio: outlierRatio,
          channel_name: vid.channel_name,
          video_id: vid.video_id,
          ai_analysis: analysisText,
        })
      }
    }

    if (topicVideos.length >= 2) {
      try {
        const topicPrompt = `搜尋關鍵字：${kw.keyword}
以下係最近爆款片：
${topicVideos.map((video, index) => `${index + 1}. ${video.title} | ${video.channel_name} | ${video.outlier_ratio.toFixed(1)}x | ${video.ai_analysis}`).join('\n')}

請分析共同話題，輸出 JSON：
{
  "topic_zh": "話題名稱（10字內繁中）",
  "topic_en": "Topic in English",
  "ai_analysis": "點解呢個話題依家爆，背後原因係咩（120字內繁中）",
  "soon_angle": "如果 SOON 要做呢個題材，最有力嘅切入角度同拍法（80字內繁中）"
}`

        const aiRes = await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 600,
          system: '你係 SOON 亞洲內容策略研究員。',
          messages: [{ role: 'user', content: topicPrompt }],
        })

        const raw = aiRes.content.map((part) => ('text' in part ? part.text : '')).join('').trim()
        const topic = extractJsonObject(raw)
        if (topic?.topic_zh) {
          const ratios = topicVideos.map((video) => video.outlier_ratio)
          await supabase.from('topic_signals').insert({
            topic_zh: topic.topic_zh,
            topic_en: topic.topic_en,
            keywords: [kw.keyword],
            signal_count: topicVideos.length,
            max_outlier_ratio: Math.max(...ratios),
            avg_outlier_ratio: ratios.reduce((a, b) => a + b, 0) / ratios.length,
            related_video_urls: topicVideos.map((video) => `https://www.youtube.com/watch?v=${video.video_id}`).slice(0, 10),
            related_channels: [...new Set(topicVideos.map((video) => video.channel_name))],
            ai_analysis: topic.ai_analysis,
            soon_angle: topic.soon_angle,
            status: 'new',
          })
          results.topics_saved++
        }
      } catch {
        // Topic grouping is best-effort.
      }
    }
  }

  return NextResponse.json({ success: true, results })
}

export async function GET() {
  return NextResponse.json({ message: 'Use POST to trigger scan' })
}
