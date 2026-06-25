import { useMemo } from 'react'
import { useClients, useTasks, usePendencias } from '../hooks/useData'
import { useAuthStore } from '../store/authStore'
import { Loader, fmt, isVencida } from '../components/ui'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import OnboardingChecklist from '../components/ui/OnboardingChecklist'
import InsightsDash from '../components/ui/InsightsDash'

const STATUS_COLOR = {
  aberta:'#3B82F6', andamento:'#F59E0B', aguardando:'#8B5CF6',
  concluida:'#22C55E', impedimento:'#EF4444'
}

function KPI({ label, value, sub, color, icon, onClick }) {
  const colors = {
    blue:   { bg:'#EFF6FF', border:'#BFDBFE', text:'#1D4ED8', val:'#1E40AF' },
    green:  { bg:'#F0FDF4', border:'#BBF7D0', text:'#15803D', val:'#166534' },
    red:    { bg:'#FEF2F2', border:'#FECDD3', text:'#991B1B', val:'#7F1D1D' },
    yellow: { bg:'#FFFBEB', border:'#FDE68A', text:'#B45309', val:'#78350F' },
    purple: { bg:'#F5F3FF', border:'#DDD6FE', text:'#6D28D9', val:'#4C1D95' },
    gray:   { bg:'#F8FAFC', border:'#E2E8F0', text:'#475569', val:'#1E293B' },
  }
  const c = colors[color] || colors.gray
  return (
    <div onClick={onClick} style={{ background:c.bg, border:`1px solid ${c.border}`, borderRadius:12, padding:'16px', cursor:onClick?'pointer':'default', transition:'all .15s' }}
      onMouseEnter={e=>{ if(onClick) e.currentTarget.style.transform='translateY(-2px)' }}
      onMouseLeave={e=>{ if(onClick) e.currentTarget.style.transform='translateY(0)' }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:8 }}>
        <div style={{ fontSize:11, fontWeight:700, color:c.text, textTransform:'uppercase', letterSpacing:'.06em' }}>{label}</div>
        <span style={{ fontSize:18 }}>{icon}</span>
      </div>
      <div style={{ fontSize:28, fontWeight:800, color:c.val, lineHeight:1, marginBottom:4 }}>{value}</div>
      {sub && <div style={{ fontSize:11, color:c.text, opacity:.8 }}>{sub}</div>}
    </div>
  )
}

function Section({ title, icon, children, action }) {
  return (
    <div style={{ background:'#fff', borderRadius:12, border:'1px solid #F1F5F9', overflow:'hidden' }}>
      <div style={{ padding:'12px 16px', borderBottom:'1px solid #F8FAFC', display:'flex', alignItems:'center', gap:8 }}>
        <span style={{ fontSize:16 }}>{icon}</span>
        <span style={{ fontSize:13, fontWeight:700, color:'#0F172A', flex:1 }}>{title}</span>
        {action}
      </div>
      {children}
    </div>
  )
}

export default function DashPage() {
  const { profile, empresa } = useAuthStore()
  const nav = useNavigate()
  const { data: clients = [], isLoading: clLoad } = useClients()
  const { data: tasks = [],   isLoading: tLoad  } = useTasks()
  const { data: pends = [] } = usePendencias({ status: 'aberta' })

  const { data: apontamentos = [] } = useQuery({
    queryKey: ['apontamentos_dash', empresa?.id],
    queryFn: async () => {
      const hoje = new Date().toISOString().slice(0,10)
      const { data } = await supabase.from('apontamentos')
        .select('*, clientes(razao_social, fantasia)')
        .eq('empresa_id', empresa?.id)
        .gte('inicio', hoje)
        .order('inicio', { ascending: false })
        .limit(10)
      return data || []
    },
    enabled: !!empresa?.id,
  })

  const today    = new Date().toISOString().slice(0,10)
  const hora     = new Date().getHours()
  const greetz   = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite'
  const nome     = profile?.nome?.split(' ')[0] || 'usuário'
  const isOper   = profile?.perfil === 'operador'

  // ── Dados OPERADOR — filtrados pelo responsavel_id ──────────────────
  const minhasTarefas   = useMemo(() => tasks.filter(t => t.responsavel_id === profile?.id), [tasks, profile])
  const minhasHoje      = useMemo(() => minhasTarefas.filter(t => (t.data_execucao === today || t.prazo === today) && t.status !== 'concluida'), [minhasTarefas, today])
  const minhasPendentes = useMemo(() => minhasTarefas.filter(t => t.data_execucao && t.data_execucao < today && t.status !== 'concluida'), [minhasTarefas, today])
  const minhasConclHoje = useMemo(() => minhasTarefas.filter(t => t.status === 'concluida' && (t.data_execucao === today || t.prazo === today)), [minhasTarefas, today])
  const totalHoje       = minhasHoje.length + minhasConclHoje.length
  const progresso       = totalHoje > 0 ? Math.round(minhasConclHoje.length / totalHoje * 100) : 0

  // ── Dados GESTOR — empresa toda ──────────────────────────────────────
  const ativos     = useMemo(() => clients.filter(c=>c.status==='ativo'), [clients])
  const onboarding = useMemo(() => clients.filter(c=>['onboarding','implantacao'].includes(c.status)), [clients])
  const mrr        = useMemo(() => ativos.reduce((a,c)=>a+(c.valor_mrr||0),0), [ativos])
  const vencidas   = useMemo(() => tasks.filter(t=>isVencida(t.prazo,t.status)), [tasks])
  const abertas    = useMemo(() => tasks.filter(t=>!['concluida','cancelada'].includes(t.status)), [tasks])
  const hoje       = useMemo(() => tasks.filter(t=>(t.data_execucao===today||t.prazo===today)&&!['concluida','cancelada'].includes(t.status)), [tasks, today])
  const proximos   = useMemo(() => {
    const proxSemana = new Date(); proxSemana.setDate(proxSemana.getDate()+7)
    return tasks.filter(t => (t.data_execucao||t.prazo) > today && (t.data_execucao||t.prazo) <= proxSemana.toISOString().slice(0,10) && !['concluida','cancelada'].includes(t.status))
  }, [tasks, today])

  // Distribuição por status
  const porStatus = useMemo(() => {
    const map = {}
    abertas.forEach(t => { map[t.status] = (map[t.status]||0) + 1 })
    return map
  }, [abertas])

  // Top clientes por tarefas abertas
  const topClientes = useMemo(() => {
    const map = {}
    abertas.forEach(t => {
      if (t.cliente_id) {
        if (!map[t.cliente_id]) map[t.cliente_id] = { id:t.cliente_id, nome: t.clientes?.fantasia||t.clientes?.razao_social||'?', count:0, vencidas:0 }
        map[t.cliente_id].count++
        if (isVencida(t.prazo, t.status)) map[t.cliente_id].vencidas++
      }
    })
    return Object.values(map).sort((a,b)=>b.count-a.count).slice(0,5)
  }, [abertas])

  // Horas apontadas hoje
  const horasHoje = useMemo(() =>
    apontamentos.reduce((a,ap)=>a+(ap.segundos||0),0)/3600
  , [apontamentos])

  if (clLoad || tLoad) return <Loader />

  // ── DASHBOARD DO OPERADOR ────────────────────────────────────────────
  if (isOper) return (
    <div style={{ display:'flex', flexDirection:'column', gap:16, maxWidth:640 }}>

      {/* Saudação */}
      <div>
        <h1 style={{ fontSize:22, fontWeight:800, color:'#0F172A', margin:0, marginBottom:4 }}>
          {greetz}, {nome}! 👋
        </h1>
        <p style={{ color:'#64748B', fontSize:13, margin:0, textTransform:'capitalize' }}>
          {new Date().toLocaleDateString('pt-BR', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
        </p>
      </div>

      {/* Progresso do dia */}
      <div style={{ background:'#fff', borderRadius:14, border:'1px solid #E2E8F0', padding:'20px 24px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <div style={{ fontSize:14, fontWeight:700, color:'#0F172A' }}>Seu progresso hoje</div>
          <div style={{ fontSize:24, fontWeight:800, color: progresso === 100 ? '#16A34A' : '#6366F1' }}>{progresso}%</div>
        </div>
        <div style={{ height:10, background:'#F1F5F9', borderRadius:99, overflow:'hidden', marginBottom:8 }}>
          <div style={{ height:'100%', borderRadius:99, transition:'width .6s', width:`${progresso}%`,
            background: progresso === 100 ? '#22C55E' : '#6366F1' }} />
        </div>
        <div style={{ fontSize:12, color:'#94A3B8' }}>
          {minhasConclHoje.length} de {totalHoje} tarefas concluídas hoje
          {minhasPendentes.length > 0 && <span style={{ color:'#EF4444', marginLeft:12 }}>· {minhasPendentes.length} pendente{minhasPendentes.length > 1 ? 's' : ''} de dias anteriores</span>}
        </div>
      </div>

      {/* Pendentes de dias anteriores */}
      {minhasPendentes.length > 0 && (
        <div style={{ background:'#FFF8F8', borderRadius:14, border:'1px solid #FECDD3', overflow:'hidden' }}>
          <div style={{ padding:'12px 16px', borderBottom:'1px solid #FECDD3', display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:16 }}>🔴</span>
            <span style={{ fontSize:13, fontWeight:700, color:'#991B1B' }}>Pendentes de dias anteriores ({minhasPendentes.length})</span>
          </div>
          {minhasPendentes.map(t => {
            const cl = clients.find(c => c.id === t.cliente_id)
            const dataLabel = t.data_execucao
              ? new Date(t.data_execucao + 'T12:00:00').toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit' })
              : fmt(t.prazo)
            return (
              <div key={t.id} onClick={() => nav('/tasks')} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', borderBottom:'1px solid #FEE2E2', cursor:'pointer' }}
                onMouseEnter={e => e.currentTarget.style.background = '#FEF2F2'}
                onMouseLeave={e => e.currentTarget.style.background = ''}>
                <span style={{ fontSize:11, fontWeight:700, color:'#991B1B', background:'#FEE2E2', padding:'2px 8px', borderRadius:6, whiteSpace:'nowrap', flexShrink:0 }}>{dataLabel}</span>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:12, fontWeight:600, color:'#7F1D1D', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.titulo}</div>
                  {cl && <div style={{ fontSize:10, color:'#94A3B8', marginTop:1 }}>{cl.fantasia || cl.razao_social}</div>}
                  {t.motivo_pendencia && <div style={{ fontSize:10, color:'#EF4444', marginTop:2 }}>⚠ {t.motivo_pendencia}</div>}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Tarefas de hoje */}
      <div style={{ background:'#fff', borderRadius:14, border:'1px solid #E2E8F0', overflow:'hidden' }}>
        <div style={{ padding:'12px 16px', borderBottom:'1px solid #F1F5F9', display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:16 }}>☀️</span>
          <span style={{ fontSize:13, fontWeight:700, color:'#0F172A', flex:1 }}>Para fazer hoje ({minhasHoje.length})</span>
          <button onClick={() => nav('/tasks')} style={{ fontSize:10, color:'#6366F1', background:'none', border:'none', cursor:'pointer', fontWeight:700 }}>Abrir →</button>
        </div>
        {minhasHoje.length === 0 ? (
          <div style={{ padding:'32px', textAlign:'center', color:'#94A3B8', fontSize:13 }}>
            {progresso === 100 ? '🎉 Tudo concluído! Ótimo trabalho!' : 'Nenhuma tarefa para hoje.'}
          </div>
        ) : minhasHoje.map(t => {
          const cl = clients.find(c => c.id === t.cliente_id)
          return (
            <div key={t.id} onClick={() => nav('/tasks')} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', borderBottom:'1px solid #F8FAFC', cursor:'pointer' }}
              onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
              onMouseLeave={e => e.currentTarget.style.background = ''}>
              <div style={{ width:18, height:18, borderRadius:4, border:'2px solid #CBD5E1', flexShrink:0 }} />
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:600, color:'#0F172A', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.titulo}</div>
                {cl && <div style={{ fontSize:11, color:'#94A3B8', marginTop:1 }}>🏢 {cl.fantasia || cl.razao_social}</div>}
              </div>
              {t.categoria && <span style={{ fontSize:10, color:'#6366F1', background:'#EEF2FF', padding:'2px 8px', borderRadius:6, whiteSpace:'nowrap', flexShrink:0 }}>{t.categoria}</span>}
            </div>
          )
        })}
      </div>

      {/* Concluídas hoje */}
      {minhasConclHoje.length > 0 && (
        <div style={{ background:'#F0FDF4', borderRadius:14, border:'1px solid #BBF7D0', overflow:'hidden' }}>
          <div style={{ padding:'12px 16px', display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:16 }}>✅</span>
            <span style={{ fontSize:13, fontWeight:700, color:'#15803D' }}>Concluídas hoje ({minhasConclHoje.length})</span>
          </div>
          {minhasConclHoje.map(t => {
            const cl = clients.find(c => c.id === t.cliente_id)
            return (
              <div key={t.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 16px', borderTop:'1px solid #BBF7D0' }}>
                <span style={{ color:'#22C55E', fontSize:16, flexShrink:0 }}>✓</span>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:12, color:'#94A3B8', textDecoration:'line-through', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.titulo}</div>
                  {cl && <div style={{ fontSize:10, color:'#94A3B8' }}>{cl.fantasia || cl.razao_social}</div>}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )

  // ── DASHBOARD DO GESTOR ──────────────────────────────────────────────
  return (
  <div style={{ display:'flex', flexDirection:'column', gap:16, width:'100%', maxWidth:'100%' }}>

      {/* Saudação */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:8 }}>
        <div>
          <h1 style={{ fontSize:20, fontWeight:800, color:'#0F172A', margin:0, marginBottom:3 }}>
            {greetz}, {nome}! 👋
          </h1>
          <p style={{ color:'#64748B', fontSize:12, margin:0 }}>
            {new Date().toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}
            {hoje.length > 0 && ` · ${hoje.length} tarefa${hoje.length>1?'s':''} para hoje`}
          </p>
        </div>
        {vencidas.length > 0 && (
          <div onClick={()=>nav('/tasks')} style={{ padding:'8px 14px', borderRadius:10, background:'#FEF2F2', border:'1px solid #FECDD3', fontSize:12, fontWeight:700, color:'#991B1B', cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
            ⚠ {vencidas.length} tarefa{vencidas.length>1?'s':''} vencida{vencidas.length>1?'s':''}
          </div>
        )}
      </div>

      {/* Onboarding + Insights — só gestor */}
      <OnboardingChecklist />
      <InsightsDash />

      {/* Banner de trial */}
      {empresa?.plano === 'trial' && profile?.perfil === 'admin' && (() => {
        const expira = new Date(empresa.trial_expira_em)
        const criado = new Date(empresa.criado_em || empresa.created_at || expira.getTime() - 14*86400000)
        const diasTotal = Math.max(14, Math.round((expira - criado) / 86400000))
        const diasRestantes = Math.max(0, Math.ceil((expira - new Date()) / (1000*60*60*24)))
        const pct = Math.min(100, Math.round(((diasTotal - diasRestantes) / diasTotal) * 100))
        const urgente = diasRestantes <= 2
        return (
          <div style={{ background: urgente ? '#FEF2F2' : '#F0F9FF', border: `1px solid ${urgente ? '#FECDD3' : '#BAE6FD'}`, borderRadius:12, padding:'16px 20px', display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
            <div style={{ flex:1, minWidth:200 }}>
              <div style={{ fontSize:13, fontWeight:700, color: urgente ? '#991B1B' : '#0369A1', marginBottom:6 }}>
                {urgente ? '⚠️' : '⏳'} {diasRestantes === 0 ? 'Trial expira hoje!' : `${diasRestantes} dia${diasRestantes>1?'s':''} restante${diasRestantes>1?'s':''} no trial`}
              </div>
              <div style={{ height:6, background: urgente ? '#FECDD3' : '#BAE6FD', borderRadius:99, overflow:'hidden' }}>
                <div style={{ height:'100%', borderRadius:99, width:`${pct}%`, background: urgente ? '#EF4444' : '#0EA5E9', transition:'width .5s' }} />
              </div>
            </div>
            <button onClick={()=>nav('/config')} style={{ background:'linear-gradient(135deg,#6366F1,#8B5CF6)', border:'none', color:'#fff', padding:'9px 20px', borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap' }}>
              Assinar agora →
            </button>
          </div>
        )
      })()}

      {/* KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:10 }}>
        <KPI icon="💰" label="MRR" value={mrr>=1000?`R$${(mrr/1000).toFixed(1)}k`:`R$${mrr.toFixed(0)}`} sub={`${ativos.length} clientes ativos`} color="blue" onClick={()=>nav('/clientes')} />
        <KPI icon="✅" label="Tarefas abertas" value={abertas.length} sub={vencidas.length>0?`${vencidas.length} vencidas`:'Em dia'} color={vencidas.length>0?'red':'green'} onClick={()=>nav('/tasks')} />
        <KPI icon="☀️" label="Para hoje" value={hoje.length} sub="agendadas para hoje" color={hoje.length>0?'yellow':'gray'} onClick={()=>nav('/agenda')} />
        <KPI icon="📋" label="Pendências" value={pends.length} sub="aguardando cliente" color={pends.length>3?'red':'yellow'} onClick={()=>nav('/pendencias')} />
        <KPI icon="🚀" label="Onboarding" value={onboarding.length} sub="em implantação" color="purple" onClick={()=>nav('/clientes')} />
        <KPI icon="⏱" label="Horas hoje" value={`${horasHoje.toFixed(1)}h`} sub="apontadas" color="blue" onClick={()=>nav('/exec')} />
      </div>

      {/* Linha 2: Tarefas hoje + Distribuição status */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(320px,1fr))', gap:14 }}>

        {/* Tarefas de hoje */}
        <Section title="Para fazer hoje" icon="☀️" action={
          <button onClick={()=>nav('/tasks')} style={{ fontSize:10, color:'#6366F1', background:'none', border:'none', cursor:'pointer', fontWeight:700 }}>Ver todas →</button>
        }>
          {hoje.length === 0 ? (
            <div style={{ padding:'24px', textAlign:'center', color:'#94A3B8', fontSize:12 }}>
              🎉 Nenhuma tarefa para hoje!
            </div>
          ) : hoje.slice(0,5).map(t => {
            const cl = clients.find(c=>c.id===t.cliente_id)
            return (
              <div key={t.id} onClick={()=>nav('/tasks')} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 16px', borderBottom:'1px solid #F8FAFC', cursor:'pointer' }}
                onMouseEnter={e=>e.currentTarget.style.background='#F8FAFC'}
                onMouseLeave={e=>e.currentTarget.style.background=''}>
                <div style={{ width:8, height:8, borderRadius:'50%', background:STATUS_COLOR[t.status]||'#CBD5E1', flexShrink:0 }} />
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:12, fontWeight:600, color:'#0F172A', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.titulo}</div>
                  <div style={{ fontSize:10, color:'#94A3B8', marginTop:1 }}>{cl?.fantasia||cl?.razao_social||'—'} · {t.categoria||'—'}</div>
                </div>
                <span style={{ fontSize:9, padding:'2px 6px', borderRadius:4, background:STATUS_COLOR[t.status]+'22', color:STATUS_COLOR[t.status], fontWeight:700, flexShrink:0 }}>{t.status}</span>
              </div>
            )
          })}
          {hoje.length > 5 && (
            <div onClick={()=>nav('/tasks')} style={{ padding:'10px', textAlign:'center', fontSize:11, color:'#6366F1', fontWeight:700, cursor:'pointer', borderTop:'1px solid #F8FAFC' }}>
              +{hoje.length-5} mais
            </div>
          )}
        </Section>

        {/* Distribuição de status */}
        <Section title="Distribuição de tarefas" icon="📊">
          <div style={{ padding:'16px' }}>
            {Object.entries(STATUS_COLOR).map(([st, color]) => {
              const cnt = porStatus[st] || 0
              const pct = abertas.length ? Math.round(cnt/abertas.length*100) : 0
              return (
                <div key={st} style={{ marginBottom:10 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                    <span style={{ fontSize:11, color:'#334155', fontWeight:600, textTransform:'capitalize' }}>{st}</span>
                    <span style={{ fontSize:11, color:'#64748B' }}>{cnt} ({pct}%)</span>
                  </div>
                  <div style={{ height:6, background:'#F1F5F9', borderRadius:99, overflow:'hidden' }}>
                    <div style={{ height:'100%', background:color, borderRadius:99, width:`${pct}%`, transition:'width .5s' }} />
                  </div>
                </div>
              )
            })}
            <div style={{ marginTop:12, paddingTop:12, borderTop:'1px solid #F8FAFC', display:'flex', justifyContent:'space-between', fontSize:11, color:'#64748B' }}>
              <span>Total abertas</span>
              <span style={{ fontWeight:700, color:'#0F172A' }}>{abertas.length}</span>
            </div>
          </div>
        </Section>
      </div>

      {/* Linha 3: Top clientes + Próximos 7 dias */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(320px,1fr))', gap:14 }}>

        {/* Top clientes */}
        <Section title="Clientes com mais tarefas" icon="🏢" action={
          <button onClick={()=>nav('/clientes')} style={{ fontSize:10, color:'#6366F1', background:'none', border:'none', cursor:'pointer', fontWeight:700 }}>Ver todos →</button>
        }>
          {topClientes.length === 0 ? (
            <div style={{ padding:'24px', textAlign:'center', color:'#94A3B8', fontSize:12 }}>Nenhum dado</div>
          ) : topClientes.map((cl, i) => (
            <div key={cl.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 16px', borderBottom:'1px solid #F8FAFC' }}>
              <div style={{ width:22, height:22, borderRadius:'50%', background:'#EEF2FF', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:800, color:'#6366F1', flexShrink:0 }}>{i+1}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:12, fontWeight:600, color:'#0F172A', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{cl.nome}</div>
                <div style={{ fontSize:10, color:'#94A3B8', marginTop:1 }}>{cl.count} tarefa{cl.count>1?'s':''} abertas</div>
              </div>
              {cl.vencidas > 0 && (
                <span style={{ fontSize:9, padding:'2px 6px', borderRadius:4, background:'#FEF2F2', color:'#991B1B', fontWeight:700 }}>⚠ {cl.vencidas}</span>
              )}
            </div>
          ))}
        </Section>

        {/* Próximos 7 dias */}
        <Section title="Próximos 7 dias" icon="📅" action={
          <button onClick={()=>nav('/agenda')} style={{ fontSize:10, color:'#6366F1', background:'none', border:'none', cursor:'pointer', fontWeight:700 }}>Agenda →</button>
        }>
          {proximos.length === 0 ? (
            <div style={{ padding:'24px', textAlign:'center', color:'#94A3B8', fontSize:12 }}>Nenhuma tarefa nos próximos 7 dias</div>
          ) : proximos.slice(0,6).map(t => {
            const cl = clients.find(c=>c.id===t.cliente_id)
            const diasRestantes = Math.ceil((new Date(t.prazo+'T12:00:00')-new Date())/(1000*60*60*24))
            return (
              <div key={t.id} onClick={()=>nav('/tasks')} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 16px', borderBottom:'1px solid #F8FAFC', cursor:'pointer' }}
                onMouseEnter={e=>e.currentTarget.style.background='#F8FAFC'}
                onMouseLeave={e=>e.currentTarget.style.background=''}>
                <div style={{ width:32, height:32, borderRadius:8, background:'#F8FAFC', border:'1px solid #E2E8F0', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <div style={{ fontSize:12, fontWeight:800, color:'#334155', lineHeight:1 }}>{new Date(t.prazo+'T12:00:00').getDate()}</div>
                  <div style={{ fontSize:7, color:'#94A3B8', textTransform:'uppercase' }}>
                    {new Date(t.prazo+'T12:00:00').toLocaleDateString('pt-BR',{month:'short'})}
                  </div>
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:12, fontWeight:600, color:'#0F172A', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.titulo}</div>
                  <div style={{ fontSize:10, color:'#94A3B8', marginTop:1 }}>{cl?.fantasia||cl?.razao_social||'—'}</div>
                </div>
                <span style={{ fontSize:10, color: diasRestantes<=2?'#991B1B':'#64748B', fontWeight:600, flexShrink:0 }}>
                  {diasRestantes===1?'amanhã':`${diasRestantes}d`}
                </span>
              </div>
            )
          })}
        </Section>
      </div>

      {/* Linha 4: Tarefas vencidas */}
      {vencidas.length > 0 && (
        <Section title={`Tarefas vencidas (${vencidas.length})`} icon="⚠️" action={
          <button onClick={()=>nav('/tasks')} style={{ fontSize:10, color:'#991B1B', background:'none', border:'none', cursor:'pointer', fontWeight:700 }}>Ver todas →</button>
        }>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:8, padding:'12px' }}>
            {vencidas.slice(0,6).map(t => {
              const cl = clients.find(c=>c.id===t.cliente_id)
              return (
                <div key={t.id} onClick={()=>nav('/tasks')} style={{ padding:'10px 12px', borderRadius:8, background:'#FEF2F2', border:'1px solid #FECDD3', cursor:'pointer', borderLeft:'3px solid #EF4444' }}>
                  <div style={{ fontSize:12, fontWeight:600, color:'#0F172A', marginBottom:3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.titulo}</div>
                  <div style={{ fontSize:10, color:'#94A3B8', display:'flex', gap:6 }}>
                    {cl && <span>🏢 {cl.fantasia||cl.razao_social}</span>}
                    <span style={{ color:'#991B1B', fontWeight:600 }}>📅 {fmt(t.prazo)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </Section>
      )}

      {/* Jornada dos clientes em onboarding */}
      {onboarding.length > 0 && (
        <Section title="Clientes em onboarding/implantação" icon="🚀">
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:8, padding:'12px' }}>
            {onboarding.map(cl => {
              const clTasks = tasks.filter(t=>t.cliente_id===cl.id&&!['concluida','cancelada'].includes(t.status))
              const clVenc = clTasks.filter(t=>isVencida(t.prazo,t.status))
              return (
                <div key={cl.id} onClick={()=>nav('/clientes')} style={{ padding:'12px', borderRadius:10, background:'#F5F3FF', border:'1px solid #DDD6FE', cursor:'pointer' }}>
                  <div style={{ fontSize:12, fontWeight:700, color:'#4C1D95', marginBottom:4, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {cl.fantasia||cl.razao_social}
                  </div>
                  <div style={{ fontSize:10, padding:'2px 8px', borderRadius:99, background:'#EDE9FE', color:'#6D28D9', fontWeight:600, display:'inline-block', marginBottom:6 }}>
                    {cl.status}
                  </div>
                  <div style={{ fontSize:10, color:'#6D28D9', display:'flex', gap:8 }}>
                    <span>✅ {clTasks.length} tarefas</span>
                    {clVenc.length > 0 && <span style={{ color:'#991B1B' }}>⚠ {clVenc.length}</span>}
                  </div>
                </div>
              )
            })}
          </div>
        </Section>
      )}

    </div>
  )
}
