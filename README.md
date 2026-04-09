# SOON · YouTube 題材庫

AI 驅動 YouTube 題材發現工具，為 BBO 製作團隊及 Creator 使用。

## 功能

- 三種輸入模式：**關鍵字** / **頻道 URL** / **影片 URL**
- Algrow API 抓取爆款影片數據
- Claude AI 生成 5 張題材卡
- Supabase 儲存題材，跨 session 保留
- SOON 設計語言（米白底，EB Garamond）

## 每張題材卡包含

- 題材方向名
- 核心角度
- 開場 Hook（3秒）
- 為何爆款分析
- 影片結構建議
- 內容重點
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
| `ALGROW_API_KEY` | Algrow API key（從 algrow.online/api/docs 取得）|

## Supabase

喺 Supabase SQL Editor 執行 `supabase/youtube_ideas.sql` 建立 table。

## Tech Stack

- Next.js 15 · TypeScript
- Algrow REST API（YouTube 數據）
- Anthropic Claude API（題材生成）
- Supabase（儲存）
- 部署：Vercel
