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

  if (!channelId || !name || !domain) {
    return NextResponse.json({ error: '請填完整系列名稱同題材。' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('ew_series')
    .insert({
      channel_id: channelId,
      name,
      domain,
      whitespace_context: {},
    })
    .select('id, name, domain, whitespace_context')
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
