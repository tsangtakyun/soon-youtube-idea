import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'

import { createAdminSupabase } from '@/lib/supabase'
import {
  buildFernPromptLines,
  CANTONESE_WRITTEN_TONE,
  FERN_6_PARTS,
  FERN_GLOBAL_NARRATIVE_RULES,
  HERE_FILTER,
  inferTensionAxis,
  NARRATIVE_MODES,
  normalizeScriptParts,
  normalizeNarrativeMode,
  parseJson,
  TENSION_AXES,
  WORKBENCH_MODEL,
  type NarrativeMode,
  type ResearchSource,
  type TensionAxis,
  type WorkbenchChannel,
} from '@/lib/workbench'

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const thesis = String(body?.thesis ?? '').trim()
  const material = String(body?.material ?? '').trim()
  const channelId = String(body?.channel_id ?? '').trim()
  const hookVariant = String(body?.hook_variant ?? 'thesis').trim() || 'thesis'
  const narrativeMode = normalizeNarrativeMode(body?.narrative_mode)
  const targetMinutes = Number(body?.target_minutes ?? 8) || 8
  const researchSources = Array.isArray(body?.research_sources)
    ? (body.research_sources as ResearchSource[])
    : []

  if (!thesis || !channelId) {
    return NextResponse.json({ error: '請先選擇頻道並填寫論點。' }, { status: 400 })
  }

  const supabase = createAdminSupabase()
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase 未設定。' }, { status: 500 })
  }

  const { data: channel, error } = await supabase
    .from('ew_channels')
    .select('id, name, positioning, value_shift, tone, rubric_config, series:ew_series(name, domain)')
    .eq('id', channelId)
    .single()

  if (error || !channel) {
    return NextResponse.json({ error: error?.message ?? '找不到頻道基因。' }, { status: 404 })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'Anthropic 未設定。' }, { status: 500 })

  const anthropic = new Anthropic({ apiKey })
  const response = await anthropic.messages.create({
    model: WORKBENCH_MODEL,
    max_tokens: 6000,
    system: buildGenerateSystemPrompt({
      channel: channel as WorkbenchChannel,
      targetMinutes,
      thesis,
      material,
      narrativeMode,
    }),
    messages: [
      {
        role: 'user',
        content: buildGenerateUserPrompt({
          thesis,
          material,
          hookVariant,
          narrativeMode,
          targetMinutes,
          researchSources,
        }),
      },
    ],
  })

  const raw = response.content
    .map((part) => ('text' in part ? part.text : ''))
    .join('')
    .trim()
  const parsed = parseJson(raw)
  const title = String(parsed?.title ?? thesis).trim()
  const parts = normalizeScriptParts(parsed?.parts)

  if (parts.some((part) => !part.content)) {
    return NextResponse.json({ error: 'AI 沒有完整回傳 6 個段落。' }, { status: 502 })
  }

  return NextResponse.json({ title, parts })
}

function buildGenerateSystemPrompt(input: {
  channel: WorkbenchChannel
  targetMinutes: number
  thesis: string
  material: string
  narrativeMode: NarrativeMode
}) {
  const { channel, targetMinutes, thesis, material, narrativeMode } = input
  const rubric = channel.rubric_config?.criteria
    ?.map((item) => `- ${item.label}（${item.source}）：${item.standard}`)
    .join('\n') || '(未設定)'
  const seriesContext = channel.series?.map((item) => `${item.name}: ${item.domain}`).join('\n') || '(未設定)'
  const tensionAxis = inferTensionAxis([thesis, material, channel.positioning, channel.value_shift, seriesContext].join('\n'))

  return `你是 SOON 編輯工作台的劇本生成器。這個工具是放大器，不是替身。

你必須接受用家的 thesis 作為前提，不要質疑該不該做，不要提出替代論點。
你的工作是把 thesis、用家材料和 research_sources 組織成 Fern 6-Part 劇本。

語氣規則：
${CANTONESE_WRITTEN_TONE}

疊加這條頻道的聲音：
${channel.tone}

頻道定位：
${channel.positioning}

頻道想改變觀眾的想法：
${channel.value_shift}

寫作時要兌現的準則：
${rubric}

系列 / 題材 context：
${seriesContext}

Fern 敘事手法庫 v1 注入規則：
- 學結構同手法，不抄題材。
- 每 part 的 instruction 是 DNA move + 手法菜單；按 thesis / 題材選 1-2 個最合適手法，不要把菜單全部塞入稿。
- 這些手法只作執行層，必須疊加在 ew_channels 把尺之上。

敘事模式：
${NARRATIVE_MODES[narrativeMode]}

Tension 軸（已按 thesis / series domain 自動判斷）：
${TENSION_AXES[tensionAxis]}

全片總指令：
${FERN_GLOBAL_NARRATIVE_RULES}

Fern 6-Part Skeleton 必須完全跟以下 role 和順序：
${buildFernPromptLines(targetMinutes)}

Here filter / tone down melodrama：
${HERE_FILTER}

涉及未必確證的 claim，旁白要如實帶出來源和成立程度，例如「根據 X 報道」「這個說法暫時只見於社交媒體」。不要當成鐵一般事實，也不要靜靜混入自己的 voice。

只輸出 JSON，不要 markdown，不要前言。parts 必須剛好 ${FERN_6_PARTS.length} 個。`
}

function buildGenerateUserPrompt(input: {
  thesis: string
  material: string
  hookVariant: string
  narrativeMode: NarrativeMode
  targetMinutes: number
  researchSources: ResearchSource[]
}) {
  return `用家 thesis：
${input.thesis}

用家手上 material / 來源：
${input.material || '(用家未提供)'}

hook_variant：${input.hookVariant}
narrative_mode：${input.narrativeMode}
target_minutes：${input.targetMinutes}

research_sources：
${JSON.stringify(input.researchSources, null, 2)}

請生成劇本 JSON：
{
  "title": "...",
  "parts": [
    {"role":"hook","roleLabel":"鈎子","content":"..."},
    {"role":"setup","roleLabel":"論點 / 鋪陳","content":"..."},
    {"role":"detail","roleLabel":"細節","content":"..."},
    {"role":"complication","roleLabel":"複雜化","content":"..."},
    {"role":"depth","roleLabel":"根本原因","content":"..."},
    {"role":"resolution","roleLabel":"收束","content":"..."}
  ]
}`
}
