# SOON · YouTube 題材庫

AI 驅動 YouTube 題材發現工具，為 SOON 團隊及 creator 使用。

## 第一版 MVP 方向

- 三種輸入模式：**關鍵字** / **頻道 URL** / **影片 URL**
- 先用 Algrow 抓參考影片 signals
- 再用 Claude / deterministic fallback 生成 5 張 YouTube 題材卡
- 題材卡重點係 **research + angle planning**
- 唔會喺呢一步寫死 hook / ending，避免同 script system 撞位

## 每張題材卡包含

- 題材方向名
- 核心角度
- 點解值得做
- audience fit
- 爆款 pattern
- backing information 要補咩
- 可以延伸成咩系列
- 參考影片連結

## Setup

```bash
npm install
cp .env.local.example .env.local
# 填入環境變數
npm run dev
```

## 環境變數

| 變數 | 說明 |
|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `ANTHROPIC_API_KEY` | Claude API key |
| `ALGROW_API_KEY` | Algrow API key |
| `ALGROW_API_BASE_URL` | Algrow base URL，第一版未鎖 schema 前可留空 |

## Supabase

喺 Supabase SQL Editor 執行 [`supabase/youtube_ideas.sql`](/Users/tommytsang/Desktop/SOON/soon-youtube-idea/supabase/youtube_ideas.sql)。

## Notes

- 第一版如果未設好 Algrow 真 endpoint，會先 fallback 到 sample reference rows。
- Claude API 未設時，會 fallback 到 deterministic idea cards，方便先搭 UI / workflow。
