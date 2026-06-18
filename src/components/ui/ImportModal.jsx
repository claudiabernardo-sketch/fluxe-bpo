import { useState, useRef } from 'react'
import { importFromXlsx } from '../../utils/excel'
import { Btn } from './index'

// ── ImportModal ────────────────────────────────────────────────────────
// Props:
//   open: boolean
//   onClose: () => void
//   onImport: (rows) => Promise<void>  — rows já mapeados
//   mapRow: (rawRow) => object          — função de mapeamento
//   previewCols: [{ label, key }]       — colunas para a tabela de prévia
//   downloadTemplate: () => void        — baixa arquivo modelo
//   title: string
export default function ImportModal({ open, onClose, onImport, mapRow, previewCols, downloadTemplate, title = 'Importar dados' }) {
  const [preview, setPreview] = useState(null)     // rows mapeados
  const [rawCount, setRawCount] = useState(0)
  const [errors, setErrors] = useState([])          // linhas com problema
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const fileRef = useRef()

  if (!open) return null

  function reset() {
    setPreview(null); setRawCount(0); setErrors([]); setDone(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  function handleClose() { reset(); onClose() }

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const rawRows = await importFromXlsx(file)
      setRawCount(rawRows.length)
      const mapped = []
      const errs = []
      rawRows.forEach((row, i) => {
        try {
          const obj = mapRow(row)
          // null = linha de comentário ou vazia — ignora silenciosamente
          if (obj === null || obj === undefined) return
          // Valida campos obrigatórios: titulo ou razao_social
          if (!obj.titulo && !obj.razao_social) {
            errs.push(`Linha ${i + 2}: campo obrigatório ausente (Título ou Razão Social)`)
          } else {
            mapped.push(obj)
          }
        } catch {
          errs.push(`Linha ${i + 2}: erro ao processar`)
        }
      })
      setPreview(mapped)
      setErrors(errs)
    } catch {
      setErrors(['Erro ao ler o arquivo. Verifique se é um .xlsx ou .csv válido.'])
    }
  }

  async function handleConfirm() {
    if (!preview?.length) return
    setLoading(true)
    try {
      await onImport(preview)
      setDone(true)
    } catch (e) {
      setErrors([e.message || 'Erro ao importar'])
    } finally {
      setLoading(false)
    }
  }

  const fi = { width:'100%', padding:'8px 10px', border:'1px solid #E2E8F0', borderRadius:8, fontSize:12, fontFamily:'inherit', background:'#fff', marginTop:6 }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(15,23,42,0.5)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div style={{ background:'#fff', borderRadius:16, padding:28, width:'100%', maxWidth:680, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 20px 60px rgba(0,0,0,0.2)' }}>

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <div style={{ fontWeight:700, fontSize:16, color:'#0F172A' }}>📥 {title}</div>
          <button onClick={handleClose} style={{ border:'none', background:'none', fontSize:20, cursor:'pointer', color:'#94A3B8' }}>×</button>
        </div>

        {done ? (
          <div style={{ textAlign:'center', padding:'32px 0' }}>
            <div style={{ fontSize:48, marginBottom:12 }}>✅</div>
            <div style={{ fontWeight:700, fontSize:16, color:'#15803D' }}>{preview.length} registros importados com sucesso!</div>
            <div style={{ marginTop:20 }}>
              <Btn variant="primary" onClick={handleClose}>Fechar</Btn>
            </div>
          </div>
        ) : (
          <>
            {/* Passo 1 — Baixar modelo */}
            <div style={{ background:'#F8FAFC', borderRadius:10, padding:14, marginBottom:16 }}>
              <div style={{ fontSize:12, fontWeight:700, color:'#475569', marginBottom:6 }}>📋 Passo 1 — Baixe o modelo de planilha</div>
              <p style={{ fontSize:12, color:'#64748B', margin:'0 0 10px' }}>
                Preencha o arquivo modelo e salve como <strong>.xlsx</strong> ou <strong>.csv</strong>. Não altere os cabeçalhos.
              </p>
              <button
                onClick={downloadTemplate}
                style={{ padding:'7px 14px', borderRadius:8, border:'1px solid #CBD5E1', background:'#fff', cursor:'pointer', fontSize:12, fontWeight:600, color:'#334155' }}
              >
                ⬇ Baixar modelo .xlsx
              </button>
            </div>

            {/* Passo 2 — Upload */}
            <div style={{ background:'#F8FAFC', borderRadius:10, padding:14, marginBottom:16 }}>
              <div style={{ fontSize:12, fontWeight:700, color:'#475569', marginBottom:6 }}>📂 Passo 2 — Selecione o arquivo preenchido</div>
              <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} style={fi} />
            </div>

            {/* Erros */}
            {errors.length > 0 && (
              <div style={{ background:'#FEF2F2', border:'1px solid #FECDD3', borderRadius:10, padding:14, marginBottom:14 }}>
                <div style={{ fontWeight:700, fontSize:12, color:'#991B1B', marginBottom:6 }}>⚠ Problemas encontrados:</div>
                {errors.map((e, i) => <div key={i} style={{ fontSize:11, color:'#B91C1C' }}>{e}</div>)}
              </div>
            )}

            {/* Prévia */}
            {preview && preview.length > 0 && (
              <div style={{ marginBottom:16 }}>
                <div style={{ fontSize:12, fontWeight:700, color:'#475569', marginBottom:8 }}>
                  👁 Prévia — {preview.length} de {rawCount} linhas válidas
                </div>
                <div style={{ overflowX:'auto', border:'1px solid #E2E8F0', borderRadius:10 }}>
                  <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
                    <thead>
                      <tr style={{ background:'#F8FAFC' }}>
                        {previewCols.map(c => (
                          <th key={c.key} style={{ padding:'8px 12px', textAlign:'left', fontWeight:600, color:'#64748B', borderBottom:'1px solid #E2E8F0', whiteSpace:'nowrap' }}>
                            {c.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.slice(0, 6).map((row, i) => (
                        <tr key={i} style={{ borderBottom:'1px solid #F1F5F9' }}>
                          {previewCols.map(c => (
                            <td key={c.key} style={{ padding:'7px 12px', color:'#334155', maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                              {String(row[c.key] ?? '')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {preview.length > 6 && (
                  <div style={{ fontSize:11, color:'#94A3B8', marginTop:6, textAlign:'center' }}>
                    … e mais {preview.length - 6} linha(s) não exibida(s)
                  </div>
                )}
              </div>
            )}

            {/* Botões */}
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <Btn onClick={handleClose}>Cancelar</Btn>
              {preview?.length > 0 && (
                <Btn variant="primary" onClick={handleConfirm} disabled={loading}>
                  {loading ? 'Importando...' : `✓ Importar ${preview.length} registros`}
                </Btn>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
