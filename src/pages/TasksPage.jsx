import { useState, useRef, lazy, Suspense } from 'react'
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask, useClients, useUsuarios, useTarefaModelos } from '../hooks/useData'
import { Card, Btn, Loader, EmptyState, PrioBadge, StatusBadge, fmt, isVencida } from '../components/ui'
import ContextTooltip from '../components/ui/ContextTooltip'
const ImportModal = lazy(() => import('../components/ui/ImportModal'))
import { TAREFAS_EXPORT_COLS, mapRowToTarefa } from '../utils/excelMappings'
import { useTimerStore } from '../components/layout/TimerBar'
import { supabase } from '../lib/supabase'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'

const CATEGORIAS = ['Contas a Pagar','Contas a Receber','Conciliação Bancária','Emissão de NF','Emissão de Boletos','Cobrança / Inadimplência','Pagamentos','Fluxo de Caixa','DRE Gerencial / Relatórios','Implantação','Onboarding','Estratégico','Relacionamento']

const CHECKLIST_TEMPLATES = {
  'Contas a Pagar': ['Verificar vencimentos do dia','Confirmar saldo disponível com o cliente','Obter autorização do responsável','Efetuar pagamento','Salvar comprovante','Registrar no sistema do cliente'],
  'Contas a Receber': ['Verificar recebimentos previstos','Conferir extrato bancário','Identificar recebimentos pendentes','Enviar cobrança para inadimplentes','Registrar recebimentos no sistema'],
  'Conciliação Bancária': ['Baixar extrato bancário','Importar extrato no sistema','Conferir lançamentos x extrato','Identificar divergências','Resolver pendências com o cliente','Salvar conciliação finalizada'],
  'Emissão de NF': ['Confirmar dados do tomador com o cliente','Conferir descrição do serviço','Emitir NF no sistema da prefeitura','Enviar NF ao cliente por e-mail','Registrar número da NF no controle'],
  'Emissão de Boletos': ['Verificar lista de cobranças','Gerar boletos no sistema','Conferir valores e vencimentos','Enviar boletos ao cliente por e-mail','Registrar envio no histórico'],
  'Cobrança / Inadimplência': ['Identificar clientes em atraso','Verificar acordos vigentes','Enviar 1ª notificação por e-mail','Realizar contato telefônico','Registrar resposta do cliente','Negociar prazo se necessário'],
  'Pagamentos': ['Verificar guia/boleto a pagar','Confirmar vencimento e valor','Obter autorização do cliente','Efetuar pagamento','Salvar comprovante e enviar ao cliente'],
  'Fluxo de Caixa': ['Organizar entradas do período','Organizar saídas do período','Conferir saldo projetado','Identificar gaps','Apresentar relatório ao cliente'],
  'DRE Gerencial / Relatórios': ['Coletar receitas e despesas do período','Classificar por categoria gerencial','Calcular resultado (receita − custos − despesas)','Montar DRE no formato acordado com o cliente','Revisar com o responsável','Enviar ao cliente'],
  'Implantação': ['Coletar documentos e acessos do cliente','Cadastrar cliente no sistema','Configurar categorias financeiras do cliente','Importar histórico financeiro no sistema','Configurar acessos da equipe operacional','Alinhar rotinas e prazos com o cliente','Realizar reunião de kick-off','Validar primeiro ciclo operacional'],
  'Onboarding': ['Enviar boas-vindas e acessos','Apresentar equipe responsável','Definir rotina de entregas','Configurar canal de comunicação','Realizar reunião de alinhamento','Registrar pendências iniciais'],
}
const COLS = [{id:'aberta',label:'Abertas',color:'#3B82F6'},{id:'andamento',label:'Em andamento',color:'#F59E0B'},{id:'aguardando',label:'Ag. cliente',color:'#8B5CF6'},{id:'concluida',label:'Concluídas',color:'#22C55E'}]
const BANCOS = ['Banco do Brasil','Santander','Caixa Econômica Federal','Bradesco','Itaú','Nubank','C6 Bank','Banco Inter','Mercado Pago','PagBank','Sicoob','Sicredi','Banco Original','BTG Pactual','Stone','Cora','Asaas','Outro']
const ANEXO_PREFIX = '📎 ANEXO::'

function parseAnexo(acao) {
  if (!acao?.startsWith(ANEXO_PREFIX)) return null
  const [, url, nome] = acao.split('::')
  return { url, nome }
}

export default function TasksPage() {
  const { data: tasks = [], isLoading } = useTasks()
  const { data: clients = [] } = useClients()
  const { data: usuarios = [] } = useUsuarios()
  const { profile } = useAuthStore()
  const createTask = useCreateTask()
  const updateTask = useUpdateTask()
  const deleteTask = useDeleteTask()
  const startTimer = useTimerStore(s => s.start)
  const qc = useQueryClient()
  const fileInputRef = useRef(null)
  const { data: modelos = [] } = useTarefaModelos()
  const { empresa } = useAuthStore()

  // ── Geração de tarefas: migrada para Edge Function server-side ─────────────
  // Tarefas são geradas todo dia às 00:00 BRT via pg_cron → gerar-tarefas
  // Não há mais geração client-side nesta página.

  const [view, setView] = useState('meudia')
  const [concluídasOpen, setConcluídasOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [fStatus, setFStatus] = useState('')
  const [fClient, setFClient] = useState('')
  const [fPrio, setFPrio] = useState('')
  // Filtro de período — padrão: mês atual
  const _now = new Date()
  const _mesInicio = `${_now.getFullYear()}-${String(_now.getMonth()+1).padStart(2,'0')}-01`
  const _mesFim = new Date(_now.getFullYear(), _now.getMonth()+1, 0).toISOString().slice(0,10)
  const [fDateFrom, setFDateFrom] = useState(_mesInicio)
  const [fDateTo,   setFDateTo]   = useState(_mesFim)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({})
  const [selTask, setSelTask] = useState(null)
  const [dragOver, setDragOver] = useState(null)
  const [dragId, setDragId] = useState(null)
  const [histTab, setHistTab] = useState('checklist') // checklist | historico
  const [newCk, setNewCk] = useState('')
  const [uploading, setUploading] = useState(false)

  // ── Checklist ──────────────────────────────────────────────────────────
  const { data: checklists = [] } = useQuery({
    queryKey: ['checklists', selTask],
    queryFn: async () => {
      if (!selTask) return []
      const { data, error } = await supabase.from('tarefa_checklists').select('*').eq('tarefa_id', selTask)
      if (error) throw error
      return data
    },
    enabled: !!selTask,
  })

  // ── Histórico ─────────────────────────────────────────────────────────
  const { data: historico = [] } = useQuery({
    queryKey: ['historico', selTask],
    queryFn: async () => {
      if (!selTask) return []
      const { data } = await supabase.from('tarefa_historico').select('*, usuarios(nome)').eq('tarefa_id', selTask).order('criado_em', { ascending: false })
      return data || []
    },
    enabled: !!selTask,
  })

  // ── Anexos (leitura direta do Storage, sem depender do historico) ────
  const empresaId = profile?.empresa_id || 'shared'
  const { data: anexos = [] } = useQuery({
    queryKey: ['anexos', selTask, empresaId],
    queryFn: async () => {
      if (!selTask) return []
      const folder = `${empresaId}/${selTask}`
      const { data, error } = await supabase.storage.from('tarefas').list(folder, { limit: 100, sortBy: { column: 'created_at', order: 'desc' } })
      if (error) { console.error('storage list:', error.message); return [] }
      return (data || []).map(f => ({
        nome: f.name,
        url: supabase.storage.from('tarefas').getPublicUrl(`${folder}/${f.name}`).data.publicUrl,
        criado_em: f.created_at,
      }))
    },
    enabled: !!selTask,
  })

  const addCheck = useMutation({
    mutationFn: async (texto) => {
      const { error } = await supabase.from('tarefa_checklists')
        .insert({ tarefa_id: selTask, empresa_id: empresaId, texto })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['checklists', selTask] }),
    onError: (err) => alert('Erro no checklist: ' + err.message),
  })

  const toggleCheck = useMutation({
    mutationFn: async ({ id, concluido }) => {
      await supabase.from('tarefa_checklists').update({ concluido }).eq('id', id)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['checklists', selTask] }),
    onError: (err) => alert('Erro ao atualizar checklist: ' + err.message),
  })

  const deleteCheck = useMutation({
    mutationFn: async (id) => {
      await supabase.from('tarefa_checklists').delete().eq('id', id)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['checklists', selTask] }),
    onError: (err) => alert('Erro ao remover item: ' + err.message),
  })

  const logHistorico = (tarefa_id, acao) => {
    // fire-and-forget
    supabase.from('tarefa_historico')
      .insert({ tarefa_id, usuario_id: profile?.id, acao, empresa_id: empresaId })
      .then(({ error }) => {
        if (error) console.error('historico insert:', error.message)
        else qc.invalidateQueries({ queryKey: ['historico', tarefa_id] })
      })
  }

  // ── Upload de anexo ───────────────────────────────────────────────────
  async function uploadAnexo(file) {
    if (!selTask || !file) return
    setUploading(true)
    try {
      const path = `${profile?.empresa_id || 'shared'}/${selTask}/${Date.now()}-${file.name}`
      console.log('[upload] path:', path, 'file:', file.name, file.size)
      const { data: upData, error: upErr } = await supabase.storage
        .from('tarefas')
        .upload(path, file, { upsert: false, cacheControl: '3600' })
      console.log('[upload] result:', upData, 'error:', upErr)
      if (upErr) {
        alert('Erro no upload: ' + upErr.message)
        return
      }
      // Registra no histórico (fire-and-forget)
      const { data: urlData } = supabase.storage.from('tarefas').getPublicUrl(path)
      logHistorico(selTask, `${ANEXO_PREFIX}${urlData?.publicUrl || ''}::${file.name}`)
      // Atualiza aba de Anexos via Storage diretamente
      qc.invalidateQueries({ queryKey: ['anexos', selTask] })
    } catch (e) {
      alert('Erro ao enviar: ' + (e.message || 'erro desconhecido'))
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // ── Filtros ───────────────────────────────────────────────────────────
  // toISOString() retorna UTC — no fuso de Brasília (UTC-3) isso faz
  // "hoje" virar "amanhã" depois das 21h. Usa formatação local em vez disso.
  const today = new Date().toLocaleDateString('en-CA') // 'en-CA' retorna YYYY-MM-DD no fuso local
  const filtered = tasks.filter(t => {
    const q = search.toLowerCase()
    // Data de referência da tarefa: data_execucao ou prazo
    const dataRef = t.data_execucao || t.prazo
    const dentroDoPeríodo = !dataRef || (
      (!fDateFrom || dataRef >= fDateFrom) &&
      (!fDateTo   || dataRef <= fDateTo)
    )
    return dentroDoPeríodo &&
      (!q || t.titulo?.toLowerCase().includes(q)) &&
      (!fStatus || t.status === fStatus) &&
      (!fClient || t.cliente_id === fClient) &&
      (!fPrio || t.prioridade === fPrio)
  })

  const todayTasks = tasks.filter(t =>
    t.status !== 'concluida' && (t.data_execucao === today || t.prazo === today || t.status === 'andamento')
  )

  // Ordenação por data_execucao (ou prazo como fallback)
  const filteredSorted = [...filtered].sort((a, b) => {
    const da = a.data_execucao || a.prazo || '9999'
    const db = b.data_execucao || b.prazo || '9999'
    return da.localeCompare(db)
  })

  const selectedTask = tasks.find(t => t.id === selTask)

  function openNew() { setForm({ status:'aberta', prioridade:'media' }); setModal({ mode:'new', modeloId:'' }) }
  function openEdit(t) { setForm({...t}); setModal({ mode:'edit', id:t.id }) }
  function closeModal() { setModal(null); setForm({}) }

  function aplicarModelo(modeloId) {
    setModal(m => ({ ...m, modeloId }))
    if (!modeloId) return
    const modelo = modelos.find(m => m.id === modeloId)
    if (!modelo) return
    setForm(f => ({
      ...f,
      titulo: modelo.titulo,
      categoria: modelo.categoria || f.categoria,
      prioridade: modelo.prioridade || f.prioridade,
      cliente_id: modelo.cliente_id || f.cliente_id,
    }))
  }

  async function save() {
    if (!form.titulo?.trim()) return alert('Título obrigatório')
    const payload = { titulo:form.titulo, categoria:form.categoria||null, prioridade:form.prioridade||'media', status:form.status||'aberta', prazo:form.prazo||null, obs:form.obs||null, motivo_pendencia:form.motivo_pendencia||null, cliente_id:form.cliente_id||null, responsavel_id:form.responsavel_id||null, banco:form.banco||null }
    if (modal.mode === 'new') {
      const t = await createTask.mutateAsync({ ...payload, modelo_id: modal.modeloId || null })
      await logHistorico(t.id, 'Tarefa criada')
      // Se veio de um modelo com checklist pronto, já cria os itens na tarefa nova
      const modeloOrigem = modal.modeloId ? modelos.find(m => m.id === modal.modeloId) : null
      if (modeloOrigem?.checklist_items?.length) {
        for (const texto of modeloOrigem.checklist_items) {
          await supabase.from('tarefa_checklists').insert({ tarefa_id: t.id, empresa_id: empresa?.id, texto })
        }
        qc.invalidateQueries({ queryKey: ['checklists', t.id] })
      }
    } else {
      await updateTask.mutateAsync({ id: modal.id, ...payload })
      await logHistorico(modal.id, 'Tarefa editada')
    }
    closeModal()
  }

  async function quickStatus(id, status) {
    try {
      await updateTask.mutateAsync({ id, status })
      await logHistorico(id, `Status → ${status}`)
    } catch (err) {
      alert('Não foi possível atualizar o status da tarefa: ' + (err?.message || 'erro desconhecido'))
    }
  }

  async function concluirTodasAnteriores(pendentes) {
    if (!pendentes.length) return
    if (!window.confirm(`Concluir todas as ${pendentes.length} tarefas pendentes de dias anteriores?`)) return
    try {
      await Promise.all(pendentes.map(t => updateTask.mutateAsync({ id: t.id, status: 'concluida' })))
      qc.invalidateQueries({ queryKey: ['tasks'] })
    } catch (err) {
      alert('Erro ao concluir tarefas: ' + (err?.message || 'erro'))
    }
  }

  async function saveMotivo(id, motivo_pendencia) {
    await supabase.from('tarefas').update({ motivo_pendencia }).eq('id', id)
    qc.invalidateQueries({ queryKey: ['tasks'] })
  }

  async function onDrop(colId) {
    if (!dragId || !colId) return
    await updateTask.mutateAsync({ id: dragId, status: colId })
    await logHistorico(dragId, `Movido para ${colId}`)
    setDragId(null); setDragOver(null)
  }

  const fi = { width:'100%', padding:'7px 10px', border:'1px solid #E2E8F0', borderRadius:8, fontSize:12, fontFamily:'inherit', background:'#fff' }
  const fi2 = { ...fi, padding:'4px 8px', fontSize:11 }
  const showBanco = form.categoria === 'Conciliação Bancária'
  const clientBancos = clients.find(c=>c.id===form.cliente_id)?.bancos || []

  if (isLoading) return <Loader />

  return (
    <>
    <ContextTooltip
      pageKey="tarefas"
      icon="✅"
      title="Como usar as Tarefas"
      color="#3B82F6"
      tips={[
        'Crie modelos de tarefas recorrentes (folha, DRE…) em Modelos — elas são geradas automaticamente.',
        'Use o timer para registrar horas em cada tarefa — isso alimenta o cálculo de rentabilidade por cliente.',
        'Filtre por cliente, responsável ou status para visualizar somente o que importa.',
        'Tarefas em vermelho estão vencidas — priorize-as.',
      ]}
    />
    <div style={{ display:'flex', gap:0, height:'calc(100vh - 110px)', overflow:'hidden' }}>

      {/* ── COLUNA ESQUERDA: Lista de tarefas ─────────────────────────── */}
      <div style={{ width: selectedTask ? 300 : '100%', flexShrink:0, display:'flex', flexDirection:'column', borderRight: selectedTask ? '1px solid #E2E8F0' : 'none', transition:'width .2s' }}>

        {/* Toolbar */}
        <div style={{ padding:'0 0 10px 0', display:'flex', flexDirection:'column', gap:8 }}>
          {/* Linha 1: Período + busca + views + novo */}
          <div style={{ display:'flex', gap:6, flexWrap:'wrap', alignItems:'center' }}>
            {/* Seletor de visão */}
            <div style={{ display:'flex', border:'1px solid #E2E8F0', borderRadius:8, overflow:'hidden', flexShrink:0 }}>
              {[['meudia','☀ Meu Dia'],['list','☰ Lista'],['kanban','⬛ Kanban']].map(([v,label])=>(
                <button key={v} onClick={()=>setView(v)} style={{ padding:'5px 12px', border:'none', cursor:'pointer', fontSize:11, fontWeight:600, background:view===v?'#6366F1':'#fff', color:view===v?'#fff':'#64748B', whiteSpace:'nowrap' }}>
                  {label}
                </button>
              ))}
            </div>
            {/* Período — só nas visões lista/kanban */}
            {view !== 'meudia' && (
              <div style={{ display:'flex', alignItems:'center', gap:4, background:'#F8FAFC', border:'1px solid #E2E8F0', borderRadius:8, padding:'4px 8px', flexShrink:0 }}>
                <span style={{ fontSize:10, color:'#64748B', fontWeight:600 }}>📅</span>
                <input type="date" value={fDateFrom} onChange={e=>setFDateFrom(e.target.value)}
                  style={{ border:'none', background:'transparent', fontSize:11, color:'#334155', fontFamily:'inherit', outline:'none', width:105 }} />
                <span style={{ fontSize:10, color:'#94A3B8' }}>–</span>
                <input type="date" value={fDateTo} onChange={e=>setFDateTo(e.target.value)}
                  style={{ border:'none', background:'transparent', fontSize:11, color:'#334155', fontFamily:'inherit', outline:'none', width:105 }} />
              </div>
            )}
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Buscar..." style={{ ...fi, flex:1, minWidth:80 }} />
            <Btn variant="primary" onClick={openNew} small>+ Nova</Btn>
          </div>
          {/* Linha 2: Filtros */}
          {!selectedTask && (
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              <select value={fStatus} onChange={e=>setFStatus(e.target.value)} style={{ ...fi, flex:1 }}>
                <option value="">Todos status</option>
                <option value="aberta">Aberta</option><option value="andamento">Andamento</option>
                <option value="aguardando">Ag. cliente</option><option value="concluida">Concluída</option>
                <option value="impedimento">Impedimento</option>
              </select>
              <select value={fClient} onChange={e=>setFClient(e.target.value)} style={{ ...fi, flex:1 }}>
                <option value="">Todos clientes</option>
                {clients.map(c=><option key={c.id} value={c.id}>{c.razao_social}</option>)}
              </select>
              <select value={fPrio} onChange={e=>setFPrio(e.target.value)} style={{ ...fi, flex:1 }}>
                <option value="">Prioridade</option>
                <option value="alta">Alta</option><option value="media">Média</option><option value="baixa">Baixa</option>
              </select>
            </div>
          )}
          {/* Linha 3: Contagem + Excel */}
          {!selectedTask && (
            <div style={{ display:'flex', gap:6, justifyContent:'flex-end' }}>
              <span style={{ fontSize:10, color:'#94A3B8', alignSelf:'center' }}>{filtered.length} tarefas</span>
              <button onClick={() => import('../utils/excel').then(m => m.exportToXlsx(filtered, TAREFAS_EXPORT_COLS, 'tarefas.xlsx'))}
                style={{ padding:'5px 10px', borderRadius:8, border:'1px solid #CBD5E1', background:'#fff', cursor:'pointer', fontSize:11, fontWeight:600, color:'#334155' }}>⬇ Excel</button>
              <button onClick={() => setImportOpen(true)}
                style={{ padding:'5px 10px', borderRadius:8, border:'1px solid #CBD5E1', background:'#fff', cursor:'pointer', fontSize:11, fontWeight:600, color:'#334155' }}>⬆ Importar</button>
            </div>
          )}
        </div>

        {/* Seção "Hoje" quando minimizado */}
        {selectedTask && todayTasks.length > 0 && (
          <div style={{ marginBottom:8 }}>
            <div style={{ fontSize:9, fontWeight:700, color:'#94A3B8', letterSpacing:'.1em', textTransform:'uppercase', marginBottom:4 }}>📅 HOJE ({todayTasks.length})</div>
            {todayTasks.slice(0,5).map(t => (
              <div key={t.id} onClick={()=>setSelTask(t.id)}
                style={{ padding:'6px 8px', borderRadius:8, cursor:'pointer', marginBottom:3, background: selTask===t.id?'#EEF2FF':'#F8FAFC', border:`1px solid ${selTask===t.id?'#6366F1':'transparent'}` }}>
                <div style={{ fontSize:11, fontWeight:600, color:'#0F172A', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.titulo}</div>
                <div style={{ fontSize:9, color:'#94A3B8', marginTop:1 }}>{t.clientes?.fantasia||t.clientes?.razao_social||''}</div>
              </div>
            ))}
            <div style={{ height:1, background:'#F1F5F9', margin:'8px 0' }} />
          </div>
        )}

        {/* Lista / Kanban */}
        <div style={{ flex:1, overflow:'auto' }}>
          {view === 'meudia' ? (() => {
            const hojeStr   = new Date().toLocaleDateString('pt-BR', { weekday:'long', day:'numeric', month:'long', year:'numeric' })
            const pendentes = tasks.filter(t => t.data_execucao && t.data_execucao < today && t.status !== 'concluida' && (!fClient || t.cliente_id === fClient) && (!search || t.titulo?.toLowerCase().includes(search.toLowerCase())))
            const deHoje    = tasks.filter(t => t.data_execucao === today && t.status !== 'concluida' && (!fClient || t.cliente_id === fClient) && (!search || t.titulo?.toLowerCase().includes(search.toLowerCase())))
            const conclHoje = tasks.filter(t => t.status === 'concluida' && (t.data_execucao === today || t.prazo === today) && (!fClient || t.cliente_id === fClient) && (!search || t.titulo?.toLowerCase().includes(search.toLowerCase())))
            return (
              <div style={{ maxWidth: selectedTask ? '100%' : 680 }}>
                {/* Cabeçalho do dia */}
                <div style={{ padding:'12px 0 16px', borderBottom:'1px solid #F1F5F9', marginBottom:16 }}>
                  <div style={{ fontSize:22, fontWeight:700, color:'#0F172A', textTransform:'capitalize' }}>{hojeStr}</div>
                  <div style={{ fontSize:12, color:'#94A3B8', marginTop:2 }}>
                    {deHoje.length} para fazer · {pendentes.length} pendentes · {conclHoje.length} concluídas
                  </div>
                </div>

                {/* Pendentes de dias anteriores */}
                {pendentes.length > 0 && (
                  <div style={{ marginBottom:20 }}>
                    <div style={{ fontSize:11, fontWeight:700, color:'#991B1B', marginBottom:8, display:'flex', alignItems:'center', gap:6 }}>
                      <span style={{ width:8, height:8, borderRadius:'50%', background:'#EF4444', display:'inline-block' }} />
                      PENDENTES DE DIAS ANTERIORES ({pendentes.length})
                      <button
                        onClick={() => concluirTodasAnteriores(pendentes)}
                        style={{ marginLeft:'auto', fontSize:10, fontWeight:600, color:'#fff', background:'#EF4444', border:'none', borderRadius:6, padding:'3px 10px', cursor:'pointer' }}
                      >Concluir todas</button>
                    </div>
                    <Card style={{ overflow:'hidden' }}>
                      {pendentes.map(t => <TaskRow key={t.id} t={t} selTask={selTask} setSelTask={setSelTask} openEdit={openEdit} deleteTask={deleteTask} quickStatus={quickStatus} selectedTask={selectedTask} today={today} onSaveMotivo={saveMotivo} />)}
                    </Card>
                  </div>
                )}

                {/* Tarefas de hoje */}
                <div style={{ marginBottom:20 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:'#1D4ED8', marginBottom:8, display:'flex', alignItems:'center', gap:6 }}>
                    <span style={{ width:8, height:8, borderRadius:'50%', background:'#6366F1', display:'inline-block' }} />
                    HOJE ({deHoje.length})
                  </div>
                  <Card style={{ overflow:'hidden' }}>
                    {deHoje.length === 0
                      ? <div style={{ padding:'20px', textAlign:'center', color:'#94A3B8', fontSize:12 }}>
                          {pendentes.length === 0 ? '🎉 Tudo em dia!' : 'Nenhuma tarefa para hoje além das pendências.'}
                        </div>
                      : deHoje.map(t => <TaskRow key={t.id} t={t} selTask={selTask} setSelTask={setSelTask} openEdit={openEdit} deleteTask={deleteTask} quickStatus={quickStatus} selectedTask={selectedTask} today={today} onSaveMotivo={saveMotivo} />)
                    }
                  </Card>
                </div>

                {/* Concluídas hoje */}
                {conclHoje.length > 0 && (
                  <div>
                    <button onClick={() => setConcluídasOpen(o => !o)}
                      style={{ fontSize:11, fontWeight:700, color:'#16A34A', marginBottom:8, display:'flex', alignItems:'center', gap:6, background:'none', border:'none', cursor:'pointer', padding:0 }}>
                      <span style={{ width:8, height:8, borderRadius:'50%', background:'#22C55E', display:'inline-block' }} />
                      CONCLUÍDAS HOJE ({conclHoje.length}) {concluídasOpen ? '▲' : '▼'}
                    </button>
                    {concluídasOpen && (
                      <Card style={{ overflow:'hidden' }}>
                        {conclHoje.map(t => <TaskRow key={t.id} t={t} selTask={selTask} setSelTask={setSelTask} openEdit={openEdit} deleteTask={deleteTask} quickStatus={quickStatus} selectedTask={selectedTask} today={today} onSaveMotivo={saveMotivo} />)}
                      </Card>
                    )}
                  </div>
                )}
              </div>
            )
          })() : view === 'list' ? (
            <Card style={{ overflow:'hidden' }}>
              {filteredSorted.length === 0
                ? <EmptyState icon="✅" title="Nenhuma tarefa" sub="Crie tarefas para organizar a operação" action={<Btn variant="primary" onClick={openNew}>+ Nova tarefa</Btn>} />
                : filteredSorted.map(t => (
                  <TaskRow key={t.id} t={t} selTask={selTask} setSelTask={setSelTask} openEdit={openEdit} deleteTask={deleteTask} quickStatus={quickStatus} selectedTask={selectedTask} today={today} onSaveMotivo={saveMotivo} />
                ))
              }
            </Card>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns: selectedTask ? '1fr' : 'repeat(4,1fr)', gap:8 }}>
              {COLS.map(col => {
                const colTasks = filtered.filter(t=>t.status===col.id)
                return (
                  <div key={col.id}
                    onDragOver={e=>{ e.preventDefault(); setDragOver(col.id) }}
                    onDrop={()=>onDrop(col.id)}
                    onDragLeave={()=>setDragOver(null)}
                    style={{ background: dragOver===col.id?'#EEF2FF':'#F8FAFC', borderRadius:10, border:`1px solid ${dragOver===col.id?'#6366F1':'#E2E8F0'}` }}>
                    <div style={{ padding:'6px 10px', borderBottom:'1px solid #E2E8F0', display:'flex', alignItems:'center', gap:6 }}>
                      <div style={{ width:6,height:6,borderRadius:'50%',background:col.color }} />
                      <span style={{ fontWeight:700,fontSize:10,color:'#0F172A',flex:1 }}>{col.label}</span>
                      <span style={{ fontSize:9,background:'#E2E8F0',color:'#475569',padding:'1px 5px',borderRadius:99 }}>{colTasks.length}</span>
                    </div>
                    <div style={{ padding:6,display:'flex',flexDirection:'column',gap:5,minHeight:60 }}>
                      {colTasks.map(t=>(
                        <div key={t.id} draggable onDragStart={()=>setDragId(t.id)}
                          onClick={()=>setSelTask(t.id===selTask?null:t.id)}
                          style={{ background:'#fff',borderRadius:7,padding:'7px 9px',border:`1px solid ${selTask===t.id?'#6366F1':'#E2E8F0'}`,cursor:'grab' }}>
                          <div style={{ fontSize:11,fontWeight:600,color:'#0F172A',marginBottom:4 }}>{t.titulo}</div>
                          <div style={{ display:'flex',gap:4,alignItems:'center' }}>
                            <PrioBadge v={t.prioridade} />
                            {t.prazo && <span style={{ fontSize:9,color:isVencida(t.prazo,t.status)?'#991B1B':'#94A3B8',marginLeft:'auto' }}>{fmt(t.prazo)}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── COLUNA CENTRAL: Detalhe da tarefa ────────────────────────── */}
      {selectedTask && (
        <div style={{ flex:1, display:'flex', flexDirection:'column', borderRight:'1px solid #E2E8F0', overflow:'hidden', background:'#fff' }}>
          {/* Header */}
          <div style={{ padding:'12px 16px', borderBottom:'1px solid #F1F5F9', display:'flex', alignItems:'flex-start', gap:8 }}>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:15, fontWeight:700, color:'#0F172A', marginBottom:5, lineHeight:1.3 }}>{selectedTask.titulo}</div>
              <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                <PrioBadge v={selectedTask.prioridade} />
                <StatusBadge v={selectedTask.status} />
              </div>
            </div>
            <div style={{ display:'flex', gap:5, flexShrink:0 }}>
              <Btn small onClick={()=>openEdit(selectedTask)}>✎ Editar</Btn>
              <button onClick={()=>setSelTask(null)} style={{ border:'none',background:'none',cursor:'pointer',color:'#94A3B8',fontSize:20,lineHeight:1 }}>×</button>
            </div>
          </div>

          {/* Meta */}
          <div style={{ padding:'10px 16px', borderBottom:'1px solid #F1F5F9', display:'flex', gap:16, flexWrap:'wrap', fontSize:12, color:'#64748B' }}>
            {selectedTask.clientes && <span>🏢 {selectedTask.clientes.fantasia||selectedTask.clientes.razao_social}</span>}
            {selectedTask.categoria && <span>📂 {selectedTask.categoria}</span>}
            {selectedTask.banco && <span style={{ color:'#1D4ED8',fontWeight:600 }}>🏦 {selectedTask.banco}</span>}
            {selectedTask.prazo && <span style={{ color:isVencida(selectedTask.prazo,selectedTask.status)?'#991B1B':'' }}>📅 {fmt(selectedTask.prazo)}</span>}
            {selectedTask.responsavel_id && <span>👤 {usuarios.find(u=>u.id===selectedTask.responsavel_id)?.nome||'—'}</span>}
          </div>

          {/* Como fazer — descrição operacional do modelo que gerou esta tarefa */}
          {selectedTask.modelo_id && modelos.find(m=>m.id===selectedTask.modelo_id)?.descricao && (
            <div style={{ padding:'10px 16px', borderBottom:'1px solid #F1F5F9', background:'#FFFBEB' }}>
              <div style={{ fontWeight:700, fontSize:11, color:'#92400E', marginBottom:4 }}>📋 Como fazer</div>
              <div style={{ fontSize:12, color:'#78350F', whiteSpace:'pre-wrap', lineHeight:1.5 }}>
                {modelos.find(m=>m.id===selectedTask.modelo_id)?.descricao}
              </div>
            </div>
          )}

          {/* Timer */}
          <div style={{ padding:'8px 16px', borderBottom:'1px solid #F1F5F9' }}>
            <Btn variant="success" small onClick={()=>{ const cl=clients.find(c=>c.id===selectedTask.cliente_id); startTimer(selectedTask.id, selectedTask.titulo, selectedTask.cliente_id, cl?.fantasia||cl?.razao_social||'') }}>
              ▶ Iniciar timer
            </Btn>
          </div>

          {/* Status rápido */}
          <div style={{ padding:'8px 16px', borderBottom:'1px solid #F1F5F9', display:'flex', gap:4, flexWrap:'wrap' }}>
            {['aberta','andamento','aguardando','revisao','concluida','impedimento'].map(st=>(
              <button key={st} onClick={()=>quickStatus(selectedTask.id,st)}
                style={{ fontSize:9,padding:'3px 8px',borderRadius:99,border:'none',cursor:'pointer',fontWeight:600,
                  background:selectedTask.status===st?'#6366F1':'#F1F5F9',color:selectedTask.status===st?'#fff':'#475569' }}>
                {st}
              </button>
            ))}
          </div>

          {/* Checklist */}
          <div style={{ padding:'10px 16px', borderBottom:'1px solid #F1F5F9' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
              <div style={{ fontWeight:700, fontSize:11, color:'#475569', flex:1 }}>✓ Checklist ({checklists.length})</div>
              {CHECKLIST_TEMPLATES[selectedTask?.categoria] && checklists.length === 0 && (
                <button
                  onClick={async () => {
                    const items = CHECKLIST_TEMPLATES[selectedTask.categoria]
                    for (const texto of items) {
                      await supabase.from('tarefa_checklists').insert({ tarefa_id: selTask, empresa_id: empresaId, texto })
                    }
                    qc.invalidateQueries({ queryKey: ['checklists', selTask] })
                  }}
                  style={{ fontSize:9, padding:'3px 8px', borderRadius:6, border:'1px solid #6366F1', background:'#EEF2FF', color:'#6366F1', cursor:'pointer', fontWeight:600, whiteSpace:'nowrap' }}>
                  ⚡ Usar template
                </button>
              )}
            </div>
            {checklists.map(ck=>(
              <div key={ck.id} style={{ display:'flex',alignItems:'center',gap:8,padding:'4px 0' }}>
                <input type="checkbox" checked={ck.concluido} onChange={e=>toggleCheck.mutate({id:ck.id,concluido:e.target.checked})}
                  style={{ width:14,height:14,accentColor:'#6366F1',flexShrink:0,cursor:'pointer' }} />
                <span style={{ flex:1,fontSize:11,color:ck.concluido?'#94A3B8':'#334155',textDecoration:ck.concluido?'line-through':'none' }}>{ck.texto}</span>
                <button onClick={()=>deleteCheck.mutate(ck.id)} style={{ border:'none',background:'none',cursor:'pointer',color:'#CBD5E1',fontSize:12 }}>×</button>
              </div>
            ))}
            {checklists.length > 0 && (
              <div style={{ padding:'4px 0', fontSize:10, color:'#94A3B8' }}>
                {checklists.filter(c=>c.concluido).length}/{checklists.length} concluídos
                <div style={{ height:3,background:'#F1F5F9',borderRadius:99,overflow:'hidden',marginTop:3 }}>
                  <div style={{ height:'100%',background:'#22C55E',borderRadius:99,width:`${checklists.length?Math.round(checklists.filter(c=>c.concluido).length/checklists.length*100):0}%`,transition:'width .3s' }} />
                </div>
              </div>
            )}
            <div style={{ display:'flex',gap:6,marginTop:8 }}>
              <input value={newCk} onChange={e=>setNewCk(e.target.value)}
                onKeyDown={e=>{ if(e.key==='Enter'&&newCk.trim()){ addCheck.mutate(newCk.trim()); setNewCk('') }}}
                placeholder="Adicionar item... (Enter)" style={{ ...fi2, flex:1 }} />
              <button onClick={()=>{ if(newCk.trim()){ addCheck.mutate(newCk.trim()); setNewCk('') }}}
                style={{ padding:'4px 10px',borderRadius:7,border:'none',background:'#6366F1',color:'#fff',cursor:'pointer',fontSize:11 }}>+</button>
            </div>
          </div>

          {/* Observações */}
          {selectedTask.obs && (
            <div style={{ padding:'10px 16px', fontSize:12, color:'#64748B', fontStyle:'italic', flex:1 }}>
              📝 {selectedTask.obs}
            </div>
          )}
        </div>
      )}

      {/* ── COLUNA DIREITA: Histórico + Anexos ───────────────────────── */}
      {selectedTask && (
        <div style={{ width:300, flexShrink:0, display:'flex', flexDirection:'column', background:'#FAFAFA', overflow:'hidden' }}>
          {/* Tabs */}
          <div style={{ display:'flex', borderBottom:'1px solid #E2E8F0' }}>
            {[['historico','📋 Histórico'],['anexos','📎 Anexos']].map(([id,label])=>(
              <button key={id} onClick={()=>setHistTab(id)}
                style={{ flex:1,padding:'10px 0',border:'none',background:'transparent',cursor:'pointer',fontSize:11,fontWeight:700,
                  color:histTab===id?'#6366F1':'#94A3B8',
                  borderBottom:histTab===id?'2px solid #6366F1':'2px solid transparent' }}>
                {label}
              </button>
            ))}
          </div>

          {/* Histórico */}
          {histTab === 'historico' && (
            <div style={{ flex:1, overflow:'auto', padding:'4px 0' }}>
              {historico.filter(h=>!h.acao?.startsWith(ANEXO_PREFIX)).length === 0
                ? <div style={{ padding:'24px',textAlign:'center',color:'#94A3B8',fontSize:11 }}>Sem histórico</div>
                : historico.filter(h=>!h.acao?.startsWith(ANEXO_PREFIX)).map(h=>(
                  <div key={h.id} style={{ padding:'8px 14px', borderBottom:'1px solid #F0F0F0' }}>
                    <div style={{ fontSize:11,color:'#334155' }}>{h.acao}</div>
                    <div style={{ fontSize:9,color:'#94A3B8',marginTop:2 }}>
                      {h.usuarios?.nome||'—'} · {new Date(h.criado_em).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}
                    </div>
                  </div>
                ))
              }
            </div>
          )}

          {/* Anexos */}
          {histTab === 'anexos' && (
            <div style={{ flex:1, overflow:'auto', display:'flex', flexDirection:'column' }}>
              {/* Upload */}
              <div style={{ padding:'12px 14px', borderBottom:'1px solid #E2E8F0' }}>
                <input
                  ref={fileInputRef}
                  type="file"
                  id="anexo-input"
                  style={{ display:'none' }}
                  onChange={e=>{ if(e.target.files[0]) uploadAnexo(e.target.files[0]) }}
                />
                <label htmlFor="anexo-input"
                  style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:8,padding:'10px',borderRadius:8,border:'2px dashed #CBD5E1',background:'#fff',cursor:'pointer',fontSize:12,fontWeight:600,color:'#64748B',transition:'all .15s' }}
                  onMouseOver={e=>{e.currentTarget.style.borderColor='#6366F1';e.currentTarget.style.color='#6366F1'}}
                  onMouseOut={e=>{e.currentTarget.style.borderColor='#CBD5E1';e.currentTarget.style.color='#64748B'}}>
                  {uploading ? '⏳ Enviando...' : '📎 Clique para anexar arquivo'}
                </label>
                <div style={{ fontSize:9, color:'#94A3B8', textAlign:'center', marginTop:4 }}>
                  Bucket "tarefas" deve existir no Supabase Storage
                </div>
              </div>

              {/* Lista de anexos */}
              <div style={{ flex:1, overflow:'auto', padding:'4px 0' }}>
                {anexos.length === 0
                  ? <div style={{ padding:'24px',textAlign:'center',color:'#94A3B8',fontSize:11 }}>Nenhum anexo</div>
                  : anexos.map(a => {
                    const ext = a.nome?.split('.').pop()?.toLowerCase()
                    const icon = ['pdf'].includes(ext)?'📄':['jpg','jpeg','png','gif','webp'].includes(ext)?'🖼️':['xlsx','xls','csv'].includes(ext)?'📊':['docx','doc'].includes(ext)?'📝':'📎'
                    return (
                      <div key={a.nome} style={{ padding:'8px 14px', borderBottom:'1px solid #F0F0F0', display:'flex', alignItems:'center', gap:8 }}>
                        <span style={{ fontSize:20, flexShrink:0 }}>{icon}</span>
                        <div style={{ flex:1, minWidth:0 }}>
                          <a href={a.url} target="_blank" rel="noreferrer"
                            style={{ fontSize:11,fontWeight:600,color:'#6366F1',textDecoration:'none',display:'block',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>
                            {a.nome}
                          </a>
                          {a.criado_em && (
                            <div style={{ fontSize:9,color:'#94A3B8',marginTop:1 }}>
                              {new Date(a.criado_em).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={async () => {
                            if (!confirm('Excluir anexo?')) return
                            const { error } = await supabase.storage.from('tarefas').remove([`${empresaId}/${selTask}/${a.nome}`])
                            if (error) alert('Erro ao excluir: ' + error.message)
                            else qc.invalidateQueries({ queryKey: ['anexos', selTask] })
                          }}
                          style={{ border:'none',background:'none',cursor:'pointer',color:'#CBD5E1',fontSize:14,padding:'2px 4px',flexShrink:0 }}
                          title="Excluir anexo"
                        >×</button>
                      </div>
                    )
                  })
                }
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── MODAL CRIAR/EDITAR ────────────────────────────────────────── */}
      {modal && (
        <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,padding:16 }}>
          <div style={{ background:'#fff',borderRadius:16,width:'100%',maxWidth:560,maxHeight:'90vh',display:'flex',flexDirection:'column' }}>
            <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 18px',borderBottom:'1px solid #F1F5F9' }}>
              <span style={{ fontWeight:700,fontSize:14 }}>{modal.mode==='new'?'Nova tarefa':'Editar tarefa'}</span>
              <button onClick={closeModal} style={{ border:'none',background:'none',cursor:'pointer',fontSize:20,color:'#94A3B8' }}>×</button>
            </div>
            <div style={{ padding:18,overflowY:'auto',flex:1,display:'flex',flexDirection:'column',gap:11 }}>
              {modal.mode === 'new' && modelos.filter(m=>m.ativo).length > 0 && (
                <div style={{ background:'#EEF2FF', border:'1px solid #C7D2FE', borderRadius:10, padding:'10px 12px' }}>
                  <label style={{ fontSize:10,fontWeight:700,color:'#4F46E5',display:'block',marginBottom:5,textTransform:'uppercase',letterSpacing:'.07em' }}>⚡ Puxar de um modelo pronto (opcional)</label>
                  <select value={modal.modeloId||''} onChange={e=>aplicarModelo(e.target.value)} style={fi}>
                    <option value="">— Começar do zero —</option>
                    {modelos.filter(m=>m.ativo).map(m=>(
                      <option key={m.id} value={m.id}>{m.titulo} · {m.categoria}{m.checklist_items?.length ? ` · ${m.checklist_items.length} itens` : ''}</option>
                    ))}
                  </select>
                  <div style={{ fontSize:9, color:'#6366F1', marginTop:4 }}>Preenche título, categoria, prioridade e checklist — você edita o que precisar depois (ex: nome do banco).</div>
                </div>
              )}
              <div>
                <label style={{ fontSize:10,fontWeight:700,color:'#94A3B8',display:'block',marginBottom:4,textTransform:'uppercase',letterSpacing:'.07em' }}>Título *</label>
                <input value={form.titulo||''} onChange={e=>setForm(f=>({...f,titulo:e.target.value}))} style={fi} placeholder="Descreva a tarefa..." autoFocus />
              </div>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:11 }}>
                <div>
                  <label style={{ fontSize:10,fontWeight:700,color:'#94A3B8',display:'block',marginBottom:4,textTransform:'uppercase',letterSpacing:'.07em' }}>Cliente</label>
                  <select value={form.cliente_id||''} onChange={e=>setForm(f=>({...f,cliente_id:e.target.value||null,banco:null}))} style={fi}>
                    <option value="">— Sem cliente —</option>
                    {clients.map(c=><option key={c.id} value={c.id}>{c.razao_social}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize:10,fontWeight:700,color:'#94A3B8',display:'block',marginBottom:4,textTransform:'uppercase',letterSpacing:'.07em' }}>Responsável</label>
                  <select value={form.responsavel_id||''} onChange={e=>setForm(f=>({...f,responsavel_id:e.target.value||null}))} style={fi}>
                    <option value="">— Selecionar —</option>
                    {usuarios.map(u=><option key={u.id} value={u.id}>{u.nome}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize:10,fontWeight:700,color:'#94A3B8',display:'block',marginBottom:4,textTransform:'uppercase',letterSpacing:'.07em' }}>Categoria</label>
                  <select value={form.categoria||''} onChange={e=>setForm(f=>({...f,categoria:e.target.value||null}))} style={fi}>
                    <option value="">— Categoria —</option>
                    {CATEGORIAS.map(c=><option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize:10,fontWeight:700,color:'#94A3B8',display:'block',marginBottom:4,textTransform:'uppercase',letterSpacing:'.07em' }}>Prazo</label>
                  <input type="date" value={form.prazo||''} onChange={e=>setForm(f=>({...f,prazo:e.target.value||null}))} style={fi} />
                </div>
                <div>
                  <label style={{ fontSize:10,fontWeight:700,color:'#94A3B8',display:'block',marginBottom:4,textTransform:'uppercase',letterSpacing:'.07em' }}>Prioridade</label>
                  <select value={form.prioridade||'media'} onChange={e=>setForm(f=>({...f,prioridade:e.target.value}))} style={fi}>
                    <option value="alta">🔴 Alta</option><option value="media">🟡 Média</option><option value="baixa">🟢 Baixa</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize:10,fontWeight:700,color:'#94A3B8',display:'block',marginBottom:4,textTransform:'uppercase',letterSpacing:'.07em' }}>Status</label>
                  <select value={form.status||'aberta'} onChange={e=>setForm(f=>({...f,status:e.target.value}))} style={fi}>
                    <option value="aberta">Aberta</option><option value="andamento">Em andamento</option>
                    <option value="aguardando">Ag. cliente</option><option value="revisao">Em revisão</option>
                    <option value="concluida">Concluída</option><option value="impedimento">Impedimento</option>
                  </select>
                </div>
              </div>
              {showBanco && (
                <div>
                  <label style={{ fontSize:10,fontWeight:700,color:'#1D4ED8',display:'block',marginBottom:4,textTransform:'uppercase',letterSpacing:'.07em' }}>🏦 Banco a conciliar</label>
                  <select value={form.banco||''} onChange={e=>setForm(f=>({...f,banco:e.target.value||null}))} style={fi}>
                    <option value="">— Selecione o banco —</option>
                    {clientBancos.length>0 && <optgroup label="Bancos do cliente">{clientBancos.map(b=><option key={b} value={b}>{b}</option>)}</optgroup>}
                    <optgroup label="Todos os bancos">{BANCOS.map(b=><option key={b} value={b}>{b}</option>)}</optgroup>
                  </select>
                </div>
              )}
              <div>
                <label style={{ fontSize:10,fontWeight:700,color:'#94A3B8',display:'block',marginBottom:4,textTransform:'uppercase',letterSpacing:'.07em' }}>Observações</label>
                <textarea value={form.obs||''} onChange={e=>setForm(f=>({...f,obs:e.target.value}))} style={{ ...fi,height:65,resize:'vertical' }} />
              </div>
              <div>
                <label style={{ fontSize:10,fontWeight:700,color:'#EF4444',display:'block',marginBottom:4,textTransform:'uppercase',letterSpacing:'.07em' }}>⚠ Motivo da pendência</label>
                <input value={form.motivo_pendencia||''} onChange={e=>setForm(f=>({...f,motivo_pendencia:e.target.value}))} style={fi} placeholder="Ex: Aguardando extrato do cliente" />
              </div>
            </div>
            <div style={{ padding:'11px 18px',borderTop:'1px solid #F1F5F9',display:'flex',justifyContent:'flex-end',gap:8 }}>
              <Btn onClick={closeModal}>Cancelar</Btn>
              <Btn variant="primary" onClick={save} disabled={createTask.isPending||updateTask.isPending}>
                {createTask.isPending||updateTask.isPending?'Salvando…':'Salvar'}
              </Btn>
            </div>
          </div>
        </div>
      )}

      {importOpen && (
        <Suspense fallback={null}>
          <ImportModal
            open={importOpen}
            onClose={() => setImportOpen(false)}
            title="Importar Tarefas"
            downloadTemplate={() => import('../utils/excel').then(m => m.downloadTarefaTemplate())}
            mapRow={mapRowToTarefa}
            previewCols={[
              { label: 'Título',    key: 'titulo' },
              { label: 'Categoria', key: 'categoria' },
              { label: 'Status',    key: 'status' },
              { label: 'Prazo',     key: 'prazo' },
            ]}
            onImport={async (rows) => {
              const validas = rows.filter(Boolean) // remove linhas de comentário (null)
              for (const row of validas) await createTask.mutateAsync(row)
            }}
          />
        </Suspense>
      )}
    </div>
    </>
  )
}

// ── TaskRow — componente de linha reutilizável ──────────────────────────
function TaskRow({ t, selTask, setSelTask, openEdit, deleteTask, quickStatus, selectedTask, today, onSaveMotivo }) {
  const [editandoMotivo, setEditandoMotivo] = useState(false)
  const [motivo, setMotivo] = useState(t.motivo_pendencia || '')

  const dataRef    = t.data_execucao || t.prazo
  const isPendente = dataRef && dataRef < today && t.status !== 'concluida'
  const isHoje     = dataRef === today
  const active     = selTask === t.id

  const dataLabel = dataRef
    ? new Date(dataRef + 'T12:00:00').toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric' })
    : null

  function salvarMotivo(e) {
    e.stopPropagation()
    onSaveMotivo(t.id, motivo)
    setEditandoMotivo(false)
  }

  const rowBg = active ? '#EEF2FF' : isPendente ? '#FFF8F8' : ''
  const borderL = isPendente ? '3px solid #EF4444' : isHoje ? '3px solid #6366F1' : '3px solid transparent'

  return (
    <div style={{ borderLeft: borderL, borderBottom:'1px solid #F1F5F9', background: rowBg }}>

      {/* Linha principal */}
      <div onClick={() => setSelTask(t.id === selTask ? null : t.id)}
        style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 12px', cursor:'pointer' }}
        onMouseEnter={e => { if (!active) e.currentTarget.style.background = '#F8FAFC' }}
        onMouseLeave={e => { e.currentTarget.style.background = '' }}>

        {/* Checkbox */}
        <button onClick={e => { e.stopPropagation(); quickStatus(t.id, t.status === 'concluida' ? 'aberta' : 'concluida') }}
          style={{ width:17, height:17, borderRadius:3, border:`2px solid ${t.status==='concluida'?'#22C55E':'#CBD5E1'}`, background:t.status==='concluida'?'#22C55E':'transparent', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          {t.status === 'concluida' && <span style={{ color:'#fff', fontSize:9 }}>✓</span>}
        </button>

        {/* Data */}
        <div style={{ minWidth:86, flexShrink:0 }}>
          {dataLabel ? (
            <span style={{ fontSize:11, fontWeight:700, padding:'2px 7px', borderRadius:6, whiteSpace:'nowrap',
              color: isPendente ? '#991B1B' : isHoje ? '#1D4ED8' : '#475569',
              background: isPendente ? '#FEE2E2' : isHoje ? '#DBEAFE' : '#F1F5F9' }}>
              {dataLabel}
            </span>
          ) : <span style={{ fontSize:11, color:'#CBD5E1' }}>—</span>}
        </div>

        {/* Título + cliente */}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:12, fontWeight:600,
            color: t.status==='concluida' ? '#94A3B8' : isPendente ? '#7F1D1D' : '#0F172A',
            textDecoration: t.status==='concluida' ? 'line-through' : 'none',
            overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {t.modelo_id && <span style={{ fontSize:9, color:'#8B5CF6', marginRight:4 }}>↻</span>}
            {t.titulo}
          </div>
          <div style={{ fontSize:10, color:'#94A3B8', marginTop:1 }}>
            {t.clientes?.fantasia || t.clientes?.razao_social || ''}
          </div>
        </div>

        {/* Status badge */}
        {isPendente && (
          <span style={{ fontSize:10, fontWeight:700, color:'#991B1B', background:'#FEE2E2', padding:'2px 8px', borderRadius:99, whiteSpace:'nowrap', flexShrink:0 }}>
            Pendente
          </span>
        )}
        {!isPendente && !selectedTask && <StatusBadge v={t.status} />}
        <PrioBadge v={t.prioridade} />

        {/* Ações */}
        <div style={{ display:'flex', gap:4, flexShrink:0 }}>
          <button onClick={e => { e.stopPropagation(); openEdit(t) }} style={{ padding:'2px 6px', borderRadius:5, border:'1px solid #E2E8F0', background:'#fff', color:'#475569', cursor:'pointer', fontSize:10 }}>✎</button>
          <button onClick={e => {
            e.stopPropagation()
            if (t.modelo_id) {
              const ok = confirm('Excluir só esta ocorrência?\n\n✓ OK = exclui apenas esta tarefa de hoje\n✗ Cancelar = não faz nada\n\nPara parar de gerar esta tarefa, desative o modelo em Modelos.')
              if (ok) deleteTask.mutate(t.id)
            } else {
              if (confirm('Excluir tarefa?')) deleteTask.mutate(t.id)
            }
          }} style={{ padding:'2px 6px', borderRadius:5, border:'1px solid #FECDD3', background:'#FEF2F2', color:'#991B1B', cursor:'pointer', fontSize:10 }}>×</button>
        </div>
      </div>

      {/* Motivo de pendência */}
      {isPendente && (
        <div onClick={e => e.stopPropagation()} style={{ padding:'0 12px 8px 44px', display:'flex', alignItems:'center', gap:6 }}>
          {editandoMotivo ? (
            <>
              <input autoFocus value={motivo} onChange={e => setMotivo(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') salvarMotivo(e); if (e.key === 'Escape') setEditandoMotivo(false) }}
                placeholder="Por que está pendente? Ex: Aguardando extrato do cliente"
                style={{ flex:1, fontSize:11, padding:'4px 8px', border:'1px solid #FCA5A5', borderRadius:6, fontFamily:'inherit', outline:'none', background:'#fff' }} />
              <button onClick={salvarMotivo} style={{ fontSize:10, padding:'3px 10px', borderRadius:6, border:'none', background:'#EF4444', color:'#fff', cursor:'pointer', fontWeight:600, whiteSpace:'nowrap' }}>Salvar</button>
              <button onClick={e => { e.stopPropagation(); setEditandoMotivo(false) }} style={{ fontSize:10, padding:'3px 8px', borderRadius:6, border:'1px solid #E2E8F0', background:'#fff', color:'#94A3B8', cursor:'pointer' }}>✕</button>
            </>
          ) : (
            <button onClick={e => { e.stopPropagation(); setEditandoMotivo(true) }}
              style={{ fontSize:10, color: t.motivo_pendencia ? '#7F1D1D' : '#94A3B8', background:'transparent', border:'none', cursor:'pointer', textAlign:'left', padding:0 }}>
              {t.motivo_pendencia
                ? `⚠ ${t.motivo_pendencia}`
                : '+ Informar motivo da pendência'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
