import { createAdminSupabase } from '@/lib/supabase'
import { jsonUtf8 } from '@/lib/workbench'

type TopicRow = {
  id: string
  ew_channel_id: string
  series_id: string | null
  thesis: string
  location?: string | null
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

const TOPIC_SELECT = 'id, ew_channel_id, series_id, thesis, location, material, status, script_id, created_at, updated_at'
const TOPIC_SELECT_WITHOUT_LOCATION = 'id, ew_channel_id, series_id, thesis, material, status, script_id, created_at, updated_at'
const LOCATION_MARKER_PATTERN = /^<!-- soon-topic-location:([^>]*) -->\n?/

function cleanOptionalId(value: unknown) {
  const text = String(value ?? '').trim()
  return text || null
}

function isMissingLocationColumn(error: { message?: string; code?: string } | null) {
  const message = error?.message?.toLowerCase() ?? ''
  return error?.code === '42703' || (message.includes('location') && message.includes('column'))
}

function splitMaterialLocation(material: string | null | undefined) {
  const text = material ?? ''
  const match = text.match(LOCATION_MARKER_PATTERN)
  if (!match) return { location: '', material: text }

  let location = ''
  try {
    location = decodeURIComponent(match[1] ?? '')
  } catch {
    location = match[1] ?? ''
  }

  return {
    location,
    material: text.replace(LOCATION_MARKER_PATTERN, ''),
  }
}

function materialWithLocationMarker(material: string, location: string) {
  const cleanMaterial = splitMaterialLocation(material).material
  const cleanLocation = location.trim()
  if (!cleanLocation) return cleanMaterial
  return `<!-- soon-topic-location:${encodeURIComponent(cleanLocation)} -->\n${cleanMaterial}`
}

async function selectTopics(
  supabase: ReturnType<typeof createAdminSupabase>,
  query: { id?: string; channelId?: string }
) {
  if (!supabase) return { data: null, error: new Error('Supabase not configured'), usedLocation: false }

  let request = supabase.from('ew_topics').select(TOPIC_SELECT)
  if (query.id) request = request.eq('id', query.id)
  if (query.channelId) request = request.eq('ew_channel_id', query.channelId).order('created_at', { ascending: false })

  const result = query.id ? await request.maybeSingle() : await request
  if (!isMissingLocationColumn(result.error)) return { ...result, usedLocation: true }

  let fallback = supabase.from('ew_topics').select(TOPIC_SELECT_WITHOUT_LOCATION)
  if (query.id) fallback = fallback.eq('id', query.id)
  if (query.channelId) fallback = fallback.eq('ew_channel_id', query.channelId).order('created_at', { ascending: false })

  const fallbackResult = query.id ? await fallback.maybeSingle() : await fallback
  return { ...fallbackResult, usedLocation: false }
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

  return topics.map((topic) => {
    const materialLocation = splitMaterialLocation(topic.material)
    return {
      ...topic,
      location: topic.location ?? materialLocation.location,
      material: materialLocation.material,
      series: topic.series_id ? seriesMap.get(topic.series_id) ?? null : null,
      script: topic.script_id ? scriptMap.get(topic.script_id) ?? null : null,
    }
  })
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

async function resolveSeriesId(
  supabase: ReturnType<typeof createAdminSupabase>,
  channelId: string,
  seriesId: string | null,
  seriesName: string
) {
  if (!supabase || !channelId || (!seriesId && !seriesName)) return null

  if (seriesId) {
    const { data } = await supabase
      .from('ew_series')
      .select('id')
      .eq('id', seriesId)
      .eq('channel_id', channelId)
      .maybeSingle()

    if (data?.id) return data.id as string
  }

  if (!seriesName) return null

  const { data } = await supabase
    .from('ew_series')
    .select('id')
    .eq('channel_id', channelId)
    .eq('name', seriesName)
    .maybeSingle()

  return (data?.id as string | undefined) ?? null
}

export async function GET(request: Request) {
  const supabase = createAdminSupabase()
  if (!supabase) return jsonUtf8({ error: 'Supabase 未設定。' }, { status: 500 })

  const url = new URL(request.url)
  const id = url.searchParams.get('id')?.trim()
  const channelId = url.searchParams.get('ew_channel_id')?.trim()

  if (id) {
    const { data, error } = await selectTopics(supabase, { id })

    if (error) return jsonUtf8({ error: error.message }, { status: 500 })
    if (!data) return jsonUtf8({ error: '找不到題目。' }, { status: 404 })

    const [topic] = await attachRelatedRows(supabase, [data as TopicRow])
    return jsonUtf8({ topic })
  }

  if (!channelId) return jsonUtf8({ error: '缺少 ew_channel_id。' }, { status: 400 })

  const { data, error } = await selectTopics(supabase, { channelId })

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
  const location = String(body?.location ?? '').trim()
  const material = String(body?.material ?? '').trim()
  const seriesId = cleanOptionalId(body?.series_id)
  const seriesName = String(body?.series_name ?? '').trim()

  if (!channelId || !thesis) return jsonUtf8({ error: '請填寫頻道同論點。' }, { status: 400 })

  const resolvedSeriesId = await resolveSeriesId(supabase, channelId, seriesId, seriesName)

  const insertPayload = {
    ew_channel_id: channelId,
    series_id: resolvedSeriesId,
    thesis,
    location,
    material,
    status: 'idea',
  }

  let result = await supabase
    .from('ew_topics')
    .insert(insertPayload)
    .select(TOPIC_SELECT)
    .single()
  let data: unknown = result.data
  let error = result.error

  if (isMissingLocationColumn(error)) {
    const { location: _location, ...fallbackPayload } = insertPayload
    fallbackPayload.material = materialWithLocationMarker(material, location)
    const fallback = await supabase
      .from('ew_topics')
      .insert(fallbackPayload)
      .select(TOPIC_SELECT_WITHOUT_LOCATION)
      .single()
    data = fallback.data ? { ...fallback.data, location } : fallback.data
    error = fallback.error
  }

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

  const { data: existingTopic, error: existingError } = await supabase
    .from('ew_topics')
    .select('id, ew_channel_id, material')
    .eq('id', id)
    .maybeSingle()

  if (existingError) return jsonUtf8({ error: existingError.message }, { status: 500 })
  if (!existingTopic) return jsonUtf8({ error: '找不到題目。' }, { status: 404 })

  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() }

  if ('thesis' in (body ?? {})) {
    const thesis = String(body?.thesis ?? '').trim()
    if (!thesis) return jsonUtf8({ error: '論點不可留空。' }, { status: 400 })
    payload.thesis = thesis
  }
  if ('material' in (body ?? {})) payload.material = String(body?.material ?? '').trim()
  if ('location' in (body ?? {})) payload.location = String(body?.location ?? '').trim()
  if ('series_id' in (body ?? {})) {
    const seriesId = cleanOptionalId(body?.series_id)
    const seriesName = String(body?.series_name ?? '').trim()
    payload.series_id = await resolveSeriesId(
      supabase,
      String(existingTopic.ew_channel_id),
      seriesId,
      seriesName
    )
  }
  if ('status' in (body ?? {})) {
    const status = String(body?.status ?? '').trim()
    if (status !== 'idea' && status !== 'scripted') {
      return jsonUtf8({ error: 'status 只可為 idea 或 scripted。' }, { status: 400 })
    }
    payload.status = status
  }
  if ('script_id' in (body ?? {})) payload.script_id = cleanOptionalId(body?.script_id)

  let result = await supabase
    .from('ew_topics')
    .update(payload)
    .eq('id', id)
    .select(TOPIC_SELECT)
    .single()
  let data: unknown = result.data
  let error = result.error

  if (isMissingLocationColumn(error)) {
    const { location: _location, ...fallbackPayload } = payload
    const existingMaterialLocation = splitMaterialLocation(String(existingTopic.material ?? ''))
    const nextLocation = 'location' in payload ? String(payload.location ?? '') : existingMaterialLocation.location
    const baseMaterial = 'material' in fallbackPayload
      ? String(fallbackPayload.material ?? '')
      : existingMaterialLocation.material
    fallbackPayload.material = materialWithLocationMarker(baseMaterial, nextLocation)
    const fallback = await supabase
      .from('ew_topics')
      .update(fallbackPayload)
      .eq('id', id)
      .select(TOPIC_SELECT_WITHOUT_LOCATION)
      .single()
    data = fallback.data ? { ...fallback.data, location: nextLocation } : fallback.data
    error = fallback.error
  }

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
