# Spec: Outgoing Script Hand-off to script-generator-youtube v2

> Date: 2026-05-05
> Author: Strategist (Claude)
> Reviewer: Tommy
> Target system: soon-youtube-idea
> Repo URL: https://github.com/tsangtakyun/soon-youtube-idea
> Execution mode: Dry Run
> Reference contract: 2026-05-05_cross-repo-contract_v1.1.md
> Supersedes: 2026-05-05_youtube-idea_outgoing-script-handoff.md (v1)

---

## 1. Why（框架理據）

### 1.1 v1 → v2 嘅原因

V1 spec 建喺以下錯誤 assumption：
- Outline 有 `topic / background / sections / linkedVideoIds` top-level fields
- `viral_videos` 有 `aiAngle / aiViralityReason / aiTopicSignal` 三個 separate field
- `outlines` 有 array of `linkedVideoIds`

Schema Audit + Outline Mini-Audit 揭發實際情況同 assumption 完全唔同。V2 重寫 spec 建喺真實 schema 上面。

### 1.2 V2 嘅 design 變化

| 維度 | V1 | V2 |
|---|---|---|
| Reference selection | 從 outline `linkedVideoIds` 揀多個 | 直接用 `outline.video_id` 單一 reference |
| Background source | 假設 outline 有 `background` field | 從 `outline.content.coreAngle` 衍生 |
| URL params | `referenceIds[]` array | `videoId` single + 預留 `additionalReferenceIds` |
| Type assumption | 自定義 `Outline` interface | Map 到實際 `OutlineRow` schema |
| Schema migration | V1 假設可能要 migrate | V2 唔做 migration（已通過 documentation 處理）|

### 1.3 設計原則

#### Principle 1：Trust the audit
所有 schema assumption 來自 Schema Audit 同 Mini-Audit 嘅 ground truth，唔再憑感覺寫。

#### Principle 2：Outline content 整體 send，唔做 mapping
URL `background` field 用 outline `coreAngle` 嘅短文。完整 7-part planning context 由 downstream 透過 `outlineId` fetch + 自己 parse。Outgoing 唔做 framework mapping 嘅工作。

#### Principle 3：Single reference 為主，預留 multi
`videoId` 係 v1.1 嘅 primary reference。`additionalReferenceIds` 係 future expansion 嘅 placeholder，v2 暫時唔主動 send。

#### Principle 4：UI 改動最小
而家 outline editor 已 stable。V2 只加一個 button，唔重新 design 任何 UI。

---

## 2. What（具體改動範圍）

### 2.1 影響嘅 file

| File path | 改動類型 | 描述 |
|---|---|---|
| `lib/script-handoff.ts` | Created | URL builder + outline content extraction |
| `app/outline/[id]/page.tsx` | Modified | 加「生成劇本」button + handler |
| `.env.local.example` | Modified | 確保有 `NEXT_PUBLIC_SCRIPT_GENERATOR_URL` |
| `docs/specs/INDEX.md` | Update | 加新 spec row |

### 2.2 影響嘅 schema

無 Supabase schema 改動。純讀。

### 2.3 影響嘅 API endpoint

無新 internal API endpoint。純 client-side URL builder。

---

## 3. How（實作細節）

### 3.1 新 file: `lib/script-handoff.ts`

```typescript
/**
 * Cross-repo hand-off to script-generator-youtube。
 * 必須同 SOON Cross-Repo Contract v1.1 對齊。
 */

const SCRIPT_GENERATOR_URL =
  process.env.NEXT_PUBLIC_SCRIPT_GENERATOR_URL ||
  'https://script-generator-xi-pi.vercel.app'

const MAX_BACKGROUND_CHARS = 1000
const MAX_ADDITIONAL_REFS = 19  // 加 primary 共 20

/**
 * URL query params shape，必須同 Contract v1.1 Section 3 對齊。
 */
export interface OutgoingHandoffParams {
  topic: string
  background: string
  sourceIdeaId?: string
  outlineId?: string
  videoId?: string                    // outline.video_id
  language?: string
  framework?: 'fern_6part' | 'custom'
  hookVariant?: 'mystery' | 'thesis' | 'trojan_horse'
  additionalReferenceIds?: string[]
}

/**
 * Outline row shape，同 audit 確認嘅實際 schema 對齊。
 */
export interface OutlineRowForHandoff {
  id: string
  video_id?: string
  title_zh?: string | null
  content?: string | null   // JSON string
  status?: string
  created_at?: string
}

/**
 * Outline content JSON shape（從 mini-audit 確認）。
 */
export interface OutlineContentShape {
  pageTitle?: string
  suggestedTitles?: string[]
  caption?: string
  coreAngle?: string
  sections?: Array<{ key: string; content: string }>
}

/**
 * 從 outline row 提取 handoff 所需嘅 topic / background。
 *
 * 設計原則：
 * - topic：優先用 outline.title_zh，其次用 content.pageTitle
 * - background：用 content.coreAngle（thesis），唔用 raw content
 * - 解析失敗 graceful：用 fallback 而唔係 throw
 */
export function extractHandoffFromOutline(
  outline: OutlineRowForHandoff
): { topic: string; background: string; coreAngleAvailable: boolean } {
  let parsedContent: OutlineContentShape | null = null

  if (outline.content) {
    try {
      parsedContent = JSON.parse(outline.content) as OutlineContentShape
    } catch {
      parsedContent = null
    }
  }

  const topic =
    outline.title_zh?.trim() ||
    parsedContent?.pageTitle?.trim() ||
    '(untitled)'

  const coreAngle = parsedContent?.coreAngle?.trim() || ''
  const caption = parsedContent?.caption?.trim() || ''

  // Background priority: coreAngle > caption > raw content > empty
  const background =
    coreAngle ||
    caption ||
    (outline.content && !parsedContent ? outline.content : '') ||
    ''

  return {
    topic,
    background,
    coreAngleAvailable: !!coreAngle,
  }
}

/**
 * Build cross-repo hand-off URL。
 *
 * 設計原則：
 * - URL 限制：~2000 chars（瀏覽器 safe limit）
 * - background 過長 truncate
 * - 所有 string param URL-encode（URLSearchParams 自動處理）
 */
export function buildScriptHandoffUrl(params: OutgoingHandoffParams): string {
  const url = new URL(SCRIPT_GENERATOR_URL)

  url.searchParams.set('topic', params.topic)
  url.searchParams.set('background', truncateBackground(params.background))

  if (params.sourceIdeaId) {
    url.searchParams.set('sourceIdeaId', params.sourceIdeaId)
  }
  if (params.outlineId) {
    url.searchParams.set('outlineId', params.outlineId)
  }
  if (params.videoId) {
    url.searchParams.set('videoId', params.videoId)
  }
  if (params.language) {
    url.searchParams.set('language', params.language)
  }
  if (params.framework) {
    url.searchParams.set('framework', params.framework)
  }
  if (params.hookVariant) {
    url.searchParams.set('hookVariant', params.hookVariant)
  }
  if (params.additionalReferenceIds && params.additionalReferenceIds.length > 0) {
    const truncated = params.additionalReferenceIds.slice(0, MAX_ADDITIONAL_REFS)
    url.searchParams.set('additionalReferenceIds', truncated.join(','))
  }

  return url.toString()
}

function truncateBackground(background: string): string {
  if (!background) return ''
  if (background.length <= MAX_BACKGROUND_CHARS) {
    return background
  }
  return background.slice(0, MAX_BACKGROUND_CHARS) + '...[truncated]'
}

/**
 * 一站式 hand-off URL builder。
 * 合併 outline 提取 + URL build。
 */
export function buildHandoffUrlFromOutline(
  outline: OutlineRowForHandoff,
  options?: {
    sourceIdeaId?: string
    framework?: 'fern_6part' | 'custom'
    hookVariant?: 'mystery' | 'thesis' | 'trojan_horse'
    language?: string
  }
): string {
  const { topic, background } = extractHandoffFromOutline(outline)

  return buildScriptHandoffUrl({
    topic,
    background,
    outlineId: outline.id,
    videoId: outline.video_id,
    sourceIdeaId: options?.sourceIdeaId,
    framework: options?.framework ?? 'fern_6part',
    hookVariant: options?.hookVariant ?? 'mystery',
    language: options?.language ?? 'Cantonese',
  })
}
```

### 3.2 修改 `app/outline/[id]/page.tsx`

加「生成劇本」button：

```typescript
import { buildHandoffUrlFromOutline } from '@/lib/script-handoff'

// 喺 component 入面加 handler
function handleGenerateScript() {
  if (!outline) return

  const url = buildHandoffUrlFromOutline({
    id: outline.id,
    video_id: outline.video_id,
    title_zh: outline.title_zh,
    content: outline.content,
    status: outline.status,
    created_at: outline.created_at,
  })

  window.open(url, '_blank')
}

// UI（具體位置由 Codex 根據現有 UI structure 決定，建議放喺 outline 標題附近）：
<button
  type="button"
  onClick={handleGenerateScript}
  disabled={!outline}
  style={css.primaryButton}  // 沿用現有 style
>
  生成劇本（傳到 Script Generator）
</button>
```

### 3.3 環境變數

`.env.local.example` 加（如未存在）：

```bash
# Cross-repo handoff target (Contract v1.1)
NEXT_PUBLIC_SCRIPT_GENERATOR_URL=https://script-generator-xi-pi.vercel.app
```

#### Codex 必須 verify

Codex 執行時必須先 check `.env.local.example` 同實際 codebase 入面係咪已經有 `NEXT_PUBLIC_SCRIPT_GENERATOR_URL`：
- 如已有，唔重複加
- 如冇，加上去
- 如有但 default value 唔同，喺 report 入面 surface

---

## 4. Test Cases（驗證準則）

### 4.1 URL Builder Test
- [ ] `buildScriptHandoffUrl` 用 minimal params（只 topic + background）produce valid URL
- [ ] 用 full params produce URL，所有 query 都 URL-encoded 正確
- [ ] `additionalReferenceIds` 超過 19 條會 truncate 到 19
- [ ] `background` 超過 1000 char 會 truncate + 加 `...[truncated]`
- [ ] Empty `additionalReferenceIds` array 唔會出現喺 URL

### 4.2 Outline Extraction Test
- [ ] `extractHandoffFromOutline` valid JSON content → topic = title_zh, background = coreAngle
- [ ] Content JSON 失敗 parse → topic = title_zh, background = raw content
- [ ] No title_zh → topic from content.pageTitle
- [ ] No title_zh + no pageTitle → topic = '(untitled)'
- [ ] No coreAngle → background = caption
- [ ] No coreAngle + no caption → background = raw content（如 parse 失敗）
- [ ] `coreAngleAvailable` 標記正確

### 4.3 Combined Build Test
- [ ] `buildHandoffUrlFromOutline` 出嘅 URL 包含 outlineId + videoId（如有）
- [ ] Default `framework='fern_6part'`、`hookVariant='mystery'`、`language='Cantonese'`

### 4.4 UI Test
- [ ] Outline detail page 出現「生成劇本」button
- [ ] Outline 未 load 時 button disabled
- [ ] 撳 button 開新 tab
- [ ] URL 包含正確 outlineId + videoId

### 4.5 Build Test
- [ ] `npm run build` pass（如 node_modules 安裝得到）

### 4.6 Backward Compat Test
- [ ] 現有 outline editor 其他 functionality 無 break

---

## 5. Out of Scope

- ❌ 唔做 hookVariant UI 揀選（Phase 2 加）
- ❌ 唔做 framework UI 揀選（hardcode `'fern_6part'`）
- ❌ 唔做 `additionalReferenceIds` 揀選 UI（v1.1 contract 預留 future）
- ❌ 唔做 outline content shape migration
- ❌ 唔做 `ai_analysis` schema migration（Contract v1.1 已決定保持現狀）
- ❌ 唔做 cross-repo error tracking
- ❌ 唔改 outline editor 主體 UI

---

## 6. Reporting Requirement

完成 Dry Run 之後，請生成 `2026-05-05_youtube-idea_outgoing-script-handoff_v2_REPORT.md`。

### 特別要求

#### Section A
- 預期改動 line count
- 列出每個 export function 嘅 signature

#### Section B
- 任何 spec 假設嘅 file path / type / structure 同實際 codebase 唔對齊嘅地方
- 特別：`outline` row 喺 `app/outline/[id]/page.tsx` 入面嘅實際 type 同 spec 提供嘅 `OutlineRowForHandoff` 對齊度

#### Section C
- C.1：`extractHandoffFromOutline` 嘅 fallback chain 對 production data 預期準確率
- C.2：URL truncation 喺 SOON 真實 outline 嘅實際發生率估計
- C.3：`additionalReferenceIds` 預留係咪 over-engineering（如後續 spec 唔會用到，可移除）

#### Section D
- 確認無新 NPM dependency
- 確認 `NEXT_PUBLIC_SCRIPT_GENERATOR_URL` env 處理啱

#### Section E
- E.1：Build verification（如 node_modules 安裝得到）
- E.2：URL builder 用 mock outline（不 dump real content）做 unit-style verification
- E.4：Manual verification 步驟
  - 點 trigger handoff
  - 點 verify URL 內容
  - 點 confirm `script-generator-youtube` 收到（雖然下游 v2 spec 仲未做）

#### Section F
- F.1：下一份 spec 必然係 Incoming Spec v2
- F.2：UI 上需要再加 hook variant 揀選嘅 spec（之後）
- F.3：其他 codebase observation

#### Section G
SOON Core IP boundary：
- 呢份 spec 唔涉及 SOON Core IP
- URL builder 嘅邏輯純 transport，唔包含創作 know-how

#### 額外輸出

由於 Dry Run，請 output：
1. `lib/script-handoff.ts` 完整 code
2. `app/outline/[id]/page.tsx` 嘅 patch（diff format）
3. `.env.local.example` 嘅 patch（如有）

---

**Outgoing Spec v2 完**
