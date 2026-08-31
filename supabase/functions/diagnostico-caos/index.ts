import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Formulario publico do Diagnostico do Caos (PlayBPO Summit). Sem login,
// qualquer participante preenche. Salva a resposta e manda um e-mail
// pra Claudia por submissao.

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

const EMAIL_DESTINO = 'empreendabpo@gmail.com'

const AREAS: [string, string][] = [
  ['onboarding', 'Onboarding de clientes'],
  ['padronizacao', 'Padronização dos processos'],
  ['distribuicao', 'Distribuição de responsabilidades'],
  ['prazos', 'Gestão de prazos'],
  ['conciliacao', 'Conciliação e conferências'],
  ['aprovacoes', 'Aprovações do cliente'],
  ['comunicacao', 'Comunicação com clientes'],
  ['erros', 'Controle de erros e retrabalho'],
  ['indicadores', 'Indicadores da operação'],
  ['capacidade', 'Capacidade para receber novos clientes'],
]

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS })
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405, headers: CORS_HEADERS })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'JSON inválido' }), { status: 400, headers: CORS_HEADERS })
  }

  const nome = String(body.nome || '').trim()
  const email = String(body.email || '').trim()
  const notas = (body.notas || {}) as Record<string, number>
  if (!nome || !email) {
    return new Response(JSON.stringify({ error: 'nome e email são obrigatórios' }), { status: 400, headers: CORS_HEADERS })
  }

  const pontuacaoTotal = AREAS.reduce((s, [key]) => s + (Number(notas[key]) || 0), 0)

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const payload = {
    nome,
    email,
    whatsapp: body.whatsapp ? String(body.whatsapp).trim() : null,
    empresa: body.empresa ? String(body.empresa).trim() : null,
    notas,
    pontuacao_total: pontuacaoTotal,
    quebraria_primeiro: body.quebraria_primeiro ? String(body.quebraria_primeiro).trim() : null,
  }

  const { error } = await supabase.from('diagnostico_caos_respostas').insert(payload)
  if (error) {
    console.error('[diagnostico-caos]', error)
    return new Response(JSON.stringify({ error: 'Não foi possível salvar' }), { status: 500, headers: CORS_HEADERS })
  }

  const resendKey = Deno.env.get('RESEND_API_KEY')
  const resendFrom = Deno.env.get('RESEND_FROM') || 'Fluxe BPO <noreply@fluxebpo.com.br>'
  if (resendKey) {
    const linhas = AREAS.map(([key, label]) => `<tr><td style="padding:4px 8px;color:#334155;">${label}</td><td style="padding:4px 8px;font-weight:700;">${notas[key] ?? '-'}</td></tr>`).join('')
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;">
        <h2 style="color:#1F2937;">Novo Diagnóstico do Caos, PlayBPO Summit</h2>
        <p><strong>Nome:</strong> ${nome}<br/>
        <strong>E-mail:</strong> ${email}<br/>
        ${payload.whatsapp ? `<strong>WhatsApp:</strong> ${payload.whatsapp}<br/>` : ''}
        ${payload.empresa ? `<strong>Empresa:</strong> ${payload.empresa}<br/>` : ''}
        <strong>Pontuação total:</strong> ${pontuacaoTotal} / 50</p>
        <table style="border-collapse:collapse;margin:16px 0;">${linhas}</table>
        ${payload.quebraria_primeiro ? `<p><strong>Se dobrasse a carteira amanhã, quebraria primeiro:</strong><br/>${payload.quebraria_primeiro}</p>` : ''}
      </div>
    `
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: resendFrom, to: [EMAIL_DESTINO], subject: `Diagnóstico do Caos: ${nome} (${pontuacaoTotal}/50)`, html }),
      })
    } catch (e) {
      console.error('[diagnostico-caos] falha ao enviar e-mail', e)
    }
  }

  return new Response(JSON.stringify({ ok: true, pontuacaoTotal }), { status: 200, headers: CORS_HEADERS })
})
