const fs = require('fs')
let c = fs.readFileSync('src/pages/ModelosPage.jsx', 'utf8')

c = c.replace(
  "return (\n    <div style={{ maxWidth: 900, margin: '0 auto' }}>",
  `return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* MODAL GERAÇÃO */}
      {geracaoModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div style={{ background:'#fff', borderRadius:14, width:'100%', maxWidth:520, padding:28 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <div style={{ fontSize:17, fontWeight:700, color:'#0F172A' }}>Gerar tarefas do mes</div>
              <button onClick={() => { setGeracaoModal(false); setGeracaoLog([]) }} style={{ background:'none', border:'none', fontSize:20, cursor:'pointer', color:'#64748B' }}>x</button>
            </div>
            <div style={{ background:'#F0FDF4', border:'1px solid #BBF7D0', borderRadius:8, padding:'10px 14px', marginBottom:16, fontSize:12, color:'#15803D' }}>
              O sistema gera uma tarefa por modelo para cada cliente. Para Conciliacao Bancaria, gera uma tarefa por banco cadastrado no cliente.
            </div>
            <div style={{ marginBottom:16 }}>
              <label style={{ fontSize:11, fontWeight:700, color:'#64748B', display:'block', marginBottom:6, textTransform:'uppercase' }}>Mes de geracao</label>
              <input type="month" value={mesGeracao} onChange={e => setMesGeracao(e.target.value)}
                style={{ width:'100%', padding:'9px 12px', border:'1px solid #E2E8F0', borderRadius:8, fontSize:14, fontFamily:'inherit' }} />
            </div>
            {geracaoLog.length > 0 && (
              <div style={{ background:'#F8FAFC', border:'1px solid #E2E8F0', borderRadius:8, padding:14, marginBottom:16, maxHeight:200, overflowY:'auto' }}>
                {geracaoLog.map((l, i) => (
                  <div key={i} style={{ fontSize:11, padding:'2px 0', fontWeight: l.startsWith('Total') ? 700 : 400, color: l.startsWith('Erro') ? '#991B1B' : l.startsWith('ja gerado') ? '#92400E' : '#334155' }}>{l}</div>
                ))}
              </div>
            )}
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button onClick={() => { setGeracaoModal(false); setGeracaoLog([]) }}
                style={{ padding:'9px 20px', borderRadius:8, border:'1px solid #E2E8F0', background:'#fff', cursor:'pointer', fontSize:13, fontWeight:500 }}>Fechar</button>
              <button onClick={gerarMes} disabled={gerando}
                style={{ padding:'9px 20px', borderRadius:8, border:'none', background: gerando ? '#94A3B8' : '#6366F1', color:'#fff', cursor: gerando ? 'not-allowed' : 'pointer', fontSize:13, fontWeight:600 }}>
                {gerando ? 'Gerando...' : 'Gerar tarefas'}
              </button>
            </div>
          </div>
        </div>
      )}`
)

fs.writeFileSync('src/pages/ModelosPage.jsx', c)
console.log('OK3')
console.log('modal:', c.includes('MODAL GERAÇÃO') || c.includes('geracaoModal &&'))