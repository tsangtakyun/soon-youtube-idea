import Anthropic from '@anthropic-ai/sdk'

import { createAdminSupabase } from '@/lib/supabase'
import {
  jsonUtf8,
  normalizeFlags,
  normalizeResearchSources,
  parseJson,
  WORKBENCH_MODEL,
  type WorkbenchChannel,
} from '@/lib/workbench'

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const thesis = String(body?.thesis ?? '').trim()
  const material = String(body?.material ?? '').trim()
  const channelId = String(body?.channel_id ?? '').trim()
  const targetMinutes = Number(body?.target_minutes ?? 8) || 8

  if (!thesis || !channelId) {
    return jsonUtf8({ error: '請先選擇頻道並填寫論點。' }, { status: 400 })
  }

  const supabase = createAdminSupabase()
  if (!supabase) {
    return jsonUtf8({ error: 'Supabase 未設定。' }, { status: 500 })
  }

  const { data: channel, error } = await supabase
    .from('ew_channels')
    .select('id, name, positioning, value_shift, tone, rubric_config')
    .eq('id', channelId)
    .single()

  if (error || !channel) {
    return jsonUtf8({ error: error?.message ?? '找不到頻道基因。' }, { status: 404 })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return jsonUtf8({
      research_sources: [],
      flags: buildFallbackFlags(thesis, material, targetMinutes),
      search_skipped: true,
    })
  }

  const anthropic = new Anthropic({ apiKey })
  try {
    const response = await anthropic.messages.create({
      model: WORKBENCH_MODEL,
      max_tokens: 2200,
      system: buildResearchSystemPrompt(targetMinutes),
      messages: [{ role: 'user', content: buildResearchUserPrompt(thesis, material, channel as WorkbenchChannel) }],
      tools: [
        {
          type: 'web_search_20250305',
          name: 'web_search',
          max_uses: 8,
        },
      ] as never,
    })

    const raw = response.content
      .map((part) => ('text' in part ? part.text : ''))
      .join('')
      .trim()
    const parsed = parseJson(raw)
    if (!parsed) throw new Error('AI 沒有回傳可解析的 JSON。')

    return jsonUtf8({
      research_sources: normalizeResearchSources(parsed.research_sources),
      flags: normalizeFlags(parsed.flags),
      search_skipped: false,
    })
  } catch (err) {
    const fallbackPrompt = await anthropic.messages.create({
      model: WORKBENCH_MODEL,
      max_tokens: 1200,
      system: buildResearchSystemPrompt(targetMinutes),
      messages: [
        {
          role: 'user',
          content: `${buildResearchUserPrompt(thesis, material, channel as WorkbenchChannel)}\n\n注意：web search 暫時不可用，只根據用家 material 和一般常識做結構檢查；research_sources 可以留空。`,
        },
      ],
    })
    const raw = fallbackPrompt.content
      .map((part) => ('text' in part ? part.text : ''))
      .join('')
      .trim()
    const parsed = parseJson(raw)
    return jsonUtf8({
      research_sources: normalizeResearchSources(parsed?.research_sources),
      flags: parsed ? normalizeFlags(parsed.flags) : buildFallbackFlags(thesis, material, targetMinutes),
      search_skipped: true,
      warning: err instanceof Error ? err.message : 'web search 暫時不可用。',
    })
  }
}

function buildResearchSystemPrompt(targetMinutes: number) {
  return `你是 SOON 編輯工作台的研究員。這個工具是放大器，不是替身。

用家已經有自己的論點。你不要代用家想論點，不要裁決論點是否值得做。
你的任務是接受 thesis 作為前提，以用家 material 做主幹，用 web search 查闊、查深、整理背景、數據、成因、反方說法、來源核實。
每一項你補充的資料都必須有 source_url 和一句 credibility，例如「有官方數據」「多家媒體報道」「僅社交媒體流傳」。
如果 claim 成立程度有限，要如實標明；不要把未確證內容寫成鐵一般事實。

你只可以在以下三種「結構性大窿」出 flag，其餘一律不要出聲、不要評論個題好唔好、不要提自己的替代角度：

1. contradiction：用家 thesis 同佢貼的 material 直接矛盾（例如因果倒轉）
2. no_source：thesis 的核心因果，連 web search 都找不到任何來源支持（提用家：這個關鍵 claim 找不到資料支撐，你是否有手上來源 / 想點處理）——這不是裁決真假，只是如實告知
3. too_broad：thesis 闊到塞不入一條 ${targetMinutes} 分鐘的 6-part 片，撐不起

這三種以外，不准出任何 flag。這些是「不提就條片會塌」的結構問題，不是「我有更好想法」的品味問題。出 flag 的 message 要一句講完，不要長篇。

只輸出 JSON，不要 markdown，不要前言：
{"research_sources":[{"point":"...","source_url":"...","credibility":"多家媒體報道","supports":"for|against|context"}],"flags":[{"type":"contradiction|no_source|too_broad","message":"..."}]}`
}

function buildResearchUserPrompt(thesis: string, material: string, channel: WorkbenchChannel) {
  const criteria = channel.rubric_config?.criteria
    ?.map((item) => `- ${item.label}: ${item.standard}`)
    .join('\n') || '(未設定)'

  return `頻道基因：
頻道：${channel.name}
定位句：${channel.positioning}
觀點 / 價值：${channel.value_shift}
語氣：${channel.tone}
準則：
${criteria}

用家 thesis：
${thesis}

用家手上 material / 來源：
${material || '(用家未提供，請自行查找公開來源補充)'}

請根據 thesis 做研究和輕量結構檢查。不要替用家改 thesis。`
}

function buildFallbackFlags(thesis: string, material: string, targetMinutes: number) {
  if (thesis.length > targetMinutes * 80) {
    return [{ type: 'too_broad' as const, message: `這個論點可能太闊，${targetMinutes} 分鐘內難以完整支撐。` }]
  }
  if (!material.trim()) return []
  return []
}
