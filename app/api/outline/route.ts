import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'
import { createAdminSupabase } from '@/lib/supabase'

type ViralVideoForOutline = {
  id: string
  title_original?: string | null
  title_zh?: string | null
  channel_name?: string | null
  views?: number | null
  ai_analysis?: string | null
  description?: string | null
  region?: string | null
}

type OutlineContent = {
  pageTitle: string
  suggestedTitles: string[]
  caption: string
  coreAngle: string
  sections: Array<{ key: string; content: string }>
}

const EMPTY_SECTIONS = [
  { key: 'hook', content: '' },
  { key: 'phenomenon', content: '' },
  { key: 'root', content: '' },
  { key: 'conflict', content: '' },
  { key: 'ad', content: '' },
  { key: 'soon-angle', content: '' },
  { key: 'ending', content: '' },
]

export async function POST(request: Request) {
  try {
    const { videoId } = await request.json()
    if (!videoId) {
      return NextResponse.json({ error: 'Missing videoId' }, { status: 400 })
    }

    const supabase = createAdminSupabase()
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }

    const { data: video, error: videoError } = await supabase
      .from('viral_videos')
      .select('*')
      .eq('id', videoId)
      .single()

    if (videoError || !video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    const { content, usedFallback } = await buildOutlineContent(
      video as ViralVideoForOutline
    )
    const pageTitle = JSON.parse(content).pageTitle

    const { data: outline, error: outlineError } = await supabase
      .from('outlines')
      .insert({
        video_id: videoId,
        title_zh: pageTitle,
        content,
        status: 'draft',
      })
      .select('id')
      .single()

    if (outlineError) {
      return NextResponse.json(
        { error: `Save failed: ${outlineError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      outlineId: outline.id,
      content,
      warning: usedFallback
        ? 'Claude is temporarily rate limited. A fallback outline was created so handoff can continue.'
        : null,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const supabase = createAdminSupabase()

  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
  }

  if (id) {
    const { data, error } = await supabase
      .from('outlines')
      .select('*')
      .eq('id', id)
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ outline: data })
  }

  const { data, error } = await supabase
    .from('outlines')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ outlines: data })
}

export async function PATCH(request: Request) {
  const { id, title_zh, content } = await request.json()
  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  }

  const supabase = createAdminSupabase()
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
  }

  const payload: Record<string, unknown> = {}
  if (typeof title_zh === 'string') payload.title_zh = title_zh
  if (typeof content === 'string') payload.content = content

  const { error } = await supabase.from('outlines').update(payload).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

async function buildOutlineContent(video: ViralVideoForOutline): Promise<{
  content: string
  usedFallback: boolean
}> {
  const fallback = buildFallbackOutlineContent(video)
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return { content: fallback, usedFallback: true }

  const anthropic = new Anthropic({ apiKey })
  const prompt = [
    'You are SOON YouTube editorial strategist. Build a compact outline seed for a documentary-style script.',
    '',
    `Video title zh: ${video.title_zh || video.title_original || ''}`,
    `Original title: ${video.title_original || ''}`,
    `Channel: ${video.channel_name || ''}`,
    `Views: ${video.views?.toLocaleString() || ''}`,
    `Region: ${video.region || ''}`,
    `AI analysis: ${trimPromptField(video.ai_analysis, 1200) || '(none)'}`,
    `Description: ${trimPromptField(video.description, 800) || '(none)'}`,
    '',
    'Return only JSON with this shape:',
    '{',
    '  "pageTitle": "concise Cantonese documentary angle title",',
    '  "suggestedTitles": ["title 1", "title 2", "title 3"],',
    '  "caption": "YouTube caption hook",',
    '  "coreAngle": "SOON editorial angle in 1-2 sentences"',
    '}',
  ].join('\n')

  try {
    const aiRes = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 800,
      system: 'Return one valid JSON object only. No markdown.',
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = aiRes.content
      .map((part) => ('text' in part ? part.text : ''))
      .join('')
      .trim()
    const structured = parseJsonObject(raw)
    if (!structured) return { content: fallback, usedFallback: true }

    return {
      content: JSON.stringify({
        pageTitle: String(
          structured.pageTitle || video.title_zh || video.title_original || 'SOON YouTube Idea'
        ),
        suggestedTitles: Array.isArray(structured.suggestedTitles)
          ? structured.suggestedTitles.map(String).slice(0, 3)
          : [],
        caption: String(structured.caption || ''),
        coreAngle: String(structured.coreAngle || ''),
        sections: EMPTY_SECTIONS,
      } satisfies OutlineContent),
      usedFallback: false,
    }
  } catch (error) {
    if (!isRateLimitError(error)) {
      console.error('[outline] Claude failed, using fallback outline:', error)
    }
    return { content: fallback, usedFallback: true }
  }
}

function buildFallbackOutlineContent(video: ViralVideoForOutline) {
  const title = video.title_zh || video.title_original || 'SOON YouTube Idea'
  const coreAngle = `Use "${title}" as the starting signal, then unpack why this topic attracts attention and what it reveals about Asian culture, business, or human behavior.`

  return JSON.stringify({
    pageTitle: title,
    suggestedTitles: [
      `${title}: the real story is not the surface challenge`,
      `What ${title} reveals about attention culture`,
      `${title} is really a business of curiosity`,
    ],
    caption: `${title}\n\nA viral topic is rarely just the thing on screen. The real question is why people cannot look away.`,
    coreAngle,
    sections: EMPTY_SECTIONS,
  } satisfies OutlineContent)
}

function parseJsonObject(raw: string): Record<string, unknown> | null {
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start === -1 || end === -1) return null

  try {
    const parsed = JSON.parse(raw.slice(start, end + 1))
    return parsed && typeof parsed === 'object'
      ? (parsed as Record<string, unknown>)
      : null
  } catch {
    return null
  }
}

function isRateLimitError(error: unknown) {
  if (typeof error !== 'object' || error === null) return false
  const maybe = error as {
    status?: number
    type?: string
    error?: { type?: string }
    message?: string
  }

  return (
    maybe.status === 429 ||
    maybe.type === 'rate_limit_error' ||
    maybe.error?.type === 'rate_limit_error' ||
    String(maybe.message ?? '').toLowerCase().includes('rate_limit')
  )
}

function trimPromptField(value: string | null | undefined, maxChars: number) {
  if (!value) return ''
  if (value.length <= maxChars) return value
  return `${value.slice(0, maxChars)}...[truncated]`
}
