import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase, type Employee } from '@/lib/supabase'

interface AuthState {
  session: Session | null
  employee: Employee | null
  loading: boolean
  refreshEmployee: () => Promise<void>
}

const AuthContext = createContext<AuthState>({
  session: null,
  employee: null,
  loading: true,
  refreshEmployee: async () => {},
})

function withTimeout<T>(promise: PromiseLike<T>, ms = 10000): Promise<T> {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ])
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [loading, setLoading] = useState(true)

  const loadEmployee = useCallback(async (userId: string) => {
    try {
      const { data } = await withTimeout(supabase.from('employees').select('*').eq('id', userId).single())
      setEmployee(data)
    } catch {
      setEmployee(null)
    }
  }, [])

  const refreshEmployee = useCallback(async () => {
    if (session?.user.id) await loadEmployee(session.user.id)
  }, [session, loadEmployee])

  useEffect(() => {
    withTimeout(supabase.auth.getSession())
      .then(async ({ data }) => {
        setSession(data.session)
        if (data.session) await loadEmployee(data.session.user.id)
      })
      .catch(() => {
        setSession(null)
      })
      .finally(() => setLoading(false))

    const { data: subscription } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession)
      if (newSession) {
        await loadEmployee(newSession.user.id)
      } else {
        setEmployee(null)
      }
    })

    return () => subscription.subscription.unsubscribe()
  }, [loadEmployee])

  return (
    <AuthContext.Provider value={{ session, employee, loading, refreshEmployee }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
