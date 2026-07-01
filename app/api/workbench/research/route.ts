import Anthropic from '@anthropic-ai/sdk'

import { createAdminSupabase } from '@/lib/supabase'
import {
  jsonUtf8,
  normalizeFlags,
  normalizeResearchSources,
  normalizeSnapshotSources,
  parseJson,
  WORKBENCH_MODEL,
  type WorkbenchChannel,
} from '@/lib/workbench'

type ResearchMode = 'essay' | 'snapshot'

class ResearchTimeoutError extends Error {
  constructor() {
    super('Web search research timed out.')
    this.name = 'ResearchTimeoutError'
  }
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new ResearchTimeoutError()), timeoutMs)
    promise.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (error) => {
        clearTimeout(timer)
        reject(error)
      }
    )
  })
}

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  if (error && typeof error === 'object') {
    const record = error as Record<string, unknown>
    if (typeof record.message === 'string') return record.message
    if (typeof record.error === 'string') return record.error
    try {
      return JSON.stringify(error)
    } catch {
      return '研究服務暫時未能回應。'
    }
  }
  return '研究服務暫時未能回應。'
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const thesis = String(body?.thesis ?? '').trim()
  const material = String(body?.material ?? '').trim()
  const channelId = String(body?.channel_id ?? '').trim()
  const targetMinutes = Number(body?.target_minutes ?? 8) || 8
  const requestedMode = String(body?.mode ?? body?.research_mode ?? '').trim()
  const requestedFramework = String(body?.framework ?? '').trim()

  if (!thesis || !channelId) {
    return jsonUtf8({ error: '請先選擇頻道並填寫論點。' }, { status: 400 })
  }

  const supabase = createAdminSupabase()
  if (!supabase) {
    return jsonUtf8({ error: 'Supabase 未設定。' }, { status: 500 })
  }

  const { data: channel, error } = await supabase
    .from('ew_channels')
    .select('id, name, positioning, value_shift, tone, rubric_config, default_framework')
    .eq('id', channelId)
    .single()

  if (error || !channel) {
    return jsonUtf8({ error: error?.message ?? '找不到頻道基因。' }, { status: 404 })
  }

  const mode = resolveResearchMode(requestedMode, requestedFramework, channel)

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
    const systemPrompt =
      mode === 'snapshot' ? buildSnapshotResearchSystemPrompt(targetMinutes) : buildResearchSystemPrompt(targetMinutes)
    const userPrompt = buildResearchUserPrompt(thesis, material, channel as WorkbenchChannel)
    const response = await withTimeout(
      anthropic.messages.create({
        model: WORKBENCH_MODEL,
        max_tokens: 5000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
        tools: [
          {
            type: 'web_search_20260318',
            name: 'web_search',
            max_uses: mode === 'snapshot' ? 4 : 6,
            response_inclusion: 'excluded',
          },
        ] as never,
      }),
      70_000
    )

    const raw = response.content
      .map((part) => ('text' in part ? part.text : ''))
      .join('')
      .trim()
    const parsed = parseJson(raw)
    if (!parsed) throw new Error('AI 沒有回傳可解析的 JSON。')

    return jsonUtf8({
      research_sources:
        mode === 'snapshot'
          ? normalizeSnapshotSources(parsed.research_sources)
          : normalizeResearchSources(parsed.research_sources),
      flags: normalizeFlags(parsed.flags),
      search_skipped: false,
    })
  } catch (err) {
    if (err instanceof ResearchTimeoutError) {
      if (mode === 'snapshot') {
        try {
          const systemPrompt = `${buildSnapshotResearchSystemPrompt(targetMinutes)}

網絡搜尋已超時。請改為產出「未核實 snapshot 草稿」，讓用家可以繼續測試流程。
規則：
- 所有 research_sources 必須標 verified:false。
- source_url 一律填 "[需查核：網絡搜尋超時]"。
- 不准創作精確數字、百分比、年份、金額、排名、倍數或城市比較；除非用家 material 已明確提供。
- value 如果無用家提供嘅數字,一律填 "[需查核]"。
- comparison 如果無用家提供嘅對比,一律填 "[需查核：不可自行換算]"。
- claim 必須用「可能 / 需要查核 / 初步看」等 hedging 語氣,不可寫成定論。
- 不要聲稱資料已由網絡查證。`
          const userPrompt = buildResearchUserPrompt(thesis, material, channel as WorkbenchChannel)
          const fallbackPrompt = await withTimeout(
            anthropic.messages.create({
              model: WORKBENCH_MODEL,
              max_tokens: 1800,
              system: systemPrompt,
              messages: [
                {
                  role: 'user',
                  content: `${userPrompt}\n\n請產出 4-6 條最適合測試 counterfactual snapshot framework 的未核實 snapshot candidates。`,
                },
              ],
            }),
            25_000
          )
          const raw = fallbackPrompt.content
            .map((part) => ('text' in part ? part.text : ''))
            .join('')
            .trim()
          const parsed = parseJson(raw)

          return jsonUtf8({
            research_sources: normalizeSnapshotSources(parsed?.research_sources),
            flags: parsed ? normalizeFlags(parsed.flags) : buildFallbackFlags(thesis, material, targetMinutes),
            search_skipped: true,
            warning: err.message,
          })
        } catch {
          return jsonUtf8({
            research_sources: [],
            flags: buildFallbackFlags(thesis, material, targetMinutes),
            search_skipped: true,
            warning: err.message,
          })
        }
      }

      try {
        const systemPrompt = `${buildResearchSystemPrompt(targetMinutes)}

網絡搜尋已超時。請改為產出「未核實研究草稿」，讓用家可以繼續測試流程。
規則：
- research_sources 要有 3-5 條。
- source_url 一律填 "[需查核：網絡搜尋超時]"。
- credibility 一律寫 "未核實；只根據輸入資料和模型理解"。
- 不准創作精確數字、百分比、年份、金額、排名、倍數或城市比較；除非用家 material 已明確提供。
- 如需要數字,改寫成定性描述或標 "[需查核]"。
- point 必須用「可能 / 需要查核 / 初步看」等 hedging 語氣。
- 不要聲稱資料已由網絡查證。`
        const userPrompt = buildResearchUserPrompt(thesis, material, channel as WorkbenchChannel)
        const fallbackPrompt = await withTimeout(
          anthropic.messages.create({
            model: WORKBENCH_MODEL,
            max_tokens: 1500,
            system: systemPrompt,
            messages: [
              {
                role: 'user',
                content: `${userPrompt}\n\n請產出 3-5 條可供 Here/Fern essay flow 測試的未核實研究草稿。`,
              },
            ],
          }),
          25_000
        )
        const raw = fallbackPrompt.content
          .map((part) => ('text' in part ? part.text : ''))
          .join('')
          .trim()
        const parsed = parseJson(raw)

        return jsonUtf8({
          research_sources: normalizeResearchSources(parsed?.research_sources),
          flags: parsed ? normalizeFlags(parsed.flags) : buildFallbackFlags(thesis, material, targetMinutes),
          search_skipped: true,
          warning: err.message,
        })
      } catch {
        return jsonUtf8({
          research_sources: [],
          flags: buildFallbackFlags(thesis, material, targetMinutes),
          search_skipped: true,
          warning: err.message,
        })
      }

    }

    try {
      const systemPrompt =
        mode === 'snapshot' ? buildSnapshotResearchSystemPrompt(targetMinutes) : buildResearchSystemPrompt(targetMinutes)
      const userPrompt = buildResearchUserPrompt(thesis, material, channel as WorkbenchChannel)
      const fallbackPrompt = await anthropic.messages.create({
        model: WORKBENCH_MODEL,
        max_tokens: 1200,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: `${userPrompt}\n\n注意：web search 暫時不可用，只根據用家 material 和一般常識做結構檢查；research_sources 可以留空。`,
          },
        ],
      })
      const raw = fallbackPrompt.content
        .map((part) => ('text' in part ? part.text : ''))
        .join('')
        .trim()
      const parsed = parseJson(raw)
      return jsonUtf8({
        research_sources:
          mode === 'snapshot'
            ? normalizeSnapshotSources(parsed?.research_sources)
            : normalizeResearchSources(parsed?.research_sources),
        flags: parsed ? normalizeFlags(parsed.flags) : buildFallbackFlags(thesis, material, targetMinutes),
        search_skipped: true,
        warning: errorMessage(err),
      })
    } catch (fallbackError) {
      return jsonUtf8({
        research_sources: [],
        flags: buildFallbackFlags(thesis, material, targetMinutes),
        search_skipped: true,
        warning: errorMessage(fallbackError) || errorMessage(err),
      })
    }
  }
}

function resolveResearchMode(
  requestedMode: string,
  requestedFramework: string,
  channel: unknown
): ResearchMode {
  if (requestedMode === 'snapshot') return 'snapshot'
  if (requestedMode === 'essay') return 'essay'
  if (requestedFramework === 'counterfactual_snapshot') return 'snapshot'

  const channelFramework =
    channel && typeof channel === 'object'
      ? String((channel as Record<string, unknown>).default_framework ?? '')
      : ''
  return channelFramework === 'counterfactual_snapshot' ? 'snapshot' : 'essay'
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

function buildSnapshotResearchSystemPrompt(targetMinutes: number) {
  return `你是 SOON 編輯工作台的 what-if snapshot 研究員。這個工具是放大器，不是替身。

用家已經有自己的反事實題目 / thesis。你不要代用家改題，不要裁決題目值不值得做。
你的任務是接受 thesis 作為前提，用 web search 查出可以支撐「今日版本快照」的結構化量化資料。

這個 mode 不是 essay research。不要輸出 point / supports。
每一項 research_sources 都必須係一個清楚的 snapshot 數值，適合直接餵給 script engine 使用。

每項必須包含：
- claim：一句完整數值陳述，例如「總人口約2.96億，世界第四」
- value：只放核心數值，例如「2.96億」
- dimension：人口 / 經濟 / 軍事 / 領土 / 能源 / 科技 / 文化 / 其他
- verified：true/false；由你按來源可信度明確判斷，不要留空
- comparison：為這個數值配一個通用優先的降維對比，方便觀眾理解。優先用星球 / 大洲 / 海洋 / 城市尺度等跨語言 referent；如使用國家或地區 referent，必須在文字中標明參照數值，例如「約等於8個台灣人口（台灣約2,340萬）」。不要自己留待 script engine 計算。
- source_url：來源網址

verified 規則：
- 官方統計、國際機構、可靠資料庫，通常可標 true。
- 推算、二手整理、模型估算、來源不一致，標 false，claim 仍可保留「約 / 估計」字眼。

comparison 規則：
- comparison 要跟 value 同場生成，不能空白。
- comparison 係給 script engine 直接照讀的配對對比，不是叫 engine 再計。
- 如果找不到穩妥 referent，用保守定性比較，但仍要寫明「需在地化替換」。

flag 規則同 essay mode 一樣，只可以在以下三種「結構性大窿」出 flag：
1. contradiction：用家 thesis 同 material 直接矛盾
2. no_source：核心反事實前提或核心數值完全找不到來源支撐
3. too_broad：thesis 闊到塞不入一條 ${targetMinutes} 分鐘的 snapshot 片

只輸出 JSON，不要 markdown，不要前言：
{"research_sources":[{"claim":"總人口約2.96億，世界第四","value":"2.96億","dimension":"人口","verified":true,"comparison":"約等於8個台灣人口（台灣約2,340萬）","source_url":"https://..."}],"flags":[{"type":"contradiction|no_source|too_broad","message":"..."}]}`
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
