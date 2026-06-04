import { extractJsonObject } from '@/lib/channel-dna'

export const WORKBENCH_MODEL = 'claude-sonnet-4-20250514'

export function jsonUtf8(payload: unknown, init?: ResponseInit) {
  const headers = new Headers(init?.headers)
  headers.set('content-type', 'application/json; charset=utf-8')
  return new Response(JSON.stringify(payload), { ...init, headers })
}

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
    instruction: '具體定格 + 懸念。不要先交代背景，直接把觀眾拋入一個未知、反差或危機前一刻。',
    techniques: [
      '具體場景定格：時間、地點、人物位置精確，直接進入危機前一刻。',
      '視覺體積或數字對比，再留一個「為甚麼」懸念。',
      '流行迷因或大眾刻板印象定格，再揭出它背後有一件事被隱藏。',
      '連續 2-3 個 why / who / how 詰問，逼觀眾追答案。',
    ],
  },
  {
    role: 'setup',
    roleLabel: '論點 / 鋪陳',
    durationRatio: 0.13,
    instruction: '冷靜引入，延遲評論。先擺事實、人物或反差，將宏大論點微縮成具體張力。',
    techniques: [
      '反差假象先行：先描繪正常、和平、理所當然，再用事件打破。',
      '引入一個權威、一對人物張力，或一個制度角色。',
      '用經濟、地理或制度公式，把表象導向深層論點。',
      '必要時用輕微自嘲降低說教感，但不要搶走題目。',
    ],
  },
  {
    role: 'detail',
    roleLabel: '細節',
    durationRatio: 0.2,
    instruction: '抽象即刻具體化。不要堆理論，把複雜東西變成空間、數字、動作或日常場景。',
    techniques: [
      '空間重構：把混亂現場簡化成相對位置。',
      '跨地域等比類比：用觀眾熟悉的城市、人口或面積作對照。',
      '生活化物理比喻：把硬概念翻成身體、物件、速度或重量。',
      '數據體感化：拋大數後立刻給對照組。',
      '第二人稱場景代入：用「你的一日」承載硬核概念。',
      '時間線縱剖：回到歷史起點順著講。',
    ],
  },
  {
    role: 'complication',
    roleLabel: '複雜化',
    durationRatio: 0.2,
    instruction: '用更高維度或人性翻盤。在「好像已經解釋完」的一刻，打破簡單敘事。',
    techniques: [
      '道德或人性維度介入，讓系統問題長出人的代價。',
      '真實原音或第一人稱材料暴露盲點。',
      '引入歷史鏡像人物或案例，將個案升維。',
      '外部制度力量介入，打破溫馨、自然或市場自動調節敘事。',
      '用負面矛盾數據打破完美敘事。',
      '符號學翻轉：同一張相、同一個物件，前後意義改變。',
    ],
  },
  {
    role: 'depth',
    roleLabel: '根本原因',
    durationRatio: 0.2,
    instruction: '由個案 zoom-out 綁更大系統。由具體事件拉高到制度、當代、地緣或歷史宿命。',
    techniques: [
      '時間線拉長，把歷史後果接到今日生活。',
      '一連串 why 追到更大的制度或政治結構。',
      '地理或歷史宿命論：空間結構如何限制選擇。',
      '把經濟議題升維到國安、供應鏈或生死存亡。',
      '把文化印象連到集體創傷、宣傳或歷史形象。',
      '可用過渡句：「這個不只是 X，而是一個關於 Y 的故事。」',
    ],
  },
  {
    role: 'resolution',
    roleLabel: '收束',
    durationRatio: 0.15,
    instruction: '拒絕定論 + 冰冷餘韻 + 未解問題。不要強行 happy ending，把評判權交回觀眾。',
    techniques: [
      '揭一個更大的未爆陰影。',
      '排比式假說收尾：三個「也許」並列。',
      '首尾呼應，用開頭的畫面或句式扣回來。',
      '觀念翻轉加輕微自我解嘲。',
      '啟發式反思：很多地方做得到，只是選擇不這樣做。',
    ],
  },
] as const

export const FERN_GLOBAL_NARRATIVE_RULES = [
  '大細切換呼吸：把大做小，例如人物、物件、一張相；把小放大到制度、歷史或當代命運。',
  '情緒抽離：剝走誇張形容詞，讓精確時間、空間、數據自己講戲。越勁爆的題材越要冷靜。',
  '短句定死關鍵時刻：長句鋪墊後突然用短句落槌；轉折前留白；段尾可用反問逼觀眾思考。',
].join('\n')

export const HERE_FILTER = [
  '學 Fern 的敘事呼吸：結構、具體化、節奏；不要抄 Fern 題材或 melodrama。',
  '隔走災難片式煽情：不要數字恐嚇、死線倒數、生存率恐嚇。',
  '避免誇張形容詞，例如「巨大能量」「窒息感」這類空泛戲劇化語言。',
  '保留大細切換、具體化、短句反問、揭秘軸，以及冷靜微諷刺。',
  '所有手法必須疊加在 ew_channels 的定位、語氣和 rubric 之上，不能取代頻道把尺。',
].join('\n')

export type NarrativeMode = 'detached_narration' | 'first_person_quest'
export type TensionAxis = 'war_framing' | 'revelation' | 'death_crossing'

export const NARRATIVE_MODES: Record<NarrativeMode, string> = {
  detached_narration:
    '抽離旁白：旁白冷靜，作者隱形。這是 Here 預設；適合大部分制度、城市、文化、商業和科普題。',
  first_person_quest:
    '第一人稱 quest：作者成為解謎者，用求證過程的挫折、危險或外景推動。只有真出鏡、真調查或真外景時才使用。',
}

export const TENSION_AXES: Record<TensionAxis, string> = {
  war_framing:
    'War framing：適合商業、制度、地緣、供應鏈題。把「演變」包裝成「衝突」，例如巨頭 vs 法規、精緻飲食 vs 垃圾食物。',
  revelation:
    '揭秘軸：適合迷思、文化、城市、語言、日常現象。用「秘密 / dirty secret / 印象 vs 真相」推進。',
  death_crossing:
    '死亡交叉：適合事件型題材。兩條線和秒數倒數交匯，但 Here filter 會 tone down 災難片煽情。',
}

export type FernRole = (typeof FERN_6_PARTS)[number]['role']

export type WorkbenchChannel = {
  id: string
  name: string
  positioning: string
  value_shift: string
  tone: string
  series?: Array<{ name: string; domain: string }>
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
        point: cleanResearchText(row.point),
        source_url: String(row.source_url ?? '').trim(),
        credibility: cleanResearchText(row.credibility),
        supports: supports === 'for' || supports === 'against' ? supports : 'context',
      } satisfies ResearchSource
    })
    .filter((item) => item.point && item.source_url && item.credibility)
}

function cleanResearchText(value: unknown) {
  return String(value ?? '')
    .replace(/<\/?cite\b[^>]*>/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
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
    return [
      `${index + 1}. ${part.role} / ${part.roleLabel} / durationRatio ${part.durationRatio}`,
      `DNA move：${part.instruction}`,
      `手法菜單：${part.techniques.join(' / ')}`,
      `建議 ${minWords}-${maxWords} 字。請按 thesis / 題材只揀 1-2 個手法，不要全塞。`,
    ].join('\n')
  }).join('\n\n')
}

export function normalizeNarrativeMode(raw: unknown): NarrativeMode {
  return raw === 'first_person_quest' ? 'first_person_quest' : 'detached_narration'
}

export function inferTensionAxis(input: string): TensionAxis {
  const text = input.toLowerCase()
  const eventKeywords = ['刺殺', '爆炸', '死亡', '事故', '災難', '戰爭', '襲擊', '謀殺', '墜機', '槍擊']
  if (eventKeywords.some((keyword) => text.includes(keyword))) return 'death_crossing'

  const warKeywords = [
    '商業',
    '品牌',
    '公司',
    '供應鏈',
    '地緣',
    '稀土',
    '產業',
    '制度',
    '法規',
    '平台',
    '巨頭',
    '國安',
    '軍事',
  ]
  if (warKeywords.some((keyword) => text.includes(keyword))) return 'war_framing'

  return 'revelation'
}
