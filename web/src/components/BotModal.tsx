import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Modal from './Modal'
import { apiFetch, ApiError } from '../lib/api'
import { useAuthStore } from '../auth/authStore'
import type { BotSummary, BotExample, ClassSummary } from '../lib/types'

interface BotModalProps {
  open: boolean
  onClose: () => void
  bot?: BotSummary | null
}

const EMPTY_EXAMPLE: BotExample = { input: '', output: '' }

export default function BotModal({ open, onClose, bot }: BotModalProps) {
  const accessToken = useAuthStore((s) => s.accessToken)
  const qc = useQueryClient()

  const [name, setName] = useState('')
  const [instruction, setInstruction] = useState('')
  const [examples, setExamples] = useState<BotExample[]>([{ ...EMPTY_EXAMPLE }])
  const [classId, setClassId] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  // Populate fields when editing
  useEffect(() => {
    if (open) {
      if (bot) {
        setName(bot.name)
        setInstruction(bot.instruction)
        setExamples(bot.examples.length > 0 ? bot.examples.map((e) => ({ ...e })) : [{ ...EMPTY_EXAMPLE }])
        setClassId(bot.classId ?? '')
      } else {
        setName('')
        setInstruction('')
        setExamples([{ ...EMPTY_EXAMPLE }])
        setClassId('')
      }
      setError(null)
    }
  }, [open, bot])

  const { data: classesData } = useQuery({
    queryKey: ['classes'],
    queryFn: () =>
      apiFetch<{ data: ClassSummary[] }>('/teacher/classes', {}, accessToken ?? undefined),
    enabled: open && !!accessToken,
  })

  const mutation = useMutation({
    mutationFn: () => {
      const payload = {
        name: name.trim(),
        instruction: instruction.trim(),
        examples: examples.map((e) => ({ input: e.input.trim(), output: e.output.trim() })),
        classId: classId || null,
      }
      if (bot) {
        return apiFetch<BotSummary>(
          `/teacher/llm/bots/${bot.id}`,
          { method: 'PUT', body: JSON.stringify(payload) },
          accessToken ?? undefined,
        )
      }
      return apiFetch<BotSummary>(
        '/teacher/llm/bots',
        { method: 'POST', body: JSON.stringify(payload) },
        accessToken ?? undefined,
      )
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bots'] })
      onClose()
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Eroare la salvare'),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (name.trim().length === 0 || name.trim().length > 100) {
      setError('Numele trebuie să aibă între 1 și 100 de caractere.')
      return
    }
    if (instruction.trim().length === 0 || instruction.trim().length > 2000) {
      setError('Instrucțiunea trebuie să aibă între 1 și 2000 de caractere.')
      return
    }
    if (examples.length < 1 || examples.length > 10) {
      setError('Adaugă între 1 și 10 exemple.')
      return
    }
    for (let i = 0; i < examples.length; i++) {
      const ex = examples[i]
      if (ex.input.trim().length === 0 || ex.input.trim().length > 500) {
        setError(`Exemplul ${i + 1}: Intrarea trebuie să aibă între 1 și 500 de caractere.`)
        return
      }
      if (ex.output.trim().length === 0 || ex.output.trim().length > 500) {
        setError(`Exemplul ${i + 1}: Răspunsul trebuie să aibă între 1 și 500 de caractere.`)
        return
      }
    }

    mutation.mutate()
  }

  function updateExample(index: number, field: keyof BotExample, value: string) {
    setExamples((prev) => prev.map((ex, i) => (i === index ? { ...ex, [field]: value } : ex)))
  }

  function addExample() {
    if (examples.length < 10) {
      setExamples((prev) => [...prev, { ...EMPTY_EXAMPLE }])
    }
  }

  function removeExample(index: number) {
    if (examples.length > 1) {
      setExamples((prev) => prev.filter((_, i) => i !== index))
    }
  }

  const inputClass =
    'mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-purple outline-none text-sm'

  return (
    <Modal open={open} onClose={onClose} title={bot ? 'Editează bot' : 'Bot nou'}>
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
        {/* Name */}
        <label className="block">
          <span className="text-sm text-text-secondary">
            Nume <span className="text-xs text-gray-400">(max 100 caractere)</span>
          </span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={100}
            placeholder="ex. Asistent Matematică"
            className={inputClass}
          />
        </label>

        {/* Instruction */}
        <label className="block">
          <span className="text-sm text-text-secondary">
            Instrucțiune / personalitate{' '}
            <span className="text-xs text-gray-400">(max 2000 caractere)</span>
          </span>
          <textarea
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            required
            maxLength={2000}
            rows={4}
            placeholder="ex. Ești un asistent prietenos care ajută elevii să înțeleagă fracțiile. Explici simplu, cu exemple din viața reală."
            className={inputClass}
          />
          <span className="text-xs text-gray-400">{instruction.length}/2000</span>
        </label>

        {/* Class selector */}
        <label className="block">
          <span className="text-sm text-text-secondary">Clasă (opțional)</span>
          <select
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            className={`${inputClass} bg-white`}
          >
            <option value="">Toate clasele</option>
            {classesData?.data.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        {/* Few-shot examples */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-text-secondary">
              Exemple few-shot{' '}
              <span className="text-xs text-gray-400">({examples.length}/10)</span>
            </span>
            <button
              type="button"
              onClick={addExample}
              disabled={examples.length >= 10}
              className="text-xs text-primary-purple hover:underline disabled:opacity-40"
            >
              + Adaugă exemplu
            </button>
          </div>

          <div className="space-y-3">
            {examples.map((ex, i) => (
              <div key={i} className="bg-surface-light rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-text-secondary">
                    Exemplu {i + 1}
                  </span>
                  {examples.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeExample(i)}
                      className="text-xs text-danger hover:underline"
                    >
                      Elimină
                    </button>
                  )}
                </div>
                <label className="block">
                  <span className="text-xs text-text-secondary">Mesaj elev</span>
                  <input
                    value={ex.input}
                    onChange={(e) => updateExample(i, 'input', e.target.value)}
                    maxLength={500}
                    placeholder="ex. Cât face 1/2 + 1/3?"
                    className={inputClass}
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-text-secondary">Răspuns bot</span>
                  <textarea
                    value={ex.output}
                    onChange={(e) => updateExample(i, 'output', e.target.value)}
                    maxLength={500}
                    rows={2}
                    placeholder="ex. Ca să aduni fracții cu numitori diferiți, aduci la numitor comun: 3/6 + 2/6 = 5/6."
                    className={inputClass}
                  />
                </label>
              </div>
            ))}
          </div>
        </div>

        {error && <p className="text-danger text-sm">{error}</p>}

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 rounded-lg border border-gray-300 text-text-secondary hover:bg-gray-50"
          >
            Anulează
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="flex-1 bg-primary-purple text-white font-semibold py-2 rounded-lg disabled:opacity-50"
          >
            {mutation.isPending ? 'Se salvează...' : bot ? 'Salvează' : 'Creează'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
