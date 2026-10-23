import { useState } from 'react'
import { supabase } from '../../lib/supabase'

// Abre o anexo de um POP: link externo direto, ou arquivo do bucket "tarefas"
// via URL assinada (vale 1h), pra não depender do bucket ser público.
export async function abrirAnexoPop(pop) {
  if (pop.url) { window.open(pop.url, '_blank', 'noopener,noreferrer'); return }
  if (!pop.arquivo_path) return
  // Abre a aba antes do await: navegador bloqueia popup aberto depois de esperar.
  const aba = window.open('', '_blank')
  const { data, error } = await supabase.storage.from('tarefas').createSignedUrl(pop.arquivo_path, 3600)
  if (error || !data?.signedUrl) {
    aba?.close()
    alert('Não foi possível abrir o arquivo: ' + (error?.message || 'erro desconhecido'))
    return
  }
  if (aba) aba.location.href = data.signedUrl
  else window.open(data.signedUrl, '_blank', 'noopener,noreferrer')
}

// Leitura completa de um POP em modal. Usado na página POPs e no detalhe da
// tarefa (botão "Ver POP"). `acoes` são botões extras (Editar/Excluir).
export default function PopViewer({ pop, onClose, acoes }) {
  const [abrindo, setAbrindo] = useState(false)
  if (!pop) return null
  const temAnexo = !!(pop.url || pop.arquivo_path)

  async function abrir() {
    setAbrindo(true)
    try { await abrirAnexoPop(pop) } finally { setAbrindo(false) }
  }

  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.45)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background:'#fff', borderRadius:14, width:'100%', maxWidth:640, maxHeight:'90vh', overflowY:'auto', padding:24 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12, marginBottom:4 }}>
          <div>
            {pop.categoria && <div style={{ fontSize:10, fontWeight:700, color:'#6366F1', textTransform:'uppercase', marginBottom:4 }}>{pop.categoria}</div>}
            <div style={{ fontSize:17, fontWeight:700, color:'#0F172A', lineHeight:1.3 }}>📘 {pop.titulo}</div>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', fontSize:20, cursor:'pointer', color:'#64748B', lineHeight:1 }}>×</button>
        </div>
        {pop.atualizado_em && (
          <div style={{ fontSize:11, color:'#94A3B8', marginBottom:14 }}>
            Atualizado em {new Date(pop.atualizado_em).toLocaleDateString('pt-BR')}
          </div>
        )}

        {pop.conteudo
          ? <div style={{ fontSize:13, color:'#1E293B', whiteSpace:'pre-wrap', lineHeight:1.6, background:'#F8FAFC', border:'1px solid #E2E8F0', borderRadius:10, padding:14 }}>{pop.conteudo}</div>
          : <div style={{ fontSize:12, color:'#94A3B8', fontStyle:'italic' }}>Sem passo a passo escrito.</div>}

        {temAnexo && (
          <button onClick={abrir} disabled={abrindo} style={{
            marginTop:14, display:'flex', alignItems:'center', gap:8, width:'100%', textAlign:'left',
            border:'1px solid #C7D2FE', background:'#EEF2FF', borderRadius:10, padding:'10px 14px', cursor:'pointer', color:'#4338CA', fontSize:13, fontWeight:600, fontFamily:'inherit',
          }}>
            <span>{pop.url ? '🔗' : '📎'}</span>
            <span style={{ flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {abrindo ? 'Abrindo…' : pop.url ? 'Abrir link do POP' : `Abrir arquivo: ${pop.arquivo_nome || 'anexo'}`}
            </span>
            <span>↗</span>
          </button>
        )}

        {acoes && <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:18 }}>{acoes}</div>}
      </div>
    </div>
  )
}
