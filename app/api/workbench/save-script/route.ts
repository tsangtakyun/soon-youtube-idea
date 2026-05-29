import { NextResponse } from 'next/server'

import { createAdminSupabase } from '@/lib/supabase'
import {
  buildFullScriptText,
  normalizeResearchSources,
  normalizeScriptParts,
  WORKBENCH_MODEL,
} from '@/lib/workbench'

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const thesis = String(body?.thesis ?? '').trim()
  const material = String(body?.material ?? '').trim()
  const title = String(body?.title ?? thesis).trim()
  const channelId = String(body?.channel_id ?? '').trim()
  const hookVariant = String(body?.hook_variant ?? 'thesis').trim() || 'thesis'
  const targetMinutes = Number(body?.target_minutes ?? 8) || 8
  const parts = normalizeScriptParts(body?.parts)
  const researchSources = normalizeResearchSources(body?.research_sources)

  if (!thesis || !title || !channelId || parts.some((part) => !part.content)) {
    return NextResponse.json({ error: '請先完成論點、劇本和頻道選擇。' }, { status: 400 })
  }

  const supabase = createAdminSupabase()
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase 未設定。' }, { status: 500 })
  }

  const now = new Date().toISOString()
  const aiDraft = buildFullScriptText(title, parts)
  const { data, error } = await supabase
    .from('scripts')
    .insert({
      topic: thesis,
      background: material,
      title,
      framework: 'fern_6part',
      hook_variant: hookVariant,
      tone: 'documentary',
      target_minutes: targetMinutes,
      parts,
      research_sources: researchSources,
      ew_channel_id: channelId,
      ai_draft: aiDraft,
      model: WORKBENCH_MODEL,
      generated_at: now,
      updated_at: now,
    })
    .select('id, title')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ script: data })
}
