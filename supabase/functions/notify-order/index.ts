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

interface OrderItem {
  label: string
  qty: number
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { numero } = await req.json()
    if (!numero) return json({ success: false, error: 'numero manquant' }, 400)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const webhookUrl = Deno.env.get('DISCORD_WEBHOOK_URL')

    if (!webhookUrl) return json({ success: false, error: 'Webhook non configuré' }, 500)

    const admin = createClient(supabaseUrl, serviceKey)
    const { data: order, error } = await admin
      .from('orders')
      .select('*')
      .eq('numero', numero)
      .single()

    if (error || !order) return json({ success: false, error: 'commande introuvable' }, 404)

    const items = (order.items as OrderItem[]) ?? []
    const articles = items.map((it) => `${it.label} x${it.qty}`).join('\n') || '—'
    const isBlack = order.type === 'black'

    const discordRes = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [
          {
            title: `${isBlack ? '💀' : '🏛️'} Nouvelle commande — ${order.numero}`,
            color: isBlack ? 0xdc2626 : 0xc9a84c,
            fields: [
              { name: 'Client', value: order.nom || '—', inline: true },
              { name: 'Contact', value: order.contact || '—', inline: true },
              { name: 'Type', value: isBlack ? 'Marché noir' : 'Légal', inline: true },
              { name: 'Articles', value: articles, inline: false },
              { name: 'Total', value: `${Number(order.total).toLocaleString('fr-FR')} $`, inline: true },
              ...(order.message ? [{ name: 'Message', value: order.message, inline: false }] : []),
            ],
            timestamp: order.created_at,
          },
        ],
      }),
    })

    if (!discordRes.ok) {
      return json({ success: false, error: `Discord a répondu ${discordRes.status}` }, 502)
    }

    return json({ success: true })
  } catch (e) {
    return json({ success: false, error: e instanceof Error ? e.message : String(e) }, 500)
  }
})
