import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Auth: pegar empresa_id do usuário
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401, headers: CORS })

    const { data: { user }, error: authErr } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
    if (authErr || !user) return new Response(JSON.stringify({ error: 'Usuário inválido' }), { status: 401, headers: CORS })

    const { data: perfil } = await supabase.from('usuarios').select('empresa_id').eq('id', user.id).single()
    if (!perfil?.empresa_id) return new Response(JSON.stringify({ error: 'Empresa não encontrada' }), { status: 400, headers: CORS })

    // Buscar token do Autentique da empresa
    const { data: empresa } = await supabase.from('empresas').select('autentique_token, nome, email').eq('id', perfil.empresa_id).single()
    if (!empresa?.autentique_token) {
      return new Response(JSON.stringify({ error: 'Token do Autentique não configurado. Vá em Configurações → Integrações.' }), { status: 400, headers: CORS })
    }

    const body = await req.json()
    const { docx_base64, filename, cliente_nome, cliente_email, proposta_id, action } = body

    // Action: test — só valida o token
    if (action === 'test') {
      const testResp = await fetch('https://api.autentique.com.br/2/graphql', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${empresa.autentique_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: '{ me { id name email } }' }),
      })
      const testData = await testResp.json()
      if (testData.errors?.length || !testData.data?.me) {
        return new Response(JSON.stringify({ error: 'Token inválido. Verifique se copiou corretamente.' }), { status: 400, headers: CORS })
      }
      return new Response(JSON.stringify({ ok: true, conta: testData.data.me.name || testData.data.me.email }), { headers: { ...CORS, 'Content-Type': 'application/json' } })
    }

    if (!docx_base64 || !cliente_email || !cliente_nome) {
      return new Response(JSON.stringify({ error: 'Dados incompletos: docx_base64, cliente_nome e cliente_email são obrigatórios' }), { status: 400, headers: CORS })
    }

    // Converter base64 para bytes
    const docxBytes = Uint8Array.from(atob(docx_base64), c => c.charCodeAt(0))
    const docxBlob = new Blob([docxBytes], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })

    // Mutation GraphQL do Autentique
    const mutation = `
      mutation CreateDocumentMutation($document: DocumentInput!, $signers: [SignerInput!]!, $file: Upload!) {
        createDocument(document: $document, signers: $signers, file: $file) {
          id
          name
          signatures {
            public_id
            name
            email
            link { short_link }
            signed_at
          }
        }
      }
    `

    const operations = JSON.stringify({
      query: mutation,
      variables: {
        document: {
          name: filename || `Contrato - ${cliente_nome}`,
          message: `Olá ${cliente_nome}, segue o contrato de prestação de serviços para sua assinatura.`,
          reminder: true,
        },
        signers: [
          { email: empresa.email, name: empresa.nome, action: 'SIGN' },
          { email: cliente_email, name: cliente_nome, action: 'SIGN' },
        ],
        file: null,
      },
    })

    const formData = new FormData()
    formData.append('operations', operations)
    formData.append('map', JSON.stringify({ '0': ['variables.file'] }))
    formData.append('0', docxBlob, filename || 'contrato.docx')

    const resp = await fetch('https://api.autentique.com.br/2/graphql', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${empresa.autentique_token}` },
      body: formData,
    })

    const result = await resp.json()

    if (result.errors?.length) {
      return new Response(JSON.stringify({ error: result.errors[0].message }), { status: 400, headers: CORS })
    }

    const doc = result.data?.createDocument
    const linkBpo = doc?.signatures?.find((s: any) => s.email === empresa.email)?.link?.short_link
    const linkCli = doc?.signatures?.find((s: any) => s.email === cliente_email)?.link?.short_link

    // Atualizar proposta se vier proposta_id
    if (proposta_id) {
      await supabase.from('propostas').update({
        autentique_id: doc.id,
        assinatura_status: 'enviado',
        assinatura_link_bpo: linkBpo,
        assinatura_link_cli: linkCli,
      }).eq('id', proposta_id)
    }

    return new Response(JSON.stringify({
      ok: true,
      autentique_id: doc.id,
      link_bpo: linkBpo,
      link_cliente: linkCli,
    }), { headers: { ...CORS, 'Content-Type': 'application/json' } })

  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: CORS })
  }
})
