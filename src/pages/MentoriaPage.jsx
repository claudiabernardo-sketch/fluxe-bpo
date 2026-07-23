import { useState } from 'react'
import { useMentoriaLinks, useCreateMentoriaLink, useDeleteMentoriaLink, useMeusCombinados, useAtualizarMeuCombinado } from '../hooks/useData'
import { useAuthStore } from '../store/authStore'
import { Card, CardHeader, Btn, Loader } from '../components/ui'

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

function SecaoMeusCombinados() {
  const { empresa } = useAuthStore()
  const { data: combinados = [], isLoading } = useMeusCombinados()

  if (!empresa?.mentorado_bpo_lucrativo) return null

  return (
    <Card style={{ marginBottom: 16 }}>
      <CardHeader title="Combinados com sua mentoria" icon="fa-solid fa-list-check" />
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
  const [form, setForm] = useState({ titulo: '', url: '', descricao: '' })
  const [confirmDel, setConfirmDel] = useState(null)

  async function salvar() {
    if (!form.titulo.trim() || !form.url.trim()) return
    await criar.mutateAsync(form)
    setForm({ titulo: '', url: '', descricao: '' })
  }

  const fi = { padding: '8px 10px', border: '1px solid var(--bo)', borderRadius: 8, fontSize: 13, fontFamily: 'inherit' }

  if (isLoading) return <Loader />

  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      <div style={{ fontSize: 12, color: 'var(--tx3)', marginBottom: 16 }}>
        Vídeos e materiais de mentoria — cole aqui os links (YouTube, Google Drive, Canva, etc.) pra sua equipe acessar.
      </div>

      <SecaoMeusCombinados />

      <Card style={{ marginBottom: 16 }}>
        <CardHeader title="Adicionar material" icon="fa-solid fa-plus" />
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input style={fi} placeholder="Título (ex: Como precificar um novo cliente)" value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} />
          <input style={fi} placeholder="Link (https://...)" value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} />
          <textarea style={{ ...fi, minHeight: 60, resize: 'vertical' }} placeholder="Descrição (opcional)" value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} />
          <div>
            <Btn variant="primary" disabled={criar.isPending || !form.titulo.trim() || !form.url.trim()} onClick={salvar}>
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
                  <div style={{ fontSize: 18, marginTop: 2 }}>🎥</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <a href={l.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 14, fontWeight: 600, color: '#6366F1', textDecoration: 'none' }}>{l.titulo}</a>
                    {l.descricao && <div style={{ fontSize: 12, color: 'var(--tx2)', marginTop: 2 }}>{l.descricao}</div>}
                    <div style={{ fontSize: 10, color: 'var(--tx3)', marginTop: 4 }}>
                      Adicionado por {l.usuarios?.nome || '—'} em {new Date(l.criado_em).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                  {confirmDel === l.id ? (
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <Btn small variant="danger" onClick={() => { remover.mutate(l.id); setConfirmDel(null) }}>Excluir</Btn>
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
