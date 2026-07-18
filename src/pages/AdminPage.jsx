import { useState } from 'react'
import { useAdminEmpresas, useAdminAcaoEmpresa, useFluxeBugs, useCreateFluxeBug, useUpdateFluxeBug } from '../hooks/useData'
import { Card, CardHeader, Btn, Badge, Loader } from '../components/ui'

const PLANO_COLOR = { trial:'yellow', trial_expirado:'orange', bloqueado:'red', essencial:'green', pro:'green' }
const PLANO_LABEL = { trial:'Trial', trial_expirado:'Trial expirado', bloqueado:'Bloqueada', essencial:'Essencial', pro:'Pro' }

function diasTrial(trial_expira_em) {
  if (!trial_expira_em) return null
  const dias = Math.ceil((new Date(trial_expira_em) - new Date()) / (1000 * 60 * 60 * 24))
  return dias
}

function LinhaEmpresa({ emp, onAcao, pendente }) {
  const [confirmBloquear, setConfirmBloquear] = useState(false)
  const [planoRestaurar, setPlanoRestaurar] = useState('trial')
  const dias = diasTrial(emp.trial_expira_em)

  return (
    <tr style={{ borderBottom: '1px solid var(--bo)' }}>
      <td style={{ padding: '10px 8px' }}>
        <div style={{ fontWeight: 600, fontSize: 13 }}>{emp.nome || '—'}</div>
        <div style={{ fontSize: 11, color: 'var(--tx3)' }}>{emp.email || emp.cnpj || ''}</div>
      </td>
      <td style={{ padding: '10px 8px' }}>
        <Badge label={PLANO_LABEL[emp.plano] || emp.plano || '—'} color={PLANO_COLOR[emp.plano] || 'gray'} />
      </td>
      <td style={{ padding: '10px 8px', fontSize: 12 }}>
        {emp.trial_expira_em
          ? (dias >= 0 ? `${dias} dia${dias === 1 ? '' : 's'} restantes` : `expirou há ${Math.abs(dias)}d`)
          : '—'}
      </td>
      <td style={{ padding: '10px 8px', fontSize: 12, textAlign: 'center' }}>{emp.usuarios_count}</td>
      <td style={{ padding: '10px 8px', fontSize: 12, textAlign: 'center' }}>{emp.clientes_count}</td>
      <td style={{ padding: '10px 8px', fontSize: 11, color: 'var(--tx3)' }}>
        {emp.criado_em ? new Date(emp.criado_em).toLocaleDateString('pt-BR') : '—'}
      </td>
      <td style={{ padding: '10px 8px' }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          {emp.plano === 'bloqueado' ? (
            <>
              <select value={planoRestaurar} onChange={e => setPlanoRestaurar(e.target.value)}
                style={{ fontSize: 11, padding: '4px 6px', borderRadius: 6, border: '1px solid var(--bo)' }}>
                <option value="trial">Trial</option>
                <option value="essencial">Essencial</option>
                <option value="pro">Pro</option>
              </select>
              <Btn small variant="success" disabled={pendente} onClick={() => onAcao('desbloquear', emp.id, { plano: planoRestaurar })}>Desbloquear</Btn>
            </>
          ) : confirmBloquear ? (
            <>
              <span style={{ fontSize: 11, color: '#991B1B' }}>Confirma?</span>
              <Btn small variant="danger" disabled={pendente} onClick={() => { onAcao('bloquear', emp.id); setConfirmBloquear(false) }}>Sim, bloquear</Btn>
              <Btn small variant="outline" onClick={() => setConfirmBloquear(false)}>Cancelar</Btn>
            </>
          ) : (
            <Btn small variant="danger" onClick={() => setConfirmBloquear(true)}>Bloquear</Btn>
          )}
          {emp.plano !== 'bloqueado' && (
            <>
              <Btn small variant="outline" disabled={pendente} onClick={() => onAcao('estender_trial', emp.id, { dias: 7 })}>+7d</Btn>
              <Btn small variant="outline" disabled={pendente} onClick={() => onAcao('estender_trial', emp.id, { dias: 30 })}>+30d</Btn>
            </>
          )}
        </div>
      </td>
    </tr>
  )
}

function SecaoEmpresas() {
  const { data: empresas = [], isLoading } = useAdminEmpresas()
  const acao = useAdminAcaoEmpresa()

  function handleAcao(action, empresa_id, extra = {}) {
    acao.mutate({ action, empresa_id, ...extra })
  }

  if (isLoading) return <Loader />

  return (
    <Card style={{ marginBottom: 16 }}>
      <CardHeader title={`Empresas usando o Fluxe (${empresas.length})`} icon="fa-solid fa-building" />
      <div style={{ padding: '4px 16px 16px', overflowX: 'auto' }}>
        {acao.isError && <div style={{ color: '#991B1B', fontSize: 12, marginBottom: 8 }}>Erro: {acao.error?.message}</div>}
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
          <thead>
            <tr style={{ textAlign: 'left', fontSize: 10, color: 'var(--tx3)', textTransform: 'uppercase' }}>
              <th style={{ padding: '6px 8px' }}>Empresa</th>
              <th style={{ padding: '6px 8px' }}>Plano</th>
              <th style={{ padding: '6px 8px' }}>Trial</th>
              <th style={{ padding: '6px 8px', textAlign: 'center' }}>Usuários</th>
              <th style={{ padding: '6px 8px', textAlign: 'center' }}>Clientes</th>
              <th style={{ padding: '6px 8px' }}>Criada em</th>
              <th style={{ padding: '6px 8px' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {empresas.map(emp => (
              <LinhaEmpresa key={emp.id} emp={emp} onAcao={handleAcao} pendente={acao.isPending} />
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

const STATUS_BUG_COLOR = { aberto: 'red', investigando: 'yellow', resolvido: 'green' }
const STATUS_BUG_LABEL = { aberto: 'Aberto', investigando: 'Investigando', resolvido: 'Resolvido' }

function SecaoBugs() {
  const { data: bugs = [], isLoading } = useFluxeBugs()
  const criar = useCreateFluxeBug()
  const atualizar = useUpdateFluxeBug()
  const [form, setForm] = useState({ empresa_nome: '', reportado_por: '', descricao: '', prioridade: 'media' })

  async function salvar() {
    if (!form.descricao.trim()) return
    await criar.mutateAsync(form)
    setForm({ empresa_nome: '', reportado_por: '', descricao: '', prioridade: 'media' })
  }

  const fi = { padding: '7px 10px', border: '1px solid var(--bo)', borderRadius: 8, fontSize: 12, fontFamily: 'inherit' }

  return (
    <Card>
      <CardHeader title={`Bugs e chamados relatados (${bugs.length})`} icon="fa-solid fa-bug" />
      <div style={{ padding: 16 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12, background: 'var(--bg2)', padding: 12, borderRadius: 10 }}>
          <input style={{ ...fi, flex: '1 1 160px' }} placeholder="Empresa que reportou" value={form.empresa_nome} onChange={e => setForm(f => ({ ...f, empresa_nome: e.target.value }))} />
          <input style={{ ...fi, flex: '1 1 140px' }} placeholder="Quem reportou" value={form.reportado_por} onChange={e => setForm(f => ({ ...f, reportado_por: e.target.value }))} />
          <select style={{ ...fi, flex: '0 0 100px' }} value={form.prioridade} onChange={e => setForm(f => ({ ...f, prioridade: e.target.value }))}>
            <option value="baixa">Baixa</option>
            <option value="media">Média</option>
            <option value="alta">Alta</option>
          </select>
          <textarea style={{ ...fi, width: '100%', minHeight: 60, resize: 'vertical' }} placeholder="Descreva o problema..." value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} />
          <Btn variant="primary" disabled={criar.isPending || !form.descricao.trim()} onClick={salvar}>
            {criar.isPending ? 'Salvando...' : '+ Registrar bug'}
          </Btn>
        </div>

        {isLoading ? <Loader /> : bugs.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--tx3)', fontSize: 12, padding: 20 }}>Nenhum bug registrado ainda.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {bugs.map(b => (
              <div key={b.id} style={{ border: '1px solid var(--bo)', borderRadius: 10, padding: '10px 14px' }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 4 }}>
                  <Badge label={STATUS_BUG_LABEL[b.status]} color={STATUS_BUG_COLOR[b.status]} />
                  {b.prioridade === 'alta' && <Badge label="Prioridade alta" color="red" />}
                  <span style={{ fontSize: 11, color: 'var(--tx3)', marginLeft: 'auto' }}>{new Date(b.criado_em).toLocaleDateString('pt-BR')}</span>
                </div>
                <div style={{ fontSize: 13, marginBottom: 4 }}>{b.descricao}</div>
                <div style={{ fontSize: 11, color: 'var(--tx3)', marginBottom: 8 }}>
                  {b.empresa_nome && <>Empresa: {b.empresa_nome} · </>}
                  {b.reportado_por && <>Reportado por: {b.reportado_por}</>}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {['aberto', 'investigando', 'resolvido'].map(st => (
                    <button key={st} onClick={() => atualizar.mutate({ id: b.id, status: st })}
                      style={{
                        fontSize: 10, padding: '3px 8px', borderRadius: 99, border: 'none', cursor: 'pointer', fontWeight: 600,
                        background: b.status === st ? '#6366F1' : '#F1F5F9', color: b.status === st ? '#fff' : '#475569',
                      }}>
                      {STATUS_BUG_LABEL[st]}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  )
}

export default function AdminPage() {
  return (
    <div>
      <div style={{ fontSize: 12, color: 'var(--tx3)', marginBottom: 16 }}>
        Visível só pra você — controle de todas as empresas que usam o Fluxe e registro interno de bugs.
      </div>
      <SecaoEmpresas />
      <SecaoBugs />
    </div>
  )
}
