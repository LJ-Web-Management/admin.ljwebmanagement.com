import { useEffect, useState } from 'react'
import { useAuth } from '../../lib/auth/AuthContext'
import { api } from '../../lib/apiClient'
import { usePageTitle } from '../../lib/usePageTitle'
import type { Message, MessageThread } from '../../lib/types'

export function MessagingPage() {
  usePageTitle('Messaging')
  const { user } = useAuth()
  const [threads, setThreads] = useState<MessageThread[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [draft, setDraft] = useState('')

  useEffect(() => {
    api.listThreads().then((data) => {
      setThreads(data)
      setActiveId(data[0]?.id ?? null)
    })
  }, [])

  useEffect(() => {
    if (!activeId) return
    api.listMessages(activeId).then(setMessages)
  }, [activeId])

  const send = () => {
    if (!draft.trim() || !activeId || !user) return
    // TODO: publish over the WebSocket API once the backend is live.
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), threadId: activeId, senderEmail: user.email, body: draft, sentAt: new Date().toISOString() },
    ])
    setDraft('')
  }

  const threadLabel = (t: MessageThread) => t.name ?? t.participantEmails.filter((e) => e !== user?.email).join(', ')

  return (
    <div className="flex h-[calc(100svh-8rem)] gap-4">
      <div className="w-64 shrink-0 border border-neutral-200 rounded overflow-y-auto">
        <div className="p-3 border-b border-neutral-200 flex gap-2">
          <button className="flex-1 text-xs rounded bg-navy hover:bg-navy-dark text-white transition-colors py-1.5">
            New DM
          </button>
          <button className="flex-1 text-xs rounded border border-neutral-300 py-1.5">New group</button>
        </div>
        {threads.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveId(t.id)}
            className={`w-full text-left px-3 py-2 text-sm border-b border-neutral-100 ${
              activeId === t.id ? 'bg-cyan/10' : ''
            }`}
          >
            <p className="font-medium truncate">{threadLabel(t)}</p>
            <p className="text-xs text-neutral-500 truncate">{t.lastMessagePreview}</p>
          </button>
        ))}
      </div>

      <div className="flex-1 flex flex-col border border-neutral-200 rounded">
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((m) => (
            <div key={m.id} className={`max-w-sm ${m.senderEmail === user?.email ? 'ml-auto text-right' : ''}`}>
              <p className="text-xs text-neutral-500">{m.senderEmail}</p>
              <p
                className={`inline-block rounded px-3 py-1.5 text-sm ${
                  m.senderEmail === user?.email
                    ? 'bg-navy hover:bg-navy-dark text-white transition-colors'
                    : 'bg-neutral-100'
                }`}
              >
                {m.body}
              </p>
            </div>
          ))}
          {messages.length === 0 && <p className="text-sm text-neutral-500">No messages yet.</p>}
        </div>
        <div className="p-3 border-t border-neutral-200 flex gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder="Message…"
            className="flex-1 rounded border border-neutral-300 bg-transparent px-3 py-2 text-sm"
          />
          <button onClick={send} className="rounded bg-navy hover:bg-navy-dark text-white transition-colors px-4 py-2 text-sm">
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
