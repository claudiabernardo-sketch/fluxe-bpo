import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  useClients, useUpdateClient,
  useTasks, useCreateTask, useDeleteTask,
  useRotinas, useCreateRotina, useUpdateRotina, useDeleteRotina,
  useTarefaModelos, useUpdateModelo,
  useClienteModelos, useVincularModelo, useDesvincularModelo,
  useUpdateClienteModelo, useTogglePauseModelo,
  useUpdateClienteStatus, useIniciarOperacao, useGerarTarefas,
  useAcessos, useSaveAcesso, useDeleteAcesso,
} from '../hooks/useData'
import { useAuthStore } from '../store/authStore'
import { supabase } from '../lib/supabase'
import { Badge, Loader, fmtR } from '../components/ui'
import ContextTooltip from '../components/ui/ContextTooltip'

// ── Constantes ────────────────────────────────────────────────────────────────
const ETAPA_COLOR = { comercial:'pu', pre_ob:'yw', onboarding:'bl', implantacao:'or', operacional:'gr', estrategico:'cy', acompanhamento:'gy', encerramento:'gy' }
const ETAPA_LABEL = { comercial:'Comercial', pre_ob:'Pré-Onb.', onboarding:'Onboarding', implantacao:'Implantação', operacional:'Operacional', estrategico:'Estratégico', acompanhamento:'Acompanham.', encerramento:'Encerramento' }
const STATUS_COLOR = { ativo:'gr', onboarding:'bl', implantacao:'or', inativo:'gy', pausado:'yw' }
const STATUS_LABEL = { ativo:'Ativo', inativo:'Inativo', pausado:'Pausado', onboarding:'Onboarding', implantacao:'Implantação' }
const STATUS_OP_COLOR = { em_configuracao:'yw', operacional:'gr', pausado:'or', encerrado:'gy' }
const STATUS_OP_LABEL = { em_configuracao:'Em Configuração', operacional:'Operacional', pausado:'Pausado', encerrado:'Encerrado' }
const RECORRENCIA_LABEL = { diaria:'Diária', dias_uteis:'Dias úteis', semanal:'Semanal', quinzenal:'Quinzenal', mensal:'Mensal', bimestral:'Bimestral', trimestral:'Trimestral', semestral:'Semestral', anual:'Anual', dias_especificos:'Dias específicos' }
const DIAS_SEMANA_R = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']

const BANCOS_LIST = [
  'Banco do Brasil','Bradesco','Itaú','Santander','Caixa',
  'Nubank','Inter','Sicoob','Sicredi','BTG','C6 Bank','XP','Safra',
  'BV','Banrisul','Original','Neon','PicPay','Mercado Pago',
]

const CATEGORIAS_COFRE = [
  { id:'banco', icon:'🏦', label:'Banco' },
  { id:'erp', icon:'💻', label:'ERP / Sistema' },
  { id:'governo', icon:'🏛', label:'Governo' },
  { id:'email', icon:'📧', label:'E-mail' },
  { id:'outro', icon:'🔑', label:'Outro' },
]

const SOFTWARES = ['Domínio','Questor','Alterdata','Totvs Protheus','Omie','Nibo','Bling','Sankhya','SAP','Outro']

function getCatCofre(id) { return CATEGORIAS_COFRE.find(c => c.id === id) || CATEGORIAS_COFRE[4] }
function fmtCNPJ(v) { return v.replace(/\D/g,'').slice(0,14).replace(/(\d{2})(\d)/,'$1.$2').replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d)/,'$1/$2').replace(/(\d{4})(\d)/,'$1-$2') }

// ── Componente principal ──────────────────────────────────────────────────────
export default function ClientePage() {
  const { id: clienteId } = useParams()
  const navigate = useNavigate()
  const { empresa } = useAuthStore()

  const { data: clients = [], isLoading: clientesLoading } = useClients()
  const updateClient = useUpdateClient()

  const cliente = clients.find(c => c.id === clienteId)

  // Form de edição
  const [form, setForm] = useState(null)
  const [selectedBancos, setSelectedBancos] = useState([])
  const [saveErr, setSaveErr] = useState('')
  const [saveOk, setSaveOk] = useState(false)
  const [cnpjLoading, setCnpjLoading] = useState(false)
  const [cnpjError, setCnpjError] = useState('')

  // Inicializa form quando cliente carrega
  if (cliente && form === null) {
    const mrrNum = cliente.valor_mrr ?? 0
    const valorFormatado = mrrNum > 0
      ? mrrNum.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : ''
    setForm({ ...cliente, valor_mrr: valorFormatado })
    setSelectedBancos(cliente.bancos || [])
  }

  // Tab ativa
  const [tab, setTab] = useState('dados')

  // Tarefas
  const { data: tarefas = [] } = useTasks()
  const tarefasCliente = tarefas.filter(t => t.cliente_id === clienteId && !t.deleted_at)
  const createTask = useCreateTask()
  const deleteTask = useDeleteTask()
  const [taskForm, setTaskForm] = useState({ titulo:'', prazo:'', status:'aberta', prioridade:'media' })
  const [taskErr, setTaskErr] = useState('')

  // Rotinas
  const { data: rotinas = [] } = useRotinas(clienteId)
  const createRotina = useCreateRotina()
  const updateRotina = useUpdateRotina()
  const deleteRotina = useDeleteRotina()
  const [editandoRotina, setEditandoRotina] = useState(null)
  const [rotinaEditForm, setRotinaEditForm] = useState({})
  const [rotinaEditErr, setRotinaEditErr] = useState('')
  const [rotinaForm, setRotinaForm] = useState({ titulo:'', tipo:'diaria', hora:'', observacao:'', dia_mes:1, dias_semana:[] })
  const [rotinaErr, setRotinaErr] = useState('')

  // Modelos / Escopo
  const { data: clienteModelos = [] } = useClienteModelos(clienteId)
  const { data: todosModelos = [] } = useTarefaModelos()
  const updateModelo = useUpdateModelo()
  const vincularModelo = useVincularModelo()
  const desvincularModelo = useDesvincularModelo()
  const updateClienteModelo = useUpdateClienteModelo()
  const togglePauseModelo = useTogglePauseModelo()
  const [showAddModelo, setShowAddModelo] = useState(false)
  const [editandoModelo, setEditandoModelo] = useState(null)
  const [editModeloForm, setEditModeloForm] = useState({ recorrencia:'', dia_mes:'', hora:'', config:{} })
  const [configModeloId, setConfigModeloId] = useState(null)

  // Status operacional
  const updateClienteStatus = useUpdateClienteStatus()
  const iniciarOperacao = useIniciarOperacao()
  const gerarTarefas = useGerarTarefas()
  const [iniciarOpModal, setIniciarOpModal] = useState(false)
  const [iniciarOpData, setIniciarOpData] = useState(() => new Date().toISOString().slice(0,10))
  const [iniciarOpLoading, setIniciarOpLoading] = useState(false)
  const [iniciarOpErr, setIniciarOpErr] = useState('')
  const [gerarModal, setGerarModal] = useState(false)
  const [gerarForm, setGerarForm] = useState({ dataInicio:'', dataFim:'', dryRun:false })
  const [gerarResult, setGerarResult] = useState(null)
  const [gerarLoading, setGerarLoading] = useState(false)
  const [gerarErr, setGerarErr] = useState('')

  // Cofre
  const { data: acessosCliente = [], isLoading: acessosLoading } = useAcessos(clienteId)
  const saveAcesso = useSaveAcesso()
  const deleteAcesso = useDeleteAcesso()
  const [cofreSearch, setCofreSearch] = useState('')
  const [cofreForm, setCofreForm] = useState({ sistema:'', login:'', url:'', categoria:'outro', obs:'', _temSenha:false, _novaSenha:'' })
  const [cofreModal, setCofreModal] = useState(false)
  const [revealedAcesso, setRevealedAcesso] = useState({})
  const canSeeSenhas = true // usar temPermissao se disponível

  const acessosFiltrados = acessosCliente.filter(a => {
    const q = cofreSearch.toLowerCase()
    return !q || a.sistema?.toLowerCase().includes(q) || a.login?.toLowerCase().includes(q) || a.url?.toLowerCase().includes(q)
  })

  // ── Funções ──────────────────────────────────────────────────────────────────

  async function buscarCNPJ() {
    const cnpj = (form?.cnpj || '').replace(/\D/g,'')
    if (cnpj.length !== 14) { setCnpjError('CNPJ inválido'); return }
    setCnpjLoading(true); setCnpjError('')
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
        logradouro: data.logradouro,
        municipio: data.municipio,
        uf: data.uf,
        cep: data.cep,
      }))
    } catch { setCnpjError('Erro ao buscar CNPJ') }
    setCnpjLoading(false)
  }

  async function salvar() {
    if (!form?.razao_social) { setSaveErr('Razão social é obrigatória'); return }
    setSaveErr('')
    const mrrNum = parseFloat(String(form.valor_mrr||'0').replace(/\./g,'').replace(',','.')) || 0
    const payload = {
      razao_social: form.razao_social || null,
      fantasia: form.fantasia || null,
      cnpj: form.cnpj || null,
      email: form.email || null,
      contato: form.contato || null,
      whatsapp: form.whatsapp || null,
      segmento: form.segmento || null,
      status: form.status || 'ativo',
      etapa: form.etapa || 'operacional',
      valor_mrr: mrrNum || null,
      vencimento_dia: form.vencimento_dia ? parseInt(form.vencimento_dia, 10) || null : null,
      inicio_contrato: form.inicio_contrato || null,
      escopo: form.escopo || null,
      software_erp: form.software_erp || null,
      software_contabil: form.software_contabil || null,
      logradouro: form.logradouro || null,
      municipio: form.municipio || null,
      uf: form.uf || null,
      cep: form.cep || null,
      bancos: selectedBancos,
    }
    await updateClient.mutateAsync({ id: clienteId, ...payload })
    setSaveOk(true)
    setTimeout(() => setSaveOk(false), 2500)
  }

  async function salvarTarefa() {
    if (!taskForm.titulo.trim()) { setTaskErr('Informe o título'); return }
    setTaskErr('')
    await createTask.mutateAsync({ ...taskForm, prazo: taskForm.prazo || null, cliente_id: clienteId, data_execucao: new Date().toLocaleDateString('en-CA') })
    setTaskForm({ titulo:'', prazo:'', status:'aberta', prioridade:'media' })
  }

  async function salvarRotina() {
    if (!rotinaForm.titulo.trim()) { setRotinaErr('Informe o título'); return }
    if (rotinaForm.tipo === 'semanal' && rotinaForm.dias_semana.length === 0) { setRotinaErr('Selecione ao menos um dia da semana'); return }
    setRotinaErr('')
    await createRotina.mutateAsync({ ...rotinaForm, cliente_id: clienteId, empresa_id: empresa?.id })
    setRotinaForm({ titulo:'', tipo:'diaria', hora:'', observacao:'', dia_mes:1, dias_semana:[] })
  }

  function iniciarEdicaoRotina(r) {
    setEditandoRotina(r.id)
    setRotinaEditForm({ titulo: r.titulo, hora: r.hora || '', observacao: r.observacao || '' })
    setRotinaEditErr('')
  }

  async function salvarEdicaoRotina() {
    if (!rotinaEditForm.titulo.trim()) { setRotinaEditErr('Informe o título'); return }
    await updateRotina.mutateAsync({ id: editandoRotina, ...rotinaEditForm })
    setEditandoRotina(null)
  }

  function toggleDiaSemana(i) {
    setRotinaForm(f => ({
      ...f,
      dias_semana: f.dias_semana.includes(i) ? f.dias_semana.filter(d => d !== i) : [...f.dias_semana, i].sort()
    }))
  }

  function toggleBanco(banco) {
    setSelectedBancos(prev => prev.includes(banco) ? prev.filter(b => b !== banco) : [...prev, banco])
  }

  async function desvincularEExcluir(cm) {
    const temTarefa = tarefasCliente.some(t => t.modelo_id === cm.modelo_id && t.status !== 'concluida')
    const msg = temTarefa
      ? 'Remover este modelo do escopo? A tarefa aberta criada por ele também será excluída.'
      : 'Remover este modelo do escopo?'
    if (!confirm(msg)) return
    const alvo = tarefasCliente.filter(t => t.modelo_id === cm.modelo_id && t.status !== 'concluida')
    for (const t of alvo) await deleteTask.mutateAsync(t.id)
    desvincularModelo.mutate({ id: cm.id, clienteId })
  }

  async function desativarModeloDireto(m) {
    const temTarefa = tarefasCliente.some(t => t.modelo_id === m.id && t.status !== 'concluida')
    const msg = temTarefa
      ? 'Remover este modelo do escopo? A tarefa aberta criada por ele também será excluída.'
      : 'Remover este modelo do escopo?'
    if (!confirm(msg)) return
    const alvo = tarefasCliente.filter(t => t.modelo_id === m.id && t.status !== 'concluida')
    for (const t of alvo) await deleteTask.mutateAsync(t.id)
    updateModelo.mutate({ id: m.id, ativo: false })
  }

  async function vincularEAplicarModelo(modelo) {
    await vincularModelo.mutateAsync({ clienteId, modeloId: modelo.id })
    setShowAddModelo(false)
  }

  async function executarIniciarOperacao() {
    if (!iniciarOpData) { setIniciarOpErr('Selecione a data de início'); return }
    setIniciarOpLoading(true); setIniciarOpErr('')
    try {
      await iniciarOperacao.mutateAsync({ clienteId, dataInicio: iniciarOpData })
      setIniciarOpModal(false)
    } catch (e) {
      setIniciarOpErr(e?.message || 'Erro ao iniciar operação')
    }
    setIniciarOpLoading(false)
  }

  async function executarGerarTarefas() {
    setGerarLoading(true); setGerarErr(''); setGerarResult(null)
    try {
      const result = await gerarTarefas.mutateAsync({
        clienteId,
        empresaId: empresa?.id,
        dataInicio: gerarForm.dataInicio || undefined,
        dataFim: gerarForm.dataFim || undefined,
        dryRun: gerarForm.dryRun,
      })
      setGerarResult(result)
    } catch (e) {
      setGerarErr(e?.message || 'Erro ao gerar tarefas')
    }
    setGerarLoading(false)
  }

  function openNewAcesso() {
    setCofreForm({ sistema:'', login:'', url:'', categoria:'outro', obs:'', _temSenha:false, _novaSenha:'' })
    setCofreModal(true)
  }

  function openEditAcesso(ac) {
    setCofreForm({ ...ac, _temSenha: !!ac.senha_enc, _novaSenha:'' })
    setCofreModal(true)
  }

  async function salvarAcessoCliente() {
    if (!cofreForm.sistema?.trim()) return alert('Informe o nome do sistema')
    const { _temSenha, _novaSenha, ...dados } = cofreForm
    const payload = { ...dados, cliente_id: clienteId, empresa_id: empresa?.id }
    if (_novaSenha?.trim()) {
      const { data: enc, error: encErr } = await supabase.rpc('cofre_encrypt', { plaintext: _novaSenha })
      if (encErr) return alert('Erro ao criptografar a senha. Tente novamente.')
      payload.senha_enc = enc
    } else if (!_temSenha) {
      payload.senha_enc = null
    }
    await saveAcesso.mutateAsync(payload)
    setCofreModal(false)
  }

  async function toggleRevealAcesso(ac) {
    if (revealedAcesso[ac.id] && revealedAcesso[ac.id] !== 'loading') {
      setRevealedAcesso(r => ({ ...r, [ac.id]: null }))
      return
    }
    setRevealedAcesso(r => ({ ...r, [ac.id]:'loading' }))
    const { data, error } = await supabase.rpc('cofre_decrypt', { ciphertext: ac.senha_enc })
    setRevealedAcesso(r => ({ ...r, [ac.id]: error ? '(erro)' : data }))
  }

  // ── Loading / Not found ───────────────────────────────────────────────────────
  if (clientesLoading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh' }}>
      <Loader />
    </div>
  )

  if (!cliente) return (
    <div style={{ padding:32, textAlign:'center' }}>
      <div style={{ fontSize:14, color:'var(--tx3)', marginBottom:16 }}>Cliente não encontrado.</div>
      <button className="btn bp bsm" onClick={() => navigate('/clientes')}>← Voltar para Clientes</button>
    </div>
  )

  const statusOp = cliente.status_operacional || 'em_configuracao'
  const modelosDiretos = todosModelos.filter(m =>
    m.ativo && m.cliente_id === clienteId && !clienteModelos.find(cm => cm.modelo_id === m.id)
  )
  const totalModelos = clienteModelos.length + modelosDiretos.length

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:0, minHeight:'100%' }}>

      {/* ── CABEÇALHO DA PÁGINA ─────────────────────────────────────────────── */}
      <div style={{ background:'var(--sur)', border:'1px solid var(--bo)', borderRadius:'var(--rx)', padding:'16px 20px', marginBottom:16, display:'flex', flexWrap:'wrap', alignItems:'flex-start', gap:12 }}>

        {/* Voltar */}
        <button onClick={() => navigate('/clientes')}
          style={{ border:'1px solid var(--bo)', background:'transparent', color:'var(--tx3)', borderRadius:6, cursor:'pointer', fontSize:12, padding:'6px 10px', display:'flex', alignItems:'center', gap:5, flexShrink:0, alignSelf:'center' }}>
          <i className="fa-solid fa-arrow-left" style={{ fontSize:10 }} /> Clientes
        </button>

        {/* Nome + badges */}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', flexWrap:'wrap', gap:8, marginBottom:4 }}>
            <h1 style={{ margin:0, fontSize:18, fontWeight:700, color:'var(--tx)', lineHeight:1.2 }}>
              {cliente.fantasia || cliente.razao_social}
            </h1>
            <span className={`b b-${STATUS_OP_COLOR[statusOp]||'gy'}`}>{STATUS_OP_LABEL[statusOp]}</span>
            <span className={`b b-${STATUS_COLOR[cliente.status]||'gy'}`}>{STATUS_LABEL[cliente.status]||cliente.status}</span>
            <span className={`b b-${ETAPA_COLOR[cliente.etapa]||'gy'}`}>{ETAPA_LABEL[cliente.etapa]||cliente.etapa}</span>
            {cliente.codigo && (
              <button
                title="Copiar ID de suporte"
                onClick={() => navigator.clipboard.writeText(String(cliente.codigo).padStart(8,'0'))}
                style={{ display:'flex', alignItems:'center', gap:4, border:'1px solid var(--bo)', background:'var(--s2)', borderRadius:5, cursor:'pointer', padding:'2px 8px', fontFamily:'var(--mo)', fontSize:10, color:'var(--tx3)' }}>
                <span style={{ fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em' }}>ID</span>
                <span>{String(cliente.codigo).padStart(8,'0')}</span>
                <i className="fa-regular fa-copy" style={{ fontSize:9 }} />
              </button>
            )}
          </div>
          {cliente.razao_social !== cliente.fantasia && cliente.fantasia && (
            <div style={{ fontSize:11, color:'var(--tx3)' }}>{cliente.razao_social} · {cliente.cnpj || '—'}</div>
          )}
          {!cliente.fantasia && cliente.cnpj && (
            <div style={{ fontSize:11, color:'var(--tx3)' }}>{cliente.cnpj}</div>
          )}
          {cliente.valor_mrr > 0 && (
            <div style={{ fontSize:11, color:'var(--grt)', fontWeight:600, marginTop:2 }}>
              {fmtR(cliente.valor_mrr)}/mês
            </div>
          )}
        </div>

        {/* Ações operacionais */}
        <div style={{ display:'flex', gap:6, flexWrap:'wrap', alignSelf:'center' }}>
          {statusOp === 'em_configuracao' && (
            <button onClick={() => { setIniciarOpData(new Date().toISOString().slice(0,10)); setIniciarOpModal(true) }}
              className="btn bp bsm" style={{ fontSize:11 }}>
              ▶ Iniciar Operação
            </button>
          )}
          {statusOp === 'operacional' && (
            <button onClick={() => { if(confirm('Pausar a operação deste cliente? A geração de tarefas será suspensa.')) updateClienteStatus.mutate({ id: clienteId, status_operacional:'pausado' }) }}
              className="btn bo bsm" style={{ fontSize:11 }}>
              ⏸ Pausar
            </button>
          )}
          {statusOp === 'pausado' && (
            <button onClick={() => updateClienteStatus.mutate({ id: clienteId, status_operacional:'operacional' })}
              className="btn bp bsm" style={{ fontSize:11 }}>
              ▶ Reativar
            </button>
          )}
        </div>
      </div>

      {/* ── TABS ────────────────────────────────────────────────────────────────── */}
      <div style={{ background:'var(--sur)', border:'1px solid var(--bo)', borderRadius:'var(--rx)', overflow:'hidden', flex:1 }}>

        <div style={{ display:'flex', borderBottom:'1px solid var(--bo)', padding:'0 16px', overflowX:'auto' }}>
          {[
            ['dados','📋 Dados'],
            ['financeiro','💰 Financeiro'],
            ['bancos','🏦 Bancos'],
            ['cofre','🔐 Cofre'],
            ['rotina','🔁 Rotina'],
            ['escopo','📦 Escopo'],
          ].map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)}
              style={{ padding:'10px 16px', border:'none', background:'transparent', cursor:'pointer', fontSize:12, fontWeight:600, whiteSpace:'nowrap',
                color: tab===id?'var(--br)':'var(--tx3)', borderBottom: tab===id?'2px solid var(--br)':'2px solid transparent', marginBottom:-1 }}>
              {label}
            </button>
          ))}
        </div>

        <div style={{ padding:20 }}>

          {/* ── ABA DADOS ─────────────────────────────────────────────────────── */}
          {tab === 'dados' && form && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, maxWidth:800 }}>
              {/* CNPJ */}
              <div style={{ gridColumn:'1/-1' }}>
                <label className="lbl">CNPJ</label>
                <div style={{ display:'flex', gap:8 }}>
                  <input value={form.cnpj||''} onChange={e=>setForm(f=>({...f,cnpj:fmtCNPJ(e.target.value)}))}
                    placeholder="00.000.000/0001-00" className="fi" style={{ flex:1 }} />
                  <button className="btn bp bsm" onClick={buscarCNPJ} disabled={cnpjLoading} style={{ whiteSpace:'nowrap', flexShrink:0 }}>
                    {cnpjLoading ? <><i className="fa-solid fa-spinner spin" /> Buscando...</> : <><i className="fa-solid fa-magnifying-glass" /> Buscar Receita</>}
                  </button>
                </div>
                {cnpjError && <div style={{ fontSize:11, color:'var(--rdt)', marginTop:4 }}>{cnpjError}</div>}
              </div>
              <div>
                <label className="lbl">Razão social *</label>
                <input value={form.razao_social||''} onChange={e=>setForm(f=>({...f,razao_social:e.target.value}))} className="fi" />
              </div>
              <div>
                <label className="lbl">Nome fantasia</label>
                <input value={form.fantasia||''} onChange={e=>setForm(f=>({...f,fantasia:e.target.value}))} className="fi" />
              </div>
              <div>
                <label className="lbl">Segmento / atividade</label>
                <input value={form.segmento||''} onChange={e=>setForm(f=>({...f,segmento:e.target.value}))} className="fi" placeholder="Ex: Comércio varejista" />
              </div>
              <div>
                <label className="lbl">E-mail</label>
                <input type="email" value={form.email||''} onChange={e=>setForm(f=>({...f,email:e.target.value}))} className="fi" />
              </div>
              <div>
                <label className="lbl">Contato / responsável</label>
                <input value={form.contato||''} onChange={e=>setForm(f=>({...f,contato:e.target.value}))} className="fi" />
              </div>
              <div>
                <label className="lbl">WhatsApp</label>
                <input value={form.whatsapp||''} onChange={e=>setForm(f=>({...f,whatsapp:e.target.value}))} className="fi" placeholder="(11) 99999-0000" />
              </div>
              {form.municipio && (
                <div style={{ gridColumn:'1/-1', background:'var(--s2)', borderRadius:'var(--r)', padding:'10px 12px', fontSize:11, color:'var(--tx2)' }}>
                  <i className="fa-solid fa-location-dot" style={{ color:'var(--br)', marginRight:6 }} />
                  {form.logradouro && `${form.logradouro}, `}{form.municipio} — {form.uf} · CEP {form.cep}
                </div>
              )}
              <div style={{ gridColumn:'1/-1', display:'flex', gap:8, alignItems:'center' }}>
                <button className="btn bp" onClick={salvar} disabled={updateClient.isPending}>
                  {updateClient.isPending ? 'Salvando…' : 'Salvar dados'}
                </button>
                {saveOk && <span style={{ fontSize:12, color:'var(--grt)', fontWeight:600 }}>✓ Salvo!</span>}
                {saveErr && <span style={{ fontSize:12, color:'var(--rdt)' }}>{saveErr}</span>}
              </div>
            </div>
          )}

          {/* ── ABA FINANCEIRO ────────────────────────────────────────────────── */}
          {tab === 'financeiro' && form && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, maxWidth:800 }}>
              <div>
                <label className="lbl">Valor mensal (R$/mês)</label>
                <input type="text" inputMode="numeric" value={form.valor_mrr||''} onChange={e=>setForm(f=>({...f,valor_mrr:e.target.value}))} className="fi" placeholder="Ex: 1.500,00" />
                {parseFloat(String(form.valor_mrr||'').replace(/\./g,'').replace(',','.')) >= 1000 && (
                  <div style={{ fontSize:10, color:'#6366F1', marginTop:3 }}>
                    {parseFloat(String(form.valor_mrr).replace(/\./g,'').replace(',','.')).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}/mês
                  </div>
                )}
              </div>
              <div>
                <label className="lbl">Vencimento (dia do mês)</label>
                <input type="number" value={form.vencimento_dia||''} onChange={e=>setForm(f=>({...f,vencimento_dia:e.target.value}))} className="fi" placeholder="10" min={1} max={28} />
              </div>
              <div>
                <label className="lbl">Status</label>
                <select value={form.status||'ativo'} onChange={e=>setForm(f=>({...f,status:e.target.value}))} className="fi">
                  <option value="ativo">Ativo</option>
                  <option value="onboarding">Onboarding</option>
                  <option value="implantacao">Implantação</option>
                  <option value="inativo">Inativo</option>
                  <option value="pausado">Pausado</option>
                </select>
              </div>
              <div>
                <label className="lbl">Etapa BPO</label>
                <select value={form.etapa||'operacional'} onChange={e=>setForm(f=>({...f,etapa:e.target.value}))} className="fi">
                  {Object.entries(ETAPA_LABEL).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="lbl">Software / ERP</label>
                <select value={form.software_erp||''} onChange={e=>setForm(f=>({...f,software_erp:e.target.value||null}))} className="fi">
                  <option value="">— Selecionar —</option>
                  {SOFTWARES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="lbl">Início do contrato</label>
                <input type="date" value={form.inicio_contrato||''} onChange={e=>setForm(f=>({...f,inicio_contrato:e.target.value||null}))} className="fi" />
              </div>
              <div style={{ gridColumn:'1/-1' }}>
                <label className="lbl">Escopo dos serviços</label>
                <textarea value={form.escopo||''} onChange={e=>setForm(f=>({...f,escopo:e.target.value}))}
                  placeholder="Descreva os serviços contratados..."
                  style={{ width:'100%', height:80, padding:'8px 10px', border:'1px solid var(--bo)', borderRadius:'var(--r)', fontSize:12, fontFamily:'inherit', background:'var(--sur)', color:'var(--tx)', resize:'vertical', boxSizing:'border-box' }} />
              </div>
              <div style={{ gridColumn:'1/-1', display:'flex', gap:8, alignItems:'center' }}>
                <button className="btn bp" onClick={salvar} disabled={updateClient.isPending}>
                  {updateClient.isPending ? 'Salvando…' : 'Salvar financeiro'}
                </button>
                {saveOk && <span style={{ fontSize:12, color:'var(--grt)', fontWeight:600 }}>✓ Salvo!</span>}
                {saveErr && <span style={{ fontSize:12, color:'var(--rdt)' }}>{saveErr}</span>}
              </div>
            </div>
          )}

          {/* ── ABA BANCOS ────────────────────────────────────────────────────── */}
          {tab === 'bancos' && (
            <div style={{ maxWidth:700 }}>
              <div style={{ fontSize:12, color:'var(--tx2)', marginBottom:14 }}>
                Selecione os bancos utilizados por este cliente.
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(160px, 1fr))', gap:8 }}>
                {BANCOS_LIST.map(banco => (
                  <label key={banco} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px', borderRadius:'var(--r)', border:`1px solid ${selectedBancos.includes(banco)?'var(--br)':'var(--bo)'}`, background: selectedBancos.includes(banco)?'var(--brl)':'var(--sur)', cursor:'pointer', transition:'all .15s' }}>
                    <input type="checkbox" checked={selectedBancos.includes(banco)} onChange={() => toggleBanco(banco)}
                      style={{ width:14, height:14, accentColor:'var(--br)', flexShrink:0 }} />
                    <span style={{ fontSize:12, fontWeight: selectedBancos.includes(banco)?600:400, color: selectedBancos.includes(banco)?'var(--br)':'var(--tx)' }}>{banco}</span>
                  </label>
                ))}
              </div>
              {selectedBancos.length > 0 && (
                <div style={{ marginTop:12, padding:'8px 12px', background:'var(--brl)', borderRadius:'var(--r)', fontSize:11, color:'var(--br)', fontWeight:600 }}>
                  <i className="fa-solid fa-check-circle" style={{ marginRight:6 }} />
                  {selectedBancos.length} banco(s): {selectedBancos.join(', ')}
                </div>
              )}
              <div style={{ marginTop:16, display:'flex', gap:8, alignItems:'center' }}>
                <button className="btn bp" onClick={salvar} disabled={updateClient.isPending}>
                  {updateClient.isPending ? 'Salvando…' : 'Salvar bancos'}
                </button>
                {saveOk && <span style={{ fontSize:12, color:'var(--grt)', fontWeight:600 }}>✓ Salvo!</span>}
              </div>
            </div>
          )}

          {/* ── ABA COFRE ────────────────────────────────────────────────────── */}
          {tab === 'cofre' && (
            <div style={{ maxWidth:700 }}>
              <div style={{ background:'#F5F3FF', border:'1px solid #DDD6FE', borderRadius:'var(--r)', padding:'12px 14px', fontSize:12, color:'#6D28D9', lineHeight:1.6, marginBottom:14 }}>
                <div style={{ fontWeight:700, marginBottom:4 }}>🔐 Cofre de senhas deste cliente</div>
                Logins e senhas ficam criptografados no servidor — nunca em texto puro no app.
              </div>
              <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:12 }}>
                <input value={cofreSearch} onChange={e=>setCofreSearch(e.target.value)} placeholder="🔍 Buscar sistema ou login..."
                  className="fi" style={{ flex:1 }} />
                {canSeeSenhas && (
                  <button className="btn bp bsm" onClick={openNewAcesso} style={{ whiteSpace:'nowrap', flexShrink:0 }}>+ Novo acesso</button>
                )}
              </div>
              {acessosLoading ? <Loader /> : acessosFiltrados.length === 0 ? (
                <div style={{ padding:'24px 16px', textAlign:'center', color:'var(--tx3)', fontSize:12 }}>
                  Nenhum acesso cadastrado ainda.
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
                            <button onClick={() => openEditAcesso(ac)} style={{ border:'none', background:'none', cursor:'pointer', color:'var(--tx3)', fontSize:13 }}>✏</button>
                            <button onClick={() => { if(confirm('Excluir este acesso?')) deleteAcesso.mutate(ac.id) }}
                              style={{ border:'none', background:'none', cursor:'pointer', color:'var(--tx3)', fontSize:16, lineHeight:1 }}>×</button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── ABA ROTINA ───────────────────────────────────────────────────── */}
          {tab === 'rotina' && (
            <div style={{ maxWidth:900 }}>
              <ContextTooltip pageKey="rotina_cliente_page" icon="🗓" title="O que é a Rotina do cliente?" color="#1D4ED8"
                tips={[
                  'É a agenda fixa desse cliente: o que precisa ser feito, em que dia e horário.',
                  'Cadastrada aqui, ela aparece na Central Operacional no dia e horário certos.',
                ]}
              />

              {/* Grid de rotinas por dia */}
              {rotinas.length > 0 && (() => {
                const byHora = (a, b) => (a.hora||'').localeCompare(b.hora||'')
                const diarias = [...rotinas].filter(r => r.tipo === 'diaria').sort(byHora)
                const mensais = [...rotinas].filter(r => r.tipo === 'mensal').sort(byHora)
                const diasComRotina = DIAS_SEMANA_R.map((label, idx) => ({
                  label,
                  rotinas: [...rotinas].filter(r => r.tipo === 'semanal' && (r.dias_semana?.includes(idx) || r.dia_semana === idx)).sort(byHora),
                })).filter(g => g.rotinas.length > 0)

                const rotinaCard = (r) => editandoRotina === r.id ? (
                  <div key={r.id} style={{ border:'1px solid #C7D2FE', borderRadius:8, padding:'10px', background:'#EEF2FF', marginBottom:6 }}>
                    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                      <input value={rotinaEditForm.titulo} onChange={e=>setRotinaEditForm(f=>({...f,titulo:e.target.value}))}
                        className="fi" placeholder="Título" style={{ fontSize:11 }} />
                      <div style={{ display:'flex', gap:6 }}>
                        <input type="time" value={rotinaEditForm.hora} onChange={e=>setRotinaEditForm(f=>({...f,hora:e.target.value}))}
                          className="fi" style={{ fontSize:11, flex:'0 0 90px' }} />
                        <input value={rotinaEditForm.observacao} onChange={e=>setRotinaEditForm(f=>({...f,observacao:e.target.value}))}
                          className="fi" placeholder="Observação..." style={{ fontSize:11, flex:1 }} />
                      </div>
                      {rotinaEditErr && <div style={{ fontSize:10, color:'var(--rdt)' }}>{rotinaEditErr}</div>}
                      <div style={{ display:'flex', gap:6 }}>
                        <button onClick={salvarEdicaoRotina} disabled={updateRotina.isPending}
                          style={{ padding:'4px 12px', borderRadius:6, border:'none', background:'#6366F1', color:'#fff', cursor:'pointer', fontSize:10, fontWeight:700 }}>
                          {updateRotina.isPending ? '...' : '✓ Salvar'}
                        </button>
                        <button onClick={() => setEditandoRotina(null)}
                          style={{ padding:'4px 10px', borderRadius:6, border:'1px solid #CBD5E1', background:'#fff', cursor:'pointer', fontSize:10, color:'#64748B' }}>
                          Cancelar
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div key={r.id} style={{ background:'var(--sur)', border:'1px solid var(--bo)', borderRadius:8, padding:'8px 10px', marginBottom:6, display:'flex', alignItems:'flex-start', gap:8 }}>
                    <div style={{ background: r.hora ? '#EEF2FF' : '#F1F5F9', color: r.hora ? '#4F46E5' : '#94A3B8', borderRadius:6, padding:'3px 6px', fontSize:10, fontWeight:700, flexShrink:0, minWidth:40, textAlign:'center' }}>
                      {r.hora ? r.hora.slice(0,5) : '—'}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:11, fontWeight:600, color:'var(--tx)', lineHeight:1.4 }}>{r.titulo}</div>
                      {r.observacao && <div style={{ fontSize:9, color:'var(--tx3)', marginTop:2, fontStyle:'italic' }}>{r.observacao}</div>}
                    </div>
                    <div style={{ display:'flex', gap:3, flexShrink:0 }}>
                      <button onClick={() => iniciarEdicaoRotina(r)}
                        style={{ border:'1px solid var(--bo)', background:'var(--s2)', borderRadius:5, cursor:'pointer', color:'var(--tx3)', fontSize:11, padding:'2px 7px' }}>✏</button>
                      <button onClick={() => { if(confirm('Remover rotina?')) deleteRotina.mutate(r.id) }}
                        style={{ border:'1px solid #FECDD3', background:'#FEF2F2', borderRadius:5, cursor:'pointer', color:'#EF4444', fontSize:13, padding:'2px 7px' }}>×</button>
                    </div>
                  </div>
                )

                const diaHeader = (label, count, cor) => (
                  <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:8, paddingBottom:5, borderBottom:`2px solid ${cor}` }}>
                    <span style={{ fontSize:10, fontWeight:800, color:cor, textTransform:'uppercase', letterSpacing:'.07em' }}>{label}</span>
                    <span style={{ background:cor, color:'#fff', borderRadius:99, fontSize:9, padding:'1px 6px', fontWeight:700 }}>{count}</span>
                  </div>
                )

                return (
                  <div style={{ display:'flex', flexDirection:'column', gap:16, marginBottom:20 }}>
                    {diasComRotina.length > 0 && (
                      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(150px,1fr))', gap:12 }}>
                        {diasComRotina.map(g => (
                          <div key={g.label}>
                            {diaHeader(g.label, g.rotinas.length, '#6366F1')}
                            {g.rotinas.map(rotinaCard)}
                          </div>
                        ))}
                      </div>
                    )}
                    {diarias.length > 0 && (
                      <div>
                        {diaHeader('🔁 Todo dia útil', diarias.length, '#10B981')}
                        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px,1fr))', gap:8 }}>
                          {diarias.map(rotinaCard)}
                        </div>
                      </div>
                    )}
                    {mensais.length > 0 && (
                      <div>
                        {diaHeader('📆 Mensal', mensais.length, '#F59E0B')}
                        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px,1fr))', gap:8 }}>
                          {mensais.map(rotinaCard)}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })()}

              {/* Form nova rotina */}
              <div style={{ border:'1px solid var(--bo)', borderRadius:'var(--r)', padding:'14px', background:'var(--s2)', maxWidth:600 }}>
                <div style={{ fontSize:10, fontWeight:700, color:'var(--tx3)', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:10 }}>+ Nova rotina</div>
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  <div>
                    <label className="lbl">Título *</label>
                    <input value={rotinaForm.titulo} onChange={e=>setRotinaForm(f=>({...f,titulo:e.target.value}))}
                      className="fi" placeholder="Ex: Agendamento bancário, Conciliação..." />
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                    <div>
                      <label className="lbl">Recorrência</label>
                      <select value={rotinaForm.tipo} onChange={e=>setRotinaForm(f=>({...f,tipo:e.target.value}))} className="fi">
                        <option value="diaria">Todo dia</option>
                        <option value="semanal">Semanal</option>
                        <option value="mensal">Mensal</option>
                      </select>
                    </div>
                    <div>
                      <label className="lbl">Horário</label>
                      <input type="time" value={rotinaForm.hora} onChange={e=>setRotinaForm(f=>({...f,hora:e.target.value}))} className="fi" />
                    </div>
                    {rotinaForm.tipo === 'semanal' && (
                      <div style={{ gridColumn:'1/-1' }}>
                        <label className="lbl">Dias da semana</label>
                        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                          {DIAS_SEMANA_R.map((d,i) => (
                            <button key={i} type="button" onClick={() => toggleDiaSemana(i)}
                              style={{ padding:'5px 10px', borderRadius:99, fontSize:11, fontWeight:600, cursor:'pointer',
                                border: rotinaForm.dias_semana.includes(i) ? '1px solid var(--br)' : '1px solid var(--bo)',
                                background: rotinaForm.dias_semana.includes(i) ? 'var(--brl)' : 'var(--sur)',
                                color: rotinaForm.dias_semana.includes(i) ? 'var(--br)' : 'var(--tx3)' }}>
                              {d.slice(0,3)}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {rotinaForm.tipo === 'mensal' && (
                      <div>
                        <label className="lbl">Dia do mês</label>
                        <input type="number" min={1} max={31} value={rotinaForm.dia_mes}
                          onChange={e=>setRotinaForm(f=>({...f,dia_mes:Number(e.target.value)}))} className="fi" />
                      </div>
                    )}
                    <div style={{ gridColumn: rotinaForm.tipo === 'diaria' ? '1/-1' : undefined }}>
                      <label className="lbl">Observação</label>
                      <input value={rotinaForm.observacao} onChange={e=>setRotinaForm(f=>({...f,observacao:e.target.value}))}
                        className="fi" placeholder="Detalhe opcional..." />
                    </div>
                  </div>
                  {rotinaErr && <div style={{ fontSize:11, color:'var(--rdt)' }}>{rotinaErr}</div>}
                  <button className="btn bp bsm" onClick={salvarRotina} disabled={createRotina.isPending} style={{ alignSelf:'flex-start' }}>
                    {createRotina.isPending ? 'Salvando…' : '+ Adicionar rotina'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── ABA ESCOPO ───────────────────────────────────────────────────── */}
          {tab === 'escopo' && (
            <div style={{ maxWidth:800 }}>
              {/* Tarefas abertas */}
              {tarefasCliente.length > 0 && (
                <div style={{ marginBottom:16 }}>
                  <div style={{ fontSize:10, fontWeight:700, color:'var(--tx3)', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:8 }}>
                    {tarefasCliente.length} tarefa{tarefasCliente.length!==1?'s':''} · detalhes em <strong>Tarefas</strong>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                    {tarefasCliente.map(t => {
                      const concluida = t.status === 'concluida'
                      return (
                        <div key={t.id} style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 12px', border:'1px solid var(--bo)', borderRadius:'var(--r)', background:'var(--s2)', opacity: concluida ? .5 : 1 }}>
                          <div style={{ width:7, height:7, borderRadius:'50%', background: concluida ? '#22C55E' : '#6366F1', flexShrink:0 }} />
                          <div style={{ flex:1, fontSize:12, color:'var(--tx)', textDecoration: concluida ? 'line-through' : 'none' }}>{t.titulo}</div>
                          <button onClick={() => { if(confirm('Remover esta tarefa?')) deleteTask.mutate(t.id) }}
                            style={{ border:'none', background:'none', cursor:'pointer', color:'#CBD5E1', fontSize:16, lineHeight:1 }}>×</button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Nova tarefa avulsa */}
              <div style={{ display:'flex', gap:8, marginBottom:16 }}>
                <input value={taskForm.titulo} onChange={e=>setTaskForm(f=>({...f,titulo:e.target.value}))}
                  onKeyDown={e => e.key==='Enter' && salvarTarefa()}
                  className="fi" placeholder="+ Nova tarefa avulsa..." style={{ flex:1 }} />
                <button className="btn bp bsm" onClick={salvarTarefa} disabled={createTask.isPending}>
                  {createTask.isPending ? '…' : 'Add'}
                </button>
              </div>
              {taskErr && <div style={{ fontSize:11, color:'var(--rdt)', marginBottom:8 }}>{taskErr}</div>}

              <div style={{ borderTop:'1px solid var(--bo)', paddingTop:16, marginBottom:12, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div style={{ fontSize:10, fontWeight:700, color:'var(--tx3)', textTransform:'uppercase', letterSpacing:'.07em' }}>
                  {totalModelos} modelo(s) vinculado(s)
                </div>
                <button onClick={() => { setGerarForm({ dataInicio:'', dataFim:'', dryRun:false }); setGerarResult(null); setGerarErr(''); setGerarModal(true) }}
                  className="btn bo bsm" style={{ fontSize:10 }}>
                  ⚙ Gerenciar geração
                </button>
              </div>

              {/* Modelos diretos */}
              {modelosDiretos.map(m => (
                <div key={`direto-${m.id}`} style={{ border:'1px solid var(--bo)', borderRadius:'var(--r)', background:'var(--s2)', marginBottom:6 }}>
                  <div style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'10px 12px' }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:12, fontWeight:600, color:'var(--tx)' }}>{m.titulo}</div>
                      <div style={{ fontSize:10, color:'var(--tx3)', marginTop:2 }}>{m.categoria} · {RECORRENCIA_LABEL[m.recorrencia] || m.recorrencia}</div>
                    </div>
                    <button onClick={() => desativarModeloDireto(m)} title="Remover do escopo"
                      style={{ border:'1px solid #FECDD3', background:'#FEF2F2', color:'#EF4444', borderRadius:5, cursor:'pointer', fontSize:13, padding:'2px 7px', lineHeight:1, flexShrink:0 }}>×</button>
                  </div>
                </div>
              ))}

              {/* Modelos via cliente_modelos */}
              {clienteModelos.map(cm => {
                const modelo = cm.tarefa_modelos || {}
                const bancosConfig = cm.config?.bancos || []
                const isPausado = cm.pausado
                const isEditing = editandoModelo === cm.id
                const recEfetiva = cm.recorrencia || modelo.recorrencia
                return (
                  <div key={cm.id} style={{ border: isPausado ? '1px dashed #CBD5E1' : '1px solid var(--bo)', borderRadius:'var(--r)', background: isPausado ? '#F8FAFC' : 'var(--s2)', opacity: isPausado ? .65 : 1, marginBottom:6 }}>
                    <div style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'10px 12px' }}>
                      {isPausado && <span title="Modelo pausado" style={{ fontSize:14, flexShrink:0, marginTop:1 }}>⏸</span>}
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:12, fontWeight:600, color:'var(--tx)' }}>{modelo.titulo}</div>
                        <div style={{ fontSize:10, color:'var(--tx3)', marginTop:2, display:'flex', flexWrap:'wrap', gap:4 }}>
                          <span>{modelo.categoria}</span><span>·</span>
                          <span style={{ color: cm.recorrencia?'#6366F1':'inherit', fontWeight: cm.recorrencia?600:400 }}>
                            {RECORRENCIA_LABEL[recEfetiva]||recEfetiva}{cm.recorrencia && <span title="Override ativo"> ✱</span>}
                          </span>
                          {cm.dia_mes && <span>· dia {cm.dia_mes}</span>}
                          {cm.hora && <span>· {cm.hora.slice(0,5)}</span>}
                          {bancosConfig.length>0 && <span style={{ color:'#6366F1', fontWeight:600 }}>· 🏦 {bancosConfig.join(', ')}</span>}
                          {isPausado && <span style={{ color:'#EF4444', fontWeight:600 }}>· Pausado</span>}
                        </div>
                      </div>
                      <div style={{ display:'flex', gap:4, flexShrink:0 }}>
                        <button onClick={() => {
                            if (isEditing) { setEditandoModelo(null); return }
                            setEditModeloForm({ recorrencia: cm.recorrencia||'', dia_mes: cm.dia_mes||'', hora: cm.hora||'', config: cm.config||{} })
                            setEditandoModelo(cm.id); setConfigModeloId(null)
                          }}
                          title="Editar override"
                          style={{ border:'1px solid var(--bo)', background: isEditing?'#EEF2FF':'transparent', color: isEditing?'#6366F1':'var(--tx3)', borderRadius:5, cursor:'pointer', fontSize:11, padding:'3px 7px', lineHeight:1 }}>✏</button>
                        <button onClick={() => togglePauseModelo.mutate({ id:cm.id, clienteId, pausado:!isPausado })}
                          title={isPausado?'Reativar':'Pausar'}
                          style={{ border:'1px solid var(--bo)', background:'transparent', color:'var(--tx3)', borderRadius:5, cursor:'pointer', fontSize:11, padding:'3px 7px', lineHeight:1 }}>
                          {isPausado?'▶':'⏸'}
                        </button>
                        <button onClick={() => desvincularEExcluir(cm)} title="Remover do escopo"
                          style={{ border:'1px solid #FECDD3', background:'#FEF2F2', color:'#EF4444', borderRadius:5, cursor:'pointer', fontSize:13, padding:'2px 7px', lineHeight:1 }}>×</button>
                      </div>
                    </div>
                    {/* Painel de override */}
                    {isEditing && (
                      <div style={{ padding:'12px', borderTop:'1px solid var(--bo)', background:'#F8FAFC', display:'flex', flexDirection:'column', gap:10 }}>
                        <div style={{ fontSize:10, fontWeight:700, color:'var(--tx3)', textTransform:'uppercase', letterSpacing:'.06em' }}>
                          Configurações deste cliente (sem alterar o modelo original)
                        </div>
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
                          <div>
                            <label style={{ fontSize:10, fontWeight:600, color:'var(--tx3)', display:'block', marginBottom:3 }}>Recorrência</label>
                            <select value={editModeloForm.recorrencia} onChange={e=>setEditModeloForm(f=>({...f,recorrencia:e.target.value}))}
                              style={{ width:'100%', fontSize:11, padding:'5px 6px', border:'1px solid var(--bo)', borderRadius:'var(--r)', background:'var(--sur)', color:'var(--tx)' }}>
                              <option value="">Padrão ({RECORRENCIA_LABEL[modelo.recorrencia]||modelo.recorrencia})</option>
                              {Object.entries(RECORRENCIA_LABEL).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                            </select>
                          </div>
                          <div>
                            <label style={{ fontSize:10, fontWeight:600, color:'var(--tx3)', display:'block', marginBottom:3 }}>Dia do mês</label>
                            <input type="number" min={1} max={31} value={editModeloForm.dia_mes}
                              onChange={e=>setEditModeloForm(f=>({...f,dia_mes:e.target.value}))}
                              placeholder={`Padrão: ${modelo.dia_mes||1}`}
                              style={{ width:'100%', fontSize:11, padding:'5px 6px', border:'1px solid var(--bo)', borderRadius:'var(--r)', background:'var(--sur)', color:'var(--tx)' }} />
                          </div>
                          <div>
                            <label style={{ fontSize:10, fontWeight:600, color:'var(--tx3)', display:'block', marginBottom:3 }}>Horário</label>
                            <input type="time" value={editModeloForm.hora}
                              onChange={e=>setEditModeloForm(f=>({...f,hora:e.target.value}))}
                              style={{ width:'100%', fontSize:11, padding:'5px 6px', border:'1px solid var(--bo)', borderRadius:'var(--r)', background:'var(--sur)', color:'var(--tx)' }} />
                          </div>
                        </div>
                        {(cliente?.bancos||[]).length > 0 && (
                          <div>
                            <label style={{ fontSize:10, fontWeight:600, color:'var(--tx3)', display:'block', marginBottom:4 }}>🏦 Bancos</label>
                            <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                              {(cliente?.bancos||[]).map(banco => {
                                const sel = editModeloForm.config?.bancos?.includes(banco)
                                return (
                                  <button key={banco} onClick={() => {
                                    const novos = sel
                                      ? (editModeloForm.config?.bancos||[]).filter(b=>b!==banco)
                                      : [...(editModeloForm.config?.bancos||[]), banco]
                                    setEditModeloForm(f=>({...f, config:{...f.config, bancos:novos}}))
                                  }}
                                    style={{ padding:'3px 8px', borderRadius:99, fontSize:11, cursor:'pointer', fontWeight:600, border:'none',
                                      background: sel?'#6366F1':'#E2E8F0', color: sel?'#fff':'#475569' }}>
                                    {sel?'✓ ':''}{banco}
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        )}
                        <div style={{ display:'flex', gap:6, justifyContent:'flex-end' }}>
                          <button onClick={() => setEditandoModelo(null)} className="btn bo bsm" style={{ fontSize:11 }}>Cancelar</button>
                          <button onClick={async () => {
                              const updates = { config: editModeloForm.config || cm.config }
                              updates.recorrencia = editModeloForm.recorrencia || null
                              updates.dia_mes = editModeloForm.dia_mes ? parseInt(editModeloForm.dia_mes) : null
                              updates.hora = editModeloForm.hora || null
                              await updateClienteModelo.mutateAsync({ id:cm.id, clienteId, ...updates })
                              setEditandoModelo(null)
                            }}
                            disabled={updateClienteModelo.isPending}
                            className="btn bp bsm" style={{ fontSize:11 }}>
                            {updateClienteModelo.isPending ? '…' : 'Salvar'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}

              {totalModelos === 0 && !showAddModelo && (
                <div style={{ padding:'20px', textAlign:'center', color:'var(--tx3)', fontSize:12, border:'1px dashed var(--bo)', borderRadius:'var(--r)', marginBottom:10 }}>
                  Nenhum modelo vinculado ainda.
                </div>
              )}

              {/* Adicionar modelo */}
              {!showAddModelo ? (
                <button onClick={() => setShowAddModelo(true)}
                  style={{ padding:'9px 16px', borderRadius:'var(--r)', border:'1px dashed var(--bo)', background:'transparent', cursor:'pointer', fontSize:12, fontWeight:600, color:'var(--br)', width:'100%', marginTop:8 }}>
                  + Vincular modelo de tarefa
                </button>
              ) : (
                <div style={{ border:'1px solid var(--bo)', borderRadius:'var(--r)', padding:'14px', background:'var(--sur)', marginTop:8 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:'var(--tx3)', marginBottom:10, textTransform:'uppercase' }}>Selecionar modelo</div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, maxHeight:360, overflowY:'auto' }}>
                    {todosModelos
                      .filter(m => m.ativo && !clienteModelos.find(cm => cm.modelo_id === m.id))
                      .filter(m => !m.software_alvo || m.software_alvo.toLowerCase() === (cliente?.software_contabil||'').trim().toLowerCase())
                      .map(m => (
                        <button key={m.id} onClick={() => vincularEAplicarModelo(m)}
                          style={{ padding:'10px 12px', border:'1px solid var(--bo)', borderRadius:'var(--r)', cursor:'pointer', background:'var(--s2)', textAlign:'left' }}
                          onMouseEnter={e => e.currentTarget.style.background='var(--s3)'}
                          onMouseLeave={e => e.currentTarget.style.background='var(--s2)'}>
                          <div style={{ fontSize:12, fontWeight:600, color:'var(--tx)' }}>{m.titulo}</div>
                          <div style={{ fontSize:10, color:'var(--tx3)', marginTop:2 }}>{m.categoria} · {RECORRENCIA_LABEL[m.recorrencia]||m.recorrencia}</div>
                        </button>
                      ))}
                  </div>
                  <button onClick={() => setShowAddModelo(false)}
                    style={{ marginTop:10, padding:'6px 14px', borderRadius:'var(--r)', border:'1px solid var(--bo)', background:'transparent', cursor:'pointer', fontSize:11, color:'var(--tx3)' }}>
                    Fechar
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* ── MODAL: INICIAR OPERAÇÃO ──────────────────────────────────────────── */}
      {iniciarOpModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1100, padding:16 }}>
          <div style={{ background:'var(--sur)', borderRadius:'var(--rx)', width:'100%', maxWidth:420, boxShadow:'var(--sh3)', overflow:'hidden' }}>
            <div style={{ padding:'14px 18px', borderBottom:'1px solid var(--bo)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div>
                <div style={{ fontWeight:700, fontSize:14 }}>▶ Iniciar Operação</div>
                <div style={{ fontSize:11, color:'var(--tx3)', marginTop:2 }}>Define a data de início e gera as tarefas do período</div>
              </div>
              <button onClick={() => setIniciarOpModal(false)} style={{ border:'none', background:'none', cursor:'pointer', fontSize:20, color:'var(--tx3)' }}>×</button>
            </div>
            <div style={{ padding:18 }}>
              <label style={{ fontSize:11, fontWeight:600, color:'var(--tx3)', display:'block', marginBottom:6 }}>
                A partir de qual data deseja iniciar a operação?
              </label>
              <input type="date" value={iniciarOpData} onChange={e => setIniciarOpData(e.target.value)}
                style={{ width:'100%', fontSize:13, padding:'8px 10px', border:'1px solid var(--bo)', borderRadius:'var(--r)', background:'var(--sur)', color:'var(--tx)', outline:'none', boxSizing:'border-box' }} />
              <div style={{ fontSize:10, color:'var(--tx3)', marginTop:6 }}>
                Tarefas serão geradas de <strong>{iniciarOpData||'—'}</strong> até hoje.
              </div>
              {iniciarOpErr && (
                <div style={{ marginTop:8, padding:'8px 10px', background:'#FEF2F2', border:'1px solid #FECDD3', borderRadius:'var(--r)', fontSize:11, color:'#EF4444' }}>
                  {iniciarOpErr}
                </div>
              )}
            </div>
            <div style={{ padding:'12px 18px', borderTop:'1px solid var(--bo)', display:'flex', justifyContent:'flex-end', gap:8 }}>
              <button className="btn bo bsm" onClick={() => setIniciarOpModal(false)}>Cancelar</button>
              <button className="btn bp bsm" onClick={executarIniciarOperacao} disabled={iniciarOpLoading}>
                {iniciarOpLoading ? 'Iniciando…' : '▶ Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: GERENCIAR GERAÇÃO ─────────────────────────────────────────── */}
      {gerarModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1100, padding:16 }}>
          <div style={{ background:'var(--sur)', borderRadius:'var(--rx)', width:'100%', maxWidth:480, boxShadow:'var(--sh3)', overflow:'hidden' }}>
            <div style={{ padding:'14px 18px', borderBottom:'1px solid var(--bo)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ fontWeight:700, fontSize:14 }}>⚙ Gerenciar Geração de Tarefas</div>
              <button onClick={() => setGerarModal(false)} style={{ border:'none', background:'none', cursor:'pointer', fontSize:20, color:'var(--tx3)' }}>×</button>
            </div>
            <div style={{ padding:18, display:'flex', flexDirection:'column', gap:12 }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                <div>
                  <label className="lbl">Data início</label>
                  <input type="date" value={gerarForm.dataInicio} onChange={e=>setGerarForm(f=>({...f,dataInicio:e.target.value}))} className="fi" />
                </div>
                <div>
                  <label className="lbl">Data fim</label>
                  <input type="date" value={gerarForm.dataFim} onChange={e=>setGerarForm(f=>({...f,dataFim:e.target.value}))} className="fi" />
                </div>
              </div>
              <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:12 }}>
                <input type="checkbox" checked={gerarForm.dryRun} onChange={e=>setGerarForm(f=>({...f,dryRun:e.target.checked}))}
                  style={{ width:14, height:14, accentColor:'var(--br)' }} />
                Dry run (simular sem salvar)
              </label>
              {gerarErr && <div style={{ padding:'8px 10px', background:'#FEF2F2', border:'1px solid #FECDD3', borderRadius:'var(--r)', fontSize:11, color:'#EF4444' }}>{gerarErr}</div>}
              {gerarResult && (
                <div style={{ padding:'10px 12px', background:'#F0FDF4', border:'1px solid #BBF7D0', borderRadius:'var(--r)', fontSize:12, color:'#15803D' }}>
                  ✓ {gerarResult.geradas ?? 0} tarefa(s) gerada(s) · {gerarResult.duplicidade_evitada ?? 0} já existiam
                  {gerarForm.dryRun && <span style={{ fontWeight:700 }}> (dry run — nada foi salvo)</span>}
                </div>
              )}
            </div>
            <div style={{ padding:'12px 18px', borderTop:'1px solid var(--bo)', display:'flex', justifyContent:'flex-end', gap:8 }}>
              <button className="btn bo bsm" onClick={() => setGerarModal(false)}>Fechar</button>
              <button className="btn bp bsm" onClick={executarGerarTarefas} disabled={gerarLoading}>
                {gerarLoading ? 'Gerando…' : gerarForm.dryRun ? '🔍 Simular' : '⚡ Gerar tarefas'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: COFRE — NOVO/EDITAR ACESSO ──────────────────────────────── */}
      {cofreModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1100, padding:16 }}>
          <div style={{ background:'var(--sur)', borderRadius:'var(--rx)', width:'100%', maxWidth:440, boxShadow:'var(--sh3)', overflow:'hidden' }}>
            <div style={{ padding:'14px 18px', borderBottom:'1px solid var(--bo)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ fontWeight:700, fontSize:14 }}>{cofreForm.id ? 'Editar acesso' : 'Novo acesso'}</div>
              <button onClick={() => setCofreModal(false)} style={{ border:'none', background:'none', cursor:'pointer', fontSize:20, color:'var(--tx3)' }}>×</button>
            </div>
            <div style={{ padding:18, display:'flex', flexDirection:'column', gap:12 }}>
              <div>
                <label className="lbl">Sistema / portal *</label>
                <input value={cofreForm.sistema||''} onChange={e=>setCofreForm(f=>({...f,sistema:e.target.value}))} className="fi" placeholder="Ex: Banco do Brasil, Receita Federal..." />
              </div>
              <div>
                <label className="lbl">Categoria</label>
                <select value={cofreForm.categoria||'outro'} onChange={e=>setCofreForm(f=>({...f,categoria:e.target.value}))} className="fi">
                  {CATEGORIAS_COFRE.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="lbl">Login / usuário</label>
                <input value={cofreForm.login||''} onChange={e=>setCofreForm(f=>({...f,login:e.target.value}))} className="fi" placeholder="email@empresa.com ou CPF" />
              </div>
              <div>
                <label className="lbl">URL de acesso</label>
                <input value={cofreForm.url||''} onChange={e=>setCofreForm(f=>({...f,url:e.target.value}))} className="fi" placeholder="https://..." />
              </div>
              <div>
                <label className="lbl">Senha</label>
                {cofreForm._temSenha && !cofreForm._novaSenha ? (
                  <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                    <span style={{ fontSize:11, color:'var(--tx3)' }}>Senha já cadastrada (criptografada)</span>
                    <button onClick={() => setCofreForm(f=>({...f,_temSenha:false,_novaSenha:''}))}
                      style={{ fontSize:10, padding:'3px 8px', border:'1px solid var(--bo)', borderRadius:6, cursor:'pointer', background:'transparent', color:'var(--tx3)' }}>
                      Alterar
                    </button>
                  </div>
                ) : (
                  <input type="password" value={cofreForm._novaSenha||''} onChange={e=>setCofreForm(f=>({...f,_novaSenha:e.target.value}))}
                    className="fi" placeholder="Nova senha (deixe vazio para não salvar senha)" />
                )}
              </div>
              <div>
                <label className="lbl">Observação</label>
                <input value={cofreForm.obs||''} onChange={e=>setCofreForm(f=>({...f,obs:e.target.value}))} className="fi" placeholder="Agência, conta, informação adicional..." />
              </div>
            </div>
            <div style={{ padding:'12px 18px', borderTop:'1px solid var(--bo)', display:'flex', justifyContent:'flex-end', gap:8 }}>
              <button className="btn bo bsm" onClick={() => setCofreModal(false)}>Cancelar</button>
              <button className="btn bp bsm" onClick={salvarAcessoCliente} disabled={saveAcesso.isPending}>
                {saveAcesso.isPending ? 'Salvando…' : 'Salvar acesso'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
