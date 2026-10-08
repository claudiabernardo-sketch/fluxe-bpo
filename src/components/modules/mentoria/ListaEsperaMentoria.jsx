import { useState } from 'react'
import { useListaEsperaMentoria } from '../../../hooks/useData'
import { useAuthStore } from '../../../store/authStore'
import { Card, CardHeader, Btn, Loader } from '../../ui'

// Painel da mentora: quem entrou na lista de espera da próxima turma.
// Leitura liberada só pra fluxe_staff (MIGRATION 46).
export default function ListaEsperaMentoria() {
  const { profile } = useAuthStore()
  const { data: leads = [], isLoading } = useListaEsperaMentoria(profile?.fluxe_staff)
  const [copiado, setCopiado] = useState(false)

  if (!profile?.fluxe_staff) return null

  const soDigitos = t => (t || '').replace(/\D/g, '')
  function linkContato(contato) {
    const d = soDigitos(contato)
    if (contato.includes('@') || d.length < 10) return null
    return 'https://wa.me/' + (d.length <= 11 ? '55' + d : d)
  }
  async function copiar() {
    const texto = leads.map(l => [l.nome, l.contato, l.cidade].filter(Boolean).join(' | ')).join('\n')
    try { await navigator.clipboard.writeText(texto); setCopiado(true); setTimeout(() => setCopiado(false), 2000) } catch { /* sem permissão de clipboard */ }
  }

  return (
    <Card style={{ marginBottom: 16 }}>
      <CardHeader title={'Lista de espera da próxima turma (' + leads.length + ')'} icon="fa-solid fa-hourglass-half" />
      <div style={{ padding: 16 }}>
        <div style={{ fontSize: 12, color: 'var(--tx3)', marginBottom: 12 }}>
          Quem se cadastrou em fluxebpo.com.br/mentoriaBPOlucrativo quando a turma já tinha começado. Quando abrir a próxima turma, chame essas pessoas primeiro.
        </div>
        {isLoading ? <Loader /> : leads.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--tx3)', fontSize: 12, padding: 12 }}>Ninguém na lista ainda.</div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
              {leads.map(l => {
                const wa = linkContato(l.contato)
                return (
                  <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', border: '1px solid var(--bo)', borderRadius: 8, padding: '8px 12px' }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{l.nome}{l.cidade ? <span style={{ fontWeight: 400, color: 'var(--tx3)' }}> · {l.cidade}</span> : null}</div>
                      <div style={{ fontSize: 12, color: 'var(--tx3)' }}>{l.contato} · {new Date(l.criado_em).toLocaleDateString('pt-BR')}</div>
                    </div>
                    {wa && <a href={wa} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, fontWeight: 700, color: '#16A34A', textDecoration: 'none', flexShrink: 0 }}>WhatsApp</a>}
                  </div>
                )
              })}
            </div>
            <Btn small variant="outline" onClick={copiar}>{copiado ? 'Copiado!' : 'Copiar lista'}</Btn>
          </>
        )}
      </div>
    </Card>
  )
}
