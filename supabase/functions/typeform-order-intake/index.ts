// Receives a Typeform "form_response" webhook (the intake form with the
// Calendly-style date/time picker, name, email, and notes) and creates a
// new order from it, phase defaulted to "Consultation Booked".
//
// NOT YET LIVE-TESTED: Typeform's exact answer shape for the booking/
// calendar question hasn't been confirmed against a real submission (no
// live form or Supabase project to test against yet). The field-matching
// below is written defensively (by answer `type` and question `title`,
// not by hardcoded field ref/id, so it survives the form being edited),
// but re-check the "consultation date" extraction against one real
// payload once the form + this function are both live, and adjust
// extractConsultationDate() if the shape differs.
//
// Setup: Typeform > form > Connect > Webhooks > add this function's URL,
// set a secret there, and set the same value as this function's
// TYPEFORM_WEBHOOK_SECRET. Typeform signs each request with it so this
// endpoint can reject anything that didn't actually come from Typeform.

import { createClient } from 'jsr:@supabase/supabase-js@2'

const WEBHOOK_SECRET = Deno.env.get('TYPEFORM_WEBHOOK_SECRET')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface TypeformField {
  id: string
  type: string
  title?: string
  ref?: string
}

interface TypeformAnswer {
  type: string
  field: TypeformField
  text?: string
  email?: string
  // Typeform's native scheduling question - exact key(s) unconfirmed, see
  // extractConsultationDate() below.
  date?: string
  [key: string]: unknown
}

interface TypeformWebhookBody {
  event_type: string
  form_response: {
    submitted_at: string
    answers: TypeformAnswer[]
  }
}

async function isValidSignature(req: Request, rawBody: string): Promise<boolean> {
  const signatureHeader = req.headers.get('Typeform-Signature')
  if (!signatureHeader || !WEBHOOK_SECRET) return false

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(WEBHOOK_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signatureBytes = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(rawBody))
  const expected = 'sha256=' + btoa(String.fromCharCode(...new Uint8Array(signatureBytes)))
  return signatureHeader === expected
}

function extractConsultationDate(answers: TypeformAnswer[]): string | null {
  // Try the shapes Typeform's scheduling/calendar question is documented or
  // likely to use. Whichever one actually matches, log it so it's obvious
  // in the function logs which branch fired for the first real submission.
  const candidate = answers.find((a) => ['calendar', 'meeting', 'date'].includes(a.type))
  if (!candidate) return null

  const raw =
    candidate.date ??
    (candidate.meeting as { start_time?: string } | undefined)?.start_time ??
    (candidate.calendar as { date?: string } | undefined)?.date ??
    null

  if (!raw) return null
  const parsed = new Date(raw as string)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString()
}

function extractNameAndNotes(answers: TypeformAnswer[]): { customerName: string; notes: string } {
  const textAnswers = answers.filter((a) => a.type === 'text' && typeof a.text === 'string')

  const nameAnswer = textAnswers.find((a) => /name/i.test(a.field.title ?? ''))
  const notesAnswer = textAnswers.find((a) => /note/i.test(a.field.title ?? ''))

  // Fall back: first text answer is the name, any other text answers are notes.
  const customerName = nameAnswer?.text ?? textAnswers[0]?.text ?? ''
  const remaining = textAnswers.filter((a) => a !== nameAnswer && a !== notesAnswer && a.text !== customerName)
  const notes = [notesAnswer?.text, ...remaining.map((a) => a.text)].filter(Boolean).join('\n\n')

  return { customerName, notes }
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const rawBody = await req.text()
  if (!(await isValidSignature(req, rawBody))) {
    return new Response('Invalid signature', { status: 401 })
  }

  let body: TypeformWebhookBody
  try {
    body = JSON.parse(rawBody)
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  if (body.event_type !== 'form_response') {
    return new Response('Ignored event type', { status: 200 })
  }

  const answers = body.form_response.answers ?? []
  const emailAnswer = answers.find((a) => a.type === 'email')
  const { customerName, notes } = extractNameAndNotes(answers)
  const consultationDate = extractConsultationDate(answers)

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)
  const { data, error } = await supabase
    .from('orders')
    .insert({
      customer_name: customerName,
      customer_email: emailAnswer?.email ?? '',
      notes,
      consultation_date: consultationDate,
      phase: 'Consultation Booked',
    })
    .select('id, order_number')
    .single()

  if (error) {
    return new Response(`Insert failed: ${error.message}`, { status: 500 })
  }

  return new Response(JSON.stringify(data), { status: 201, headers: { 'Content-Type': 'application/json' } })
})
