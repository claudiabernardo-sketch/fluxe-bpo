import { useState } from 'react'
import { useClients } from '../hooks/useData'
import { Card, CardHeader, KpiCard, Loader } from '../components/ui'

export default function DrePage() {
  const { data: clients = [], isLoading } = useClients()
  const [mes, setMes] = useState('5')
  const meses = {'1':'Janeiro','2':'Fevereiro','3':'Março','4':'Abril','5':'Maio','6':'Junho','7':'Julho','8':'Agosto','9':'Setembro','10':'Outubro','11':'Novembro','12':'Dezembro'}

  if (isLoading) return <Loader />

  const mrr = clients.filter(c=>c.status==='ativo').reduce((a,c)=>a+(c.valor_mrr||0),0)
  const impostos = mrr * 0.065
  const rl = mrr - impostos
  const csp = mrr * 0.35
  const lb = rl - csp
  const despOp = mrr * 0.18
  const ebitda = lb - despOp
  const fin = ebitda * 0.02
  const ll = ebitda - fin

  const f = v => (v>=0?'':'- ') + 'R$ ' + Math.abs(v).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})
  const Row = ({label, value, type='normal', indent=false}) => {
    const styles = {
      normal: { bg:'#fff', labelColor:'#475569', valueColor: value>=0?'#0F172A':'#EF4444' },
      total:  { bg:'#F8FAFC', labelColor:'#0F172A', valueColor: value>=0?'#0F172A':'#EF4444' },
      destaque: { bg:'#EEF2FF', labelColor:'#4338CA', valueColor: '#4338CA' },
      sub: { bg:'#F8FAFC', labelColor:'#94A3B8', valueColor:'#94A3B8' },
    }
    const s = styles[type] || styles.normal
    return (
      <div style={{ display:'flex', justifyContent:'space-between', padding:`7px ${indent?28:14}px`, borderBottom:'1px solid #F1F5F9', background:s.bg }}>
        <span style={{ fontSize:12, color:s.labelColor, fontWeight: type==='destaque'||type==='total'?700:400 }}>{label}</span>
        <span style={{ fontSize:12, fontWeight:700, fontFamily:'monospace', color:s.valueColor }}>{f(value)}</span>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
        <select value={mes} onChange={e=>setMes(e.target.value)}
          style={{ padding:'7px 10px', border:'1px solid #E2E8F0', borderRadius:8, fontSize:12, background:'#fff' }}>
          {Object.entries(meses).map(([k,v])=><option key={k} value={k}>{v} 2026</option>)}
        </select>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))', gap:10, marginBottom:16 }}>
        <KpiCard label="Receita Bruta" value={`R$ ${(mrr/1000).toFixed(1)}k`} color="blue" />
        <KpiCard label="Receita Líquida" value={`R$ ${(rl/1000).toFixed(1)}k`} color="cyan" />
        <KpiCard label="Lucro Bruto" value={`R$ ${(lb/1000).toFixed(1)}k`} color={lb>0?'green':'red'} />
        <KpiCard label="EBITDA" value={`R$ ${(ebitda/1000).toFixed(1)}k`} color={ebitda>0?'green':'red'} sub={`${(ebitda/mrr*100).toFixed(1)}% margem`} />
        <KpiCard label="Lucro Líquido" value={`R$ ${(ll/1000).toFixed(1)}k`} color={ll>0?'green':'red'} sub={`${(ll/mrr*100).toFixed(1)}% margem`} />
      </div>

      <Card>
        <CardHeader title={`DRE Gerencial — ${meses[mes]} 2026`} icon="📊" />
        <Row label="Receita Bruta" value={mrr} type="normal" />
        <Row label="Mensalidades clientes" value={mrr} type="normal" indent />
        <Row label="(−) Impostos e tributos (Simples 6,5%)" value={-impostos} type="sub" />
        <Row label="= Receita Líquida" value={rl} type="total" />
        <div style={{ height:4, background:'#F8FAFC' }} />
        <Row label="(−) Custo dos Serviços Prestados (CSP)" value={-csp} type="sub" />
        <Row label="Custo de equipe operacional" value={-csp} type="normal" indent />
        <Row label="= Lucro Bruto" value={lb} type="total" />
        <Row label={`Margem bruta: ${(lb/mrr*100).toFixed(1)}%`} value={0} type="sub" indent />
        <div style={{ height:4, background:'#F8FAFC' }} />
        <Row label="(−) Despesas Operacionais" value={-despOp} type="sub" />
        <Row label="Administrativo e overhead" value={-despOp} type="normal" indent />
        <Row label="= EBITDA" value={ebitda} type="destaque" />
        <Row label={`Margem EBITDA: ${(ebitda/mrr*100).toFixed(1)}%`} value={0} type="sub" indent />
        <div style={{ height:4, background:'#F8FAFC' }} />
        <Row label="(−) Resultado financeiro" value={-fin} type="sub" />
        <Row label="= Lucro Líquido" value={ll} type="destaque" />
        <Row label={`Margem líquida: ${(ll/mrr*100).toFixed(1)}%`} value={0} type="sub" indent />
      </Card>
    </div>
  )
}
