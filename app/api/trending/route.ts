import { NextResponse } from 'next/server'
import { createAdminSupabase } from '@/lib/supabase'

const YT_BASE = 'https://www.googleapis.com/youtube/v3'

const REGION_MAP: Record<string, string> = {
  '香港': 'HK', '台灣': 'TW', '新加坡': 'SG', '馬來西亞': 'MY', '大馬': 'MY',
}

function detectRegion(keyword: string): string {
  for (const [name, code] of Object.entries(REGION_MAP)) {
    if (keyword.includes(name)) return code
  }
  return ''
}

async function fetchVideoStats(videoIds: string[]) {
  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey || !videoIds.length) return {}
  const params = new URLSearchParams({ part: 'statistics', id: videoIds.join(','), key: apiKey })
  try {
    const res = await fetch(`${YT_BASE}/videos?${params}`)
    if (!res.ok) return {}
    const data = await res.json()
    const map: Record<string, { views: number; likes: number; comments: number }> = {}
    for (const item of (data.items ?? [])) {
      const s = item.statistics ?? {}
      map[item.id] = { views: parseInt(s.viewCount ?? '0'), likes: parseInt(s.likeCount ?? '0'), comments: parseInt(s.commentCount ?? '0') }
    }
    return map
  } catch { return {} }
}

async function fetchChannelStats(channelIds: string[]) {
  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey || !channelIds.length) return {}
  const params = new URLSearchParams({ part: 'statistics', id: [...new Set(channelIds)].join(','), key: apiKey })
  try {
    const res = await fetch(`${YT_BASE}/channels?${params}`)
    if (!res.ok) return {}
    const data = await res.json()
    const map: Record<string, { subscribers: number }> = {}
    for (const item of (data.items ?? [])) {
      map[item.id] = { subscribers: parseInt(item.statistics?.subscriberCount ?? '0') }
    }
    return map
  } catch { return {} }
}

async function scanKeywordVideos(keyword: string, category: string) {
  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey) return []
  const regionCode = detectRegion(keyword)
  const publishedAfter = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const params = new URLSearchParams({ part: 'snippet', q: keyword, type: 'video', order: 'viewCount', publishedAfter, maxResults: '20', key: apiKey })
  if (regionCode) params.set('regionCode', regionCode)
  try {
    const res = await fetch(`${YT_BASE}/search?${params}`)
    if (!res.ok) return []
    const data = await res.json()
    const items = data.items ?? []
    if (!items.length) return []

    const videoIds = items.map((i: Record<string, unknown>) => (i.id as Record<string, unknown>)?.videoId as string).filter(Boolean)
    const channelIds = [...new Set(items.map((i: Record<string, unknown>) => (i.snippet as Record<string, unknown>)?.channelId as string).filter(Boolean))]
    const [videoStats, channelStats] = await Promise.all([fetchVideoStats(videoIds), fetchChannelStats(channelIds as string[])])

    const results = []
    for (const item of items) {
      const snippet = item.snippet as Record<string, unknown>
      const videoId = (item.id as Record<string, unknown>)?.videoId as string
      if (!videoId) continue
      const vStats = videoStats[videoId]
      const channelId = snippet?.channelId as string
      const cStats = channelStats[channelId]
      if (!vStats || vStats.views < 5000) continue
      const subs = cStats?.subscribers ?? 0
      const outlier_ratio = subs > 0 ? vStats.views / subs : 0
      if (outlier_ratio < 0.5) continue
      results.push({
        video_id: videoId,
        channel_id: channelId,
        channel_name: (snippet?.channelTitle as string) ?? '',
        title: (snippet?.title as string) ?? '',
        views: vStats.views,
        likes: vStats.likes,
        comments: vStats.comments,
        subscribers_at_publish: subs,
        outlier_ratio,
        published_at: snippet?.publishedAt as string,
        region: regionCode || null,
        category,
        thumbnail_url: ((snippet?.thumbnails as Record<string, unknown>)?.medium as Record<string, unknown>)?.url as string ?? null,
        is_viral: outlier_ratio >= 2,
      })
    }
    return results
  } catch { return [] }
}

export async function GET(request: Request) {
  const supabase = createAdminSupabase()
  if (!supabase) return NextResponse.json({ error: 'Supabase 未配置' }, { status: 500 })
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') ?? 'viral'
  const region = searchParams.get('region') ?? ''
  const category = searchParams.get('category') ?? ''
  const days = parseInt(searchParams.get('days') ?? '7')

  if (type === 'viral') {
    let query = supabase.from('channel_videos').select('*')
      .gte('published_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
      .order('outlier_ratio', { ascending: false }).limit(50)
    if (region) query = query.eq('region', region)
    if (category) query = query.eq('category', category)
    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ videos: data ?? [] })
  }

  if (type === 'growth') {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
    const { data: channels } = await supabase.from('channels').select('channel_id, channel_name, channel_url, region, category, subscribers, total_views, thumbnail_url').order('subscribers', { ascending: false }).limit(100)
    if (!channels?.length) return NextResponse.json({ channels: [] })
    const growthData = []
    for (const ch of channels) {
      const { data: snapshots } = await supabase.from('channel_snapshots').select('subscribers, total_views, captured_at').eq('channel_id', ch.channel_id).gte('captured_at', cutoff).order('captured_at', { ascending: true }).limit(2)
      if (!snapshots || snapshots.length < 2) continue
      const oldest = snapshots[0]
      const newest = snapshots[snapshots.length - 1]
      const sub_growth = newest.subscribers - oldest.subscribers
      const sub_growth_pct = oldest.subscribers > 0 ? parseFloat(((sub_growth / oldest.subscribers) * 100).toFixed(1)) : 0
      const view_growth = newest.total_views - oldest.total_views
      growthData.push({ ...ch, sub_growth, sub_growth_pct, view_growth })
    }
    growthData.sort((a, b) => b.sub_growth_pct - a.sub_growth_pct)
    return NextResponse.json({ channels: growthData })
  }

  if (type === 'categories') {
    const { data } = await supabase.from('channel_videos').select('category, outlier_ratio, views, region').gte('published_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
    if (!data) return NextResponse.json({ categories: [] })
    const catMap: Record<string, { count: number; total_views: number; avg_outlier: number }> = {}
    for (const v of data) {
      const cat = v.category ?? '其他'
      if (!catMap[cat]) catMap[cat] = { count: 0, total_views: 0, avg_outlier: 0 }
      catMap[cat].count++
      catMap[cat].total_views += v.views ?? 0
      catMap[cat].avg_outlier += v.outlier_ratio ?? 0
    }
    const categories = Object.entries(catMap).map(([name, stats]) => ({
      name, video_count: stats.count, total_views: stats.total_views,
      avg_outlier: stats.count > 0 ? parseFloat((stats.avg_outlier / stats.count).toFixed(1)) : 0,
    })).sort((a, b) => b.total_views - a.total_views)
    return NextResponse.json({ categories })
  }

  return NextResponse.json({ error: '無效的 type 參數' }, { status: 400 })
}

export async function POST() {
  const supabase = createAdminSupabase()
  if (!supabase) return NextResponse.json({ error: 'Supabase 未配置' }, { status: 500 })

  // 從 Supabase 讀取全部中文關鍵字
  const { data: keywords } = await supabase.from('scan_keywords').select('keyword, category').eq('active', true)
  if (!keywords?.length) return NextResponse.json({ success: true, results: { videos_saved: 0, viral_found: 0 } })

  const { data: existing } = await supabase.from('channel_videos').select('video_id')
  const existingIds = new Set((existing ?? []).map((v) => v.video_id))

  let saved = 0
  let viral = 0

  for (const kw of keywords) {
    const videos = await scanKeywordVideos(kw.keyword, kw.category)
    for (const v of videos) {
      if (existingIds.has(v.video_id)) continue
      const { error } = await supabase.from('channel_videos').insert(v)
      if (!error) { saved++; if (v.is_viral) viral++; existingIds.add(v.video_id) }
    }
  }

  return NextResponse.json({ success: true, results: { videos_saved: saved, viral_found: viral } })
}
