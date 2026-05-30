import { createAdminSupabase } from '@/lib/supabase'
import { jsonUtf8 } from '@/lib/workbench'

type TopicRow = {
  id: string
  ew_channel_id: string
  series_id: string | null
  thesis: string
  material: string | null
  status: 'idea' | 'scripted' | string
  script_id: string | null
  created_at: string
  updated_at: string
}

type SeriesRow = {
  id: string
  name: string
  domain: string
}

type ScriptRow = {
  id: string
  title: string
}

function cleanOptionalId(value: unknown) {
  const text = String(value ?? '').trim()
  return text || null
}

async function attachRelatedRows(supabase: ReturnType<typeof createAdminSupabase>, topics: TopicRow[]) {
  if (!supabase || topics.length === 0) return topics.map((topic) => ({ ...topic, series: null, script: null }))

  const seriesIds = Array.from(new Set(topics.map((topic) => topic.series_id).filter(Boolean))) as string[]
  const scriptIds = Array.from(new Set(topics.map((topic) => topic.script_id).filter(Boolean))) as string[]

  const seriesMap = new Map<string, SeriesRow>()
  const scriptMap = new Map<string, ScriptRow>()

  if (seriesIds.length) {
    const { data } = await supabase.from('ew_series').select('id, name, domain').in('id', seriesIds)
    ;(data as SeriesRow[] | null)?.forEach((row) => seriesMap.set(row.id, row))
  }

  if (scriptIds.length) {
    const { data } = await supabase.from('scripts').select('id, title').in('id', scriptIds)
    ;(data as ScriptRow[] | null)?.forEach((row) => scriptMap.set(row.id, row))
  }

  return topics.map((topic) => ({
    ...topic,
    material: topic.material ?? '',
    series: topic.series_id ? seriesMap.get(topic.series_id) ?? null : null,
    script: topic.script_id ? scriptMap.get(topic.script_id) ?? null : null,
  }))
}

async function listSeriesOptions(supabase: ReturnType<typeof createAdminSupabase>, channelId: string) {
  if (!supabase || !channelId) return []
  const { data, error } = await supabase
    .from('ew_series')
    .select('id, name, domain')
    .eq('channel_id', channelId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data as SeriesRow[] | null) ?? []
}

export async function GET(request: Request) {
  const supabase = createAdminSupabase()
  if (!supabase) return jsonUtf8({ error: 'Supabase 未設定。' }, { status: 500 })

  const url = new URL(request.url)
  const id = url.searchParams.get('id')?.trim()
  const channelId = url.searchParams.get('ew_channel_id')?.trim()

  if (id) {
    const { data, error } = await supabase
      .from('ew_topics')
      .select('id, ew_channel_id, series_id, thesis, material, status, script_id, created_at, updated_at')
      .eq('id', id)
      .maybeSingle()

    if (error) return jsonUtf8({ error: error.message }, { status: 500 })
    if (!data) return jsonUtf8({ error: '找不到題目。' }, { status: 404 })

    const [topic] = await attachRelatedRows(supabase, [data as TopicRow])
    return jsonUtf8({ topic })
  }

  if (!channelId) return jsonUtf8({ error: '缺少 ew_channel_id。' }, { status: 400 })

  const { data, error } = await supabase
    .from('ew_topics')
    .select('id, ew_channel_id, series_id, thesis, material, status, script_id, created_at, updated_at')
    .eq('ew_channel_id', channelId)
    .order('created_at', { ascending: false })

  if (error) return jsonUtf8({ error: error.message }, { status: 500 })

  try {
    const [topics, seriesOptions] = await Promise.all([
      attachRelatedRows(supabase, (data as TopicRow[] | null) ?? []),
      listSeriesOptions(supabase, channelId),
    ])
    return jsonUtf8({ topics, series_options: seriesOptions })
  } catch (error) {
    return jsonUtf8({ error: error instanceof Error ? error.message : '讀取題目失敗。' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const supabase = createAdminSupabase()
  if (!supabase) return jsonUtf8({ error: 'Supabase 未設定。' }, { status: 500 })

  const body = await request.json().catch(() => null)
  const channelId = String(body?.ew_channel_id ?? '').trim()
  const thesis = String(body?.thesis ?? '').trim()
  const material = String(body?.material ?? '').trim()
  const seriesId = cleanOptionalId(body?.series_id)

  if (!channelId || !thesis) return jsonUtf8({ error: '請填寫頻道同論點。' }, { status: 400 })

  const { data, error } = await supabase
    .from('ew_topics')
    .insert({
      ew_channel_id: channelId,
      series_id: seriesId,
      thesis,
      material,
      status: 'idea',
    })
    .select('id, ew_channel_id, series_id, thesis, material, status, script_id, created_at, updated_at')
    .single()

  if (error) return jsonUtf8({ error: error.message }, { status: 500 })

  const [topic] = await attachRelatedRows(supabase, [data as TopicRow])
  return jsonUtf8({ topic }, { status: 201 })
}

export async function PATCH(request: Request) {
  const supabase = createAdminSupabase()
  if (!supabase) return jsonUtf8({ error: 'Supabase 未設定。' }, { status: 500 })

  const body = await request.json().catch(() => null)
  const id = String(body?.id ?? '').trim()
  if (!id) return jsonUtf8({ error: '缺少題目 id。' }, { status: 400 })

  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() }

  if ('thesis' in (body ?? {})) {
    const thesis = String(body?.thesis ?? '').trim()
    if (!thesis) return jsonUtf8({ error: '論點不可留空。' }, { status: 400 })
    payload.thesis = thesis
  }
  if ('material' in (body ?? {})) payload.material = String(body?.material ?? '').trim()
  if ('series_id' in (body ?? {})) payload.series_id = cleanOptionalId(body?.series_id)
  if ('status' in (body ?? {})) {
    const status = String(body?.status ?? '').trim()
    if (status !== 'idea' && status !== 'scripted') {
      return jsonUtf8({ error: 'status 只可為 idea 或 scripted。' }, { status: 400 })
    }
    payload.status = status
  }
  if ('script_id' in (body ?? {})) payload.script_id = cleanOptionalId(body?.script_id)

  const { data, error } = await supabase
    .from('ew_topics')
    .update(payload)
    .eq('id', id)
    .select('id, ew_channel_id, series_id, thesis, material, status, script_id, created_at, updated_at')
    .single()

  if (error) return jsonUtf8({ error: error.message }, { status: 500 })

  const [topic] = await attachRelatedRows(supabase, [data as TopicRow])
  return jsonUtf8({ topic })
}

export async function DELETE(request: Request) {
  const supabase = createAdminSupabase()
  if (!supabase) return jsonUtf8({ error: 'Supabase 未設定。' }, { status: 500 })

  const id = new URL(request.url).searchParams.get('id')?.trim()
  if (!id) return jsonUtf8({ error: '缺少題目 id。' }, { status: 400 })

  const { error } = await supabase.from('ew_topics').delete().eq('id', id)
  if (error) return jsonUtf8({ error: error.message }, { status: 500 })

  return jsonUtf8({ ok: true })
}
