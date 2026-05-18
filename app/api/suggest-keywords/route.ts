import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const client = new Anthropic()

function extractJsonArray(raw: string) {
  const start = raw.indexOf('[')
  const end = raw.lastIndexOf(']')
  if (start === -1 || end === -1) return null
  try {
    return JSON.parse(raw.slice(start, end + 1))
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  const { answers } = await req.json()

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    system: '你係 YouTube 內容策略專家，專門幫亞洲創作者搵爆款題材方向。',
    messages: [{
      role: 'user',
      content: `根據以下創作者資料，生成最適合佢搜尋 YouTube 爆款影片嘅關鍵字：

頻道題材：${answers?.topic || ''}
目標市場：${answers?.market || ''}
目標觀眾：${answers?.audience || ''}

請生成 8 個英文搜尋關鍵字（YouTube Search 用），每個關鍵字 3-6 個字，
要貼近佢嘅題材同市場，但又夠廣泛可以搵到爆款影片。

同時為每個關鍵字指定 category。

只輸出 JSON array：
[
  {"keyword": "...", "category": "...", "reason": "點解建議呢個（15字內繁中）"}
]`,
    }],
  })

  const text = response.content[0]?.type === 'text' ? response.content[0].text : '[]'
  const keywords = extractJsonArray(text)
  if (!keywords) return NextResponse.json({ error: 'parse error' }, { status: 500 })

  return NextResponse.json({ keywords })
}
