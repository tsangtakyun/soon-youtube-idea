import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'

import { extractJsonObject, normaliseCriteria } from '@/lib/channel-dna'

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const positioning = String(body?.positioning ?? '').trim()
  const valueShift = String(body?.value_shift ?? '').trim()
  const tone = String(body?.tone ?? '').trim()
  const domains = Array.isArray(body?.domains)
    ? body.domains.map((domain: unknown) => String(domain).trim()).filter(Boolean)
    : []

  if (!positioning || !valueShift || !tone || domains.length === 0) {
    return NextResponse.json(
      { error: '請先填完整頻道基因同至少一個系列題材。' },
      { status: 400 }
    )
  }

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system:
        '你係 SOON 編輯工作台嘅評分準則生成器。你嘅工作係讀用家嘅頻道基因，生成一套專屬呢條頻道嘅評分準則。\n五條題目固定，但每條嘅「實際標準」必須由用家提供嘅資料即場生成。\n絕對唔可以套用任何預設品味——唔可以假設用家想做 video essay、深度內容或者任何特定風格。\n美妝開箱同遊戲頻道應該生成完全唔同嘅標準。\n全部用繁體中文書面語。',
      messages: [
        {
          role: 'user',
          content: `頻道基因：
定位句：${positioning}
觀點/價值（觀眾睇完改變咗咩諗法）：${valueShift}
語氣：${tone}
題材（各系列）：${domains.join('、')}

請生成評分準則。五條固定 criterion，每條輸出「實際標準」——即係評呢條頻道嘅題目時，呢條 criterion 具體問緊咩，必須貼住上面嘅頻道基因。每條 30 字內。

criterion 同對應來源：
1. counterintuitive 顛覆性 ← 觀點/價值（有冇兌現到呢條頻道想觀眾改變嘅諗法）
2. depth 深度 ← 定位句（撐唔撐到呢條頻道定位嘅深度）
3. whitespace 題材空隙 ← 題材（喺呢個題材度有冇人做過）
4. anchor 落地點 ← 定位句（有冇具體可執行嘅落地點）
5. tone_fit 語氣配合 ← 語氣（個拆法配唔配呢把聲）

只輸出 JSON，唔好任何前言或 markdown：
{"criteria":[{"key":"counterintuitive","label":"顛覆性","source":"觀點/價值","standard":"...","weight":1.0},{"key":"depth","label":"深度","source":"定位句","standard":"...","weight":1.0},{"key":"whitespace","label":"題材空隙","source":"題材","standard":"...","weight":1.0},{"key":"anchor","label":"落地點","source":"定位句","standard":"...","weight":1.0},{"key":"tone_fit","label":"語氣配合","source":"語氣","standard":"...","weight":1.0}]}`,
        },
      ],
    })

    const raw = response.content
      .map((part) => ('text' in part ? part.text : ''))
      .join('')
      .trim()
    const parsed = extractJsonObject(raw)
    const criteria = normaliseCriteria(parsed?.criteria)

    if (criteria.some((criterion) => !criterion.standard)) {
      return NextResponse.json({ error: 'AI 回傳格式不完整。' }, { status: 502 })
    }

    return NextResponse.json({ criteria })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '未能生成評分準則。' },
      { status: 500 }
    )
  }
}
