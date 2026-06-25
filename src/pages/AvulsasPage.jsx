import { useState } from 'react'
import { useClients } from '../hooks/useData'
import { useAuthStore } from '../store/authStore'
import { Card, Btn, Badge, Loader, EmptyState, fmt } from '../components/ui'
import { useTimerStore } from '../components/layout/TimerBar'
import { supabase } from '../lib/supabase'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export default function AvulsasPage() {
  const { data: clients = [] } = useClients()
  const { empresa } = useAuthStore()
  const qc = useQueryClient()
  const startTimer = useTimerStore(s => s.start)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ prioridade:'media', status:'aberta' })
  const [isAgend, setIsAgend] = useState(false)

  const { data: avulsas = [], isLoading } = useQuery({
    queryKey: ['avulsas', empresa?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('tarefas_avulsas')
        .select('*, clientes(razao_social,fantasia)')
        .eq('empresa_id', empresa?.id)
        .order('criado_em', { ascending:false })
      if (error) throw error
      return data?.[0]
    },
    enabled: !!empresa?.id,
  })

  const create = useMutation({
    mutationFn: async (av) => {
      const { data, error } = await supabase.from('tarefas_avulsas')
        .insert({ ...av, empresa_id: empresa?.id }).select()
      if (error) throw error
      return data?.[0]
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey:['avulsas'] }); setModal(false); setForm({ prioridade:'media', status:'aberta' }); setIsAgend(false) }
  })

  const update = useMutation({
    mutationFn: async ({ id, ...data }) => {
      const { error } = await supabase.from('tarefas_avulsas').update(data).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey:['avulsas'] })
  })

  const DIAS_AG = [ {value:'proxima_segunda',label:'Próxima segunda'},{value:'proxima_terca',label:'Próxima terça'},{value:'proxima_quarta',label:'Próxima quarta'},{value:'proxima_quinta',label:'Próxima quinta'},{value:'proxima_sexta',label:'Próxima sexta'},{value:'urgente',label:'Urgente — hoje'} ]
  const FORMAS = [ {value:'pix',label:'PIX'},{value:'ted',label:'TED'},{value:'boleto',label:'Boleto'},{value:'cartao',label:'Cartão'} ]

  const fi = { width:'100%', padding:'7px 10px', border:'1px solid #E2E8F0', borderRadius:8, fontSize:12, fontFamily:'inherit', background:'#fff' }

  if (isLoading) return <Loader />

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:16 }}>
        <Btn variant="primary" onClick={() => setModal(true)}>+ Nova tarefa livre</Btn>
      </div>

      <Card>
        {avulsas.length === 0
          ? <EmptyState icon="⚡" title="Nenhuma tarefa livre" sub="Demandas avulsas e pontuais aparecem aqui" action={<Btn variant="primary" onClick={() => setModal(true)}>+ Nova tarefa livre</Btn>} />
          : avulsas.map(av => (
            <div key={av.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 16px', borderBottom:'1px solid #F8FAFC' }}>
              <button onClick={() => update.mutate({ id:av.id, status: av.status==='concluida'?'aberta':'concluida' })}
                style={{ width:18, height:18, borderRadius:4, border:`2px solid ${av.status==='concluida'?'#22C55E':'#CBD5E1'}`, background: av.status==='concluida'?'#22C55E':'transparent', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                {av.status==='concluida' && <span style={{ color:'#fff', fontSize:10 }}>✓</span>}
              </button>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:12, fontWeight:600, color: av.status==='concluida'?'#94A3B8':'#0F172A', textDecoration: av.status==='concluida'?'line-through':'none' }}>{av.titulo}</div>
                <div style={{ fontSize:10, color:'#94A3B8', marginTop:2, display:'flex', gap:8 }}>
                  {av.clientes && <span>🏢 {av.clientes.fantasia||av.clientes.razao_social}</span>}
                  {av.prazo && <span>📅 {fmt(av.prazo)}</span>}
                  {av.is_agendamento && <span style={{ color:'#0E7490', fontWeight:600 }}>🏦 {av.agend_forma?.toUpperCase()} {av.agend_valor?`R$ ${Number(av.agend_valor).toLocaleString('pt-BR')}`:''}</span>}
                </div>
              </div>
              <Badge label={av.prioridade} color={av.prioridade==='alta'?'red':av.prioridade==='media'?'yellow':'green'} />
              {av.status !== 'concluida' && (
                <Btn small onClick={() => {
                  const cl = clients.find(c=>c.id===av.cliente_id)
                  startTimer(av.id, av.titulo, av.cliente_id, cl?.fantasia||cl?.razao_social||'')
                }}>▶</Btn>
              )}
            </div>
          ))
        }
      </Card>

      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:16 }}>
          <div style={{ background:'#fff', borderRadius:16, width:'100%', maxWidth:500, maxHeight:'90vh', overflow:'auto', padding:24 }}>
            <div style={{ fontWeight:700, fontSize:15, marginBottom:16 }}>Nova tarefa livre</div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <div><label style={{ fontSize:10, fontWeight:700, color:'#94A3B8', display:'block', marginBottom:4, textTransform:'uppercase', letterSpacing:'.07em' }}>Título *</label>
                <input style={fi} value={form.titulo||''} onChange={e=>setForm(f=>({...f,titulo:e.target.value}))} placeholder="Descreva a tarefa..." /></div>
              <div><label style={{ fontSize:10, fontWeight:700, color:'#94A3B8', display:'block', marginBottom:4, textTransform:'uppercase', letterSpacing:'.07em' }}>Cliente</label>
                <select style={fi} value={form.cliente_id||''} onChange={e=>setForm(f=>({...f,cliente_id:e.target.value||null}))}>
                  <option value="">— Sem cliente —</option>
                  {clients.map(c=><option key={c.id} value={c.id}>{c.razao_social}</option>)}
                </select></div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                <div><label style={{ fontSize:10, fontWeight:700, color:'#94A3B8', display:'block', marginBottom:4, textTransform:'uppercase', letterSpacing:'.07em' }}>Prazo</label>
                  <input type="date" style={fi} value={form.prazo||''} onChange={e=>setForm(f=>({...f,prazo:e.target.value||null}))} /></div>
                <div><label style={{ fontSize:10, fontWeight:700, color:'#94A3B8', display:'block', marginBottom:4, textTransform:'uppercase', letterSpacing:'.07em' }}>Prioridade</label>
                  <select style={fi} value={form.prioridade||'media'} onChange={e=>setForm(f=>({...f,prioridade:e.target.value}))}>
                    <option value="alta">🔴 Alta</option><option value="media">🟡 Média</option><option value="baixa">🟢 Baixa</option>
                  </select></div>
              </div>
              <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:12, fontWeight:600, color:'#334155' }}>
                <input type="checkbox" checked={isAgend} onChange={e=>setIsAgend(e.target.checked)} style={{ width:14, height:14, accentColor:'#6366F1' }} />
                Este é um pagamento avulso para agendamento bancário
              </label>
              {isAgend && (
                <div style={{ background:'#ECFEFF', border:'1px solid #A5F3FC', borderRadius:8, padding:12 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:'#0E7490', marginBottom:8 }}>🏦 Agendamento bancário</div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                    <div><label style={{ fontSize:10, fontWeight:700, color:'#94A3B8', display:'block', marginBottom:4, textTransform:'uppercase', letterSpacing:'.07em' }}>Agendar para</label>
                      <select style={fi} value={form.agend_dia||''} onChange={e=>setForm(f=>({...f,agend_dia:e.target.value}))}>
                        <option value="">Próximo agendamento</option>
                        {DIAS_AG.map(d=><option key={d.value} value={d.value}>{d.label}</option>)}
                      </select></div>
                    <div><label style={{ fontSize:10, fontWeight:700, color:'#94A3B8', display:'block', marginBottom:4, textTransform:'uppercase', letterSpacing:'.07em' }}>Forma</label>
                      <select style={fi} value={form.agend_forma||'pix'} onChange={e=>setForm(f=>({...f,agend_forma:e.target.value}))}>
                        {FORMAS.map(d=><option key={d.value} value={d.value}>{d.label}</option>)}
                      </select></div>
                  </div>
                  <div style={{ marginTop:8 }}><label style={{ fontSize:10, fontWeight:700, color:'#94A3B8', display:'block', marginBottom:4, textTransform:'uppercase', letterSpacing:'.07em' }}>Valor (R$)</label>
                    <input type="number" style={fi} value={form.agend_valor||''} onChange={e=>setForm(f=>({...f,agend_valor:e.target.value}))} placeholder="0,00" step="0.01" /></div>
                </div>
              )}
            </div>
            <div style={{ display:'flex', gap:8, marginTop:16, justifyContent:'flex-end' }}>
              <Btn onClick={() => { setModal(false); setForm({ prioridade:'media', status:'aberta' }); setIsAgend(false) }}>Cancelar</Btn>
              <Btn variant="primary" disabled={create.isPending} onClick={() => {
                if (!form.titulo) return alert('Título obrigatório')
                create.mutate({ ...form, is_agendamento:isAgend })
              }}>{create.isPending?'Salvando…':'Salvar'}</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
