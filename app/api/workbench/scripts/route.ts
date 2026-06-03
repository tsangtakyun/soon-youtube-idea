import { createAdminSupabase } from '@/lib/supabase'
import { jsonUtf8, normalizeResearchSources, normalizeScriptParts } from '@/lib/workbench'

const SCRIPT_SELECT =
  'id, title, topic, background, hook_variant, target_minutes, parts, research_sources, ew_channel_id, created_at, updated_at'

function normalizeScript(row: Record<string, unknown>) {
  return {
    ...row,
    title: String(row.title ?? ''),
    topic: String(row.topic ?? ''),
    background: String(row.background ?? ''),
    hook_variant: String(row.hook_variant ?? 'mystery') || 'mystery',
    target_minutes: Number(row.target_minutes ?? 10) || 10,
    parts: normalizeScriptParts(row.parts),
    research_sources: normalizeResearchSources(row.research_sources),
  }
}

export async function GET(request: Request) {
  const supabase = createAdminSupabase()
  if (!supabase) return jsonUtf8({ error: 'Supabase 未設定。' }, { status: 500 })

  const url = new URL(request.url)
  const id = url.searchParams.get('id')?.trim()
  const channelId = url.searchParams.get('channel_id')?.trim()

  if (id) {
    const { data, error } = await supabase
      .from('scripts')
      .select(SCRIPT_SELECT)
      .eq('id', id)
      .maybeSingle()

    if (error) return jsonUtf8({ error: error.message }, { status: 500 })
    if (!data) return jsonUtf8({ error: '找不到已儲存劇本。' }, { status: 404 })

    return jsonUtf8({ script: normalizeScript(data as Record<string, unknown>) })
  }

  let query = supabase
    .from('scripts')
    .select('id, title, topic, ew_channel_id, created_at, updated_at')
    .order('updated_at', { ascending: false })
    .limit(80)

  if (channelId) query = query.eq('ew_channel_id', channelId)

  const { data, error } = await query
  if (error) return jsonUtf8({ error: error.message }, { status: 500 })

  return jsonUtf8({ scripts: data ?? [] })
}

export async function DELETE(request: Request) {
  const supabase = createAdminSupabase()
  if (!supabase) return jsonUtf8({ error: 'Supabase 未設定。' }, { status: 500 })

  const id = new URL(request.url).searchParams.get('id')?.trim()
  if (!id) return jsonUtf8({ error: '缺少劇本 id。' }, { status: 400 })

  const { data: existing, error: existingError } = await supabase
    .from('scripts')
    .select('id, title')
    .eq('id', id)
    .maybeSingle()

  if (existingError) return jsonUtf8({ error: existingError.message }, { status: 500 })
  if (!existing) return jsonUtf8({ error: '找不到已儲存劇本。' }, { status: 404 })

  const { error: unlinkError } = await supabase
    .from('ew_topics')
    .update({ status: 'idea', script_id: null, updated_at: new Date().toISOString() })
    .eq('script_id', id)

  if (unlinkError) return jsonUtf8({ error: unlinkError.message }, { status: 500 })

  const { error: deleteError } = await supabase.from('scripts').delete().eq('id', id)
  if (deleteError) return jsonUtf8({ error: deleteError.message }, { status: 500 })

  return jsonUtf8({ ok: true, deleted: existing })
}
