// ── OnboardingCliente ────────────────────────────────────────────────────
// Pacote de onboarding por cliente — modelo baseado no que a Claudia usa de
// verdade com clientes novos (objetivos, responsabilidades, canal de
// comunicação). Uma linha por cliente (upsert). O checklist de etapas vira
// tarefas reais (categoria "Onboarding" já existente em Tarefas), em vez de
// duplicar o que a aba Tarefas já faz melhor (responsável, prazo, Central
// Operacional).
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useClienteOnboarding, useSalvarOnboarding, useCreateTask } from '../../hooks/useData'
import { Loader } from './index'

const OBJETIVOS_PADRAO = [
  'Organização completa de todos os processos financeiros.',
  'Implementação da rotina financeira com clareza, previsibilidade e segurança.',
  'Criação de estrutura sustentável para acompanhar crescimento, lucros e decisões.',
  'Alinhamento e transparência sobre responsabilidades, entregas e fluxos.',
]

const ETAPAS_PADRAO = [
  { titulo: 'Kick-off & Acessos', obs: 'Reunião inicial, alinhamento de expectativas e liberação de todos os acessos necessários.' },
  { titulo: 'Mapeamento & Estruturação Interna', obs: 'Análise do financeiro atual, organização de pastas e estruturação dos fluxos internos.' },
  { titulo: 'Testes, Validações & Primeiros Relatórios', obs: 'Testes de conciliação e envio dos primeiros relatórios experimentais.' },
  { titulo: 'Go-live Oficial', obs: 'Início da rotina financeira completa com todos os processos funcionando.' },
  { titulo: 'Acompanhamento & Feedback', obs: 'Monitoramento, correções e reunião de feedback para finalizar o onboarding.' },
]

const RESP_NOSSAS_PADRAO = [
  'Organização e registro financeiro',
  'Conciliação bancária',
  'Relatórios claros e estratégicos',
  'Acompanhamento próximo',
  'Suporte ativo durante a rotina',
]

const RESP_CLIENTE_PADRAO = [
  'Envio de documentos no prazo',
  'Liberação de acessos',
  'Alinhamento nas decisões necessárias',
  'Atualizar a equipe quando houver alterações internas',
]

function linhasParaLista(texto) {
  return texto.split('\n').map(l => l.trim()).filter(Boolean)
}

export default function OnboardingCliente({ clienteId }) {
  const navigate = useNavigate()
  const { data: onboarding, isLoading } = useClienteOnboarding(clienteId)
  const salvar = useSalvarOnboarding()
  const criarTarefa = useCreateTask()
  const [form, setForm] = useState(null)
  const [saveOk, setSaveOk] = useState(false)
  const [criandoTarefas, setCriandoTarefas] = useState(false)
  const [tarefasCriadas, setTarefasCriadas] = useState(false)

  if (!isLoading && form === null) {
    setForm({
      objetivosTexto: (onboarding?.objetivos?.length ? onboarding.objetivos : OBJETIVOS_PADRAO).join('\n'),
      respNossasTexto: (onboarding?.responsabilidades_nossas?.length ? onboarding.responsabilidades_nossas : RESP_NOSSAS_PADRAO).join('\n'),
      respClienteTexto: (onboarding?.responsabilidades_cliente?.length ? onboarding.responsabilidades_cliente : RESP_CLIENTE_PADRAO).join('\n'),
      canal_comunicacao: onboarding?.canal_comunicacao || '',
      erp_usado: onboarding?.erp_usado || '',
      email_padrao: onboarding?.email_padrao || '',
    })
  }

  if (isLoading || !form) return <Loader />

  async function salvarTudo() {
    await salvar.mutateAsync({
      clienteId,
      objetivos: linhasParaLista(form.objetivosTexto),
      responsabilidades_nossas: linhasParaLista(form.respNossasTexto),
      responsabilidades_cliente: linhasParaLista(form.respClienteTexto),
      canal_comunicacao: form.canal_comunicacao,
      erp_usado: form.erp_usado,
      email_padrao: form.email_padrao,
    })
    setSaveOk(true)
    setTimeout(() => setSaveOk(false), 2000)
  }

  async function criarTarefasDeOnboarding() {
    setCriandoTarefas(true)
    for (const etapa of ETAPAS_PADRAO) {
      await criarTarefa.mutateAsync({ titulo: etapa.titulo, obs: etapa.obs, categoria: 'Onboarding', status: 'aberta', cliente_id: clienteId })
    }
    setCriandoTarefas(false)
    setTarefasCriadas(true)
  }

  return (
    <div style={{ maxWidth: 800, display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Objetivos da parceria ── */}
      <div>
        <label className="lbl">Objetivos da parceria (um por linha)</label>
        <textarea className="fi" style={{ minHeight: 90, resize: 'vertical', width: '100%' }}
          value={form.objetivosTexto} onChange={e => setForm(f => ({ ...f, objetivosTexto: e.target.value }))} />
      </div>

      {/* ── Checklist de etapas → cria tarefas reais ── */}
      <div style={{ border: '1px solid var(--bo)', borderRadius: 10, padding: 14, background: 'var(--s2)' }}>
        <label className="lbl" style={{ margin: 0 }}>Checklist de onboarding (5 etapas)</label>
        <div style={{ fontSize: 12, color: 'var(--tx2)', margin: '6px 0 10px' }}>
          Kick-off & Acessos · Mapeamento & Estruturação Interna · Testes, Validações & Primeiros Relatórios · Go-live Oficial · Acompanhamento & Feedback
        </div>
        {tarefasCriadas ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 12, color: 'var(--grt)', fontWeight: 600 }}>✓ 5 tarefas criadas na categoria Onboarding</span>
            <button className="btn bp bsm" onClick={() => navigate('/tasks')}>Ver em Tarefas</button>
          </div>
        ) : (
          <button className="btn bp bsm" disabled={criandoTarefas} onClick={criarTarefasDeOnboarding}>
            {criandoTarefas ? 'Criando…' : '+ Criar as 5 tarefas de onboarding'}
          </button>
        )}
      </div>

      {/* ── Responsabilidades ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div>
          <label className="lbl">Nossas responsabilidades (uma por linha)</label>
          <textarea className="fi" style={{ minHeight: 100, resize: 'vertical', width: '100%' }}
            value={form.respNossasTexto} onChange={e => setForm(f => ({ ...f, respNossasTexto: e.target.value }))} />
        </div>
        <div>
          <label className="lbl">Responsabilidades do cliente (uma por linha)</label>
          <textarea className="fi" style={{ minHeight: 100, resize: 'vertical', width: '100%' }}
            value={form.respClienteTexto} onChange={e => setForm(f => ({ ...f, respClienteTexto: e.target.value }))} />
        </div>
      </div>

      {/* ── Comunicação e sistema ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
        <div>
          <label className="lbl">Canal oficial</label>
          <input className="fi" style={{ width: '100%' }} placeholder="Ex: WhatsApp ou e-mail"
            value={form.canal_comunicacao} onChange={e => setForm(f => ({ ...f, canal_comunicacao: e.target.value }))} />
        </div>
        <div>
          <label className="lbl">ERP / sistema usado</label>
          <input className="fi" style={{ width: '100%' }} placeholder="Ex: Conta Azul"
            value={form.erp_usado} onChange={e => setForm(f => ({ ...f, erp_usado: e.target.value }))} />
        </div>
        <div>
          <label className="lbl">E-mail padrão de atendimento</label>
          <input className="fi" style={{ width: '100%' }} placeholder="Ex: nome+cliente@empresa.com"
            value={form.email_padrao} onChange={e => setForm(f => ({ ...f, email_padrao: e.target.value }))} />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button className="btn bp" disabled={salvar.isPending} onClick={salvarTudo}>
          {salvar.isPending ? 'Salvando…' : 'Salvar onboarding'}
        </button>
        {saveOk && <span style={{ fontSize: 12, color: 'var(--grt)', fontWeight: 600 }}>✓ Salvo!</span>}
        {salvar.isError && <span style={{ fontSize: 11, color: 'var(--rdt)' }}>Erro ao salvar. Tenta de novo?</span>}
      </div>
    </div>
  )
}
