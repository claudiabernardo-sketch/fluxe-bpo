import { useState, useRef, useEffect } from 'react'
import { useClients } from '../hooks/useData'
import { useAuthStore } from '../store/authStore'
import { Card, Btn, Badge, Loader, EmptyState, fmt } from '../components/ui'
import { useTimerStore } from '../components/layout/TimerBar'
import { supabase } from '../lib/supabase'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// Uma tarefa avulsa "repetida" vira N linhas na tabela, criadas de uma vez só,
// uma por mês a partir da data de início — não é uma rotina permanente (isso
// já existe em Modelos), é uma série finita com começo e fim conhecidos.
function addMonths(dateStr, n) {
  if (!dateStr) return null
  const d = new Date(dateStr + 'T12:00:00')
  d.setMonth(d.getMonth() + n)
  return d.toISOString().slice(0, 10)
}

// Quantos meses cabem entre início e fim, incluindo os dois — 01/08 a 01/10 = 3
function monthsBetween(startStr, endStr) {
  if (!startStr || !endStr) return 0
  const a = new Date(startStr + 'T12:00:00')
  const b = new Date(endStr + 'T12:00:00')
  return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth()) + 1
}

export default function AvulsasPage() {
  const { data: clients = [] } = useClients()
  const { empresa } = useAuthStore()
  const qc = useQueryClient()
  const startTimer = useTimerStore(s => s.start)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ prioridade:'media', status:'aberta' })
  const [isAgend, setIsAgend] = useState(false)
  const [recorrencia, setRecorrencia] = useState(false)
  const [dataFim, setDataFim] = useState('')

  const { data: avulsas = [], isLoading } = useQuery({
    queryKey: ['avulsas', empresa?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('tarefas_avulsas')
        .select('*, clientes(razao_social,fantasia)')
        .eq('empresa_id', empresa?.id)
        .order('criado_em', { ascending:false })
      if (error) throw error
      return data ?? []
    },
    enabled: !!empresa?.id,
  })

  function resetForm() {
    setModal(false)
    setForm({ prioridade:'media', status:'aberta' })
    setIsAgend(false)
    setRecorrencia(false)
    setDataFim('')
  }

  const vezesCalc = recorrencia ? monthsBetween(form.prazo, dataFim) : 0
  const vezesClamp = Math.max(2, Math.min(24, vezesCalc || 0))

  const create = useMutation({
    mutationFn: async (av) => {
      const { data, error } = await supabase.from('tarefas_avulsas')
        .insert({ ...av, empresa_id: empresa?.id }).select()
      if (error) throw error
      return data?.[0]
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey:['avulsas'] }); resetForm() },
    onError: (err) => alert('Erro ao criar tarefa: ' + err.message),
  })

  // Cria as N parcelas de uma vez só (1 requisição), cada uma um mês depois da anterior
  const createBatch = useMutation({
    mutationFn: async ({ av, vezes }) => {
      const grupoId = crypto.randomUUID()
      const rows = Array.from({ length: vezes }, (_, i) => ({
        ...av,
        empresa_id: empresa?.id,
        titulo: `${av.titulo} (${i+1}/${vezes})`,
        prazo: addMonths(av.prazo, i),
        recorrencia_grupo_id: grupoId,
        lote_atual: i + 1,
        lote_total: vezes,
      }))
      const { data, error } = await supabase.from('tarefas_avulsas').insert(rows).select()
      if (error) throw error
      return data
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey:['avulsas'] }); resetForm() },
    onError: (err) => alert('Erro ao criar as parcelas: ' + err.message),
  })

  const update = useMutation({
    mutationFn: async ({ id, ...data }) => {
      const { error } = await supabase.from('tarefas_avulsas').update(data).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey:['avulsas'] }),
    onError: (err) => alert('Erro ao atualizar tarefa: ' + err.message),
  })

  const remove = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('tarefas_avulsas').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey:['avulsas'] }); setPainel(null); setEdit(null) },
    onError: (err) => alert('Erro ao excluir tarefa: ' + err.message),
  })

  // ── Painel lateral (abrir/editar uma tarefa avulsa) ───────────────────────
  const [painel, setPainel] = useState(null) // avulsa completa, ou null = fechado
  const [edit, setEdit] = useState(null)     // cópia local, editável, do painel aberto

  function abrirPainel(av) {
    setPainel(av)
    setEdit({ ...av })
  }
  function fecharPainel() {
    setPainel(null)
    setEdit(null)
  }

  useEffect(() => {
    if (!painel) return
    function onKey(e) { if (e.key === 'Escape') fecharPainel() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [painel])

  const serieIrmas = painel?.recorrencia_grupo_id
    ? avulsas.filter(a => a.recorrencia_grupo_id === painel.recorrencia_grupo_id && a.id !== painel.id)
        .sort((a,b) => (a.lote_atual||0) - (b.lote_atual||0))
    : []

  // ── Anexos (mesmo bucket "tarefas" já usado na tela de Tarefas, cada avulsa
  // na sua própria pasta — sem precisar de tabela nem permissão nova) ────────
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)
  const empresaId = empresa?.id || 'shared'
  const anexoFolder = painel ? `${empresaId}/avulsa-${painel.id}` : null

  const { data: anexos = [] } = useQuery({
    queryKey: ['anexos-avulsa', painel?.id, empresaId],
    queryFn: async () => {
      if (!anexoFolder) return []
      const { data, error } = await supabase.storage.from('tarefas')
        .list(anexoFolder, { limit:100, sortBy:{ column:'created_at', order:'desc' } })
      if (error) { console.error('storage list:', error.message); return [] }
      return (data || []).map(f => ({
        nome: f.name,
        url: supabase.storage.from('tarefas').getPublicUrl(`${anexoFolder}/${f.name}`).data.publicUrl,
        criado_em: f.created_at,
      }))
    },
    enabled: !!painel,
  })

  async function uploadAnexo(file) {
    if (!anexoFolder || !file) return
    setUploading(true)
    try {
      const path = `${anexoFolder}/${Date.now()}-${file.name}`
      const { error } = await supabase.storage.from('tarefas').upload(path, file, { upsert:false, cacheControl:'3600' })
      if (error) { alert('Erro no upload: ' + error.message); return }
      qc.invalidateQueries({ queryKey:['anexos-avulsa', painel?.id] })
    } catch (e) {
      alert('Erro ao enviar: ' + (e.message || 'erro desconhecido'))
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function deleteAnexo(nome) {
    if (!confirm('Excluir anexo?')) return
    const { error } = await supabase.storage.from('tarefas').remove([`${anexoFolder}/${nome}`])
    if (error) alert('Erro ao excluir: ' + error.message)
    else qc.invalidateQueries({ queryKey:['anexos-avulsa', painel?.id] })
  }

  const DIAS_AG = [ {value:'proxima_segunda',label:'Próxima segunda'},{value:'proxima_terca',label:'Próxima terça'},{value:'proxima_quarta',label:'Próxima quarta'},{value:'proxima_quinta',label:'Próxima quinta'},{value:'proxima_sexta',label:'Próxima sexta'},{value:'urgente',label:'Urgente — hoje'} ]
  const FORMAS = [ {value:'pix',label:'PIX'},{value:'ted',label:'TED'},{value:'boleto',label:'Boleto'},{value:'cartao',label:'Cartão'} ]

  const fi = { width:'100%', padding:'7px 10px', border:'1px solid #E2E8F0', borderRadius:8, fontSize:12, fontFamily:'inherit', background:'#fff' }
  const lbl = { fontSize:10, fontWeight:700, color:'#94A3B8', display:'block', marginBottom:4, textTransform:'uppercase', letterSpacing:'.07em' }

  if (isLoading) return <Loader />

  const salvando = create.isPending || createBatch.isPending

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:16 }}>
        <Btn variant="primary" onClick={() => setModal(true)}>+ Nova tarefa livre</Btn>
      </div>

      <Card>
        {avulsas.length === 0
          ? <EmptyState icon="⚡" title="Nenhuma tarefa livre" sub="Demandas avulsas e pontuais aparecem aqui" action={<Btn variant="primary" onClick={() => setModal(true)}>+ Nova tarefa livre</Btn>} />
          : avulsas.map(av => (
            <div key={av.id} onClick={() => abrirPainel(av)}
              style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 16px', borderBottom:'1px solid #F8FAFC', cursor:'pointer' }}
              onMouseEnter={e=>e.currentTarget.style.background='#FAFAFA'} onMouseLeave={e=>e.currentTarget.style.background=''}>
              <button onClick={e => { e.stopPropagation(); update.mutate({ id:av.id, status: av.status==='concluida'?'aberta':'concluida' }) }}
                style={{ width:18, height:18, borderRadius:4, border:`2px solid ${av.status==='concluida'?'#22C55E':'#CBD5E1'}`, background: av.status==='concluida'?'#22C55E':'transparent', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                {av.status==='concluida' && <span style={{ color:'#fff', fontSize:10 }}>✓</span>}
              </button>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:12, fontWeight:600, color: av.status==='concluida'?'#94A3B8':'#0F172A', textDecoration: av.status==='concluida'?'line-through':'none' }}>{av.titulo}</div>
                <div style={{ fontSize:10, color:'#94A3B8', marginTop:2, display:'flex', gap:8, flexWrap:'wrap' }}>
                  {av.clientes && <span>🏢 {av.clientes.fantasia||av.clientes.razao_social}</span>}
                  {av.prazo && <span>📅 {fmt(av.prazo)}</span>}
                  {av.is_agendamento && <span style={{ color:'#0E7490', fontWeight:600 }}>🏦 {av.agend_forma?.toUpperCase()} {av.agend_valor?`R$ ${Number(av.agend_valor).toLocaleString('pt-BR')}`:''}</span>}
                  {av.lote_total && <span style={{ color:'#7C3AED', fontWeight:600 }}>📦 {av.lote_atual}/{av.lote_total}</span>}
                </div>
              </div>
              <Badge label={av.prioridade} color={av.prioridade==='alta'?'red':av.prioridade==='media'?'yellow':'green'} />
              <Btn small onClick={e => { e.stopPropagation(); abrirPainel(av) }}>📎</Btn>
              {av.status !== 'concluida' && (
                <Btn small onClick={e => {
                  e.stopPropagation()
                  const cl = clients.find(c=>c.id===av.cliente_id)
                  startTimer(av.id, av.titulo, av.cliente_id, cl?.fantasia||cl?.razao_social||'')
                }}>▶</Btn>
              )}
            </div>
          ))
        }
      </Card>

      {/* ── Modal: nova tarefa livre ─────────────────────────────────────────── */}
      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:16 }}>
          <div style={{ background:'#fff', borderRadius:16, width:'100%', maxWidth:500, maxHeight:'90vh', overflow:'auto', padding:24 }}>
            <div style={{ fontWeight:700, fontSize:15, marginBottom:16 }}>Nova tarefa livre</div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <div><label style={lbl}>Título *</label>
                <input style={fi} value={form.titulo||''} onChange={e=>setForm(f=>({...f,titulo:e.target.value}))} placeholder="Descreva a tarefa..." /></div>
              <div><label style={lbl}>Cliente</label>
                <select style={fi} value={form.cliente_id||''} onChange={e=>setForm(f=>({...f,cliente_id:e.target.value||null}))}>
                  <option value="">— Sem cliente —</option>
                  {clients.map(c=><option key={c.id} value={c.id}>{c.razao_social}</option>)}
                </select></div>
              <div><label style={lbl}>Observações</label>
                <textarea style={{ ...fi, minHeight:60, resize:'vertical' }} value={form.obs||''} onChange={e=>setForm(f=>({...f,obs:e.target.value}))} placeholder="Detalhes do lote, contexto, o que ainda falta..." /></div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                <div><label style={lbl}>{recorrencia ? 'Data de início' : 'Prazo'}</label>
                  <input type="date" style={fi} value={form.prazo||''} onChange={e=>setForm(f=>({...f,prazo:e.target.value||null}))} /></div>
                <div><label style={lbl}>Prioridade</label>
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
                    <div><label style={lbl}>Agendar para</label>
                      <select style={fi} value={form.agend_dia||''} onChange={e=>setForm(f=>({...f,agend_dia:e.target.value}))}>
                        <option value="">Próximo agendamento</option>
                        {DIAS_AG.map(d=><option key={d.value} value={d.value}>{d.label}</option>)}
                      </select></div>
                    <div><label style={lbl}>Forma</label>
                      <select style={fi} value={form.agend_forma||'pix'} onChange={e=>setForm(f=>({...f,agend_forma:e.target.value}))}>
                        {FORMAS.map(d=><option key={d.value} value={d.value}>{d.label}</option>)}
                      </select></div>
                  </div>
                  <div style={{ marginTop:8 }}><label style={lbl}>Valor (R$)</label>
                    <input type="number" style={fi} value={form.agend_valor||''} onChange={e=>setForm(f=>({...f,agend_valor:e.target.value}))} placeholder="0,00" step="0.01" /></div>
                </div>
              )}
              <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:12, fontWeight:600, color:'#334155' }}>
                <input type="checkbox" checked={recorrencia} onChange={e=>setRecorrencia(e.target.checked)} style={{ width:14, height:14, accentColor:'#7C3AED' }} />
                Repetir mensalmente (gera várias tarefas, uma por mês)
              </label>
              {recorrencia && (
                <div style={{ background:'#F5F3FF', border:'1px solid #DDD6FE', borderRadius:8, padding:12 }}>
                  <label style={lbl}>Data de término</label>
                  <input type="date" style={fi} value={dataFim} onChange={e=>setDataFim(e.target.value)} />
                  <div style={{ fontSize:10, marginTop:6, color: vezesCalc>=2 ? '#7C3AED' : '#EF4444' }}>
                    {!form.prazo || !dataFim
                      ? 'Escolha a data de início (acima) e a data de término.'
                      : vezesCalc < 2
                        ? 'A data de término precisa ser pelo menos 1 mês depois da data de início.'
                        : `Cria ${vezesClamp} tarefas, uma por mês de ${fmt(form.prazo)} até ${fmt(dataFim)} — cada uma numerada "(1/${vezesClamp})", "(2/${vezesClamp})" etc.`}
                  </div>
                </div>
              )}
            </div>
            <div style={{ display:'flex', gap:8, marginTop:16, justifyContent:'flex-end' }}>
              <Btn onClick={resetForm}>Cancelar</Btn>
              <Btn variant="primary" disabled={salvando || (recorrencia && vezesCalc < 2)} onClick={() => {
                if (!form.titulo) return alert('Título obrigatório')
                const payload = { ...form, is_agendamento:isAgend, agend_valor: form.agend_valor ? parseFloat(form.agend_valor) : null }
                if (recorrencia) createBatch.mutate({ av: payload, vezes: vezesClamp })
                else create.mutate(payload)
              }}>{salvando?'Salvando…':'Salvar'}</Btn>
            </div>
          </div>
        </div>
      )}

      {/* ── Painel lateral: ver/editar tarefa avulsa ─────────────────────────── */}
      <div style={{
        position:'fixed', inset:0, zIndex:1200,
        background: painel ? 'rgba(15,23,42,.4)' : 'rgba(15,23,42,0)',
        pointerEvents: painel ? 'auto' : 'none',
        transition:'background .2s',
      }} onClick={fecharPainel}>
        <div style={{
          position:'absolute', top:0, right:0, bottom:0, width:460, maxWidth:'92vw',
          background:'#fff', boxShadow:'-8px 0 40px rgba(0,0,0,.18)',
          display:'flex', flexDirection:'column',
          transform: painel ? 'translateX(0)' : 'translateX(100%)',
          transition:'transform .22s ease',
        }} onClick={e => e.stopPropagation()}>
          {edit && (
            <>
              <div style={{ padding:'16px 20px', borderBottom:'1px solid #E2E8F0', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
                <div style={{ fontWeight:700, fontSize:14, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{painel.titulo}</div>
                <button onClick={fecharPainel} style={{ border:'none', background:'none', cursor:'pointer', fontSize:22, color:'#94A3B8', flexShrink:0, marginLeft:8 }}>×</button>
              </div>

              <div style={{ flex:1, overflow:'auto', padding:'16px 20px' }}>
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  <div><label style={lbl}>Título</label>
                    <input style={fi} value={edit.titulo||''} onChange={e=>setEdit(f=>({...f,titulo:e.target.value}))} /></div>
                  <div><label style={lbl}>Cliente</label>
                    <select style={fi} value={edit.cliente_id||''} onChange={e=>setEdit(f=>({...f,cliente_id:e.target.value||null}))}>
                      <option value="">— Sem cliente —</option>
                      {clients.map(c=><option key={c.id} value={c.id}>{c.razao_social}</option>)}
                    </select></div>
                  <div><label style={lbl}>Observações</label>
                    <textarea style={{ ...fi, minHeight:60, resize:'vertical' }} value={edit.obs||''} onChange={e=>setEdit(f=>({...f,obs:e.target.value}))} /></div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                    <div><label style={lbl}>Prazo</label>
                      <input type="date" style={fi} value={edit.prazo||''} onChange={e=>setEdit(f=>({...f,prazo:e.target.value||null}))} /></div>
                    <div><label style={lbl}>Prioridade</label>
                      <select style={fi} value={edit.prioridade||'media'} onChange={e=>setEdit(f=>({...f,prioridade:e.target.value}))}>
                        <option value="alta">🔴 Alta</option><option value="media">🟡 Média</option><option value="baixa">🟢 Baixa</option>
                      </select></div>
                  </div>
                  <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:12, fontWeight:600, color:'#334155' }}>
                    <input type="checkbox" checked={!!edit.is_agendamento} onChange={e=>setEdit(f=>({...f,is_agendamento:e.target.checked}))} style={{ width:14, height:14, accentColor:'#6366F1' }} />
                    Pagamento avulso para agendamento bancário
                  </label>
                  {edit.is_agendamento && (
                    <div style={{ background:'#ECFEFF', border:'1px solid #A5F3FC', borderRadius:8, padding:12 }}>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                        <div><label style={lbl}>Agendar para</label>
                          <select style={fi} value={edit.agend_dia||''} onChange={e=>setEdit(f=>({...f,agend_dia:e.target.value}))}>
                            <option value="">Próximo agendamento</option>
                            {DIAS_AG.map(d=><option key={d.value} value={d.value}>{d.label}</option>)}
                          </select></div>
                        <div><label style={lbl}>Forma</label>
                          <select style={fi} value={edit.agend_forma||'pix'} onChange={e=>setEdit(f=>({...f,agend_forma:e.target.value}))}>
                            {FORMAS.map(d=><option key={d.value} value={d.value}>{d.label}</option>)}
                          </select></div>
                      </div>
                      <div style={{ marginTop:8 }}><label style={lbl}>Valor (R$)</label>
                        <input type="number" style={fi} value={edit.agend_valor||''} onChange={e=>setEdit(f=>({...f,agend_valor:e.target.value}))} step="0.01" /></div>
                    </div>
                  )}
                </div>

                {painel.lote_total && (
                  <div style={{ marginTop:20 }}>
                    <div style={{ ...lbl, marginBottom:8 }}>📦 Parte {painel.lote_atual} de {painel.lote_total} — outras partes da série</div>
                    {/* somente leitura — editar aqui NÃO propaga para as demais parcelas */}
                    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                      {serieIrmas.map(s => (
                        <div key={s.id} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 10px', background:'#FAFAFA', borderRadius:8, fontSize:11 }}>
                          <span style={{ color:'#7C3AED', fontWeight:700, flexShrink:0 }}>{s.lote_atual}/{s.lote_total}</span>
                          <span style={{ flex:1, color: s.status==='concluida'?'#94A3B8':'#334155', textDecoration: s.status==='concluida'?'line-through':'none', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.titulo}</span>
                          {s.prazo && <span style={{ color:'#94A3B8', flexShrink:0 }}>{fmt(s.prazo)}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ marginTop:20 }}>
                  <div style={{ ...lbl, marginBottom:8 }}>📎 Anexos</div>
                  <input ref={fileInputRef} type="file" id="avulsa-anexo-input" style={{ display:'none' }}
                    onChange={e => { if (e.target.files[0]) uploadAnexo(e.target.files[0]) }} />
                  <label htmlFor="avulsa-anexo-input"
                    style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:10, borderRadius:8, border:'2px dashed #CBD5E1', background:'#fff', cursor:'pointer', fontSize:12, fontWeight:600, color:'#64748B', marginBottom:8 }}>
                    {uploading ? '⏳ Enviando...' : '📎 Clique para anexar arquivo'}
                  </label>
                  {anexos.length === 0
                    ? <div style={{ padding:'12px 0', textAlign:'center', color:'#94A3B8', fontSize:11 }}>Nenhum anexo</div>
                    : anexos.map(a => {
                      const ext = a.nome?.split('.').pop()?.toLowerCase()
                      const icon = ['pdf'].includes(ext)?'📄':['jpg','jpeg','png','gif','webp'].includes(ext)?'🖼️':['xlsx','xls','csv'].includes(ext)?'📊':['docx','doc'].includes(ext)?'📝':'📎'
                      return (
                        <div key={a.nome} style={{ padding:'8px 4px', borderBottom:'1px solid #F0F0F0', display:'flex', alignItems:'center', gap:8 }}>
                          <span style={{ fontSize:20, flexShrink:0 }}>{icon}</span>
                          <div style={{ flex:1, minWidth:0 }}>
                            <a href={a.url} target="_blank" rel="noreferrer"
                              style={{ fontSize:11, fontWeight:600, color:'#6366F1', textDecoration:'none', display:'block', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                              {a.nome}
                            </a>
                            {a.criado_em && (
                              <div style={{ fontSize:9, color:'#94A3B8', marginTop:1 }}>
                                {new Date(a.criado_em).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}
                              </div>
                            )}
                          </div>
                          <button onClick={() => deleteAnexo(a.nome)}
                            style={{ border:'none', background:'none', cursor:'pointer', color:'#CBD5E1', fontSize:14, padding:'2px 4px', flexShrink:0 }}
                            title="Excluir anexo">×</button>
                        </div>
                      )
                    })
                  }
                </div>
              </div>

              <div style={{ padding:'14px 20px', borderTop:'1px solid #E2E8F0', display:'flex', justifyContent:'space-between', flexShrink:0 }}>
                <Btn variant="danger" style={{ borderColor:'#FECDD3', background:'#FEF2F2', color:'#DC2626' }} onClick={() => {
                  if (confirm('Excluir esta tarefa avulsa? Essa ação não pode ser desfeita.')) remove.mutate(painel.id)
                }}>Excluir</Btn>
                <div style={{ display:'flex', gap:8 }}>
                  <Btn onClick={fecharPainel}>Fechar</Btn>
                  <Btn variant="primary" disabled={update.isPending} onClick={() => {
                    const { id, clientes, ...data } = edit
                    update.mutate({ id, ...data }, { onSuccess: fecharPainel })
                  }}>{update.isPending ? 'Salvando…' : 'Salvar'}</Btn>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
