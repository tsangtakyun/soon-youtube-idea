# Supabase Schema Documentation - soon-youtube-idea

呢個 folder 係 SOON 內部 Supabase schema 嘅 documentation。

## 文件分類

| File | Status | Confidence |
|---|---|---|
| `youtube_ideas.sql` | Verified, original SQL before audit | High |
| `viral_videos.sql` | Inferred from Audit 2026-05-05 | Medium |
| `outlines.sql` | Inferred from Audit 2026-05-05 | Medium |
| `topic_signals.sql` | Inferred from Audit 2026-05-05 | Medium |
| `scan_keywords.sql` | Inferred from Audit 2026-05-05 | Medium |
| `channels.sql` | Inferred from Audit 2026-05-05 | Medium |
| `channel_snapshots.sql` | Inferred from Audit 2026-05-05 | Medium |
| `channel_videos.sql` | Inferred from Audit 2026-05-05 | Medium |

## 重要警告

呢個 folder 入面 7 個 inferred SQL file（除咗 `youtube_ideas.sql`）係從 application code 推斷出嚟，未曾同 production Supabase 對齊。

### 點解咁

`youtube_ideas` 之外 7 個 table 喺 application code 用緊，但 repo 入面冇對應 migration file。Audit 透過 code grep 推斷 schema shape，commit 入 repo 做 documentation。

### 對 production 嘅實際影響

安全：所有 SQL 用 `CREATE TABLE IF NOT EXISTS`，run 落 production 唔會 overwrite existing table。

唔等於同步：呢啲 file 同 production schema 之間可能存在以下 drift：

- Production 有但 file 冇嘅 column
- Default value / nullable 設定唔同
- Index / constraint / RLS policy 唔同
- Type 細微差異，例如 `text` vs `varchar(255)`

### 如果你想真正同步

如果將來決定將 production schema normalize：

1. 跑 `information_schema.columns` query 攞 production ground truth
2. 對比每個 file
3. 開「Schema Reconciliation Spec」處理 drift
4. 慎重評估 RLS policy 同 data migration

唔好直接 run 呢個 folder 入面嘅 SQL 落 production，亦唔好假設佢哋等於現有 production schema。

## Audit reference

- Audit report: `docs/specs/2026-05-05_cross-repo_schema-audit_REPORT.md`
- Audit document: `docs/specs/SOON_Schema_Audit_2026-05-05.md`
