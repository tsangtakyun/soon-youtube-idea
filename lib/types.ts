// ─── Idea Card ───────────────────────────────────────────────────────────────

export type IdeaCard = {
    id?: string                   // Supabase UUID after save
    title: string                 // 題材方向名
    angle: string                 // 核心角度（一句話）
    hook: string                  // Hook 建議（開場 3 秒）
    why_viral: string             // 為何爆款分析
    structure: string[]           // 影片結構（3-5段）
    key_points: string[]          // 內容重點
    ref_videos: RefVideo[]        // 參考影片
    input_type: InputType         // 係咁嗰種輸入
    input_value: string           // 原始輸入值
    created_at?: string
}

export type RefVideo = {
    title: string
    url: string
    views: number
    channel: string
}

export type InputType = 'keyword' | 'channel' | 'video'

// ─── Analysis Request ────────────────────────────────────────────────────────

export type AnalyzeRequest = {
    inputType: InputType
    inputValue: string            // 關鍵字 / 頻道 URL / 影片 URL
}

export type AnalyzeResponse = {
    ideas: IdeaCard[]
    error?: string
}

// ─── Supabase row ────────────────────────────────────────────────────────────

export type IdeaRow = {
    id: string
    title: string
    angle: string
    hook: string
    why_viral: string
    structure: string[]
    key_points: string[]
    ref_videos: RefVideo[]
    input_type: InputType
    input_value: string
    created_at: string
}
