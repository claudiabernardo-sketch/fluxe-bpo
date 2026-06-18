import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const ASAAS_BASE = Deno.env.get('ASAAS_SANDBOX') === 'true'
  ? 'https://sandbox.asaas.com/api/v3'
  : 'https://api.asaas.com/v3'

async function asaas(path: string, method = 'GET', body?: object) {
  const res = await fetch(`${ASAAS_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'access_token': Deno.env.get('ASAAS_API_KEY')!,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  return res.json()
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // Busca empresas com trial expirado sem assinatura criada
  const { data: empresas, error } = await supabase
    .from('empresas')
    .select('id, nome, email, plano')
    .eq('plano', 'trial')
    .lt('trial_expira_em', new Date().toISOString())
    .is('asaas_customer_id', null)

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const results = []

  for (const empresa of empresas ?? []) {
    try {
      // 1. Criar cliente no Asaas
      const customer = await asaas('/customers', 'POST', {
        name: empresa.nome,
        email: empresa.email,
        notificationDisabled: false,
      })

      if (!customer.id) {
        results.push({ empresa_id: empresa.id, error: 'Falha ao criar cliente Asaas', detail: customer })
        continue
      }

      // 2. Calcular vencimento: amanhã
      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + 1)
      const nextDueDate = dueDate.toISOString().split('T')[0]

      // 3. Valor do plano
      const valor = empresa.plano === 'pro' ? 97.00 : 59.00
      const descPlano = empresa.plano === 'pro' ? 'Plano Pro' : 'Plano Essencial'

      // 4. Criar assinatura
      const subscription = await asaas('/subscriptions', 'POST', {
        customer: customer.id,
        billingType: 'UNDEFINED', // cliente escolhe: boleto, pix, cartão
        value: valor,
        nextDueDate,
        cycle: 'MONTHLY',
        description: `Fluxe BPO - ${descPlano}`,
        sendPaymentByPostalService: false,
      })

      if (!subscription.id) {
        results.push({ empresa_id: empresa.id, error: 'Falha ao criar assinatura', detail: subscription })
        continue
      }

      // 5. Buscar link do primeiro pagamento
      const payments = await asaas(`/subscriptions/${subscription.id}/payments`)
      const paymentUrl = payments.data?.[0]?.invoiceUrl || null

      // 6. Atualizar empresa no Supabase
      await supabase
        .from('empresas')
        .update({
          plano: 'trial_expirado',
          asaas_customer_id: customer.id,
          asaas_subscription_id: subscription.id,
          asaas_payment_url: paymentUrl,
        })
        .eq('id', empresa.id)

      results.push({ empresa_id: empresa.id, customer_id: customer.id, subscription_id: subscription.id, payment_url: paymentUrl })

    } catch (e) {
      results.push({ empresa_id: empresa.id, error: String(e) })
    }
  }

  return new Response(JSON.stringify({ processed: results.length, results }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
