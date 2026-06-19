import { useState, lazy, Suspense } from 'react'
import { useClients, useCreateClient, useUpdateClient, useDeleteClient, useRotinas, useCreateRotina, useDeleteRotina, useTasks, useCreateTask, useUpdateTask, useDeleteTask, useTarefaModelos, useClienteModelos, useVincularModelo, useDesvincularModelo, useAcessos, useSaveAcesso, useDeleteAcesso } from '../hooks/useData'
import { Card, CardHeader, Badge, Btn, Loader, EmptyState, fmt, fmtR } from '../components/ui'
import { useAuthStore } from '../store/authStore'
import { supabase } from '../lib/supabase'
import ContextTooltip from '../components/ui/ContextTooltip'
import { CLIENTES_EXPORT_COLS, mapRowToCliente } from '../utils/excelMappings'

// ImportModal e downloadClienteTemplate puxam as libs de planilha (~800KB) —
// só devem ser carregados quando o usuário realmente abrir o import/export,
// não no carregamento inicial da página de clientes.
const ImportModal = lazy(() => import('../components/ui/ImportModal'))

const ETAPA_COLOR = { comercial:'pu', pre_ob:'yw', onboarding:'bl', implantacao:'or', operacional:'gr', estrategico:'cy', acompanhamento:'gy', encerramento:'gy' }
const ETAPA_LABEL = { comercial:'Comercial', pre_ob:'Pré-Onb.', onboarding:'Onboarding', implantacao:'Implantação', operacional:'Operacional', estrategico:'Estratégico', acompanhamento:'Acompanham.', encerramento:'Encerramento' }
const STATUS_COLOR = { ativo:'gr', onboarding:'bl', implantacao:'or', inativo:'gy', pausado:'yw' }
const STATUS_LABEL = { ativo:'Ativo', inativo:'Inativo', pausado:'Pausado', onboarding:'Onboarding', implantacao:'Implantação' }

const CATEGORIAS_COFRE = [
  { id:'banco',    icon:'🏦', label:'Banco' },
  { id:'erp',      icon:'💻', label:'ERP / Sistema' },
  { id:'governo',  icon:'🏛', label:'Governo' },
  { id:'email',    icon:'📧', label:'E-mail' },
  { id:'outro',    icon:'🔑', label:'Outro' },
]
function getCatCofre(id) { return CATEGORIAS_COFRE.find(c=>c.id===id) || CATEGORIAS_COFRE[4] }

const BANCOS_LIST = ['Banco do Brasil','Santander','Caixa Econômica Federal','Bradesco','Itaú','Nubank','C6 Bank','Banco Inter','Mercado Pago','PagBank','Sicoob','Sicredi','Banco Original','BTG Pactual','Stone','Cora','Asaas','Outro']
const SOFTWARES = ['Omie','Conta Azul','Meu Dinheiro Web','Nibo','Bom Controle','Bling','Nexaas','Gestão Fácil','Outro']

function fmtCNPJ(v) {
  const n = v.replace(/\D/g, '').slice(0, 14)
  return n.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
    .replace(/^(\d{2})(\d{3})(\d{3})(\d{4})$/, '$1.$2.$3/$4')
    .replace(/^(\d{2})(\d{3})(\d{3})$/, '$1.$2.$3')
    .replace(/^(\d{2})(\d{3})$/, '$1.$2')
    .replace(/^(\d{2})$/, '$1')
}

export default function ClientsPage() {
  const { data: clients = [], isLoading } = useClients()
  const createClient = useCreateClient()
  const updateClient = useUpdateClient()
  const deleteClient = useDeleteClient()
  const { temPermissao, empresa } = useAuthStore()

  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [importOpen, setImportOpen] = useState(false)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({})
  const [cnpjLoading, setCnpjLoading] = useState(false)
  const [cnpjError, setCnpjError] = useState('')
  const [selectedBancos, setSelectedBancos] = useState([])
  const [tab, setTab] = useState('dados') // dados | financeiro | bancos | cofre | rotina | tarefas
  const [showAddModelo, setShowAddModelo] = useState(false)

  // Cofre (acessos) — escopado ao cliente aberto
  const canSeeSenhas = temPermissao('ver_senhas')
  const { data: acessosCliente = [], isLoading: acessosLoading } = useAcessos(modal?.mode === 'edit' ? modal?.id : null)
  const saveAcesso = useSaveAcesso()
  const deleteAcesso = useDeleteAcesso()
  const [cofreSearch, setCofreSearch] = useState('')
  const [revealedAcesso, setRevealedAcesso] = useState({})
  const [cofreModal, setCofreModal] = useState(null) // { mode:'new'|'edit', id? }
  const [cofreForm, setCofreForm] = useState({})

  async function toggleRevealAcesso(ac) {
    const id = ac.id
    if (revealedAcesso[id]) { setRevealedAcesso(p => { const n = {...p}; delete n[id]; return n }); return }
    if (!ac.senha_enc) return
    setRevealedAcesso(p => ({...p, [id]: 'loading'}))
    try {
      const { data, error } = await supabase.rpc('cofre_decrypt', { acesso_id: id })
      if (error) throw error
      setRevealedAcesso(p => ({...p, [id]: data || ''}))
    } catch (err) {
      console.error('Erro ao descriptografar:', err)
      setRevealedAcesso(p => { const n = {...p}; delete n[id]; return n })
      alert('Não foi possível revelar a senha agora. Tente novamente em instantes.')
    }
  }

  function openNewAcesso() { setCofreForm({ categoria:'outro' }); setCofreModal({ mode:'new' }) }
  function openEditAcesso(a) {
    const { senha_enc, ...rest } = a
    setCofreForm({ ...rest, _temSenha: !!senha_enc })
    setCofreModal({ mode:'edit', id:a.id })
  }

  async function salvarAcessoCliente() {
    if (!cofreForm.sistema?.trim()) return alert('Informe o nome do sistema')
    const { _temSenha, _novaSenha, ...dados } = cofreForm
    const payload = { ...dados, cliente_id: modal.id, empresa_id: empresa?.id }
    if (_novaSenha?.trim()) {
      const { data: enc, error: encErr } = await supabase.rpc('cofre_encrypt', { plaintext: _novaSenha })
      if (encErr) return alert('Erro ao criptografar a senha. Tente novamente.')
      payload.senha_enc = enc
    } else {
      delete payload.senha_enc
    }
    try {
      if (cofreModal.mode === 'edit') {
        await saveAcesso.mutateAsync({ id: cofreModal.id, ...payload })
      } else {
        await saveAcesso.mutateAsync(payload)
      }
    } catch (err) {
      alert('Erro ao salvar acesso: ' + (err?.message || 'erro desconhecido'))
      return
    }
    setCofreModal(null); setCofreForm({}); setRevealedAcesso({})
  }

  const acessosFiltrados = acessosCliente.filter(a => {
    const q = cofreSearch.toLowerCase()
    return !q || a.sistema?.toLowerCase().includes(q) || a.login?.toLowerCase().includes(q)
  })

  // Rotinas
  const { data: rotinas = [] } = useRotinas(modal?.id)
  const createRotina  = useCreateRotina()
  const deleteRotina  = useDeleteRotina()
  const { data: clienteModelos = [] } = useClienteModelos(modal?.mode === 'edit' ? modal?.id : null)
  const vincularModelo    = useVincularModelo()
  const desvincularModelo = useDesvincularModelo()
  const { data: todosModelos = [] } = useTarefaModelos()
  const DIAS_SEMANA_R = ['Segunda','Terça','Quarta','Quinta','Sexta','Sábado','Domingo']
  const [rotinaForm, setRotinaForm] = useState({ titulo:'', tipo:'semanal', dias_semana:[0], dia_mes:1, hora:'08:00', observacao:'' })
  const [rotinaErr,  setRotinaErr]  = useState('')

  // Tarefas do cliente
  const { data: tarefasCliente = [] } = useTasks({ clientId: modal?.id })
  const { data: modelos = [] } = useTarefaModelos()
  const createTask = useCreateTask()
  const updateTask = useUpdateTask()
  const deleteTask = useDeleteTask()
  const [taskForm, setTaskForm] = useState({ titulo:'', prazo:'', status:'aberta', prioridade:'media' })
  const [taskErr,  setTaskErr]  = useState('')

  // Sugestão de modelos ao mudar etapa
  const [sugestaoEtapa,    setSugestaoEtapa]    = useState(null)   // etapa que disparou a sugestão
  const [showAplicarModal, setShowAplicarModal] = useState(false)
  const [modelosSel,       setModelosSel]       = useState([])     // ids selecionados no modal
  const [aplicando,        setAplicando]        = useState(false)
  const [aplicadoOk,       setAplicadoOk]       = useState(false)

  const ETAPA_LABEL_M = { comercial:'Comercial', pre_ob:'Pré-Onboarding', onboarding:'Onboarding', implantacao:'Implantação', operacional:'Operacional', estrategico:'Estratégico', acompanhamento:'Acompanhamento', encerramento:'Encerramento' }

  function onEtapaChange(novaEtapa) {
    setForm(f => ({ ...f, etapa: novaEtapa }))
    setAplicadoOk(false)
    const sugestoes = modelos.filter(m => m.etapa === novaEtapa)
    if (sugestoes.length > 0 && modal?.mode === 'edit') {
      setSugestaoEtapa(novaEtapa)
      setModelosSel(sugestoes.map(m => m.id))
    } else {
      setSugestaoEtapa(null)
    }
  }

  function abrirAplicarModal() {
    const sugestoes = modelos.filter(m => m.etapa === sugestaoEtapa)
    setModelosSel(sugestoes.map(m => m.id))
    setShowAplicarModal(true)
  }

  async function aplicarModelos() {
    setAplicando(true)
    const selecionados = modelos.filter(m => modelosSel.includes(m.id))
    for (const m of selecionados) {
      // Não cria se já existir tarefa ativa com o mesmo título para este cliente
      const jaExiste = tarefasCliente.some(t => t.titulo === m.titulo && t.status !== 'concluida')
      if (jaExiste) continue
      await createTask.mutateAsync({
        titulo:     m.titulo,
        prioridade: m.prioridade || 'normal',
        status:     'pendente',
        prazo:      null,
        cliente_id: modal.id,
      })
    }
    setAplicando(false)
    setShowAplicarModal(false)
    setSugestaoEtapa(null)
    setAplicadoOk(true)
  }

  async function salvarTarefa() {
    if (!taskForm.titulo.trim()) { setTaskErr('Informe o título da tarefa'); return }
    setTaskErr('')
    await createTask.mutateAsync({ ...taskForm, prazo: taskForm.prazo || null, cliente_id: modal.id, data_execucao: new Date().toISOString().slice(0,10) })
    setTaskForm({ titulo:'', prazo:'', status:'aberta', prioridade:'media' })
  }

  async function vincularEAplicarModelo(modelo) {
    try {
      await vincularModelo.mutateAsync({ clienteId: modal?.id, modeloId: modelo.id })
      // Modelos "pontuais" (vindos de Esteira) não esperam o gerador diário —
      // criam a tarefa de verdade já no momento do vínculo, com checklist,
      // e com data_execucao = hoje pra já aparecer em "Meu Dia".
      if (modelo.recorrencia === 'unica') {
        const tarefa = await createTask.mutateAsync({
          titulo: modelo.titulo, categoria: modelo.categoria || null,
          prioridade: modelo.prioridade || 'media', status: 'aberta',
          cliente_id: modal.id, modelo_id: modelo.id,
          data_execucao: new Date().toISOString().slice(0,10),
        })
        if (modelo.checklist_items?.length && tarefa?.id) {
          const items = modelo.checklist_items.map((texto, ordem) => ({ tarefa_id: tarefa.id, texto, ordem }))
          await supabase.from('tarefa_checklists').insert(items)
        }
      }
    } catch (err) {
      alert('Não foi possível vincular o modelo: ' + (err?.message || 'erro desconhecido'))
    }
  }

  async function salvarRotina() {
    if (!rotinaForm.titulo.trim()) { setRotinaErr('Informe o título da rotina'); return }
    if (rotinaForm.tipo === 'semanal' && rotinaForm.dias_semana.length === 0) {
      setRotinaErr('Selecione pelo menos um dia da semana'); return
    }
    setRotinaErr('')
    try {
      // dia_semana (singular) é mantido só por compatibilidade com dados antigos/AgendaPage
      await createRotina.mutateAsync({
        ...rotinaForm,
        dia_semana: rotinaForm.tipo === 'semanal' ? rotinaForm.dias_semana[0] : null,
        cliente_id: modal.id, ativo: true,
      })
      setRotinaForm({ titulo:'', tipo:'semanal', dias_semana:[0], dia_mes:1, hora:'08:00', observacao:'' })
    } catch (err) {
      setRotinaErr('Erro ao salvar: ' + (err?.message || 'erro desconhecido'))
    }
  }

  function toggleDiaSemana(i) {
    setRotinaForm(f => ({
      ...f,
      dias_semana: f.dias_semana.includes(i) ? f.dias_semana.filter(d => d !== i) : [...f.dias_semana, i].sort()
    }))
  }

  const filtered = clients.filter(c => {
    const q = search.toLowerCase()
    const ms = !q || c.razao_social?.toLowerCase().includes(q) || c.fantasia?.toLowerCase().includes(q) || c.cnpj?.includes(q)
    const mst = !filterStatus || c.status === filterStatus
    return ms && mst
  })

  function openNew() {
    setForm({ status:'ativo', etapa:'operacional' })
    setSelectedBancos([])
    setTab('dados')
    setModal({ mode:'new' })
    setCnpjError('')
  }

  function openEdit(cl) {
    setForm({ ...cl })
    setSelectedBancos(cl.bancos || [])
    setTab('dados')
    setModal({ mode:'edit', id: cl.id })
    setCnpjError('')
  }

  function close() { setModal(null); setForm({}); setSelectedBancos([]) }

  // Busca CNPJ na BrasilAPI
  async function buscarCNPJ() {
    const cnpj = (form.cnpj || '').replace(/\D/g, '')
    if (cnpj.length !== 14) { setCnpjError('CNPJ deve ter 14 dígitos'); return }
    setCnpjLoading(true)
    setCnpjError('')
    try {
      const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`)
      if (!res.ok) { setCnpjError('CNPJ não encontrado na Receita Federal'); setCnpjLoading(false); return }
      const data = await res.json()
      setForm(f => ({
        ...f,
        razao_social: data.razao_social || f.razao_social,
        fantasia: data.nome_fantasia || f.fantasia,
        email: data.email || f.email,
        segmento: data.cnae_fiscal_descricao || f.segmento,
        // Endereço
        logradouro: data.logradouro,
        municipio: data.municipio,
        uf: data.uf,
        cep: data.cep,
      }))
      setCnpjError('')
    } catch (e) {
      setCnpjError('Erro ao consultar CNPJ. Tente novamente.')
    }
    setCnpjLoading(false)
  }

  function toggleBanco(banco) {
    setSelectedBancos(prev =>
      prev.includes(banco) ? prev.filter(b => b !== banco) : [...prev, banco]
    )
  }

  async function save() {
    if (!form.razao_social) { alert('Razão social é obrigatória'); return }
    const payload = { ...form, bancos: selectedBancos }
    if (modal.mode === 'new') {
      await createClient.mutateAsync(payload)
    } else {
      await updateClient.mutateAsync({ id: modal.id, ...payload })
    }
    close()
  }

  if (isLoading) return <Loader />

  const fi = { width:'100%', padding:'7px 10px', border:'1px solid var(--bo)', borderRadius:'var(--r)', fontSize:12, fontFamily:'inherit', background:'var(--sur)', color:'var(--tx)', outline:'none' }

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14, flexWrap:'wrap' }}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar cliente..."
          className="fi" style={{ width:220 }} />
        <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} className="fi" style={{ width:150 }}>
          <option value="">Todos os status</option>
          <option value="ativo">Ativo</option>
          <option value="onboarding">Onboarding</option>
          <option value="implantacao">Implantação</option>
          <option value="inativo">Inativo</option>
          <option value="pausado">Pausado</option>
        </select>
        <div style={{ flex:1 }} />
        <span style={{ fontSize:11, color:'var(--tx3)' }}>{filtered.length} cliente{filtered.length!==1?'s':''}</span>
        <button onClick={() => import('../utils/excel').then(m => m.exportToXlsx(filtered, CLIENTES_EXPORT_COLS, 'clientes.xlsx'))}
          style={{ padding:'6px 12px', borderRadius:8, border:'1px solid #CBD5E1', background:'#fff', cursor:'pointer', fontSize:12, fontWeight:600, color:'#334155' }}>
          ⬇ Exportar Excel
        </button>
        <button onClick={() => setImportOpen(true)}
          style={{ padding:'6px 12px', borderRadius:8, border:'1px solid #CBD5E1', background:'#fff', cursor:'pointer', fontSize:12, fontWeight:600, color:'#334155' }}>
          ⬆ Importar
        </button>
        <button className="btn bp bsm" onClick={openNew}>
          <i className="fa-solid fa-plus"></i> Novo cliente
        </button>
      </div>

      {/* Table */}
      <div className="card">
        {filtered.length === 0
          ? <EmptyState icon="🏢" title="Nenhum cliente cadastrado" sub="Clique em novo cliente para começar"
              action={<button className="btn bp" onClick={openNew}><i className="fa-solid fa-plus"></i> Novo cliente</button>} />
          : <table className="tbl">
              <thead>
                <tr>
                  {['Cliente','CNPJ','Etapa','Status','MRR','Software','Ações'].map(h => (
                    <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:10, fontWeight:700, color:'var(--tx3)', textTransform:'uppercase', letterSpacing:'.06em', borderBottom:'1px solid var(--bo)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(cl => (
                  <tr key={cl.id} style={{ borderBottom:'1px solid var(--s2)' }}
                    onMouseEnter={e=>e.currentTarget.style.background='var(--s2)'}
                    onMouseLeave={e=>e.currentTarget.style.background=''}>
                    <td style={{ padding:'10px 14px' }}>
                      <div style={{ fontWeight:600, fontSize:12, color:'var(--tx)' }}>{cl.razao_social}</div>
                      {cl.fantasia && <div style={{ fontSize:10, color:'var(--tx3)' }}>{cl.fantasia}</div>}
                    </td>
                    <td style={{ padding:'10px 14px', fontSize:11, color:'var(--tx2)', fontFamily:'var(--mo)' }}>{cl.cnpj || '—'}</td>
                    <td style={{ padding:'10px 14px' }}><span className={`b b-${ETAPA_COLOR[cl.etapa]||'gy'}`}>{ETAPA_LABEL[cl.etapa]||cl.etapa}</span></td>
                    <td style={{ padding:'10px 14px' }}><span className={`b b-${STATUS_COLOR[cl.status]||'gy'}`}>{STATUS_LABEL[cl.status] || cl.status}</span></td>
                    <td style={{ padding:'10px 14px', fontSize:12, fontWeight:600, color:'var(--grt)', fontFamily:'var(--mo)' }}>{fmtR(cl.valor_mrr)}</td>
                    <td style={{ padding:'10px 14px', fontSize:11, color:'var(--tx2)' }}>{cl.software_erp || '—'}</td>
                    <td style={{ padding:'10px 14px' }}>
                      <div style={{ display:'flex', gap:5 }}>
                        <button className="btn bo bsm" onClick={() => openEdit(cl)}>
                          <i className="fa-solid fa-pencil"></i>
                        </button>
                        {temPermissao('delete_client') && (
                          <button className="btn bsm" style={{ background:'var(--rdb)', color:'var(--rdt)', border:'1px solid #FECDD3' }}
                            onClick={() => { if(confirm('Excluir cliente permanentemente?')) deleteClient.mutate(cl.id) }}>
                            <i className="fa-solid fa-trash"></i>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
        }
      </div>

      {/* Modal */}
      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:16 }}>
          <div style={{ background:'var(--sur)', borderRadius:'var(--rx)', width:'100%', maxWidth:640, maxHeight:'90vh', display:'flex', flexDirection:'column', boxShadow:'var(--sh3)' }}>
            {/* Modal header */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 18px', borderBottom:'1px solid var(--bo)' }}>
              <span style={{ fontWeight:700, fontSize:15, color:'var(--tx)' }}>
                {modal.mode==='new' ? 'Novo cliente' : 'Editar cliente'}
              </span>
              <button onClick={close} style={{ border:'none', background:'none', cursor:'pointer', fontSize:20, color:'var(--tx3)' }}>×</button>
            </div>

            {/* Tabs */}
            <div style={{ display:'flex', borderBottom:'1px solid var(--bo)', padding:'0 18px' }}>
              {[['dados','📋 Dados'],['financeiro','💰 Financeiro'],['bancos','🏦 Bancos'],['cofre','🔐 Cofre'],['rotina','🔁 Rotina'],['tarefas','✅ Tarefas']].map(([id, label]) => (
                <button key={id} onClick={() => setTab(id)}
                  style={{ padding:'8px 14px', border:'none', background:'transparent', cursor:'pointer', fontSize:11, fontWeight:600,
                    color: tab===id?'var(--br)':'var(--tx3)', borderBottom: tab===id?'2px solid var(--br)':'2px solid transparent', marginBottom:-1 }}>
                  {label}
                </button>
              ))}
            </div>

            {/* Modal body */}
            <div style={{ padding:18, overflowY:'auto', flex:1 }}>

              {/* ABA DADOS */}
              {tab === 'dados' && (
                <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                  {/* CNPJ com busca */}
                  <div>
                    <label style={{ fontSize:10, fontWeight:700, color:'var(--tx3)', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'.07em' }}>CNPJ</label>
                    <div style={{ display:'flex', gap:8 }}>
                      <input value={form.cnpj||''} onChange={e=>setForm(f=>({...f,cnpj:fmtCNPJ(e.target.value)}))}
                        placeholder="00.000.000/0001-00" className="fi" style={{ flex:1 }} />
                      <button className="btn bp bsm" onClick={buscarCNPJ} disabled={cnpjLoading}
                        style={{ whiteSpace:'nowrap', flexShrink:0 }}>
                        {cnpjLoading
                          ? <><i className="fa-solid fa-spinner spin"></i> Buscando...</>
                          : <><i className="fa-solid fa-magnifying-glass"></i> Buscar na Receita</>
                        }
                      </button>
                    </div>
                    {cnpjError && <div style={{ fontSize:11, color:'var(--rdt)', marginTop:4 }}>{cnpjError}</div>}
                    <div style={{ fontSize:10, color:'var(--tx3)', marginTop:4 }}>
                      Digite o CNPJ e clique em "Buscar na Receita" para preencher automaticamente
                    </div>
                  </div>

                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                    <div>
                      <label style={{ fontSize:10, fontWeight:700, color:'var(--tx3)', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'.07em' }}>Razão social *</label>
                      <input value={form.razao_social||''} onChange={e=>setForm(f=>({...f,razao_social:e.target.value}))} className="fi" placeholder="Razão Social Ltda" />
                    </div>
                    <div>
                      <label style={{ fontSize:10, fontWeight:700, color:'var(--tx3)', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'.07em' }}>Nome fantasia</label>
                      <input value={form.fantasia||''} onChange={e=>setForm(f=>({...f,fantasia:e.target.value}))} className="fi" placeholder="Nome fantasia" />
                    </div>
                    <div>
                      <label style={{ fontSize:10, fontWeight:700, color:'var(--tx3)', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'.07em' }}>Segmento / atividade</label>
                      <input value={form.segmento||''} onChange={e=>setForm(f=>({...f,segmento:e.target.value}))} className="fi" placeholder="Ex: Comércio varejista" />
                    </div>
                    <div>
                      <label style={{ fontSize:10, fontWeight:700, color:'var(--tx3)', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'.07em' }}>E-mail</label>
                      <input type="email" value={form.email||''} onChange={e=>setForm(f=>({...f,email:e.target.value}))} className="fi" placeholder="financeiro@empresa.com.br" />
                    </div>
                    <div>
                      <label style={{ fontSize:10, fontWeight:700, color:'var(--tx3)', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'.07em' }}>Contato / responsável</label>
                      <input value={form.contato||''} onChange={e=>setForm(f=>({...f,contato:e.target.value}))} className="fi" placeholder="Nome do responsável" />
                    </div>
                    <div>
                      <label style={{ fontSize:10, fontWeight:700, color:'var(--tx3)', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'.07em' }}>WhatsApp</label>
                      <input value={form.whatsapp||''} onChange={e=>setForm(f=>({...f,whatsapp:e.target.value}))} className="fi" placeholder="(11) 99999-0000" />
                    </div>
                  </div>

                  {/* Endereço se buscou CNPJ */}
                  {form.municipio && (
                    <div style={{ background:'var(--s2)', borderRadius:'var(--r)', padding:'10px 12px', fontSize:11, color:'var(--tx2)' }}>
                      <i className="fa-solid fa-location-dot" style={{ color:'var(--br)', marginRight:6 }}></i>
                      {form.logradouro && `${form.logradouro}, `}{form.municipio} — {form.uf} · CEP {form.cep}
                    </div>
                  )}
                </div>
              )}

              {/* ABA FINANCEIRO */}
              {tab === 'financeiro' && (
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <div>
                    <label style={{ fontSize:10, fontWeight:700, color:'var(--tx3)', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'.07em' }}>MRR (R$/mês)</label>
                    <input type="number" value={form.valor_mrr||''} onChange={e=>setForm(f=>({...f,valor_mrr:e.target.value}))} className="fi" placeholder="0,00" step="0.01" />
                  </div>
                  <div>
                    <label style={{ fontSize:10, fontWeight:700, color:'var(--tx3)', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'.07em' }}>Vencimento (dia do mês)</label>
                    <input type="number" value={form.vencimento_dia||''} onChange={e=>setForm(f=>({...f,vencimento_dia:e.target.value}))} className="fi" placeholder="10" min={1} max={28} />
                  </div>
                  <div style={{ gridColumn:'1/-1' }}>
                    <label style={{ fontSize:10, fontWeight:700, color:'var(--tx3)', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'.07em' }}>Etapa BPO</label>
                    <select value={form.etapa||'operacional'} onChange={e => onEtapaChange(e.target.value)} className="fi">
                      {Object.entries(ETAPA_LABEL).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                    {/* Banner de sugestão */}
                    {sugestaoEtapa && !aplicadoOk && (
                      <div style={{ marginTop:8, padding:'10px 14px', background:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:'var(--r)', display:'flex', alignItems:'center', gap:10 }}>
                        <span style={{ fontSize:18 }}>🎯</span>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:12, fontWeight:700, color:'#1D4ED8' }}>
                            {modelos.filter(m => m.etapa === sugestaoEtapa).length} tarefas recomendadas para {ETAPA_LABEL_M[sugestaoEtapa]}
                          </div>
                          <div style={{ fontSize:11, color:'#3B82F6' }}>Aplique o checklist padrão com um clique</div>
                        </div>
                        <button onClick={abrirAplicarModal}
                          style={{ padding:'6px 14px', background:'#2563EB', color:'#fff', border:'none', borderRadius:6, cursor:'pointer', fontSize:12, fontWeight:700, flexShrink:0 }}>
                          Ver e aplicar
                        </button>
                        <button onClick={() => setSugestaoEtapa(null)}
                          style={{ background:'none', border:'none', cursor:'pointer', color:'#94A3B8', fontSize:16, lineHeight:1, flexShrink:0 }}>×</button>
                      </div>
                    )}
                    {aplicadoOk && (
                      <div style={{ marginTop:8, padding:'8px 14px', background:'#F0FDF4', border:'1px solid #BBF7D0', borderRadius:'var(--r)', fontSize:12, color:'#15803D', fontWeight:600 }}>
                        ✓ Tarefas criadas! Configure prazos e responsáveis na aba Tarefas.
                      </div>
                    )}
                  </div>
                  <div>
                    <label style={{ fontSize:10, fontWeight:700, color:'var(--tx3)', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'.07em' }}>Status</label>
                    <select value={form.status||'ativo'} onChange={e=>setForm(f=>({...f,status:e.target.value}))} className="fi">
                      <option value="ativo">Ativo</option>
                      <option value="onboarding">Onboarding</option>
                      <option value="implantacao">Implantação</option>
                      <option value="inativo">Inativo</option>
                      <option value="pausado">Pausado</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize:10, fontWeight:700, color:'var(--tx3)', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'.07em' }}>Software / ERP</label>
                    <select value={form.software_erp||''} onChange={e=>setForm(f=>({...f,software_erp:e.target.value||null}))} className="fi">
                      <option value="">— Selecionar —</option>
                      {SOFTWARES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize:10, fontWeight:700, color:'var(--tx3)', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'.07em' }}>Início do contrato</label>
                    <input type="date" value={form.inicio_contrato||''} onChange={e=>setForm(f=>({...f,inicio_contrato:e.target.value||null}))} className="fi" />
                  </div>
                  <div style={{ gridColumn:'1/-1' }}>
                    <label style={{ fontSize:10, fontWeight:700, color:'var(--tx3)', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'.07em' }}>Escopo dos serviços</label>
                    <textarea value={form.escopo||''} onChange={e=>setForm(f=>({...f,escopo:e.target.value}))}
                      placeholder="Descreva os serviços contratados..."
                      style={{ width:'100%', height:70, padding:'8px 10px', border:'1px solid var(--bo)', borderRadius:'var(--r)', fontSize:12, fontFamily:'inherit', background:'var(--sur)', color:'var(--tx)', resize:'vertical' }} />
                  </div>
                </div>
              )}

              {/* ABA BANCOS */}
              {tab === 'bancos' && (
                <div>
                  <div style={{ fontSize:12, color:'var(--tx2)', marginBottom:14 }}>
                    Selecione os bancos utilizados por este cliente. Eles aparecerão em destaque ao criar tarefas de conciliação bancária.
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                    {BANCOS_LIST.map(banco => (
                      <label key={banco} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px', borderRadius:'var(--r)', border:`1px solid ${selectedBancos.includes(banco)?'var(--br)':'var(--bo)'}`, background: selectedBancos.includes(banco)?'var(--brl)':'var(--sur)', cursor:'pointer', transition:'all .15s' }}>
                        <input type="checkbox" checked={selectedBancos.includes(banco)} onChange={() => toggleBanco(banco)}
                          style={{ width:14, height:14, accentColor:'var(--br)', flexShrink:0 }} />
                        <span style={{ fontSize:12, fontWeight: selectedBancos.includes(banco)?600:400, color: selectedBancos.includes(banco)?'var(--br)':'var(--tx)' }}>
                          {banco}
                        </span>
                      </label>
                    ))}
                  </div>
                  {selectedBancos.length > 0 && (
                    <div style={{ marginTop:12, padding:'8px 12px', background:'var(--brl)', borderRadius:'var(--r)', fontSize:11, color:'var(--br)', fontWeight:600 }}>
                      <i className="fa-solid fa-check-circle" style={{ marginRight:6 }}></i>
                      {selectedBancos.length} banco{selectedBancos.length>1?'s':'s'} selecionado{selectedBancos.length>1?'s':''}:  {selectedBancos.join(', ')}
                    </div>
                  )}
                </div>
              )}

              {/* ABA TAREFAS */}
              {tab === 'tarefas' && (
                modal?.mode === 'new'
                  ? <div style={{ padding:'28px 16px', textAlign:'center', color:'var(--tx3)', fontSize:13 }}>Salve o cliente primeiro para adicionar tarefas.</div>
                  : <div style={{ display:'flex', flexDirection:'column', gap:10 }}>

                    {/* Lista de tarefas */}
                    {tarefasCliente.length === 0 ? (
                      <div style={{ textAlign:'center', padding:'28px 0', color:'var(--tx3)' }}>
                        <div style={{ fontSize:24, marginBottom:8 }}>📋</div>
                        <div style={{ fontSize:13, fontWeight:600, marginBottom:4 }}>Nenhuma tarefa ainda</div>
                        <div style={{ fontSize:11 }}>Vá em <strong>Financeiro → Etapa BPO</strong> para aplicar o checklist padrão,<br/>ou adicione uma tarefa avulsa abaixo.</div>
                      </div>
                    ) : (
                      <div style={{ display:'flex', flexDirection:'column', gap:5, maxHeight:300, overflowY:'auto' }}>
                        <div style={{ fontSize:10, fontWeight:700, color:'var(--tx3)', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:2 }}>
                          {tarefasCliente.length} tarefa{tarefasCliente.length!==1?'s':''}
                        </div>
                        {tarefasCliente.map(t => {
                          const statusColor = { aberta:'#3B82F6', andamento:'#F59E0B', aguardando:'#8B5CF6', revisao:'#06B6D4', concluida:'#22C55E', impedimento:'#EF4444' }
                          const statusLabel = { aberta:'Aberta', andamento:'Em andamento', aguardando:'Ag. cliente', revisao:'Em revisão', concluida:'Concluída', impedimento:'Impedimento' }
                          const prazoVencido = t.prazo && new Date(t.prazo) < new Date() && t.status !== 'concluida'
                          return (
                            <div key={t.id} style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 12px', border:`1px solid ${prazoVencido?'#FECDD3':'var(--bo)'}`, borderRadius:'var(--r)', background: prazoVencido?'#FFF1F2':'var(--s2)' }}>
                              <div style={{ flex:1, minWidth:0 }}>
                                <div style={{ fontSize:12, fontWeight:600, color:'var(--tx)', textDecoration: t.status==='concluida'?'line-through':'none' }}>{t.titulo}</div>
                                <div style={{ display:'flex', gap:6, marginTop:3, flexWrap:'wrap', alignItems:'center' }}>
                                  <span style={{ fontSize:9, padding:'1px 6px', borderRadius:99, background: (statusColor[t.status]||'#94A3B8')+'22', color: statusColor[t.status]||'#94A3B8', fontWeight:700 }}>
                                    {statusLabel[t.status] || t.status}
                                  </span>
                                  {t.prazo && <span style={{ fontSize:9, color: prazoVencido?'var(--rdt)':'var(--tx3)' }}>{prazoVencido?'⚠ ':''}{new Date(t.prazo+'T12:00:00').toLocaleDateString('pt-BR')}</span>}
                                  {t.usuarios?.nome && <span style={{ fontSize:9, color:'var(--tx3)', background:'var(--bo)', padding:'1px 5px', borderRadius:99 }}>👤 {t.usuarios.nome}</span>}
                                </div>
                              </div>
                              {t.status !== 'concluida' && (
                                <button onClick={() => updateTask.mutate({ id: t.id, status:'concluida' }, { onError: (err) => alert('Erro ao concluir: ' + (err?.message||'')) })}
                                  style={{ border:'1px solid #BBF7D0', background:'#F0FDF4', color:'#15803D', borderRadius:5, cursor:'pointer', fontSize:10, padding:'3px 8px', fontWeight:700, flexShrink:0 }}>✓</button>
                              )}
                              <button onClick={() => { if(confirm('Remover esta tarefa?')) deleteTask.mutate(t.id, { onError: (err) => alert('Erro ao remover: ' + (err?.message||'')) }) }}
                                style={{ border:'1px solid #FECDD3', background:'#FEF2F2', color:'#991B1B', borderRadius:5, cursor:'pointer', fontSize:10, padding:'3px 8px', fontWeight:700, flexShrink:0 }}>×</button>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {/* Tarefa avulsa */}
                    <div style={{ borderTop:'1px solid var(--bo)', paddingTop:12 }}>
                      <div style={{ fontSize:10, fontWeight:700, color:'var(--tx3)', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:8 }}>+ Tarefa avulsa</div>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr auto auto', gap:8, alignItems:'end' }}>
                        <input value={taskForm.titulo} onChange={e=>setTaskForm(f=>({...f,titulo:e.target.value}))}
                          onKeyDown={e => e.key==='Enter' && salvarTarefa()}
                          className="fi" placeholder="Título da tarefa..." />
                        <input type="date" value={taskForm.prazo} onChange={e=>setTaskForm(f=>({...f,prazo:e.target.value}))} className="fi" style={{ width:140 }} />
                        <button className="btn bp bsm" onClick={salvarTarefa} disabled={createTask.isPending}>
                          {createTask.isPending ? '…' : '+ Adicionar'}
                        </button>
                      </div>
                      {taskErr && <div style={{ fontSize:11, color:'var(--rdt)', marginTop:4 }}>{taskErr}</div>}
                    </div>
                  </div>
              )}


              {/* ABA TAREFAS — vínculos de modelos */}
              {tab === 'tarefas' && (
                <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                  {modal?.mode === 'new' ? (
                    <div style={{ padding:'28px 16px', textAlign:'center', color:'var(--tx3)', fontSize:13 }}>
                      Salve o cliente primeiro para vincular tarefas.
                    </div>
                  ) : (
                    <>
                      {/* Info */}
                      <div style={{ background:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:'var(--r)', padding:'12px 14px', fontSize:12, color:'#1D4ED8', lineHeight:1.6 }}>
                        <div style={{ fontWeight:700, marginBottom:4 }}>✅ Tarefas vinculadas</div>
                        Selecione os modelos de rotina que se aplicam a este cliente. Eles ficam registrados aqui — a geração das tarefas é feita separadamente quando você quiser.
                      </div>

                      {/* Modelos vinculados */}
                      {clienteModelos.length > 0 ? (
                        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                          <div style={{ fontSize:10, fontWeight:700, color:'var(--tx3)', textTransform:'uppercase', letterSpacing:'.07em' }}>
                            {clienteModelos.length} modelo(s) vinculado(s)
                          </div>
                          {clienteModelos.map(cm => (
                            <div key={cm.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', border:'1px solid var(--bo)', borderRadius:'var(--r)', background:'var(--s2)' }}>
                              <div style={{ flex:1 }}>
                                <div style={{ fontSize:12, fontWeight:600, color:'var(--tx)' }}>{cm.tarefa_modelos?.titulo}</div>
                                <div style={{ fontSize:10, color:'var(--tx3)', marginTop:2 }}>
                                  {cm.tarefa_modelos?.categoria} · {cm.tarefa_modelos?.recorrencia} · Prioridade {cm.tarefa_modelos?.prioridade}
                                </div>
                              </div>
                              <button onClick={() => { if(confirm('Desvincular este modelo do cliente?')) desvincularModelo.mutate({ id: cm.id, clienteId: modal?.id }, { onError: (err) => alert('Erro ao desvincular: ' + (err?.message || 'erro desconhecido')) }) }}
                                style={{ border:'none', background:'none', cursor:'pointer', color:'var(--tx3)', fontSize:18, lineHeight:1, padding:'4px' }}>×</button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ padding:'20px', textAlign:'center', color:'var(--tx3)', fontSize:12, border:'1px dashed var(--bo)', borderRadius:'var(--r)' }}>
                          Nenhum modelo vinculado ainda.
                        </div>
                      )}

                      {/* Adicionar modelo */}
                      {!showAddModelo ? (
                        <button onClick={() => setShowAddModelo(true)}
                          style={{ padding:'9px 16px', borderRadius:'var(--r)', border:'1px dashed var(--bo)', background:'transparent', cursor:'pointer', fontSize:12, fontWeight:600, color:'var(--br)', width:'100%' }}>
                          + Vincular modelo de tarefa
                        </button>
                      ) : (
                        <div style={{ border:'1px solid var(--bo)', borderRadius:'var(--r)', padding:'14px', background:'var(--sur)' }}>
                          <div style={{ fontSize:11, fontWeight:700, color:'var(--tx3)', marginBottom:10, textTransform:'uppercase' }}>Selecionar modelo</div>
                          <div style={{ display:'flex', flexDirection:'column', gap:6, maxHeight:300, overflowY:'auto' }}>
                            {todosModelos
                              .filter(m => m.ativo && !clienteModelos.find(cm => cm.modelo_id === m.id))
                              .filter(m => {
                                // Trava: se o modelo é específico de um software (ex: "Configurar Omie"),
                                // só aparece pra clientes que usam aquele software — evita repetir o
                                // problema de oferecer/criar a tarefa de todos os ERPs pro mesmo cliente.
                                if (!m.software_alvo) return true
                                const softwareCliente = (clients.find(c=>c.id===modal?.id)?.software_contabil || '').trim().toLowerCase()
                                return m.software_alvo.toLowerCase() === softwareCliente
                              })
                              .map(m => (
                                <div key={m.id}
                                  onClick={() => vincularEAplicarModelo(m)}
                                  style={{ padding:'10px 12px', border:'1px solid var(--bo)', borderRadius:'var(--r)', cursor:'pointer', background:'var(--s2)' }}
                                  onMouseEnter={e => e.currentTarget.style.background='var(--s3)'}
                                  onMouseLeave={e => e.currentTarget.style.background='var(--s2)'}>
                                  <div style={{ fontSize:12, fontWeight:600, color:'var(--tx)' }}>{m.titulo}</div>
                                  <div style={{ fontSize:10, color:'var(--tx3)', marginTop:2 }}>
                                    {m.categoria} · {m.recorrencia === 'unica' ? '⚡ pontual (cria tarefa na hora)' : m.recorrencia}
                                  </div>
                                </div>
                              ))}
                            {todosModelos.filter(m => m.ativo && !clienteModelos.find(cm => cm.modelo_id === m.id)).length === 0 && (
                              <div style={{ fontSize:12, color:'var(--tx3)', textAlign:'center', padding:'12px' }}>Todos os modelos já estão vinculados.</div>
                            )}
                          </div>
                          <button onClick={() => setShowAddModelo(false)}
                            style={{ marginTop:10, padding:'6px 14px', borderRadius:'var(--r)', border:'1px solid var(--bo)', background:'transparent', cursor:'pointer', fontSize:11, color:'var(--tx3)' }}>
                            Fechar
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* ABA COFRE */}
              {tab === 'cofre' && (
                <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                  {modal?.mode === 'new' ? (
                    <div style={{ padding:'28px 16px', textAlign:'center', color:'var(--tx3)', fontSize:13 }}>
                      Salve o cliente primeiro para adicionar acessos ao cofre.
                    </div>
                  ) : (<>
                    <div style={{ background:'#F5F3FF', border:'1px solid #DDD6FE', borderRadius:'var(--r)', padding:'12px 14px', fontSize:12, color:'#6D28D9', lineHeight:1.6 }}>
                      <div style={{ fontWeight:700, marginBottom:4 }}>🔐 Cofre de senhas deste cliente</div>
                      Logins e senhas de bancos, ERPs e portais ficam criptografados no servidor — nunca em texto puro no app.
                    </div>

                    <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                      <input value={cofreSearch} onChange={e=>setCofreSearch(e.target.value)} placeholder="🔍 Buscar sistema ou login..."
                        className="fi" style={{ flex:1 }} />
                      {canSeeSenhas && (
                        <button className="btn bp bsm" onClick={openNewAcesso} style={{ whiteSpace:'nowrap', flexShrink:0 }}>
                          + Novo acesso
                        </button>
                      )}
                    </div>

                    {acessosLoading ? (
                      <Loader />
                    ) : acessosFiltrados.length === 0 ? (
                      <div style={{ padding:'24px 16px', textAlign:'center', color:'var(--tx3)', fontSize:12 }}>
                        Nenhum acesso cadastrado para este cliente ainda.
                      </div>
                    ) : (
                      <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                        {acessosFiltrados.map(ac => {
                          const cat = getCatCofre(ac.categoria)
                          const revState = revealedAcesso[ac.id]
                          const isLoadingRev = revState === 'loading'
                          const isRev = revState && revState !== 'loading'
                          return (
                            <div key={ac.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', border:'1px solid var(--bo)', borderRadius:'var(--r)', background:'var(--s2)' }}>
                              <span style={{ fontSize:16 }}>{cat.icon}</span>
                              <div style={{ flex:1, minWidth:0 }}>
                                <div style={{ fontSize:12, fontWeight:600, color:'var(--tx)' }}>{ac.sistema}</div>
                                <div style={{ fontSize:10, color:'var(--tx3)', display:'flex', gap:8, flexWrap:'wrap' }}>
                                  {ac.login && <span>👤 {ac.login}</span>}
                                  {ac.url && <span>🔗 {ac.url}</span>}
                                  {ac.obs && <em>{ac.obs}</em>}
                                </div>
                              </div>
                              {canSeeSenhas && ac.senha_enc ? (
                                <div style={{ textAlign:'right', flexShrink:0 }}>
                                  <div style={{ fontFamily:'monospace', fontSize:11, color:'var(--tx)', marginBottom:3 }}>
                                    {isLoadingRev ? '⏳' : isRev ? revState : '••••••••'}
                                  </div>
                                  <button onClick={() => toggleRevealAcesso(ac)} disabled={isLoadingRev}
                                    style={{ padding:'2px 7px', borderRadius:6, border:'1px solid var(--bo)', background:'var(--sur)', color:'var(--tx3)', cursor:'pointer', fontSize:9, fontWeight:600 }}>
                                    {isLoadingRev ? '...' : isRev ? '🙈 Ocultar' : '👁 Revelar'}
                                  </button>
                                </div>
                              ) : !ac.senha_enc ? (
                                <span style={{ fontSize:10, color:'var(--tx3)', flexShrink:0 }}>sem senha</span>
                              ) : null}
                              {canSeeSenhas && (
                                <div style={{ display:'flex', gap:4, flexShrink:0 }}>
                                  <button onClick={() => openEditAcesso(ac)}
                                    style={{ border:'none', background:'none', cursor:'pointer', color:'var(--tx3)', fontSize:13 }}>✏</button>
                                  <button onClick={() => { if(confirm('Excluir este acesso?')) deleteAcesso.mutate(ac.id) }}
                                    style={{ border:'none', background:'none', cursor:'pointer', color:'var(--tx3)', fontSize:16, lineHeight:1 }}>×</button>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </>)}
                </div>
              )}

              {/* ABA ROTINA */}
              {tab === 'rotina' && (
                <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                  {modal?.mode === 'new' ? (
                    <div style={{ padding:'28px 16px', textAlign:'center', color:'var(--tx3)', fontSize:13 }}>
                      Salve o cliente primeiro para adicionar rotinas.
                    </div>
                  ) : (<>

                    {/* Tooltip educativo — some depois de fechado uma vez (localStorage) */}
                    <ContextTooltip
                      pageKey="rotina_cliente"
                      icon="🗓"
                      title="O que é a Rotina do cliente?"
                      color="#1D4ED8"
                      tips={[
                        'É a agenda fixa desse cliente: o que precisa ser feito, em que dia e horário — ex: "Toda terça às 10h, agendamento bancário" ou "Todo dia útil às 8h, conciliação".',
                        'Cadastrada aqui, ela aparece sozinha na Central Operacional no dia e horário certos — você não precisa lembrar nem recriar toda semana.',
                        'Dica pra quem trabalha sozinho: reserve um horário fixo só pra WhatsApp (ex: 8h e 14h). Ficar respondendo cliente o dia todo no chat impede a operação de andar — a rotina ajuda a proteger esse tempo.',
                        'Não é obrigatório usar — se você não cadastrar nada aqui, essa aba simplesmente fica vazia.',
                      ]}
                    />

                    {/* Rotinas existentes */}
                    {rotinas.length > 0 && (
                      <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                        <div style={{ fontSize:10, fontWeight:700, color:'var(--tx3)', textTransform:'uppercase', letterSpacing:'.07em' }}>Rotinas cadastradas</div>
                        {[...rotinas].sort((a,b) => (a.hora||'').localeCompare(b.hora||'')).map(r => (
                          <div key={r.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', border:'1px solid var(--bo)', borderRadius:'var(--r)', background:'var(--s2)' }}>
                            <div style={{ width:46, flexShrink:0, textAlign:'center' }}>
                              <div style={{ fontSize:13, fontWeight:700, color:'var(--br)' }}>{r.hora ? r.hora.slice(0,5) : '—'}</div>
                            </div>
                            <span style={{ fontSize:16 }}>{r.tipo === 'diaria' ? '🔁' : r.tipo === 'semanal' ? '📅' : '📆'}</span>
                            <div style={{ flex:1 }}>
                              <div style={{ fontSize:12, fontWeight:600, color:'var(--tx)' }}>{r.titulo}</div>
                              <div style={{ fontSize:10, color:'var(--tx3)' }}>
                                {r.tipo === 'diaria'
                                  ? 'Todos os dias'
                                  : r.tipo === 'semanal'
                                    ? (r.dias_semana?.length ? r.dias_semana.map(d=>DIAS_SEMANA_R[d].slice(0,3)).join(', ') : DIAS_SEMANA_R[r.dia_semana])
                                    : `Todo dia ${r.dia_mes}`}
                                {r.observacao && <> · <em>{r.observacao}</em></>}
                              </div>
                            </div>
                            <button onClick={() => { if(confirm('Remover esta rotina?')) deleteRotina.mutate(r.id) }}
                              style={{ border:'none', background:'none', cursor:'pointer', color:'var(--tx3)', fontSize:18, lineHeight:1 }}>×</button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Form nova rotina */}
                    <div style={{ border:'1px solid var(--bo)', borderRadius:'var(--r)', padding:'14px', background:'var(--sur)' }}>
                      <div style={{ fontSize:10, fontWeight:700, color:'var(--tx3)', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:10 }}>+ Nova rotina</div>
                      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                        <div>
                          <label style={{ fontSize:10, fontWeight:700, color:'var(--tx3)', display:'block', marginBottom:4, textTransform:'uppercase', letterSpacing:'.07em' }}>Título *</label>
                          <input value={rotinaForm.titulo} onChange={e=>setRotinaForm(f=>({...f,titulo:e.target.value}))}
                            className="fi" placeholder="Ex: Agendamento bancário, Checar WhatsApp, Conciliação..." />
                        </div>
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                          <div>
                            <label style={{ fontSize:10, fontWeight:700, color:'var(--tx3)', display:'block', marginBottom:4, textTransform:'uppercase', letterSpacing:'.07em' }}>Recorrência</label>
                            <select value={rotinaForm.tipo} onChange={e=>setRotinaForm(f=>({...f,tipo:e.target.value}))} className="fi">
                              <option value="diaria">Todo dia</option>
                              <option value="semanal">Semanal (escolher dias)</option>
                              <option value="mensal">Mensal (dia fixo do mês)</option>
                            </select>
                          </div>
                          <div>
                            <label style={{ fontSize:10, fontWeight:700, color:'var(--tx3)', display:'block', marginBottom:4, textTransform:'uppercase', letterSpacing:'.07em' }}>Horário</label>
                            <input type="time" value={rotinaForm.hora} onChange={e=>setRotinaForm(f=>({...f,hora:e.target.value}))} className="fi" />
                          </div>
                          {rotinaForm.tipo === 'semanal' && (
                            <div style={{ gridColumn:'1/-1' }}>
                              <label style={{ fontSize:10, fontWeight:700, color:'var(--tx3)', display:'block', marginBottom:4, textTransform:'uppercase', letterSpacing:'.07em' }}>Dias da semana</label>
                              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                                {DIAS_SEMANA_R.map((d,i) => (
                                  <button key={i} type="button" onClick={() => toggleDiaSemana(i)}
                                    style={{
                                      padding:'5px 10px', borderRadius:99, fontSize:11, fontWeight:600, cursor:'pointer',
                                      border: rotinaForm.dias_semana.includes(i) ? '1px solid var(--br)' : '1px solid var(--bo)',
                                      background: rotinaForm.dias_semana.includes(i) ? 'var(--brl)' : 'var(--sur)',
                                      color: rotinaForm.dias_semana.includes(i) ? 'var(--br)' : 'var(--tx3)',
                                    }}>
                                    {d.slice(0,3)}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                          {rotinaForm.tipo === 'mensal' && (
                            <div>
                              <label style={{ fontSize:10, fontWeight:700, color:'var(--tx3)', display:'block', marginBottom:4, textTransform:'uppercase', letterSpacing:'.07em' }}>Dia do mês</label>
                              <input type="number" min={1} max={31} value={rotinaForm.dia_mes}
                                onChange={e=>setRotinaForm(f=>({...f,dia_mes:Number(e.target.value)}))} className="fi" />
                            </div>
                          )}
                          <div style={{ gridColumn: rotinaForm.tipo === 'diaria' ? '1/-1' : undefined }}>
                            <label style={{ fontSize:10, fontWeight:700, color:'var(--tx3)', display:'block', marginBottom:4, textTransform:'uppercase', letterSpacing:'.07em' }}>Observação</label>
                            <input value={rotinaForm.observacao} onChange={e=>setRotinaForm(f=>({...f,observacao:e.target.value}))}
                              className="fi" placeholder="Detalhe opcional..." />
                          </div>
                        </div>
                        {rotinaErr && <div style={{ fontSize:11, color:'var(--rdt)' }}>{rotinaErr}</div>}
                        <button className="btn bp bsm" onClick={salvarRotina} disabled={createRotina.isPending}
                          style={{ alignSelf:'flex-start' }}>
                          {createRotina.isPending ? 'Salvando…' : '+ Adicionar rotina'}
                        </button>
                      </div>
                    </div>
                  </>)}
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding:'12px 18px', borderTop:'1px solid var(--bo)', display:'flex', justifyContent:'flex-end', gap:8 }}>
              <button className="btn bo" onClick={close}>Fechar</button>
              {tab !== 'tarefas' && tab !== 'rotina' && tab !== 'cofre' && (
                <button className="btn bp" onClick={save} disabled={createClient.isPending||updateClient.isPending}>
                  {createClient.isPending||updateClient.isPending ? 'Salvando…' : 'Salvar cliente'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de aplicar modelos por etapa */}
      {showAplicarModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1100, padding:16 }}>
          <div style={{ background:'var(--sur)', borderRadius:'var(--rx)', width:'100%', maxWidth:480, maxHeight:'80vh', display:'flex', flexDirection:'column', boxShadow:'var(--sh3)' }}>
            <div style={{ padding:'14px 18px', borderBottom:'1px solid var(--bo)', display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ fontSize:20 }}>🎯</span>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, fontSize:14, color:'var(--tx)' }}>Checklist de {ETAPA_LABEL_M[sugestaoEtapa]}</div>
                <div style={{ fontSize:11, color:'var(--tx3)' }}>Selecione as tarefas para criar neste cliente</div>
              </div>
              <button onClick={() => setShowAplicarModal(false)} style={{ border:'none', background:'none', cursor:'pointer', fontSize:20, color:'var(--tx3)' }}>×</button>
            </div>
            <div style={{ padding:'12px 18px', overflowY:'auto', flex:1, display:'flex', flexDirection:'column', gap:6 }}>
              {modelos.filter(m => m.etapa === sugestaoEtapa).map(m => {
                const checked = modelosSel.includes(m.id)
                const jaExiste = tarefasCliente.some(t => t.titulo === m.titulo && t.status !== 'concluida')
                const priColor = { baixa:'#16A34A', media:'#D97706', alta:'#DC2626' }
                return (
                  <label key={m.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px', border:`1px solid ${jaExiste?'#E2E8F0':checked?'var(--br)':'var(--bo)'}`, borderRadius:'var(--r)', background: jaExiste?'var(--s2)':checked?'var(--brl)':'var(--sur)', cursor: jaExiste?'default':'pointer', opacity: jaExiste?.6:1 }}>
                    <input type="checkbox" checked={checked && !jaExiste} disabled={jaExiste}
                      onChange={() => !jaExiste && setModelosSel(s => checked ? s.filter(x=>x!==m.id) : [...s, m.id])}
                      style={{ width:14, height:14, accentColor:'var(--br)', flexShrink:0 }} />
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:12, fontWeight:600, color:'var(--tx)' }}>{m.titulo}</div>
                      {m.categoria && <div style={{ fontSize:10, color:'var(--tx3)' }}>{m.categoria}</div>}
                    </div>
                    {jaExiste
                      ? <span style={{ fontSize:9, color:'#15803D', background:'#DCFCE7', padding:'2px 6px', borderRadius:99, fontWeight:700, flexShrink:0 }}>já existe</span>
                      : <div style={{ width:8, height:8, borderRadius:'50%', background: priColor[m.prioridade]||'#94A3B8', flexShrink:0 }} title={m.prioridade} />
                    }
                  </label>
                )
              })}
            </div>
            <div style={{ padding:'12px 18px', borderTop:'1px solid var(--bo)', display:'flex', gap:8, justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontSize:11, color:'var(--tx3)' }}>{modelosSel.length} selecionada{modelosSel.length!==1?'s':''}</span>
              <div style={{ display:'flex', gap:8 }}>
                <button className="btn bo" onClick={() => setShowAplicarModal(false)}>Cancelar</button>
                <button className="btn bp" onClick={aplicarModelos} disabled={aplicando || modelosSel.length===0}>
                  {aplicando ? 'Criando tarefas…' : `✓ Aplicar ${modelosSel.length} tarefa${modelosSel.length!==1?'s':''}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal novo/editar acesso do Cofre */}
      {cofreModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1200, padding:16 }}>
          <div style={{ background:'var(--sur)', borderRadius:'var(--rx)', width:'100%', maxWidth:460, maxHeight:'85vh', display:'flex', flexDirection:'column', boxShadow:'var(--sh3)' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 18px', borderBottom:'1px solid var(--bo)' }}>
              <span style={{ fontWeight:700, fontSize:14, color:'var(--tx)' }}>🔐 {cofreModal.mode==='new' ? 'Novo acesso' : 'Editar acesso'}</span>
              <button onClick={() => { setCofreModal(null); setCofreForm({}) }} style={{ border:'none', background:'none', cursor:'pointer', fontSize:20, color:'var(--tx3)' }}>×</button>
            </div>
            <div style={{ padding:'16px 18px', overflowY:'auto', flex:1, display:'flex', flexDirection:'column', gap:12 }}>
              <div>
                <label style={{ fontSize:10, fontWeight:700, color:'var(--tx3)', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'.07em' }}>Sistema / Nome *</label>
                <input value={cofreForm.sistema||''} onChange={e=>setCofreForm(f=>({...f,sistema:e.target.value}))} className="fi" placeholder="Ex: Banco do Brasil, Omie, SEFAZ..." autoFocus />
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div>
                  <label style={{ fontSize:10, fontWeight:700, color:'var(--tx3)', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'.07em' }}>Categoria</label>
                  <select value={cofreForm.categoria||'outro'} onChange={e=>setCofreForm(f=>({...f,categoria:e.target.value}))} className="fi">
                    {CATEGORIAS_COFRE.map(c=><option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize:10, fontWeight:700, color:'var(--tx3)', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'.07em' }}>Login / Usuário</label>
                  <input value={cofreForm.login||''} onChange={e=>setCofreForm(f=>({...f,login:e.target.value}))} className="fi" placeholder="usuario@email.com" />
                </div>
              </div>
              <div>
                <label style={{ fontSize:10, fontWeight:700, color:'var(--br)', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'.07em' }}>
                  🔑 {cofreModal.mode==='edit' ? 'Nova senha (deixe em branco para manter)' : 'Senha'}
                </label>
                <input type="text" value={cofreForm._novaSenha||''} onChange={e=>setCofreForm(f=>({...f,_novaSenha:e.target.value}))}
                  className="fi" placeholder={cofreModal.mode==='edit' && cofreForm._temSenha ? '(senha mantida)' : 'Senha ou token de acesso'} />
                {cofreModal.mode==='edit' && cofreForm._temSenha && (
                  <div style={{ fontSize:9, color:'var(--tx3)', marginTop:3 }}>🔒 Senha criptografada armazenada. Digite para substituir.</div>
                )}
              </div>
              <div>
                <label style={{ fontSize:10, fontWeight:700, color:'var(--tx3)', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'.07em' }}>URL / Endereço</label>
                <input value={cofreForm.url||''} onChange={e=>setCofreForm(f=>({...f,url:e.target.value}))} className="fi" placeholder="https://..." />
              </div>
              <div>
                <label style={{ fontSize:10, fontWeight:700, color:'var(--tx3)', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'.07em' }}>Observações</label>
                <textarea value={cofreForm.obs||''} onChange={e=>setCofreForm(f=>({...f,obs:e.target.value}))} className="fi" style={{ height:60, resize:'vertical' }} placeholder="Informações adicionais..." />
              </div>
            </div>
            <div style={{ padding:'12px 18px', borderTop:'1px solid var(--bo)', display:'flex', justifyContent:'flex-end', gap:8 }}>
              <button className="btn bo" onClick={() => { setCofreModal(null); setCofreForm({}) }}>Cancelar</button>
              <button className="btn bp" onClick={salvarAcessoCliente} disabled={saveAcesso.isPending}>
                {saveAcesso.isPending ? 'Salvando…' : 'Salvar acesso'}
              </button>
            </div>
          </div>
        </div>
      )}

      {importOpen && (
        <Suspense fallback={null}>
          <ImportModal
            open={importOpen}
            onClose={() => setImportOpen(false)}
            title="Importar Clientes"
            downloadTemplate={() => import('../utils/excel').then(m => m.downloadClienteTemplate())}
            mapRow={mapRowToCliente}
            previewCols={[
              { label: 'Razão Social', key: 'razao_social' },
              { label: 'Fantasia',     key: 'fantasia' },
              { label: 'CNPJ',         key: 'cnpj' },
              { label: 'Status',       key: 'status' },
              { label: 'Etapa',        key: 'etapa' },
              { label: 'MRR (R$)',     key: 'valor_mrr' },
            ]}
            onImport={async (rows) => {
              for (const row of rows) {
                await createClient.mutateAsync(row)
              }
            }}
          />
        </Suspense>
      )}
    </div>
  )
}
