import { createClient } from '@supabase/supabase-js'

export function createAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) return null

  return createClient(url, key)
}

export type SavedYoutubeIdeaRow = {
  id: string
  input_mode: string
  input_query: string
  language: string
  market: string
  reference_data: Array<Record<string, unknown>>
  ai_cards: Array<Record<string, unknown>>
  created_at: string
}

export async function listSavedYoutubeIdeas(limit = 24) {
  const supabase = createAdminSupabase()
  if (!supabase) {
    return { rows: [] as SavedYoutubeIdeaRow[], error: 'Supabase 未設定。' }
  }

  const { data, error } = await supabase
    .from('youtube_ideas')
    .select('id, input_mode, input_query, language, market, reference_data, ai_cards, created_at')
    .order('created_at', { ascending: false })
    .limit(limit)

  return {
    rows: (data ?? []) as SavedYoutubeIdeaRow[],
    error: error?.message ?? '',
  }
}

export async function getSavedYoutubeIdeaById(id: string) {
  const supabase = createAdminSupabase()
  if (!supabase) {
    return { row: null as SavedYoutubeIdeaRow | null, error: 'Supabase 未設定。' }
  }

  const { data, error } = await supabase
    .from('youtube_ideas')
    .select('id, input_mode, input_query, language, market, reference_data, ai_cards, created_at')
    .eq('id', id)
    .single()

  return {
    row: (data as SavedYoutubeIdeaRow | null) ?? null,
    error: error?.message ?? '',
  }
}
