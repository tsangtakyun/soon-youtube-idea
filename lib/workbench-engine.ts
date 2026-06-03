export type EngineTone = 'documentary' | 'explainer' | 'sharp_commentary' | 'storyteller'
export type EngineHookVariant =
  | 'mystery'
  | 'thesis'
  | 'trojan_horse'
  | 'contrast'
  | 'confession'
  | 'statistic_shock'
  | 'glory_reversal'
  | 'conceptual_clickbait'
export type EngineFramework = 'here_signature' | 'fern_6part'

export type EngineGenerateBody = {
  topic: string
  background?: string
  targetMinutes: number
  tone: EngineTone
  hookVariant: EngineHookVariant
  framework?: EngineFramework
  editorialDirection?: string
  channelPositioning?: string
  channelValueShift?: string
  channelVoice?: string
}

type SupabaseQueryLike = {
  eq: (column: string, value: string) => SupabaseQueryLike
  single: () => Promise<{ data: unknown; error: { message: string } | null }>
}

type SupabaseClientLike = {
  from: (table: string) => {
    select: (columns: string) => SupabaseQueryLike
  }
}

type ChannelRow = {
  positioning: string | null
  value_shift: string | null
  tone: string | null
  default_framework: string | null
}

type SeriesRow = {
  name: string
  description: string | null
  default_tone: string | null
  default_hook: string | null
}

export const VALID_ENGINE_TONES: EngineTone[] = [
  'documentary',
  'explainer',
  'sharp_commentary',
  'storyteller',
]

export const VALID_ENGINE_HOOK_VARIANTS: EngineHookVariant[] = [
  'mystery',
  'thesis',
  'trojan_horse',
  'contrast',
  'confession',
  'statistic_shock',
  'glory_reversal',
  'conceptual_clickbait',
]

export const VALID_ENGINE_FRAMEWORKS: EngineFramework[] = ['here_signature', 'fern_6part']

function resolveTone(value: unknown): EngineTone | null {
  return VALID_ENGINE_TONES.includes(value as EngineTone) ? (value as EngineTone) : null
}

function resolveHookVariant(value: unknown): EngineHookVariant | null {
  return VALID_ENGINE_HOOK_VARIANTS.includes(value as EngineHookVariant)
    ? (value as EngineHookVariant)
    : null
}

function resolveFramework(value: unknown): EngineFramework | null {
  return VALID_ENGINE_FRAMEWORKS.includes(value as EngineFramework)
    ? (value as EngineFramework)
    : null
}

export async function buildEngineGenerateBody(
  supabase: SupabaseClientLike,
  input: {
    topic: string
    background?: string
    targetMinutes: number
    channelId: string
    seriesId: string
    tone?: unknown
    hookVariant?: unknown
  }
): Promise<{ body: EngineGenerateBody; seriesName: string }> {
  const { data: channel, error: channelError } = await supabase
    .from('ew_channels')
    .select('positioning, value_shift, tone, default_framework')
    .eq('id', input.channelId)
    .single()

  if (channelError || !channel) {
    throw new Error(channelError?.message || 'Channel not found.')
  }

  const { data: series, error: seriesError } = await supabase
    .from('ew_series')
    .select('name, description, default_tone, default_hook')
    .eq('id', input.seriesId)
    .eq('channel_id', input.channelId)
    .single()

  if (seriesError || !series) {
    throw new Error(seriesError?.message || 'Series not found for channel.')
  }

  const channelRow = channel as ChannelRow
  const seriesRow = series as SeriesRow
  const tone = resolveTone(input.tone) ?? resolveTone(seriesRow.default_tone) ?? 'documentary'
  const hookVariant =
    resolveHookVariant(input.hookVariant) ?? resolveHookVariant(seriesRow.default_hook) ?? 'mystery'
  const framework = resolveFramework(channelRow.default_framework)

  return {
    seriesName: seriesRow.name,
    body: {
      topic: input.topic,
      background: input.background,
      targetMinutes: input.targetMinutes,
      tone,
      hookVariant,
      ...(framework ? { framework } : {}),
      editorialDirection: seriesRow.description ?? undefined,
      channelPositioning: channelRow.positioning ?? undefined,
      channelValueShift: channelRow.value_shift ?? undefined,
      channelVoice: channelRow.tone ?? undefined,
    },
  }
}
