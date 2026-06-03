import Anthropic from '@anthropic-ai/sdk'

import { jsonUtf8, parseJson, WORKBENCH_MODEL } from '@/lib/workbench'

type ClaimRow = {
  paragraph: number
  claim: string
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const script = String(body?.script ?? '').trim()

  if (!script) {
    return jsonUtf8({ error: 'Missing script.' }, { status: 400 })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return jsonUtf8({ error: 'Anthropic 未設定。' }, { status: 500 })

  const anthropic = new Anthropic({ apiKey })
  const response = await anthropic.messages.create({
    model: WORKBENCH_MODEL,
    max_tokens: 2500,
    system: [
      '你是 fact-check 前置整理助手。',
      '你的唯一任務：只抽取並列出文中的具體事實陳述。',
      '具體事實包括人名、日期、年份、數字、金額、地點、引述、機構名、公司名、職銜、可查證事件。',
      '不要評論真偽、不要查證、不要補充資料、不要修改原文、不要推測。',
      '如一句入面有多個可獨立查證事實，拆成多條。',
      '只輸出 JSON，不要 markdown，不要前言。',
    ].join('\n'),
    messages: [
      {
        role: 'user',
        content: `請抽取以下稿件中的 specific factual claims。

輸出格式：
{
  "claims": [
    { "paragraph": 1, "claim": "原文中的具體事實陳述" }
  ]
}

paragraph 代表第幾段稿。段落以標題或「## 段落名」分段估算即可。
不要判斷對錯，不要查證，不要補充資料。

稿件：
${script}`,
      },
    ],
  })

  const raw = response.content
    .map((part) => ('text' in part ? part.text : ''))
    .join('')
    .trim()
  const parsed = parseJson(raw)
  const claims = Array.isArray(parsed?.claims)
    ? parsed.claims
        .map((item): ClaimRow | null => {
          const row = item as Record<string, unknown>
          const claim = String(row.claim ?? '').trim()
          if (!claim) return null
          return {
            paragraph: Number.isFinite(Number(row.paragraph)) ? Number(row.paragraph) : 0,
            claim,
          }
        })
        .filter((item): item is ClaimRow => Boolean(item))
    : []

  return jsonUtf8({ claims })
}
