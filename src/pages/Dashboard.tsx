import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, Package, Wallet, Clock, CheckCircle2 } from 'lucide-react'
import { supabase, type Employee, type Order } from '@/lib/supabase'
import { useAuth } from '@/auth/AuthContext'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import logo from '@/assets/logo.png'

const statusLabel: Record<string, { label: string; variant: 'gold' | 'ember' | 'gray' }> = {
  livree: { label: 'Livrée', variant: 'gold' },
  en_cours: { label: 'En cours', variant: 'ember' },
  en_attente: { label: 'En attente', variant: 'gray' },
}

export function Dashboard() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session) return

    async function load() {
      const [{ data: emp }, { data: ord }] = await Promise.all([
        supabase.from('employees').select('*').eq('id', session!.user.id).single(),
        supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(20),
      ])
      setEmployee(emp)
      setOrders(ord ?? [])
      setLoading(false)
    }
    load()
  }, [session])

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.amount), 0)
  const delivered = orders.filter((o) => o.status === 'livree').length
  const pending = orders.filter((o) => o.status !== 'livree').length

  const stats = [
    { icon: Package, label: 'Commandes', value: orders.length },
    { icon: Wallet, label: 'Chiffre affaires', value: `${totalRevenue.toLocaleString('fr-FR')} $` },
    { icon: CheckCircle2, label: 'Livrées', value: delivered },
    { icon: Clock, label: 'En cours / attente', value: pending },
  ]

  return (
    <div className="min-h-screen bg-[#0b0d12]">
      <header className="border-b border-white/8 bg-white/[0.02]">
        <div className="max-w-5xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src={logo} alt="LS Fonderie" className="w-7 h-7 object-contain" />
            <span className="font-display font-bold text-white">Espace Employé</span>
          </div>
          <Button size="sm" variant="ghost" onClick={handleLogout}>
            <LogOut size={14} /> Déconnexion
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-5 py-10">
        {loading ? (
          <div className="flex justify-center py-20">
            <span className="w-8 h-8 border-2 border-white/20 border-t-gold rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <h1 className="font-display font-black text-2xl text-white mb-1">
              Bonjour {employee?.full_name ?? 'employé·e'}
            </h1>
            <p className="text-white/40 text-sm mb-8">Voici un aperçu de l'activité de la forge.</p>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
              {stats.map((s) => (
                <Card key={s.label} className="p-5">
                  <s.icon size={18} className="text-gold mb-3" />
                  <div className="font-display font-black text-xl text-white">{s.value}</div>
                  <div className="text-white/40 text-xs uppercase tracking-[1.5px] font-semibold mt-1">{s.label}</div>
                </Card>
              ))}
            </div>

            <Card className="p-6">
              <h2 className="font-bold text-white mb-4">Commandes récentes</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-white/40 text-xs uppercase tracking-[1.5px]">
                      <th className="pb-3 font-semibold">Client</th>
                      <th className="pb-3 font-semibold">Produit</th>
                      <th className="pb-3 font-semibold">Montant</th>
                      <th className="pb-3 font-semibold">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="text-white/70">
                    {orders.map((o) => (
                      <tr key={o.id} className="border-t border-white/6">
                        <td className="py-3">{o.client_name}</td>
                        <td className="py-3">{o.product}</td>
                        <td className="py-3 font-semibold text-gold-light">{Number(o.amount).toLocaleString('fr-FR')} $</td>
                        <td className="py-3">
                          <Badge variant={statusLabel[o.status]?.variant ?? 'gray'}>
                            {statusLabel[o.status]?.label ?? o.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                    {orders.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-white/30">Aucune commande pour le moment.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}
      </main>
    </div>
  )
}
