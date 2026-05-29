import { extractJsonObject } from '@/lib/channel-dna'

export const WORKBENCH_MODEL = 'claude-sonnet-4-20250514'

export const CANTONESE_WRITTEN_TONE = [
  '旁白使用繁體中文書面語，帶香港語感，但避免口語濫用。',
  '不要使用「嘅、咁、啲」作為主要文體；改用「的、這樣、一些」。',
  '短句、清楚、節奏有起伏。數字用阿拉伯數字，專有名詞保留原文。',
  '論述要有畫面、有因果、有停頓感，但不要誇張煽情。',
].join('\n')

export const FERN_6_PARTS = [
  {
    role: 'hook',
    roleLabel: '鈎子',
    durationRatio: 0.12,
    instruction: '吸引觀眾投入。具體 hook 風格根據 hook_variant 決定。',
  },
  {
    role: 'setup',
    roleLabel: '論點 / 鋪陳',
    durationRatio: 0.13,
    instruction: '建立中央論點，introduce 主要 character / authority。',
  },
  {
    role: 'detail',
    roleLabel: '細節',
    durationRatio: 0.2,
    instruction: '拆解中央論點的 core mechanism。Spatial / economic / historical。',
  },
  {
    role: 'complication',
    roleLabel: '複雜化',
    durationRatio: 0.2,
    instruction: '推翻 setup 的 simplistic narrative。加 stakes、doubt、human dimension。',
  },
  {
    role: 'depth',
    roleLabel: '根本原因',
    durationRatio: 0.2,
    instruction: 'Zoom out 到更深層原因 / 制度 / 歷史。intellectual contribution。',
  },
  {
    role: 'resolution',
    roleLabel: '收束',
    durationRatio: 0.15,
    instruction: '不要強行 happy ending。留 unresolved question。',
  },
] as const

export type FernRole = (typeof FERN_6_PARTS)[number]['role']

export type WorkbenchChannel = {
  id: string
  name: string
  positioning: string
  value_shift: string
  tone: string
  rubric_config?: {
    criteria?: Array<{
      key: string
      label: string
      source: string
      standard: string
      weight: number
    }>
  } | null
}

export type ResearchSource = {
  point: string
  source_url: string
  credibility: string
  supports: 'for' | 'against' | 'context'
}

export type WorkbenchFlag = {
  type: 'contradiction' | 'no_source' | 'too_broad'
  message: string
}

export type ScriptPart = {
  role: FernRole
  roleLabel: string
  content: string
}

export function parseJson(raw: string) {
  try {
    return extractJsonObject(raw)
  } catch {
    return null
  }
}

export function normalizeResearchSources(raw: unknown): ResearchSource[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((item) => {
      const row = item as Record<string, unknown>
      const supports = String(row.supports ?? 'context')
      return {
        point: String(row.point ?? '').trim(),
        source_url: String(row.source_url ?? '').trim(),
        credibility: String(row.credibility ?? '').trim(),
        supports: supports === 'for' || supports === 'against' ? supports : 'context',
      } satisfies ResearchSource
    })
    .filter((item) => item.point && item.source_url && item.credibility)
}

export function normalizeFlags(raw: unknown): WorkbenchFlag[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((item) => {
      const row = item as Record<string, unknown>
      const type = String(row.type ?? '')
      if (type !== 'contradiction' && type !== 'no_source' && type !== 'too_broad') return null
      const message = String(row.message ?? '').trim()
      if (!message) return null
      return { type, message } satisfies WorkbenchFlag
    })
    .filter((item): item is WorkbenchFlag => Boolean(item))
}

export function normalizeScriptParts(raw: unknown): ScriptPart[] {
  const rows = Array.isArray(raw) ? (raw as Array<Record<string, unknown>>) : []
  return FERN_6_PARTS.map((template) => {
    const matched = rows.find((row) => String(row.role) === template.role)
    return {
      role: template.role,
      roleLabel: template.roleLabel,
      content: String(matched?.content ?? '').trim(),
    }
  })
}

export function buildFullScriptText(title: string, parts: ScriptPart[]) {
  return [
    title.trim(),
    '',
    ...parts.flatMap((part) => [`## ${part.roleLabel}`, part.content.trim(), '']),
  ]
    .join('\n')
    .trim()
}

export function buildFernPromptLines(targetMinutes: number) {
  return FERN_6_PARTS.map((part, index) => {
    const seconds = Math.round(targetMinutes * 60 * part.durationRatio)
    const minWords = seconds * 4
    const maxWords = seconds * 6
    return `${index + 1}. ${part.role} / ${part.roleLabel} / durationRatio ${part.durationRatio}: ${part.instruction} 建議 ${minWords}-${maxWords} 字。`
  }).join('\n')
}
