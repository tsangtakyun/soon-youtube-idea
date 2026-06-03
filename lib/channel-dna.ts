export type RubricCriterionKey =
  | 'counterintuitive'
  | 'depth'
  | 'whitespace'
  | 'anchor'
  | 'tone_fit'

export type RubricCriterion = {
  key: RubricCriterionKey
  label: string
  source: string
  standard: string
  weight: number
}

export type RubricConfig = {
  criteria: RubricCriterion[]
  confirmed: boolean
  generated_at: string
}

export type ChannelSeries = {
  id?: string
  name: string
  domain: string
  description?: string | null
  default_tone?: string | null
  default_hook?: string | null
  whitespace_context?: Record<string, unknown>
}

export type ChannelDna = {
  id?: string
  name: string
  positioning: string
  value_shift: string
  tone: string
  rubric_config: RubricConfig
  series: ChannelSeries[]
}

export const FIXED_RUBRIC_META: Array<Omit<RubricCriterion, 'standard'>> = [
  { key: 'counterintuitive', label: '顛覆性', source: '觀點/價值', weight: 1 },
  { key: 'depth', label: '深度', source: '定位句', weight: 1 },
  { key: 'whitespace', label: '題材空隙', source: '題材', weight: 1 },
  { key: 'anchor', label: '落地點', source: '定位句', weight: 1 },
  { key: 'tone_fit', label: '語氣配合', source: '語氣', weight: 1 },
]

export function normaliseCriteria(raw: unknown): RubricCriterion[] {
  const source = Array.isArray(raw) ? raw : []
  return FIXED_RUBRIC_META.map((meta) => {
    const found = source.find(
      (item): item is Partial<RubricCriterion> =>
        Boolean(item) &&
        typeof item === 'object' &&
        (item as Partial<RubricCriterion>).key === meta.key
    )

    return {
      ...meta,
      standard: String(found?.standard ?? '').trim(),
      weight: Number.isFinite(Number(found?.weight)) ? Number(found?.weight) : 1,
    }
  })
}

export function extractJsonObject(raw: string) {
  const cleaned = raw
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/i, '')
    .trim()
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start === -1 || end === -1) return null

  try {
    return JSON.parse(cleaned.slice(start, end + 1)) as Record<string, unknown>
  } catch {
    return null
  }
}
