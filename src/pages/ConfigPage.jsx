import { useState, useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { supabase } from '../lib/supabase'
import { Card, CardHeader, Btn } from '../components/ui'

const DIAS = [ {value:'segunda',label:'Segunda-feira'}, {value:'terca',label:'Terça-feira'}, {value:'quarta',label:'Quarta-feira'}, {value:'quinta',label:'Quinta-feira'}, {value:'sexta',label:'Sexta-feira'} ]

export default function ConfigPage() {
  const { empresa, profile } = useAuthStore()
  const [cfg, setCfg] = useState({ agendamentoDia:'terca', agendamentoFreq:'semanal', fechamentoDia:5, reuniaoDia:10, aprovacaoLimite:2000, nfDia:1, custoHora:35 })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (empresa?.config) {
      try { setCfg(c => ({ ...c, ...empresa.config })) } catch{}
    }
  }, [empresa])

  async function save() {
    if (!empresa) return
    await supabase.from('empresas').update({ config: cfg }).eq('id', empresa.id)
    setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  function F({label, id, children}) {
    return (
      <div>
        <label style={{ fontSize:10, fontWeight:700, color:'#94A3B8', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'.07em' }}>{label}</label>
        {children}
      </div>
    )
  }

  const selStyle = { width:'100%', padding:'7px 10px', border:'1px solid #E2E8F0', borderRadius:8, fontSize:12, background:'#fff' }
  const inpStyle = { width:'100%', padding:'7px 10px', border:'1px solid #E2E8F0', borderRadius:8, fontSize:12, fontFamily:'inherit' }

  return (
    <div style={{ maxWidth:700 }}>
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:14, fontWeight:700, color:'#0F172A' }}>Configurações operacionais</div>
        <div style={{ fontSize:12, color:'#64748B', marginTop:2 }}>
          Empresa: <strong>{empresa?.nome||'—'}</strong> · Plano: <strong>{empresa?.plano||'—'}</strong>
        </div>
      </div>

      <Card style={{ marginBottom:14 }}>
        <CardHeader title="Agendamento bancário" icon="🏦" />
        <div style={{ padding:16, display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <F label="Dia fixo de agendamento">
            <select style={selStyle} value={cfg.agendamentoDia} onChange={e=>setCfg(c=>({...c,agendamentoDia:e.target.value}))}>
              {DIAS.map(d=><option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </F>
          <F label="Frequência">
            <select style={selStyle} value={cfg.agendamentoFreq} onChange={e=>setCfg(c=>({...c,agendamentoFreq:e.target.value}))}>
              <option value="semanal">Semanal</option>
              <option value="quinzenal">Quinzenal</option>
              <option value="mensal">Mensal</option>
            </select>
          </F>
        </div>
      </Card>

      <Card style={{ marginBottom:14 }}>
        <CardHeader title="Calendário mensal" icon="📅" />
        <div style={{ padding:16, display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
          <F label="Início fechamento (dia)">
            <input type="number" style={inpStyle} value={cfg.fechamentoDia} min={1} max={10} onChange={e=>setCfg(c=>({...c,fechamentoDia:+e.target.value}))} />
          </F>
          <F label="Emissão NFs (dia)">
            <input type="number" style={inpStyle} value={cfg.nfDia} min={1} max={28} onChange={e=>setCfg(c=>({...c,nfDia:+e.target.value}))} />
          </F>
          <F label="Reunião mensal (dia)">
            <input type="number" style={inpStyle} value={cfg.reuniaoDia} min={1} max={28} onChange={e=>setCfg(c=>({...c,reuniaoDia:+e.target.value}))} />
          </F>
        </div>
      </Card>

      <Card style={{ marginBottom:14 }}>
        <CardHeader title="Financeiro" icon="💰" />
        <div style={{ padding:16, display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <F label="Custo-hora da equipe (R$)">
            <input type="number" style={inpStyle} value={cfg.custoHora} min={1} onChange={e=>setCfg(c=>({...c,custoHora:+e.target.value}))} />
          </F>
          <F label="Valor mínimo para aprovação (R$)">
            <input type="number" style={inpStyle} value={cfg.aprovacaoLimite} min={0} onChange={e=>setCfg(c=>({...c,aprovacaoLimite:+e.target.value}))} />
          </F>
        </div>
      </Card>

      <div style={{ display:'flex', justifyContent:'flex-end', gap:8 }}>
        <Btn variant="primary" onClick={save}>
          {saved ? '✓ Salvo!' : 'Salvar configurações'}
        </Btn>
      </div>
    </div>
  )
}
