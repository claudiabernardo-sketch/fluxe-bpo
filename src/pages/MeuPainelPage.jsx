import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { useUpdateApontamento, useDeleteApontamento } from '../hooks/useData'

const PERFIL_LABEL = { admin:'Administrador', gestor:'Gestor', supervisor:'Supervisor', operador:'Operador' }
const STATUS_LABEL  = { aberta:'A fazer', andamento:'Em andamento', aguardando:'Aguardando', impedimento:'Impedimento', concluida:'Concluída' }
const STATUS_COR    = { aberta:'var(--tx3)', andamento:'var(--br)', aguardando:'var(--yw)', impedimento:'var(--rd)', concluida:'var(--gr)' }

function fmtHoras(segundos) {
  const totalMin = Math.round(segundos / 60)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  return `${h}h${m ? ` ${String(m).padStart(2, '0')}min` : ''}`
}

function LinhaApontamento({ ap }) {
  const [editando, setEditando] = useState(false)
  const [horasForm, setHorasForm] = useState('')
  const [confirmDel, setConfirmDel] = useState(false)
  const atualizar = useUpdateApontamento()
  const remover = useDeleteApontamento()

  const cliente = ap.clientes?.fantasia || ap.clientes?.razao_social
  const titulo = ap.tarefas?.titulo || ap.tarefas_avulsas?.titulo || cliente || 'Apontamento avulso'
  const dataFmt = new Date(ap.inicio).toLocaleDateString('pt-BR')
  const horasDecimal = ap.segundos / 3600
  // Timer esquecido ligado costuma passar de 6h numa tarefa só — sinaliza pra facilitar achar o problema.
  const suspeito = horasDecimal > 6

  function iniciarEdicao() {
    setHorasForm(horasDecimal.toFixed(2))
    setEditando(true)
  }
  function salvar() {
    const h = Number(horasForm.replace(',', '.'))
    if (!h || h <= 0) return
    const novoFim = new Date(new Date(ap.inicio).getTime() + h * 3600 * 1000).toISOString()
    atualizar.mutate({ id: ap.id, inicio: ap.inicio, fim: novoFim }, { onSuccess: () => setEditando(false) })
  }

  return (
    <div style={{ padding: '9px 14px', borderBottom: '1px solid var(--bo)', display: 'flex', alignItems: 'center', gap: 9 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--tx)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{titulo}</div>
        <div style={{ fontSize: 10, color: 'var(--tx3)' }}>{cliente ? `${cliente} · ` : ''}{dataFmt}</div>
      </div>
      {editando ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <input
            type="number" step="0.25" min="0" autoFocus value={horasForm}
            onChange={e => setHorasForm(e.target.value)}
            style={{ width: 56, padding: '4px 6px', fontSize: 11, border: '1px solid var(--bo)', borderRadius: 6, fontFamily: 'inherit' }}
          />
          <span style={{ fontSize: 10, color: 'var(--tx3)' }}>h</span>
          <button onClick={salvar} disabled={atualizar.isPending} title="Salvar" style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--gr)' }}>✓</button>
          <button onClick={() => setEditando(false)} title="Cancelar" style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--tx3)' }}>✕</button>
        </div>
      ) : confirmDel ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 10, color: 'var(--rdt)' }}>Apagar?</span>
          <button onClick={() => remover.mutate(ap.id)} disabled={remover.isPending} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 11, color: 'var(--rdt)', fontWeight: 700 }}>Sim</button>
          <button onClick={() => setConfirmDel(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 11, color: 'var(--tx3)' }}>Não</button>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            className={suspeito ? 'b b-rd' : 'b b-gy'}
            style={{ fontSize: 9 }}
            title={suspeito ? 'Mais de 6h numa tarefa só — confere se o timer ficou esquecido ligado' : undefined}
          >{fmtHoras(ap.segundos)}{suspeito ? ' ⚠️' : ''}</span>
          <button onClick={iniciarEdicao} title="Corrigir tempo" style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 11, color: 'var(--tx3)' }}>✏️</button>
          <button onClick={() => setConfirmDel(true)} title="Apagar" style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 11, color: 'var(--tx3)' }}>🗑️</button>
        </div>
      )}
    </div>
  )
}

export default function MeuPainelPage() {
  const { profile, empresa } = useAuthStore()
  const today = new Date().toISOString().slice(0, 10)
  const mesStart = new Date(); mesStart.setDate(1); mesStart.setHours(0, 0, 0, 0)
  const semStart = new Date(Date.now() - 7 * 86400000)

  const { data: tasks = [] } = useQuery({
    queryKey: ['my-tasks', profile?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('tarefas')
        .select('*, clientes(razao_social, fantasia)')
        .eq('empresa_id', empresa?.id)
        .eq('responsavel_id', profile?.id)
        .order('prazo', { ascending: true })
      return data || []
    },
    enabled: !!empresa?.id && !!profile?.id,
  })

  const { data: horas = [] } = useQuery({
    queryKey: ['my-horas', profile?.id, mesStart.toISOString()],
    queryFn: async () => {
      const { data } = await supabase
        .from('apontamentos')
        .select('*, clientes(razao_social, fantasia), tarefas(titulo), tarefas_avulsas(titulo)')
        .eq('usuario_id', profile?.id)
        .gte('inicio', mesStart.toISOString())
        .order('inicio', { ascending: false })
      return data || []
    },
    enabled: !!profile?.id,
  })

  const ativas    = tasks.filter(t => t.status !== 'arquivada')
  const hoje      = ativas.filter(t => (t.data_execucao || t.prazo) === today)
  const atrasadas = ativas.filter(t => (t.data_execucao || t.prazo) < today && t.status !== 'concluida')
  const conclSem  = tasks.filter(t => t.status === 'concluida' && new Date(t.updated_at || t.prazo) >= semStart)
  const totalHoras = horas.reduce((s, h) => s + (h.segundos || 0), 0) / 3600
  const clientes = [...new Map(ativas.map(t => {
    const nome = t.clientes?.fantasia || t.clientes?.razao_social
    return [nome, t.clientes]
  }).filter(([k]) => k)).values()]
  const clienteNome = c => c?.fantasia || c?.razao_social || '—'
  const initials = profile?.nome?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?'

  const KPIs = [
    { label:'Tarefas Hoje',     val: hoje.length,         icon:'fa-solid fa-sun',               cor:'var(--or)', bg:'var(--orb)' },
    { label:'Em Atraso',        val: atrasadas.length,    icon:'fa-solid fa-circle-exclamation', cor:'var(--rd)', bg:'var(--rdb)' },
    { label:'Concluídas (7d)',  val: conclSem.length,     icon:'fa-solid fa-circle-check',       cor:'var(--gr)', bg:'var(--grb)' },
    { label:'Horas no Mês',     val: totalHoras.toFixed(1) + 'h', icon:'fa-solid fa-clock',    cor:'var(--br)', bg:'var(--brl)' },
  ]

  return (
    <div style={{ maxWidth:860, margin:'0 auto' }}>

      {/* Cabeçalho do usuário */}
      <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:22, paddingTop:4 }}>
        <div style={{
          width:52, height:52, borderRadius:'50%',
          background:'linear-gradient(135deg,#6366F1,#A855F7)',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:18, fontWeight:700, color:'#fff', flexShrink:0,
        }}>{initials}</div>
        <div>
          <div style={{ fontSize:19, fontWeight:800, color:'var(--tx)', letterSpacing:'-.4px' }}>
            {profile?.nome || 'Usuário'}
          </div>
          <div style={{ fontSize:12, color:'var(--tx3)', marginTop:2 }}>
            {PERFIL_LABEL[profile?.perfil] || profile?.perfil}
            {empresa && <> · {empresa.nome}</>}
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:16 }}>
        {KPIs.map(k => (
          <div key={k.label} style={{ background:'var(--sur)', border:'1px solid var(--bo)', borderRadius:'var(--rl)', padding:'14px 16px', boxShadow:'var(--sh)', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:k.cor, borderRadius:'var(--rl) var(--rl) 0 0' }} />
            <div style={{ width:32, height:32, borderRadius:9, background:k.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, color:k.cor, marginBottom:8 }}>
              <i className={k.icon}></i>
            </div>
            <div style={{ fontSize:22, fontWeight:800, color:k.cor, letterSpacing:'-.5px', lineHeight:1 }}>{k.val}</div>
            <div style={{ fontSize:10, fontWeight:700, color:'var(--tx3)', textTransform:'uppercase', letterSpacing:'.06em', marginTop:3 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Grid 2 colunas */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>

        {/* Tarefas de hoje */}
        <div style={{ background:'var(--sur)', border:'1px solid var(--bo)', borderRadius:'var(--rl)', boxShadow:'var(--sh)' }}>
          <div className="ch">
            <div className="ct"><i className="fa-solid fa-sun" style={{ color:'var(--or)' }}></i> Hoje</div>
            <span className="b b-or">{hoje.length}</span>
          </div>
          <div style={{ maxHeight:220, overflowY:'auto' }}>
            {hoje.length === 0
              ? <div style={{ padding:'20px', textAlign:'center', color:'var(--tx3)', fontSize:12 }}>Nenhuma tarefa para hoje</div>
              : hoje.map(t => (
                <div key={t.id} style={{ padding:'9px 14px', borderBottom:'1px solid var(--bo)', display:'flex', alignItems:'center', gap:9 }}>
                  <div style={{ width:8, height:8, borderRadius:'50%', background:STATUS_COR[t.status], flexShrink:0 }}></div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:11, fontWeight:600, color:'var(--tx)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.titulo}</div>
                    <div style={{ fontSize:10, color:'var(--tx3)' }}>{clienteNome(t.clientes)}</div>
                  </div>
                  <span className="b b-gy" style={{ fontSize:9 }}>{STATUS_LABEL[t.status]}</span>
                </div>
              ))
            }
          </div>
        </div>

        {/* Em atraso */}
        <div style={{ background:'var(--sur)', border:'1px solid var(--bo)', borderRadius:'var(--rl)', boxShadow:'var(--sh)' }}>
          <div className="ch">
            <div className="ct"><i className="fa-solid fa-circle-exclamation" style={{ color:'var(--rd)' }}></i> Em Atraso</div>
            <span className="b b-rd">{atrasadas.length}</span>
          </div>
          <div style={{ maxHeight:220, overflowY:'auto' }}>
            {atrasadas.length === 0
              ? <div style={{ padding:'20px', textAlign:'center', color:'var(--tx3)', fontSize:12 }}>Sem atrasos</div>
              : atrasadas.map(t => {
                const dias = Math.floor((Date.now() - new Date(t.data_execucao || t.prazo)) / 86400000)
                return (
                  <div key={t.id} style={{ padding:'9px 14px', borderBottom:'1px solid var(--bo)', display:'flex', alignItems:'center', gap:9 }}>
                    <i className="fa-solid fa-circle-exclamation" style={{ color:'var(--rd)', fontSize:11, flexShrink:0 }}></i>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:11, fontWeight:600, color:'var(--tx)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.titulo}</div>
                      <div style={{ fontSize:10, color:'var(--tx3)' }}>{clienteNome(t.clientes)}</div>
                    </div>
                    <span style={{ fontSize:10, fontWeight:700, color:'var(--rdt)', whiteSpace:'nowrap' }}>+{dias}d</span>
                  </div>
                )
              })
            }
          </div>
        </div>

        {/* Meus clientes */}
        <div style={{ background:'var(--sur)', border:'1px solid var(--bo)', borderRadius:'var(--rl)', boxShadow:'var(--sh)' }}>
          <div className="ch">
            <div className="ct"><i className="fa-solid fa-building" style={{ color:'var(--br)' }}></i> Meus Clientes</div>
            <span className="b b-bl">{clientes.length}</span>
          </div>
          <div style={{ padding:'12px 14px', display:'flex', flexWrap:'wrap', gap:6 }}>
            {clientes.length === 0
              ? <div style={{ color:'var(--tx3)', fontSize:12 }}>Nenhum cliente vinculado</div>
              : clientes.map(c => (
                <span key={clienteNome(c)} style={{ padding:'4px 11px', borderRadius:99, background:'var(--brl)', color:'var(--br)', fontSize:11, fontWeight:600 }}>
                  {clienteNome(c)}
                </span>
              ))
            }
          </div>
        </div>

        {/* Concluídas na semana */}
        <div style={{ background:'var(--sur)', border:'1px solid var(--bo)', borderRadius:'var(--rl)', boxShadow:'var(--sh)' }}>
          <div className="ch">
            <div className="ct"><i className="fa-solid fa-circle-check" style={{ color:'var(--gr)' }}></i> Concluídas (7 dias)</div>
            <span className="b b-gr">{conclSem.length}</span>
          </div>
          <div style={{ maxHeight:200, overflowY:'auto' }}>
            {conclSem.length === 0
              ? <div style={{ padding:'20px', textAlign:'center', color:'var(--tx3)', fontSize:12 }}>Nenhuma conclusão recente</div>
              : conclSem.map(t => (
                <div key={t.id} style={{ padding:'9px 14px', borderBottom:'1px solid var(--bo)', display:'flex', alignItems:'center', gap:9 }}>
                  <i className="fa-solid fa-check" style={{ color:'var(--gr)', fontSize:10, flexShrink:0 }}></i>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:11, fontWeight:600, color:'var(--tx3)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', textDecoration:'line-through' }}>{t.titulo}</div>
                    <div style={{ fontSize:10, color:'var(--tx3)' }}>{clienteNome(t.clientes)}</div>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      </div>

      {/* Meus apontamentos — corrigir tempo quando o timer fica esquecido ligado */}
      <div style={{ background:'var(--sur)', border:'1px solid var(--bo)', borderRadius:'var(--rl)', boxShadow:'var(--sh)', marginTop:12 }}>
        <div className="ch">
          <div className="ct"><i className="fa-solid fa-clock" style={{ color:'var(--br)' }}></i> Meus Apontamentos (este mês)</div>
          <span className="b b-bl">{horas.length}</span>
        </div>
        <div style={{ maxHeight:280, overflowY:'auto' }}>
          {horas.length === 0
            ? <div style={{ padding:'20px', textAlign:'center', color:'var(--tx3)', fontSize:12 }}>Nenhum apontamento este mês</div>
            : horas.map(ap => <LinhaApontamento key={ap.id} ap={ap} />)
          }
        </div>
      </div>
    </div>
  )
}
