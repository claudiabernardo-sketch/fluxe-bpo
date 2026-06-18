import { useAprovacoes, useUpdateAprovacao, useClients } from '../hooks/useData'
import { Card, CardHeader, Loader, EmptyState, Btn, Badge, fmt, fmtR } from '../components/ui'
import { useAuthStore } from '../store/authStore'

const ST_COLOR = { pendente:'yellow', aprovando:'blue', aprovado:'green', rejeitado:'red', pago:'purple' }
const ST_LABEL = { pendente:'Pendente', aprovando:'Em aprovação', aprovado:'Aprovado', rejeitado:'Rejeitado', pago:'Pago' }

export default function AprovPage() {
  const { data: aprov = [], isLoading } = useAprovacoes()
  const update = useUpdateAprovacao()
  const { temPermissao } = useAuthStore()
  const canApprove = temPermissao('aprov_pagar')

  if (isLoading) return <Loader />

  const total = aprov.reduce((a,p)=>a+p.valor,0)
  const pendTotal = aprov.filter(p=>p.status==='pendente').reduce((a,p)=>a+p.valor,0)

  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10, marginBottom:16 }}>
        {Object.entries(ST_LABEL).map(([st,lb])=>{
          const items = aprov.filter(a=>a.status===st)
          return (
            <div key={st} style={{ background:'#fff', border:'1px solid #E2E8F0', borderRadius:10, padding:'10px 14px' }}>
              <div style={{ fontSize:10, color:'#94A3B8', marginBottom:4, textTransform:'uppercase', letterSpacing:'.06em' }}>{lb}</div>
              <div style={{ fontSize:20, fontWeight:800, color:'#0F172A' }}>{items.length}</div>
              <div style={{ fontSize:10, color:'#64748B' }}>{fmtR(items.reduce((a,p)=>a+p.valor,0))}</div>
            </div>
          )
        })}
      </div>

      <Card>
        <CardHeader title="Aprovações de pagamento" icon="💸" />
        {aprov.length === 0
          ? <EmptyState icon="💰" title="Nenhuma aprovação pendente" sub="Aprovações aparecem aqui quando uma tarefa de Contas a Pagar é enviada para aprovação" />
          : aprov.map(a => (
            <div key={a.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', borderBottom:'1px solid #F8FAFC' }}>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                  <span style={{ fontSize:15, fontWeight:800, color:'#0F172A' }}>{fmtR(a.valor)}</span>
                  <Badge label={ST_LABEL[a.status]} color={ST_COLOR[a.status]} />
                </div>
                <div style={{ fontSize:11, color:'#334155', marginBottom:2 }}>{a.descricao}</div>
                <div style={{ fontSize:10, color:'#94A3B8', display:'flex', gap:8 }}>
                  <span>🏢 {a.clientes?.razao_social||'—'}</span>
                  <span>📅 {fmt(a.criado_em)}</span>
                </div>
              </div>
              {canApprove && (
                <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                  {a.status === 'pendente' && (
                    <Btn small variant="primary" onClick={() => update.mutate({ id:a.id, status:'aprovando' })}>Enviar aprovação</Btn>
                  )}
                  {a.status === 'aprovando' && (
                    <>
                      <Btn small variant="success" onClick={() => update.mutate({ id:a.id, status:'aprovado' })}>✓ Aprovar</Btn>
                      <Btn small variant="danger" onClick={() => update.mutate({ id:a.id, status:'rejeitado' })}>✗ Rejeitar</Btn>
                    </>
                  )}
                  {a.status === 'aprovado' && (
                    <Btn small variant="primary" onClick={() => update.mutate({ id:a.id, status:'pago' })}>Marcar pago</Btn>
                  )}
                </div>
              )}
            </div>
          ))
        }
      </Card>
    </div>
  )
}
