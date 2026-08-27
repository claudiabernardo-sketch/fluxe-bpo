import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Recebe leads de sites externos dos mentorados (diagnóstico/precificação
// feitos no site deles) e cadastra automaticamente no CRM do Fluxe, na
// empresa correspondente. Público, sem verificação de JWT, o empresa_id
// funciona como o identificador da integração, o mentorado pega o dele em
// Config → Empresa e cola no formulário/site.

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

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

  const empresa_id = String(body.empresa_id || '').trim()
  const nome = String(body.nome || '').trim()
  if (!empresa_id || !nome) {
    return new Response(JSON.stringify({ error: 'empresa_id e nome são obrigatórios' }), { status: 400, headers: CORS_HEADERS })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: empresa } = await supabase.from('empresas').select('id').eq('id', empresa_id).maybeSingle()
  if (!empresa) {
    return new Response(JSON.stringify({ error: 'empresa_id não encontrado' }), { status: 404, headers: CORS_HEADERS })
  }

  const payload = {
    empresa_id,
    nome,
    email: body.email ? String(body.email).trim() : null,
    whatsapp: body.whatsapp ? String(body.whatsapp).trim() : null,
    contato: body.contato ? String(body.contato).trim() : null,
    segmento: body.segmento ? String(body.segmento).trim() : null,
    valor_estimado: body.valor_estimado ? Number(body.valor_estimado) || null : null,
    obs: body.obs ? String(body.obs).trim() : null,
    origem: body.origem ? String(body.origem).trim() : 'Site',
    etapa: 'novo',
  }

  const { data, error } = await supabase.from('leads').insert(payload).select('id').single()
  if (error) {
    console.error('[lead-site]', error)
    return new Response(JSON.stringify({ error: 'Não foi possível cadastrar o lead' }), { status: 500, headers: CORS_HEADERS })
  }

  return new Response(JSON.stringify({ ok: true, id: data.id }), { status: 200, headers: CORS_HEADERS })
})
