import { createAdminSupabase } from '@/lib/supabase'
import { buildEngineGenerateBody, type EngineGenerateBody } from '@/lib/workbench-engine'
import { jsonUtf8 } from '@/lib/workbench'

type EngineScriptPart = {
  id?: string
  order?: number
  role?: string
  roleLabel?: string
  title?: string
  content?: string
  hostBite?: string
  estimatedDurationSeconds?: number
  pivotSentence?: string
}

type EngineStructuredScript = {
  title?: string
  tone?: string
  targetMinutes?: number
  parts?: EngineScriptPart[]
}

type EngineResponse = {
  script?: string
  structuredScript?: EngineStructuredScript
  mode?: string
  error?: string
}

function normalizeEngineBaseUrl() {
  return (process.env.SCRIPT_ENGINE_URL || 'https://script-generator-youtube.vercel.app').replace(/\/+$/, '')
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const topic = String(body?.topic ?? body?.thesis ?? '').trim()
  const background = String(body?.background ?? body?.material ?? '').trim()
  const channelId = String(body?.channel_id ?? '').trim()
  const seriesId = String(body?.series_id ?? body?.seriesId ?? '').trim()
  const targetMinutes = Number(body?.target_minutes ?? body?.targetMinutes ?? 8) || 8

  if (!topic || !channelId || !seriesId) {
    return jsonUtf8({ error: 'Missing topic/thesis, channel_id, or series_id.' }, { status: 400 })
  }

  const supabase = createAdminSupabase()
  if (!supabase) {
    return jsonUtf8({ error: 'Supabase is not configured.' }, { status: 500 })
  }

  let engineBody: EngineGenerateBody
  try {
    const resolved = await buildEngineGenerateBody(supabase as never, {
      topic,
      background,
      targetMinutes,
      channelId,
      seriesId,
      tone: body?.tone,
      hookVariant: body?.hookVariant ?? body?.hook_variant,
    })
    engineBody = resolved.body
  } catch (error) {
    return jsonUtf8({ error: error instanceof Error ? error.message : 'Failed to resolve engine context.' }, { status: 404 })
  }

  const engineUrl = normalizeEngineBaseUrl()
  const response = await fetch(`${engineUrl}/api/generate`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-soon-secret': process.env.GENERATE_SHARED_SECRET ?? '',
    },
    body: JSON.stringify(engineBody),
  })

  const engineData = (await response.json().catch(() => null)) as EngineResponse | null
  if (!response.ok || !engineData?.structuredScript) {
    return jsonUtf8(
      {
        error: engineData?.error || `Script engine request failed (${response.status})`,
      },
      { status: response.status || 502 }
    )
  }

  const parts = Array.isArray(engineData.structuredScript.parts) ? engineData.structuredScript.parts : []
  if (parts.length === 0) {
    return jsonUtf8({ error: 'Script engine returned no parts.' }, { status: 502 })
  }

  const title = String(engineData.structuredScript.title ?? topic).trim()
  const now = new Date().toISOString()
  const { data: script, error } = await supabase
    .from('scripts')
    .insert({
      topic,
      background,
      title,
      framework: engineBody.framework ?? 'fern_6part',
      hook_variant: engineBody.hookVariant,
      tone: String(engineData.structuredScript.tone ?? 'documentary'),
      target_minutes: Number(engineData.structuredScript.targetMinutes ?? targetMinutes) || targetMinutes,
      parts,
      research_sources: [],
      ew_channel_id: channelId,
      ai_draft: String(engineData.script ?? ''),
      model: 'script-generator-youtube/api/generate',
      generated_at: now,
      updated_at: now,
    })
    .select('id, title, ew_channel_id')
    .single()

  if (error) return jsonUtf8({ error: error.message }, { status: 500 })

  return jsonUtf8({
    script,
    structuredScript: engineData.structuredScript,
    engine: {
      mode: engineData.mode ?? null,
      parts_count: parts.length,
    },
  })
}
