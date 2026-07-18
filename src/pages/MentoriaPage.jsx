import { useState } from 'react'
import { useMentoriaLinks, useCreateMentoriaLink, useDeleteMentoriaLink } from '../hooks/useData'
import { Card, CardHeader, Btn, Loader } from '../components/ui'

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
