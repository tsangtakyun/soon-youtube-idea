import { NextResponse } from 'next/server'

import { createAdminSupabase } from '@/lib/supabase'
import { generateYoutubeIdeas, type YoutubeIdeaSearchPayload } from '@/lib/youtube-ideas'

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as YoutubeIdeaSearchPayload

    if (!payload.mode || !payload.query?.trim()) {
      return NextResponse.json({ error: '請先填輸入模式同搜尋內容。' }, { status: 400 })
    }

    const result = await generateYoutubeIdeas(payload)

    let savedIdeaId: string | null = null
    let saveStatus: 'saved' | 'skipped' | 'failed' = 'skipped'
    let saveError = ''

    const supabase = createAdminSupabase()
    if (supabase) {
      const { data, error } = await supabase
        .from('youtube_ideas')
        .insert({
          input_mode: payload.mode,
          input_query: payload.query.trim(),
          language: payload.language,
          market: payload.market,
          reference_data: result.algrowRows,
          ai_cards: result.ideas,
        })
        .select('id')
        .single()

      if (error) {
        saveStatus = 'failed'
        saveError = error.message
      } else {
        saveStatus = 'saved'
        savedIdeaId = data?.id ?? null
      }
    }

    return NextResponse.json({
      ...result,
      savedIdeaId,
      saveStatus,
      saveError,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '未能生成 YouTube 題材卡。' },
      { status: 500 }
    )
  }
}
