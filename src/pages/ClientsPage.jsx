import { useState, useEffect, lazy, Suspense } from 'react'
import { useClients, useCreateClient, useUpdateClient, useDeleteClient, useRotinas, useCreateRotina, useUpdateRotina, useDeleteRotina, useTasks, useCreateTask, useUpdateTask, useDeleteTask, useTarefaModelos, useAcessos, useSaveAcesso, useDeleteAcesso } from '../hooks/useData'
import { useQueryClient } from '@tanstack/react-query'
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
  const [tab, setTab] = useState('dados') // dados | financeiro | bancos | cofre | rotina

  // Contrato assinado — upload/download
  const [contratoUploading, setContratoUploading] = useState(false)
  const [contratoErr, setContratoErr] = useState('')
  const [contratoSignedUrl, setContratoSignedUrl] = useState(null)

  // Gera URL assinada (30 dias) toda vez que o path do contrato muda
  useEffect(() => {
    setContratoSignedUrl(null)
    if (!form.contrato_url) return
    supabase.storage.from('documentos').createSignedUrl(form.contrato_url, 60 * 60 * 24 * 30)
      .then(({ data }) => { if (data?.signedUrl) setContratoSignedUrl(data.signedUrl) })
  }, [form.contrato_url])

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
  const updateRotina  = useUpdateRotina()
  const deleteRotina  = useDeleteRotina()

  const DIAS_SEMANA_R = ['Segunda','Terça','Quarta','Quinta','Sexta','Sábado','Domingo']
  const [rotinaForm, setRotinaForm] = useState({ titulo:'', tipo:'semanal', dias_semana:[0], dia_mes:1, hora:'08:00', observacao:'' })
  const [rotinaErr,  setRotinaErr]  = useState('')
  const [editandoRotina, setEditandoRotina] = useState(null)
  const [rotinaEditForm, setRotinaEditForm] = useState({})
  const [rotinaEditErr,  setRotinaEditErr]  = useState('')

  // Tarefas do cliente
  const { data: tarefasCliente = [] } = useTasks({ clientId: modal?.id })
  const { data: modelos = [] } = useTarefaModelos()
  const createTask = useCreateTask()
  const updateTask = useUpdateTask()
  const deleteTask = useDeleteTask()
  const queryClient = useQueryClient()
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
        prioridade: m.prioridade || 'media',
        status:     'aberta',
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
    await createTask.mutateAsync({ ...taskForm, prazo: taskForm.prazo || null, cliente_id: modal.id, data_execucao: new Date().toLocaleDateString('en-CA') })
    setTaskForm({ titulo:'', prazo:'', status:'aberta', prioridade:'media' })
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

  async function salvarEdicaoRotina() {
    if (!rotinaEditForm.titulo?.trim()) { setRotinaEditErr('Informe o título'); return }
    setRotinaEditErr('')
    try {
      await updateRotina.mutateAsync({
        id: editandoRotina,
        titulo: rotinaEditForm.titulo,
        hora: rotinaEditForm.hora,
        observacao: rotinaEditForm.observacao || null,
      })
      setEditandoRotina(null)
      setRotinaEditForm({})
    } catch (err) {
      setRotinaEditErr('Erro: ' + (err?.message || 'tente novamente'))
    }
  }

  async function salvarEdicaoRotina() {
    if (!rotinaEditForm.titulo?.trim()) { setRotinaEditErr('Informe o título'); return }
    setRotinaEditErr('')
    try {
      await updateRotina.mutateAsync({
        id: editandoRotina,
        titulo: rotinaEditForm.titulo,
        hora: rotinaEditForm.hora,
        observacao: rotinaEditForm.observacao || null,
      })
      setEditandoRotina(null)
      setRotinaEditForm({})
    } catch (err) {
      setRotinaEditErr('Erro: ' + (err?.message || 'tente novamente'))
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
    const valorFormatado = cl.valor_mrr
      ? Number(cl.valor_mrr).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : ''
    setForm({ ...cl, valor_mrr: valorFormatado })
    setSelectedBancos(cl.bancos || [])
    setTab('dados')
    setModal({ mode:'edit', id: cl.id })
    setCnpjError('')
  }

  function close() { setModal(null); setForm({}); setSelectedBancos([]); setContratoErr(''); setContratoSignedUrl(null) }

  async function uploadContrato(file) {
    if (!file || !modal?.id) return
    setContratoUploading(true)
    setContratoErr('')
    try {
      const ext = file.name.split('.').pop().toLowerCase()
      const path = `${empresa?.id}/${modal.id}/contrato_${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage.from('documentos').upload(path, file, { upsert: true })
      if (upErr) throw upErr
      await updateClient.mutateAsync({ id: modal.id, contrato_url: path })
      setForm(f => ({ ...f, contrato_url: path }))
    } catch (e) {
      setContratoErr(e?.message || 'Erro ao fazer upload do contrato.')
    } finally {
      setContratoUploading(false)
    }
  }

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
    const mrrNum = parseFloat(String(form.valor_mrr||'0').replace(/\./g,'').replace(',','.')) || 0
    const vencDia = form.vencimento_dia ? parseInt(form.vencimento_dia, 10) || null : null
    // Whitelist explícita — só colunas reais da tabela clientes
    const payload = {
      razao_social: form.razao_social || null,
      fantasia:     form.fantasia     || null,
      cnpj:         form.cnpj         || null,
      email:        form.email        || null,
      contato:      form.contato      || null,
      whatsapp:     form.whatsapp     || null,
      segmento:     form.segmento     || null,
      logradouro:   form.logradouro   || null,
      municipio:    form.municipio    || null,
      uf:           form.uf           || null,
      cep:          form.cep          || null,
      status:       form.status       || 'ativo',
      etapa:        form.etapa        || 'operacional',
      escopo:       form.escopo       || null,
      valor_mrr:    mrrNum,
      vencimento_dia: vencDia,
      bancos:       selectedBancos,
      inicio_contrato: form.inicio_contrato || null,
      software_erp:    form.software_erp    || null,
      responsavel_id:  form.responsavel_id  || null,
      contrato_url:    form.contrato_url    || null,
    }
    try {
      if (modal.mode === 'new') {
        await createClient.mutateAsync(payload)
      } else {
        await updateClient.mutateAsync({ id: modal.id, ...payload })
      }
      close()
    } catch (err) {
      alert('Erro ao salvar cliente: ' + (err?.message || JSON.stringify(err) || 'erro desconhecido'))
    }
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
                  {['Cliente','CNPJ','Etapa','Status','Valor/mês','Software','Ações'].map(h => (
                    <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:10, fontWeight:700, color:'var(--tx3)', textTransform:'uppercase', letterSpacing:'.06em', borderBottom:'1px solid var(--bo)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(cl => (
                  <tr key={cl.id} onClick={() => openEdit(cl)}
                    style={{ borderBottom:'1px solid var(--s2)', cursor:'pointer' }}
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
                    <td style={{ padding:'10px 14px' }} onClick={e => e.stopPropagation()}>
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
        <div style={{ position:'fixed', inset:0, background:'var(--bg)', zIndex:1000, overflowY:'auto' }}>
          <div style={{ maxWidth:980, margin:'0 auto', padding:'24px 24px 80px' }}>
            {/* Page header */}
            <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:24 }}>
              <button onClick={close} style={{ border:'none', background:'none', cursor:'pointer', color:'var(--tx3)', fontSize:13, fontWeight:600, display:'flex', alignItems:'center', gap:4, padding:'6px 10px', borderRadius:8, background:'var(--sur)' }}>
                ← Voltar
              </button>
              <span style={{ fontWeight:800, fontSize:24, color:'var(--tx)', letterSpacing:'-0.5px' }}>
                {modal.mode==='new' ? 'Novo cliente' : (form.fantasia || form.razao_social || 'Editar cliente')}
              </span>
            </div>

            {/* Tabs */}
            <div style={{ display:'flex', borderBottom:'1px solid var(--bo)', marginBottom:0 }}>
              {[['dados','📋 Dados'],['financeiro','💰 Financeiro'],['bancos','🏦 Bancos'],['cofre','🔐 Cofre'],['rotina','🔁 Rotina']].map(([id, label]) => (
                <button key={id} onClick={() => setTab(id)}
                  style={{ padding:'8px 14px', border:'none', background:'transparent', cursor:'pointer', fontSize:11, fontWeight:600,
                    color: tab===id?'var(--br)':'var(--tx3)', borderBottom: tab===id?'2px solid var(--br)':'2px solid transparent', marginBottom:-1 }}>
                  {label}
                </button>
              ))}
            </div>

            {/* Body */}
            <div style={{ paddingTop:20 }}>

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

                  {/* ── CONTRATO ASSINADO ── só em modo edição */}
                  {modal?.mode === 'edit' && (
                    <div style={{ borderTop:'1px solid var(--bo)', paddingTop:14, marginTop:2 }}>
                      <label style={{ fontSize:10, fontWeight:700, color:'var(--tx3)', display:'block', marginBottom:8, textTransform:'uppercase', letterSpacing:'.07em' }}>📄 Contrato Assinado</label>
                      {form.contrato_url ? (
                        <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
                          {contratoSignedUrl
                            ? <a href={contratoSignedUrl} target="_blank" rel="noreferrer"
                                style={{ fontSize:12, color:'var(--br)', fontWeight:600, textDecoration:'none', display:'flex', alignItems:'center', gap:5, padding:'6px 12px', border:'1px solid var(--br)', borderRadius:'var(--r)', background:'var(--brl)' }}>
                                📄 Visualizar / baixar contrato
                              </a>
                            : <span style={{ fontSize:12, color:'var(--tx3)' }}>Gerando link…</span>
                          }
                          <button className="btn bo" style={{ fontSize:11, padding:'5px 12px' }}
                            onClick={() => document.getElementById('contrato-upload-input').click()}
                            disabled={contratoUploading}>
                            {contratoUploading ? '⏳ Enviando…' : '🔄 Substituir'}
                          </button>
                        </div>
                      ) : (
                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                          <button className="btn bo" style={{ fontSize:11, padding:'6px 14px' }}
                            onClick={() => document.getElementById('contrato-upload-input').click()}
                            disabled={contratoUploading}>
                            {contratoUploading ? '⏳ Enviando…' : '📎 Anexar contrato assinado'}
                          </button>
                          <span style={{ fontSize:11, color:'var(--tx3)' }}>PDF ou imagem • máx. 10 MB</span>
                        </div>
                      )}
                      <input id="contrato-upload-input" type="file" accept=".pdf,image/*" style={{ display:'none' }}
                        onChange={e => { const f = e.target.files?.[0]; if (f) uploadContrato(f); e.target.value = '' }} />
                      {contratoErr && <div style={{ fontSize:11, color:'var(--rdt)', marginTop:6 }}>{contratoErr}</div>}
                    </div>
                  )}
                </div>
              )}

              {/* ABA FINANCEIRO */}
              {tab === 'financeiro' && (
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <div>
                    <label style={{ fontSize:10, fontWeight:700, color:'var(--tx3)', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'.07em' }}>Valor mensal (R$/mês)</label>
                    <input type="text" inputMode="numeric" value={form.valor_mrr||''} onChange={e=>setForm(f=>({...f,valor_mrr:e.target.value}))} className="fi" placeholder="Ex: 1.500,00" />
                    {parseFloat(String(form.valor_mrr||'').replace(/\./g,'').replace(',','.')) >= 1000 && (
                      <div style={{ fontSize:10, color:'#6366F1', marginTop:3 }}>
                        {parseFloat(String(form.valor_mrr).replace(/\./g,'').replace(',','.')).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}/mês
                      </div>
                    )}
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

              {/* ABA ESCOPO — serviços contratados + geração de tarefas */}

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

                    {/* Rotinas em colunas por dia da semana */}
                    {(() => {
                      const byHora = (a, b) => (a.hora||'').localeCompare(b.hora||'')
                      const diarias = [...rotinas].filter(r => r.tipo === 'diaria').sort(byHora)
                      const mensais = [...rotinas].filter(r => r.tipo === 'mensal').sort((a,b) => (a.dia_mes||1) - (b.dia_mes||1) || (a.hora||'').localeCompare(b.hora||''))
                      // Todos os 7 dias sempre visíveis em sequência
                      const todosDias = DIAS_SEMANA_R.map((label, idx) => ({
                        label,
                        rotinas: [...rotinas]
                          .filter(r => r.tipo === 'semanal' && (r.dias_semana?.includes(idx) || r.dia_semana === idx))
                          .sort(byHora),
                      }))

                      const diaHeader = { fontSize:10, fontWeight:800, color:'var(--br)', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:6, paddingBottom:4, borderBottom:'2px solid var(--br)' }

                      const rotinaItem = (r) => {
                        const isEditing = editandoRotina === r.id
                        return (
                          <div key={r.id}>
                            {isEditing ? (
                              <div style={{ background:'#EEF2FF', border:'1px solid #C7D2FE', borderRadius:6, padding:'8px', marginBottom:4 }}>
                                <input value={rotinaEditForm.titulo||''} onChange={e=>setRotinaEditForm(f=>({...f,titulo:e.target.value}))}
                                  className="fi" style={{ marginBottom:5, fontSize:11, padding:'4px 8px' }} autoFocus />
                                <input type="time" value={rotinaEditForm.hora||'08:00'} onChange={e=>setRotinaEditForm(f=>({...f,hora:e.target.value}))}
                                  className="fi" style={{ marginBottom:5, fontSize:11, padding:'4px 8px' }} />
                                <input value={rotinaEditForm.observacao||''} onChange={e=>setRotinaEditForm(f=>({...f,observacao:e.target.value}))}
                                  className="fi" placeholder="Observação..." style={{ marginBottom:5, fontSize:11, padding:'4px 8px' }} />
                                {rotinaEditErr && <div style={{ fontSize:10, color:'var(--rdt)', marginBottom:4 }}>{rotinaEditErr}</div>}
                                <div style={{ display:'flex', gap:5 }}>
                                  <button className="btn bp" onClick={salvarEdicaoRotina} disabled={updateRotina.isPending}
                                    style={{ fontSize:10, padding:'3px 10px' }}>
                                    {updateRotina.isPending ? '…' : '✓ Salvar'}
                                  </button>
                                  <button onClick={() => { setEditandoRotina(null); setRotinaEditForm({}); setRotinaEditErr('') }}
                                    style={{ fontSize:10, padding:'3px 8px', border:'1px solid var(--bo)', background:'transparent', borderRadius:4, cursor:'pointer', color:'var(--tx3)' }}>
                                    Cancelar
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div style={{ display:'flex', alignItems:'flex-start', gap:4, padding:'5px 0', borderBottom:'1px solid var(--bo)' }}>
                                <div style={{ fontSize:11, fontWeight:700, color:'var(--br)', flexShrink:0, minWidth:34 }}>{r.hora ? r.hora.slice(0,5) : '—'}</div>
                                <div style={{ flex:1, fontSize:11, color:'var(--tx)', lineHeight:1.4, minWidth:0 }}>
                                  {r.titulo}
                                  {r.observacao && <div style={{ fontSize:9, color:'var(--tx3)', fontStyle:'italic' }}>{r.observacao}</div>}
                                </div>
                                <button
                                  title="Editar"
                                  onClick={() => { setEditandoRotina(r.id); setRotinaEditForm({ titulo:r.titulo, hora:r.hora||'08:00', observacao:r.observacao||'' }); setRotinaEditErr('') }}
                                  style={{ border:'none', background:'none', cursor:'pointer', color:'#A5B4FC', fontSize:11, lineHeight:1, flexShrink:0, padding:'0 2px' }}>✏</button>
                                <button onClick={() => { if(confirm('Remover esta rotina?')) deleteRotina.mutate(r.id) }}
                                  style={{ border:'none', background:'none', cursor:'pointer', color:'#CBD5E1', fontSize:14, lineHeight:1, flexShrink:0, padding:0 }}>×</button>
                              </div>
                            )}
                          </div>
                        )
                      }

                      return (
                        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                          {/* 7 dias em grid fixo, com scroll horizontal se necessário */}
                          <div style={{ display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap:8, overflowX:'auto', minWidth:0 }}>
                            {todosDias.map(g => (
                              <div key={g.label} style={{ minWidth:110 }}>
                                <div style={diaHeader}>{g.label}</div>
                                {g.rotinas.length === 0
                                  ? <div style={{ fontSize:10, color:'var(--tx3)', fontStyle:'italic', padding:'4px 0' }}>—</div>
                                  : g.rotinas.map(rotinaItem)
                                }
                              </div>
                            ))}
                          </div>
                          {/* Todo dia */}
                          {diarias.length > 0 && (
                            <div>
                              <div style={{ fontSize:10, fontWeight:700, color:'var(--tx3)', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:4 }}>🔁 Todo dia</div>
                              {diarias.map(rotinaItem)}
                            </div>
                          )}
                          {/* Mensal */}
                          {mensais.length > 0 && (
                            <div>
                              <div style={{ fontSize:10, fontWeight:700, color:'var(--tx3)', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:4 }}>📆 Mensal</div>
                              {mensais.map(r => (
                                <div key={r.id} style={{ display:'flex', alignItems:'flex-start', gap:6, padding:'5px 0', borderBottom:'1px solid var(--bo)' }}>
                                  <div style={{ fontSize:11, fontWeight:700, color:'var(--br)', flexShrink:0, minWidth:36 }}>dia {r.dia_mes}</div>
                                  <div style={{ flex:1, fontSize:11, color:'var(--tx)' }}>{r.titulo}</div>
                                  <button onClick={() => { if(confirm('Remover esta rotina?')) deleteRotina.mutate(r.id) }}
                                    style={{ border:'none', background:'none', cursor:'pointer', color:'#CBD5E1', fontSize:14, lineHeight:1, flexShrink:0 }}>×</button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })()}

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
            <div style={{ position:'fixed', bottom:0, left:0, right:0, background:'var(--sur)', borderTop:'1px solid var(--bo)', padding:'12px 24px', display:'flex', justifyContent:'flex-end', gap:8, zIndex:10 }}>
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
