// Receives a tawk.to transcript from the Google Apps Script + Gemini
// automation and stores it. Auth is a shared API key (not a user JWT),
// since the caller is a script, not a logged-in admin user.
//
// POST body: { customerName, customerEmail, receivedAt, fileName, summary, fileBase64 }
// Header: X-API-Key: <TRANSCRIPTS_INGEST_KEY>

import { createClient } from 'jsr:@supabase/supabase-js@2'

const INGEST_KEY = Deno.env.get('TRANSCRIPTS_INGEST_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface IngestBody {
  customerName?: string
  customerEmail?: string
  receivedAt?: string
  fileName: string
  summary?: string
  fileBase64: string
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  if (!INGEST_KEY || req.headers.get('X-API-Key') !== INGEST_KEY) {
    return new Response('Unauthorized', { status: 401 })
  }

  let body: IngestBody
  try {
    body = await req.json()
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  if (!body.fileName || !body.fileBase64) {
    return new Response('fileName and fileBase64 are required', { status: 400 })
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

  const transcriptId = crypto.randomUUID()
  const storagePath = `transcripts/${transcriptId}/${body.fileName}`
  const fileBytes = Uint8Array.from(atob(body.fileBase64), (c) => c.charCodeAt(0))

  const { error: uploadError } = await supabase.storage.from('files').upload(storagePath, fileBytes)
  if (uploadError) {
    return new Response(`Upload failed: ${uploadError.message}`, { status: 500 })
  }

  const { error: insertError } = await supabase.from('chat_transcripts').insert({
    id: transcriptId,
    customer_name: body.customerName ?? '',
    customer_email: body.customerEmail ?? '',
    received_at: body.receivedAt ?? new Date().toISOString(),
    file_name: body.fileName,
    storage_path: storagePath,
    summary: body.summary ?? '',
    source: 'tawk.to',
  })
  if (insertError) {
    return new Response(`Insert failed: ${insertError.message}`, { status: 500 })
  }

  return new Response(JSON.stringify({ id: transcriptId }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  })
})
