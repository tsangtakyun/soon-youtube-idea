import { NextResponse } from 'next/server'
import { createAdminSupabase } from '@/lib/supabase'

export async function GET() {
  const supabase = createAdminSupabase()
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase 未設定' }, { status: 500 })
  }

  const { data, error } = await supabase
    .from('topic_signals')
    .select('*')
    .order('max_outlier_ratio', { ascending: false })
    .limit(50)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ topics: data })
}

export async function PATCH(request: Request) {
  const supabase = createAdminSupabase()
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase 未設定' }, { status: 500 })
  }

  const { id, status } = await request.json()

  const { error } = await supabase
    .from('topic_signals')
    .update({ status })
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
