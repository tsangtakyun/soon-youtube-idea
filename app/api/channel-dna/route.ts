import { NextResponse } from 'next/server'

import { normaliseCriteria, type ChannelSeries } from '@/lib/channel-dna'
import { createAdminSupabase } from '@/lib/supabase'

type ChannelRow = {
  id: string
  name: string
  positioning: string
  value_shift: string
  tone: string
  rubric_config: {
    criteria?: unknown
    confirmed?: boolean
    generated_at?: string
  } | null
  series?: ChannelSeries[]
}

export async function GET() {
  const supabase = createAdminSupabase()
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase 未設定。' }, { status: 500 })
  }

  const { data, error } = await supabase
    .from('ew_channels')
    .select('id, name, positioning, value_shift, tone, rubric_config, series:ew_series(id, name, domain, description, default_tone, default_hook, whitespace_context)')
    .not('positioning', 'is', null)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ channel: null })

  const row = data as ChannelRow
  return NextResponse.json({
    channel: {
      ...row,
      rubric_config: {
        criteria: normaliseCriteria(row.rubric_config?.criteria),
        confirmed: Boolean(row.rubric_config?.confirmed),
        generated_at: row.rubric_config?.generated_at ?? '',
      },
      series: row.series ?? [],
    },
  })
}

export async function POST(request: Request) {
  const supabase = createAdminSupabase()
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase 未設定。' }, { status: 500 })
  }

  const body = await request.json().catch(() => null)
  const id = body?.id ? String(body.id) : ''
  const name = String(body?.name ?? '').trim()
  const positioning = String(body?.positioning ?? '').trim()
  const valueShift = String(body?.value_shift ?? '').trim()
  const tone = String(body?.tone ?? '').trim()
  const criteria = normaliseCriteria(body?.rubric_config?.criteria)
  const series = Array.isArray(body?.series) ? (body.series as ChannelSeries[]) : []

  if (!name || !positioning || !valueShift || !tone) {
    return NextResponse.json({ error: '請填完整頻道基因。' }, { status: 400 })
  }
  if (series.length === 0 || series.some((item) => !item.name?.trim() || !item.domain?.trim())) {
    return NextResponse.json({ error: '請至少建立一個完整系列。' }, { status: 400 })
  }
  if (criteria.some((criterion) => !criterion.standard.trim())) {
    return NextResponse.json({ error: '請確認五條評分準則。' }, { status: 400 })
  }

  const rubricConfig = {
    criteria,
    confirmed: true,
    generated_at: new Date().toISOString(),
  }

  const payload = {
    name,
    positioning,
    value_shift: valueShift,
    tone,
    rubric_config: rubricConfig,
    updated_at: new Date().toISOString(),
  }

  const channelResult = id
    ? await supabase
        .from('ew_channels')
        .update(payload)
        .eq('id', id)
        .select('id, name, positioning, value_shift, tone, rubric_config')
        .single()
    : await supabase
        .from('ew_channels')
        .insert(payload)
        .select('id, name, positioning, value_shift, tone, rubric_config')
        .single()

  if (channelResult.error || !channelResult.data) {
    return NextResponse.json(
      { error: channelResult.error?.message ?? '未能儲存頻道基因。' },
      { status: 500 }
    )
  }

  const channelId = channelResult.data.id as string
  const { error: deleteError } = await supabase.from('ew_series').delete().eq('channel_id', channelId)
  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 })

  const cleanSeries = series.map((item) => ({
    channel_id: channelId,
    name: item.name.trim(),
    domain: item.domain.trim(),
    description: item.description?.trim() || null,
    default_tone: item.default_tone?.trim() || null,
    default_hook: item.default_hook?.trim() || null,
    whitespace_context: item.whitespace_context ?? {},
  }))
  const { error: seriesError } = await supabase.from('ew_series').insert(cleanSeries)
  if (seriesError) return NextResponse.json({ error: seriesError.message }, { status: 500 })

  const { data: savedSeries } = await supabase
    .from('ew_series')
    .select('id, name, domain, description, default_tone, default_hook, whitespace_context')
    .eq('channel_id', channelId)
    .order('created_at', { ascending: true })

  return NextResponse.json({
    channel: {
      ...channelResult.data,
      rubric_config: rubricConfig,
      series: savedSeries ?? [],
    },
  })
}
