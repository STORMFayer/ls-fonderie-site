import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Minus, Plus, PackageCheck } from 'lucide-react'
import { supabase, type Price } from '@/lib/supabase'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { SuccessModal } from '@/components/SuccessModal'

const productImages: Record<string, string> = {}
const modules = import.meta.glob('@/assets/*.png', { eager: true, import: 'default' }) as Record<string, string>
for (const path in modules) {
  const key = path.split('/').pop()!.replace('.png', '')
  productImages[key] = modules[path]
}

export function OrderCatalogue({
  type, accent, title, subtitle,
}: { type: 'legal' | 'black'; accent: string; title: string; subtitle: string }) {
  const [prices, setPrices] = useState<Price[]>([])
  const [cart, setCart] = useState<Record<string, number>>({})
  const [nom, setNom] = useState('')
  const [contact, setContact] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [orderNumero, setOrderNumero] = useState<string | null>(null)

  useEffect(() => {
    supabase.from('prices').select('*').eq('type', type).then(({ data }) => setPrices(data ?? []))
  }, [type])

  function setQty(key: string, qty: number) {
    setCart((prev) => ({ ...prev, [key]: Math.max(0, Number.isFinite(qty) ? Math.floor(qty) : 0) }))
  }

  const total = prices.reduce((s, p) => s + (cart[p.key] ?? 0) * p.price, 0)
  const items = prices.filter((p) => (cart[p.key] ?? 0) > 0).map((p) => ({ key: p.key, label: p.label, qty: cart[p.key], price: p.price }))

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (items.length === 0) {
      setError('Ajoute au moins un article à ta commande.')
      return
    }
    if (!contact.trim()) {
      setError('Le numéro de téléphone est requis.')
      return
    }
    setSubmitting(true)
    setError(null)
    const { data, error } = await supabase.rpc('place_order', {
      p_nom: nom || 'Client anonyme',
      p_contact: contact,
      p_items: items,
      p_type: type,
      p_message: message,
    })
    setSubmitting(false)
    if (error) {
      setError('Impossible de passer la commande.')
      return
    }
    setOrderNumero(data)
    setCart({})
    setNom('')
    setContact('')
    setMessage('')

    supabase.functions.invoke('notify-order', { body: { numero: data } }).catch(() => {})
  }

  return (
    <div className="min-h-screen bg-[#0b0d12] px-5 py-16">
      <Link to="/" className="fixed top-6 left-6 z-10 text-white/40 hover:text-white text-sm flex items-center gap-1.5 transition-colors">
        <ArrowLeft size={15} /> Retour au site
      </Link>

      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="font-display font-black text-3xl text-white mb-2">{title}</h1>
          <p className="text-white/40">{subtitle}</p>
        </div>

        <div className="flex flex-wrap justify-center gap-5 mb-10">
          {prices.map((p) => (
            <Card key={p.key} className="p-5 flex flex-col items-center text-center w-full sm:w-56">
              {productImages[p.key] && (
                <img
                  src={productImages[p.key]}
                  alt={p.label}
                  className="w-20 h-20 object-contain mb-3"
                  style={p.key === 'lingot' ? { transform: 'translate(3%, -2%)' } : undefined}
                />
              )}
              <h3 className="text-white font-semibold mb-1">{p.label}</h3>
              <p className={`font-display font-black text-lg mb-4 ${accent}`}>{p.price.toLocaleString('fr-FR')} $/u</p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQty(p.key, (cart[p.key] ?? 0) - 1)}
                  className="w-8 h-8 rounded-lg bg-white/8 text-white flex items-center justify-center hover:bg-white/15"
                >
                  <Minus size={14} />
                </button>
                <input
                  type="number"
                  min={0}
                  value={cart[p.key] ?? 0}
                  onChange={(e) => setQty(p.key, Number(e.target.value))}
                  className="w-14 text-center bg-white/5 border border-white/12 rounded-lg py-1 text-white font-bold outline-none focus:border-gold/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <button
                  onClick={() => setQty(p.key, (cart[p.key] ?? 0) + 1)}
                  className="w-8 h-8 rounded-lg bg-white/8 text-white flex items-center justify-center hover:bg-white/15"
                >
                  <Plus size={14} />
                </button>
              </div>
            </Card>
          ))}
        </div>

        <Card className="p-6 max-w-lg mx-auto">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-xs uppercase tracking-[2px] text-white/40 font-semibold mb-1.5 block">Nom / Entreprise</label>
              <input
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                className="w-full rounded-lg bg-white/5 border border-white/12 px-3.5 py-2.5 text-sm text-white outline-none focus:border-gold/50"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-[2px] text-white/40 font-semibold mb-1.5 block">Téléphone</label>
              <input
                type="tel"
                required
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                className="w-full rounded-lg bg-white/5 border border-white/12 px-3.5 py-2.5 text-sm text-white outline-none focus:border-gold/50"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-[2px] text-white/40 font-semibold mb-1.5 block">Message (optionnel)</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={2}
                className="w-full rounded-lg bg-white/5 border border-white/12 px-3.5 py-2.5 text-sm text-white outline-none focus:border-gold/50 resize-none"
              />
            </div>

            {error && <p className="text-red-400 text-xs">{error}</p>}

            <div className="flex items-center justify-between pt-2 border-t border-white/8">
              <span className="text-white/40 text-xs uppercase tracking-[1.5px]">Total</span>
              <motion.span key={total} initial={{ scale: 1.15 }} animate={{ scale: 1 }} className={`font-display font-black text-2xl ${accent}`}>
                {total.toLocaleString('fr-FR')} $
              </motion.span>
            </div>

            <Button type="submit" variant="gold" size="lg" disabled={submitting} className="w-full">
              <PackageCheck size={16} /> {submitting ? 'Envoi...' : 'Passer la commande'}
            </Button>
          </form>
        </Card>
      </div>

      <SuccessModal open={orderNumero !== null} title="Commande passée !" onClose={() => setOrderNumero(null)}>
        Ton numéro de suivi : <span className="text-gold-light font-bold">{orderNumero}</span>
      </SuccessModal>
    </div>
  )
}
