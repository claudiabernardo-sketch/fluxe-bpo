import { useState } from 'react'
import { useMentoriaLinks, useCreateMentoriaLink, useDeleteMentoriaLink, useMeusCombinados, useAtualizarMeuCombinado, useTurmaAtualPublica, useMeuProgressoAulas, useToggleProgressoAula, useMentoriaPosts, useCriarPost, useExcluirPost, useMentoriaCurtidas, useToggleCurtida, useComentariosDoPost, useCriarComentario } from '../hooks/useData'
import { useAuthStore } from '../store/authStore'
import { supabase } from '../lib/supabase'
import { Card, CardHeader, Btn, Loader } from '../components/ui'

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

const DIAS_SEMANA_MIN = ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom']
const MESES_NOME = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

function fmtDataLocal(d) { return d.toLocaleDateString('en-CA') }
function startOfMonthLocal(d) { return new Date(d.getFullYear(), d.getMonth(), 1) }
function endOfMonthLocal(d) { return new Date(d.getFullYear(), d.getMonth() + 1, 0) }

function CalendarioAulas({ aulas, concluidas, onSelecionar, aulaSelecionadaId }) {
  const hoje = fmtDataLocal(new Date())
  const porData = {}
  aulas.forEach(a => { if (a.data) (porData[a.data] ||= []).push(a) })

  const primeiraComData = aulas.find(a => a.data)
  const mesInicial = primeiraComData ? new Date(primeiraComData.data + 'T12:00:00') : new Date()
  const [mesBase, setMesBase] = useState(() => startOfMonthLocal(mesInicial))

  const diasMes = (() => {
    const ini = startOfMonthLocal(mesBase), fim = endOfMonthLocal(mesBase), dias = []
    const off = ini.getDay() === 0 ? 6 : ini.getDay() - 1
    for (let i = 0; i < off; i++) dias.push(null)
    for (let d = new Date(ini); d <= fim; d.setDate(d.getDate() + 1)) dias.push(new Date(d))
    while (dias.length % 7 !== 0) dias.push(null)
    return dias
  })()

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <button onClick={() => setMesBase(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
          style={{ border: '1px solid var(--bo)', background: '#fff', borderRadius: 8, width: 28, height: 28, cursor: 'pointer', fontWeight: 700 }}>‹</button>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--tx)', minWidth: 150, textAlign: 'center' }}>
          {MESES_NOME[mesBase.getMonth()]} {mesBase.getFullYear()}
        </div>
        <button onClick={() => setMesBase(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
          style={{ border: '1px solid var(--bo)', background: '#fff', borderRadius: 8, width: 28, height: 28, cursor: 'pointer', fontWeight: 700 }}>›</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginBottom: 4 }}>
        {DIAS_SEMANA_MIN.map(d => <div key={d} style={{ textAlign: 'center', fontSize: 9, fontWeight: 700, color: 'var(--tx3)', textTransform: 'uppercase' }}>{d}</div>)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }}>
        {diasMes.map((d, i) => {
          if (!d) return <div key={`e${i}`} style={{ minHeight: 46 }} />
          const key = fmtDataLocal(d)
          const aulasDoDia = porData[key] || []
          const isHoje = key === hoje
          const temSelecionada = aulasDoDia.some(a => a.id === aulaSelecionadaId)
          return (
            <div
              key={key}
              onClick={() => aulasDoDia.length && onSelecionar(aulasDoDia[0].id)}
              style={{
                minHeight: 46, borderRadius: 8, padding: 4, cursor: aulasDoDia.length ? 'pointer' : 'default',
                background: temSelecionada ? '#EEF2FF' : aulasDoDia.length ? '#F5F3FF' : isHoje ? '#F8FAFC' : 'transparent',
                border: `1.5px solid ${temSelecionada ? '#6366F1' : aulasDoDia.length ? '#DDD6FE' : isHoje ? '#CBD5E1' : 'transparent'}`,
              }}
            >
              <div style={{ fontSize: 11, fontWeight: isHoje ? 800 : 600, color: isHoje ? '#4338CA' : 'var(--tx2)' }}>{d.getDate()}</div>
              {aulasDoDia.map(a => (
                <div key={a.id} style={{
                  fontSize: 8.5, marginTop: 2, padding: '1px 3px', borderRadius: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  background: concluidas.has(a.id) ? '#DCFCE7' : '#EEF2FF', color: concluidas.has(a.id) ? '#15803D' : '#4338CA', fontWeight: 700,
                }}>
                  {concluidas.has(a.id) ? '✓ ' : ''}{a.numero}. {a.titulo}
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function CardAula({ a, concluida, destacada }) {
  return (
    <div style={{ border: `1.5px solid ${destacada ? '#6366F1' : 'var(--bo)'}`, background: destacada ? '#EEF2FF' : 'transparent', borderRadius: 10, padding: '12px 14px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      <AulaConcluidaCheck aula={a} concluida={concluida} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600 }}>{a.titulo}</div>
        {a.exercicio && <div style={{ fontSize: 12, color: 'var(--tx2)', marginTop: 2 }}>Exercício: {a.exercicio}</div>}
        <div style={{ fontSize: 10, color: 'var(--tx3)', marginTop: 4 }}>
          {a.data ? new Date(a.data + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }) : 'Data a combinar'}
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
  )
}

function SecaoAulasDaTurma() {
  const { empresa } = useAuthStore()
  const { data, isLoading } = useTurmaAtualPublica()
  const { data: concluidas = new Set() } = useMeuProgressoAulas()
  const [modo, setModo] = useState('calendario') // 'calendario' | 'lista'
  const [aulaSelecionadaId, setAulaSelecionadaId] = useState(null)
  const turma = data?.turma
  const aulas = data?.aulas ?? []
  const totalConcluidas = aulas.filter(a => concluidas.has(a.id)).length

  if (!empresa?.mentorado_bpo_lucrativo) return null
  if (isLoading) return null
  if (!turma) return null

  const aulaSelecionada = aulas.find(a => a.id === aulaSelecionadaId)

  return (
    <Card style={{ marginBottom: 16 }}>
      <CardHeader title={`Aulas da Turma${turma.nome ? ` — ${turma.nome}` : ''}`} icon="fa-solid fa-calendar-days" />
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

            <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
              {[['calendario', '📅 Calendário'], ['lista', '📋 Lista']].map(([v, l]) => (
                <button key={v} onClick={() => setModo(v)} style={{
                  padding: '6px 12px', borderRadius: 8, border: modo === v ? '2px solid #6366F1' : '1px solid var(--bo)',
                  background: modo === v ? 'rgba(99,102,241,.08)' : 'transparent', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                }}>{l}</button>
              ))}
            </div>

            {modo === 'calendario' ? (
              <>
                <CalendarioAulas aulas={aulas} concluidas={concluidas} onSelecionar={setAulaSelecionadaId} aulaSelecionadaId={aulaSelecionadaId} />
                {aulaSelecionada && (
                  <div style={{ marginTop: 14 }}>
                    <CardAula a={aulaSelecionada} concluida={concluidas.has(aulaSelecionada.id)} destacada />
                  </div>
                )}
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {aulas.map(a => <CardAula key={a.id} a={a} concluida={concluidas.has(a.id)} />)}
              </div>
            )}
          </>
        )}
      </div>
    </Card>
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
  const [mostrarComentarios, setMostrarComentarios] = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)
  const souAutor = post.autor_id === profile?.id

  return (
    <div style={{ border: '1px solid var(--bo)', borderRadius: 10, padding: '12px 14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <span style={{ fontSize: 13, fontWeight: 700 }}>{post.autor_nome}</span>
          {post.empresa_nome && <span style={{ fontSize: 11, color: 'var(--tx3)' }}> · {post.empresa_nome}</span>}
          <div style={{ fontSize: 10, color: 'var(--tx3)' }}>
            {new Date(post.criado_em).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
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
  const { empresa } = useAuthStore()
  const { data: posts = [], isLoading } = useMentoriaPosts()
  const { data: curtidas = [] } = useMentoriaCurtidas()
  const criarPost = useCriarPost()
  const [texto, setTexto] = useState('')

  if (!empresa?.mentorado_bpo_lucrativo) return null

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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {posts.map(post => {
              const curtidasDoPost = curtidas.filter(c => c.post_id === post.id)
              const curtido = curtidasDoPost.some(c => c.empresa_id === empresa.id)
              return <PostComunidade key={post.id} post={post} curtido={curtido} totalCurtidas={curtidasDoPost.length} />
            })}
          </div>
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
