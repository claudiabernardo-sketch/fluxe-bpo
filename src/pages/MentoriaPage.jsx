import { useState } from 'react'
import { useMentoriaLinks, useCreateMentoriaLink, useDeleteMentoriaLink, useMeusCombinados, useAtualizarMeuCombinado, useTurmaAtualPublica, useMeuProgressoAulas, useToggleProgressoAula, useMateriaisApoioPublico } from '../hooks/useData'
import { useAuthStore } from '../store/authStore'
import { supabase } from '../lib/supabase'
import { Card, CardHeader, Btn, Loader } from '../components/ui'
import { ETAPAS_BPO } from '../data/etapasBpo'

function urlDoMaterial(l) {
  if (l.arquivo_path) return supabase.storage.from('tarefas').getPublicUrl(l.arquivo_path).data.publicUrl
  return l.url
}

function ItemMeuCombinado({ c }) {
  const atualizar = useAtualizarMeuCombinado()
  const [status, setStatus] = useState(c.status_mentorado || '')
  const hoje = new Date().toLocaleDateString('en-CA')
  const vencido = !c.concluido && c.prazo && c.prazo < hoje

  return (
    <div style={{ border: '1px solid var(--bo)', borderRadius: 10, padding: '12px 14px', opacity: c.concluido ? .6 : 1 }}>
      <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, cursor: atualizar.isPending ? 'default' : 'pointer' }}>
        <input type="checkbox" checked={c.concluido} disabled={atualizar.isPending} onChange={e => atualizar.mutate({ id: c.id, concluido: e.target.checked })} style={{ marginTop: 3 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, textDecoration: c.concluido ? 'line-through' : 'none' }}>{c.texto}</div>
          {c.prazo && (
            <div style={{ fontSize: 11, color: vencido ? '#DC2626' : 'var(--tx3)', fontWeight: vencido ? 700 : 400, marginTop: 2 }}>
              {vencido ? 'Venceu em ' : 'Prazo: '}{new Date(c.prazo + 'T12:00:00').toLocaleDateString('pt-BR')}
            </div>
          )}
        </div>
      </label>
      <div style={{ display: 'flex', gap: 6, marginTop: 8, marginLeft: 26 }}>
        <input
          style={{ flex: 1, padding: '6px 8px', border: '1px solid var(--bo)', borderRadius: 6, fontSize: 12, fontFamily: 'inherit' }}
          placeholder="Como está indo? (opcional)"
          value={status}
          onChange={e => setStatus(e.target.value)}
        />
        {status !== (c.status_mentorado || '') && (
          <Btn small variant="outline" disabled={atualizar.isPending} onClick={() => atualizar.mutate({ id: c.id, status_mentorado: status })}>
            Salvar
          </Btn>
        )}
      </div>
    </div>
  )
}

function AulaConcluidaCheck({ aula, concluida }) {
  const toggle = useToggleProgressoAula()
  return (
    <button
      onClick={() => toggle.mutate({ aula_id: aula.id, concluido: !concluida })}
      disabled={toggle.isPending}
      title={concluida ? 'Marcar como não concluída' : 'Marcar como concluída'}
      style={{
        width: 28, height: 28, borderRadius: '50%', border: 'none', flexShrink: 0, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700,
        background: concluida ? '#22C55E' : 'rgba(99,102,241,.1)', color: concluida ? '#fff' : '#6366F1',
        transition: 'all .15s',
      }}
    >
      {concluida ? <i className="fa-solid fa-check" /> : aula.numero}
    </button>
  )
}

function SecaoAulasDaTurma() {
  const { empresa } = useAuthStore()
  const { data, isLoading } = useTurmaAtualPublica()
  const { data: concluidas = new Set() } = useMeuProgressoAulas()
  const turma = data?.turma
  const aulas = data?.aulas ?? []
  const totalConcluidas = aulas.filter(a => concluidas.has(a.id)).length

  if (!empresa?.mentorado_bpo_lucrativo) return null
  if (isLoading) return null
  if (!turma) return null

  return (
    <Card style={{ marginBottom: 16 }}>
      <CardHeader title={`Aulas da Turma${turma.nome ? ` — ${turma.nome}` : ''}`} icon="fa-solid fa-video" />
      <div style={{ padding: 16 }}>
        {turma.grupo_whatsapp_url && (
          <a href={turma.grupo_whatsapp_url} target="_blank" rel="noopener noreferrer" style={{
            display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: '#fff',
            background: '#25D366', borderRadius: 10, padding: '10px 14px', fontSize: 13, fontWeight: 700, marginBottom: 14,
          }}>
            <i className="fa-brands fa-whatsapp" style={{ fontSize: 16 }} /> Entrar no grupo da turma no WhatsApp
          </a>
        )}
        {aulas.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--tx3)', fontSize: 12, padding: 20 }}>Cronograma da turma em breve.</div>
        ) : (
          <>
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--tx2)', marginBottom: 5, fontWeight: 600 }}>
                <span>Seu progresso</span>
                <span>{totalConcluidas} de {aulas.length} aulas concluídas</span>
              </div>
              <div style={{ height: 6, borderRadius: 99, background: 'var(--s2)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${aulas.length ? (totalConcluidas / aulas.length) * 100 : 0}%`, background: '#22C55E', transition: 'width .2s' }} />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {aulas.map(a => (
                <div key={a.id} style={{ border: '1px solid var(--bo)', borderRadius: 10, padding: '12px 14px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <AulaConcluidaCheck aula={a} concluida={concluidas.has(a.id)} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{a.titulo}</div>
                    {a.exercicio && <div style={{ fontSize: 12, color: 'var(--tx2)', marginTop: 2 }}>Exercício: {a.exercicio}</div>}
                    <div style={{ fontSize: 10, color: 'var(--tx3)', marginTop: 4 }}>
                      {a.data ? new Date(a.data + 'T12:00:00').toLocaleDateString('pt-BR') : 'Data a combinar'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0, flexWrap: 'wrap' }}>
                    {a.material_url && (
                      <a href={a.material_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, fontWeight: 600, color: 'var(--tx2)', textDecoration: 'none', border: '1px solid var(--bo)', borderRadius: 8, padding: '6px 12px' }}>
                        📄 Material
                      </a>
                    )}
                    {a.video_url ? (
                      <a href={a.video_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, fontWeight: 600, color: '#6366F1', textDecoration: 'none', border: '1px solid #6366F1', borderRadius: 8, padding: '6px 12px' }}>
                        ▶ Assistir
                      </a>
                    ) : (
                      !a.material_url && <span style={{ fontSize: 11, color: 'var(--tx3)' }}>Em breve</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </Card>
  )
}

function SecaoMateriaisApoio() {
  const { empresa } = useAuthStore()
  const { data: materiais = [], isLoading } = useMateriaisApoioPublico()
  const grupos = ETAPAS_BPO.map(e => ({ ...e, itens: materiais.filter(m => m.etapa === e.v) })).filter(g => g.itens.length > 0)

  if (!empresa?.mentorado_bpo_lucrativo) return null
  if (isLoading) return null
  if (grupos.length === 0) return null

  return (
    <Card style={{ marginBottom: 16 }}>
      <CardHeader title="Materiais de Apoio" icon="fa-solid fa-book-open" />
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {grupos.map(g => (
          <div key={g.v}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--tx2)', textTransform: 'uppercase', marginBottom: 6 }}>{g.label}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {g.itens.map(m => (
                <a key={m.id} href={urlDoMaterial(m)} target="_blank" rel="noopener noreferrer" style={{
                  border: '1px solid var(--bo)', borderRadius: 10, padding: '12px 14px', display: 'flex', gap: 12, alignItems: 'flex-start', textDecoration: 'none', color: 'inherit',
                }}>
                  <div style={{ fontSize: 18, marginTop: 2 }}>{m.arquivo_path ? '📎' : '🔗'}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#6366F1' }}>{m.titulo}</div>
                    {m.descricao && <div style={{ fontSize: 12, color: 'var(--tx2)', marginTop: 2 }}>{m.descricao}</div>}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--tx3)', flexShrink: 0 }}>Baixar ↓</div>
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

function SecaoMeusCombinados() {
  const { empresa } = useAuthStore()
  const { data: combinados = [], isLoading } = useMeusCombinados()

  if (!empresa?.mentorado_bpo_lucrativo) return null

  return (
    <Card style={{ marginBottom: 16 }}>
      <CardHeader title="Combinados com sua mentora" icon="fa-solid fa-list-check" />
      <div style={{ padding: 16 }}>
        {isLoading ? <Loader /> : combinados.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--tx3)', fontSize: 12, padding: 20 }}>Nenhum combinado registrado com você ainda.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {combinados.map(c => <ItemMeuCombinado key={c.id} c={c} />)}
          </div>
        )}
      </div>
    </Card>
  )
}

export default function MentoriaPage() {
  const { data: links = [], isLoading } = useMentoriaLinks()
  const criar = useCreateMentoriaLink()
  const remover = useDeleteMentoriaLink()
  const [tipo, setTipo] = useState('link') // 'link' | 'arquivo'
  const [form, setForm] = useState({ titulo: '', url: '', descricao: '' })
  const [arquivo, setArquivo] = useState(null)
  const [confirmDel, setConfirmDel] = useState(null)

  const podeSalvar = form.titulo.trim() && (tipo === 'link' ? form.url.trim() : arquivo)

  async function salvar() {
    if (!podeSalvar) return
    try {
      await criar.mutateAsync({ ...form, arquivo: tipo === 'arquivo' ? arquivo : null })
      setForm({ titulo: '', url: '', descricao: '' })
      setArquivo(null)
    } catch { /* erro já mostrado pelo onError da mutação */ }
  }

  const fi = { padding: '8px 10px', border: '1px solid var(--bo)', borderRadius: 8, fontSize: 13, fontFamily: 'inherit' }

  if (isLoading) return <Loader />

  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      <div style={{ fontSize: 12, color: 'var(--tx3)', marginBottom: 16 }}>
        Vídeos e materiais de mentoria — cole um link (YouTube, Google Drive, Canva, etc.) ou suba um arquivo direto pra sua equipe acessar.
      </div>

      <SecaoAulasDaTurma />
      <SecaoMateriaisApoio />
      <SecaoMeusCombinados />

      <Card style={{ marginBottom: 16 }}>
        <CardHeader title="Adicionar material" icon="fa-solid fa-plus" />
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => setTipo('link')} style={{ flex: 1, padding: '7px 10px', borderRadius: 8, border: tipo === 'link' ? '2px solid #6366F1' : '1px solid var(--bo)', background: tipo === 'link' ? 'rgba(99,102,241,.08)' : 'transparent', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>🔗 Link</button>
            <button onClick={() => setTipo('arquivo')} style={{ flex: 1, padding: '7px 10px', borderRadius: 8, border: tipo === 'arquivo' ? '2px solid #6366F1' : '1px solid var(--bo)', background: tipo === 'arquivo' ? 'rgba(99,102,241,.08)' : 'transparent', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>📎 Arquivo</button>
          </div>
          <input style={fi} placeholder="Título (ex: Como precificar um novo cliente)" value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} />
          {tipo === 'link' ? (
            <input style={fi} placeholder="Link (https://...)" value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} />
          ) : (
            <input type="file" style={fi} onChange={e => setArquivo(e.target.files?.[0] || null)} />
          )}
          <textarea style={{ ...fi, minHeight: 60, resize: 'vertical' }} placeholder="Descrição (opcional)" value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} />
          <div>
            <Btn variant="primary" disabled={criar.isPending || !podeSalvar} onClick={salvar}>
              {criar.isPending ? 'Salvando...' : '+ Adicionar'}
            </Btn>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title={`Materiais (${links.length})`} icon="fa-solid fa-graduation-cap" />
        <div style={{ padding: 16 }}>
          {links.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--tx3)', fontSize: 12, padding: 20 }}>Nenhum material cadastrado ainda.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {links.map(l => (
                <div key={l.id} style={{ border: '1px solid var(--bo)', borderRadius: 10, padding: '12px 14px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ fontSize: 18, marginTop: 2 }}>{l.arquivo_path ? '📎' : '🎥'}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <a href={urlDoMaterial(l)} target="_blank" rel="noopener noreferrer" style={{ fontSize: 14, fontWeight: 600, color: '#6366F1', textDecoration: 'none' }}>{l.titulo}</a>
                    {l.descricao && <div style={{ fontSize: 12, color: 'var(--tx2)', marginTop: 2 }}>{l.descricao}</div>}
                    <div style={{ fontSize: 10, color: 'var(--tx3)', marginTop: 4 }}>
                      Adicionado por {l.usuarios?.nome || '—'} em {new Date(l.criado_em).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                  {confirmDel === l.id ? (
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <Btn small variant="danger" onClick={() => { remover.mutate({ id: l.id, arquivo_path: l.arquivo_path }); setConfirmDel(null) }}>Excluir</Btn>
                      <Btn small variant="outline" onClick={() => setConfirmDel(null)}>Cancelar</Btn>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmDel(l.id)} style={{ flexShrink: 0, border: 'none', background: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: 13 }}>🗑</button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
