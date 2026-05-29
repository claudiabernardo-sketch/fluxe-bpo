import { useLeads, useCreateLead, useUpdateLead } from '../hooks/useData'
import { Card, Loader, EmptyState, Badge, Btn, fmtR } from '../components/ui'
import { useState } from 'react'

const ETAPAS = [
  { id:'novo', label:'Lead novo', color:'#94A3B8' },
  { id:'contato', label:'Contato', color:'#8B5CF6' },
  { id:'diagnostico', label:'Diagnóstico', color:'#06B6D4' },
  { id:'proposta', label:'Proposta', color:'#F59E0B' },
  { id:'fechado', label:'Fechado', color:'#22C55E' },
  { id:'perdido', label:'Perdido', color:'#EF4444' },
]

export default function CRMPage() {
  const { data: leads = [], isLoading } = useLeads()
  const create = useCreateLead()
  const update = useUpdateLead()
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({})

  if (isLoading) return <Loader />

  const totalPrev = leads.filter(l=>l.etapa!=='perdido').reduce((a,l)=>a+(l.valor_estimado||0),0)

  async function save() {
    if (!form.nome) return
    await create.mutateAsync({ nome:form.nome, contato:form.contato||'', whatsapp:form.whatsapp||'', segmento:form.segmento||'', etapa:'novo', valor_estimado:parseFloat(form.valor_estimado)||0 })
    setModal(false); setForm({})
  }

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
        <div style={{ fontSize:12, color:'#64748B' }}>Receita prevista: <strong style={{ color:'#15803D' }}>{fmtR(totalPrev)}</strong></div>
        <div style={{ flex:1 }} />
        <Btn variant="primary" onClick={()=>{ setForm({}); setModal(true) }}>+ Novo lead</Btn>
      </div>

      {/* Pipeline */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:10, overflowX:'auto' }}>
        {ETAPAS.map(et => {
          const etLeads = leads.filter(l => l.etapa === et.id)
          return (
            <div key={et.id} style={{ background:'#F8FAFC', borderRadius:10, border:'1px solid #E2E8F0' }}>
              <div style={{ padding:'8px 10px', borderBottom:'1px solid #E2E8F0', display:'flex', alignItems:'center', gap:6 }}>
                <div style={{ width:8, height:8, borderRadius:'50%', background:et.color }} />
                <span style={{ fontSize:10, fontWeight:700, color:'#334155', flex:1 }}>{et.label}</span>
                <span style={{ fontSize:9, background:'#E2E8F0', color:'#475569', padding:'1px 5px', borderRadius:99 }}>{etLeads.length}</span>
              </div>
              <div style={{ padding:6, display:'flex', flexDirection:'column', gap:6, minHeight:80 }}>
                {etLeads.map(l => (
                  <div key={l.id} style={{ background:'#fff', borderRadius:8, padding:'8px 10px', border:'1px solid #E2E8F0', fontSize:11 }}>
                    <div style={{ fontWeight:600, color:'#0F172A', marginBottom:2 }}>{l.nome}</div>
                    {l.segmento && <div style={{ color:'#94A3B8', fontSize:10 }}>{l.segmento}</div>}
                    {l.valor_estimado > 0 && <div style={{ color:'#15803D', fontWeight:600, fontSize:10, marginTop:4 }}>{fmtR(l.valor_estimado)}/mês</div>}
                    <div style={{ display:'flex', gap:4, marginTop:6 }}>
                      {et.id !== 'fechado' && et.id !== 'perdido' && (
                        <button onClick={() => {
                          const nextIdx = ETAPAS.findIndex(e=>e.id===et.id) + 1
                          if (nextIdx < ETAPAS.length) update.mutate({ id:l.id, etapa:ETAPAS[nextIdx].id })
                        }} style={{ fontSize:9, padding:'2px 6px', border:'1px solid #E2E8F0', borderRadius:5, cursor:'pointer', background:'#fff', color:'#475569' }}>
                          Avançar →
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
          <div style={{ background:'#fff', borderRadius:16, width:440, padding:24 }}>
            <div style={{ fontWeight:700, fontSize:15, marginBottom:16 }}>Novo lead</div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {[['nome','Nome / Empresa *'],['contato','Contato'],['whatsapp','WhatsApp'],['segmento','Segmento']].map(([k,l])=>(
                <div key={k}>
                  <label style={{ fontSize:10, fontWeight:700, color:'#94A3B8', display:'block', marginBottom:4, textTransform:'uppercase', letterSpacing:'.07em' }}>{l}</label>
                  <input value={form[k]||''} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))}
                    style={{ width:'100%', padding:'7px 10px', border:'1px solid #E2E8F0', borderRadius:8, fontSize:12, fontFamily:'inherit' }} />
                </div>
              ))}
              <div>
                <label style={{ fontSize:10, fontWeight:700, color:'#94A3B8', display:'block', marginBottom:4, textTransform:'uppercase', letterSpacing:'.07em' }}>MRR estimado (R$)</label>
                <input type="number" value={form.valor_estimado||''} onChange={e=>setForm(f=>({...f,valor_estimado:e.target.value}))}
                  style={{ width:'100%', padding:'7px 10px', border:'1px solid #E2E8F0', borderRadius:8, fontSize:12, fontFamily:'inherit' }} />
              </div>
            </div>
            <div style={{ display:'flex', gap:8, marginTop:16, justifyContent:'flex-end' }}>
              <Btn onClick={()=>setModal(false)}>Cancelar</Btn>
              <Btn variant="primary" onClick={save} disabled={create.isPending}>Salvar</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
