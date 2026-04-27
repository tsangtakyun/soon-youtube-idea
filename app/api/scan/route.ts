import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'
import { createAdminSupabase } from '@/lib/supabase'

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3'

async function searchYouTubeVideos(keyword: string, maxResults = 20) {
  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey) return []
  try {
    const params = new URLSearchParams({
      part: 'snippet',
      q: keyword,
      type: 'video',
      order: 'viewCount',
      videoDuration: 'medium',
      maxResults: String(maxResults),
      key: apiKey,
    })
    const res = await fetch(`${YOUTUBE_API_BASE}/search?${params}`)
    if (!res.ok) return []
    const data = await res.json()
    return (data.items ?? []).map((item: Record<string, unknown>) => {
      const snippet = item.snippet as Record<string, unknown>
      return {
        video_id: (item.id as Record<string, unknown>)?.videoId as string,
        title: snippet?.title as string,
        channel_name: snippet?.channelTitle as string,
        channel_id: snippet?.channelId as string,
        published_at: snippet?.publishedAt as string,
      }
    }).filter((v: { video_id: string }) => v.video_id)
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
    const map: Record<string, { views: number; likes: number; comments: number; duration: string }> = {}
    for (const item of (data.items ?? [])) {
      const stats = item.statistics ?? {}
      const raw = item.contentDetails?.duration ?? ''
      const m = raw.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
      let duration = ''
      if (m) {
        if (m[1]) duration += m[1] + 'h '
        if (m[2]) duration += m[2] + 'm '
        if (m[3]) duration += m[3] + 's'
        duration = duration.trim()
      }
      map[item.id] = {
        views: parseInt(stats.viewCount ?? '0'),
        likes: parseInt(stats.likeCount ?? '0'),
        comments: parseInt(stats.commentCount ?? '0'),
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
        subscribers: parseInt(item.statistics?.subscriberCount ?? '0'),
        channel_url: `https://www.youtube.com/channel/${item.id}`,
      }
    }
    return map
  } catch {
    return {}
  }
}

export async function POST() {
  const supabase = createAdminSupabase()
  if (!supabase) return NextResponse.json({ error: 'Supabase 未設定' }, { status: 500 })

  const { data: keywords } = await supabase.from('scan_keywords').select('*').eq('active', true)
  if (!keywords?.length) return NextResponse.json({ error: '岇神點關鍵字' }, { status: 400 })

  const { data: existingVideos } = await supabase.from('viral_videos').select('video_id')
  const existingIds = new Set((existingVideos ?? []).map((v) => v.video_id).filter(Boolean))

  const results = { keywords_scanned: 0, videos_found: 0, videos_saved: 0, topics_saved: 0 }
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const kwsToScan = keywords.sort(() => Math.random() - 0.5).slice(0, 5)
  for (const kw of kwsToScan) {
    results.keywords_scanned++
    const searchResults = await searchYouTubeVideos(kw.keyword, 20)
    if (!searchResults.length) continue

    const newVideos = searchResults.filter((v: { video_id: string }) => !existingIds.has(v.video_id))
    results.videos_found += newVideos.length
    if (!newVideos.length) continue

    const videoIds = newVideos.map((v: { video_id: string }) => v.video_id)
    const channelIds = newVideos.map((v: { channel_id: string }) => v.channel_id)
    const [statsMap, channelMap] = await Promise.all([getVideoStats(videoIds), getChannelSubs(channelIds)])

    const topicVideos: Array<{ title: string; outlier: number; channel: string; video_id: string }> = []

    for (const vid of newVideos) {
      const stats = statsMap[vid.video_id]
      const ch = channelMap[vid.channel_id]
      if (!stats || stats.views < 10000) continue
      const subs = ch?.subscribers ?? 0
      const outlier_ratio = subs > 0 ? stats.views / subs : 0
      if (outlier_ratio < 1) continue

      let title_zh = vid.title
      let ai_analysis = ''
      try {
        const aiRes = await anthropic.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 400,
          messages: [{
            role: 'user',
            content: [
              '輸出 JSON：{"title_zh": "片名繁體中文意譯", "ai_analysis": "內容角度分析 60字以內繁中"}',
              `片名：${vid.title}`,
              `Views：${stats.views}，Subs：${subs}，Outlier：${outlier_ratio.toFixed(1)}x`,
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
      } catch { /* skip */ }

      const { error } = await supabase.from('viral_videos').insert({
        video_url: `https://www.youtube.com/watch?v=${vid.video_id}`,
        video_id: vid.video_id,
        title_original: vid.title,
        title_zh,
        views: stats.views,
        likes: stats.likes,
        comments: stats.comments,
        duration: stats.duration,
        publish_date: vid.published_at,
        channel_name: vid.channel_name,
        channel_url: ch?.channel_url ?? '',
        subscribers: subs,
        region: kw.category,
        ai_analysis,
        outlier_ratio,
        source: 'youtube_scan',
      })

      if (!error) {
        results.videos_saved++
        existingIds.add(vid.video_id)
        topicVideos.push({ title: vid.title, outlier: outlier_ratio, channel: vid.channel_name, video_id: vid.video_id })
      }
    }

    if (topicVideos.length >= 2) {
      try {
        const topicPrompt = [
          '你係 SOON 內部研究助手。',
          `搜尋關鍵字：${kw.keyword}`,
          '以下係搜尋到喅爆款片：',
          ...topicVideos.map((v, i) => `${i + 1}. ${v.title} | ${v.channel} | ${v.outlier.toFixed(1)}x`),
          '',
          '請分析呢批片喅共同話題，輸出 JSON：',
          '{"topic_zh": "話題名稱繁中", "topic_en": "Topic in English", "ai_analysis": "點解爆 80字以內繁中", "soon_angle": "SOON 可以點切入角度 50字繁中"}',
          '只輸出 JSON。',
        ].join('\n')

        const aiRes = await anthropic.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 400,
          messages: [{ role: 'user', content: topicPrompt }],
        })
        const raw = aiRes.content.map((p) => ('text' in p ? p.text : '')).join('').trim()
        const s = raw.indexOf('{')
        const e = raw.lastIndexOf('}')
        if (s !== -1 && e !== -1) {
          const topic = JSON.parse(raw.slice(s, e + 1))
          if (topic.topic_zh) {
            const ratios = topicVideos.map((v) => v.outlier)
            await supabase.from('topic_signals').insert({
              topic_zh: topic.topic_zh,
              topic_en: topic.topic_en,
              keywords: [kw.keyword],
              signal_count: topicVideos.length,
              max_outlier_ratio: Math.max(...ratios),
              avg_outlier_ratio: ratios.reduce((a, b) => a + b, 0) / ratios.length,
              related_video_urls: topicVideos.map((v) => `https://www.youtube.com/watch?v=${v.video_id}`).slice(0, 10),
              related_channels: [...new Set(topicVideos.map((v) => v.channel))],
              ai_analysis: topic.ai_analysis,
              soon_angle: topic.soon_angle,
              status: 'new',
            })
            results.topics_saved++
          }
        }
      } catch { /* skip */ }
    }
  }

  return NextResponse.json({ success: true, results })
}

export async function GET() {
  return NextResponse.json({ message: 'Use POST to trigger scan' })
}
