import { useState, useMemo, useRef } from 'react'
import { usePops, useSalvarPop, useExcluirPop, useTarefaModelos } from '../hooks/useData'
import { Card, Btn, Loader } from '../components/ui'
import PopViewer from '../components/ui/PopViewer'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'

// Quem cria/edita/exclui POP. Os outros perfis só leem (a RLS da
// MIGRATION_48_POPS.sql aplica a mesma regra no banco).
const PERFIS_EDITAM_POP = new Set(['admin', 'gestor', 'supervisor'])
const TAMANHO_MAX_MB = 20

const EMPTY_FORM = { titulo:'', categoria:'', conteudo:'', tipoAnexo:'nenhum', url:'', arquivo_path:null, arquivo_nome:null }

const fi = { width:'100%', padding:'8px 10px', borderRadius:8, border:'1px solid #E2E8F0', fontSize:13, boxSizing:'border-box', fontFamily:'inherit' }
const lbl = { fontSize:11, fontWeight:700, color:'#64748B', display:'block', marginBottom:4, textTransform:'uppercase' }

// Busca sem diferenciar acento nem maiúscula ("conciliacao" acha "Conciliação")
const normalizar = s => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export default function PopsPage() {
  const { profile, empresa } = useAuthStore()
  const podeEditar = PERFIS_EDITAM_POP.has(profile?.perfil) || profile?.perfil == null
  const { data: pops = [], isLoading, error } = usePops()
  const { data: modelos = [] } = useTarefaModelos()
  const salvarPop = useSalvarPop()
  const excluirPop = useExcluirPop()

  const [busca, setBusca] = useState('')
  const [vendo, setVendo] = useState(null)
  const [modal, setModal] = useState(null) // 'new' | 'edit'
  const [form, setForm] = useState(EMPTY_FORM)
  const [arquivo, setArquivo] = useState(null)
  const [salvando, setSalvando] = useState(false)
  const fileRef = useRef(null)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const categorias = useMemo(() => [...new Set(pops.map(p => p.categoria).filter(Boolean))].sort(), [pops])

  const grupos = useMemo(() => {
    const termo = normalizar(busca.trim())
    const filtrados = termo
      ? pops.filter(p => normalizar(`${p.titulo} ${p.categoria} ${p.conteudo}`).includes(termo))
      : pops
    const mapa = new Map()
    for (const p of filtrados) {
      const cat = p.categoria || 'Sem categoria'
      if (!mapa.has(cat)) mapa.set(cat, [])
      mapa.get(cat).push(p)
    }
    return [...mapa.entries()].sort(([a], [b]) => a === 'Sem categoria' ? 1 : b === 'Sem categoria' ? -1 : a.localeCompare(b))
  }, [pops, busca])

  // Quantos modelos usam cada POP, pra mostrar no card
  const modelosPorPop = useMemo(() => {
    const m = {}
    for (const mod of modelos) if (mod.pop_id) m[mod.pop_id] = (m[mod.pop_id] || 0) + 1
    return m
  }, [modelos])

  function abrirNovo() { setForm(EMPTY_FORM); setArquivo(null); setModal('new') }
  function abrirEditar(p) {
    setForm({
      titulo: p.titulo, categoria: p.categoria || '', conteudo: p.conteudo || '',
      tipoAnexo: p.url ? 'link' : p.arquivo_path ? 'arquivo' : 'nenhum',
      url: p.url || '', arquivo_path: p.arquivo_path, arquivo_nome: p.arquivo_nome, _id: p.id,
    })
    setArquivo(null); setVendo(null); setModal('edit')
  }

  function escolherArquivo(e) {
    const f = e.target.files?.[0]
    if (!f) return
    if (f.size > TAMANHO_MAX_MB * 1024 * 1024) {
      alert(`Arquivo maior que ${TAMANHO_MAX_MB} MB. Para vídeos, prefira colar o link do YouTube ou do Google Drive.`)
      e.target.value = ''
      return
    }
    setArquivo(f)
  }

  async function salvar() {
    if (!form.titulo.trim()) return alert('Informe o título do POP.')
    let url = null, arquivo_path = null, arquivo_nome = null
    if (form.tipoAnexo === 'link') {
      url = form.url.trim()
      if (!url) return alert('Cole o link do POP ou escolha "Sem anexo".')
      if (!/^https?:\/\//i.test(url)) url = 'https://' + url
    }
    if (form.tipoAnexo === 'arquivo') {
      if (!arquivo && !form.arquivo_path) return alert('Escolha o arquivo ou mude para "Sem anexo".')
      arquivo_path = form.arquivo_path; arquivo_nome = form.arquivo_nome
    }
    setSalvando(true)
    try {
      if (form.tipoAnexo === 'arquivo' && arquivo) {
        const nomeLimpo = arquivo.name.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w.-]+/g, '_')
        const path = `${empresa.id}/pops/${Date.now()}-${nomeLimpo}`
        const { error: upErr } = await supabase.storage.from('tarefas').upload(path, arquivo, { upsert:false, cacheControl:'3600' })
        if (upErr) throw new Error('Erro ao enviar o arquivo: ' + upErr.message)
        arquivo_path = path; arquivo_nome = arquivo.name
      }
      await salvarPop.mutateAsync({
        id: form._id,
        titulo: form.titulo.trim(),
        categoria: form.categoria.trim() || null,
        conteudo: form.conteudo.trim() || null,
        url, arquivo_path, arquivo_nome,
      })
      setModal(null)
    } catch (err) {
      alert('Erro ao salvar POP: ' + err.message)
    } finally {
      setSalvando(false)
    }
  }

  async function excluir(p) {
    const usos = modelosPorPop[p.id]
    const aviso = usos ? `\n\nEle está vinculado a ${usos} modelo${usos > 1 ? 's' : ''}, que vão ficar sem POP.` : ''
    if (!confirm(`Excluir o POP "${p.titulo}"?${aviso}`)) return
    try {
      await excluirPop.mutateAsync(p.id)
      // Solta o vínculo nos modelos, senão a tarefa mostraria "Ver POP" de um POP excluído
      if (usos) await supabase.from('tarefa_modelos').update({ pop_id: null }).eq('pop_id', p.id)
      setVendo(null)
    } catch (err) { alert('Erro ao excluir: ' + err.message) }
  }

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      <div style={{ fontSize: 12, color: 'var(--tx3)', marginBottom: 16 }}>
        Os procedimentos do seu escritório num lugar só. Vincule um POP a um Modelo e a tarefa gerada mostra o botão "Ver POP" pra quem vai executar.
      </div>

      <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' }}>
        <div style={{ flex:1, minWidth:220, position:'relative' }}>
          <i className="fa-solid fa-magnifying-glass" style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#94A3B8', fontSize:12 }} />
          <input style={{ ...fi, paddingLeft:32, background:'#fff' }} value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar POP por título, categoria ou texto…" />
        </div>
        {podeEditar && <Btn variant="primary" onClick={abrirNovo}>+ Novo POP</Btn>}
      </div>

      {isLoading ? <Loader /> : error ? (
        <Card><div style={{ padding:20, fontSize:12, color:'#991B1B' }}>
          Não foi possível carregar os POPs ({error.message}). Se a área acabou de ser criada, falta rodar a MIGRATION_48_POPS.sql no Supabase.
        </div></Card>
      ) : pops.length === 0 ? (
        <Card><div style={{ padding:32, textAlign:'center' }}>
          <div style={{ fontSize:32, marginBottom:8 }}>📘</div>
          <div style={{ fontSize:14, fontWeight:700, color:'var(--tx)', marginBottom:4 }}>Nenhum POP cadastrado ainda</div>
          <div style={{ fontSize:12, color:'var(--tx3)', marginBottom:14 }}>
            Comece pelos processos que mais geram dúvida na equipe, como conciliação bancária ou contas a pagar.
          </div>
          {podeEditar && <Btn variant="primary" onClick={abrirNovo}>+ Cadastrar o primeiro POP</Btn>}
        </div></Card>
      ) : grupos.length === 0 ? (
        <Card><div style={{ padding:20, textAlign:'center', fontSize:12, color:'var(--tx3)' }}>Nenhum POP encontrado para "{busca}".</div></Card>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {grupos.map(([cat, itens]) => (
            <div key={cat}>
              <div style={{ fontSize:11, fontWeight:700, color:'var(--tx2)', textTransform:'uppercase', marginBottom:6 }}>{cat} <span style={{ color:'var(--tx3)', fontWeight:500 }}>({itens.length})</span></div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {itens.map(p => (
                  <div key={p.id} onClick={() => setVendo(p)} style={{
                    background:'#fff', border:'1px solid var(--bo)', borderRadius:10, padding:'12px 14px', display:'flex', gap:12, alignItems:'center', cursor:'pointer',
                  }}>
                    <div style={{ fontSize:18 }}>📘</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:14, fontWeight:600, color:'#4F46E5' }}>{p.titulo}</div>
                      {p.conteudo && <div style={{ fontSize:12, color:'var(--tx2)', marginTop:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.conteudo.replace(/\s+/g, ' ')}</div>}
                    </div>
                    {modelosPorPop[p.id] > 0 && (
                      <span title="Modelos que usam este POP" style={{ fontSize:10, fontWeight:600, color:'#92400E', background:'#FFFBEB', border:'1px solid #FDE68A', borderRadius:99, padding:'2px 8px', whiteSpace:'nowrap' }}>
                        🔁 {modelosPorPop[p.id]} modelo{modelosPorPop[p.id] > 1 ? 's' : ''}
                      </span>
                    )}
                    {(p.url || p.arquivo_path) && <span title={p.url ? 'Tem link' : 'Tem arquivo'} style={{ fontSize:14 }}>{p.url ? '🔗' : '📎'}</span>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {vendo && (
        <PopViewer pop={vendo} onClose={() => setVendo(null)} acoes={podeEditar && <>
          <Btn small variant="danger" onClick={() => excluir(vendo)}>Excluir</Btn>
          <Btn small variant="primary" onClick={() => abrirEditar(vendo)}>✎ Editar</Btn>
        </>} />
      )}

      {(modal === 'new' || modal === 'edit') && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.45)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div style={{ background:'#fff', borderRadius:14, width:'100%', maxWidth:620, maxHeight:'90vh', overflowY:'auto', padding:24 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
              <div style={{ fontSize:16, fontWeight:700 }}>{modal === 'new' ? 'Novo POP' : 'Editar POP'}</div>
              <button onClick={() => setModal(null)} style={{ background:'none', border:'none', fontSize:18, cursor:'pointer', color:'#64748B' }}>×</button>
            </div>

            <div style={{ marginBottom:12 }}>
              <label style={lbl}>Título *</label>
              <input style={fi} value={form.titulo} onChange={e => set('titulo', e.target.value)} placeholder="Ex: Conciliação bancária diária" />
            </div>

            <div style={{ marginBottom:12 }}>
              <label style={lbl}>Categoria</label>
              <input style={fi} list="pops-categorias" value={form.categoria} onChange={e => set('categoria', e.target.value)} placeholder="Ex: Contas a pagar, Conciliação, Fechamento" />
              <datalist id="pops-categorias">{categorias.map(c => <option key={c} value={c} />)}</datalist>
            </div>

            <div style={{ marginBottom:12 }}>
              <label style={lbl}>Passo a passo</label>
              <textarea style={{ ...fi, minHeight:180, resize:'vertical', lineHeight:1.5 }} value={form.conteudo} onChange={e => set('conteudo', e.target.value)}
                placeholder={'1. Acessar o internet banking do cliente\n2. Baixar o extrato do dia anterior\n3. Conferir cada lançamento com o sistema\n4. Anotar as divergências na tarefa'} />
            </div>

            <div style={{ marginBottom:12 }}>
              <label style={lbl}>Anexo (opcional)</label>
              <div style={{ display:'flex', gap:6, marginBottom:8, flexWrap:'wrap' }}>
                {[['nenhum','Sem anexo'],['link','🔗 Link (vídeo, Drive, doc)'],['arquivo','📎 Arquivo (PDF, planilha)']].map(([v, l]) => (
                  <button key={v} type="button" onClick={() => set('tipoAnexo', v)} style={{
                    fontSize:12, padding:'6px 10px', borderRadius:8, cursor:'pointer', fontWeight:600, fontFamily:'inherit',
                    border: form.tipoAnexo === v ? '1px solid #6366F1' : '1px solid #E2E8F0',
                    background: form.tipoAnexo === v ? '#EEF2FF' : '#fff', color: form.tipoAnexo === v ? '#4338CA' : '#475569',
                  }}>{l}</button>
                ))}
              </div>
              {form.tipoAnexo === 'link' && (
                <input style={fi} value={form.url} onChange={e => set('url', e.target.value)} placeholder="https://youtu.be/… ou https://drive.google.com/…" />
              )}
              {form.tipoAnexo === 'arquivo' && (
                <div>
                  <input ref={fileRef} type="file" onChange={escolherArquivo} style={{ display:'none' }}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.txt" />
                  <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                    <Btn small onClick={() => fileRef.current?.click()}>{arquivo || form.arquivo_path ? 'Trocar arquivo' : 'Escolher arquivo'}</Btn>
                    <span style={{ fontSize:12, color:'#475569', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {arquivo?.name || form.arquivo_nome || 'Nenhum arquivo escolhido'}
                    </span>
                  </div>
                  <div style={{ fontSize:11, color:'#94A3B8', marginTop:6 }}>Até {TAMANHO_MAX_MB} MB. Para vídeo, use a opção Link (YouTube não listado ou Google Drive).</div>
                </div>
              )}
            </div>

            <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:18 }}>
              <Btn onClick={() => setModal(null)}>Cancelar</Btn>
              <Btn variant="primary" onClick={salvar} disabled={salvando}>{salvando ? 'Salvando…' : 'Salvar POP'}</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
