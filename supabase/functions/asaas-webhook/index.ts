import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Eventos do Asaas → https://asaasv3.docs.apiary.io/#introduction/notificacoes-webhook
serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  // Validar token do webhook Asaas
  const webhookToken = req.headers.get('asaas-access-token')
  const expectedToken = Deno.env.get('ASAAS_WEBHOOK_TOKEN')
  if (expectedToken && webhookToken !== expectedToken) {
    return new Response('Unauthorized', { status: 401 })
  }

  let payload: { event: string; payment?: Record<string, unknown> }
  try {
    payload = await req.json()
  } catch {
    return new Response('Bad Request', { status: 400 })
  }

  const { event, payment } = payload
  if (!event || !payment) {
    return new Response('Missing event or payment', { status: 400 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const customerId = payment.customer as string | undefined
  if (!customerId) return new Response('No customer', { status: 200 })

  // Busca empresa pelo asaas_customer_id
  const { data: empresa } = await supabase
    .from('empresas')
    .select('id, plano')
    .eq('asaas_customer_id', customerId)
    .single()

  if (!empresa) {
    console.log(`Empresa não encontrada para customer: ${customerId}`)
    return new Response('OK', { status: 200 })
  }

  const updates: Record<string, unknown> = {}

  switch (event) {
    // ── Pagamento confirmado / recebido ──────────────────────────
    case 'PAYMENT_CONFIRMED':
    case 'PAYMENT_RECEIVED': {
      // Define plano baseado no valor pago
      const valor = payment.value as number || 0
      const novoPlano = valor >= 90 ? 'pro' : 'essencial'
      updates.plano = novoPlano
      updates.asaas_last_payment_at = new Date().toISOString()
      updates.asaas_payment_url = null // limpa link pendente
      console.log(`[${event}] empresa ${empresa.id} → plano ${novoPlano}`)
      break
    }

    // ── Pagamento vencido (cobrar mas ainda não bloquear) ─────────
    case 'PAYMENT_OVERDUE': {
      if (empresa.plano !== 'bloqueado') {
        updates.plano = 'trial_expirado' // mostra aviso, não bloqueia ainda
      }
      console.log(`[PAYMENT_OVERDUE] empresa ${empresa.id}`)
      break
    }

    // ── Assinatura cancelada / deletada → bloquear ────────────────
    case 'SUBSCRIPTION_INACTIVATED':
    case 'PAYMENT_DELETED':
    case 'PAYMENT_REFUNDED': {
      updates.plano = 'bloqueado'
      console.log(`[${event}] empresa ${empresa.id} → BLOQUEADO`)
      break
    }

    default:
      console.log(`Evento não tratado: ${event}`)
  }

  if (Object.keys(updates).length > 0) {
    const { error } = await supabase
      .from('empresas')
      .update(updates)
      .eq('id', empresa.id)

    if (error) {
      console.error('Erro ao atualizar empresa:', error)
      return new Response('DB Error', { status: 500 })
    }
  }

  return new Response('OK', { status: 200 })
})
