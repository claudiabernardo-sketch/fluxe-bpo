import { useLeads, useCreateLead, useUpdateLead, useConvertLeadToClient } from '../hooks/useData'
import { Card, Loader, EmptyState, Btn, fmtR } from '../components/ui'
import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

const ETAPAS = [
  { id:'novo',        label:'Lead novo',   color:'#94A3B8', icon:'🆕' },
  { id:'contato',     label:'Contato',     color:'#8B5CF6', icon:'📞' },
  { id:'diagnostico', label:'Diagnóstico', color:'#06B6D4', icon:'🔍' },
  { id:'proposta',    label:'Proposta',    color:'#F59E0B', icon:'📄' },
  { id:'fechado',     label:'Fechado',     color:'#22C55E', icon:'✅' },
  { id:'perdido',     label:'Perdido',     color:'#EF4444', icon:'❌' },
]

const MOTIVOS_PERDA = [
  { id:'preco',        label:'💰 Preço alto' },
  { id:'concorrente',  label:'🏃 Foi para concorrente' },
  { id:'sumiu',        label:'😶 Sem resposta / sumiu' },
  { id:'momento',      label:'🕐 Não é o momento' },
  { id:'escopo',       label:'🔧 Escopo não atende' },
  { id:'outro',        label:'📝 Outro' },
]

// Templates por etapa — {nome} e {empresa} são substituídos pelos dados do lead
const TEMPLATES_ETAPA = {
  novo: [
    {
      id: 'abordagem_fria',
      label: '🤝 Primeiro contato',
      texto: `Olá, {nome}! Tudo bem?

Sou {minhaNome} da {minhaEmpresa}, BPO Financeiro especializado em organizar e automatizar o financeiro de empresas como a {empresa}.

Vi que vocês atuam em {segmento} e acredito que posso ajudar a reduzir o tempo gasto com contas a pagar, conciliação bancária e relatórios gerenciais.

Teria 15 minutinhos esta semana para uma conversa rápida?`,
    },
  ],
  contato: [
    {
      id: 'confirmar_reuniao',
      label: '📅 Confirmar reunião de diagnóstico',
      texto: `Olá, {nome}! Tudo bem?

Passando para confirmar nossa conversa sobre o financeiro da {empresa}.

Data e horário: [PREENCHER]
Link / local: [PREENCHER]

Vou preparar algumas perguntas para entender melhor a operação de vocês e ver como posso ajudar. Confirma presença?`,
    },
  ],
  diagnostico: [
    {
      id: 'envio_proposta',
      label: '📄 Envio de proposta',
      texto: `Olá, {nome}! Tudo bem?

Conforme conversamos, segue a proposta de serviços de BPO Financeiro para a {empresa}:

[LINK DA PROPOSTA]

Em resumo, o escopo inclui:
• Conciliação bancária mensal
• Gestão de contas a pagar e a receber
• Relatórios gerenciais mensais
• [OUTROS SERVIÇOS]

Investimento: R$ {valor}/mês

Qualquer dúvida, estou à disposição. O que acha?`,
    },
  ],
  proposta: [
    {
      id: 'followup_proposta',
      label: '🔔 Follow-up da proposta',
      texto: `Olá, {nome}! Tudo bem?

Passando para saber se você teve a chance de analisar a proposta que enviei para a {empresa}.

Fico à disposição para esclarecer qualquer dúvida ou ajustar algum ponto do escopo. O que achou?`,
    },
    {
      id: 'followup_2',
      label: '⏰ Último contato',
      texto: `Olá, {nome}!

Tentei falar com você algumas vezes sobre a proposta para a {empresa}, mas não consegui retorno.

Vou encerrar o processo de contato por agora para não ser inconveniente. Se no futuro precisar de apoio no financeiro, estarei à disposição.

Sucesso nos projetos! 🤝`,
    },
    {
      id: 'cobranca_aprovacao',
      label: '✍️ Cobrar aprovação pendente',
      texto: `Olá, {nome}! Tudo bem?

Ainda aguardo sua confirmação para dar início aos serviços de BPO Financeiro na {empresa}.

Para começarmos, precisamos apenas da sua aprovação. Podemos avançar?`,
    },
  ],
  fechado: [
    {
      id: 'boas_vindas',
      label: '🎉 Boas-vindas e próximos passos',
      texto: `Olá, {nome}! Seja muito bem-vindo(a)!

Estou muito feliz em ter a {empresa} como cliente da {minhaEmpresa}!

Nossos próximos passos:
1. Vou te enviar o contrato para assinatura
2. Precisarei de alguns acessos (internet banking, sistema)
3. Agendamos uma reunião de kickoff

Alguma dúvida ou ponto que queira alinhar antes de começarmos?`,
    },
    {
      id: 'solicitar_assinatura',
      label: '📝 Solicitar assinatura de contrato',
      texto: `Olá, {nome}!

Segue o contrato de prestação de serviços de BPO Financeiro para a {empresa}:

[LINK DO CONTRATO]

Assim que assinado, já posso dar início ao onboarding. Qualquer dúvida sobre os termos, fico à disposição!`,
    },
    {
      id: 'solicitar_acesso',
      label: '🔑 Solicitar acessos',
      texto: `Olá, {nome}!

Para iniciarmos o trabalho na {empresa}, precisarei dos seguintes acessos:

• Internet banking (acesso de consulta ou operacional)
• Sistema financeiro ([OMIE / CONTA AZUL / OUTRO])
• Portal de emissão de NF (se aplicável)

Você consegue providenciar até [DATA]? Se preferir, podemos fazer uma chamada rápida para configurar juntos.`,
    },
  ],
}

function formatCNPJ(v) {
  const d = v.replace(/\D/g, '').slice(0, 14)
  return d
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
}

function displayCNPJ(raw = '') {
  const d = raw.replace(/\D/g, '')
  return d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
}

function diasAte(dateStr) {
  if (!dateStr) return null
  const hoje = new Date(); hoje.setHours(0,0,0,0)
  const alvo = new Date(dateStr + 'T12:00:00')
  return Math.round((alvo - hoje) / 86400000)
}

export default function CRMPage() {
  const { data: leads = [], isLoading } = useLeads()
  const create  = useCreateLead()
  const update  = useUpdateLead()
  const convert = useConvertLeadToClient()
  const nav     = useNavigate()

  const [modal, setModal]             = useState(false)
  const [form, setForm]               = useState({})
  const [editId, setEditId]           = useState(null)
  const [erro, setErro]               = useState('')
  const [cnpjBusy, setCnpjBusy]       = useState(false)
  const [cnpjErro, setCnpjErro]       = useState('')
  const [convertErro, setConvertErro] = useState('')
  const [perdaModal, setPerdaModal]   = useState(null) // { id, nome, nextEtapa }
  const [perdaForm, setPerdaForm]     = useState({ motivo:'', obs:'' })
  const [view, setView]               = useState('kanban')
  const [templateModal, setTemplateModal] = useState(null) // { lead, template }
  const [templateCopiado, setTemplateCopiado] = useState(false)

  function abrirTemplate(lead, template) {
    const { empresa: emp } = useAuthStore.getState()
    const texto = template.texto
      .replace(/{nome}/g, lead.contato || lead.nome || '')
      .replace(/{empresa}/g, lead.fantasia || lead.nome || '')
      .replace(/{segmento}/g, lead.segmento || '[segmento]')
      .replace(/{valor}/g, lead.valor_estimado ? fmtR(lead.valor_estimado).replace('R$\u00a0','').trim() : '[valor]')
      .replace(/{minhaNome}/g, emp?.responsavel_nome || '[seu nome]')
      .replace(/{minhaEmpresa}/g, emp?.nome || 'Fluxe BPO')
    setTemplateModal({ lead, texto })
    setTemplateCopiado(false)
  }

  function copiarTemplate() {
    navigator.clipboard.writeText(templateModal.texto).then(() => {
      setTemplateCopiado(true)
      setTimeout(() => setTemplateCopiado(false), 2500)
    })
  }

  function abrirWhatsApp() {
    const num = templateModal.lead.whatsapp?.replace(/\D/g, '')
    if (!num) { alert('Número de WhatsApp não cadastrado neste lead.'); return }
    const texto = encodeURIComponent(templateModal.texto)
    window.open(`https://wa.me/55${num}?text=${texto}`, '_blank')
  }

  // ── Métricas (hooks devem ficar antes de qualquer early return) ──
  const ativos     = useMemo(() => leads.filter(l => l.etapa !== 'perdido' && l.etapa !== 'convertido'), [leads])
  const fechados   = useMemo(() => leads.filter(l => l.etapa === 'fechado'  || l.etapa === 'convertido'), [leads])
  const perdidos   = useMemo(() => leads.filter(l => l.etapa === 'perdido'), [leads])
  const totalAtivo = useMemo(() => ativos.reduce((a, l) => a + (l.valor_estimado || 0), 0), [ativos])
  const totalFech  = useMemo(() => fechados.reduce((a, l) => a + (l.valor_estimado || 0), 0), [fechados])
  const txConv     = leads.length > 0 ? Math.round((fechados.length / leads.length) * 100) : 0
  const followUpsHoje = useMemo(() => ativos.filter(l => { const d = diasAte(l.proximo_contato); return d !== null && d <= 0 }), [ativos])
  const motivosAgrup  = useMemo(() => {
    const map = {}
    perdidos.forEach(l => { const m = l.motivo_perda || 'outro'; map[m] = (map[m] || 0) + 1 })
    return Object.entries(map).sort((a,b) => b[1]-a[1])
  }, [perdidos])

  if (isLoading) return <Loader />

  function setF(k, v) { setForm(f => ({ ...f, [k]: v })) }

  function openNew() {
    setEditId(null); setForm({}); setErro(''); setCnpjErro(''); setModal('new')
  }

  function openEdit(lead) {
    setEditId(lead.id)
    setForm({
      nome: lead.nome || '', fantasia: lead.fantasia || '',
      cnpj: lead.cnpj ? formatCNPJ(lead.cnpj) : '',
      contato: lead.contato || '', whatsapp: lead.whatsapp || '',
      segmento: lead.segmento || '', valor_estimado: lead.valor_estimado || '',
      etapa: lead.etapa || 'novo', obs: lead.obs || '',
      proximo_contato: lead.proximo_contato || '',
    })
    setErro(''); setCnpjErro(''); setModal('edit')
  }

  function closeModal() {
    setModal(false); setForm({}); setEditId(null); setErro(''); setCnpjErro('')
  }

  async function buscarCNPJ() {
    const cnpj = (form.cnpj || '').replace(/\D/g, '')
    if (cnpj.length !== 14) { setCnpjErro('CNPJ inválido — deve ter 14 dígitos'); return }
    setCnpjErro(''); setCnpjBusy(true)
    try {
      const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`)
      if (!res.ok) throw new Error('CNPJ não encontrado na Receita Federal')
      const d = await res.json()
      const segmento = d.cnae_fiscal_descricao || d.descricao_atividade_principal?.[0]?.text || ''
      setForm(f => ({
        ...f,
        nome: d.razao_social || f.nome,
        fantasia: d.nome_fantasia || '',
        segmento: segmento.slice(0, 80),
        contato: d.nome_fantasia || d.razao_social || f.contato || '',
        whatsapp: d.ddd_telefone_1
          ? d.ddd_telefone_1.replace(/\D/g, '').replace(/^(\d{2})(\d+)/, '($1) $2')
          : f.whatsapp || '',
      }))
    } catch (e) {
      setCnpjErro(e.message || 'Erro ao consultar Receita Federal')
    } finally { setCnpjBusy(false) }
  }

  async function save() {
    if (!form.nome) { setErro('Informe o nome / empresa'); return }
    setErro('')
    const cnpjDigits = (form.cnpj || '').replace(/\D/g, '')
    const payload = {
      nome: form.nome,
      ...(cnpjDigits    ? { cnpj: cnpjDigits }         : {}),
      ...(form.fantasia ? { fantasia: form.fantasia }   : {}),
      contato:        form.contato        || '',
      whatsapp:       form.whatsapp       || '',
      segmento:       form.segmento       || '',
      valor_estimado: parseFloat(form.valor_estimado) || 0,
      obs:            form.obs            || null,
      proximo_contato: form.proximo_contato || null,
    }
    try {
      if (modal === 'edit') {
        await update.mutateAsync({ id: editId, ...payload, etapa: form.etapa })
      } else {
        await create.mutateAsync({ ...payload, etapa: 'novo' })
      }
      closeModal()
    } catch (e) {
      setErro(e?.message || 'Erro ao salvar. Tente novamente.')
    }
  }

  function tentarAvancar(lead, nextEtapa) {
    if (nextEtapa === 'perdido') {
      setPerdaForm({ motivo: '', obs: '' })
      setPerdaModal({ id: lead.id, nome: lead.nome })
    } else {
      update.mutate({ id: lead.id, etapa: nextEtapa })
    }
  }

  async function confirmarPerda() {
    if (!perdaForm.motivo) { alert('Selecione o motivo da perda.'); return }
    await update.mutateAsync({
      id: perdaModal.id,
      etapa: 'perdido',
      motivo_perda: perdaForm.motivo,
      obs: perdaForm.obs || null,
      perdido_em: new Date().toISOString(),
    })
    setPerdaModal(null)
  }

  async function handleConvert(lead) {
    if (!window.confirm(`Converter "${lead.nome}" em cliente?`)) return
    setConvertErro('')
    try {
      await convert.mutateAsync(lead)
      window.location.href = '/clientes'
    } catch (e) {
      setConvertErro(e?.message || 'Erro ao converter.')
    }
  }

  function abrirPrecificacao(lead) {
    // Abre precificação com dados do lead no sessionStorage
    sessionStorage.setItem('crm_lead_precif', JSON.stringify({
      nome: lead.nome || lead.fantasia || '',
      segmento: lead.segmento || '',
      valor_estimado: lead.valor_estimado || 0,
    }))
    nav('/precificacao')
  }

  const inputStyle = { width:'100%', padding:'8px 10px', border:'1px solid #E2E8F0', borderRadius:8, fontSize:12, fontFamily:'inherit', boxSizing:'border-box' }
  const labelStyle = { fontSize:10, fontWeight:700, color:'#94A3B8', display:'block', marginBottom:4, textTransform:'uppercase', letterSpacing:'.07em' }
  const isSaving = create.isPending || update.isPending

  return (
    <div>
      {/* ── Métricas topo ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:10, marginBottom:16 }}>
        {[
          { label:'Pipeline ativo', value: fmtR(totalAtivo), sub:`${ativos.length} leads`, color:'#6366F1' },
          { label:'MRR fechado', value: fmtR(totalFech), sub:`${fechados.length} clientes`, color:'#22C55E' },
          { label:'Taxa de conversão', value:`${txConv}%`, sub:`${perdidos.length} perdidos`, color:'#F59E0B' },
          { label:'Follow-ups hoje', value: followUpsHoje.length, sub: followUpsHoje.length > 0 ? '⚠ ligar agora' : 'em dia', color: followUpsHoje.length > 0 ? '#EF4444' : '#22C55E' },
        ].map(m => (
          <div key={m.label} style={{ background:'#fff', border:'1px solid #E2E8F0', borderRadius:10, padding:'10px 14px' }}>
            <div style={{ fontSize:10, color:'#94A3B8', fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em', marginBottom:4 }}>{m.label}</div>
            <div style={{ fontSize:20, fontWeight:700, color:m.color }}>{m.value}</div>
            <div style={{ fontSize:10, color:'#94A3B8', marginTop:2 }}>{m.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Follow-ups vencidos ── */}
      {followUpsHoje.length > 0 && (
        <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:10, padding:'10px 14px', marginBottom:12, fontSize:12, color:'#DC2626' }}>
          ⚠ <strong>{followUpsHoje.length} follow-up{followUpsHoje.length > 1 ? 's' : ''} vencido{followUpsHoje.length > 1 ? 's' : ''}:</strong>{' '}
          {followUpsHoje.map(l => l.nome).join(', ')}
        </div>
      )}

      {convertErro && (
        <div style={{ marginBottom:12, padding:'10px 14px', background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:8, fontSize:12, color:'#DC2626' }}>⚠ {convertErro}</div>
      )}

      {/* ── Barra de ações ── */}
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
        <div style={{ display:'flex', border:'1px solid #E2E8F0', borderRadius:8, overflow:'hidden' }}>
          {[['kanban','⬛ Kanban'],['lista','☰ Lista']].map(([v,l]) => (
            <button key={v} onClick={() => setView(v)}
              style={{ padding:'6px 14px', border:'none', cursor:'pointer', fontSize:11, fontWeight:600,
                background: view===v ? '#6366F1' : '#fff', color: view===v ? '#fff' : '#64748B' }}>
              {l}
            </button>
          ))}
        </div>
        <div style={{ flex:1 }} />
        <Btn variant="primary" onClick={openNew}>+ Novo lead</Btn>
      </div>

      {/* ══ KANBAN ══ */}
      {view === 'kanban' && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:10, overflowX:'auto' }}>
          {ETAPAS.map(et => {
            const etLeads = leads.filter(l =>
              et.id === 'fechado' ? (l.etapa === 'fechado' || l.etapa === 'convertido') : l.etapa === et.id
            )
            const mrr = etLeads.reduce((a, l) => a + (l.valor_estimado || 0), 0)
            return (
              <div key={et.id} style={{ background:'#F8FAFC', borderRadius:10, border:'1px solid #E2E8F0', minWidth:140 }}>
                <div style={{ padding:'8px 10px', borderBottom:'1px solid #E2E8F0' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                    <div style={{ width:8, height:8, borderRadius:'50%', background:et.color, flexShrink:0 }} />
                    <span style={{ fontSize:10, fontWeight:700, color:'#334155', flex:1 }}>{et.label}</span>
                    <span style={{ fontSize:9, background:'#E2E8F0', color:'#475569', padding:'1px 5px', borderRadius:99 }}>{etLeads.length}</span>
                  </div>
                  {mrr > 0 && <div style={{ fontSize:9, color:'#15803D', fontWeight:600, marginTop:3 }}>{fmtR(mrr)}/mês</div>}
                </div>
                <div style={{ padding:6, display:'flex', flexDirection:'column', gap:6, minHeight:80 }}>
                  {etLeads.map(l => {
                    const isConvertido = l.etapa === 'convertido'
                    const diasFU = diasAte(l.proximo_contato)
                    const fuVencido = diasFU !== null && diasFU <= 0
                    const fuHoje    = diasFU === 0
                    return (
                      <div key={l.id} style={{ background:'#fff', borderRadius:8, padding:'8px 10px',
                        border: isConvertido ? '1px solid #BBF7D0' : fuVencido ? '1px solid #FECACA' : '1px solid #E2E8F0',
                        fontSize:11 }}>
                        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:4 }}>
                          <div style={{ fontWeight:600, color:'#0F172A', marginBottom:2, flex:1, lineHeight:1.3 }}>{l.nome}</div>
                          {!isConvertido && (
                            <button onClick={() => openEdit(l)} title="Editar"
                              style={{ background:'none', border:'none', cursor:'pointer', color:'#94A3B8', fontSize:11, padding:'0 2px', lineHeight:1, flexShrink:0 }}>✎</button>
                          )}
                        </div>
                        {l.segmento && <div style={{ color:'#94A3B8', fontSize:10, marginBottom:2 }}>{l.segmento}</div>}
                        {l.valor_estimado > 0 && (
                          <div style={{ color:'#15803D', fontWeight:600, fontSize:10, marginTop:2 }}>{fmtR(l.valor_estimado)}/mês</div>
                        )}
                        {l.proximo_contato && (
                          <div style={{ fontSize:9, marginTop:4, fontWeight:600,
                            color: fuVencido ? '#EF4444' : fuHoje ? '#F59E0B' : '#64748B' }}>
                            {fuVencido ? '🔴 Follow-up vencido' : fuHoje ? '🟡 Ligar hoje' : `📅 ${new Date(l.proximo_contato+'T12:00:00').toLocaleDateString('pt-BR')}`}
                          </div>
                        )}
                        {l.motivo_perda && (
                          <div style={{ fontSize:9, color:'#EF4444', marginTop:3 }}>
                            {MOTIVOS_PERDA.find(m => m.id === l.motivo_perda)?.label || l.motivo_perda}
                          </div>
                        )}
                        <div style={{ display:'flex', gap:4, marginTop:6, flexWrap:'wrap' }}>
                          {et.id !== 'fechado' && et.id !== 'perdido' && (() => {
                            const nextIdx = ETAPAS.findIndex(e => e.id === et.id) + 1
                            const next = ETAPAS[nextIdx]
                            return next ? (
                              <button onClick={() => tentarAvancar(l, next.id)}
                                style={{ fontSize:9, padding:'2px 6px', border:'1px solid #E2E8F0', borderRadius:5, cursor:'pointer', background:'#fff', color:'#475569' }}>
                                → {next.label}
                              </button>
                            ) : null
                          })()}
                          {et.id !== 'fechado' && et.id !== 'perdido' && (
                            <button onClick={() => tentarAvancar(l, 'perdido')}
                              style={{ fontSize:9, padding:'2px 6px', border:'1px solid #FECACA', borderRadius:5, cursor:'pointer', background:'#FEF2F2', color:'#DC2626' }}>
                              Perdido
                            </button>
                          )}
                          {et.id !== 'perdido' && (
                            <button onClick={() => abrirPrecificacao(l)}
                              style={{ fontSize:9, padding:'2px 6px', border:'1px solid #DDD6FE', borderRadius:5, cursor:'pointer', background:'#EEF2FF', color:'#6366F1', fontWeight:600 }}>
                              💰 Proposta
                            </button>
                          )}
                          {TEMPLATES_ETAPA[l.etapa]?.length > 0 && (
                            <div style={{ position:'relative', display:'inline-block' }}>
                              <select
                                onChange={e => { if(e.target.value) { const t = TEMPLATES_ETAPA[l.etapa].find(x=>x.id===e.target.value); if(t) abrirTemplate(l,t); e.target.value=''; } }}
                                style={{ fontSize:9, padding:'2px 6px', border:'1px solid #BBF7D0', borderRadius:5, cursor:'pointer', background:'#F0FDF4', color:'#15803D', fontWeight:600, appearance:'none' }}
                                defaultValue="">
                                <option value="" disabled>💬 Mensagem</option>
                                {TEMPLATES_ETAPA[l.etapa].map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                              </select>
                            </div>
                          )}
                          {et.id === 'fechado' && !isConvertido && (
                            <button onClick={() => handleConvert(l)} disabled={convert.isPending}
                              style={{ fontSize:9, padding:'2px 8px', border:'1px solid #22C55E', borderRadius:5, cursor:'pointer', background:'#F0FDF4', color:'#15803D', fontWeight:600 }}>
                              ✦ Converter
                            </button>
                          )}
                          {isConvertido && (
                            <span style={{ fontSize:9, padding:'2px 8px', borderRadius:5, background:'#DCFCE7', color:'#15803D', fontWeight:700 }}>✓ Cliente</span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ══ LISTA ══ */}
      {view === 'lista' && (
        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          {leads.filter(l => l.etapa !== 'perdido').map(l => {
            const et = ETAPAS.find(e => e.id === l.etapa) || ETAPAS[0]
            const diasFU = diasAte(l.proximo_contato)
            const fuVencido = diasFU !== null && diasFU <= 0
            return (
              <div key={l.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px',
                background:'#fff', border:`1px solid ${fuVencido ? '#FECACA' : '#E2E8F0'}`, borderRadius:10 }}>
                <div style={{ width:10, height:10, borderRadius:'50%', background:et.color, flexShrink:0 }} />
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:600, fontSize:13, color:'#0F172A' }}>{l.nome}</div>
                  {l.segmento && <div style={{ fontSize:11, color:'#94A3B8' }}>{l.segmento}</div>}
                </div>
                <div style={{ fontSize:11, color:'#15803D', fontWeight:600, flexShrink:0 }}>{l.valor_estimado > 0 ? fmtR(l.valor_estimado)+'/mês' : '—'}</div>
                <div style={{ fontSize:10, padding:'2px 8px', borderRadius:99, fontWeight:700, background:et.color+'22', color:et.color, flexShrink:0 }}>{et.label}</div>
                {l.proximo_contato && (
                  <div style={{ fontSize:10, color: fuVencido ? '#EF4444' : '#64748B', flexShrink:0 }}>
                    {fuVencido ? '🔴' : '📅'} {new Date(l.proximo_contato+'T12:00:00').toLocaleDateString('pt-BR')}
                  </div>
                )}
                <button onClick={() => openEdit(l)}
                  style={{ border:'1px solid #E2E8F0', background:'#fff', borderRadius:6, padding:'4px 10px', cursor:'pointer', fontSize:11, color:'#475569', flexShrink:0 }}>
                  Editar
                </button>
                <button onClick={() => abrirPrecificacao(l)}
                  style={{ border:'1px solid #DDD6FE', background:'#EEF2FF', borderRadius:6, padding:'4px 10px', cursor:'pointer', fontSize:11, color:'#6366F1', fontWeight:600, flexShrink:0 }}>
                  💰 Proposta
                </button>
              </div>
            )
          })}
          {leads.filter(l => l.etapa !== 'perdido').length === 0 && (
            <div style={{ textAlign:'center', padding:'32px', color:'#94A3B8', fontSize:13 }}>Nenhum lead ativo ainda.</div>
          )}
        </div>
      )}

      {/* ══ PERDIDOS — ANÁLISE ══ */}
      {perdidos.length > 0 && (
        <div style={{ marginTop:20, background:'#FFF1F2', border:'1px solid #FECDD3', borderRadius:10, padding:'14px 16px' }}>
          <div style={{ fontWeight:700, fontSize:12, color:'#9F1239', marginBottom:10 }}>📊 Análise de perdas ({perdidos.length} leads)</div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {motivosAgrup.map(([motivo, qtd]) => {
              const label = MOTIVOS_PERDA.find(m => m.id === motivo)?.label || motivo
              return (
                <div key={motivo} style={{ background:'#fff', border:'1px solid #FECDD3', borderRadius:8, padding:'6px 12px', fontSize:11 }}>
                  <span style={{ fontWeight:700, color:'#DC2626' }}>{qtd}x </span>
                  <span style={{ color:'#9F1239' }}>{label}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ══ MODAL MOTIVO DE PERDA ══ */}
      {perdaModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1100 }}>
          <div style={{ background:'#fff', borderRadius:16, width:420, padding:24 }}>
            <div style={{ fontWeight:700, fontSize:15, marginBottom:4, color:'#DC2626' }}>❌ Marcar como perdido</div>
            <div style={{ fontSize:12, color:'#94A3B8', marginBottom:16 }}>"{perdaModal.nome}" — registre o motivo para melhorar sua prospecção.</div>
            <div style={{ marginBottom:12 }}>
              <label style={labelStyle}>Motivo da perda *</label>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {MOTIVOS_PERDA.map(m => (
                  <label key={m.id} style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:13, padding:'6px 10px', borderRadius:8,
                    background: perdaForm.motivo === m.id ? '#FEF2F2' : 'transparent',
                    border: `1px solid ${perdaForm.motivo === m.id ? '#FECACA' : '#E2E8F0'}` }}>
                    <input type="radio" name="motivo" value={m.id} checked={perdaForm.motivo === m.id}
                      onChange={() => setPerdaForm(f => ({...f, motivo: m.id}))} style={{ accentColor:'#EF4444' }} />
                    {m.label}
                  </label>
                ))}
              </div>
            </div>
            <div style={{ marginBottom:16 }}>
              <label style={labelStyle}>Observação (opcional)</label>
              <textarea value={perdaForm.obs} onChange={e => setPerdaForm(f => ({...f, obs:e.target.value}))}
                placeholder="O que aconteceu? Vai ajudar nas próximas abordagens."
                style={{ ...inputStyle, height:70, resize:'vertical' }} />
            </div>
            <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
              <Btn onClick={() => setPerdaModal(null)}>Cancelar</Btn>
              <Btn variant="primary" onClick={confirmarPerda} disabled={!perdaForm.motivo || update.isPending}
                style={{ background:'#EF4444', borderColor:'#EF4444' }}>
                {update.isPending ? 'Salvando…' : 'Confirmar perda'}
              </Btn>
            </div>
          </div>
        </div>
      )}

      {/* ══ MODAL NOVO/EDITAR LEAD ══ */}
      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
          <div style={{ background:'#fff', borderRadius:16, width:500, padding:24, maxHeight:'90vh', overflowY:'auto' }}>
            <div style={{ fontWeight:700, fontSize:15, marginBottom:4 }}>
              {modal === 'edit' ? 'Editar lead' : 'Novo lead'}
            </div>
            <div style={{ fontSize:11, color:'#94A3B8', marginBottom:20 }}>
              {modal === 'edit' ? 'Atualize os dados.' : 'Informe o CNPJ para buscar automaticamente, ou preencha manualmente.'}
            </div>

            <div style={{ marginBottom:14 }}>
              <label style={labelStyle}>CNPJ</label>
              <div style={{ display:'flex', gap:8 }}>
                <input value={form.cnpj || ''} onChange={e => { setCnpjErro(''); setF('cnpj', formatCNPJ(e.target.value)) }}
                  onKeyDown={e => e.key === 'Enter' && buscarCNPJ()}
                  placeholder="00.000.000/0001-00" style={{ ...inputStyle, flex:1, fontFamily:'monospace' }} />
                <button onClick={buscarCNPJ} disabled={cnpjBusy}
                  style={{ padding:'8px 14px', borderRadius:8, border:'none', cursor:cnpjBusy?'not-allowed':'pointer',
                    background:cnpjBusy?'#E2E8F0':'#6366F1', color:'#fff', fontSize:12, fontWeight:700, whiteSpace:'nowrap', flexShrink:0 }}>
                  {cnpjBusy ? 'Buscando…' : '🔍 Buscar'}
                </button>
              </div>
              {cnpjErro && <div style={{ fontSize:11, color:'#EF4444', marginTop:4 }}>{cnpjErro}</div>}
            </div>

            <div style={{ height:1, background:'#F1F5F9', margin:'4px 0 14px' }} />

            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {[
                ['nome',     'Razão Social / Nome *'],
                ['fantasia', 'Nome Fantasia'],
                ['contato',  'Nome do Contato'],
                ['whatsapp', 'WhatsApp'],
                ['segmento', 'Segmento / Atividade'],
              ].map(([k, l]) => (
                <div key={k}>
                  <label style={labelStyle}>{l}</label>
                  <input value={form[k] || ''} onChange={e => setF(k, e.target.value)} style={inputStyle} />
                </div>
              ))}

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                <div>
                  <label style={labelStyle}>MRR estimado (R$)</label>
                  <input type="number" value={form.valor_estimado || ''} onChange={e => setF('valor_estimado', e.target.value)}
                    placeholder="0" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>📅 Próximo follow-up</label>
                  <input type="date" value={form.proximo_contato || ''} onChange={e => setF('proximo_contato', e.target.value)} style={inputStyle} />
                </div>
              </div>

              <div>
                <label style={labelStyle}>📝 Observações</label>
                <textarea value={form.obs || ''} onChange={e => setF('obs', e.target.value)}
                  placeholder="O que foi falado? Dores do cliente, próximos passos..."
                  style={{ ...inputStyle, height:80, resize:'vertical' }} />
              </div>

              {modal === 'edit' && (
                <div>
                  <label style={labelStyle}>Etapa</label>
                  <select value={form.etapa || 'novo'} onChange={e => setF('etapa', e.target.value)} style={inputStyle}>
                    {ETAPAS.map(et => <option key={et.id} value={et.id}>{et.icon} {et.label}</option>)}
                  </select>
                </div>
              )}
            </div>

            {erro && (
              <div style={{ marginTop:12, padding:'8px 12px', background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:8, fontSize:12, color:'#DC2626' }}>
                {erro}
              </div>
            )}

            <div style={{ display:'flex', gap:8, marginTop:16, justifyContent:'flex-end' }}>
              <Btn onClick={closeModal}>Cancelar</Btn>
              <Btn variant="primary" onClick={save} disabled={isSaving}>
                {isSaving ? 'Salvando…' : modal === 'edit' ? 'Salvar' : 'Criar lead'}
              </Btn>
            </div>
          </div>
        </div>
      )}
      {/* ══ MODAL TEMPLATE DE MENSAGEM ══ */}
      {templateModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1200, padding:16 }}>
          <div style={{ background:'#fff', borderRadius:16, width:'100%', maxWidth:520, maxHeight:'85vh', display:'flex', flexDirection:'column' }}>
            <div style={{ padding:'14px 18px', borderBottom:'1px solid #E2E8F0', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div>
                <div style={{ fontWeight:700, fontSize:14 }}>💬 Mensagem pronta</div>
                <div style={{ fontSize:11, color:'#94A3B8', marginTop:2 }}>Edite antes de enviar se precisar</div>
              </div>
              <button onClick={() => setTemplateModal(null)} style={{ border:'none', background:'none', cursor:'pointer', fontSize:20, color:'#94A3B8' }}>×</button>
            </div>
            <div style={{ padding:'14px 18px', flex:1, overflowY:'auto' }}>
              <textarea value={templateModal.texto}
                onChange={e => setTemplateModal(m => ({...m, texto: e.target.value}))}
                style={{ width:'100%', minHeight:280, padding:'12px', border:'1px solid #E2E8F0', borderRadius:10, fontSize:13, fontFamily:'inherit', resize:'vertical', lineHeight:1.6, boxSizing:'border-box' }} />
            </div>
            <div style={{ padding:'12px 18px', borderTop:'1px solid #E2E8F0', display:'flex', gap:8, justifyContent:'flex-end', flexWrap:'wrap' }}>
              <Btn onClick={() => setTemplateModal(null)}>Fechar</Btn>
              {templateModal.lead.whatsapp && (
                <button onClick={abrirWhatsApp}
                  style={{ padding:'8px 16px', borderRadius:8, border:'none', background:'#22C55E', color:'#fff', fontWeight:700, fontSize:12, cursor:'pointer' }}>
                  📱 Abrir no WhatsApp
                </button>
              )}
              <button onClick={copiarTemplate}
                style={{ padding:'8px 16px', borderRadius:8, border:'none',
                  background: templateCopiado ? '#6366F1' : '#0F172A',
                  color:'#fff', fontWeight:700, fontSize:12, cursor:'pointer' }}>
                {templateCopiado ? '✓ Copiado!' : '📋 Copiar mensagem'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
