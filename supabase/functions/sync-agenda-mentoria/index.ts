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

// Converte um DTSTART UTC (formato YYYYMMDDTHHMMSSZ) pra data+hora de
// Brasilia (UTC-3 fixo, sem horario de verao). Se nao tiver hora (evento
// de dia inteiro) ou nao tiver "Z" (ja em hora local), usa a data como veio.
function paraDataHoraBrasilia(dt: string): { data: string | null; horario: string | null } {
  const comHora = dt.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z)?$/)
  if (comHora) {
    const [, ano, mes, dia, hh, mm, ss, z] = comHora
    if (z) {
      const utcMs = Date.UTC(+ano, +mes - 1, +dia, +hh, +mm, +ss)
      const local = new Date(utcMs - 3 * 60 * 60 * 1000)
      const p = (n: number) => String(n).padStart(2, '0')
      return {
        data: `${local.getUTCFullYear()}-${p(local.getUTCMonth() + 1)}-${p(local.getUTCDate())}`,
        horario: `${p(local.getUTCHours())}:${p(local.getUTCMinutes())}`,
      }
    }
    return { data: `${ano}-${mes}-${dia}`, horario: `${hh}:${mm}` }
  }
  const soData = dt.match(/^(\d{4})(\d{2})(\d{2})/)
  if (soData) return { data: `${soData[1]}-${soData[2]}-${soData[3]}`, horario: null }
  return { data: null, horario: null }
}

const CONECTORES = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'a', 'o', 'as', 'os', 'em', 'no', 'na', 'nos', 'nas', 'para', 'com', 'ou', 'um', 'uma', 'que'])

function formatarPalavra(w: string, primeira: boolean): string {
  const m = w.match(/^(\p{L}+)(.*)$/u)
  if (!m) return w
  const [, letras, resto] = m
  const baixo = letras.toLowerCase()
  if (baixo === 'bpo') return 'BPO' + resto
  if (!primeira && CONECTORES.has(baixo)) return baixo + resto
  return baixo.charAt(0).toUpperCase() + baixo.slice(1) + resto
}

function tituloCaso(raw: string): string {
  // Cada trecho separado por ":" vira uma "frase" propria (maiuscula no
  // comeco), com conectores (do, e, que...) em minusculo no meio e BPO
  // sempre maiusculo, mesmo colado em pontuacao.
  return raw
    .split(':')
    .map(frase => frase.trim().toLowerCase().split(/\s+/).filter(Boolean)
      .map((w, i) => formatarPalavra(w, i === 0))
      .join(' '))
    .join(': ')
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

  const encontros: { numero: number; titulo: string; data: string; horario: string | null; link_meet: string | null }[] = []
  let atual: { summary?: string; dtstart?: string; meet?: string } | null = null
  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') atual = {}
    else if (line === 'END:VEVENT') {
      if (atual?.summary && atual?.dtstart) {
        const m = atual.summary.match(/^ENCONTRO\s+(\d+)\s+—\s+(.+)$/i)
        if (m) {
          const { data, horario } = paraDataHoraBrasilia(atual.dtstart)
          if (data) encontros.push({ numero: Number(m[1]), titulo: tituloCaso(m[2].trim()), data, horario, link_meet: atual.meet ?? null })
        }
      }
      atual = null
    } else if (atual) {
      const m = line.match(/^([A-Z-]+)(;[^:]*)?:(.*)$/)
      if (m) {
        const [, key, , val] = m
        if (key === 'SUMMARY') atual.summary = val.replace(/\\,/g, ',').replace(/\\n/gi, ' ')
        if (key === 'DTSTART') atual.dtstart = val
        if (key === 'X-GOOGLE-CONFERENCE') atual.meet = val.trim()
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
      const { error } = await supabase.from('turma_aulas').update({ titulo: enc.titulo, data: enc.data, horario: enc.horario, link_meet: enc.link_meet }).eq('id', existenteId)
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 })
      atualizados.push(enc.numero)
    } else {
      const { error } = await supabase.from('turma_aulas').insert({ turma_id: turmaId, numero: enc.numero, titulo: enc.titulo, data: enc.data, horario: enc.horario, link_meet: enc.link_meet })
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 })
      criados.push(enc.numero)
    }
  }

  return new Response(JSON.stringify({ ok: true, encontrados: encontros.length, atualizados, criados }), { status: 200 })
})
