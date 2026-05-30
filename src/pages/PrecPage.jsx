import { useState } from 'react'
import { Card, CardHeader, KpiCard } from '../components/ui'

const SERVICOS = [
  { id:'cp', nome:'Contas a Pagar', preco:150 },
  { id:'cr', nome:'Contas a Receber', preco:150 },
  { id:'nf', nome:'Emissão de NF', preco:100 },
  { id:'conc', nome:'Conciliação Bancária', preco:200 },
  { id:'dre', nome:'DRE Gerencial', preco:300 },
  { id:'fluxo', nome:'Fluxo de Caixa', preco:200 },
  { id:'reun', nome:'Reunião Estratégica Mensal', preco:250 },
  { id:'cobranca', nome:'Gestão de Cobrança', preco:180 },
]

export default function PrecPage() {
  const [selecionados, setSelecionados] = useState({ cp:true, cr:true, conc:true, dre:true })
  const [markup, setMarkup] = useState(30)
  const [customNome, setCustomNome] = useState('')
  const [customPreco, setCustomPreco] = useState('')

  const subtotal = SERVICOS.filter(s=>selecionados[s.id]).reduce((a,s)=>a+s.preco,0)
  const total = Math.round(subtotal * (1 + markup/100))

  return (
    <div style={{ maxWidth:700 }}>
      <div style={{ fontSize:13, color:'#64748B', marginBottom:16 }}>Monte o pacote de serviços e calcule o valor da proposta</div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:16 }}>
        <Card>
          <CardHeader title="Selecione os serviços" icon="📋" />
          <div style={{ padding:'8px 0' }}>
            {SERVICOS.map(s => (
              <label key={s.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 16px', cursor:'pointer', borderBottom:'1px solid #F8FAFC' }}
                onMouseEnter={e=>e.currentTarget.style.background='#F8FAFC'} onMouseLeave={e=>e.currentTarget.style.background=''}>
                <input type="checkbox" checked={!!selecionados[s.id]} onChange={e=>setSelecionados(p=>({...p,[s.id]:e.target.checked}))} style={{ width:14, height:14, accentColor:'#6366F1' }} />
                <span style={{ flex:1, fontSize:12, color:'#334155' }}>{s.nome}</span>
                <span style={{ fontSize:11, fontWeight:600, color:'#64748B', fontFamily:'monospace' }}>R$ {s.preco}</span>
              </label>
            ))}
            <div style={{ padding:'10px 16px', borderTop:'1px solid #E2E8F0', display:'flex', gap:10, alignItems:'center' }}>
              <input value={customNome} onChange={e=>setCustomNome(e.target.value)} placeholder="Serviço personalizado..."
                style={{ flex:1, padding:'6px 8px', border:'1px solid #E2E8F0', borderRadius:6, fontSize:11, fontFamily:'inherit' }} />
              <input type="number" value={customPreco} onChange={e=>setCustomPreco(e.target.value)} placeholder="R$"
                style={{ width:70, padding:'6px 8px', border:'1px solid #E2E8F0', borderRadius:6, fontSize:11, fontFamily:'inherit' }} />
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Resumo da proposta" icon="💰" />
          <div style={{ padding:16 }}>
            <div style={{ marginBottom:16 }}>
              <label style={{ fontSize:10, fontWeight:700, color:'#94A3B8', display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:'.07em' }}>Markup (%)</label>
              <input type="range" min={0} max={100} value={markup} onChange={e=>setMarkup(+e.target.value)} style={{ width:'100%', accentColor:'#6366F1' }} />
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'#94A3B8' }}><span>0%</span><span style={{ fontWeight:700, color:'#6366F1' }}>{markup}%</span><span>100%</span></div>
            </div>
            <div style={{ borderTop:'1px solid #F1F5F9', paddingTop:12 }}>
              {SERVICOS.filter(s=>selecionados[s.id]).map(s => (
                <div key={s.id} style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'#64748B', marginBottom:4 }}>
                  <span>{s.nome}</span><span style={{ fontFamily:'monospace' }}>R$ {s.preco}</span>
                </div>
              ))}
              {customNome && customPreco && (
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'#64748B', marginBottom:4 }}>
                  <span>{customNome}</span><span style={{ fontFamily:'monospace' }}>R$ {customPreco}</span>
                </div>
              )}
              <div style={{ borderTop:'1px solid #E2E8F0', marginTop:8, paddingTop:8 }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'#64748B', marginBottom:4 }}>
                  <span>Subtotal</span><span style={{ fontFamily:'monospace' }}>R$ {subtotal.toLocaleString('pt-BR')}</span>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'#64748B', marginBottom:8 }}>
                  <span>Markup ({markup}%)</span><span style={{ fontFamily:'monospace' }}>R$ {(subtotal*markup/100).toLocaleString('pt-BR')}</span>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:15, fontWeight:800, color:'#0F172A' }}>
                  <span>Total mensal</span>
                  <span style={{ fontFamily:'monospace', color:'#6366F1' }}>R$ {total.toLocaleString('pt-BR')}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
