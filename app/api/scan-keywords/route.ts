import { NextResponse } from 'next/server'
import { createAdminSupabase } from '@/lib/supabase'

export async function GET() {
  const supabase = createAdminSupabase()
  if (!supabase) return NextResponse.json({ error: 'Supabase 未設定' }, { status: 500 })

  const { data, error } = await supabase
    .from('scan_keywords')
    .select('*')
    .order('category', { ascending: true })
    .order('keyword', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ keywords: data ?? [] })
}

export async function PATCH(request: Request) {
  const supabase = createAdminSupabase()
  if (!supabase) return NextResponse.json({ error: 'Supabase 未設定' }, { status: 500 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const { active } = await request.json()

  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  if (typeof active !== 'boolean') return NextResponse.json({ error: 'Missing active boolean' }, { status: 400 })

  const { error } = await supabase
    .from('scan_keywords')
    .update({ active })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function POST(request: Request) {
  const supabase = createAdminSupabase()
  if (!supabase) return NextResponse.json({ error: 'Supabase 未設定' }, { status: 500 })

  const { keyword, category, active = true } = await request.json()
  if (!keyword?.trim()) return NextResponse.json({ error: 'Missing keyword' }, { status: 400 })

  const { data, error } = await supabase
    .from('scan_keywords')
    .insert({
      keyword: keyword.trim(),
      category: category || 'Culture',
      active: Boolean(active),
    })
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ keyword: data })
}
