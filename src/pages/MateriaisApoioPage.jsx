import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useMateriaisApoioPublico } from '../hooks/useData'
import { Card, CardHeader, Loader } from '../components/ui'
import { ETAPAS_BPO } from '../data/etapasBpo'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'

// Materiais que têm uma apresentação em tela cheia dentro do Fluxe, além do
// arquivo pra baixar — casado pelo título do material.
const APRESENTACOES = { 'Cheat Sheet de Vendas': '/apresentacao-vendas' }

function urlDoMaterial(m) {
  if (m.arquivo_path) return supabase.storage.from('tarefas').getPublicUrl(m.arquivo_path).data.publicUrl
  return m.url
}

export default function MateriaisApoioPage() {
  const { data: materiais = [], isLoading } = useMateriaisApoioPublico()
  const grupos = ETAPAS_BPO.map(e => ({ ...e, itens: materiais.filter(m => m.etapa === e.v) })).filter(g => g.itens.length > 0)

  // Marca a primeira visita — usado só pra fechar o passo "Conheça a
  // Biblioteca" do checklist de primeiros passos, calculado sozinho.
  const { empresa, updateEmpresa } = useAuthStore()
  useEffect(() => {
    if (empresa?.id && !empresa.biblioteca_visitada_em) {
      const agora = new Date().toISOString()
      supabase.from('empresas').update({ biblioteca_visitada_em: agora }).eq('id', empresa.id).then(() => {
        updateEmpresa?.({ biblioteca_visitada_em: agora })
      })
    }
  }, [empresa?.id])

  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      <div style={{ fontSize: 12, color: 'var(--tx3)', marginBottom: 16 }}>
        Planilhas, PDFs e links organizados por etapa do ciclo do cliente, pra usar no dia a dia da operação.
      </div>

      {isLoading ? <Loader /> : (
        <Card>
          <CardHeader title="Biblioteca" icon="fa-solid fa-book-open" />
          <div style={{ padding: 16 }}>
            {grupos.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--tx3)', fontSize: 12, padding: 20 }}>Nenhum material cadastrado ainda.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {grupos.map(g => (
                  <div key={g.v}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--tx2)', textTransform: 'uppercase', marginBottom: 6 }}>{g.label}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {g.itens.map(m => (
                        <div key={m.id} style={{
                          border: '1px solid var(--bo)', borderRadius: 10, padding: '12px 14px', display: 'flex', gap: 12, alignItems: 'center',
                        }}>
                          <a href={urlDoMaterial(m)} target="_blank" rel="noopener noreferrer" style={{ flex: 1, minWidth: 0, display: 'flex', gap: 12, alignItems: 'flex-start', textDecoration: 'none', color: 'inherit' }}>
                            <div style={{ fontSize: 18, marginTop: 2 }}>{m.arquivo_path ? '📎' : '🔗'}</div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 14, fontWeight: 600, color: '#6366F1' }}>{m.titulo}</div>
                              {m.descricao && <div style={{ fontSize: 12, color: 'var(--tx2)', marginTop: 2 }}>{m.descricao}</div>}
                            </div>
                          </a>
                          {APRESENTACOES[m.titulo] && (
                            <Link to={APRESENTACOES[m.titulo]} style={{
                              fontSize: 11, fontWeight: 700, color: '#4F46E5', textDecoration: 'none', flexShrink: 0,
                              border: '1px solid #C7D2FE', background: '#EEF2FF', borderRadius: 8, padding: '6px 10px', whiteSpace: 'nowrap',
                            }}>🖥️ Apresentar</Link>
                          )}
                          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--tx3)', flexShrink: 0 }}>Baixar ↓</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}
