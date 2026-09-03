import { useState } from 'react'
import { useMentoriaLinks, useCreateMentoriaLink, useDeleteMentoriaLink, useMeusCombinados, useAtualizarMeuCombinado, useMentoriaPosts, useCriarPost, useExcluirPost, useFixarPost, useMentoriaCurtidas, useToggleCurtida, useComentariosDoPost, useCriarComentario } from '../hooks/useData'
import { useAuthStore } from '../store/authStore'
import { supabase } from '../lib/supabase'
import { Card, CardHeader, Btn, Loader } from '../components/ui'
import SecaoAulasDaTurma, { BotaoAgenda } from '../components/modules/mentoria/AulasDaTurma'

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
        {!c.concluido && c.prazo && (
          <div onClick={e => e.stopPropagation()}>
            <BotaoAgenda titulo={`Combinado: ${c.texto}`} data={c.prazo} />
          </div>
        )}
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

function ComentariosDoPost({ postId }) {
  const { profile } = useAuthStore()
  const { data: comentarios = [], isLoading } = useComentariosDoPost(postId, true)
  const criar = useCriarComentario()
  const [texto, setTexto] = useState('')

  function enviar() {
    if (!texto.trim()) return
    criar.mutate({ post_id: postId, conteudo: texto.trim() })
    setTexto('')
  }

  return (
    <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--bo)' }}>
      {isLoading ? (
        <div style={{ fontSize: 11, color: 'var(--tx3)' }}>Carregando comentários...</div>
      ) : comentarios.length === 0 ? (
        <div style={{ fontSize: 11, color: 'var(--tx3)', marginBottom: 8 }}>Nenhum comentário ainda, seja a primeira.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
          {comentarios.map(c => (
            <div key={c.id} style={{ fontSize: 12, background: 'var(--s2)', borderRadius: 8, padding: '6px 10px' }}>
              <span style={{ fontWeight: 700 }}>{c.autor_nome}</span>{' '}
              <span style={{ color: 'var(--tx3)', fontSize: 10 }}>{new Date(c.criado_em).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
              <div>{c.conteudo}</div>
            </div>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', gap: 6 }}>
        <input
          style={{ flex: 1, padding: '6px 8px', border: '1px solid var(--bo)', borderRadius: 6, fontSize: 12, fontFamily: 'inherit' }}
          placeholder="Escreva um comentário..."
          value={texto}
          onChange={e => setTexto(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && enviar()}
        />
        <Btn small variant="outline" disabled={criar.isPending || !texto.trim()} onClick={enviar}>Enviar</Btn>
      </div>
    </div>
  )
}

function PostComunidade({ post, curtido, totalCurtidas }) {
  const { profile } = useAuthStore()
  const toggleCurtida = useToggleCurtida()
  const excluir = useExcluirPost()
  const fixar = useFixarPost()
  const [mostrarComentarios, setMostrarComentarios] = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)
  const souAutor = post.autor_id === profile?.id

  return (
    <div style={{ border: post.fixado ? '1.5px solid #F59E0B' : '1px solid var(--bo)', background: post.fixado ? '#FFFBEB' : 'transparent', borderRadius: 10, padding: '12px 14px' }}>
      {post.fixado && <div style={{ fontSize: 10, fontWeight: 700, color: '#B45309', marginBottom: 6 }}>📌 FIXADO</div>}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <span style={{ fontSize: 13, fontWeight: 700 }}>{post.autor_nome}</span>
          {post.empresa_nome && <span style={{ fontSize: 11, color: 'var(--tx3)' }}> · {post.empresa_nome}</span>}
          <div style={{ fontSize: 10, color: 'var(--tx3)' }}>
            {new Date(post.criado_em).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {profile?.fluxe_staff && (
            <button onClick={() => fixar.mutate({ id: post.id, fixado: !post.fixado })} disabled={fixar.isPending}
              style={{ border: 'none', background: 'none', color: post.fixado ? '#B45309' : '#94A3B8', cursor: 'pointer', fontSize: 12 }}
              title={post.fixado ? 'Desafixar post' : 'Fixar post'}>
              📌
            </button>
          )}
          {souAutor && (
            confirmDel ? (
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => excluir.mutate(post.id)} style={{ border: 'none', background: 'none', color: '#DC2626', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Excluir</button>
                <button onClick={() => setConfirmDel(false)} style={{ border: 'none', background: 'none', color: 'var(--tx3)', fontSize: 11, cursor: 'pointer' }}>Cancelar</button>
              </div>
            ) : (
              <button onClick={() => setConfirmDel(true)} style={{ border: 'none', background: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: 12 }}>🗑</button>
            )
          )}
        </div>
      </div>
      <div style={{ fontSize: 13, marginTop: 8, whiteSpace: 'pre-wrap' }}>{post.conteudo}</div>
      <div style={{ display: 'flex', gap: 14, marginTop: 10 }}>
        <button
          onClick={() => toggleCurtida.mutate({ post_id: post.id, curtido })}
          disabled={toggleCurtida.isPending}
          style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: curtido ? '#EF4444' : 'var(--tx3)', display: 'flex', alignItems: 'center', gap: 4 }}
        >
          {curtido ? '❤️' : '🤍'} {totalCurtidas > 0 ? totalCurtidas : ''}
        </button>
        <button
          onClick={() => setMostrarComentarios(v => !v)}
          style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: 'var(--tx3)' }}
        >
          💬 Comentar
        </button>
      </div>
      {mostrarComentarios && <ComentariosDoPost postId={post.id} />}
    </div>
  )
}

function SecaoComunidade() {
  const { empresa, profile } = useAuthStore()
  const { data: posts = [], isLoading } = useMentoriaPosts()
  const { data: curtidas = [] } = useMentoriaCurtidas()
  const criarPost = useCriarPost()
  const [texto, setTexto] = useState('')

  if (!empresa?.mentorado_bpo_lucrativo && !profile?.fluxe_staff) return null

  const fixados = posts.filter(p => p.fixado)
  const outros = posts.filter(p => !p.fixado)

  function publicar() {
    if (!texto.trim()) return
    criarPost.mutate({ conteudo: texto.trim() })
    setTexto('')
  }

  return (
    <Card style={{ marginBottom: 16 }}>
      <CardHeader title="Comunidade" icon="fa-solid fa-comments" />
      <div style={{ padding: 16 }}>
        <div style={{ fontSize: 12, color: 'var(--tx3)', marginBottom: 12 }}>
          Um espaço pra trocar ideia com outros mentorados, que estão construindo o mesmo tipo de negócio que você.
        </div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          <textarea
            style={{ flex: 1, padding: '8px 10px', border: '1px solid var(--bo)', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', minHeight: 50, resize: 'vertical' }}
            placeholder="Compartilhe uma dúvida, uma vitória ou uma ideia com a turma..."
            value={texto}
            onChange={e => setTexto(e.target.value)}
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <Btn variant="primary" disabled={criarPost.isPending || !texto.trim()} onClick={publicar}>
            {criarPost.isPending ? 'Publicando...' : 'Publicar'}
          </Btn>
        </div>
        {isLoading ? <Loader /> : posts.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--tx3)', fontSize: 12, padding: 20 }}>Ninguém postou ainda, seja a primeira pessoa a compartilhar algo.</div>
        ) : (
          <>
            {fixados.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#B45309', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 8 }}>📌 Posts fixados</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {fixados.map(post => {
                    const curtidasDoPost = curtidas.filter(c => c.post_id === post.id)
                    const curtido = curtidasDoPost.some(c => c.empresa_id === empresa.id)
                    return <PostComunidade key={post.id} post={post} curtido={curtido} totalCurtidas={curtidasDoPost.length} />
                  })}
                </div>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {outros.map(post => {
                const curtidasDoPost = curtidas.filter(c => c.post_id === post.id)
                const curtido = curtidasDoPost.some(c => c.empresa_id === empresa.id)
                return <PostComunidade key={post.id} post={post} curtido={curtido} totalCurtidas={curtidasDoPost.length} />
              })}
            </div>
          </>
        )}
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
      <SecaoComunidade />
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
