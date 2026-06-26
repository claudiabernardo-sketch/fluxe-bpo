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
      return data
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
export function useRotinas(client