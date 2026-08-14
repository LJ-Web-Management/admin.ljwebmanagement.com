import { useEffect, useState } from 'react'
import { API_BASE_URL, USE_MOCK_API } from '../../lib/env'
import { usePageTitle } from '../../lib/usePageTitle'
import { api } from '../../lib/apiClient'
import type { ChatTranscript } from '../../lib/types'

export function TranscriptsPage() {
  usePageTitle('Chatbot Transcripts')
  const [transcripts, setTranscripts] = useState<ChatTranscript[]>([])
  const [loading, setLoading] = useState(true)
  const [showSetup, setShowSetup] = useState(false)

  const reload = () => api.listTranscripts().then((data) => setTranscripts(data))

  useEffect(() => {
    reload().then(() => setLoading(false))
  }, [])

  const onFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    await api.uploadTranscript(
      {
        customerName: file.name.replace(/\.[^.]+$/, ''),
        customerEmail: '',
        receivedAt: new Date().toISOString(),
        fileName: file.name,
        url: '',
        summary: 'Manually uploaded, no automated summary yet.',
        source: 'manual upload',
      },
      file,
    )
    e.target.value = ''
    reload()
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-heading font-semibold text-navy">Chatbot Transcripts</h1>
        <label className="rounded bg-navy hover:bg-navy-dark text-white transition-colors px-3 py-1.5 text-sm cursor-pointer">
          Upload transcript
          <input type="file" accept=".txt,.html,.eml,.pdf" onChange={onFileSelected} className="hidden" />
        </label>
      </div>

      <div className="rounded border border-neutral-200 p-4">
        <button
          type="button"
          onClick={() => setShowSetup((s) => !s)}
          className="text-sm font-semibold text-navy hover:text-navy-dark"
        >
          {showSetup ? 'Hide' : 'Show'} automated ingestion setup (tawk.to to Gemini to API)
        </button>
        {showSetup && (
          <div className="mt-3 space-y-3 text-sm text-neutral-700">
            <p>
              Planned pipeline for auto-importing tawk.to email transcripts, no manual upload needed once this is
              wired up:
            </p>
            <ol className="list-decimal list-inside space-y-1">
              <li>tawk.to emails each chat transcript to a monitored Google Workspace inbox.</li>
              <li>
                A Google Apps Script time-driven trigger (Google Workspace Studio / Apps Script) scans that inbox
                for new tawk.to transcript emails on a short interval.
              </li>
              <li>
                Apps Script sends the email body to the Gemini API to extract customer name/email and produce a
                clean transcript file plus a short summary.
              </li>
              <li>
                Apps Script POSTs the result to this admin API's transcript ingestion endpoint, which stores the
                file in S3 and inserts a row so it shows up here automatically.
              </li>
            </ol>
            <div className="rounded bg-mist p-3 font-mono text-xs space-y-1">
              <p>POST {API_BASE_URL || '{VITE_API_BASE_URL}'}/transcripts/upload</p>
              <p>Header: X-API-Key: &lt;transcripts ingest key, stored in Secrets Manager&gt;</p>
              <p>Body: {'{ customerName, customerEmail, receivedAt, fileName, summary, fileBase64 }'}</p>
            </div>
            <p className="text-xs text-neutral-500">
              {USE_MOCK_API
                ? 'This endpoint does not exist yet, it is planned for when the backend (API Gateway + Lambda + S3) is deployed. Use "Upload transcript" above to add one manually until then.'
                : 'This endpoint is live. The Apps Script automation still needs to be set up separately to call it, use "Upload transcript" above to add one manually until then.'}
            </p>
          </div>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-neutral-500">Loading...</p>
      ) : (
        <div className="overflow-x-auto rounded border border-neutral-200">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left">
              <tr>
                <th className="px-3 py-2">Customer</th>
                <th className="px-3 py-2">Received</th>
                <th className="px-3 py-2">Summary</th>
                <th className="px-3 py-2">Source</th>
                <th className="px-3 py-2">File</th>
              </tr>
            </thead>
            <tbody>
              {transcripts.map((t) => (
                <tr key={t.id} className="border-t border-neutral-100">
                  <td className="px-3 py-2">
                    <p className="font-medium">{t.customerName || 'Unknown'}</p>
                    {t.customerEmail && <p className="text-xs text-neutral-500">{t.customerEmail}</p>}
                  </td>
                  <td className="px-3 py-2 text-neutral-500 whitespace-nowrap">
                    {new Date(t.receivedAt).toLocaleString()}
                  </td>
                  <td className="px-3 py-2 text-neutral-600">{t.summary}</td>
                  <td className="px-3 py-2">
                    <span className="rounded px-2 py-0.5 text-xs font-medium bg-cyan/10 text-navy-dark">
                      {t.source}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    {t.url ? (
                      <a href={t.url} download={t.fileName} className="text-navy hover:underline">
                        {t.fileName}
                      </a>
                    ) : (
                      <span className="text-neutral-400">{t.fileName}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {transcripts.length === 0 && <p className="text-sm text-neutral-500 p-4">No transcripts yet.</p>}
        </div>
      )}
    </div>
  )
}
