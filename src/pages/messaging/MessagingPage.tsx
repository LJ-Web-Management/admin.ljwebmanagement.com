import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../lib/auth/AuthContext'
import { api } from '../../lib/apiClient'
import { usePageTitle } from '../../lib/usePageTitle'
import type { Message, MessageThread, User } from '../../lib/types'

export function MessagingPage() {
  usePageTitle('Messaging')
  const { user, canAccessSection } = useAuth()
  const [threads, setThreads] = useState<MessageThread[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [draft, setDraft] = useState('')
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [panel, setPanel] = useState<'dm' | 'group' | null>(null)
  const [memberQuery, setMemberQuery] = useState('')
  const [groupName, setGroupName] = useState('')
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set())

  const canDirect = canAccessSection('messaging', 'direct')
  const canGroups = canAccessSection('messaging', 'groups')

  const visibleThreads = useMemo(
    () => threads.filter((t) => (t.isGroup ? canGroups : canDirect)),
    [threads, canDirect, canGroups],
  )

  const reloadThreads = () =>
    api.listThreads().then((data) => {
      setThreads(data)
      return data
    })

  useEffect(() => {
    reloadThreads().then((data) => {
      const visible = data.filter((t) => (t.isGroup ? canGroups : canDirect))
      setActiveId(visible[0]?.id ?? null)
    })
    api.listUsers().then(setAllUsers)
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

  const otherUsers = allUsers.filter((u) => u.email !== user?.email)
  const filteredUsers = otherUsers.filter((u) => u.email.toLowerCase().includes(memberQuery.toLowerCase()))

  const closePanel = () => {
    setPanel(null)
    setMemberQuery('')
    setGroupName('')
    setSelectedEmails(new Set())
  }

  const startDm = async (email: string) => {
    if (!user) return
    const thread = await api.createThread({ isGroup: false, name: null, participantEmails: [user.email, email] })
    await reloadThreads()
    setActiveId(thread.id)
    closePanel()
  }

  const toggleMember = (email: string) => {
    setSelectedEmails((prev) => {
      const next = new Set(prev)
      if (next.has(email)) next.delete(email)
      else next.add(email)
      return next
    })
  }

  const createGroup = async () => {
    if (!user || !groupName.trim() || selectedEmails.size === 0) return
    const thread = await api.createThread({
      isGroup: true,
      name: groupName.trim(),
      participantEmails: [user.email, ...selectedEmails],
    })
    await reloadThreads()
    setActiveId(thread.id)
    closePanel()
  }

  return (
    <div className="flex h-[calc(100svh-8rem)] gap-4">
      <div className="w-64 shrink-0 border border-neutral-200 rounded overflow-y-auto">
        <div className="p-3 border-b border-neutral-200 flex gap-2">
          {canDirect && (
            <button
              onClick={() => setPanel(panel === 'dm' ? null : 'dm')}
              className="flex-1 text-xs rounded bg-navy hover:bg-navy-dark text-white transition-colors py-1.5"
            >
              New DM
            </button>
          )}
          {canGroups && (
            <button
              onClick={() => setPanel(panel === 'group' ? null : 'group')}
              className="flex-1 text-xs rounded border border-neutral-300 py-1.5"
            >
              New group
            </button>
          )}
        </div>

        {panel === 'dm' && (
          <div className="p-3 border-b border-neutral-200 space-y-2">
            <input
              value={memberQuery}
              onChange={(e) => setMemberQuery(e.target.value)}
              placeholder="Search by email..."
              className="w-full rounded border border-neutral-300 bg-transparent px-2 py-1.5 text-xs"
            />
            <ul className="max-h-40 overflow-y-auto space-y-1">
              {filteredUsers.map((u) => (
                <li key={u.id}>
                  <button
                    onClick={() => startDm(u.email)}
                    className="w-full text-left text-xs px-2 py-1.5 rounded hover:bg-neutral-100"
                  >
                    {u.email}
                  </button>
                </li>
              ))}
              {filteredUsers.length === 0 && <li className="text-xs text-neutral-500 px-2 py-1">No users found.</li>}
            </ul>
          </div>
        )}

        {panel === 'group' && (
          <div className="p-3 border-b border-neutral-200 space-y-2">
            <input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Group name"
              className="w-full rounded border border-neutral-300 bg-transparent px-2 py-1.5 text-xs"
            />
            <ul className="max-h-32 overflow-y-auto space-y-1">
              {otherUsers.map((u) => (
                <li key={u.id}>
                  <label className="flex items-center gap-2 text-xs px-2 py-1">
                    <input
                      type="checkbox"
                      checked={selectedEmails.has(u.email)}
                      onChange={() => toggleMember(u.email)}
                    />
                    {u.email}
                  </label>
                </li>
              ))}
              {otherUsers.length === 0 && <li className="text-xs text-neutral-500 px-2 py-1">No other users yet.</li>}
            </ul>
            <button
              onClick={createGroup}
              disabled={!groupName.trim() || selectedEmails.size === 0}
              className="w-full text-xs rounded bg-navy hover:bg-navy-dark text-white transition-colors py-1.5 disabled:opacity-50"
            >
              Create group
            </button>
          </div>
        )}

        {visibleThreads.map((t) => (
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
        {visibleThreads.length === 0 && <p className="text-xs text-neutral-500 p-3">No conversations yet.</p>}
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
            placeholder="Message..."
            disabled={!activeId}
            className="flex-1 rounded border border-neutral-300 bg-transparent px-3 py-2 text-sm disabled:opacity-60"
          />
          <button
            onClick={send}
            disabled={!activeId}
            className="rounded bg-navy hover:bg-navy-dark text-white transition-colors px-4 py-2 text-sm disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
