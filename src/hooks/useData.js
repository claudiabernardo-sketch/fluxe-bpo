import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { BIBLIOTECA_BPO } from '../data/bibliotecaBpo'

// ── AUDIT LOG ────────────────────────────────────────
async function logAudit(acao, tabela, registroId, detalhes = {}) {
  try {
    const empresa_id = useAuthStore.getState().empresa?.id
    const usuario_id = useAuthStore.getState().user?.id
    if (!empresa_id) return
    await supabase.from('audit_log').insert({
      acao, tabela, registro_id: String(registroId), detalhes,
      empresa_id, usuario_id,
    })
  } catch {
    // Falha no audit não deve bloquear a operação principal
  }
}

// ── CLIENTES ─────────────────────────────────────────
export function useClients() {
  const { empresa } = useAuthStore()
  return useQuery({
    queryKey: ['clients', empresa?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clientes')
        .select('*, usuarios(nome, perfil)')
        .eq('empresa_id', empresa?.id)
        .is('deleted_at', null)
        
        .order('razao_social')
        .limit(500)
      if (error) throw error
      return data ?? []
    },
    staleTime: 30_000,
    enabled: !!empresa?.id,
  })
}

export function useCreateClient() {
  const qc = useQueryClient()
  const { empresa } = useAuthStore()
  return useMutation({
    mutationFn: async (client) => {
      const { usuarios, empresas, id, criado_em, atualizado_em, ...clean } = client
      const { data, error } = await supabase
        .from('clientes').insert({ ...clean, empresa_id: empresa?.id }).select()
      if (error) throw error
      await logAudit('CREATE', 'clientes', data?.[0]?.id, { razao: clean.razao_social })
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
    onError: (err) => console.error('[Fluxe]', err),
  })
}

export function useUpdateClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }) => {
      const { usuarios, empresas, empresa_id, ...clean } = updates
      const { data, error } = await supabase
        .from('clientes').update(clean).eq('id', id).select()
      if (error) throw error
      // Quando a política de RLS barra a atualização, o Postgrest não
      // devolve "error" — só afeta 0 linhas. Sem essa checagem, isso passava
      // como sucesso silencioso: nada era salvo e ninguém via aviso nenhum.
      if (!data || data.length === 0) throw new Error('Nada foi salvo — você pode não ter permissão para editar esse cliente.')
      await logAudit('UPDATE', 'clientes', id, { id })
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
    onError: (err) => console.error('[Fluxe]', err),
  })
}

export function useDeleteClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      // Soft delete — preserva histórico e permite recuperação
      const { error } = await supabase
        .from('clientes')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
      await logAudit('DELETE', 'clientes', id)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
    onError: (err) => console.error('[Fluxe]', err),
  })
}

// ── TAREFAS ──────────────────────────────────────────
export function useTasks(filters = {}) {
  const { empresa } = useAuthStore()
  return useQuery({
    queryKey: ['tasks', empresa?.id, filters],
    queryFn: async () => {
      let q = supabase
        .from('tarefas')
        .select('*, clientes(razao_social, fantasia), usuarios!tarefas_responsavel_id_fkey(nome)')
        .eq('empresa_id', empresa?.id)
       .is('deleted_at', null)
        .order('data_execucao', { ascending: true, nullsFirst: false })
        .order('prazo', { ascending: true, nullsFirst: false })
        .limit(500)

      if (filters.clientId) q = q.eq('cliente_id', filters.clientId)
      if (filters.status)   q = q.eq('status', filters.status)
      if (filters.resp)     q = q.eq('responsavel_id', filters.resp)

      const { data, error } = await q
      if (error) throw error
      return data ?? []
    },
    staleTime: 15_000,
    enabled: !!empresa?.id,
  })
}

export function useCreateTask() {
  const qc = useQueryClient()
  const { empresa } = useAuthStore()
  return useMutation({
    mutationFn: async (task) => {
      const { data, error } = await supabase
        .from('tarefas').insert({ ...task, empresa_id: empresa?.id }).select()
      if (error) throw error
      await logAudit('CREATE', 'tarefas', data?.[0]?.id, { titulo: task.titulo })
      return data?.[0]
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
    onError: (err) => console.error('[Fluxe]', err),
  })
}

export function useUpdateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }) => {
      const { data, error } = await supabase
        .from('tarefas').update({ ...updates, atualizado_em: new Date().toISOString() })
        .eq('id', id).select()
      if (error) throw error
      await logAudit('UPDATE', 'tarefas', id, updates)
      return data
    },
    // Optimistic update: atualiza o cache local imediatamente sem esperar
    // o re-fetch do banco -- a tarefa some/muda na hora que o usuário clica
    onMutate: async ({ id, ...updates }) => {
      await qc.cancelQueries({ queryKey: ['tasks'] })
      const prev = qc.getQueriesData({ queryKey: ['tasks'] })
      qc.setQueriesData({ queryKey: ['tasks'] }, (old) =>
        Array.isArray(old) ? old.map(t => t.id === id ? { ...t, ...updates } : t) : old
      )
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) ctx.prev.forEach(([key, val]) => qc.setQueryData(key, val))
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })
}

export function useDeleteTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      // Soft delete — preserva histórico e permite recuperação
      const { error } = await supabase
        .from('tarefas')
        .update({ deleted_at: new Date().toISOString(), atualizado_em: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
      await logAudit('DELETE', 'tarefas', id)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
    onError: (err) => console.error('[Fluxe]', err),
  })
}

// ── TAREFA MODELOS ───────────────────────────────────
export function useTarefaModelos() {
  const { empresa } = useAuthStore()
  return useQuery({
    queryKey: ['tarefa_modelos', empresa?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tarefa_modelos')
        .select('*, clientes(razao_social, fantasia)')
        .eq('empresa_id', empresa?.id)
        .eq('ativo', true) // soft delete — não exibe modelos desativados
        .order('titulo')
      if (error) throw error
      return data ?? []
    },
    staleTime: 30_000,
    enabled: !!empresa?.id,
  })
}

export function useCreateModelo() {
  const qc = useQueryClient()
  const { empresa } = useAuthStore()
  return useMutation({
    mutationFn: async (modelo) => {
      const { data, error } = await supabase
        .from('tarefa_modelos').insert({ ...modelo, empresa_id: empresa?.id }).select()
      if (error) throw error
      return data?.[0]
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tarefa_modelos'] }),
    onError: (err) => console.error('[Fluxe]', err),
  })
}

export function useUpdateModelo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }) => {
      const { data, error } = await supabase
        .from('tarefa_modelos').update({ ...updates, atualizado_em: new Date().toISOString() })
        .eq('id', id).select()
      if (error) throw error
      return data?.[0]
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tarefa_modelos'] }),
    onError: (err) => console.error('[Fluxe]', err),
  })
}

export function useDeleteModelo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      // Soft delete — desativa o modelo sem apagar histórico de tarefas geradas
      const { error } = await supabase
        .from('tarefa_modelos')
        .update({ ativo: false, atualizado_em: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
      await logAudit('DELETE', 'tarefa_modelos', id)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tarefa_modelos'] }),
    onError: (err) => console.error('[Fluxe]', err),
  })
}

// Importa a Biblioteca BPO (50 modelos prontos, comercial → encerramento) pra
// empresa logada — só insere os que ainda não existem (por título), pra
// permitir rodar de novo sem duplicar depois que a biblioteca for ampliada.
export function useImportarBibliotecaModelos() {
  const qc = useQueryClient()
  const { empresa } = useAuthStore()
  return useMutation({
    mutationFn: async () => {
      const { data: existentes, error: errExist } = await supabase
        .from('tarefa_modelos').select('titulo').eq('empresa_id', empresa?.id)
      if (errExist) throw errExist
      const titulosExistentes = new Set((existentes || []).map(m => m.titulo))
      const novos = BIBLIOTECA_BPO.filter(m => !titulosExistentes.has(m.titulo))
      if (novos.length === 0) return { importados: 0, jaExistiam: BIBLIOTECA_BPO.length }
      const { error } = await supabase.from('tarefa_modelos')
        .insert(novos.map(m => ({ ...m, empresa_id: empresa?.id })))
      if (error) throw error
      return { importados: novos.length, jaExistiam: BIBLIOTECA_BPO.length - novos.length }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tarefa_modelos'] }),
    onError: (err) => console.error('[Fluxe]', err),
  })
}

// ── LEADS (CRM) ──────────────────────────────────────
export function useLeads() {
  const { empresa } = useAuthStore()
  return useQuery({
    queryKey: ['leads', empresa?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('empresa_id', empresa?.id)
        .order('criado_em', { ascending: false })
        .limit(300)
      if (error) throw error
      return data ?? []
    },
    staleTime: 30_000,
    enabled: !!empresa?.id,
  })
}

export function useCreateLead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (lead) => {
      const empresa_id = useAuthStore.getState().empresa?.id
      if (!empresa_id) throw new Error('Sessão inválida. Faça login novamente.')
      const { data, error } = await supabase
        .from('leads').insert({ ...lead, empresa_id }).select()
      if (error) throw error
      return data?.[0]
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leads'] }),
    onError: (err) => console.error('[Fluxe]', err),
  })
}

export function useUpdateLead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }) => {
      const { error } = await supabase
        .from('leads').update(updates).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leads'] }),
    onError: (err) => console.error('[Fluxe]', err),
  })
}

// Interações/atividades do lead são apagadas junto (ON DELETE CASCADE). Se o
// lead tiver proposta gerada, o banco recusa o delete (FK sem cascade) — de
// propósito, pra não sumir um documento comercial sem querer.
export function useDeleteLead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('leads').delete().eq('id', id)
      if (error) {
        if (error.code === '23503') throw new Error('Esse lead tem proposta(s) gerada(s) e não pode ser excluído — para manter o histórico comercial.')
        throw error
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leads'] }),
    onError: (err) => console.error('[Fluxe]', err),
  })
}

export function useConvertLeadToClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (lead) => {
      const empresa_id = useAuthStore.getState().empresa?.id
      if (!empresa_id) throw new Error('Sessão inválida. Faça login novamente.')

      // Payload mínimo — só colunas confirmadas na tabela clientes
      const payload = {
        empresa_id,
        razao_social: lead.nome,
        status:       'ativo',
        etapa:        'operacional',
        contato:      lead.contato  || '',
        whatsapp:     lead.whatsapp || '',
        segmento:     lead.segmento || '',
        valor_mrr:    lead.valor_estimado || 0,
      }

      // Colunas opcionais — só envia se existirem no lead
      if (lead.fantasia) payload.fantasia = lead.fantasia

      const cnpjDigits = (lead.cnpj || '').replace(/\D/g, '')
      if (cnpjDigits) payload.cnpj = cnpjDigits

      const { error: insertError } = await supabase
        .from('clientes')
        .insert(payload)
      if (insertError) throw insertError

      const { error: updateError } = await supabase
        .from('leads')
        .update({ etapa: 'convertido' })
        .eq('id', lead.id)
      if (updateError) throw updateError
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clients'] })
      qc.invalidateQueries({ queryKey: ['leads'] })
    },
  })
}

// ── PENDÊNCIAS ───────────────────────────────────────
export function usePendencias(filters = {}) {
  const { empresa } = useAuthStore()
  return useQuery({
    queryKey: ['pendencias', empresa?.id, filters],
    queryFn: async () => {
      let q = supabase
        .from('pendencias')
        .select('*, clientes(razao_social, fantasia), usuarios(nome)')
        .eq('empresa_id', empresa?.id)
        .order('prazo_cobranca', { ascending: true })
        .limit(500)

      if (filters.status) q = q.eq('status', filters.status)
      if (filters.clientId) q = q.eq('cliente_id', filters.clientId)

      const { data, error } = await q
      if (error) throw error
      return data ?? []
    },
    staleTime: 30_000,
    enabled: !!empresa?.id,
  })
}

export function useCreatePendencia() {
  const qc = useQueryClient()
  const { empresa } = useAuthStore()
  return useMutation({
    mutationFn: async (pend) => {
      const { data, error } = await supabase
        .from('pendencias').insert({ ...pend, empresa_id: empresa?.id }).select()
      if (error) throw error
      return data?.[0]
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pendencias'] }),
    onError: (err) => console.error('[Fluxe]', err),
  })
}

export function useUpdatePendencia() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }) => {
      const { data, error } = await supabase
        .from('pendencias').update(updates).eq('id', id).select()
      if (error) throw error
      return data?.[0]
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pendencias'] }),
    onError: (err) => console.error('[Fluxe]', err),
  })
}

// ── APONTAMENTOS (TIMER) ─────────────────────────────
export function useApontamentos(filters = {}) {
  const { empresa } = useAuthStore()
  return useQuery({
    queryKey: ['apontamentos', empresa?.id, filters],
    queryFn: async () => {
      // Limitar a 6 meses de histórico + max 300 registros para evitar sobrecarga
      const seisM = new Date()
      seisM.setMonth(seisM.getMonth() - 6)

      let q = supabase
        .from('apontamentos')
        .select('*, clientes(razao_social, fantasia), tarefas(titulo, categoria), usuarios(nome)')
        .eq('empresa_id', empresa?.id)
        .gte('inicio', seisM.toISOString())
        .order('inicio', { ascending: false })
        .limit(300)

      if (filters.clientId) q = q.eq('cliente_id', filters.clientId)
      if (filters.userId)   q = q.eq('usuario_id', filters.userId)

      const { data, error } = await q
      if (error) throw error
      return data ?? []
    },
    staleTime: 30_000,
    enabled: !!empresa?.id,
  })
}

// Mesma fonte de dados, mas filtrada pelo mês corrente — usada em telas que
// comparam horas com uma meta mensal (Rentabilidade, Capacidade, Executivo),
// pra não misturar 6 meses de hora com 1 mês de receita/capacidade.
export function useApontamentosMes(filters = {}) {
  const { empresa } = useAuthStore()
  return useQuery({
    queryKey: ['apontamentos_mes', empresa?.id, filters],
    queryFn: async () => {
      const inicioMes = new Date()
      inicioMes.setDate(1)
      inicioMes.setHours(0, 0, 0, 0)

      let q = supabase
        .from('apontamentos')
        .select('*, clientes(razao_social, fantasia), tarefas(titulo, categoria), usuarios(nome)')
        .eq('empresa_id', empresa?.id)
        .gte('inicio', inicioMes.toISOString())
        .order('inicio', { ascending: false })
        .limit(1000)

      if (filters.clientId) q = q.eq('cliente_id', filters.clientId)
      if (filters.userId)   q = q.eq('usuario_id', filters.userId)

      const { data, error } = await q
      if (error) throw error
      return data ?? []
    },
    staleTime: 30_000,
    enabled: !!empresa?.id,
  })
}

// ── RADAR SCORES (calculado server-side pela Edge Function radar-calcular,
// 1x/dia via cron) — telas leem o snapshot pronto em vez de recalcular.
// Cliente sem snapshot ainda (empresa nova, cron não rodou hoje) cai no
// cálculo client-side existente em radar.js — ver uso em ClientePage/
// InsightsDash/ExecPage.
export function useRadarScores() {
  const { empresa } = useAuthStore()
  return useQuery({
    queryKey: ['radar_scores_ultimo', empresa?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('radar_scores_ultimo')
        .select('cliente_id, score, semaforo, areas, areas_calculadas, calculado_em')
        .eq('empresa_id', empresa?.id)
      if (error) throw error
      return data ?? []
    },
    staleTime: 5 * 60_000,
    enabled: !!empresa?.id,
  })
}

export function useRadarScore(clienteId) {
  return useQuery({
    queryKey: ['radar_score_ultimo', clienteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('radar_scores_ultimo')
        .select('score, semaforo, areas, areas_calculadas, calculado_em')
        .eq('cliente_id', clienteId)
        .maybeSingle()
      if (error) throw error
      return data ?? null
    },
    staleTime: 5 * 60_000,
    enabled: !!clienteId,
  })
}

export function useRadarScoreHistorico(clienteId, limite = 6) {
  return useQuery({
    queryKey: ['radar_score_historico', clienteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('radar_scores')
        .select('score, semaforo, calculado_em')
        .eq('cliente_id', clienteId)
        .order('calculado_em', { ascending: false })
        .limit(limite)
      if (error) throw error
      return data ?? []
    },
    staleTime: 60_000,
    enabled: !!clienteId,
    retry: false,
  })
}

export function useRadarCalcLogUltimo() {
  return useQuery({
    queryKey: ['radar_calc_log_ultimo'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('radar_calc_logs')
        .select('*')
        .order('executado_em', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (error) throw error
      return data ?? null
    },
    staleTime: 60_000,
  })
}

export function useRecalcularRadar() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('radar-calcular', {
        headers: { 'x-trigger': 'manual' },
        body: { trigger: 'manual' },
      })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['radar_calc_log_ultimo'] })
      qc.invalidateQueries({ queryKey: ['radar_scores_ultimo'] })
      qc.invalidateQueries({ queryKey: ['radar_alertas'] })
    },
  })
}

// ── RADAR ALERTAS ────────────────────────────────────
export function useRadarAlertas() {
  const { empresa } = useAuthStore()
  return useQuery({
    queryKey: ['radar_alertas', empresa?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('radar_alertas')
        .select('*, clientes(razao_social, fantasia)')
        .eq('empresa_id', empresa?.id)
        .eq('visto', false)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data ?? []
    },
    staleTime: 60_000,
    enabled: !!empresa?.id,
  })
}

export function useMarcarAlertaVisto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('radar_alertas').update({ visto: true }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['radar_alertas'] }),
  })
}

// ── AJUSTES MANUAIS DO RADAR ─────────────────────────
// Sobrepõe o cálculo automático de qualquer área (inclusive "sem dado")
// quando quem opera o cliente sabe da situação real.
export function useRadarAjustesManuais(clienteId) {
  return useQuery({
    queryKey: ['radar_ajustes', clienteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('radar_ajustes_manuais')
        .select('*, usuarios(nome)')
        .eq('cliente_id', clienteId)
      if (error) throw error
      return data ?? []
    },
    staleTime: 30_000,
    enabled: !!clienteId,
  })
}

export function useRadarAjustesManuaisTodos() {
  const { empresa } = useAuthStore()
  return useQuery({
    queryKey: ['radar_ajustes_todos', empresa?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('radar_ajustes_manuais')
        .select('*, usuarios(nome)')
        .eq('empresa_id', empresa?.id)
      if (error) throw error
      return data ?? []
    },
    staleTime: 60_000,
    enabled: !!empresa?.id,
  })
}

export function useSalvarAjusteManual() {
  const qc = useQueryClient()
  const { empresa, user } = useAuthStore()
  return useMutation({
    mutationFn: async ({ clienteId, area, status, observacao }) => {
      const { data, error } = await supabase
        .from('radar_ajustes_manuais')
        .upsert({
          empresa_id: empresa?.id,
          cliente_id: clienteId,
          area,
          status,
          observacao: observacao || null,
          criado_por: user?.id,
          criado_em: new Date().toISOString(),
          expira_em: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        }, { onConflict: 'cliente_id,area' })
        .select()
      if (error) throw error
      return data?.[0]
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['radar_ajustes', vars.clienteId] })
      qc.invalidateQueries({ queryKey: ['radar_ajustes_todos'] })
    },
  })
}

export function useRemoverAjusteManual() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, clienteId }) => {
      const { error } = await supabase.from('radar_ajustes_manuais').delete().eq('id', id)
      if (error) throw error
      return clienteId
    },
    onSuccess: (clienteId) => {
      qc.invalidateQueries({ queryKey: ['radar_ajustes', clienteId] })
      qc.invalidateQueries({ queryKey: ['radar_ajustes_todos'] })
    },
  })
}

// ── MÉTRICAS MENSAIS DO RADAR ─────────────────────────
// Números reais do mês (quanto recebeu, quanto pagou, saldo em caixa) —
// quando preenchidos, o Radar calcula Recebíveis/Pagtos/Fluxo de Caixa/Caixa
// a partir deles em vez do proxy de tarefa em dia.
function mesReferenciaAtual() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}
export { mesReferenciaAtual }

export function useRadarMetricaMes(clienteId) {
  return useQuery({
    queryKey: ['radar_metrica_mes', clienteId, mesReferenciaAtual()],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('radar_metricas_mensais')
        .select('*')
        .eq('cliente_id', clienteId)
        .eq('mes_referencia', mesReferenciaAtual())
        .maybeSingle()
      if (error) throw error
      return data ?? null
    },
    staleTime: 30_000,
    enabled: !!clienteId,
    retry: false, // tabela pode ainda não existir (migração não rodada) — falha rápido em vez de re-tentar
  })
}

export function useRadarMetricasMesTodos() {
  const { empresa } = useAuthStore()
  return useQuery({
    queryKey: ['radar_metricas_mes_todos', empresa?.id, mesReferenciaAtual()],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('radar_metricas_mensais')
        .select('*')
        .eq('empresa_id', empresa?.id)
        .eq('mes_referencia', mesReferenciaAtual())
      if (error) throw error
      return data ?? []
    },
    staleTime: 60_000,
    enabled: !!empresa?.id,
  })
}

export function useSalvarMetricaMes() {
  const qc = useQueryClient()
  const { empresa, user } = useAuthStore()
  return useMutation({
    mutationFn: async ({ clienteId, valor_a_receber, valor_recebido, valor_a_pagar, valor_pago, saldo_caixa, observacao }) => {
      const { data, error } = await supabase
        .from('radar_metricas_mensais')
        .upsert({
          empresa_id: empresa?.id,
          cliente_id: clienteId,
          mes_referencia: mesReferenciaAtual(),
          valor_a_receber, valor_recebido, valor_a_pagar, valor_pago, saldo_caixa, observacao,
          atualizado_por: user?.id,
          atualizado_em: new Date().toISOString(),
        }, { onConflict: 'cliente_id,mes_referencia' })
        .select()
      if (error) throw error
      return data?.[0]
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['radar_metrica_mes', vars.clienteId] })
      qc.invalidateQueries({ queryKey: ['radar_metricas_mes_todos'] })
      qc.invalidateQueries({ queryKey: ['radar_metricas_historico', vars.clienteId] })
    },
  })
}

// ── PROJEÇÃO DE TAREFAS FUTURAS ───────────────────────
// O gerador de tarefas só cria a tarefa do dia, não existe tarefa "de
// amanhã" já no banco — por isso "Próximos 7/30 dias" não pode contar
// tarefas reais, precisa simular a recorrência (via gerar-tarefas em
// dry_run, sem escrever nada) pra saber quantas VÃO existir.
export function useProjecaoTarefas(dataInicio, dataFim) {
  const { empresa } = useAuthStore()
  return useQuery({
    queryKey: ['projecao_tarefas', empresa?.id, dataInicio, dataFim],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/projetar-tarefas`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ data_inicio: dataInicio, data_fim: dataFim }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      return data.total ?? 0
    },
    staleTime: 5 * 60_000,
    enabled: !!empresa?.id && !!dataInicio && !!dataFim,
    retry: false,
  })
}

export function useRadarMetricasHistorico(clienteId, limite = 6) {
  return useQuery({
    queryKey: ['radar_metricas_historico', clienteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('radar_metricas_mensais')
        .select('*')
        .eq('cliente_id', clienteId)
        .lt('mes_referencia', mesReferenciaAtual())
        .order('mes_referencia', { ascending: false })
        .limit(limite)
      if (error) throw error
      return data ?? []
    },
    staleTime: 60_000,
    enabled: !!clienteId,
    retry: false,
  })
}

// ── ONBOARDING DO CLIENTE ─────────────────────────────
export function useClienteOnboarding(clienteId) {
  return useQuery({
    queryKey: ['cliente_onboarding', clienteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cliente_onboarding')
        .select('*')
        .eq('cliente_id', clienteId)
        .maybeSingle()
      if (error) throw error
      return data
    },
    enabled: !!clienteId,
    staleTime: 15_000,
  })
}

export function useSalvarOnboarding() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ clienteId, objetivos, responsabilidades_nossas, responsabilidades_cliente, canal_comunicacao, erp_usado, email_padrao }) => {
      const { data, error } = await supabase
        .from('cliente_onboarding')
        .upsert({
          cliente_id: clienteId,
          objetivos, responsabilidades_nossas, responsabilidades_cliente,
          canal_comunicacao: canal_comunicacao || null,
          erp_usado: erp_usado || null,
          email_padrao: email_padrao || null,
          atualizado_em: new Date().toISOString(),
        }, { onConflict: 'cliente_id' })
        .select()
      if (error) throw error
      return data?.[0]
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['cliente_onboarding', vars.clienteId] }),
  })
}

// ── DIAGNÓSTICO FINANCEIRO PÚBLICO (link sem login pro cliente preencher) ──
// Passa pela Edge Function diagnostico-cliente (service role) porque o
// cliente não tem conta no Fluxe — nunca lê/escreve direto na tabela.
export function useDiagnosticoClientePublico(clienteId) {
  return useQuery({
    queryKey: ['diagnostico_cliente_publico', clienteId],
    queryFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/diagnostico-cliente`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get', cliente_id: clienteId }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      return data
    },
    enabled: !!clienteId,
    staleTime: 0,
  })
}

export function useSalvarDiagnosticoClientePublico() {
  return useMutation({
    mutationFn: async ({ clienteId, ...campos }) => {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/diagnostico-cliente`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'salvar', cliente_id: clienteId, ...campos }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      return data
    },
  })
}

export function useSaveApontamento() {
  const qc = useQueryClient()
  const { empresa } = useAuthStore()
  return useMutation({
    mutationFn: async (ap) => {
      const { data, error } = await supabase
        .from('apontamentos').insert({ ...ap, empresa_id: empresa?.id }).select()
      if (error) throw error
      await logAudit('CREATE', 'apontamentos', data?.[0]?.id, { segundos: ap.segundos })
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['apontamentos'] }),
    onError: (err) => console.error('[Fluxe]', err),
  })
}

// Corrige um apontamento existente — usado quando o usuário esquece o timer
// ligado e o lançamento fica com horas absurdas. Recalcula 'segundos' a
// partir de inicio/fim pra não deixar os dois campos fora de sincronia.
export function useUpdateApontamento() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, inicio, fim }) => {
      const segundos = Math.max(0, Math.round((new Date(fim) - new Date(inicio)) / 1000))
      const { data, error } = await supabase
        .from('apontamentos').update({ inicio, fim, segundos }).eq('id', id).select()
      if (error) throw error
      await logAudit('UPDATE', 'apontamentos', id, { segundos })
      return data?.[0]
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['apontamentos'] })
      qc.invalidateQueries({ queryKey: ['apontamentos_mes'] })
      qc.invalidateQueries({ queryKey: ['my-horas'] })
    },
    onError: (err) => console.error('[Fluxe]', err),
  })
}

export function useDeleteApontamento() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('apontamentos').delete().eq('id', id)
      if (error) throw error
      await logAudit('DELETE', 'apontamentos', id)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['apontamentos'] })
      qc.invalidateQueries({ queryKey: ['apontamentos_mes'] })
      qc.invalidateQueries({ queryKey: ['my-horas'] })
    },
    onError: (err) => console.error('[Fluxe]', err),
  })
}

// ── APROVAÇÕES ───────────────────────────────────────
// ── USUÁRIOS DA EMPRESA ───────────────────────────────
export function useUsuarios() {
  const { empresa } = useAuthStore()
  return useQuery({
    queryKey: ['usuarios', empresa?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('empresa_id', empresa?.id)
        .eq('ativo', true)
        .order('nome')
        .limit(100)
      if (error) throw error
      return data ?? []
    },
    staleTime: 60_000, // equipe muda pouco — cache mais longo
    enabled: !!empresa?.id,
  })
}

// ── ACESSOS (COFRE) ───────────────────────────────────
export function useAcessos(clienteId) {
  const { empresa } = useAuthStore()
  return useQuery({
    queryKey: ['acessos', empresa?.id, clienteId],
    queryFn: async () => {
      // Filtra por cliente_id (que pertence à empresa via RLS) +
      // filtro explícito extra via JOIN para defesa em camadas
      const { data, error } = await supabase
        .from('acessos')
        .select('*, clientes!inner(empresa_id)')
        .eq('cliente_id', clienteId)
        .eq('clientes.empresa_id', empresa?.id)
        .order('sistema')
        .limit(200)
      if (error) throw error
      return data ?? []
    },
    enabled: !!clienteId && !!empresa?.id,
    staleTime: 30_000,
  })
}

export function useSaveAcesso() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (acesso) => {
      const { data, error } = acesso.id
        ? await supabase.from('acessos').update(acesso).eq('id', acesso.id).select()
        : await supabase.from('acessos').insert(acesso).select()
      if (error) throw error
      return data?.[0]
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['acessos'] }),
    onError: (err) => console.error('[Fluxe]', err),
  })
}

export function useDeleteAcesso() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('acessos').delete().eq('id', id)
      if (error) throw error
      await logAudit('DELETE', 'acessos', id)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['acessos'] }),
    onError: (err) => console.error('[Fluxe]', err),
  })
}

// ── ROTINAS ───────────────────────────────────────────
export function useRotinas(clienteId) {
  const { empresa } = useAuthStore()
  return useQuery({
    queryKey: ['rotinas', empresa?.id, clienteId],
    queryFn: async () => {
      let q = supabase
        .from('rotinas')
        .select('*, clientes(razao_social, fantasia)')
        .eq('empresa_id', empresa?.id)
        .eq('ativo', true) // soft delete — não exibe rotinas desativadas
        .order('titulo')
      if (clienteId) q = q.eq('cliente_id', clienteId)
      const { data, error } = await q
      if (error) throw error
      return data ?? []
    },
    staleTime: 30_000,
    enabled: !!empresa?.id,
  })
}

export function useCreateRotina() {
  const qc = useQueryClient()
  const { empresa } = useAuthStore()
  return useMutation({
    mutationFn: async (rotina) => {
      const { data, error } = await supabase
        .from('rotinas').insert({ ...rotina, empresa_id: empresa?.id }).select()
      if (error) throw error
      await logAudit('CREATE', 'rotinas', data?.[0]?.id, { titulo: rotina.titulo })
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rotinas'] }),
    onError: (err) => console.error('[Fluxe]', err),
  })
}

export function useUpdateRotina() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }) => {
      const { data, error } = await supabase
        .from('rotinas').update(updates).eq('id', id).select()
      if (error) throw error
      return data?.[0]
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rotinas'] }),
    onError: (err) => console.error('[Fluxe]', err),
  })
}

export function useDeleteRotina() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      // Soft delete — desativa a rotina sem apagar histórico de execuções
      const { error } = await supabase
        .from('rotinas')
        .update({ ativo: false })
        .eq('id', id)
      if (error) throw error
      await logAudit('DELETE', 'rotinas', id)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rotinas'] }),
    onError: (err) => console.error('[Fluxe]', err),
  })}
// ── CLIENTE MODELOS (vínculos) ────────────────────────────────────
export function useClienteModelos(clienteId) {
  return useQuery({
    queryKey: ['cliente_modelos', clienteId],
    queryFn: async () => {
      if (!clienteId) return []
      const { data, error } = await supabase
        .from('cliente_modelos')
        .select(`
          *,
          tarefa_modelos(id, titulo, categoria, recorrencia, prioridade, dia_mes, dias_semana, checklist_items)
        `)
        .eq('cliente_id', clienteId)
        .eq('ativo', true)
      if (error) throw error
      return data ?? []
    },
    enabled: !!clienteId,
  })
}

// Ativa a rotina de um cliente (status_operacional='operacional' +
// operacao_iniciada_em=hoje) e dispara a geração de tarefas do dia — usada
// tanto ao vincular o primeiro modelo (automático) quanto pelo botão manual
// de correção (cliente com modelo(s) já vinculado(s) de antes dessa
// automação existir, que por isso nunca ativou sozinho).
// toLocaleDateString('en-CA'), não toISOString() — à noite no horário de
// Brasília (BRT = UTC-3) o toISOString() já está em UTC do dia seguinte, e o
// gerar-tarefas (que calcula "hoje" em BRT) bloqueia a geração porque vê
// operacao_iniciada_em como "no futuro" em relação à data pedida.
async function ativarOperacaoCliente(clienteId, empresaId, motivo) {
  const hoje = new Date().toLocaleDateString('en-CA')
  await supabase.from('clientes').update({ status_operacional: 'operacional', operacao_iniciada_em: hoje }).eq('id', clienteId)
  await logAudit('UPDATE', 'clientes', clienteId, { status_operacional: 'operacional', operacao_iniciada_em: hoje, motivo })
  fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gerar-tarefas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
    body: JSON.stringify({ cliente_id: clienteId, empresa_id: empresaId, data_inicio: hoje, data_fim: hoje }),
  }).catch(() => {})
}

// Vincular modelo a um cliente. Se for o primeiro vínculo do cliente (ainda
// "em configuração"), ativa a operação automaticamente — não faz sentido
// pedir um clique manual separado em "Iniciar Operação" se a pessoa já está
// aqui montando a rotina do cliente. "Pausar" continua manual, pra quando
// alguém quiser deliberadamente suspender um cliente já operacional.
export function useVincularModelo() {
  const qc = useQueryClient()
  const { empresa } = useAuthStore()
  return useMutation({
    mutationFn: async ({ clienteId, modeloId }) => {
      const { data, error } = await supabase
        .from('cliente_modelos')
        .upsert({
          cliente_id: clienteId,
          modelo_id: modeloId,
          empresa_id: empresa?.id,
          ativo: true,
        }, { onConflict: 'cliente_id,modelo_id' })
        .select()
      if (error) throw error

      const { data: cliente } = await supabase.from('clientes').select('status_operacional').eq('id', clienteId).single()
      if (cliente && cliente.status_operacional !== 'operacional') {
        await ativarOperacaoCliente(clienteId, empresa?.id, 'ativação automática ao vincular modelo')
      }

      return data?.[0]
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['cliente_modelos', vars.clienteId] })
      qc.invalidateQueries({ queryKey: ['clients'] })
      qc.invalidateQueries({ queryKey: ['tasks'] })
    },
    onError: (err) => console.error('[Fluxe]', err),
  })
}

// Correção manual pra clientes que já têm modelo(s) vinculado(s) mas ficaram
// presos em "Em Configuração" — normalmente dados de antes da ativação
// automática existir, quando o vínculo nunca disparou essa lógica.
export function useAtivarOperacaoManual() {
  const qc = useQueryClient()
  const { empresa } = useAuthStore()
  return useMutation({
    mutationFn: async ({ clienteId }) => {
      await ativarOperacaoCliente(clienteId, empresa?.id, 'ativação manual — cliente já tinha modelo vinculado mas rotina não tinha ativado')
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clients'] })
      qc.invalidateQueries({ queryKey: ['tasks'] })
    },
    onError: (err) => console.error('[Fluxe]', err),
  })
}

export function useDesvincularModelo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, clienteId }) => {
      const { error } = await supabase
        .from('cliente_modelos')
        .update({ ativo: false })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['cliente_modelos', vars.clienteId] }),
    onError: (err) => console.error('[Fluxe]', err),
  })
}

// Atualizar campos de override do vínculo (sem alterar o modelo original)
export function useUpdateClienteModelo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, clienteId, ...updates }) => {
      const { data, error } = await supabase
        .from('cliente_modelos')
        .update(updates)
        .eq('id', id)
        .select()
      if (error) throw error
      await logAudit('UPDATE', 'cliente_modelos', id, { campos: Object.keys(updates) })
      return data?.[0]
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['cliente_modelos', vars.clienteId] }),
    onError: (err) => console.error('[Fluxe]', err),
  })
}

// Pausar / reativar um modelo vinculado
export function useTogglePauseModelo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, clienteId, pausado }) => {
      const { data, error } = await supabase
        .from('cliente_modelos')
        .update({ pausado, pausado_em: pausado ? new Date().toISOString() : null })
        .eq('id', id)
        .select()
      if (error) throw error
      await logAudit('UPDATE', 'cliente_modelos', id, { pausado })
      return data?.[0]
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['cliente_modelos', vars.clienteId] }),
    onError: (err) => console.error('[Fluxe]', err),
  })
}

// ── STATUS OPERACIONAL DO CLIENTE ─────────────────────
export function useUpdateClienteStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status_operacional }) => {
      const { data, error } = await supabase
        .from('clientes')
        .update({ status_operacional })
        .eq('id', id)
        .select()
      if (error) throw error
      await logAudit('UPDATE', 'clientes', id, { status_operacional })
      return data?.[0]
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
    onError: (err) => console.error('[Fluxe]', err),
  })
}

// ── GERENCIAR GERAÇÃO DE TAREFAS ──────────────────────
// Chama a Edge Function manualmente com parâmetros flexíveis
export function useGerarTarefas() {
  const qc = useQueryClient()
  const { empresa } = useAuthStore()
  return useMutation({
    mutationFn: async ({ clienteId, dataInicio, dataFim, data, dryRun } = {}) => {
      const body = { empresa_id: empresa?.id }
      if (clienteId)  body.cliente_id  = clienteId
      if (dryRun)     body.dry_run     = true
      if (data)       body.data        = data
      if (dataInicio) body.data_inicio = dataInicio
      if (dataFim)    body.data_fim    = dataFim

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gerar-tarefas`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify(body),
        }
      )
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error ?? `HTTP ${res.status}`)
      }
      return res.json()
    },
    onSuccess: (_, vars) => {
      if (!vars?.dryRun) qc.invalidateQueries({ queryKey: ['tasks'] })
    },
    onError: (err) => console.error('[Fluxe]', err),
  })
}

// ── FERIADOS ──────────────────────────────────────────
export function useFeriados() {
  const { empresa } = useAuthStore()
  return useQuery({
    queryKey: ['feriados', empresa?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feriados')
        .select('*')
        .eq('empresa_id', empresa?.id)
        .order('data')
        .limit(500)
      if (error) throw error
      return data ?? []
    },
    staleTime: 5 * 60_000, // muda raramente — cache mais longo
    enabled: !!empresa?.id,
  })
}

export function useCreateFeriado() {
  const qc = useQueryClient()
  const { empresa } = useAuthStore()
  return useMutation({
    mutationFn: async ({ data, descricao }) => {
      const { data: row, error } = await supabase
        .from('feriados').insert({ data, descricao, empresa_id: empresa?.id }).select()
      if (error) throw error
      return row
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['feriados'] }),
    onError: (err) => console.error('[Fluxe]', err),
  })
}

export function useDeleteFeriado() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('feriados').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['feriados'] }),
    onError: (err) => console.error('[Fluxe]', err),
  })
}

// ── INTERAÇÕES DE LEAD (linha do tempo) ──────────────────────
export function useLeadInteracoes(leadId) {
  const { empresa } = useAuthStore()
  return useQuery({
    queryKey: ['lead_interacoes', leadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lead_interacoes')
        .select('*')
        .eq('lead_id', leadId)
        .order('criado_em', { ascending: false })
        .limit(50)
      if (error) throw error
      return data ?? []
    },
    staleTime: 30_000,
    enabled: !!leadId && !!empresa?.id,
  })
}

export function useCreateLeadInteracao() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ lead_id, tipo, nota, proximo_contato, arquivo }) => {
      const empresa_id = useAuthStore.getState().empresa?.id
      if (!empresa_id) throw new Error('Sessão inválida')

      let arquivo_path = null
      if (arquivo) {
        // Nome do arquivo pode ter acento/espaço — limpa antes de usar no storage
        const nomeLimpo = arquivo.name
          .normalize('NFD').replace(/[̀-ͯ]/g, '')
          .replace(/[^a-zA-Z0-9._-]/g, '_')
        const path = `${empresa_id}/lead-documentos/${lead_id}/${Date.now()}-${nomeLimpo}`
        const { error: upErr } = await supabase.storage.from('tarefas').upload(path, arquivo, { upsert: false, cacheControl: '3600' })
        if (upErr) throw upErr
        arquivo_path = path
      }

      const { data, error } = await supabase
        .from('lead_interacoes')
        .insert({ lead_id, tipo, nota, empresa_id, arquivo_path })
        .select()
      if (error) throw error
      // Atualiza próximo follow-up no lead se informado
      if (proximo_contato) {
        await supabase.from('leads').update({ proximo_contato }).eq('id', lead_id)
        qc.invalidateQueries({ queryKey: ['leads'] })
      }
      return data
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['lead_interacoes', vars.lead_id] }),
    onError: (err) => { console.error('[Fluxe]', err); alert('Não foi possível registrar: ' + err.message) },
  })
}

export function useDeleteLeadInteracao() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, lead_id, arquivo_path }) => {
      const { error } = await supabase.from('lead_interacoes').delete().eq('id', id)
      if (error) throw error
      if (arquivo_path) await supabase.storage.from('tarefas').remove([arquivo_path])
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['lead_interacoes', vars.lead_id] }),
    onError: (err) => console.error('[Fluxe]', err),
  })
}

// ── TEMPLATES DE MENSAGEM CRM ─────────────────────────────────
export function useCrmTemplates() {
  const { empresa } = useAuthStore()
  return useQuery({
    queryKey: ['crm_templates', empresa?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crm_templates')
        .select('*')
        .eq('empresa_id', empresa?.id)
        .order('etapa', { nullsFirst: true })
        .order('titulo')
      if (error) throw error
      return data ?? []
    },
    enabled: !!empresa?.id,
  })
}

export function useCreateCrmTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ titulo, etapa, texto }) => {
      const empresa_id = useAuthStore.getState().empresa?.id
      const { data, error } = await supabase
        .from('crm_templates')
        .insert({ titulo, etapa: etapa || null, texto, empresa_id })
        .select()
      if (error) throw error
      return data?.[0]
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm_templates'] }),
    onError: (err) => console.error('[Fluxe]', err),
  })
}

export function useUpdateCrmTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, titulo, etapa, texto }) => {
      const { error } = await supabase
        .from('crm_templates')
        .update({ titulo, etapa: etapa || null, texto, atualizado_em: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm_templates'] }),
    onError: (err) => console.error('[Fluxe]', err),
  })
}

export function useDeleteCrmTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('crm_templates').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm_templates'] }),
    onError: (err) => console.error('[Fluxe]', err),
  })
}

// ── Propostas ────────────────────────────────────────────────────────────────
export function usePropostas() {
  const { empresa } = useAuthStore()
  return useQuery({
    queryKey: ['propostas', empresa?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('propostas')
        .select('*')
        .eq('empresa_id', empresa?.id)
        .order('criado_em', { ascending: false })
        .limit(200)
      if (error) throw error
      return data || []
    },
    enabled: !!empresa?.id,
    staleTime: 60_000,
  })
}

export function usePropostasByLead(leadId) {
  const { empresa } = useAuthStore()
  return useQuery({
    queryKey: ['propostas', 'lead', leadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('propostas')
        .select('*')
        .eq('empresa_id', empresa?.id)
        .eq('lead_id', leadId)
        .order('criado_em', { ascending: false })
      if (error) throw error
      return data || []
    },
    enabled: !!empresa?.id && !!leadId,
    staleTime: 30_000,
  })
}

export function useCreateProposta() {
  const qc = useQueryClient()
  const { empresa } = useAuthStore()
  return useMutation({
    mutationFn: async (payload) => {
      const { data, error } = await supabase
        .from('propostas')
        .insert({ ...payload, empresa_id: empresa?.id })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['propostas'] }),
    onError: (err) => console.error('[Fluxe]', err),
  })
}

export function useUpdateProposta() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }) => {
      const { data, error } = await supabase
        .from('propostas')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['propostas'] }),
    onError: (err) => console.error('[Fluxe]', err),
  })
}

// ── META DE CRESCIMENTO ──────────────────────────────
// Uma meta por empresa (a mais recente). Editar = update na mesma linha,
// não cria histórico — v1 é só "qual é a meta agora e como estou indo".
export function useMetaCrescimento() {
  const { empresa } = useAuthStore()
  return useQuery({
    queryKey: ['meta_crescimento', empresa?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('metas_crescimento')
        .select('*')
        .eq('empresa_id', empresa?.id)
        .order('criado_em', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (error) throw error
      return data ?? null
    },
    staleTime: 30_000,
    enabled: !!empresa?.id,
  })
}

export function useSalvarMetaCrescimento() {
  const qc = useQueryClient()
  const { empresa, user } = useAuthStore()
  return useMutation({
    mutationFn: async ({ id, tipo, valor_alvo, data_alvo }) => {
      if (id) {
        const { data, error } = await supabase
          .from('metas_crescimento')
          .update({ tipo, valor_alvo, data_alvo: data_alvo || null, atualizado_em: new Date().toISOString() })
          .eq('id', id)
          .select()
          .single()
        if (error) throw error
        return data
      }
      const { data, error } = await supabase
        .from('metas_crescimento')
        .insert({ empresa_id: empresa?.id, criado_por: user?.id, tipo, valor_alvo, data_alvo: data_alvo || null })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['meta_crescimento'] }),
    onError: (err) => console.error('[Fluxe]', err),
  })
}

// ── PAINEL ADMIN (só staff Fluxe) ────────────────────────
// Registro interno de bugs — RLS já restringe a linhas a quem tem
// usuarios.fluxe_staff = true, não precisa passar por Edge Function.
export function useFluxeBugs() {
  return useQuery({
    queryKey: ['fluxe_bugs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fluxe_bugs')
        .select('*, usuarios(nome)')
        .order('criado_em', { ascending: false })
      if (error) throw error
      return data ?? []
    },
    staleTime: 15_000,
  })
}

export function useCreateFluxeBug() {
  const qc = useQueryClient()
  const { user, empresa } = useAuthStore()
  return useMutation({
    mutationFn: async ({ empresa_nome, reportado_por, descricao, prioridade }) => {
      const { data, error } = await supabase
        .from('fluxe_bugs')
        .insert({
          empresa_nome: empresa_nome || empresa?.nome || null,
          empresa_id: empresa?.id || null,
          reportado_por: reportado_por || user?.email || null,
          descricao,
          prioridade: prioridade || 'media',
          criado_por: user?.id,
        })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fluxe_bugs'] }),
    onError: (err) => console.error('[Fluxe]', err),
  })
}

export function useUpdateFluxeBug() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }) => {
      if (updates.status === 'resolvido') updates.resolvido_em = new Date().toISOString()
      const { error } = await supabase.from('fluxe_bugs').update(updates).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fluxe_bugs'] }),
    onError: (err) => console.error('[Fluxe]', err),
  })
}

// Lista de empresas + ações (bloquear/desbloquear/estender trial) — passa
// pela Edge Function admin-painel, que faz a checagem de fluxe_staff no
// servidor antes de atravessar o isolamento normal por empresa.
export function useAdminEmpresas() {
  return useQuery({
    queryKey: ['admin_empresas'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-painel`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'list_empresas' }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      return data.empresas ?? []
    },
    staleTime: 15_000,
  })
}

// Painel do Mentor — lista as empresas marcadas como mentoradas do BPO
// Lucrativo com o Radar e o Plano de Negócio de cada uma. Passa pela mesma
// Edge Function admin-painel (checagem de fluxe_staff no servidor).
export function useMentorados() {
  return useQuery({
    queryKey: ['admin_mentorados'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-painel`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'list_mentorados' }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      return { mentorados: data.mentorados ?? [], turma_aulas: data.turma_aulas ?? [] }
    },
    staleTime: 30_000,
  })
}

// Histórico de sessões 1:1 de mentoria de um mentorado específico — só
// carrega quando o card é expandido no Painel do Mentor.
export function useSessoesMentoria(empresaId) {
  return useQuery({
    queryKey: ['admin_sessoes_mentoria', empresaId],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-painel`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'listar_sessoes_mentoria', empresa_id: empresaId }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      return data.sessoes ?? []
    },
    enabled: !!empresaId,
    staleTime: 15_000,
  })
}

export function useCriarSessaoMentoria() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ empresa_id, nome_avulso, data, nota, combinados, itens }) => {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-painel`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'criar_sessao_mentoria', empresa_id, nome_avulso, data, nota, combinados, itens }),
      })
      const result = await res.json()
      if (result.error) throw new Error(result.error)
      return result.sessao
    },
    onSuccess: (_, vars) => {
      if (vars.empresa_id) qc.invalidateQueries({ queryKey: ['admin_sessoes_mentoria', vars.empresa_id] })
      qc.invalidateQueries({ queryKey: ['admin_mentorados'] })
      qc.invalidateQueries({ queryKey: ['admin_sessoes_avulsas'] })
      qc.invalidateQueries({ queryKey: ['admin_combinados_abertos'] })
    },
    onError: (err) => console.error('[Fluxe]', err),
  })
}

export function useSessoesAvulsas() {
  return useQuery({
    queryKey: ['admin_sessoes_avulsas'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-painel`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'listar_sessoes_avulsas' }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      return data.sessoes ?? []
    },
    staleTime: 30_000,
  })
}

export function useCombinadosAbertos() {
  return useQuery({
    queryKey: ['admin_combinados_abertos'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-painel`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'listar_combinados_abertos' }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      return data.combinados ?? []
    },
    staleTime: 15_000,
  })
}

export function useConcluirCombinado() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-painel`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'concluir_combinado', id }),
      })
      const result = await res.json()
      if (result.error) throw new Error(result.error)
      return result
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin_combinados_abertos'] })
      qc.invalidateQueries({ queryKey: ['admin_sessoes_mentoria'] })
      qc.invalidateQueries({ queryKey: ['admin_sessoes_avulsas'] })
    },
    onError: (err) => console.error('[Fluxe]', err),
  })
}

export function useExcluirSessaoMentoria() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, empresa_id }) => {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-painel`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'excluir_sessao_mentoria', id }),
      })
      const result = await res.json()
      if (result.error) throw new Error(result.error)
      return empresa_id
    },
    onSuccess: (_, vars) => {
      if (vars.empresa_id) qc.invalidateQueries({ queryKey: ['admin_sessoes_mentoria', vars.empresa_id] })
      qc.invalidateQueries({ queryKey: ['admin_mentorados'] })
      qc.invalidateQueries({ queryKey: ['admin_sessoes_avulsas'] })
      qc.invalidateQueries({ queryKey: ['admin_combinados_abertos'] })
    },
    onError: (err) => console.error('[Fluxe]', err),
  })
}

// Apaga só os dados de mentoria de uma empresa (Plano de Negócio, sessões,
// combinados, materiais + arquivos no storage) e desmarca o 🎓 — NÃO toca em
// clientes/tarefas/usuarios da empresa, que continuam intactos caso ela seja
// também cliente pagante do Fluxe fora da mentoria.
export function useExcluirDadosMentoria() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ empresa_id, confirmacao_nome }) => {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-painel`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'excluir_dados_mentoria', empresa_id, confirmacao_nome }),
      })
      const result = await res.json()
      if (result.error) throw new Error(result.error)
      return result
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin_mentorados'] })
      qc.invalidateQueries({ queryKey: ['admin_empresas'] })
      qc.invalidateQueries({ queryKey: ['admin_combinados_abertos'] })
      qc.invalidateQueries({ queryKey: ['admin_sessoes_avulsas'] })
    },
    onError: (err) => console.error('[Fluxe]', err),
  })
}

export function useAdminAcaoEmpresa() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ action, ...payload }) => {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-painel`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...payload }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin_empresas'] })
      qc.invalidateQueries({ queryKey: ['admin_mentorados'] })
      qc.invalidateQueries({ queryKey: ['admin_turma'] })
      qc.invalidateQueries({ queryKey: ['turma_atual_publica'] })
    },
    onError: (err) => console.error('[Fluxe]', err),
  })
}

// ── TURMA DA MENTORIA EM GRUPO ────────────────────────
// Leitura pública (RLS permite anon+authenticated) — usada na landing
// pública (/mentoriaBPOlucrativo) e na aba Mentoria do aluno. Não passa
// pelo admin-painel, não precisa de sessão.
export function useTurmaAtualPublica() {
  return useQuery({
    queryKey: ['turma_atual_publica'],
    queryFn: async () => {
      const { data: turma } = await supabase.from('turma_grupo').select('*').eq('ativo', true).order('criado_em', { ascending: false }).limit(1).maybeSingle()
      if (!turma) return { turma: null, aulas: [] }
      const { data: aulas } = await supabase.from('turma_aulas').select('*').eq('turma_id', turma.id).order('numero')
      return { turma, aulas: aulas ?? [] }
    },
    staleTime: 60_000,
  })
}

// Leitura pelo Admin (via admin-painel, mesmo dado, mas passando pela
// checagem de fluxe_staff — usado só na tela de edição).
export function useAdminTurma() {
  return useQuery({
    queryKey: ['admin_turma'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-painel`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_turma_atual' }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      return { turma: data.turma, aulas: data.aulas ?? [] }
    },
    staleTime: 15_000,
  })
}

// Progresso do mentorado pelas aulas da turma — check visual de "concluída".
// Vai direto (RLS por empresa_id), não passa pelo admin-painel.
export function useMeuProgressoAulas() {
  const { empresa } = useAuthStore()
  return useQuery({
    queryKey: ['turma_aulas_progresso', empresa?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('turma_aulas_progresso').select('aula_id')
      if (error) throw error
      return new Set((data ?? []).map(r => r.aula_id))
    },
    staleTime: 15_000,
    enabled: !!empresa?.id,
  })
}

export function useToggleProgressoAula() {
  const qc = useQueryClient()
  const { empresa } = useAuthStore()
  return useMutation({
    mutationFn: async ({ aula_id, concluido }) => {
      if (concluido) {
        const { error } = await supabase.from('turma_aulas_progresso').insert({ aula_id, empresa_id: empresa.id })
        if (error) throw error
      } else {
        const { error } = await supabase.from('turma_aulas_progresso').delete().eq('aula_id', aula_id).eq('empresa_id', empresa.id)
        if (error) throw error
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['turma_aulas_progresso', empresa?.id] }),
    onError: (err) => console.error('[Fluxe]', err),
  })
}

// ── MATERIAIS DE APOIO (biblioteca global por etapa do BPO) ──────────
// Leitura pública (RLS permite anon+authenticated), igual à turma — visível
// pra todo mentorado, sem depender de qual empresa (diferente de
// mentoria_links, que é por empresa_id). Não passa pelo admin-painel.
export function useMateriaisApoioPublico() {
  return useQuery({
    queryKey: ['materiais_apoio_publico'],
    queryFn: async () => {
      const { data, error } = await supabase.from('materiais_gerais').select('*')
        .order('etapa').order('ordem', { ascending: true, nullsFirst: false }).order('criado_em', { ascending: false })
      if (error) throw error
      return data ?? []
    },
    staleTime: 60_000,
  })
}

// Leitura pelo Admin (via admin-painel, checagem de fluxe_staff).
export function useAdminMateriaisApoio() {
  return useQuery({
    queryKey: ['admin_materiais_apoio'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-painel`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_materiais_gerais' }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      return data.materiais ?? []
    },
    staleTime: 15_000,
  })
}

export function useSalvarMaterialApoio() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ etapa, titulo, descricao, url, arquivo }) => {
      let arquivo_path = null
      if (arquivo) {
        const nomeLimpo = arquivo.name
          .normalize('NFD').replace(/[̀-ͯ]/g, '')
          .replace(/[^a-zA-Z0-9._-]/g, '_')
        const path = `materiais-apoio/${Date.now()}-${nomeLimpo}`
        const { error: upErr } = await supabase.storage.from('tarefas').upload(path, arquivo, { upsert: false, cacheControl: '3600' })
        if (upErr) throw upErr
        arquivo_path = path
      }
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-painel`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'salvar_material_geral', etapa, titulo, descricao, url, arquivo_path }),
      })
      const result = await res.json()
      if (result.error) throw new Error(result.error)
      return result.material
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin_materiais_apoio'] })
      qc.invalidateQueries({ queryKey: ['materiais_apoio_publico'] })
    },
    onError: (err) => { console.error('[Fluxe]', err); alert('Não foi possível salvar o material: ' + err.message) },
  })
}

// Recebe os materiais de uma etapa já na ordem desejada e regrava a coluna
// `ordem` de todos (10, 20, 30...) — mais simples que calcular swap de dois
// registros, e sempre deixa espaço pra intercalar no futuro.
export function useReordenarMateriaisApoio() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (idsEmOrdem) => {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-painel`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reordenar_materiais_gerais', ids: idsEmOrdem }),
      })
      const result = await res.json()
      if (result.error) throw new Error(result.error)
      return result
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin_materiais_apoio'] })
      qc.invalidateQueries({ queryKey: ['materiais_apoio_publico'] })
    },
    onError: (err) => console.error('[Fluxe]', err),
  })
}

export function useExcluirMaterialApoio() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-painel`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'excluir_material_geral', id }),
      })
      const result = await res.json()
      if (result.error) throw new Error(result.error)
      return result
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin_materiais_apoio'] })
      qc.invalidateQueries({ queryKey: ['materiais_apoio_publico'] })
    },
    onError: (err) => console.error('[Fluxe]', err),
  })
}

// ── MENTORIA (links) ─────────────────────────────────
export function useMentoriaLinks() {
  const { empresa } = useAuthStore()
  return useQuery({
    queryKey: ['mentoria_links', empresa?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mentoria_links')
        .select('*, usuarios(nome)')
        .eq('empresa_id', empresa?.id)
        .order('criado_em', { ascending: false })
      if (error) throw error
      return data ?? []
    },
    staleTime: 30_000,
    enabled: !!empresa?.id,
  })
}

export function useCreateMentoriaLink() {
  const qc = useQueryClient()
  const { empresa, user } = useAuthStore()
  return useMutation({
    mutationFn: async ({ titulo, url, descricao, arquivo }) => {
      let arquivo_path = null
      if (arquivo) {
        // Nome do arquivo pode ter acento/espaço (comum em PT-BR) — limpa antes
        // de usar como chave no storage pra evitar falha de upload.
        const nomeLimpo = arquivo.name
          .normalize('NFD').replace(/[̀-ͯ]/g, '') // remove acentos
          .replace(/[^a-zA-Z0-9._-]/g, '_')
        const path = `${empresa?.id}/mentoria-materiais/${Date.now()}-${nomeLimpo}`
        const { error: upErr } = await supabase.storage.from('tarefas').upload(path, arquivo, { upsert: false, cacheControl: '3600' })
        if (upErr) throw upErr
        arquivo_path = path
      }
      const { data, error } = await supabase
        .from('mentoria_links')
        .insert({ empresa_id: empresa?.id, titulo, url: url || null, arquivo_path, descricao: descricao || null, criado_por: user?.id })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mentoria_links'] }),
    onError: (err) => { console.error('[Fluxe]', err); alert('Não foi possível salvar o material: ' + err.message) },
  })
}

// Combinados que a mentora registrou com ESTA empresa — RLS libera só os da
// própria empresa (Migration 22); a nota da sessão em si continua privada,
// só isso aqui é visível pro mentorado.
export function useMeusCombinados() {
  const { empresa } = useAuthStore()
  return useQuery({
    queryKey: ['meus_combinados', empresa?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mentoria_combinados')
        .select('*')
        .eq('empresa_id', empresa?.id)
        .order('prazo', { ascending: true, nullsFirst: false })
      if (error) throw error
      return data ?? []
    },
    enabled: !!empresa?.id && !!empresa?.mentorado_bpo_lucrativo,
    staleTime: 30_000,
  })
}

export function useAtualizarMeuCombinado() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, concluido, status_mentorado }) => {
      const updates = {}
      if (concluido !== undefined) {
        updates.concluido = concluido
        updates.concluido_em = concluido ? new Date().toISOString() : null
      }
      if (status_mentorado !== undefined) updates.status_mentorado = status_mentorado
      const { data, error } = await supabase.from('mentoria_combinados').update(updates).eq('id', id).select()
      if (error) throw error
      if (!data || data.length === 0) throw new Error('Não foi possível atualizar — tente novamente.')
      return data[0]
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['meus_combinados'] }),
    onError: (err) => console.error('[Fluxe]', err),
  })
}

export function useDeleteMentoriaLink() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, arquivo_path }) => {
      const { error } = await supabase.from('mentoria_links').delete().eq('id', id)
      if (error) throw error
      if (arquivo_path) await supabase.storage.from('tarefas').remove([arquivo_path])
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mentoria_links'] }),
    onError: (err) => console.error('[Fluxe]', err),
  })
}

// ── COMUNIDADE DA MENTORIA (mural entre mentorados) ──────────────────
// Feed comum a todo mentorado (grupo ou individual), RLS libera leitura
// pra qualquer empresa com mentorado_bpo_lucrativo=true, ver MIGRATION_32.
export function useMentoriaPosts() {
  const { empresa } = useAuthStore()
  return useQuery({
    queryKey: ['mentoria_posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mentoria_posts')
        .select('*')
        .order('criado_em', { ascending: false })
        .limit(100)
      if (error) throw error
      return data ?? []
    },
    staleTime: 15_000,
    enabled: !!empresa?.mentorado_bpo_lucrativo,
  })
}

export function useCriarPost() {
  const qc = useQueryClient()
  const { empresa, profile } = useAuthStore()
  return useMutation({
    mutationFn: async ({ conteudo }) => {
      const { data, error } = await supabase
        .from('mentoria_posts')
        .insert({
          empresa_id: empresa.id,
          autor_id: profile.id,
          autor_nome: profile.nome || 'Mentorado',
          empresa_nome: empresa.nome || null,
          conteudo,
        })
        .select()
      if (error) throw error
      return data[0]
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mentoria_posts'] }),
    onError: (err) => console.error('[Fluxe]', err),
  })
}

export function useExcluirPost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('mentoria_posts').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mentoria_posts'] }),
    onError: (err) => console.error('[Fluxe]', err),
  })
}

export function useMentoriaCurtidas() {
  const { empresa } = useAuthStore()
  return useQuery({
    queryKey: ['mentoria_post_curtidas'],
    queryFn: async () => {
      const { data, error } = await supabase.from('mentoria_post_curtidas').select('post_id, empresa_id')
      if (error) throw error
      return data ?? []
    },
    staleTime: 15_000,
    enabled: !!empresa?.mentorado_bpo_lucrativo,
  })
}

export function useToggleCurtida() {
  const qc = useQueryClient()
  const { empresa } = useAuthStore()
  return useMutation({
    mutationFn: async ({ post_id, curtido }) => {
      if (curtido) {
        const { error } = await supabase.from('mentoria_post_curtidas').delete().eq('post_id', post_id).eq('empresa_id', empresa.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('mentoria_post_curtidas').insert({ post_id, empresa_id: empresa.id })
        if (error) throw error
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mentoria_post_curtidas'] }),
    onError: (err) => console.error('[Fluxe]', err),
  })
}

export function useComentariosDoPost(postId, ativo) {
  return useQuery({
    queryKey: ['mentoria_post_comentarios', postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mentoria_post_comentarios')
        .select('*')
        .eq('post_id', postId)
        .order('criado_em', { ascending: true })
      if (error) throw error
      return data ?? []
    },
    enabled: !!postId && !!ativo,
    staleTime: 10_000,
  })
}

export function useCriarComentario() {
  const qc = useQueryClient()
  const { empresa, profile } = useAuthStore()
  return useMutation({
    mutationFn: async ({ post_id, conteudo }) => {
      const { error } = await supabase.from('mentoria_post_comentarios').insert({
        post_id, empresa_id: empresa.id, autor_id: profile.id,
        autor_nome: profile.nome || 'Mentorado', conteudo,
      })
      if (error) throw error
    },
    onSuccess: (_, { post_id }) => qc.invalidateQueries({ queryKey: ['mentoria_post_comentarios', post_id] }),
    onError: (err) => console.error('[Fluxe]', err),
  })
}

// ── PLANO DE NEGÓCIOS (6 etapas) ─────────────────────
// Uma linha por empresa — busca com maybeSingle pois pode não existir ainda
// (empresa nova que nunca preencheu).
export function usePlanoNegocio() {
  const { empresa } = useAuthStore()
  return useQuery({
    queryKey: ['plano_negocio', empresa?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('plano_negocio')
        .select('*')
        .eq('empresa_id', empresa?.id)
        .maybeSingle()
      if (error) throw error
      return data ?? null
    },
    staleTime: 30_000,
    enabled: !!empresa?.id,
    retry: false, // tabela pode ainda não existir (migração não rodada) — falha rápido em vez de re-tentar
  })
}

export function useSalvarPlanoNegocio() {
  const qc = useQueryClient()
  const { empresa } = useAuthStore()
  return useMutation({
    mutationFn: async (campos) => {
      const { data, error } = await supabase
        .from('plano_negocio')
        .upsert({
          empresa_id: empresa?.id,
          ...campos,
          atualizado_em: new Date().toISOString(),
        }, { onConflict: 'empresa_id' })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['plano_negocio'] }),
    onError: (err) => console.error('[Fluxe]', err),
  })
}
