import LLMReportsList from '../components/LLMReportsList'

export default function LLMReportsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary mb-1">Rapoarte de la elevi</h1>
      <p className="text-sm text-text-secondary mb-6">
        Elevii îți raportează aici sesiunile LLM care nu merg cum trebuie.
      </p>
      <LLMReportsList />
    </div>
  )
}
