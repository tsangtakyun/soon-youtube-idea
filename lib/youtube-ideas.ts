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
  const topic = payload.query.trim() || 'Asia topic'
  const refUrls = rows.map((row) => row.url).filter(Boolean)
  return [
    {
      title: topic + ' | The Insider Angle',
      category: 'culture',
      coreAngle: 'Do not explain ' + topic + ' from the outside. Explain why insiders see it completely differently.',
      whyNow: 'English-speaking audiences are underserved with genuine Asian insider perspectives.',
      audienceFit: 'Curious global audience who wants to understand Asia beyond surface-level takes.',
      breakoutPattern: 'Open with a contradiction that surprises Western audiences, then unpack the real reason.',
      backingInfoNeeded: ['What most outsiders get wrong about ' + topic, 'The real cultural or economic driver behind it', 'A specific example that makes it tangible'],
      seriesExtensions: ['Extend into 3-part series', 'Shorts cut version', 'Viewer Q&A follow-up'],
      references: refUrls.slice(0, 3),
    },
    {
      title: topic + ' | Rich vs Poor',
      category: 'rich',
      coreAngle: 'How ' + topic + ' looks completely different depending on which side of Asia wealth divide you are on.',
      whyNow: 'The inequality story in Asia is massive but rarely told with nuance for global audiences.',
      audienceFit: 'Global audience fascinated by wealth, class, and social contrast.',
      breakoutPattern: 'Show the extreme, then reveal the system that created it.',
      backingInfoNeeded: ['A specific wealthy example that feels absurd or aspirational', 'The contrast from the poor side of the same story', 'Data or stat that shows the scale of the gap'],
      seriesExtensions: ['Rich Asia series', 'Poor Asia series', 'Side-by-side comparison format'],
      references: refUrls.slice(0, 3),
    },
    {
      title: topic + ' | Why the World Misunderstands This',
      category: 'evergreen',
      coreAngle: 'Western media gets ' + topic + ' fundamentally wrong. Here is what is actually happening.',
      whyNow: 'Counter-narrative content performs well with globally curious audiences who distrust mainstream takes.',
      audienceFit: 'Educated English-speaking audience who reads international news but wants deeper context.',
      breakoutPattern: 'State the mainstream narrative, then systematically dismantle it with specifics.',
      backingInfoNeeded: ['The most common Western misconception about this topic', 'What actually drives the situation from the inside', 'Historical or cultural context that changes the reading'],
      seriesExtensions: ['Misconceptions series', 'Reddit myths debunked', 'Expert interview version'],
      references: refUrls.slice(0, 3),
    },
    {
      title: topic + ' | Southeast Asia Hidden Version',
      category: 'poor',
      coreAngle: 'Everyone talks about China and Japan but ' + topic + ' in Southeast Asia tells a completely different story.',
      whyNow: 'Southeast Asia is massively underrepresented in English-language Asia content despite huge demand.',
      audienceFit: 'Audiences interested in lesser-known Asia stories, travelers, expats, curious global viewers.',
      breakoutPattern: 'Start with a familiar East Asia reference, pivot hard to the Southeast Asia contrast.',
      backingInfoNeeded: ['Specific country or city in Southeast Asia where this plays out', 'What makes this version different from the East Asia story', 'Human detail or anecdote that makes it real'],
      seriesExtensions: ['Southeast Asia series', 'Country-by-country format', 'On-the-ground filming angle'],
      references: refUrls.slice(0, 3),
    },
    {
      title: topic + ' | This Just Changed Everything',
      category: 'breaking',
      coreAngle: 'A recent shift in ' + topic + ' is reshaping how Asia works and no one in the West is paying attention yet.',
      whyNow: 'First-mover content on emerging Asia trends captures algorithm momentum before saturation.',
      audienceFit: 'News-aware audience who wants to get ahead of trends before they go mainstream.',
      breakoutPattern: 'Open with the thing that just changed, explain why it matters more than it looks.',
      backingInfoNeeded: ['The specific recent development or shift', 'Why this matters beyond what the headline says', 'What happens next, the implication most people are missing'],
      seriesExtensions: ['Update follow-up video', 'Prediction video', 'Impact-by-country breakdown'],
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
    'You are the AI assistant for SOON YouTube Idea Radar.',
    '',
    'SOON positioning: The Insider Asia',
    '- Based in Hong Kong, explaining Asia in English for global audiences',
    '- Not a travel channel, cultural and social analysis',
    '- Format: 12-20 minute deep analysis with strong framework',
    '',
    'Output 5 idea cards. Each card needs: title, category, coreAngle, whyNow, audienceFit, breakoutPattern, backingInfoNeeded (array of 3), seriesExtensions (array of 3), references (array of URLs)',
    'Category must be one of: breaking, culture, rich, poor, evergreen',
    '',
    'Input: ' + payload.query,
    'Market: ' + payload.market,
    '',
    'Reference videos:',
    refLines,
    '',
    'Output only a JSON array of length 5, no other text.',
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
