// ── RadarPanelOverlay ────────────────────────────────────────────────────
// Painel lateral que abre o Radar de um cliente na hora, sem navegar pra
// ficha completa (Dados/Financeiro/Bancos/Cofre/Rotina/Escopo) — pra quem só
// quer dar uma olhada rápida na saúde do cliente. Montado uma vez no
// AppShell; qualquer tela pode abrir chamando useRadarPanelStore.getState().abrir(id, nome).
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRadarPanelStore } from '../../store/radarPanelStore'
import RadarPainel from './RadarPainel'

export default function RadarPanelOverlay() {
  const { clienteId, clienteNome, fechar } = useRadarPanelStore()
  const navigate = useNavigate()

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') fechar() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [fechar])

  return (
    <div style={{
      position:'fixed', inset:0, zIndex:1200,
      background: clienteId ? 'rgba(15,23,42,.4)' : 'rgba(15,23,42,0)',
      pointerEvents: clienteId ? 'auto' : 'none',
      transition:'background .2s',
    }} onClick={fechar}>
      <div style={{
        position:'absolute', top:0, right:0, bottom:0, width:520, maxWidth:'92vw',
        background:'#fff', boxShadow:'-8px 0 40px rgba(0,0,0,.18)',
        display:'flex', flexDirection:'column',
        transform: clienteId ? 'translateX(0)' : 'translateX(100%)',
        transition:'transform .22s ease',
      }} onClick={e => e.stopPropagation()}>
        {clienteId && (
          <>
            <div style={{ padding:'16px 20px', borderBottom:'1px solid #E2E8F0', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
              <div style={{ fontWeight:700, fontSize:14, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                🩺 Radar {clienteNome ? `— ${clienteNome}` : ''}
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:12, flexShrink:0, marginLeft:8 }}>
                <button
                  onClick={() => { const id = clienteId; fechar(); navigate(`/clientes/${id}?tab=radar`) }}
                  style={{ border:'none', background:'none', cursor:'pointer', fontSize:11, color:'#6366F1', fontWeight:600 }}
                >Ver ficha completa →</button>
                <button onClick={fechar} style={{ border:'none', background:'none', cursor:'pointer', fontSize:22, color:'#94A3B8' }}>×</button>
              </div>
            </div>
            <div style={{ flex:1, overflow:'auto', padding:'16px 20px' }}>
              <RadarPainel clienteId={clienteId} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
