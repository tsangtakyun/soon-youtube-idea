import Anthropic from '@anthropic-ai/sdk'

const NL = '\n'

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
  return [
    { title: payload.query + ' | Viral Case A', channel: 'Sample Channel A', url: 'https://www.youtube.com/watch?v=sampleA', views: 182000, publishedAt: '2026-03-18' },
    { title: payload.query + ' | Analysis Angle B', channel: 'Sample Channel B', url: 'https://www.youtube.com/watch?v=sampleB', views: 93000, publishedAt: '2026-03-21' },
    { title: payload.query + ' | Series Content C', channel: 'Sample Channel C', url: 'https://www.youtube.com/watch?v=sampleC', views: 255000, publishedAt: '2026-03-27' },
  ]
}

async function fetchAlgrowRows(payload: YoutubeIdeaSearchPayload) {
  const apiKey = process.env.ALGROW_API_KEY
  const baseUrl = process.env.ALGROW_API_BASE_URL
  if (!apiKey || !baseUrl) return buildMockAlgrowRows(payload)
  try {
    const response = await fetch(baseUrl + '/youtube/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + apiKey },
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
  const topic = payload.query.trim() || '亞洲題材'
  const refUrls = rows.map((row) => row.url).filter(Boolean)
  return [
    {
      title: topic + '｜內部視角切入',
      category: 'culture',
      coreAngle: '唔好由外部視角解釋 ' + topic + '，而係拆解點解亞洲內部人士對呢件事有完全唔同嘅理解。',
      whyNow: '真正站喺亞洲內部視角講故事嘅繁體中文內容仍然稀缺，呢種切入會更有辨識度。',
      audienceFit: '適合對亞洲社會、文化與現實脈絡有興趣，想聽到更深入觀點嘅觀眾。',
      breakoutPattern: '先拋出一個會令人誤解嘅表面印象，再逐層拆解背後真正原因。',
      backingInfoNeeded: ['外界對 ' + topic + ' 最常見嘅誤解', '背後真正推動件事嘅文化或經濟原因', '一個可以令觀眾即刻代入嘅具體例子'],
      seriesExtensions: ['延伸成三集系列', '剪成 Shorts 版本', '觀眾問答 follow-up'],
      references: refUrls.slice(0, 3),
    },
    {
      title: topic + '｜富裕與基層對照',
      category: 'rich',
      coreAngle: '同一個 ' + topic + '，喺亞洲富裕階層同基層視角入面，其實會呈現完全唔同嘅現實。',
      whyNow: '亞洲階級差異愈來愈明顯，但真正講得有層次嘅中文內容仍然唔多。',
      audienceFit: '適合對財富落差、階級流動、社會對比有興趣嘅觀眾。',
      breakoutPattern: '先展示最誇張嘅對比，再指出背後成個制度點樣形成呢個落差。',
      backingInfoNeeded: ['一個富裕側嘅具體例子', '同一件事喺基層視角下嘅對照版本', '能顯示落差規模嘅數據或事實'],
      seriesExtensions: ['亞洲富裕觀察系列', '亞洲基層現實系列', '左右對照格式延伸'],
      references: refUrls.slice(0, 3),
    },
    {
      title: topic + '｜點解世界一直誤解',
      category: 'evergreen',
      coreAngle: '外部媒體對 ' + topic + ' 嘅理解往往偏差好大，真正發生緊嘅事其實唔係表面咁樣。',
      whyNow: '反主流敘事類內容好容易吸引想知道真相、唔滿足於表面新聞框架嘅觀眾。',
      audienceFit: '適合平時會睇國際新聞，但想知道更完整背景同脈絡嘅觀眾。',
      breakoutPattern: '先講主流說法，再逐點拆解點解呢個說法唔完整甚至錯誤。',
      backingInfoNeeded: ['外界最常見嘅錯誤理解', '真正影響局勢嘅內部因素', '能改變觀眾閱讀方式嘅歷史或文化背景'],
      seriesExtensions: ['誤解亞洲系列', '網絡迷思拆解系列', '專家訪談版延伸'],
      references: refUrls.slice(0, 3),
    },
    {
      title: topic + '｜東南亞隱藏版本',
      category: 'poor',
      coreAngle: '大家成日講中國、日本、韓國，但 ' + topic + ' 喺東南亞其實有另一個完全唔同版本。',
      whyNow: '東南亞需求一直存在，但真正被看見、被系統整理成內容方向嘅題材仍然偏少。',
      audienceFit: '適合對冷門亞洲故事、地區差異、真實生活樣貌有興趣嘅觀眾。',
      breakoutPattern: '先借用觀眾熟悉嘅東亞參照，再急轉去東南亞版本，拉出反差。',
      backingInfoNeeded: ['故事發生喺東南亞邊個城市或國家', '同東亞版本最大分別係乜', '一個可以令觀眾感受到現場感嘅細節'],
      seriesExtensions: ['東南亞專題系列', '逐國拆解版本', '實地拍攝視角延伸'],
      references: refUrls.slice(0, 3),
    },
    {
      title: topic + '｜最近一變，成件事唔同晒',
      category: 'breaking',
      coreAngle: '最近有一個同 ' + topic + ' 有關嘅新變化，正重新改寫亞洲嘅運作方式，但多數人仲未留意。',
      whyNow: '趁趨勢未飽和之前先切入，最容易食到話題紅利同演算法動能。',
      audienceFit: '適合平時追新聞、又想早一步睇懂趨勢變化嘅觀眾。',
      breakoutPattern: '一開始就講最近變咗乜，再解釋點解件事比表面睇落重要得多。',
      backingInfoNeeded: ['最近實際發生咗邊個變化', '點解唔只係新聞 headline 咁簡單', '下一步可能出現嘅影響同後續'],
      seriesExtensions: ['後續更新影片', '趨勢預測影片', '分國家影響拆解'],
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
    .map((row, i) => (i + 1) + '. ' + row.title + ' | ' + row.channel + ' | ' + (row.views ?? 0) + ' views | ' + row.url)
    .join(NL)
  const prompt = [
    'You are the AI assistant for SOON YouTube Idea Reader.',
    '',
    '你要為 SOON 生成 YouTube 題材卡。',
    '所有輸出必須使用全繁體中文。',
    '語氣可以自然，但不可以輸出英文標題、英文句子或簡體中文。',
    '',
    'SOON 定位：由香港出發，解釋亞洲社會、文化、階級與現實脈絡。',
    '- 不是旅遊頻道，而是文化與社會分析',
    '- 影片形式偏深度分析，要有清晰框架',
    '- 題材角度要有內部視角，不要只停留在表面描述',
    '',
    '請輸出 5 張題材卡。',
    '每張卡需要包含：title, category, coreAngle, whyNow, audienceFit, breakoutPattern, backingInfoNeeded（3 項 array）, seriesExtensions（3 項 array）, references（URL array）',
    'category 只能是：breaking, culture, rich, poor, evergreen',
    '除了 category key 之外，所有 value 都必須用全繁體中文。',
    '',
    '輸入主題：' + payload.query,
    '輸出語言：' + payload.language,
    '市場：' + payload.market,
    '',
    '參考影片：',
    refLines,
    '',
    '只輸出長度為 5 的 JSON array，不要輸出任何其他文字。',
  ].join(NL)
  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
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
