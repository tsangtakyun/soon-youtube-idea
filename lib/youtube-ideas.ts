import Anthropic from '@anthropic-ai/sdk'

export type YoutubeIdeaInputMode = 'keyword' | 'channel_url' | 'video_url'

export type YoutubeIdeaCard = {
  title: string
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
  return [
    {
      title: `${payload.query}｜A 類爆款案例`,
      channel: 'Sample Channel A',
      url: 'https://www.youtube.com/watch?v=sampleA',
      views: 182000,
      publishedAt: '2026-03-18',
    },
    {
      title: `${payload.query}｜B 類觀點切入`,
      channel: 'Sample Channel B',
      url: 'https://www.youtube.com/watch?v=sampleB',
      views: 93000,
      publishedAt: '2026-03-21',
    },
    {
      title: `${payload.query}｜C 類系列內容`,
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

  // First MVP falls back to deterministic sample rows until exact Algrow schema is locked.
  if (!apiKey || !baseUrl) {
    return buildMockAlgrowRows(payload)
  }

  try {
    const response = await fetch(`${baseUrl}/youtube/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    })

    if (!response.ok) {
      return buildMockAlgrowRows(payload)
    }

    const result = await response.json()
    const rows = Array.isArray(result?.videos) ? result.videos : []

    if (!rows.length) {
      return buildMockAlgrowRows(payload)
    }

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

function buildDeterministicIdeas(payload: YoutubeIdeaSearchPayload, rows: AlgrowVideo[]): YoutubeIdeaCard[] {
  const topic = payload.query.trim() || 'YouTube 題材'
  const refUrls = rows.map((row) => row.url).filter(Boolean)

  return [
    {
      title: `${topic}｜觀點型系列`,
      coreAngle: `唔係直接介紹 ${topic}，而係用「點解大部分人做錯」去切入。`,
      whyNow: 'YouTube 長片觀眾更願意停留喺有立場、有整理過資訊嘅內容。',
      audienceFit: '適合想吸引有搜尋意圖、願意睇 6-12 分鐘內容嘅觀眾。',
      breakoutPattern: '先講常見誤區，再拆真正關鍵，最後引去更深一層內容。',
      backingInfoNeeded: [
        `${topic} 最值得被記住嘅核心定位`,
        '目標觀眾最常犯嘅錯誤',
        '品牌 / 主持人有咩可信背景可以補上',
      ],
      seriesExtensions: ['延伸成 3 集系列', '拆成 shorts 切片', '加觀眾留言回應版'],
      references: refUrls.slice(0, 3),
    },
    {
      title: `${topic}｜案例拆解型`,
      coreAngle: `將 ${topic} 變成「真案例拆解」，由結果倒推成功原因。`,
      whyNow: '案例型長片更容易建立信任感，同時帶出可操作資訊。',
      audienceFit: '適合想提升 retention 同建立專業形象嘅 channel。',
      breakoutPattern: '先放結果，再拆三個關鍵，再講普通人可唔可以複製。',
      backingInfoNeeded: [
        '最近 1-3 個最有代表性案例',
        '案例入面真正有效嘅因素',
        '有邊啲資訊一定要避免講錯',
      ],
      seriesExtensions: ['系列化案例庫', '成功 / 失敗對比版', '實測 follow-up'],
      references: refUrls.slice(0, 3),
    },
    {
      title: `${topic}｜懶人清單型`,
      coreAngle: `用「你只要記住呢幾點就夠」方式整理 ${topic}。`,
      whyNow: '清單型內容對搜尋流量友善，而且易延伸成頻道固定內容模版。',
      audienceFit: '適合要做頻道內容穩定更新、想累積 evergreen traffic 嘅 creator。',
      breakoutPattern: '先定義情境，再列清單，再補充容易忽略嘅細節。',
      backingInfoNeeded: [
        '觀眾最想知道嘅 3-5 個重點',
        '每一點背後要補嘅數據或經驗',
        '最後要帶觀眾去下一條乜內容',
      ],
      seriesExtensions: ['月更 checklist 版', '不同 audience 版本', 'shorts 精華版'],
      references: refUrls.slice(0, 3),
    },
    {
      title: `${topic}｜反直覺切入`,
      coreAngle: `唔講最表面答案，而係講「其實最重要唔係你以為嗰樣」。`,
      whyNow: '反直覺標題同 opening 更易拉高 click-through 同 retention。',
      audienceFit: '適合想做更 sharp、更加像品牌觀點型頻道嘅 creator。',
      breakoutPattern: '先拋反直覺句，再用一個例子證明，最後建立自己方法論。',
      backingInfoNeeded: [
        '最常見但錯誤嘅行業認知',
        '你真正相信嘅方法論',
        '有乜證據 / 經驗支持呢個講法',
      ],
      seriesExtensions: ['同類迷思系列', '觀眾 Q&A 系列', '深度長片 + shorts 導流'],
      references: refUrls.slice(0, 3),
    },
    {
      title: `${topic}｜系列企劃型`,
      coreAngle: `唔只諗一條片，而係由第一條片開始鋪一個可追更系列。`,
      whyNow: 'YouTube 最值錢唔係單條爆，而係有能力拉出下一條觀看。',
      audienceFit: '適合想建立長期頻道主軸，而唔係單次爆款嘅團隊。',
      breakoutPattern: '第一條先打 attention，第二條補 background，第三條做實測/更新。',
      backingInfoNeeded: [
        '系列第一條要解決邊個核心問題',
        '第二、三條可以點樣延伸',
        '有乜內容庫可以支持持續拍落去',
      ],
      seriesExtensions: ['直接變 playlist', '直播延伸', '社群互動版'],
      references: refUrls.slice(0, 3),
    },
  ]
}

async function buildClaudeIdeas(payload: YoutubeIdeaSearchPayload, rows: AlgrowVideo[]) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return buildDeterministicIdeas(payload, rows)
  }

  const anthropic = new Anthropic({ apiKey })
  const prompt = [
    '你係 SOON YouTube 題材庫分析助手。',
    '任務：根據 YouTube 題材輸入同參考影片，輸出 5 張題材卡。',
    '重點：呢一步唔係完整 script generator，唔好幫人寫死 hook / ending。',
    '請集中做 research + angle planning：',
    '- title',
    '- coreAngle',
    '- whyNow',
    '- audienceFit',
    '- breakoutPattern',
    '- backingInfoNeeded (array of 3 strings)',
    '- seriesExtensions (array of 3 strings)',
    '- references (array of URLs)',
    '',
    `輸入模式：${payload.mode}`,
    `輸入內容：${payload.query}`,
    `語言：${payload.language}`,
    `市場：${payload.market}`,
    '',
    '參考影片：',
    ...rows.map((row, index) => `${index + 1}. ${row.title} | ${row.channel} | ${row.views ?? 0} views | ${row.url}`),
    '',
    '請只輸出 JSON array，長度 5。',
  ].join('\n')

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2200,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.content
      .map((part) => ('text' in part ? part.text : ''))
      .join('')
      .trim()

    const jsonStart = text.indexOf('[')
    const jsonEnd = text.lastIndexOf(']')
    if (jsonStart === -1 || jsonEnd === -1) {
      return buildDeterministicIdeas(payload, rows)
    }

    const parsed = JSON.parse(text.slice(jsonStart, jsonEnd + 1))
    if (!Array.isArray(parsed)) {
      return buildDeterministicIdeas(payload, rows)
    }

    return parsed as YoutubeIdeaCard[]
  } catch {
    return buildDeterministicIdeas(payload, rows)
  }
}

export async function generateYoutubeIdeas(payload: YoutubeIdeaSearchPayload) {
  const algrowRows = await fetchAlgrowRows(payload)
  const ideas = await buildClaudeIdeas(payload, algrowRows)

  return {
    sourceMode: payload.mode,
    sourceQuery: payload.query,
    algrowRows,
    ideas,
  }
}
