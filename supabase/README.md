# Supabase Schema Notes - soon-youtube-idea

This repo now keeps only schema documents that belong to the retained editorial workbench surface.

## Kept In Repo

| File | Purpose |
|---|---|
| `channel_dna.sql` | Module 1 Channel DNA tables: `ew_channels`, `ew_series`. |
| `youtube_ideas.sql` | Legacy saved idea table kept for the upcoming topic library work. |

## Legacy Tables Still Exist In Production

The legacy scan/trend UI and API code has been removed from this repo, but the production database tables were not dropped or altered.

Keep these tables in Supabase because other tools or historical data may still depend on them:

- `viral_videos`
- `outlines`
- `topic_signals`
- `scan_keywords`
- `channels`
- `channel_snapshots`
- `channel_videos`

The old inferred SQL documentation files for those tables were removed from the repo as part of the scan cleanup. This was a repository cleanup only; it did not run any destructive database operation.
