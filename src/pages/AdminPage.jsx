import { useState, useRef } from 'react'
import { useAdminEmpresas, useAdminAcaoEmpresa, useFluxeBugs, useCreateFluxeBug, useUpdateFluxeBug, useMentorados, useSessoesMentoria, useCriarSessaoMentoria, useExcluirSessaoMentoria, useSessoesAvulsas, useCombinadosAbertos, useConcluirCombinado, useExcluirDadosMentoria, useAdminTurma, useAdminMateriaisApoio, useSalvarMaterialApoio, useExcluirMaterialApoio } from '../hooks/useData'
import { Card, CardHeader, Btn, Badge, Loader } from '../components/ui'
import { ETAPAS_BPO } from '../data/etapasBpo'

const PLANO_COLOR = { trial:'yellow', trial_expirado:'orange', bloqueado:'red', essencial:'green', pro:'green' }
const PLANO_LABEL = { trial:'Trial', trial_expirado:'Trial expirado', bloqueado:'Bloqueada', essencial:'Essencial', pro:'Pro' }
const VALOR_ESPERADO = { essencial: 97, pro: 197 }

// Compara o texto digitado com o nome da empresa de forma tolerante —
// ignora maiúsculas/minúsculas e espaços extras (nomes no banco às vezes
// têm espaço duplo, o que tornava a confirmação exata impossível de digitar).
function normalizar(s) {
  return (s || '').trim().toLowerCase().replace(/\s+/g, ' ')
}

function diasTrial(trial_expira_em) {
  if (!trial_expira_em) return null
  const dias = Math.ceil((new Date(trial_expira_em) - new Date()) / (1000 * 60 * 60 * 24))
  return dias
}

function LinhaEmpresa({ emp, onAcao, pendente, duplicadas = [] }) {
  const [confirmBloquear, setConfirmBloquear] = useState(false)
  const [confirmExcluir, setConfirmExcluir] = useState(false)
  const [textoConfirmacao, setTextoConfirmacao] = useState('')
  // Parte do plano atual quando já é um plano válido (evita a armadilha de
  // resetar pra "Trial" por padrão e alguém clicar "Definir plano" sem notar
  // e rebaixar sem querer quem já está em Essencial/Pro).
  const [planoRestaurar, setPlanoRestaurar] = useState(
    emp.plano && emp.plano !== 'bloqueado' && emp.plano !== 'trial_expirado' ? emp.plano : 'trial'
  )
  const [editandoValor, setEditandoValor] = useState(false)
  const [novoValor, setNovoValor] = useState('')
  const dias = diasTrial(emp.trial_expira_em)

  const valorAtual = emp.assinatura?.valor
  const valorEsperado = VALOR_ESPERADO[emp.plano]
  const valorDivergente = valorAtual != null && valorEsperado != null && valorAtual !== valorEsperado

  function iniciarEdicao() {
    setNovoValor(valorAtual != null ? String(valorAtual) : '')
    setEditandoValor(true)
  }
  function confirmarValor() {
    const v = Number(novoValor)
    if (!v || v <= 0) return
    onAcao('atualizar_valor_assinatura', emp.id, { novo_valor: v })
    setEditandoValor(false)
  }

  return (
    <>
    <tr style={{ borderBottom: '1px solid var(--bo)' }}>
      <td style={{ padding: '10px 8px' }}>
        <div style={{ fontWeight: 600, fontSize: 13 }}>{emp.nome || '—'}</div>
        <div style={{ fontSize: 11, color: 'var(--tx3)' }}>{emp.email || emp.cnpj || ''}</div>
        {duplicadas.length > 0 && (
          <div style={{ fontSize: 10, color: '#B45309', marginTop: 3, display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }} title="Mesmo e-mail de outra empresa — confira os Usuários de cada uma antes de Bloquear ou Excluir">
            ⚠ Duplicado com {duplicadas.map(d => `${d.nome || '—'} (${d.usuarios_count} usuário${d.usuarios_count === 1 ? '' : 's'})`).join(', ')}
          </div>
        )}
      </td>
      <td style={{ padding: '10px 8px' }}>
        <Badge label={PLANO_LABEL[emp.plano] || emp.plano || '—'} color={PLANO_COLOR[emp.plano] || 'gray'} />
      </td>
      <td style={{ padding: '10px 8px' }}>
        {!emp.pagamento ? (
          <span style={{ fontSize: 11, color: 'var(--tx3)' }}>Sem assinatura</span>
        ) : emp.pagamento.em_dia ? (
          <Badge label="Em dia" color="green" />
        ) : (
          <div>
            <Badge label={`Atrasado ${emp.pagamento.dias_atraso}d`} color="red" />
            <div style={{ fontSize: 10, color: 'var(--tx3)', marginTop: 2 }}>
              R$ {emp.pagamento.valor_devido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} · {emp.pagamento.faturas_vencidas} fatura{emp.pagamento.faturas_vencidas > 1 ? 's' : ''}
            </div>
          </div>
        )}
      </td>
      <td style={{ padding: '10px 8px' }}>
        {!emp.asaas_subscription_id ? (
          <span style={{ fontSize: 11, color: 'var(--tx3)' }}>—</span>
        ) : editandoValor ? (
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <input type="number" step="0.01" autoFocus value={novoValor} onChange={e => setNovoValor(e.target.value)}
              style={{ width: 70, fontSize: 12, padding: '3px 5px', borderRadius: 5, border: '1px solid var(--bo)' }} />
            <Btn small variant="success" disabled={pendente} onClick={confirmarValor}>✓</Btn>
            <Btn small variant="outline" onClick={() => setEditandoValor(false)}>✕</Btn>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: valorDivergente ? '#B45309' : 'var(--tx1)' }}>
              {valorAtual != null ? `R$ ${valorAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—'}
            </span>
            {valorDivergente && <span title={`Esperado R$ ${valorEsperado} pro plano ${emp.plano}`} style={{ fontSize: 11 }}>⚠️</span>}
            <button onClick={iniciarEdicao} title="Editar valor" style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 11, color: 'var(--tx3)', padding: 0 }}>✏️</button>
          </div>
        )}
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
      <td style={{ padding: '10px 8px', textAlign: 'center' }}>
        <button
          title={emp.mentorado_bpo_lucrativo ? 'Remover do BPO Lucrativo' : 'Marcar como mentorado do BPO Lucrativo'}
          onClick={() => onAcao('toggle_mentorado', emp.id, { valor: !emp.mentorado_bpo_lucrativo })}
          disabled={pendente}
          style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 16, opacity: emp.mentorado_bpo_lucrativo ? 1 : .25 }}
        >
          🎓
        </button>
        {emp.mentorado_bpo_lucrativo && emp.aulas_total > 0 && (
          <div style={{ fontSize: 10, color: 'var(--tx3)', marginTop: 2 }} title="Progresso na turma da Mentoria em Grupo">
            {emp.aulas_concluidas}/{emp.aulas_total}
          </div>
        )}
      </td>
      <td style={{ padding: '10px 8px' }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Seletor de plano sempre visível — antes só aparecia quando a empresa
              já estava "Bloqueada", deixando quem pagou mas ficou presa num
              trial vencido (ex: assinatura ativa na Asaas, plano no Fluxe
              ainda em "trial") sem nenhum botão pra corrigir. */}
          <select value={planoRestaurar} onChange={e => setPlanoRestaurar(e.target.value)}
            style={{ fontSize: 11, padding: '4px 6px', borderRadius: 6, border: '1px solid var(--bo)' }}>
            <option value="trial">Trial</option>
            <option value="essencial">Essencial</option>
            <option value="pro">Pro</option>
          </select>
          <Btn small variant="success" disabled={pendente || planoRestaurar === emp.plano} onClick={() => onAcao('desbloquear', emp.id, { plano: planoRestaurar })}>
            Definir plano
          </Btn>
          {emp.plano !== 'bloqueado' && (
            confirmBloquear ? (
              <>
                <span style={{ fontSize: 11, color: '#991B1B' }}>Confirma?</span>
                <Btn small variant="danger" disabled={pendente} onClick={() => { onAcao('bloquear', emp.id); setConfirmBloquear(false) }}>Sim, bloquear</Btn>
                <Btn small variant="outline" onClick={() => setConfirmBloquear(false)}>Cancelar</Btn>
              </>
            ) : (
              <Btn small variant="danger" onClick={() => setConfirmBloquear(true)}>Bloquear</Btn>
            )
          )}
          {emp.plano !== 'bloqueado' && (
            <>
              <Btn small variant="outline" disabled={pendente} onClick={() => onAcao('estender_trial', emp.id, { dias: 7 })}>+7d</Btn>
              <Btn small variant="outline" disabled={pendente} onClick={() => onAcao('estender_trial', emp.id, { dias: 30 })}>+30d</Btn>
            </>
          )}
          <Btn small variant="danger" onClick={() => setConfirmExcluir(true)} title="Exclui a empresa e todos os dados dela pra sempre">
            🗑️ Excluir
          </Btn>
        </div>
      </td>
    </tr>
    {confirmExcluir && (
      <ModalExcluirEmpresa
        emp={emp}
        pendente={pendente}
        onConfirmar={() => { onAcao('excluir_empresa', emp.id); setConfirmExcluir(false) }}
        onCancelar={() => setConfirmExcluir(false)}
      />
    )}
    </>
  )
}

function ModalExcluirEmpresa({ emp, pendente, onConfirmar, onCancelar }) {
  const [texto, setTexto] = useState('')
  const confere = normalizar(texto) === normalizar(emp.nome)
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={onCancelar}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 24, maxWidth: 380, width: '100%', boxShadow: '0 24px 60px rgba(0,0,0,.3)' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#991B1B', marginBottom: 8 }}>Excluir "{emp.nome}"?</div>
        <div style={{ fontSize: 12, color: 'var(--tx3)', marginBottom: 14, lineHeight: 1.5 }}>
          Isso apaga a empresa, os usuários, clientes e todos os dados dela pra sempre. Não tem como desfazer.
        </div>
        <div style={{ fontSize: 11, color: 'var(--tx2)', marginBottom: 6 }}>Digite <strong>{emp.nome}</strong> pra confirmar:</div>
        <input value={texto} onChange={e => setTexto(e.target.value)} autoFocus
          style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--bo)', fontSize: 13, boxSizing: 'border-box', marginBottom: 14 }} />
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Btn variant="outline" onClick={onCancelar}>Cancelar</Btn>
          <Btn variant="danger" disabled={pendente || !confere} onClick={onConfirmar}>Excluir de vez</Btn>
        </div>
      </div>
    </div>
  )
}

function NovoMentoradoForm({ acao }) {
  const [aberto, setAberto] = useState(false)
  const [form, setForm] = useState({ nome_empresa: '', nome_usuario: '', email: '' })
  const [resultado, setResultado] = useState(null)

  const pronto = form.nome_empresa.trim() && form.nome_usuario.trim() && form.email.trim()
  const enviandoRef = useRef(false)

  function salvar() {
    // Guarda síncrona: isPending do React Query só reflete no próximo
    // render, então um duplo clique bem rápido conseguia disparar duas
    // requisições antes do botão desabilitar. Isso já criou uma empresa
    // duplicada numa vez.
    if (!pronto || enviandoRef.current) return
    enviandoRef.current = true
    setResultado(null)
    acao.mutate({ action: 'criar_mentorado', ...form }, {
      onSuccess: (data) => {
        setResultado(data)
        setForm({ nome_empresa: '', nome_usuario: '', email: '' })
      },
      onSettled: () => { enviandoRef.current = false },
    })
  }

  const fi = { padding: '7px 10px', border: '1px solid var(--bo)', borderRadius: 8, fontSize: 12, fontFamily: 'inherit', flex: '1 1 160px' }

  if (!aberto) {
    return (
      <div style={{ marginBottom: 12 }}>
        <Btn variant="primary" onClick={() => setAberto(true)}>+ Adicionar mentorado</Btn>
      </div>
    )
  }

  return (
    <div style={{ background: 'var(--bg2)', padding: 12, borderRadius: 10, marginBottom: 12 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
        <input style={fi} placeholder="Nome da empresa" value={form.nome_empresa} onChange={e => setForm(f => ({ ...f, nome_empresa: e.target.value }))} />
        <input style={fi} placeholder="Nome do mentorado" value={form.nome_usuario} onChange={e => setForm(f => ({ ...f, nome_usuario: e.target.value }))} />
        <input style={fi} type="email" placeholder="E-mail" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
      </div>
      {acao.isError && <div style={{ color: '#991B1B', fontSize: 12, marginBottom: 8 }}>Erro: {acao.error?.message}</div>}
      {resultado?.success && (
        <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 8, padding: '10px 12px', marginBottom: 8 }}>
          <div style={{ color: '#166534', fontSize: 12, marginBottom: 6 }}>
            Mentorado criado{resultado.emailSent ? ' e email de boas-vindas enviado.' : ', mas o email não foi enviado — verifique o Resend.'} Manda esses dados por WhatsApp também, pra garantir:
          </div>
          <div style={{ fontSize: 12, color: '#0F172A', fontFamily: 'monospace' }}>
            Site: fluxebpo.com.br → Entrar<br />
            E-mail: {resultado.email}<br />
            Senha: {resultado.senha}
          </div>
        </div>
      )}
      <div style={{ display: 'flex', gap: 8 }}>
        <Btn variant="primary" disabled={acao.isPending || !pronto} onClick={salvar}>
          {acao.isPending ? 'Criando...' : 'Criar e enviar boas-vindas'}
        </Btn>
        <Btn variant="ghost" onClick={() => setAberto(false)}>Cancelar</Btn>
      </div>
    </div>
  )
}

function SecaoEmpresas() {
  const { data: empresas = [], isLoading } = useAdminEmpresas()
  const acao = useAdminAcaoEmpresa()
  const [filtro, setFiltro] = useState('ativas') // 'ativas' | 'inativas' | 'todas'
  const [busca, setBusca] = useState('')

  function handleAcao(action, empresa_id, extra = {}) {
    acao.mutate({ action, empresa_id, ...extra })
  }

  if (isLoading) return <Loader />

  // Agrupa por e-mail pra avisar quando duas empresas são a mesma pessoa
  // (ex: cadastro próprio no Fluxe + compra depois pela Kiwify) — evita
  // bloquear/excluir a conta errada por engano.
  const porEmail = {}
  empresas.forEach(e => {
    if (!e.email) return
    const chave = e.email.trim().toLowerCase()
    ;(porEmail[chave] ||= []).push(e)
  })

  const empresasFiltradas = empresas.filter(e => {
    if (filtro === 'todas') { /* segue */ } else {
      const inativa = e.plano === 'bloqueado'
      if (filtro === 'inativas' ? !inativa : inativa) return false
    }
    if (!busca.trim()) return true
    const q = busca.trim().toLowerCase()
    return (e.nome || '').toLowerCase().includes(q) || (e.email || '').toLowerCase().includes(q)
  })

  return (
    <Card style={{ marginBottom: 16 }}>
      <CardHeader title={`Empresas usando o Fluxe (${empresasFiltradas.length}/${empresas.length})`} icon="fa-solid fa-building" />
      <div style={{ padding: '4px 16px 16px', overflowX: 'auto' }}>
        <NovoMentoradoForm acao={acao} />
        <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          {[['ativas', 'Ativas'], ['inativas', 'Inativas (bloqueadas)'], ['todas', 'Todas']].map(([v, label]) => (
            <button key={v} onClick={() => setFiltro(v)}
              style={{
                fontSize: 11, fontWeight: 600, padding: '5px 12px', borderRadius: 99, cursor: 'pointer',
                border: filtro === v ? '1px solid #6366F1' : '1px solid var(--bo)',
                background: filtro === v ? '#EEF2FF' : 'transparent',
                color: filtro === v ? '#6366F1' : 'var(--tx3)',
              }}>
              {label}
            </button>
          ))}
          <input
            value={busca} onChange={e => setBusca(e.target.value)}
            placeholder="🔍 Buscar por nome ou e-mail..."
            style={{ marginLeft: 'auto', flex: '0 1 260px', padding: '6px 10px', borderRadius: 8, border: '1px solid var(--bo)', fontSize: 12 }}
          />
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 860 }}>
          <thead>
            <tr style={{ textAlign: 'left', fontSize: 10, color: 'var(--tx3)', textTransform: 'uppercase' }}>
              <th style={{ padding: '6px 8px' }}>Empresa</th>
              <th style={{ padding: '6px 8px' }}>Plano</th>
              <th style={{ padding: '6px 8px' }}>Pagamento</th>
              <th style={{ padding: '6px 8px' }}>Valor cobrado</th>
              <th style={{ padding: '6px 8px' }}>Trial</th>
              <th style={{ padding: '6px 8px', textAlign: 'center' }}>Usuários</th>
              <th style={{ padding: '6px 8px', textAlign: 'center' }}>Clientes</th>
              <th style={{ padding: '6px 8px' }}>Criada em</th>
              <th style={{ padding: '6px 8px', textAlign: 'center' }}>Mentoria</th>
              <th style={{ padding: '6px 8px' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {empresasFiltradas.map(emp => {
              const chave = (emp.email || '').trim().toLowerCase()
              const duplicadas = chave ? (porEmail[chave] || []).filter(d => d.id !== emp.id) : []
              return <LinhaEmpresa key={emp.id} emp={emp} onAcao={handleAcao} pendente={acao.isPending} duplicadas={duplicadas} />
            })}
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

const ETAPA_LABEL = {
  cliente_ideal: 'Cliente Ideal',
  dor: 'Dor / Problema',
  entregaveis: 'Entregáveis',
  processo: 'Processo / Rotina',
  custo_existir: 'Custo de Existir',
  meta_faturamento: 'Meta de Faturamento',
}
const SEMAFORO_COLOR = { verde: 'green', amarelo: 'yellow', vermelho: 'red', sem_dado: 'gray' }
const SEMAFORO_LABEL = { verde: 'Radar OK', amarelo: 'Radar de atenção', vermelho: 'Radar crítico', sem_dado: 'Sem Radar ainda' }

function planoCompleto(plano) {
  if (!plano) return false
  return Object.keys(ETAPA_LABEL).every(k => plano[k]?.trim?.())
}

function diasDesde(dataStr) {
  if (!dataStr) return null
  return Math.floor((Date.now() - new Date(dataStr + 'T12:00:00').getTime()) / 86400000)
}

// Prioridade de quem precisa de atenção primeiro: Radar crítico > tem
// dificuldade marcada > mais tempo sem sessão registrada.
function urgencia(m) {
  const dificuldades = m.plano_negocio ? Object.keys(ETAPA_LABEL).filter(k => m.plano_negocio[`${k}_dificuldade`]) : []
  const semaforoScore = { vermelho: 1000, amarelo: 500, verde: 0, sem_dado: 100 }[m.radar?.pior_semaforo || 'sem_dado']
  const diasSemSessao = diasDesde(m.sessoes?.ultima_data) ?? 9999
  return semaforoScore + dificuldades.length * 50 + Math.min(diasSemSessao, 365)
}

function CombinadosDraftEditor({ itens, setItens }) {
  function add() { setItens(list => [...list, { texto: '', prazo: '' }]) }
  function update(i, campo, valor) { setItens(list => list.map((it, idx) => idx === i ? { ...it, [campo]: valor } : it)) }
  function remove(i) { setItens(list => list.filter((_, idx) => idx !== i)) }

  const fi = { padding: '6px 8px', border: '1px solid var(--bo)', borderRadius: 6, fontSize: 12, fontFamily: 'inherit' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
      {itens.map((it, i) => (
        <div key={i} style={{ display: 'flex', gap: 6 }}>
          <input style={{ ...fi, flex: 1 }} placeholder="Combinado com prazo (ex: definir ticket até sexta)" value={it.texto} onChange={e => update(i, 'texto', e.target.value)} />
          <input type="date" style={{ ...fi, flex: '0 0 130px' }} value={it.prazo} onChange={e => update(i, 'prazo', e.target.value)} />
          <button onClick={() => remove(i)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--tx3)' }}>✕</button>
        </div>
      ))}
      <button onClick={add} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#6366F1', fontSize: 11, fontWeight: 600, textAlign: 'left', padding: 0 }}>
        + combinado com prazo
      </button>
    </div>
  )
}

function ListaCombinadosDaSessao({ combinados = [] }) {
  const concluir = useConcluirCombinado()
  if (combinados.length === 0) return null
  return (
    <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
      {combinados.map(c => (
        <div key={c.id}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, opacity: c.concluido ? .55 : 1, cursor: c.concluido ? 'default' : 'pointer' }}>
            <input type="checkbox" checked={c.concluido} disabled={c.concluido || concluir.isPending} onChange={() => concluir.mutate(c.id)} />
            <span style={{ textDecoration: c.concluido ? 'line-through' : 'none' }}>{c.texto}</span>
            {c.prazo && <span style={{ color: 'var(--tx3)' }}>— {new Date(c.prazo + 'T12:00:00').toLocaleDateString('pt-BR')}</span>}
          </label>
          {c.status_mentorado && (
            <div style={{ fontSize: 11, color: 'var(--tx2)', marginLeft: 20, marginTop: 2 }}>💬 {c.status_mentorado}</div>
          )}
        </div>
      ))}
    </div>
  )
}

function SecaoSessoes({ empresaId }) {
  const { data: sessoes = [], isLoading } = useSessoesMentoria(empresaId)
  const criar = useCriarSessaoMentoria()
  const excluir = useExcluirSessaoMentoria()
  const [form, setForm] = useState({ data: new Date().toLocaleDateString('en-CA'), nota: '', combinados: '' })
  const [itens, setItens] = useState([])

  async function salvar() {
    if (!form.nota.trim()) return
    await criar.mutateAsync({ empresa_id: empresaId, ...form, itens })
    setForm({ data: new Date().toLocaleDateString('en-CA'), nota: '', combinados: '' })
    setItens([])
  }

  const fi = { padding: '7px 9px', border: '1px solid var(--bo)', borderRadius: 7, fontSize: 12, fontFamily: 'inherit' }

  return (
    <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--bo)' }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12, background: 'var(--bg2)', padding: 10, borderRadius: 8 }}>
        <input type="date" style={{ ...fi, flex: '0 0 140px' }} value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))} />
        <textarea style={{ ...fi, flex: '1 1 220px', minHeight: 44, resize: 'vertical' }} placeholder="O que foi conversado..." value={form.nota} onChange={e => setForm(f => ({ ...f, nota: e.target.value }))} />
        <textarea style={{ ...fi, flex: '1 1 220px', minHeight: 44, resize: 'vertical' }} placeholder="Contexto geral dos combinados (opcional)" value={form.combinados} onChange={e => setForm(f => ({ ...f, combinados: e.target.value }))} />
        <CombinadosDraftEditor itens={itens} setItens={setItens} />
        <Btn small variant="primary" disabled={criar.isPending || !form.nota.trim()} onClick={salvar}>
          {criar.isPending ? 'Salvando...' : '+ Registrar sessão'}
        </Btn>
      </div>

      {isLoading ? <Loader size={16} /> : sessoes.length === 0 ? (
        <div style={{ fontSize: 12, color: 'var(--tx3)' }}>Nenhuma sessão registrada ainda.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {sessoes.map(s => (
            <div key={s.id} style={{ fontSize: 12, border: '1px solid var(--bo)', borderRadius: 8, padding: '8px 10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ fontWeight: 700 }}>{new Date(s.data + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                <button onClick={() => excluir.mutate({ id: s.id, empresa_id: empresaId })} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--tx3)', fontSize: 11 }}>🗑</button>
              </div>
              <div style={{ marginTop: 4 }}>{s.nota}</div>
              {s.combinados && <div style={{ marginTop: 4, color: 'var(--tx2)' }}><b>Contexto:</b> {s.combinados}</div>}
              <ListaCombinadosDaSessao combinados={s.mentoria_combinados} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ZonaPerigoMentorado({ m }) {
  const excluir = useExcluirDadosMentoria()
  const [nomeConfirmacao, setNomeConfirmacao] = useState('')
  const podeExcluir = nomeConfirmacao.trim() === m.nome

  return (
    <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px dashed #FCA5A5' }}>
      <div style={{ fontSize: 11, color: '#991B1B', marginBottom: 6 }}>
        Apaga Plano de Negócio, sessões, combinados e materiais dessa empresa (e desmarca 🎓). Não apaga clientes/tarefas/usuários dela. Não tem como desfazer.
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <input
          style={{ flex: '1 1 180px', padding: '6px 8px', border: '1px solid var(--bo)', borderRadius: 6, fontSize: 12, fontFamily: 'inherit' }}
          placeholder={`Digite "${m.nome}" pra confirmar`}
          value={nomeConfirmacao}
          onChange={e => setNomeConfirmacao(e.target.value)}
        />
        <Btn small variant="danger" disabled={!podeExcluir || excluir.isPending} onClick={() => excluir.mutate({ empresa_id: m.id, confirmacao_nome: nomeConfirmacao })}>
          {excluir.isPending ? 'Excluindo...' : 'Excluir dados de mentoria'}
        </Btn>
      </div>
      {excluir.isError && <div style={{ fontSize: 11, color: '#991B1B', marginTop: 6 }}>Erro: {excluir.error?.message}</div>}
    </div>
  )
}

function CardMentorado({ m, turmaAulas }) {
  const [expandido, setExpandido] = useState(false)
  const [progressoAberto, setProgressoAberto] = useState(false)
  const [zonaPerigo, setZonaPerigo] = useState(false)
  const concluidasSet = new Set(m.aulas_concluidas_ids || [])
  const dificuldades = m.plano_negocio
    ? Object.keys(ETAPA_LABEL).filter(k => m.plano_negocio[`${k}_dificuldade`])
    : []
  const diasSemSessao = diasDesde(m.sessoes?.ultima_data)

  return (
    <div style={{ border: '1px solid var(--bo)', borderRadius: 10, padding: '14px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>{m.nome || '—'}</div>
          <div style={{ fontSize: 11, color: 'var(--tx3)' }}>{m.email || ''}</div>
          <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
            {planoCompleto(m.plano_negocio) && <span title="Plano de Negócio completo" style={{ fontSize: 15 }}>🎯</span>}
            {m.radar?.total_clientes > 0 && <span title="Primeiro cliente operacional" style={{ fontSize: 15 }}>🤝</span>}
            {m.proposta_aprovada && <span title="Primeira proposta aprovada" style={{ fontSize: 15 }}>📄</span>}
          </div>
        </div>
        {m.radar ? (
          <Badge label={`${SEMAFORO_LABEL[m.radar.pior_semaforo]}${m.radar.score_medio != null ? ` (${m.radar.score_medio})` : ''}`} color={SEMAFORO_COLOR[m.radar.pior_semaforo]} />
        ) : (
          <Badge label="Sem Radar ainda" color="gray" />
        )}
      </div>

      {!m.plano_negocio ? (
        <div style={{ fontSize: 12, color: 'var(--tx3)' }}>Ainda não preencheu o Plano de Negócio.</div>
      ) : dificuldades.length === 0 ? (
        <div style={{ fontSize: 12, color: 'var(--tx3)' }}>Sem dificuldades marcadas no Plano de Negócio.</div>
      ) : (
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#B45309', marginBottom: 6 }}>🤔 Travando em:</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {dificuldades.map(k => (
              <div key={k} style={{ fontSize: 12 }}>
                <span style={{ fontWeight: 600 }}>{ETAPA_LABEL[k]}</span>
                {m.plano_negocio[`${k}_obs`] && <span style={{ color: 'var(--tx2)' }}> — {m.plano_negocio[`${k}_obs`]}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 11, color: 'var(--tx3)' }}>
          {m.sessoes?.count > 0
            ? `${m.sessoes.count} sessão${m.sessoes.count > 1 ? 'ões' : ''} · última há ${diasSemSessao} dia${diasSemSessao === 1 ? '' : 's'}`
            : 'Nenhuma sessão registrada'}
        </div>
        <button onClick={() => setExpandido(x => !x)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#6366F1', fontSize: 12, fontWeight: 600 }}>
          {expandido ? 'Fechar sessões ▲' : 'Ver / registrar sessões ▼'}
        </button>
      </div>

      {expandido && <SecaoSessoes empresaId={m.id} />}

      {turmaAulas.length > 0 && (
        <div style={{ marginTop: 10, borderTop: '1px solid var(--bo)', paddingTop: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--tx3)' }}>
              🎓 Progresso na turma: {concluidasSet.size} de {turmaAulas.length} aulas
            </div>
            <button onClick={() => setProgressoAberto(x => !x)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#6366F1', fontSize: 12, fontWeight: 600 }}>
              {progressoAberto ? 'Fechar ▲' : 'Ver aulas ▼'}
            </button>
          </div>
          {progressoAberto && (
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {turmaAulas.map(a => (
                <div key={a.id} style={{ fontSize: 12, display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span>{concluidasSet.has(a.id) ? '✅' : '⬜'}</span>
                  <span style={{ color: concluidasSet.has(a.id) ? 'var(--tx1)' : 'var(--tx3)' }}>{a.numero}. {a.titulo}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: 8, textAlign: 'right' }}>
        <button onClick={() => setZonaPerigo(x => !x)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--tx3)', fontSize: 10 }}>
          {zonaPerigo ? 'Ocultar' : 'Encerrar mentoria / excluir dados'}
        </button>
      </div>
      {zonaPerigo && <ZonaPerigoMentorado m={m} />}
    </div>
  )
}

function ResumoMentoria({ mentorados, combinadosAbertos }) {
  if (mentorados.length === 0) return null
  const criticos = mentorados.filter(m => m.radar?.pior_semaforo === 'vermelho').length
  const semSessaoLonga = mentorados.filter(m => (diasDesde(m.sessoes?.ultima_data) ?? 9999) > 30).length
  const hoje = new Date().toLocaleDateString('en-CA')
  const vencidos = combinadosAbertos.filter(c => c.prazo && c.prazo < hoje).length

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
      {criticos > 0 && <Badge label={`🔴 ${criticos} com Radar crítico`} color="red" />}
      {vencidos > 0 && <Badge label={`⏰ ${vencidos} combinado${vencidos > 1 ? 's' : ''} vencido${vencidos > 1 ? 's' : ''}`} color="orange" />}
      {semSessaoLonga > 0 && <Badge label={`📅 ${semSessaoLonga} sem sessão há +30 dias`} color="yellow" />}
      {criticos === 0 && vencidos === 0 && semSessaoLonga === 0 && <Badge label="✅ Tudo em dia" color="green" />}
    </div>
  )
}

function SecaoMentorados() {
  const { data, isLoading } = useMentorados()
  const mentorados = data?.mentorados ?? []
  const turmaAulas = data?.turma_aulas ?? []
  const { data: combinadosAbertos = [] } = useCombinadosAbertos()
  const ordenados = [...mentorados].sort((a, b) => urgencia(b) - urgencia(a))

  return (
    <Card style={{ marginBottom: 16 }}>
      <CardHeader title={`Painel do Mentor — BPO Lucrativo (${mentorados.length})`} icon="fa-solid fa-graduation-cap" />
      <div style={{ padding: 16 }}>
        <div style={{ fontSize: 12, color: 'var(--tx3)', marginBottom: 14 }}>
          Empresas marcadas com 🎓 na lista abaixo, ordenadas por quem precisa de mais atenção primeiro. Selos: 🎯 Plano de Negócio completo · 🤝 primeiro cliente operacional · 📄 primeira proposta aprovada.
        </div>
        <ResumoMentoria mentorados={mentorados} combinadosAbertos={combinadosAbertos} />
        {isLoading ? <Loader /> : mentorados.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--tx3)', fontSize: 12, padding: 20 }}>
            Nenhuma empresa marcada como mentorada ainda — clique no 🎓 na lista de empresas abaixo.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {ordenados.map(m => <CardMentorado key={m.id} m={m} turmaAulas={turmaAulas} />)}
          </div>
        )}
      </div>
    </Card>
  )
}

function SecaoCombinadosAbertos() {
  const { data: combinados = [], isLoading } = useCombinadosAbertos()
  const hoje = new Date().toLocaleDateString('en-CA')

  return (
    <Card style={{ marginBottom: 16 }}>
      <CardHeader title={`Combinados em aberto (${combinados.length})`} icon="fa-solid fa-list-check" />
      <div style={{ padding: 16 }}>
        {isLoading ? <Loader /> : combinados.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--tx3)', fontSize: 12, padding: 20 }}>Nada em aberto — tudo em dia.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {combinados.map(c => {
              const nome = c.mentoria_sessoes?.empresas?.nome || c.mentoria_sessoes?.nome_avulso || '—'
              const vencido = c.prazo && c.prazo < hoje
              return <ItemCombinadoAberto key={c.id} c={c} nome={nome} vencido={vencido} />
            })}
          </div>
        )}
      </div>
    </Card>
  )
}

function ItemCombinadoAberto({ c, nome, vencido }) {
  const concluir = useConcluirCombinado()
  return (
    <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, border: '1px solid var(--bo)', borderRadius: 8, padding: '8px 10px', cursor: concluir.isPending ? 'default' : 'pointer' }}>
      <input type="checkbox" checked={false} disabled={concluir.isPending} onChange={() => concluir.mutate(c.id)} style={{ marginTop: 2 }} />
      <div style={{ flex: 1 }}>
        <div>
          <b>{nome}</b>
          {c.prazo && (
            <span style={{ color: vencido ? '#DC2626' : 'var(--tx3)', fontWeight: vencido ? 700 : 400 }}>
              {' '}· {vencido ? 'venceu em ' : 'até '}{new Date(c.prazo + 'T12:00:00').toLocaleDateString('pt-BR')}
            </span>
          )}
        </div>
        <div style={{ color: 'var(--tx2)' }}>{c.texto}</div>
        {c.status_mentorado && <div style={{ fontSize: 11, color: 'var(--tx3)', marginTop: 4 }}>💬 {c.status_mentorado}</div>}
      </div>
    </label>
  )
}

function SecaoSessoesAvulsas() {
  const { data: sessoes = [], isLoading } = useSessoesAvulsas()
  const criar = useCriarSessaoMentoria()
  const excluir = useExcluirSessaoMentoria()
  const [form, setForm] = useState({ nome_avulso: '', data: new Date().toLocaleDateString('en-CA'), nota: '', combinados: '' })
  const [itens, setItens] = useState([])

  async function salvar() {
    if (!form.nome_avulso.trim() || !form.nota.trim()) return
    await criar.mutateAsync({ ...form, itens })
    setForm({ nome_avulso: '', data: new Date().toLocaleDateString('en-CA'), nota: '', combinados: '' })
    setItens([])
  }

  const fi = { padding: '7px 9px', border: '1px solid var(--bo)', borderRadius: 7, fontSize: 12, fontFamily: 'inherit' }

  return (
    <Card style={{ marginBottom: 16 }}>
      <CardHeader title={`Sessões avulsas (${sessoes.length})`} icon="fa-solid fa-user-clock" />
      <div style={{ padding: 16 }}>
        <div style={{ fontSize: 12, color: 'var(--tx3)', marginBottom: 12 }}>
          Pra quem comprou só uma sessão de mentoria e não virou mentorado oficial (sem 🎓 marcado).
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12, background: 'var(--bg2)', padding: 10, borderRadius: 8 }}>
          <input style={{ ...fi, flex: '1 1 160px' }} placeholder="Nome de quem participou" value={form.nome_avulso} onChange={e => setForm(f => ({ ...f, nome_avulso: e.target.value }))} />
          <input type="date" style={{ ...fi, flex: '0 0 140px' }} value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))} />
          <textarea style={{ ...fi, flex: '1 1 220px', minHeight: 44, resize: 'vertical' }} placeholder="O que foi conversado..." value={form.nota} onChange={e => setForm(f => ({ ...f, nota: e.target.value }))} />
          <textarea style={{ ...fi, flex: '1 1 220px', minHeight: 44, resize: 'vertical' }} placeholder="Contexto geral dos combinados (opcional)" value={form.combinados} onChange={e => setForm(f => ({ ...f, combinados: e.target.value }))} />
          <CombinadosDraftEditor itens={itens} setItens={setItens} />
          <Btn small variant="primary" disabled={criar.isPending || !form.nome_avulso.trim() || !form.nota.trim()} onClick={salvar}>
            {criar.isPending ? 'Salvando...' : '+ Registrar sessão avulsa'}
          </Btn>
        </div>

        {isLoading ? <Loader /> : sessoes.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--tx3)', fontSize: 12, padding: 20 }}>Nenhuma sessão avulsa registrada ainda.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {sessoes.map(s => (
              <div key={s.id} style={{ fontSize: 12, border: '1px solid var(--bo)', borderRadius: 8, padding: '8px 10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <span style={{ fontWeight: 700 }}>{s.nome_avulso} · {new Date(s.data + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                  <button onClick={() => excluir.mutate({ id: s.id })} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--tx3)', fontSize: 11 }}>🗑</button>
                </div>
                <div style={{ marginTop: 4 }}>{s.nota}</div>
                {s.combinados && <div style={{ marginTop: 4, color: 'var(--tx2)' }}><b>Contexto:</b> {s.combinados}</div>}
                <ListaCombinadosDaSessao combinados={s.mentoria_combinados} />
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  )
}

function FormTurma({ turma, acao }) {
  const [form, setForm] = useState({
    nome: turma?.nome || '',
    data_inicio: turma?.data_inicio || '',
    ativo: turma?.ativo !== false,
    checkout_url: turma?.checkout_url || '',
    grupo_whatsapp_url: turma?.grupo_whatsapp_url || '',
  })

  function salvar() {
    if (!form.nome.trim()) return
    acao.mutate({ action: 'salvar_turma', id: turma?.id, nome: form.nome, data_inicio: form.data_inicio || null, ativo: form.ativo, checkout_url: form.checkout_url || null, grupo_whatsapp_url: form.grupo_whatsapp_url || null })
  }

  const fi = { padding: '7px 10px', border: '1px solid var(--bo)', borderRadius: 8, fontSize: 12, fontFamily: 'inherit' }

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12, background: 'var(--bg2)', padding: 10, borderRadius: 8 }}>
      <input style={{ ...fi, flex: '1 1 200px' }} placeholder="Nome da turma (ex: Turma Agosto 2026)" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} />
      <input style={{ ...fi, flex: '0 0 160px' }} type="date" value={form.data_inicio} onChange={e => setForm(f => ({ ...f, data_inicio: e.target.value }))} />
      <input style={{ ...fi, flex: '1 1 240px' }} placeholder="Link de checkout (Kiwify)" value={form.checkout_url} onChange={e => setForm(f => ({ ...f, checkout_url: e.target.value }))} />
      <input style={{ ...fi, flex: '1 1 240px' }} placeholder="Link do grupo do WhatsApp" value={form.grupo_whatsapp_url} onChange={e => setForm(f => ({ ...f, grupo_whatsapp_url: e.target.value }))} />
      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
        <input type="checkbox" checked={form.ativo} onChange={e => setForm(f => ({ ...f, ativo: e.target.checked }))} /> Ativa
      </label>
      <Btn small variant="primary" disabled={acao.isPending || !form.nome.trim()} onClick={salvar}>
        {acao.isPending ? 'Salvando...' : turma ? 'Salvar turma' : 'Criar turma'}
      </Btn>
    </div>
  )
}

function LinhaAula({ aula, turmaId, acao }) {
  const [form, setForm] = useState({
    numero: aula.numero,
    titulo: aula.titulo,
    data: aula.data || '',
    exercicio: aula.exercicio || '',
    video_url: aula.video_url || '',
    material_url: aula.material_url || '',
  })
  const [confirmDel, setConfirmDel] = useState(false)
  const fi = { padding: '6px 8px', border: '1px solid var(--bo)', borderRadius: 6, fontSize: 12, fontFamily: 'inherit' }

  function salvar() {
    if (!form.titulo.trim() || !form.numero) return
    acao.mutate({ action: 'salvar_aula', id: aula.id, turma_id: turmaId, numero: Number(form.numero), titulo: form.titulo, data: form.data || null, exercicio: form.exercicio || null, video_url: form.video_url || null, material_url: form.material_url || null })
  }

  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', border: '1px solid var(--bo)', borderRadius: 8, padding: 8 }}>
      <input style={{ ...fi, width: 44 }} type="number" value={form.numero} onChange={e => setForm(f => ({ ...f, numero: e.target.value }))} />
      <input style={{ ...fi, flex: '1 1 160px' }} placeholder="Título" value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} />
      <input style={{ ...fi, flex: '0 0 130px' }} type="date" value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))} />
      <input style={{ ...fi, flex: '1 1 160px' }} placeholder="Exercício" value={form.exercicio} onChange={e => setForm(f => ({ ...f, exercicio: e.target.value }))} />
      <input style={{ ...fi, flex: '1 1 200px' }} placeholder="Link do vídeo (Google Drive)" value={form.video_url} onChange={e => setForm(f => ({ ...f, video_url: e.target.value }))} />
      <input style={{ ...fi, flex: '1 1 200px' }} placeholder="Link do material de apoio (PDF, slide...)" value={form.material_url} onChange={e => setForm(f => ({ ...f, material_url: e.target.value }))} />
      <Btn small variant="success" disabled={acao.isPending} onClick={salvar}>Salvar</Btn>
      {confirmDel ? (
        <>
          <Btn small variant="danger" disabled={acao.isPending} onClick={() => { acao.mutate({ action: 'excluir_aula', id: aula.id }); setConfirmDel(false) }}>Confirma?</Btn>
          <Btn small variant="outline" onClick={() => setConfirmDel(false)}>Cancelar</Btn>
        </>
      ) : (
        <button onClick={() => setConfirmDel(true)} title="Excluir aula" style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 13 }}>🗑️</button>
      )}
    </div>
  )
}

function NovaAulaForm({ turmaId, acao, proximoNumero }) {
  const [form, setForm] = useState({ numero: proximoNumero, titulo: '', data: '', exercicio: '', video_url: '', material_url: '' })
  const fi = { padding: '6px 8px', border: '1px solid var(--bo)', borderRadius: 6, fontSize: 12, fontFamily: 'inherit' }

  function salvar() {
    if (!form.titulo.trim() || !form.numero) return
    acao.mutate({ action: 'salvar_aula', turma_id: turmaId, numero: Number(form.numero), titulo: form.titulo, data: form.data || null, exercicio: form.exercicio || null, video_url: form.video_url || null, material_url: form.material_url || null }, {
      onSuccess: () => setForm({ numero: Number(form.numero) + 1, titulo: '', data: '', exercicio: '', video_url: '', material_url: '' }),
    })
  }

  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', border: '1px dashed var(--bo)', borderRadius: 8, padding: 8 }}>
      <input style={{ ...fi, width: 44 }} type="number" value={form.numero} onChange={e => setForm(f => ({ ...f, numero: e.target.value }))} />
      <input style={{ ...fi, flex: '1 1 160px' }} placeholder="Título da nova aula" value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} />
      <input style={{ ...fi, flex: '0 0 130px' }} type="date" value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))} />
      <input style={{ ...fi, flex: '1 1 160px' }} placeholder="Exercício" value={form.exercicio} onChange={e => setForm(f => ({ ...f, exercicio: e.target.value }))} />
      <input style={{ ...fi, flex: '1 1 200px' }} placeholder="Link do vídeo (Google Drive)" value={form.video_url} onChange={e => setForm(f => ({ ...f, video_url: e.target.value }))} />
      <input style={{ ...fi, flex: '1 1 200px' }} placeholder="Link do material de apoio (PDF, slide...)" value={form.material_url} onChange={e => setForm(f => ({ ...f, material_url: e.target.value }))} />
      <Btn small variant="primary" disabled={acao.isPending || !form.titulo.trim()} onClick={salvar}>+ Adicionar aula</Btn>
    </div>
  )
}

function SecaoTurmaGrupo() {
  const { data, isLoading } = useAdminTurma()
  const acao = useAdminAcaoEmpresa()
  const turma = data?.turma
  const aulas = data?.aulas ?? []

  return (
    <Card style={{ marginBottom: 16 }}>
      <CardHeader title="Turma da Mentoria em Grupo" icon="fa-solid fa-chalkboard-user" />
      <div style={{ padding: 16 }}>
        <div style={{ fontSize: 12, color: 'var(--tx3)', marginBottom: 12 }}>
          Só uma turma ativa por vez aparece na página pública (fluxebpo.com.br/mentoriaBPOlucrativo) e dentro do Fluxe pros alunos marcados como 🎓.
        </div>
        {isLoading ? <Loader /> : (
          <>
            <FormTurma key={turma?.id || 'nova'} turma={turma} acao={acao} />
            {turma && (
              <>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--tx2)', margin: '16px 0 8px' }}>Aulas ({aulas.length})</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                  {aulas.map(a => <LinhaAula key={a.id} aula={a} turmaId={turma.id} acao={acao} />)}
                </div>
                <NovaAulaForm turmaId={turma.id} acao={acao} proximoNumero={aulas.length + 1} />
              </>
            )}
          </>
        )}
      </div>
    </Card>
  )
}

function NovoMaterialApoioForm({ salvar }) {
  const [tipo, setTipo] = useState('link')
  const [form, setForm] = useState({ etapa: ETAPAS_BPO[0].v, titulo: '', descricao: '', url: '' })
  const [arquivo, setArquivo] = useState(null)
  const fi = { padding: '7px 10px', border: '1px solid var(--bo)', borderRadius: 8, fontSize: 12, fontFamily: 'inherit' }
  const podeSalvar = form.titulo.trim() && (tipo === 'link' ? form.url.trim() : !!arquivo)

  function enviar() {
    salvar.mutate({ etapa: form.etapa, titulo: form.titulo, descricao: form.descricao || null, url: tipo === 'link' ? form.url : null, arquivo: tipo === 'arquivo' ? arquivo : null }, {
      onSuccess: () => { setForm({ etapa: form.etapa, titulo: '', descricao: '', url: '' }); setArquivo(null) },
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16, background: 'var(--bg2)', padding: 10, borderRadius: 8 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <select style={{ ...fi, flex: '0 0 180px' }} value={form.etapa} onChange={e => setForm(f => ({ ...f, etapa: e.target.value }))}>
          {ETAPAS_BPO.map(e => <option key={e.v} value={e.v}>{e.label}</option>)}
        </select>
        <input style={{ ...fi, flex: '1 1 220px' }} placeholder="Título (ex: Kit de Planilhas do Mentorado)" value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} />
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={() => setTipo('link')} style={{ flex: '0 0 90px', padding: '7px 10px', borderRadius: 8, border: tipo === 'link' ? '2px solid #6366F1' : '1px solid var(--bo)', background: tipo === 'link' ? 'rgba(99,102,241,.08)' : 'transparent', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>🔗 Link</button>
        <button onClick={() => setTipo('arquivo')} style={{ flex: '0 0 100px', padding: '7px 10px', borderRadius: 8, border: tipo === 'arquivo' ? '2px solid #6366F1' : '1px solid var(--bo)', background: tipo === 'arquivo' ? 'rgba(99,102,241,.08)' : 'transparent', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>📎 Arquivo</button>
        {tipo === 'link' ? (
          <input style={{ ...fi, flex: 1 }} placeholder="Link (https://...)" value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} />
        ) : (
          <input type="file" style={{ ...fi, flex: 1 }} onChange={e => setArquivo(e.target.files?.[0] || null)} />
        )}
      </div>
      <textarea style={{ ...fi, minHeight: 50, resize: 'vertical' }} placeholder="Descrição (opcional)" value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} />
      <div>
        <Btn small variant="primary" disabled={salvar.isPending || !podeSalvar} onClick={enviar}>
          {salvar.isPending ? 'Enviando...' : '+ Adicionar material'}
        </Btn>
      </div>
    </div>
  )
}

function SecaoMateriaisApoio() {
  const { data: materiais = [], isLoading } = useAdminMateriaisApoio()
  const salvar = useSalvarMaterialApoio()
  const excluir = useExcluirMaterialApoio()
  const [confirmDel, setConfirmDel] = useState(null)
  const grupos = ETAPAS_BPO.map(e => ({ ...e, itens: materiais.filter(m => m.etapa === e.v) })).filter(g => g.itens.length > 0)

  return (
    <Card style={{ marginBottom: 16 }}>
      <CardHeader title="Materiais de Apoio" icon="fa-solid fa-book-open" />
      <div style={{ padding: 16 }}>
        <div style={{ fontSize: 12, color: 'var(--tx3)', marginBottom: 12 }}>
          Biblioteca de materiais (planilhas, PDFs, links) organizada por etapa do ciclo do cliente — visível pra todo mentorado, dentro do Fluxe.
        </div>
        {isLoading ? <Loader /> : (
          <>
            <NovoMaterialApoioForm salvar={salvar} />
            {grupos.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--tx3)', fontSize: 12, padding: 20 }}>Nenhum material cadastrado ainda.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {grupos.map(g => (
                  <div key={g.v}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--tx2)', textTransform: 'uppercase', marginBottom: 6 }}>{g.label}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {g.itens.map(m => (
                        <div key={m.id} style={{ border: '1px solid var(--bo)', borderRadius: 8, padding: '8px 10px', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                          <div style={{ fontSize: 15, marginTop: 1 }}>{m.arquivo_path ? '📎' : '🔗'}</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 600 }}>{m.titulo}</div>
                            {m.descricao && <div style={{ fontSize: 11, color: 'var(--tx2)', marginTop: 2 }}>{m.descricao}</div>}
                          </div>
                          {confirmDel === m.id ? (
                            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                              <Btn small variant="danger" onClick={() => { excluir.mutate(m.id); setConfirmDel(null) }}>Excluir</Btn>
                              <Btn small variant="outline" onClick={() => setConfirmDel(null)}>Cancelar</Btn>
                            </div>
                          ) : (
                            <button onClick={() => setConfirmDel(m.id)} style={{ flexShrink: 0, border: 'none', background: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: 13 }}>🗑</button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
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
      <SecaoMentorados />
      <SecaoCombinadosAbertos />
      <SecaoSessoesAvulsas />
      <SecaoTurmaGrupo />
      <SecaoMateriaisApoio />
      <SecaoEmpresas />
      <SecaoBugs />
    </div>
  )
}
