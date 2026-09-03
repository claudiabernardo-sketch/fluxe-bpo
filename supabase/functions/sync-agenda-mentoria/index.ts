import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Le a agenda pessoal da Claudia (link secreto iCal, so leitura) e sincroniza
// os eventos "ENCONTRO N — TITULO" com a grade da turma que esta rodando
// (MENTORIA_TURMA_ID). So atualiza titulo/data, nunca mexe em video_url,
// material_url ou exercicio, que sao preenchidos a parte no Fluxe.
//
// Padrao esperado no titulo do evento no Google Calendar:
//   "ENCONTRO 4 — ONBOARDING: A ENTRADA DO CLIENTE"
// Eventos que nao seguem esse padrao (reunioes, outros treinamentos etc.)
// sao ignorados, ja que essa e a agenda pessoal inteira dela, nao uma
// agenda dedicada so a mentoria.

function unfoldIcs(raw: string): string[] {
  const lines = raw.split(/\r\n|\n|\r/)
  const unfolded: string[] = []
  for (const line of lines) {
    if ((line.startsWith(' ') || line.startsWith('\t')) && unfolded.length) {
      unfolded[unfolded.length - 1] += line.slice(1)
    } else {
      unfolded.push(line)
    }
  }
  return unfolded
}

function toISODate(dt: string): string | null {
  const m = dt.match(/^(\d{4})(\d{2})(\d{2})/)
  if (!m) return null
  return `${m[1]}-${m[2]}-${m[3]}`
}

function tituloCaso(raw: string): string {
  // "COMO VENDER BPO" -> "Como Vender BPO" (mantem BPO maiusculo)
  return raw
    .toLowerCase()
    .split(' ')
    .map(w => (w === 'bpo' ? 'BPO' : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(' ')
}

serve(async (req) => {
  const icalUrl = Deno.env.get('MENTORIA_ICAL_URL')
  const turmaId = Deno.env.get('MENTORIA_TURMA_ID')
  if (!icalUrl || !turmaId) {
    return new Response(JSON.stringify({ error: 'MENTORIA_ICAL_URL ou MENTORIA_TURMA_ID nao configurado' }), { status: 500 })
  }

  const icsRes = await fetch(icalUrl)
  if (!icsRes.ok) {
    return new Response(JSON.stringify({ error: `Falha ao buscar a agenda (${icsRes.status})` }), { status: 502 })
  }
  const raw = await icsRes.text()
  const lines = unfoldIcs(raw)

  const encontros: { numero: number; titulo: string; data: string }[] = []
  let atual: { summary?: string; dtstart?: string } | null = null
  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') atual = {}
    else if (line === 'END:VEVENT') {
      if (atual?.summary && atual?.dtstart) {
        const m = atual.summary.match(/^ENCONTRO\s+(\d+)\s+—\s+(.+)$/i)
        if (m) {
          const data = toISODate(atual.dtstart)
          if (data) encontros.push({ numero: Number(m[1]), titulo: tituloCaso(m[2].trim()), data })
        }
      }
      atual = null
    } else if (atual) {
      const m = line.match(/^([A-Z-]+)(;[^:]*)?:(.*)$/)
      if (m) {
        const [, key, , val] = m
        if (key === 'SUMMARY') atual.summary = val.replace(/\\,/g, ',').replace(/\\n/gi, ' ')
        if (key === 'DTSTART') atual.dtstart = val
      }
    }
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: existentes, error: selErr } = await supabase
    .from('turma_aulas')
    .select('id, numero')
    .eq('turma_id', turmaId)
  if (selErr) return new Response(JSON.stringify({ error: selErr.message }), { status: 500 })

  const porNumero = new Map((existentes ?? []).map(a => [a.numero, a.id]))
  const atualizados: number[] = []
  const criados: number[] = []

  for (const enc of encontros) {
    const existenteId = porNumero.get(enc.numero)
    if (existenteId) {
      const { error } = await supabase.from('turma_aulas').update({ titulo: enc.titulo, data: enc.data }).eq('id', existenteId)
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 })
      atualizados.push(enc.numero)
    } else {
      const { error } = await supabase.from('turma_aulas').insert({ turma_id: turmaId, numero: enc.numero, titulo: enc.titulo, data: enc.data })
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 })
      criados.push(enc.numero)
    }
  }

  return new Response(JSON.stringify({ ok: true, encontrados: encontros.length, atualizados, criados }), { status: 200 })
})
