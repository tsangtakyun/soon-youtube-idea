import { createAdminSupabase } from '@/lib/supabase'
import { jsonUtf8 } from '@/lib/workbench'

type ScriptPartPayload = {
  role?: unknown
  roleLabel?: unknown
  content?: unknown
}

const TOM_USER_ID = 'bb3e47cc-90c8-4eac-a5ff-cabfcefb89ae'
const TOM_WORKSPACE_ID = 'a5c7750e-1b3b-495b-8cd3-6e1d47d05ef2'
const YOUTUBE_SCRIPT_FOLDER_NAME = 'youtube script'

const segmentTypeByRole: Record<string, string> = {
  hook: 'hook',
  setup: 'background',
  detail: 'real_test',
  complication: 'turning_point',
  depth: 'reflection',
  resolution: 'ending',
}

function cleanText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function makeId(prefix: string, index: number) {
  return `${prefix}-${index + 1}-${Date.now().toString(36)}`
}

function normaliseParts(raw: unknown) {
  const rows = Array.isArray(raw) ? (raw as ScriptPartPayload[]) : []

  return rows
    .map((row, index) => {
      const role = cleanText(row.role) || `part-${index + 1}`
      const roleLabel = cleanText(row.roleLabel) || role
      const content = cleanText(row.content)
      return {
        role,
        roleLabel,
        content,
      }
    })
    .filter((part) => part.content)
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const title = cleanText(body?.title) || cleanText(body?.thesis) || 'YouTube Script'
  const thesis = cleanText(body?.thesis)
  const material = cleanText(body?.material)
  const parts = normaliseParts(body?.parts)

  if (!parts.length) {
    return jsonUtf8({ error: 'No script content to export.' }, { status: 400 })
  }

  const supabase = createAdminSupabase()
  if (!supabase) {
    return jsonUtf8({ error: 'Supabase is not configured.' }, { status: 500 })
  }

  const { data: workspace, error: workspaceError } = await supabase
    .from('workspaces')
    .select('id')
    .eq('id', TOM_WORKSPACE_ID)
    .maybeSingle()

  if (workspaceError) return jsonUtf8({ error: workspaceError.message }, { status: 500 })
  if (!workspace) return jsonUtf8({ error: 'Target workspace not found.' }, { status: 404 })

  const { data: existingFolder, error: folderLookupError } = await supabase
    .from('doc_folders')
    .select('id, name')
    .eq('workspace_id', TOM_WORKSPACE_ID)
    .ilike('name', YOUTUBE_SCRIPT_FOLDER_NAME)
    .maybeSingle()

  if (folderLookupError) return jsonUtf8({ error: folderLookupError.message }, { status: 500 })

  let folderId = existingFolder?.id ?? null
  if (!folderId) {
    const { data: folder, error: folderInsertError } = await supabase
      .from('doc_folders')
      .insert({
        name: YOUTUBE_SCRIPT_FOLDER_NAME,
        workspace_id: TOM_WORKSPACE_ID,
      })
      .select('id')
      .single()

    if (folderInsertError) return jsonUtf8({ error: folderInsertError.message }, { status: 500 })
    folderId = folder.id
  }

  const now = new Date().toISOString()
  const content = {
    language: 'zh',
    title,
    releaseDate: '',
    creator: '',
    guest: '',
    location: '',
    series: '',
    format: 'Fern 6-part YouTube script',
    coverImage: '',
    scriptTitle: title,
    segments: parts.map((part, index) => ({
      id: makeId('segment', index),
      type: segmentTypeByRole[part.role] ?? 'other',
      title: part.roleLabel,
      blocks: [
        {
          id: makeId('block', index),
          type: 'voiceover',
          speaker: '',
          content: part.content,
        },
      ],
    })),
    createdAt: now,
    updatedAt: now,
    source: {
      thesis,
      material,
    },
  }

  const { data: doc, error: insertError } = await supabase
    .from('docs')
    .insert({
      workspace_id: TOM_WORKSPACE_ID,
      folder_id: folderId,
      title,
      template_type: 'youtube_script',
      content: JSON.stringify(content),
      user_id: TOM_USER_ID,
    })
    .select('id, title, workspace_id, folder_id, template_type')
    .single()

  if (insertError) return jsonUtf8({ error: insertError.message }, { status: 500 })

  return jsonUtf8({
    doc,
    openUrl: `https://soon-core.vercel.app/docs?open=${encodeURIComponent(doc.id)}`,
  })
}
