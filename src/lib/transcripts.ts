import { mockTranscripts } from './mockData'
import type { ChatTranscript } from './types'

const STORAGE_KEY = 'ljwm_transcripts'

// localStorage stand-in until the backend exists - once live this list comes
// from the /transcripts endpoint, and files live in S3 instead of object URLs.
function readStore(): ChatTranscript[] {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockTranscripts))
    return mockTranscripts
  }
  try {
    return JSON.parse(raw) as ChatTranscript[]
  } catch {
    return mockTranscripts
  }
}

function writeStore(transcripts: ChatTranscript[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transcripts))
}

export function listTranscripts(): ChatTranscript[] {
  return [...readStore()].sort((a, b) => b.receivedAt.localeCompare(a.receivedAt))
}

export function addTranscript(transcript: Omit<ChatTranscript, 'id'>): ChatTranscript {
  const withId: ChatTranscript = { ...transcript, id: crypto.randomUUID() }
  writeStore([...readStore(), withId])
  return withId
}
