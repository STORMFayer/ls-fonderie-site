import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Menu, X, Flame, Lock } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import logo from '@/assets/logo.png'

const links = [
  { id: 'produits', label: 'Produits' },
  { id: 'process', label: 'Processus' },
  { id: 'avis', label: 'Avis' },
  { id: 'contact', label: 'Contact' },
]

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
}

export function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-[#0b0d12]/80 backdrop-blur-xl border-b border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.3)]' : 'bg-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-2.5 font-display font-bold text-white cursor-pointer">
          <img src={logo} alt="LS Fonderie" className="w-8 h-8 object-contain" />
          LS Fonderie
        </button>

        <nav className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <button key={l.id} onClick={() => scrollToId(l.id)} className="text-sm text-white/60 hover:text-white transition-colors font-medium cursor-pointer">
              {l.label}
            </button>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Link to="/login" className="text-white/40 hover:text-white text-xs uppercase tracking-[1.5px] font-semibold flex items-center gap-1.5 transition-colors">
            <Lock size={12} /> Espace Employé
          </Link>
          <Button size="sm" variant="gold" onClick={() => scrollToId('contact')}>
            <Flame size={15} /> Commander
          </Button>
        </div>

        <button className="md:hidden text-white" onClick={() => setOpen((o) => !o)} aria-label="Menu">
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden overflow-hidden bg-[#0b0d12]/95 backdrop-blur-xl border-b border-white/10"
          >
            <div className="flex flex-col gap-1 px-5 py-4">
              {links.map((l) => (
                <button
                  key={l.id}
                  onClick={() => {
                    scrollToId(l.id)
                    setOpen(false)
                  }}
                  className="text-left text-white/70 hover:text-white py-2.5 text-sm font-medium cursor-pointer"
                >
                  {l.label}
                </button>
              ))}
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="text-white/60 hover:text-white py-2.5 text-sm font-medium flex items-center gap-1.5"
              >
                <Lock size={13} /> Espace Employé
              </Link>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  )
}
