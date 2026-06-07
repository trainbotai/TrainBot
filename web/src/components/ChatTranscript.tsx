import type { LLMChatItem } from '../lib/llmTypes'

interface ChatTranscriptProps {
  queries: LLMChatItem[]
}

export default function ChatTranscript({ queries }: ChatTranscriptProps) {
  if (queries.length === 0) {
    return <p className="text-text-secondary text-sm italic">Niciun mesaj în această versiune.</p>
  }

  return (
    <div className="space-y-3">
      {queries.map((q) => (
        <div key={q.id} className="border border-gray-100 rounded-xl overflow-hidden">
          <div className="bg-gray-50 px-4 py-3">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm text-text-primary whitespace-pre-wrap flex-1">{q.userPrompt}</p>
              {q.flagged && (
                <span className="text-warning text-xs font-semibold shrink-0">FLAGGED</span>
              )}
            </div>
            <p className="text-xs text-text-secondary mt-1">
              {new Date(q.createdAt).toLocaleString('ro-RO')}
            </p>
          </div>
          {q.aiResponse && (
            <div className="bg-white px-4 py-3 border-t border-gray-100">
              <p className="text-sm text-text-primary whitespace-pre-wrap">{q.aiResponse}</p>
            </div>
          )}
          {!q.aiResponse && q.flagged && (
            <div className="bg-white px-4 py-3 border-t border-gray-100">
              <p className="text-xs text-text-secondary italic">
                Mesajul a fost blocat de filtrul de siguranță înainte de a primi răspuns.
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
