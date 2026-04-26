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

async function fetchChannelStats(channelIds: string[]) {
  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey || !channelIds.length) return {}
  const params = new URLSearchParams({ part: 'statistics,snippet', id: channelIds.join(','), key: apiKey })
  try {
    const res = await fetch(`${YT_BASE}/channels?${params}`)
    if (!res.ok) return {}
    const data = await res.json()
    const map: Record<string, { subscribers: number; total_views: number; video_count: number; channel_name: string; thumbnail_url: string }> = {}
    for (const item of (data.items ?? [])) {
      const stats = item.statistics ?? {}
      map[item.id] = {
        subscribers: parseInt(stats.subscriberCount ?? '0'),
        total_views: parseInt(stats.viewCount ?? '0'),
        video_count: parseInt(stats.videoCount ?? '0'),
        channel_name: item.snippet?.title ?? '',
        thumbnail_url: item.snippet?.thumbnails?.medium?.url ?? '',
      }
    }
    return map
  } catch { return {} }
}

async function discoverChannelsByKeyword(keyword: string, regionCode: string) {
  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey) return []
  const params = new URLSearchParams({ part: 'snippet', q: keyword, type: 'channel', maxResults: '10', key: apiKey })
  if (regionCode) params.set('regionCode', regionCode)
  try {
    const res = await fetch(`${YT_BASE}/search?${params}`)
    if (!res.ok) return []
    const data = await res.json()
    return (data.items ?? []).map((item: Record<string, unknown>) => {
      const snippet = item.snippet as Record<string, unknown>
      const id = item.id as Record<string, unknown>
      return {
        channel_id: id?.channelId as string,
        channel_name: snippet?.channelTitle as string,
        channel_url: `https://www.youtube.com/channel/${id?.channelId}`,
        thumbnail_url: ((snippet?.thumbnails as Record<string, unknown>)?.medium as Record<string, unknown>)?.url as string ?? '',
      }
    }).filter((c: { channel_id: string }) => c.channel_id)
  } catch { return [] }
}

export async function GET(request: Request) {
  const supabase = createAdminSupabase()
  if (!supabase) return NextResponse.json({ error: 'Supabase 未配置' }, { status: 500 })
  const { searchParams } = new URL(request.url)
  const region = searchParams.get('region')
  const category = searchParams.get('category')
  let query = supabase.from('channels').select('*').order('subscribers', { ascending: false })
  if (region) query = query.eq('region', region)
  if (category) query = query.eq('category', category)
  const { data, error } = await query.limit(100)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ channels: data ?? [] })
}

export async function POST(request: Request) {
  const supabase = createAdminSupabase()
  if (!supabase) return NextResponse.json({ error: 'Supabase 未配置' }, { status: 500 })
  const body = await request.json().catch(() => ({}))
  const mode = body.mode ?? 'update'
  const results = { channels_updated: 0, channels_discovered: 0, snapshots_saved: 0 }

  if (mode === 'discover') {
    // 從 Supabase 讀取全部 33 個中文關鍵字
    const { data: keywords } = await supabase
      .from('scan_keywords')
      .select('keyword, category')
      .eq('active', true)

    if (!keywords?.length) return NextResponse.json({ success: true, results })

    const { data: existing } = await supabase.from('channels').select('channel_id')
    const existingIds = new Set((existing ?? []).map((c) => c.channel_id))

    for (const kw of keywords) {
      const regionCode = detectRegion(kw.keyword)
      const found = await discoverChannelsByKeyword(kw.keyword, regionCode)
      const newChannels = found.filter((c: { channel_id: string }) => !existingIds.has(c.channel_id))
      if (!newChannels.length) continue

      const statsMap = await fetchChannelStats(newChannels.map((c: { channel_id: string }) => c.channel_id))

      for (const ch of newChannels) {
        const stats = statsMap[ch.channel_id]
        if (!stats || stats.subscribers < 1000) continue

        const priority = stats.subscribers > 100000 ? 'daily'
          : stats.subscribers > 10000 ? 'every3days'
          : 'weekly'

        const regionLabel = regionCode ||
          (kw.category !== '中文通用' && kw.category !== '海外華人' ? kw.category : '海外')

        const { error } = await supabase.from('channels').insert({
          channel_id: ch.channel_id,
          channel_name: stats.channel_name || ch.channel_name,
          channel_url: ch.channel_url,
          region: regionLabel,
          language: regionCode === 'HK' ? 'zh-HK' : regionCode === 'TW' ? 'zh-TW' : 'zh',
          category: kw.category,
          subscribers: stats.subscribers,
          total_views: stats.total_views,
          video_count: stats.video_count,
          thumbnail_url: ch.thumbnail_url,
          update_priority: priority,
          last_updated_at: new Date().toISOString(),
        })
        if (!error) { results.channels_discovered++; existingIds.add(ch.channel_id) }
      }
    }
  } else {
    // 分批更新現有頻道
    const now = new Date()
    const dayOfWeek = now.getDay()
    const priorityFilter = dayOfWeek === 0
      ? ['daily', 'every3days', 'weekly']
      : dayOfWeek % 2 === 0 ? ['daily', 'every3days'] : ['daily']

    const { data: channels } = await supabase
      .from('channels').select('channel_id, channel_name')
      .in('update_priority', priorityFilter).limit(50)

    if (!channels?.length) return NextResponse.json({ success: true, results })

    const statsMap = await fetchChannelStats(channels.map((c) => c.channel_id))

    for (const ch of channels) {
      const stats = statsMap[ch.channel_id]
      if (!stats) continue
      await supabase.from('channels').update({
        subscribers: stats.subscribers, total_views: stats.total_views,
        video_count: stats.video_count, last_updated_at: now.toISOString(),
      }).eq('channel_id', ch.channel_id)
      const { error: snapError } = await supabase.from('channel_snapshots').insert({
        channel_id: ch.channel_id, subscribers: stats.subscribers,
        total_views: stats.total_views, video_count: stats.video_count,
        captured_at: now.toISOString(),
      })
      if (!snapError) results.snapshots_saved++
      results.channels_updated++
    }
  }

  return NextResponse.json({ success: true, results })
}
