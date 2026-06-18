const fs = require('fs')
let c = fs.readFileSync('src/pages/ClientsPage.jsx', 'utf8')

const ABA_TAREFAS = `
              {/* ABA TAREFAS — vínculos de modelos */}
              {tab === 'tarefas' && (
                <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                  {modal?.mode === 'new' ? (
                    <div style={{ padding:'28px 16px', textAlign:'center', color:'var(--tx3)', fontSize:13 }}>
                      Salve o cliente primeiro para vincular tarefas.
                    </div>
                  ) : (
                    <>
                      {/* Info */}
                      <div style={{ background:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:'var(--r)', padding:'12px 14px', fontSize:12, color:'#1D4ED8', lineHeight:1.6 }}>
                        <div style={{ fontWeight:700, marginBottom:4 }}>✅ Tarefas vinculadas</div>
                        Selecione os modelos de rotina que se aplicam a este cliente. Eles ficam registrados aqui — a geração das tarefas é feita separadamente quando você quiser.
                      </div>

                      {/* Modelos vinculados */}
                      {clienteModelos.length > 0 ? (
                        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                          <div style={{ fontSize:10, fontWeight:700, color:'var(--tx3)', textTransform:'uppercase', letterSpacing:'.07em' }}>
                            {clienteModelos.length} modelo(s) vinculado(s)
                          </div>
                          {clienteModelos.map(cm => (
                            <div key={cm.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', border:'1px solid var(--bo)', borderRadius:'var(--r)', background:'var(--s2)' }}>
                              <div style={{ flex:1 }}>
                                <div style={{ fontSize:12, fontWeight:600, color:'var(--tx)' }}>{cm.tarefa_modelos?.titulo}</div>
                                <div style={{ fontSize:10, color:'var(--tx3)', marginTop:2 }}>
                                  {cm.tarefa_modelos?.categoria} · {cm.tarefa_modelos?.recorrencia} · Prioridade {cm.tarefa_modelos?.prioridade}
                                </div>
                              </div>
                              <button onClick={() => { if(confirm('Desvincular este modelo do cliente?')) desvincularModelo.mutate({ id: cm.id, clienteId: modal?.id }) }}
                                style={{ border:'none', background:'none', cursor:'pointer', color:'var(--tx3)', fontSize:18, lineHeight:1, padding:'4px' }}>×</button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ padding:'20px', textAlign:'center', color:'var(--tx3)', fontSize:12, border:'1px dashed var(--bo)', borderRadius:'var(--r)' }}>
                          Nenhum modelo vinculado ainda.
                        </div>
                      )}

                      {/* Adicionar modelo */}
                      {!showAddModelo ? (
                        <button onClick={() => setShowAddModelo(true)}
                          style={{ padding:'9px 16px', borderRadius:'var(--r)', border:'1px dashed var(--bo)', background:'transparent', cursor:'pointer', fontSize:12, fontWeight:600, color:'var(--br)', width:'100%' }}>
                          + Vincular modelo de tarefa
                        </button>
                      ) : (
                        <div style={{ border:'1px solid var(--bo)', borderRadius:'var(--r)', padding:'14px', background:'var(--sur)' }}>
                          <div style={{ fontSize:11, fontWeight:700, color:'var(--tx3)', marginBottom:10, textTransform:'uppercase' }}>Selecionar modelo</div>
                          <div style={{ display:'flex', flexDirection:'column', gap:6, maxHeight:300, overflowY:'auto' }}>
                            {todosModelos
                              .filter(m => m.ativo && !clienteModelos.find(cm => cm.modelo_id === m.id))
                              .map(m => (
                                <div key={m.id}
                                  onClick={() => vincularModelo.mutate({ clienteId: modal?.id, modeloId: m.id })}
                                  style={{ padding:'10px 12px', border:'1px solid var(--bo)', borderRadius:'var(--r)', cursor:'pointer', background:'var(--s2)' }}
                                  onMouseEnter={e => e.currentTarget.style.background='var(--s3)'}
                                  onMouseLeave={e => e.currentTarget.style.background='var(--s2)'}>
                                  <div style={{ fontSize:12, fontWeight:600, color:'var(--tx)' }}>{m.titulo}</div>
                                  <div style={{ fontSize:10, color:'var(--tx3)', marginTop:2 }}>{m.categoria} · {m.recorrencia}</div>
                                </div>
                              ))}
                            {todosModelos.filter(m => m.ativo && !clienteModelos.find(cm => cm.modelo_id === m.id)).length === 0 && (
                              <div style={{ fontSize:12, color:'var(--tx3)', textAlign:'center', padding:'12px' }}>Todos os modelos já estão vinculados.</div>
                            )}
                          </div>
                          <button onClick={() => setShowAddModelo(false)}
                            style={{ marginTop:10, padding:'6px 14px', borderRadius:'var(--r)', border:'1px solid var(--bo)', background:'transparent', cursor:'pointer', fontSize:11, color:'var(--tx3)' }}>
                            Fechar
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
`

// Inserir antes do fechamento do modal
c = c.replace(
  '              {/* ABA ROTINA */',
  ABA_TAREFAS + '\n              {/* ABA ROTINA */'
)

fs.writeFileSync('src/pages/ClientsPage.jsx', c)
console.log('OK')
console.log('aba tarefas:', c.includes("tab === 'tarefas'"))