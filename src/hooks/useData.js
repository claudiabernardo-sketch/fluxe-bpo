import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

// ── AUDIT LOG ────────────────────────────────────────
async function logAudit(acao, tabela, registroId, detalhes = {}) {
  await supabase.from('audit_log').insert({ acao, tabela, registro_id: String(registroId), detalhes })
}

// ── CLIENTES ─────────────────────────────────────────
export function useClients() {
  return useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clientes')
        .select('*, usuarios(nome, perfil)')
        .order('razao_social')
      if (error) throw error
      return data
    },
    staleTime: 30_000,
  })
}

export function useCreateClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (client) => {
      // Remove joined/computed fields
      const { usuarios, empresas, id, criado_em, atualizado_em, ...clean } = client
      const { data, error } = await supabase
        .from('clientes').insert(clean).select().single()
      if (error) throw error
      await logAudit('CREATE', 'clientes', data.id, { razao: clean.razao_social })
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
  })
}

export function useUpdateClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }) => {
      // Remove joined/computed fields that don't exist as columns
      const { usuarios, empresas, ...clean } = updates
      const { data, error } = await supabase
        .from('clientes').update(clean).eq('id', id).select().single()
      if (error) throw error
      await logAudit('UPDATE', 'clientes', id, { id })
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
  })
}

export function useDeleteClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('clientes').delete().eq('id', id)
      if (error) throw error
      await logAudit('DELETE', 'clientes', id)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
  })
}

// ── TAREFAS ──────────────────────────────────────────
export function useTasks(filters = {}) {
  return useQuery({
    queryKey: ['tasks', filters],
    queryFn: async () => {
      let q = supabase
        .from('tarefas')
        .select('*, clientes(razao_social, fantasia), usuarios!tarefas_responsavel_id_fkey(nome)')
        .order('prazo', { ascending: true })

      if (filters.clientId) q = q.eq('cliente_id', filters.clientId)
      if (filters.status)   q = q.eq('status', filters.status)
      if (filters.resp)     q = q.eq('responsavel_id', filters.resp)

      const { data, error } = await q
      if (error) { console.error('useTasks error:', error); throw error }
      console.log('useTasks result:', data)
      return data ?? []
    },
    staleTime: 15_000,
  })
}

export function useCreateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (task) => {
      const { data, error } = await supabase
        .from('tarefas').insert(task).select().single()
      if (error) throw error
      await logAudit('CREATE', 'tarefas', data.id, { titulo: task.titulo })
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })
}

export function useUpdateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }) => {
      const { data, error } = await supabase
        .from('tarefas').update({ ...updates, atualizado_em: new Date().toISOString() })
        .eq('id', id).select().single()
      if (error) throw error
      await logAudit('UPDATE', 'tarefas', id, updates)
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })
}

export function useDeleteTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('tarefas').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })
}

// ── LEADS (CRM) ──────────────────────────────────────
export function useLeads() {
  return useQuery({
    queryKey: ['leads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('criado_em', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

export function useCreateLead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (lead) => {
      const { data, error } = await supabase.from('leads').insert(lead).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leads'] }),
  })
}

export function useUpdateLead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }) => {
      const { data, error } = await supabase
        .from('leads').update(updates).eq('id', id).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leads'] }),
  })
}

// ── PENDÊNCIAS ───────────────────────────────────────
export function usePendencias(filters = {}) {
  return useQuery({
    queryKey: ['pendencias', filters],
    queryFn: async () => {
      let q = supabase
        .from('pendencias')
        .select('*, clientes(razao_social, fantasia), usuarios(nome)')
        .order('prazo_cobranca', { ascending: true })

      if (filters.status) q = q.eq('status', filters.status)
      if (filters.clientId) q = q.eq('cliente_id', filters.clientId)

      const { data, error } = await q
      if (error) throw error
      return data
    },
  })
}

export function useCreatePendencia() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (pend) => {
      const { data, error } = await supabase.from('pendencias').insert(pend).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pendencias'] }),
  })
}

export function useUpdatePendencia() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }) => {
      const { data, error } = await supabase
        .from('pendencias').update(updates).eq('id', id).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pendencias'] }),
  })
}

// ── APONTAMENTOS (TIMER) ─────────────────────────────
export function useApontamentos(filters = {}) {
  return useQuery({
    queryKey: ['apontamentos', filters],
    queryFn: async () => {
      let q = supabase
        .from('apontamentos')
        .select('*, clientes(razao_social, fantasia), tarefas(titulo, categoria), usuarios(nome)')
        .order('inicio', { ascending: false })

      if (filters.clientId) q = q.eq('cliente_id', filters.clientId)
      if (filters.userId)   q = q.eq('usuario_id', filters.userId)

      const { data, error } = await q
      if (error) throw error
      return data
    },
  })
}

export function useSaveApontamento() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (ap) => {
      const { data, error } = await supabase.from('apontamentos').insert(ap).select().single()
      if (error) throw error
      await logAudit('CREATE', 'apontamentos', data.id, { segundos: ap.segundos })
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['apontamentos'] }),
  })
}

// ── APROVAÇÕES ───────────────────────────────────────
export function useAprovacoes() {
  return useQuery({
    queryKey: ['aprovacoes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('aprovacoes')
        .select('*, clientes(razao_social, fantasia)')
        .order('criado_em', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

export function useUpdateAprovacao() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status, obs }) => {
      const { data, error } = await supabase
        .from('aprovacoes').update({ status, atualizado_em: new Date().toISOString() })
        .eq('id', id).select().single()
      if (error) throw error
      await supabase.from('aprovacao_historico').insert({
        aprovacao_id: id, acao: status, obs
      })
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['aprovacoes'] }),
  })
}

// ── USUÁRIOS DA EMPRESA ───────────────────────────────
export function useUsuarios() {
  return useQuery({
    queryKey: ['usuarios'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('ativo', true)
        .order('nome')
      if (error) throw error
      return data
    },
  })
}

// ── ACESSOS (COFRE) ───────────────────────────────────
export function useAcessos(clienteId) {
  return useQuery({
    queryKey: ['acessos', clienteId],
    queryFn: async () => {
      let q = supabase.from('acessos').select('*').order('sistema')
      if (clienteId) q = q.eq('cliente_id', clienteId)
      const { data, error } = await q
      if (error) throw error
      return data
    },
    enabled: !!clienteId,
  })
}

export function useSaveAcesso() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (acesso) => {
      const { data, error } = acesso.id
        ? await supabase.from('acessos').update(acesso).eq('id', acesso.id).select().single()
        : await supabase.from('acessos').insert(acesso).select().single()
      if (error) throw error
      await logAudit('UPDATE', 'acessos', data.id, { sistema: acesso.sistema })
      return data
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['acessos', vars.cliente_id] }),
  })
}
