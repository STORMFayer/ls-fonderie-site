import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ success: false, error: 'Non authentifié.' }, 401)

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: userData, error: userErr } = await callerClient.auth.getUser()
    if (userErr || !userData.user) return json({ success: false, error: 'Session invalide.' }, 401)

    const { data: profile, error: profileErr } = await callerClient
      .from('employees')
      .select('role')
      .eq('id', userData.user.id)
      .single()

    if (profileErr || profile?.role !== 'admin') {
      return json({ success: false, error: 'Accès réservé aux admins.' }, 403)
    }

    const { action, employeeId, password } = await req.json()
    if (!action || !employeeId) return json({ success: false, error: 'Paramètres manquants.' }, 400)

    const admin = createClient(supabaseUrl, serviceKey)

    if (action === 'set_password') {
      if (!password || password.length < 8) {
        return json({ success: false, error: 'Mot de passe : 8 caractères minimum.' }, 400)
      }
      const { error } = await admin.auth.admin.updateUserById(employeeId, { password })
      if (error) return json({ success: false, error: error.message }, 400)
      return json({ success: true })
    }

    if (action === 'delete') {
      if (employeeId === userData.user.id) {
        return json({ success: false, error: 'Tu ne peux pas supprimer ton propre compte.' }, 400)
      }
      const { error } = await admin.auth.admin.deleteUser(employeeId)
      if (error) return json({ success: false, error: error.message }, 400)
      return json({ success: true })
    }

    return json({ success: false, error: 'Action inconnue.' }, 400)
  } catch (e) {
    return json({ success: false, error: e instanceof Error ? e.message : String(e) }, 500)
  }
})
