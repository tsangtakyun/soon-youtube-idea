const SCRIPT_GENERATOR_URL =
  process.env.NEXT_PUBLIC_SCRIPT_GENERATOR_URL ||
  'https://script-generator-youtube.vercel.app'

const MAX_BACKGROUND_CHARS = 1000
const MAX_ADDITIONAL_REFS = 19

export interface OutgoingHandoffParams {
  topic: string
  background: string
  sourceIdeaId?: string
  outlineId?: string
  videoId?: string
  language?: string
  framework?: 'fern_6part' | 'custom'
  hookVariant?: 'mystery' | 'thesis' | 'trojan_horse'
  additionalReferenceIds?: string[]
}

export interface OutlineRowForHandoff {
  id: string
  video_id?: string | null
  title_zh?: string | null
  content?: string | null
  status?: string
  created_at?: string
}

export interface OutlineContentShape {
  pageTitle?: string
  suggestedTitles?: string[]
  caption?: string
  coreAngle?: string
  sections?: Array<{ key: string; content: string }>
}

export function extractHandoffFromOutline(
  outline: OutlineRowForHandoff
): { topic: string; background: string; coreAngleAvailable: boolean } {
  let parsedContent: OutlineContentShape | null = null

  if (outline.content) {
    try {
      parsedContent = JSON.parse(outline.content) as OutlineContentShape
    } catch {
      parsedContent = null
    }
  }

  const topic =
    outline.title_zh?.trim() ||
    parsedContent?.pageTitle?.trim() ||
    '(untitled)'

  const coreAngle = parsedContent?.coreAngle?.trim() || ''
  const caption = parsedContent?.caption?.trim() || ''

  const background =
    coreAngle ||
    caption ||
    (outline.content && !parsedContent ? outline.content : '') ||
    ''

  return {
    topic,
    background,
    coreAngleAvailable: !!coreAngle,
  }
}

export function buildScriptHandoffUrl(params: OutgoingHandoffParams): string {
  const url = new URL(SCRIPT_GENERATOR_URL)

  url.searchParams.set('topic', params.topic)
  url.searchParams.set('background', truncateBackground(params.background))

  if (params.sourceIdeaId) {
    url.searchParams.set('sourceIdeaId', params.sourceIdeaId)
  }
  if (params.outlineId) {
    url.searchParams.set('outlineId', params.outlineId)
  }
  if (params.videoId) {
    url.searchParams.set('videoId', params.videoId)
  }
  if (params.language) {
    url.searchParams.set('language', params.language)
  }
  if (params.framework) {
    url.searchParams.set('framework', params.framework)
  }
  if (params.hookVariant) {
    url.searchParams.set('hookVariant', params.hookVariant)
  }
  if (params.additionalReferenceIds && params.additionalReferenceIds.length > 0) {
    const truncated = params.additionalReferenceIds.slice(0, MAX_ADDITIONAL_REFS)
    url.searchParams.set('additionalReferenceIds', truncated.join(','))
  }

  return url.toString()
}

function truncateBackground(background: string): string {
  if (!background) return ''
  if (background.length <= MAX_BACKGROUND_CHARS) {
    return background
  }
  return background.slice(0, MAX_BACKGROUND_CHARS) + '...[truncated]'
}

export function buildHandoffUrlFromOutline(
  outline: OutlineRowForHandoff,
  options?: {
    sourceIdeaId?: string
    framework?: 'fern_6part' | 'custom'
    hookVariant?: 'mystery' | 'thesis' | 'trojan_horse'
    language?: string
  }
): string {
  const { topic, background } = extractHandoffFromOutline(outline)

  return buildScriptHandoffUrl({
    topic,
    background,
    outlineId: outline.id,
    videoId: outline.video_id || undefined,
    sourceIdeaId: options?.sourceIdeaId,
    framework: options?.framework ?? 'fern_6part',
    hookVariant: options?.hookVariant ?? 'mystery',
    language: options?.language ?? 'Cantonese',
  })
}
