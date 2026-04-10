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
  return [
    {
      title: `${payload.query} | Viral Case A`,
      channel: 'Sample Channel A',
      url: 'https://www.youtube.com/watch?v=sampleA',
      views: 182000,
      publishedAt: '2026-03-18',
    },
    {
      title: `${payload.query} | Analysis Angle B`,
      channel: 'Sample Channel B',
      url: 'https://www.youtube.com/watch?v=sampleB',
      views: 93000,
      publishedAt: '2026-03-21',
    },
    {
      title: `${payload.query} | Series Content C`,
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
