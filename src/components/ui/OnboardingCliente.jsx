// ── OnboardingCliente ────────────────────────────────────────────────────
// Checklist operacional de onboarding por cliente — modelo baseado no que a
// Claudia usa de verdade com clientes novos (linha do tempo de 5 semanas,
// responsabilidades, canal de comunicação). Uma linha por cliente (upsert).
import { useState } from 'react'
import { useClienteOnboarding, useSalvarOnboarding } from '../../hooks/useData'
import { Loader } from './index'

const OBJETIVOS_PADRAO = [
  'Organização completa de todos os processos financeiros.',
  'Implementação da rotina financeira com clareza, previsibilidade e segurança.',
  'Criação de estrutura sustentável para acompanhar crescimento, lucros e decisões.',
  'Alinhamento e transparência sobre responsabilidades, entregas e fluxos.',
]

const ETAPAS_PADRAO = [
  { titulo: 'Kick-off & Acessos', descricao: 'Reunião inicial, alinhamento de expectativas e liberação de todos os acessos necessários.', data: '', concluido: false },
  { titulo: 'Mapeamento & Estruturação Interna', descricao: 'Análise do financeiro atual, organização de pastas e estruturação dos fluxos internos.', data: '', concluido: false },
  { titulo: 'Testes, Validações & Primeiros Relatórios', descricao: 'Testes de conciliação e envio dos primeiros relatórios experimentais.', data: '', concluido: false },
  { titulo: 'Go-live Oficial', descricao: 'Início da rotina financeira completa com todos os processos funcionando.', data: '', concluido: false },
  { titulo: 'Acompanhamento & Feedback', descricao: 'Monitoramento, correções e reunião de feedback para finalizar o onboarding.', data: '', concluido: false },
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
  const { data: onboarding, isLoading } = useClienteOnboarding(clienteId)
  const salvar = useSalvarOnboarding()
  const [form, setForm] = useState(null)
  const [saveOk, setSaveOk] = useState(false)

  if (!isLoading && form === null) {
    setForm({
      objetivosTexto: (onboarding?.objetivos?.length ? onboarding.objetivos : OBJETIVOS_PADRAO).join('\n'),
      etapas: onboarding?.etapas?.length ? onboarding.etapas : ETAPAS_PADRAO,
      respNossasTexto: (onboarding?.responsabilidades_nossas?.length ? onboarding.responsabilidades_nossas : RESP_NOSSAS_PADRAO).join('\n'),
      respClienteTexto: (onboarding?.responsabilidades_cliente?.length ? onboarding.responsabilidades_cliente : RESP_CLIENTE_PADRAO).join('\n'),
      canal_comunicacao: onboarding?.canal_comunicacao || '',
      erp_usado: onboarding?.erp_usado || '',
      email_padrao: onboarding?.email_padrao || '',
    })
  }

  if (isLoading || !form) return <Loader />

  const concluidas = form.etapas.filter(e => e.concluido).length

  function atualizarEtapa(i, patch) {
    setForm(f => ({ ...f, etapas: f.etapas.map((e, idx) => idx === i ? { ...e, ...patch } : e) }))
  }
  function adicionarEtapa() {
    setForm(f => ({ ...f, etapas: [...f.etapas, { titulo: '', descricao: '', data: '', concluido: false }] }))
  }
  function removerEtapa(i) {
    setForm(f => ({ ...f, etapas: f.etapas.filter((_, idx) => idx !== i) }))
  }

  async function salvarTudo() {
    await salvar.mutateAsync({
      clienteId,
      objetivos: linhasParaLista(form.objetivosTexto),
      etapas: form.etapas.filter(e => e.titulo.trim()),
      responsabilidades_nossas: linhasParaLista(form.respNossasTexto),
      responsabilidades_cliente: linhasParaLista(form.respClienteTexto),
      canal_comunicacao: form.canal_comunicacao,
      erp_usado: form.erp_usado,
      email_padrao: form.email_padrao,
    })
    setSaveOk(true)
    setTimeout(() => setSaveOk(false), 2000)
  }

  return (
    <div style={{ maxWidth: 800, display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Objetivos da parceria ── */}
      <div>
        <label className="lbl">Objetivos da parceria (um por linha)</label>
        <textarea className="fi" style={{ minHeight: 90, resize: 'vertical', width: '100%' }}
          value={form.objetivosTexto} onChange={e => setForm(f => ({ ...f, objetivosTexto: e.target.value }))} />
      </div>

      {/* ── Linha do tempo ── */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <label className="lbl" style={{ margin: 0 }}>Linha do tempo</label>
          <span style={{ fontSize: 11, color: 'var(--tx3)', fontWeight: 600 }}>{concluidas} de {form.etapas.length} concluídas</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {form.etapas.map((e, i) => (
            <div key={i} style={{ border: '1px solid var(--bo)', borderRadius: 8, padding: '10px 12px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <input type="checkbox" checked={!!e.concluido} onChange={ev => atualizarEtapa(i, { concluido: ev.target.checked })} style={{ marginTop: 6 }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input className="fi" style={{ flex: 1, fontWeight: 600 }} placeholder={`Etapa ${i + 1}`}
                    value={e.titulo} onChange={ev => atualizarEtapa(i, { titulo: ev.target.value })} />
                  <input className="fi" type="date" style={{ width: 150 }}
                    value={e.data || ''} onChange={ev => atualizarEtapa(i, { data: ev.target.value })} />
                  <button onClick={() => removerEtapa(i)} title="Remover etapa"
                    style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--tx3)' }}>×</button>
                </div>
                <input className="fi" placeholder="Descrição (opcional)"
                  value={e.descricao || ''} onChange={ev => atualizarEtapa(i, { descricao: ev.target.value })} />
              </div>
            </div>
          ))}
        </div>
        <button className="btn bp bsm" style={{ marginTop: 8 }} onClick={adicionarEtapa}>+ Etapa</button>
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
