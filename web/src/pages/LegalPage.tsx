import { useState } from 'react'
import { Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

import privacyRO from '../legal/PRIVACY-RO.md?raw'
import privacyEN from '../legal/PRIVACY-EN.md?raw'
import termsRO from '../legal/TERMS-RO.md?raw'
import termsEN from '../legal/TERMS-EN.md?raw'
import dpaRO from '../legal/DPA-RO.md?raw'
import dpaEN from '../legal/DPA-EN.md?raw'

export type LegalDoc = 'privacy' | 'terms' | 'dpa'

const docs: Record<LegalDoc, { ro: string; en: string; titleRO: string; titleEN: string }> = {
  privacy: { ro: privacyRO, en: privacyEN, titleRO: 'Politică de confidențialitate', titleEN: 'Privacy Policy' },
  terms: { ro: termsRO, en: termsEN, titleRO: 'Termeni și Condiții', titleEN: 'Terms of Service' },
  dpa: { ro: dpaRO, en: dpaEN, titleRO: 'Acord de Prelucrare a Datelor', titleEN: 'Data Processing Agreement' },
}

export default function LegalPage({ doc }: { doc: LegalDoc }) {
  const [lang, setLang] = useState<'ro' | 'en'>('ro')
  const content = docs[doc][lang]

  return (
    <div className="min-h-screen bg-surface-light">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-primary-purple">TrainBot</Link>
          <div className="flex gap-2">
            <button
              onClick={() => setLang('ro')}
              className={`px-3 py-1 rounded text-sm font-semibold ${lang === 'ro' ? 'bg-primary-purple text-white' : 'text-text-secondary'}`}
            >
              RO
            </button>
            <button
              onClick={() => setLang('en')}
              className={`px-3 py-1 rounded text-sm font-semibold ${lang === 'en' ? 'bg-primary-purple text-white' : 'text-text-secondary'}`}
            >
              EN
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        <article className="bg-white rounded-2xl p-8 prose-trainbot">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {content}
          </ReactMarkdown>
        </article>
        <p className="text-center text-text-secondary text-xs mt-6">
          <Link to="/privacy" className="hover:underline">Confidențialitate</Link>
          {' · '}
          <Link to="/terms" className="hover:underline">Termeni</Link>
          {' · '}
          <Link to="/dpa" className="hover:underline">DPA</Link>
        </p>
      </main>
    </div>
  )
}
