# IMPLEMENTATION_REPORT.md

> Date: 2026-05-05
> Executor: Codex
> Spec reference: 2026-05-05_youtube-idea_outgoing-script-handoff_v2.md
> Mode: Full Execution
> Status: Completed

## A. 已完成的改動

已將 Outgoing Script Hand-off v2 落實到 `soon-youtube-idea` codebase。今次只做 outgoing transport layer，無改 Supabase schema，無改 API endpoint。

| File path | Action | Lines / size | Notes |
|---|---|---:|---|
| `lib/script-handoff.ts` | Created | 133 lines / 3,563 bytes | URL builder、outline extraction、handoff helper。 |
| `app/outline/[id]/page.tsx` | Modified | 353 total lines / 18,861 bytes | + import、`handleGenerateScript`、button beside generate-all. |
| `docs/specs/INDEX.md` | Modified | 19 lines / 822 bytes | Added outgoing v2 row. |
| `docs/specs/2026-05-05_youtube-idea_outgoing-script-handoff_v2.md` | Created | 356 lines / 12,371 bytes | Committed reviewed spec. |
| `docs/specs/2026-05-05_youtube-idea_outgoing-script-handoff_v2_REPORT.md` | Created | generated | This report. |

Git commit hash：commit 完成後以 git history / final response 為準，因 report 本身會被包含在同一個 commit 內。

## B. 偏離 Spec

無 logic 偏離。

`.env.local.example` 已經包含：

```bash
NEXT_PUBLIC_SCRIPT_GENERATOR_URL=https://script-generator-xi-pi.vercel.app
```

所以按 spec no-op，沒有 stage `.env.local.example`。注意：該 file 在 worktree 內本來已有 unrelated dirty state，Codex 沒有將它加入今次 commit。

`app/outline/[id]/page.tsx` 的實際 `Outline.video_id` type 是 `string | null`，implementation 已用 `video_id?: string | null` 接住。

## C. 模糊處 / 假設

### C.1 Fallback chain 準確率

預期準確率高。新 outline content 正常會有 `coreAngle`，所以 `background = coreAngle` 應該係主要 path。Fallback chain：

1. topic: `title_zh`
2. topic fallback: `content.pageTitle`
3. topic final fallback: `(untitled)`
4. background: `content.coreAngle`
5. background fallback: `content.caption`
6. parse fail fallback: raw `content`

### C.2 URL truncation 發生率

低。V2 只把 `coreAngle` 放入 `background`，唔會傳完整 7-part outline。1000 chars limit 應該足夠。只有 parse fail 並 fallback raw content 時較可能觸發 truncation。

### C.3 `additionalReferenceIds` 是否 over-engineering

目前 UI 不主動 send additional references。保留此 field 係為 Contract v1.1 future expansion，成本低，但如果後續 2-3 個 cycle 都無使用，可以喺 v1.2 移除以簡化 contract。

## D. Dependency / Env

無新 NPM dependency。

`NEXT_PUBLIC_SCRIPT_GENERATOR_URL` 已存在，無需改動。未 stage `.env.local.example`。

## E. Test 結果

### E.1 Build verification

Not runnable。`soon-youtube-idea` 目前無 `node_modules` 同 `package-lock.json`，所以未能跑 `npm run build`。

### E.2 URL builder smoke test

PASS。用 mock outline data 驗證：

```json
{
  "extracted": {
    "topic": "Topic",
    "background": "Core angle",
    "coreAngleAvailable": true
  },
  "outlineId": "outline-1",
  "videoId": "video-1",
  "framework": "fern_6part",
  "hookVariant": "mystery",
  "additionalCount": 19
}
```

確認：

- `topic` 由 `title_zh` 提取。
- `background` 由 `coreAngle` 提取。
- URL 包含 `outlineId` + `videoId`。
- default `framework=fern_6part`、`hookVariant=mystery`、`language=Cantonese`。
- `additionalReferenceIds` 截到 19 個。

### E.3 Manual verification

Tommy 可以咁驗證：

1. 開 `soon-youtube-idea` outline detail page。
2. 等 outline load 完。
3. 喺 action row 撳「生成劇本（傳到 Script Generator）」。
4. 確認新 tab URL 指向 `https://script-generator-xi-pi.vercel.app`。
5. 確認 query params 有 `topic`, `background`, `outlineId`, `videoId`, `framework=fern_6part`, `hookVariant=mystery`, `language=Cantonese`。
6. 目前 downstream Incoming v2 未 Full Execution，所以 script generator 未必會 hydrate `outlineId/videoId`；只需先確認 URL transport 正確。

## F. 後續建議

### F.1 下一份 spec

下一份確認應該係 Incoming v2 Full Execution：`script-generator-youtube` 需要 parse `outlineId/videoId`，fetch Supabase，inject Planning Context + Reference Videos。

### F.2 Codebase observation

`app/outline/[id]/page.tsx` 目前 buttons 主要共用 `.btn-save` / `.btn-gen-all` class，今次沿用現有 button style 以保持 UI minimal。之後如果 action row 變多，值得抽 button variants 或加入 clearer visual hierarchy。

## G. SOON Core IP 提示

呢份 spec 不涉及 SOON Core IP。URL builder 只係 transport logic，不包含創作 know-how、prompt library、hook variant examples、pivot phrasing library。

請將呢份 report paste 返畀 strategist 做 review。
