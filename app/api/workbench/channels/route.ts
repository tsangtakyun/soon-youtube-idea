import { NextResponse } from 'next/server'

import { createAdminSupabase } from '@/lib/supabase'

export async function GET() {
  const supabase = createAdminSupabase()
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase 未設定。' }, { status: 500 })
  }

  const { data, error } = await supabase
    .from('ew_channels')
    .select('id, name, positioning, value_shift, tone, rubric_config')
    .not('positioning', 'is', null)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ channels: data ?? [] })
}
