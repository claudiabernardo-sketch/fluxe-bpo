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

const VALOR_PLANO: Record<string, { valor: number; desc: string }> = {
  pro:       { valor: 197.00, desc: 'Plano Completo' },
  essencial: { valor: 97.00,  desc: 'Plano Essencial' },
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // ── Modo individual: usuário logado clicando em "Assinar" no Config ────
  // Só entra aqui se vier um corpo com cpfCnpj — senão cai no modo em lote
  // (varredura de trials vencidos, usada pelo cron).
  let bodyPayload: { plano?: string; cpfCnpj?: string; empresa_id?: string } = {}
  try { bodyPayload = await req.json() } catch { /* sem corpo = modo em lote */ }

  if (bodyPayload.cpfCnpj) {
    const authHeader = req.headers.get('Authorization') || ''
    const jwt = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userErr } = await supabase.auth.getUser(jwt)
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: 'Não autenticado' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: usuarioRow } = await supabase.from('usuarios').select('empresa_id').eq('id', user.id).single()
    if (!usuarioRow?.empresa_id) {
      return new Response(JSON.stringify({ error: 'Usuário sem empresa vinculada' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: empresa } = await supabase.from('empresas')
      .select('id, nome, email, cnpj, plano, asaas_customer_id, asaas_subscription_id')
      .eq('id', usuarioRow.empresa_id).single()
    if (!empresa) {
      return new Response(JSON.stringify({ error: 'Empresa não encontrada' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    if (empresa.asaas_subscription_id) {
      return new Response(JSON.stringify({ error: 'Essa empresa já tem uma assinatura ativa' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const planoEscolhido = bodyPayload.plano === 'essencial' ? 'essencial' : 'pro'

    const { valor, desc } = VALOR_PLANO[planoEscolhido]
    try {
      const customer = await asaas('/customers', 'POST', {
        name: empresa.nome, email: empresa.email, cpfCnpj: bodyPayload.cpfCnpj, notificationDisabled: false,
      })
      if (!customer.id) {
        return new Response(JSON.stringify({ error: 'Falha ao criar cliente Asaas', detail: customer }), {
          status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const dueDate = new Date(); dueDate.setDate(dueDate.getDate() + 1)
      const subscription = await asaas('/subscriptions', 'POST', {
        customer: customer.id,
        billingType: 'UNDEFINED',
        value: valor,
        nextDueDate: dueDate.toISOString().split('T')[0],
        cycle: 'MONTHLY',
        description: `Fluxe BPO - ${desc}`,
        sendPaymentByPostalService: false,
      })
      if (!subscription.id) {
        return new Response(JSON.stringify({ error: 'Falha ao criar assinatura', detail: subscription }), {
          status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const payments = await asaas(`/subscriptions/${subscription.id}/payments`)
      const paymentUrl = payments.data?.[0]?.invoiceUrl || null

      await supabase.from('empresas').update({
        plano: planoEscolhido,
        cnpj: empresa.cnpj || bodyPayload.cpfCnpj,
        asaas_customer_id: customer.id,
        asaas_subscription_id: subscription.id,
        asaas_payment_url: paymentUrl,
      }).eq('id', empresa.id)

      return new Response(JSON.stringify({ success: true, customerId: customer.id, subscriptionId: subscription.id, paymentUrl }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    } catch (e) {
      return new Response(JSON.stringify({ error: String(e) }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
  }

  // ── Modo em lote: cron varrendo trials vencidos ─────────────────────────
  // Busca empresas com trial expirado sem assinatura criada.
  // Aceita um empresa_id opcional pra rodar em uma única empresa manualmente
  // (ex: suporte pedindo pra gerar o link de uma empresa específica sem
  // esperar o cron varrer todas as outras também).
  let query = supabase
    .from('empresas')
    .select('id, nome, email, plano')
    .eq('plano', 'trial')
    .lt('trial_expira_em', new Date().toISOString())
    .is('asaas_customer_id', null)
  if (bodyPayload.empresa_id) query = query.eq('id', bodyPayload.empresa_id)
  const { data: empresas, error } = await query

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
      const valor = empresa.plano === 'pro' ? 197.00 : 97.00
      const descPlano = empresa.plano === 'pro' ? 'Plano Completo' : 'Plano Essencial'

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
