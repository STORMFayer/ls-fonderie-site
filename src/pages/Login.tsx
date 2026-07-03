import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Lock, ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/auth/AuthContext'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Embers } from '@/components/Embers'
import logo from '@/assets/logo.png'

export function Login() {
  const { session, loading } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (!loading && session) return <Navigate to="/dashboard" replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setSubmitting(false)
    if (error) {
      setError('Identifiants incorrects.')
      return
    }
    navigate('/dashboard')
  }

  return (
    <div
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-5"
      style={{
        background: `
          radial-gradient(ellipse 70% 55% at 50% 20%, rgba(217,164,65,0.2) 0%, rgba(217,164,65,0) 55%),
          linear-gradient(168deg, #15110b 0%, #191510 30%, #0b0d12 75%, #0b0d12 100%)
        `,
      }}
    >
      <Embers count={10} />

      <Link to="/" className="absolute top-6 left-6 z-10 text-white/40 hover:text-white text-sm flex items-center gap-1.5 transition-colors">
        <ArrowLeft size={15} /> Retour au site
      </Link>

      <div className="relative z-10 flex flex-col items-center mb-8">
        <img src={logo} alt="LS Fonderie" className="w-16 h-16 object-contain mb-4 animate-float" />
        <h1 className="font-display font-black text-2xl text-white">Espace Employé</h1>
        <p className="text-white/40 text-sm mt-1">Connexion réservée au personnel</p>
      </div>

      <Card className="relative z-10 w-full max-w-sm p-7">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-xs uppercase tracking-[2px] text-white/40 font-semibold mb-1.5 block">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg bg-white/5 border border-white/12 px-3.5 py-2.5 text-sm text-white outline-none focus:border-gold/50 transition-colors"
              placeholder="prenom@ls-fonderie.dev"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-[2px] text-white/40 font-semibold mb-1.5 block">Mot de passe</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg bg-white/5 border border-white/12 px-3.5 py-2.5 text-sm text-white outline-none focus:border-gold/50 transition-colors"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-red-400 text-xs">{error}</p>}

          <Button type="submit" size="md" variant="gold" disabled={submitting} className="mt-1 w-full">
            <Lock size={15} /> {submitting ? 'Connexion...' : 'Se connecter'}
          </Button>
        </form>
      </Card>
    </div>
  )
}
