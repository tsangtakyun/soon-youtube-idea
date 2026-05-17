import Anthropic from '@anthropic-ai/sdk'

export type YoutubeIdeaInputMode = 'keyword' | 'channel_url' | 'video_url'

export type YoutubeIdeaCard = {
  title: string
  category: 'breaking' | 'culture' | 'rich' | 'poor' | 'evergreen'
  coreAngle: string
  whyNow: string
  audienceFit: string
  breakoutPattern: string
  backingInfoNeeded: string[]
  seriesExtensions: string[]
  references: string[]
}

export type YoutubeIdeaSearchPayload = {
  mode: YoutubeIdeaInputMode
  query: string
  language: string
  market: string
}

type AlgrowVideo = {
  title: string
  channel: string
  url: string
  views?: number
  publishedAt?: string
}

function buildMockAlgrowRows(payload: YoutubeIdeaSearchPayload): AlgrowVideo[] {
  const topic = payload.query.trim() || 'YouTube topic'
  return [
    {
      title: `${topic}｜爆款案例 A`,
      channel: 'Sample Channel A',
      url: 'https://www.youtube.com/watch?v=sampleA',
      views: 182000,
      publishedAt: '2026-03-18',
    },
    {
      title: `${topic}｜觀點拆解 B`,
      channel: 'Sample Channel B',
      url: 'https://www.youtube.com/watch?v=sampleB',
      views: 93000,
      publishedAt: '2026-03-21',
    },
    {
      title: `${topic}｜系列內容 C`,
      channel: 'Sample Channel C',
      url: 'https://www.youtube.com/watch?v=sampleC',
      views: 255000,
      publishedAt: '2026-03-27',
    },
  ]
}

async function fetchAlgrowRows(payload: YoutubeIdeaSearchPayload) {
  const apiKey = process.env.ALGROW_API_KEY
  const baseUrl = process.env.ALGROW_API_BASE_URL
  if (!apiKey || !baseUrl) return buildMockAlgrowRows(payload)

  try {
    const response = await fetch(`${baseUrl}/youtube/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(payload),
      cache: 'no-store',
    })

    if (!response.ok) return buildMockAlgrowRows(payload)
    const result = await response.json()
    const rows = Array.isArray(result?.videos) ? result.videos : []
    if (!rows.length) return buildMockAlgrowRows(payload)

    return rows.map((item: Record<string, unknown>) => ({
      title: String(item.title ?? ''),
      channel: String(item.channel ?? item.channelTitle ?? ''),
      url: String(item.url ?? item.videoUrl ?? ''),
      views: Number(item.views ?? 0),
      publishedAt: String(item.published_at ?? item.publishedAt ?? ''),
    }))
  } catch {
    return buildMockAlgrowRows(payload)
  }
}

function buildDeterministicIdeas(
  payload: YoutubeIdeaSearchPayload,
  rows: AlgrowVideo[]
): YoutubeIdeaCard[] {
  const topic = payload.query.trim() || 'YouTube 題材'
  const refUrls = rows.map((row) => row.url).filter(Boolean)

  return [
    {
      title: `${topic}：為何突然爆紅？`,
      category: 'culture',
      coreAngle: `用「現象拆解」角度講 ${topic}，由觀眾熟悉嘅表面現象切入，再拆背後文化、身份或生活方式。`,
      whyNow: '觀眾愈來愈想知道一件事點解會紅，而唔只係睇結果。拆解型影片有高收藏同分享潛力。',
      audienceFit: '適合鍾意文化觀察、消費趨勢、社交話題嘅觀眾。',
      breakoutPattern: '先丟出反常識觀察，再用 3 個證據逐步拆解，最後畀一個可延伸嘅結論。',
      backingInfoNeeded: ['近期高觀看影片例子', '相關留言區常見問題', '市場/地區背景資料'],
      seriesExtensions: ['同類題材排行榜', '不同地區對比', '觀眾投稿 follow-up'],
      references: refUrls.slice(0, 3),
    },
    {
      title: `${topic}：普通人真係用得着？`,
      category: 'evergreen',
      coreAngle: `將 ${topic} 由「熱門」轉成「普通人是否需要」嘅實用角度，降低門檻，拉近觀眾距離。`,
      whyNow: '實用驗證型內容容易留住觀眾，亦適合延伸成系列。',
      audienceFit: '適合想慳時間、想做決定、想知道值唔值得跟風嘅觀眾。',
      breakoutPattern: '開場提出疑問，正文用真實情境測試，結尾用一句 verdict 收束。',
      backingInfoNeeded: ['價格或成本', '使用場景', '同類替代品'],
      seriesExtensions: ['值唔值得系列', '新手入門系列', '反向測試系列'],
      references: refUrls.slice(0, 3),
    },
    {
      title: `${topic}：有錢人和平民玩法有咩不同？`,
      category: 'rich',
      coreAngle: `用階層反差呈現 ${topic}，比較高端做法和平民做法，製造討論同代入感。`,
      whyNow: '反差型內容容易引發留言，尤其適合消費、旅遊、生活方式、科技題材。',
      audienceFit: '適合愛睇比較、價值判斷、生活方式差異嘅觀眾。',
      breakoutPattern: '兩個世界並排比較，視覺上做對照，最後落一個不偏頗但有態度嘅觀點。',
      backingInfoNeeded: ['高端案例', '平價案例', '真實成本/時間/效果比較'],
      seriesExtensions: ['平替清單', '高配低配對比', '地區玩法對比'],
      references: refUrls.slice(0, 3),
    },
    {
      title: `${topic}：最多人誤解嘅一件事`,
      category: 'breaking',
      coreAngle: `由「大家以為」切入，拆解 ${topic} 入面最容易被誤讀或過度簡化嘅部分。`,
      whyNow: '糾正誤解類影片有天然 hook，容易令觀眾停低睇答案。',
      audienceFit: '適合已聽過呢個題材，但未真正理解背景嘅觀眾。',
      breakoutPattern: '開場講錯誤印象，中段拆原因，結尾提供更準確觀點。',
      backingInfoNeeded: ['常見錯誤說法', '可驗證資料來源', '對立案例'],
      seriesExtensions: ['誤解系列', '留言問題解答', '新手避坑'],
      references: refUrls.slice(0, 3),
    },
    {
      title: `${topic}：如果只用 100 蚊可以點玩？`,
      category: 'poor',
      coreAngle: `用低成本挑戰包裝 ${topic}，令題材更有任務感、節奏感同觀眾參與感。`,
      whyNow: '挑戰型內容易理解、易追看，亦方便拍成多集。',
      audienceFit: '適合學生、年輕觀眾、想慳錢但又想試新嘢嘅人。',
      breakoutPattern: '設定限制，逐步做選擇，最後公開成果同真實評價。',
      backingInfoNeeded: ['實際預算', '可行地點/工具/選項', '挑戰規則'],
      seriesExtensions: ['100 蚊系列', '一日挑戰', '平民玩法地圖'],
      references: refUrls.slice(0, 3),
    },
  ]
}

async function buildClaudeIdeas(
  payload: YoutubeIdeaSearchPayload,
  rows: AlgrowVideo[]
) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return buildDeterministicIdeas(payload, rows)

  const anthropic = new Anthropic({ apiKey })
  const refLines = rows
    .map((row, i) => `${i + 1}. ${row.title} | ${row.channel} | ${row.views ?? 0} views | ${row.url}`)
    .join('\n')

  const prompt = `你係 SOON 嘅 YouTube 題材策略師，專門為 Creator 尋找可以發展成系列嘅 YouTube 題材。

輸入模式：${payload.mode}
搜尋內容：${payload.query}
語言：${payload.language}
市場：${payload.market}

以下係參考信號：
${refLines}

請產生 5 個 YouTube 題材方向。每個方向都要包含：
- title：清晰、可拍成片嘅題材標題
- category：只可用 breaking / culture / rich / poor / evergreen
- coreAngle：核心切入角度
- whyNow：點解而家值得做
- audienceFit：適合咩觀眾
- breakoutPattern：爆款敘事/剪法模式
- backingInfoNeeded：需要補充或查證嘅資料，array
- seriesExtensions：可延伸系列，array
- references：參考影片 URL，array

只返回 JSON array，不要 markdown，不要額外文字。`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2500,
      messages: [{ role: 'user', content: prompt }],
    })
    const text = response.content.map((part) => ('text' in part ? part.text : '')).join('').trim()
    const jsonStart = text.indexOf('[')
    const jsonEnd = text.lastIndexOf(']')
    if (jsonStart === -1 || jsonEnd === -1) return buildDeterministicIdeas(payload, rows)

    const parsed = JSON.parse(text.slice(jsonStart, jsonEnd + 1))
    if (!Array.isArray(parsed)) return buildDeterministicIdeas(payload, rows)
    return parsed as YoutubeIdeaCard[]
  } catch {
    return buildDeterministicIdeas(payload, rows)
  }
}

export async function generateYoutubeIdeas(payload: YoutubeIdeaSearchPayload) {
  const algrowRows = await fetchAlgrowRows(payload)
  const ideas = await buildClaudeIdeas(payload, algrowRows)
  return { sourceMode: payload.mode, sourceQuery: payload.query, algrowRows, ideas }
}
