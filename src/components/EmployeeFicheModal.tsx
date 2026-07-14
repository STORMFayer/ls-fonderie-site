import { useEffect, useState, type FormEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Trash2, FileText } from 'lucide-react'
import { supabase, type Employee, type EmployeeNote, type NoteCategory } from '@/lib/supabase'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'

const categoryMeta: Record<NoteCategory, { label: string; variant: 'gray' | 'ember' | 'gold' }> = {
  general: { label: 'Note générale', variant: 'gray' },
  avertissement: { label: 'Avertissement', variant: 'ember' },
  rendement: { label: 'Rendement', variant: 'gold' },
}

export function EmployeeFicheModal({ employee, onClose }: { employee: Employee; onClose: () => void }) {
  const [notes, setNotes] = useState<EmployeeNote[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState<NoteCategory>('general')
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('employee_notes')
      .select('*')
      .eq('employee_id', employee.id)
      .order('created_at', { ascending: false })
    setNotes(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employee.id])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!content.trim()) {
      setError('La note ne peut pas être vide.')
      return
    }
    setSubmitting(true)
    setError(null)
    const { error } = await supabase.rpc('add_employee_note', {
      p_employee_id: employee.id,
      p_category: category,
      p_content: content.trim(),
    })
    setSubmitting(false)
    if (error) {
      setError("Impossible d'ajouter la note.")
      return
    }
    setContent('')
    setCategory('general')
    await load()
  }

  async function handleDelete(noteId: number) {
    await supabase.rpc('delete_employee_note', { p_note_id: noteId })
    await load()
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[110] flex items-start sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg my-8"
        >
          <Card className="p-6">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-gold" />
                <h2 className="font-bold text-white">Fiche employé</h2>
              </div>
              <button onClick={onClose} className="text-white/40 hover:text-white p-1">
                <X size={16} />
              </button>
            </div>
            <p className="text-white/40 text-sm mb-5">{employee.full_name} · {employee.discord ?? '—'}</p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-2 mb-5">
              <div className="flex gap-2">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as NoteCategory)}
                  className="rounded-lg bg-white/5 border border-white/12 px-3 py-2 text-sm text-white outline-none focus:border-gold/50"
                >
                  <option value="general">Note générale</option>
                  <option value="avertissement">Avertissement</option>
                  <option value="rendement">Rendement</option>
                </select>
              </div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={3}
                placeholder="Écrire une note sur cet employé..."
                className="w-full rounded-lg bg-white/5 border border-white/12 px-3.5 py-2.5 text-sm text-white outline-none focus:border-gold/50 resize-none"
              />
              {error && <p className="text-red-400 text-xs">{error}</p>}
              <Button type="submit" size="sm" variant="gold" disabled={submitting} className="self-start">
                {submitting ? 'Ajout...' : 'Ajouter la note'}
              </Button>
            </form>

            <div className="flex flex-col gap-2 max-h-80 overflow-y-auto pr-1">
              {loading && <p className="text-white/30 text-sm text-center py-4">Chargement...</p>}
              {!loading && notes.length === 0 && (
                <p className="text-white/30 text-sm text-center py-4">Aucune note pour cet employé.</p>
              )}
              {notes.map((n) => (
                <div key={n.id} className="rounded-lg bg-white/[0.03] border border-white/8 p-3">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <Badge variant={categoryMeta[n.category].variant}>{categoryMeta[n.category].label}</Badge>
                    <button onClick={() => handleDelete(n.id)} className="text-white/25 hover:text-red-400 shrink-0">
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <p className="text-white/70 text-sm whitespace-pre-wrap">{n.content}</p>
                  <p className="text-white/25 text-xs mt-1.5">
                    {new Date(n.created_at).toLocaleString('fr-FR')} · {n.author}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
