import { useState, useCallback } from 'react'
import { useTarefaModelos, useCreateModelo, useUpdateModelo, useDeleteModelo, useClients } from '../hooks/useData'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { Card, CardHeader, Btn, Loader } from '../components/ui'
import ContextTooltip from '../components/ui/ContextTooltip'

const CATEGORIAS = ['Contas a Pagar','Contas a Receber','Conciliação Bancária','Emissão de NF','Emissão de Boletos','Cobrança / Inadimplência','Fluxo de Caixa','Pagamentos','DRE Gerencial / Relatórios','Implantação','Onboarding','Estratégico','Relacionamento','Outro']
const PRIORIDADES = [{ v:'baixa', label:'Baixa', color:'#16A34A' }, { v:'media', label:'Média', color:'#D97706' }, { v:'alta', label:'Alta', color:'#DC2626' }]
const RECORRENCIAS = [
  { v:'diaria',          label:'Diária',                desc:'Todo dia, incluindo fins de semana' },
  { v:'dias_uteis',      label:'Dias úteis',            desc:'Segunda a sexta-feira' },
  { v:'semanal',         label:'Semanal',               desc:'Dias específicos da semana' },
  { v:'quinzenal',       label:'Quinzenal',             desc:'A cada 15 dias' },
  { v:'mensal',          label:'Mensal',                desc:'Um dia fixo do mês' },
  { v:'dias_especificos',label:'Dias específicos',      desc:'Múltiplos dias do mês' },
  { v:'bimestral',       label:'Bimestral',             desc:'A cada 2 meses' },
  { v:'trimestral',      label:'Trimestral',            desc:'A cada 3 meses (Jan/Abr/Jul/Out)' },
  { v:'semestral',       label:'Semestral',             desc:'A cada 6 meses (Jan/Jul)' },
  { v:'anual',           label:'Anual',                 desc:'Uma vez por ano' },
]
const DIAS_SEMANA = [
  { v:1, label:'Seg' }, { v:2, label:'Ter' }, { v:3, label:'Qua' },
  { v:4, label:'Qui' }, { v:5, label:'Sex' }, { v:6, label:'Sáb' }, { v:0, label:'Dom' },
]

const fi = { width:'100%', padding:'8px 10px', border:'1px solid #E2E8F0', borderRadius:8, fontSize:13, fontFamily:'inherit', background:'#fff', outline:'none' }
const ETAPAS_MODELO = [
  { v:'',               label:'— Todas as etapas —' },
  { v:'comercial',      label:'Comercial' },
  { v:'pre_ob',         label:'Pré-Onboarding' },
  { v:'onboarding',     label:'Onboarding' },
  { v:'implantacao',    label:'Implantação' },
  { v:'operacional',    label:'Operacional' },
  { v:'estrategico',    label:'Estratégico' },
  { v:'acompanhamento', label:'Acompanhamento' },
  { v:'encerramento',   label:'Encerramento' },
]
const EMPTY_FORM = { titulo:'', descricao:'', categoria:'', etapa:'', prioridade:'media', recorrencia:'dias_uteis', dias_semana:[], dia_mes:5, dias_mes:[], checklist_items:[], cliente_id:'', ativo:true }

export default function ModelosPage() {
  const { data: modelos = [], isLoading } = useTarefaModelos()
  const { data: clients = [] } = useClients()
  const createModelo = useCreateModelo()
  const updateModelo = useUpdateModelo()
  const deleteModelo = useDeleteModelo()
  const { empresa } = useAuthStore()
  const [gerando, setGerando] = useState(false)
  const [geracaoModal, setGeracaoModal] = useState(false)
  const [mesGeracao, setMesGeracao] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
  })
  const [geracaoLog, setGeracaoLog] = useState([])

  async function gerarMes() {
    if (!mesGeracao) return alert('Selecione o mês')
    setGerando(true)
    setGeracaoLog([])
    const log = []

    try {
      // Buscar todos os modelos ativos
      const { data: modelosAtivos } = await supabase
        .from('tarefa_modelos')
        .select('*')
        .eq('ativo', true)
        .eq('empresa_id', empresa?.id)

      // Buscar todos os clientes ativos
      const { data: clientesAtivos } = await supabase
        .from('clientes')
        .select('*')
        .eq('empresa_id', empresa?.id)

      if (!modelosAtivos?.length) {
        setGeracaoLog(['Nenhum modelo ativo encontrado.'])
        setGerando(false)
        return
      }

      let totalGeradas = 0

      for (const modelo of modelosAtivos) {
        // Determinar quais clientes esse modelo se aplica
        const clientes = modelo.cliente_id
          ? clientesAtivos.filter(c => c.id === modelo.cliente_id)
          : clientesAtivos

        for (const cliente of clientes) {
          // Verificar se já foi gerado para esse mês
          const { data: jaGerado } = await supabase
            .from('tarefa_geracoes')
            .select('id')
            .eq('modelo_id', modelo.id)
            .eq('cliente_id', cliente.id)
            .eq('mes_ano', mesGeracao)
            .maybeSingle()

          if (jaGerado) {
            log.push(`⏭ ${modelo.titulo} → ${cliente.fantasia||cliente.razao_social} (já gerado)`)
            continue
          }

          // Calcular data de execução baseada no dia_mes e mês selecionado
          const [ano, mes] = mesGeracao.split('-').map(Number)
          const diaExec = modelo.dia_mes || 5
          const dataExec = `${mesGeracao}-${String(diaExec).padStart(2,'0')}`

          // Para conciliação bancária — gerar uma tarefa por banco
          const ehConciliacao = modelo.categoria === 'Conciliação Bancária'
          const bancos = cliente.bancos || []

          if (ehConciliacao && bancos.length > 0) {
            for (const banco of bancos) {
              const { data: tarefa } = await supabase
                .from('tarefas')
                .insert({
                  titulo: `${modelo.titulo} — ${banco}`,
                  categoria: modelo.categoria,
                  prioridade: modelo.prioridade || 'media',
                  status: 'aberta',
                  cliente_id: cliente.id,
                  empresa_id: empresa?.id,
                  modelo_id: modelo.id,
                  data_execucao: dataExec,
                  prazo: dataExec,
                })
                .select().single()

              if (tarefa?.id && modelo.checklist_items?.length) {
                await supabase.from('tarefa_checklists').insert(
                  modelo.checklist_items.map((texto, ordem) => ({
                    tarefa_id: tarefa.id,
                    empresa_id: empresa?.id,
                    texto, ordem
                  }))
                )
              }
              totalGeradas++
            }
          } else {
            // Tarefa normal
            const { data: tarefa } = await supabase
              .from('tarefas')
              .insert({
                titulo: modelo.titulo,
                categoria: modelo.categoria,
                prioridade: modelo.prioridade || 'media',
                status: 'aberta',
                cliente_id: cliente.id,
                empresa_id: empresa?.id,
                modelo_id: modelo.id,
                data_execucao: dataExec,
                prazo: dataExec,
              })
              .select().single()

            if (tarefa?.id && modelo.checklist_items?.length) {
              await supabase.from('tarefa_checklists').insert(
                modelo.checklist_items.map((texto, ordem) => ({
                  tarefa_id: tarefa.id,
                  empresa_id: empresa?.id,
                  texto, ordem
                }))
              )
            }
            totalGeradas++
          }

          // Registrar geração para evitar duplicatas
          await supabase.from('tarefa_geracoes').insert({
            modelo_id: modelo.id,
            cliente_id: cliente.id,
            empresa_id: empresa?.id,
            mes_ano: mesGeracao,
            tarefas_geradas: ehConciliacao && bancos.length > 0 ? bancos.length : 1
          })

          log.push(`✅ ${modelo.titulo} → ${cliente.fantasia||cliente.razao_social}`)
        }
      }

      log.push(`\n🎉 Total: ${totalGeradas} tarefas geradas para ${mesGeracao}`)
      setGeracaoLog(log)
    } catch (err) {
      log.push(`❌ Erro: ${err.message}`)
      setGeracaoLog(log)
    }

    setGerando(false)
  }

  const [modal, setModal]   = useState(null) // null | 'new' | 'edit'
  const [form, setForm]     = useState(EMPTY_FORM)
  const [newCk, setNewCk]   = useState('')
  const [fCliente, setFCliente] = useState('')
  const [confirmDel, setConfirmDel] = useState(null)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  function abrirNovo() {
    setForm(EMPTY_FORM)
    setNewCk('')
    setModal('new')
  }

  function abrirEditar(m) {
    setForm({
      titulo: m.titulo, descricao: m.descricao || '', categoria: m.categoria || '', etapa: m.etapa || '',
      prioridade: m.prioridade, recorrencia: m.recorrencia, dias_semana: m.dias_semana || [],
      dia_mes: m.dia_mes || 5, dias_mes: m.dias_mes || [],
      checklist_items: m.checklist_items || [], cliente_id: m.cliente_id || '',
      ativo: m.ativo, _id: m.id,
    })
    setNewCk('')
    setModal('edit')
  }

  async function salvar() {
    if (!form.titulo.trim()) return alert('Informe o título do modelo.')
    const payload = {
      titulo: form.titulo.trim(),
      descricao: form.descricao?.trim() || null,
      categoria: form.categoria || null,
      etapa: form.etapa || null,
      prioridade: form.prioridade,
      recorrencia: form.recorrencia,
      dias_semana: form.recorrencia === 'semanal' ? form.dias_semana : null,
      dia_mes: ['mensal','quinzenal','bimestral','trimestral','semestral','anual'].includes(form.recorrencia) ? form.dia_mes : null,
      dias_mes: form.recorrencia === 'dias_especificos' ? form.dias_mes : null,
      checklist_items: form.checklist_items,
      cliente_id: form.cliente_id || null,
      ativo: form.ativo,
    }
    if (modal === 'edit') {
      await updateModelo.mutateAsync({ id: form._id, ...payload })
    } else {
      await createModelo.mutateAsync(payload)
    }
    setModal(null)
  }

  async function confirmarDelete() {
    await deleteModelo.mutateAsync(confirmDel)
    setConfirmDel(null)
  }

  function addChecklist() {
    const txt = newCk.trim()
    if (!txt) return
    set('checklist_items', [...form.checklist_items, txt])
    setNewCk('')
  }

  function toggleDia(v) {
    const arr = form.dias_semana.includes(v)
      ? form.dias_semana.filter(d => d !== v)
      : [...form.dias_semana, v]
    set('dias_semana', arr)
  }

  function toggleDiaMes(v) {
    const arr = form.dias_mes.includes(v)
      ? form.dias_mes.filter(d => d !== v)
      : [...form.dias_mes, v]
    set('dias_mes', arr.sort((a, b) => a - b))
  }

  const recLabel = { diaria:'Diária', dias_uteis:'Dias úteis', semanal:'Semanal', quinzenal:'Quinzenal', mensal:'Mensal', dias_especificos:'Dias espec.', bimestral:'Bimestral', trimestral:'Trimestral', semestral:'Semestral', anual:'Anual' }
  const prioColor = { baixa:'#16A34A', media:'#D97706', alta:'#DC2626' }

  const modelosFiltrados = fCliente
    ? modelos.filter(m => m.cliente_id === fCliente || (!m.cliente_id && fCliente === '__geral'))
    : modelos

  if (isLoading) return <Loader />

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* MODAL GERAÇÃO */}
      {geracaoModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div style={{ background:'#fff', borderRadius:14, width:'100%', maxWidth:520, padding:28 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <div style={{ fontSize:17, fontWeight:700, color:'#0F172A' }}>Gerar tarefas do mes</div>
              <button onClick={() => { setGeracaoModal(false); setGeracaoLog([]) }} style={{ background:'none', border:'none', fontSize:20, cursor:'pointer', color:'#64748B' }}>x</button>
            </div>
            <div style={{ background:'#F0FDF4', border:'1px solid #BBF7D0', borderRadius:8, padding:'10px 14px', marginBottom:16, fontSize:12, color:'#15803D' }}>
              O sistema gera uma tarefa por modelo para cada cliente. Para Conciliacao Bancaria, gera uma tarefa por banco cadastrado no cliente.
            </div>
            <div style={{ marginBottom:16 }}>
              <label style={{ fontSize:11, fontWeight:700, color:'#64748B', display:'block', marginBottom:6, textTransform:'uppercase' }}>Mes de geracao</label>
              <input type="month" value={mesGeracao} onChange={e => setMesGeracao(e.target.value)}
                style={{ width:'100%', padding:'9px 12px', border:'1px solid #E2E8F0', borderRadius:8, fontSize:14, fontFamily:'inherit' }} />
            </div>
            {geracaoLog.length > 0 && (
              <div style={{ background:'#F8FAFC', border:'1px solid #E2E8F0', borderRadius:8, padding:14, marginBottom:16, maxHeight:200, overflowY:'auto' }}>
                {geracaoLog.map((l, i) => (
                  <div key={i} style={{ fontSize:11, padding:'2px 0', fontWeight: l.startsWith('Total') ? 700 : 400, color: l.startsWith('Erro') ? '#991B1B' : l.startsWith('ja gerado') ? '#92400E' : '#334155' }}>{l}</div>
                ))}
              </div>
            )}
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button onClick={() => { setGeracaoModal(false); setGeracaoLog([]) }}
                style={{ padding:'9px 20px', borderRadius:8, border:'1px solid #E2E8F0', background:'#fff', cursor:'pointer', fontSize:13, fontWeight:500 }}>Fechar</button>
              <button onClick={gerarMes} disabled={gerando}
                style={{ padding:'9px 20px', borderRadius:8, border:'none', background: gerando ? '#94A3B8' : '#6366F1', color:'#fff', cursor: gerando ? 'not-allowed' : 'pointer', fontSize:13, fontWeight:600 }}>
                {gerando ? 'Gerando...' : 'Gerar tarefas'}
              </button>
            </div>
          </div>
        </div>
      )}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <div>
          <h2 style={{ fontSize:18, fontWeight:700, color:'#0F172A', margin:0 }}>Rotinas</h2>
          <p style={{ fontSize:12, color:'#64748B', margin:'4px 0 0' }}>Configure tarefas recorrentes por cliente — o sistema gera automaticamente conforme a recorrência.</p>
        </div>
        <button onClick={() => setGeracaoModal(true)}
          style={{ padding:'10px 20px', borderRadius:8, border:'none', background:'#6366F1', color:'#fff', cursor:'pointer', fontSize:13, fontWeight:600, display:'flex', alignItems:'center', gap:6 }}>
          🗓 Gerar mês
        </button>
      </div>
    <ContextTooltip
        pageKey="modelos"
        icon="🔁"
        title="Como usar os Modelos de Tarefas"
        color="#F59E0B"
        tips={[
          'Configure uma tarefa recorrente uma vez — o sistema gera automaticamente todo mês.',
          'Ideal para: folha de pagamento, DRE, conciliação bancária, emissão de NF.',
          'Defina a recorrência (diária, semanal, mensal) e o dia de execução.',
          'As tarefas geradas aparecem automaticamente na página de Tarefas.',
        ]}
      />

      {/* HEADER */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div>
          <div style={{ fontSize:13, color:'#64748B', marginTop:2 }}>
            Configure tarefas recorrentes por cliente — o sistema gera automaticamente conforme a recorrência.
          </div>
        </div>
        <Btn variant="primary" onClick={abrirNovo}>+ Novo modelo</Btn>
      </div>

      {/* FILTRO CLIENTE */}
      <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
        <button onClick={() => setFCliente('')}
          style={{ padding:'5px 14px', borderRadius:99, fontSize:12, fontWeight:600, cursor:'pointer', border:'none',
            background: !fCliente ? '#6366F1' : '#F1F5F9', color: !fCliente ? '#fff' : '#475569' }}>
          Todos
        </button>
        <button onClick={() => setFCliente('__geral')}
          style={{ padding:'5px 14px', borderRadius:99, fontSize:12, fontWeight:600, cursor:'pointer', border:'none',
            background: fCliente === '__geral' ? '#6366F1' : '#F1F5F9', color: fCliente === '__geral' ? '#fff' : '#475569' }}>
          Geral (sem cliente)
        </button>
        {clients.map(c => (
          <button key={c.id} onClick={() => setFCliente(c.id)}
            style={{ padding:'5px 14px', borderRadius:99, fontSize:12, fontWeight:600, cursor:'pointer', border:'none',
              background: fCliente === c.id ? '#6366F1' : '#F1F5F9', color: fCliente === c.id ? '#fff' : '#475569' }}>
            {c.fantasia || c.razao_social}
          </button>
        ))}
      </div>

      {/* LISTA */}
      {modelosFiltrados.length === 0 ? (
        <Card>
          <div style={{ padding:'40px 20px', textAlign:'center', color:'#94A3B8', fontSize:13 }}>
            Nenhum modelo cadastrado. Clique em <strong>+ Novo modelo</strong> para começar.
          </div>
        </Card>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {modelosFiltrados.map(m => {
            const cliente = clients.find(c => c.id === m.cliente_id)
            return (
              <div key={m.id} style={{ background:'#fff', border:'1px solid #E2E8F0', borderRadius:10, padding:'14px 16px',
                display:'flex', alignItems:'center', gap:12, opacity: m.ativo ? 1 : 0.5 }}>
                <div style={{ width:8, height:8, borderRadius:'50%', background: prioColor[m.prioridade], flexShrink:0 }} />
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:'#0F172A' }}>{m.titulo}</div>
                  <div style={{ fontSize:11, color:'#94A3B8', marginTop:2, display:'flex', gap:8, flexWrap:'wrap' }}>
                    {m.etapa && <span>🔖 {ETAPAS_MODELO.find(e=>e.v===m.etapa)?.label || m.etapa}</span>}
                    {m.categoria && <span>📂 {m.categoria}</span>}
                    {cliente && <span>🏢 {cliente.fantasia || cliente.razao_social}</span>}
                    {!m.cliente_id && <span>🌐 Geral</span>}
                    {m.checklist_items?.length > 0 && <span>✓ {m.checklist_items.length} itens</span>}
                  </div>
                </div>
                <span style={{ fontSize:11, padding:'3px 10px', borderRadius:99, background:'#EFF6FF', color:'#1D4ED8', fontWeight:600, whiteSpace:'nowrap' }}>
                  {recLabel[m.recorrencia] || m.recorrencia}
                </span>
                {!m.ativo && <span style={{ fontSize:10, color:'#94A3B8', fontWeight:600 }}>INATIVO</span>}
                <div style={{ display:'flex', gap:4, flexShrink:0 }}>
                  <button onClick={() => abrirEditar(m)} style={{ padding:'5px 8px', borderRadius:6, border:'1px solid #E2E8F0', background:'#fff', cursor:'pointer', fontSize:11 }}>✏</button>
                  <button onClick={() => setConfirmDel(m.id)} style={{ padding:'5px 8px', borderRadius:6, border:'1px solid #FECDD3', background:'#FEF2F2', color:'#991B1B', cursor:'pointer', fontSize:11 }}>🗑</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* MODAL FORM */}
      {(modal === 'new' || modal === 'edit') && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.45)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div style={{ background:'#fff', borderRadius:14, width:'100%', maxWidth:560, maxHeight:'90vh', overflowY:'auto', padding:24 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
              <div style={{ fontSize:16, fontWeight:700 }}>{modal === 'new' ? 'Novo modelo' : 'Editar modelo'}</div>
              <button onClick={() => setModal(null)} style={{ background:'none', border:'none', fontSize:18, cursor:'pointer', color:'#64748B' }}>×</button>
            </div>

            {/* Título */}
            <div style={{ marginBottom:12 }}>
              <label style={{ fontSize:11, fontWeight:700, color:'#64748B', display:'block', marginBottom:4, textTransform:'uppercase' }}>Título *</label>
              <input style={fi} value={form.titulo} onChange={e => set('titulo', e.target.value)} placeholder="Ex: Conferência Bancária Matinal" />
            </div>

            {/* Descrição operacional */}
            <div style={{ marginBottom:12 }}>
              <label style={{ fontSize:11, fontWeight:700, color:'#64748B', display:'block', marginBottom:4, textTransform:'uppercase' }}>Descrição operacional</label>
              <textarea style={{ ...fi, minHeight:70, resize:'vertical' }} value={form.descricao || ''} onChange={e => set('descricao', e.target.value)} placeholder="Descreva o que deve ser feito, ferramentas usadas, cuidados importantes..." />
            </div>

            {/* Cliente */}
            <div style={{ marginBottom:12 }}>
              <label style={{ fontSize:11, fontWeight:700, color:'#64748B', display:'block', marginBottom:4, textTransform:'uppercase' }}>Cliente (opcional)</label>
              <select style={fi} value={form.cliente_id} onChange={e => set('cliente_id', e.target.value)}>
                <option value="">Geral — todos os clientes</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.fantasia || c.razao_social}</option>)}
              </select>
            </div>

            {/* Etapa + Categoria + Prioridade */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:12 }}>
              <div>
                <label style={{ fontSize:11, fontWeight:700, color:'#64748B', display:'block', marginBottom:4, textTransform:'uppercase' }}>Etapa BPO</label>
                <select style={fi} value={form.etapa} onChange={e => set('etapa', e.target.value)}>
                  {ETAPAS_MODELO.map(e => <option key={e.v} value={e.v}>{e.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize:11, fontWeight:700, color:'#64748B', display:'block', marginBottom:4, textTransform:'uppercase' }}>Categoria</label>
                <select style={fi} value={form.categoria} onChange={e => set('categoria', e.target.value)}>
                  <option value="">Sem categoria</option>
                  {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize:11, fontWeight:700, color:'#64748B', display:'block', marginBottom:4, textTransform:'uppercase' }}>Prioridade</label>
                <select style={fi} value={form.prioridade} onChange={e => set('prioridade', e.target.value)}>
                  {PRIORIDADES.map(p => <option key={p.v} value={p.v}>{p.label}</option>)}
                </select>
              </div>
            </div>

            {/* Recorrência */}
            <div style={{ marginBottom:12 }}>
              <label style={{ fontSize:11, fontWeight:700, color:'#64748B', display:'block', marginBottom:6, textTransform:'uppercase' }}>Recorrência</label>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {RECORRENCIAS.map(r => (
                  <label key={r.v} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', border:`1px solid ${form.recorrencia === r.v ? '#6366F1' : '#E2E8F0'}`, borderRadius:8, cursor:'pointer', background: form.recorrencia === r.v ? '#EEF2FF' : '#fff' }}>
                    <input type="radio" name="rec" value={r.v} checked={form.recorrencia === r.v} onChange={() => set('recorrencia', r.v)} />
                    <div>
                      <div style={{ fontSize:13, fontWeight:600, color:'#0F172A' }}>{r.label}</div>
                      <div style={{ fontSize:11, color:'#94A3B8' }}>{r.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Dias da semana (semanal) */}
            {form.recorrencia === 'semanal' && (
              <div style={{ marginBottom:12 }}>
                <label style={{ fontSize:11, fontWeight:700, color:'#64748B', display:'block', marginBottom:6, textTransform:'uppercase' }}>Dias da semana</label>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                  {DIAS_SEMANA.map(d => (
                    <button key={d.v} type="button" onClick={() => toggleDia(d.v)}
                      style={{ padding:'6px 12px', borderRadius:8, fontSize:12, fontWeight:600, cursor:'pointer', border:'none',
                        background: form.dias_semana.includes(d.v) ? '#6366F1' : '#F1F5F9',
                        color: form.dias_semana.includes(d.v) ? '#fff' : '#475569' }}>
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Dia do mês (mensal, quinzenal, bimestral, trimestral, semestral, anual) */}
            {['mensal','quinzenal','bimestral','trimestral','semestral','anual'].includes(form.recorrencia) && (
              <div style={{ marginBottom:12 }}>
                <label style={{ fontSize:11, fontWeight:700, color:'#64748B', display:'block', marginBottom:4, textTransform:'uppercase' }}>Dia do mês (1–28)</label>
                <input style={{ ...fi, width:100 }} type="number" min={1} max={28} value={form.dia_mes} onChange={e => set('dia_mes', parseInt(e.target.value) || 1)} />
              </div>
            )}

            {/* Dias específicos do mês */}
            {form.recorrencia === 'dias_especificos' && (
              <div style={{ marginBottom:12 }}>
                <label style={{ fontSize:11, fontWeight:700, color:'#64748B', display:'block', marginBottom:6, textTransform:'uppercase' }}>Dias do mês</label>
                <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                  {Array.from({ length: 28 }, (_, i) => i + 1).map(d => (
                    <button key={d} type="button" onClick={() => toggleDiaMes(d)}
                      style={{ width:32, height:32, borderRadius:6, fontSize:11, fontWeight:600, cursor:'pointer', border:'none',
                        background: form.dias_mes.includes(d) ? '#6366F1' : '#F1F5F9',
                        color: form.dias_mes.includes(d) ? '#fff' : '#475569' }}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Checklist */}
            <div style={{ marginBottom:12 }}>
              <label style={{ fontSize:11, fontWeight:700, color:'#64748B', display:'block', marginBottom:6, textTransform:'uppercase' }}>Checklist padrão</label>
              {form.checklist_items.map((item, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
                  <span style={{ flex:1, fontSize:12, color:'#475569', padding:'4px 8px', background:'#F8FAFC', borderRadius:6 }}>{item}</span>
                  <button type="button" onClick={() => set('checklist_items', form.checklist_items.filter((_, j) => j !== i))}
                    style={{ background:'none', border:'none', color:'#94A3B8', cursor:'poin