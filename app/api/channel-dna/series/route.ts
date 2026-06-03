import { NextResponse } from 'next/server'

import { createAdminSupabase } from '@/lib/supabase'

export async function POST(request: Request) {
  const supabase = createAdminSupabase()
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase 未設定。' }, { status: 500 })
  }

  const body = await request.json().catch(() => null)
  const channelId = String(body?.channel_id ?? '').trim()
  const name = String(body?.name ?? '').trim()
  const domain = String(body?.domain ?? '').trim()
  const description = String(body?.description ?? '').trim()
  const defaultTone = String(body?.default_tone ?? '').trim()
  const defaultHook = String(body?.default_hook ?? '').trim()

  if (!channelId || !name || !domain) {
    return NextResponse.json({ error: '請填完整系列名稱同題材。' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('ew_series')
    .insert({
      channel_id: channelId,
      name,
      domain,
      description: description || null,
      default_tone: defaultTone || null,
      default_hook: defaultHook || null,
      whitespace_context: {},
    })
    .select('id, name, domain, description, default_tone, default_hook, whitespace_context')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ series: data })
}

export async function PATCH(request: Request) {
  const supabase = createAdminSupabase()
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase 未設定' }, { status: 500 })
  }

  const body = await request.json().catch(() => null)
  const id = String(body?.id ?? '').trim()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const payload: Record<string, string | null> = {}
  if (Object.prototype.hasOwnProperty.call(body ?? {}, 'name')) {
    const name = String(body?.name ?? '').trim()
    if (!name) return NextResponse.json({ error: 'Missing name' }, { status: 400 })
    payload.name = name
  }
  if (Object.prototype.hasOwnProperty.call(body ?? {}, 'domain')) {
    const domain = String(body?.domain ?? '').trim()
    if (!domain) return NextResponse.json({ error: 'Missing domain' }, { status: 400 })
    payload.domain = domain
  }
  if (Object.prototype.hasOwnProperty.call(body ?? {}, 'description')) {
    const description = String(body?.description ?? '').trim()
    payload.description = description || null
  }
  if (Object.prototype.hasOwnProperty.call(body ?? {}, 'default_tone')) {
    const defaultTone = String(body?.default_tone ?? '').trim()
    payload.default_tone = defaultTone || null
  }
  if (Object.prototype.hasOwnProperty.call(body ?? {}, 'default_hook')) {
    const defaultHook = String(body?.default_hook ?? '').trim()
    payload.default_hook = defaultHook || null
  }

  if (Object.keys(payload).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('ew_series')
    .update(payload)
    .eq('id', id)
    .select('id, name, domain, description, default_tone, default_hook, whitespace_context')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ series: data })
}

export async function DELETE(request: Request) {
  const supabase = createAdminSupabase()
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase 未設定。' }, { status: 500 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const { error } = await supabase.from('ew_series').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
