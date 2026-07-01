import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'

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
        .order('prazo', { ascending: true })
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
          tarefa_modelos(id, titulo, categoria, recorrencia, prioridade, dia_mes, dias_semana, dias_mes, checklist_items)
        `)
        .eq('cliente_id', clienteId)
        .eq('ativo', true)
      if (error) throw error
      return data ?? []
    },
    enabled: !!clienteId,
  })
}

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
      return data?.[0]
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['cliente_modelos', vars.clienteId] }),
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

// Iniciar operação: define data de início, muda status para operacional
// e dispara geração das tarefas a partir da data escolhida
export function useIniciarOperacao() {
  const qc = useQueryClient()
  const { empresa } = useAuthStore()
  return useMutation({
    mutationFn: async ({ clienteId, dataInicio }) => {
      // 1. Atualizar cliente
      const { error: errCli } = await supabase
        .from('clientes')
        .update({
          status_operacional: 'operacional',
          operacao_iniciada_em: dataInicio,
        })
        .eq('id', clienteId)
      if (errCli) throw errCli

      await logAudit('UPDATE', 'clientes', clienteId, {
        status_operacional: 'operacional',
        operacao_iniciada_em: dataInicio,
      })

      // 2. Chamar Edge Function para gerar tarefas do período
      const hoje = new Date().toISOString().slice(0, 10)
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gerar-tarefas`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            cliente_id:   clienteId,
            empresa_id:   empresa?.id,
            data_inicio:  dataInicio,
            data_fim:     hoje,
          }),
        }
      )
      const resultado = await res.json()
      return resultado
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clients'] })
      qc.invalidateQueries({ queryKey: ['tasks'] })
    },
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
    mutationFn: async ({ lead_id, tipo, nota, proximo_contato }) => {
      const empresa_id = useAuthStore.getState().empresa?.id
      if (!empresa_id) throw new Error('Sessão inválida')
      const { data, error } = await supabase
        .from('lead_interacoes')
        .insert({ lead_id, tipo, nota, empresa_id })
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
    onError: (err) => console.error('[Fluxe]', err),
  })
}

export function useDeleteLeadInteracao() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, lead_id }) => {
      const { error } = await supabase.from('lead_interacoes').delete().eq('id', id)
      if (error) throw error
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
        .order('created_at', { ascending: false })
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
        .order('created_at', { ascending: false })
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
