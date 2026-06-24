import { useLeads, useCreateLead, useUpdateLead, useConvertLeadToClient, useLeadInteracoes, useCreateLeadInteracao, useDeleteLeadInteracao, useCrmTemplates, useCreateCrmTemplate, useUpdateCrmTemplate, useDeleteCrmTemplate } from '../hooks/useData'
import { Card, Loader, EmptyState, Btn, fmtR } from '../components/ui'
import { useState, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

const getXLSX = () => import('xlsx')

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
    { id:'abordagem_fria', label:'🤝 Primeiro contato frio', texto:`Olá, {nome}! Tudo bem?

Meu nome é {minhaNome} e trabalho com gestão financeira para empresas.

Analisando o perfil da {empresa}, percebi que posso ajudar a organizar os processos financeiros, melhorar o controle do caixa e gerar mais previsibilidade para o negócio.

Gostaria de entender um pouco mais sobre sua operação. Teria 20 minutos nesta semana para uma conversa rápida?` },
    { id:'abordagem_indicacao', label:'🤝 Primeiro contato por indicação', texto:`Olá, {nome}!

Recebi seu contato por indicação e gostaria de me apresentar.

Trabalho com BPO Financeiro, apoiando empresários no controle financeiro, organização dos processos e geração de informações para tomada de decisão.

Podemos agendar uma conversa rápida para eu entender seu cenário atual?` },
  ],
  contato: [
    { id:'confirmar_reuniao', label:'📅 Confirmar reunião de diagnóstico', texto:`Olá, {nome}! Tudo bem?

Passando para confirmar nossa conversa sobre o financeiro da {empresa}.

Data e horário: [PREENCHER]
Link / local: [PREENCHER]

Preparei algumas perguntas para entender melhor a operação de vocês. Confirma presença?` },
  ],
  diagnostico: [
    { id:'envio_proposta', label:'📄 Envio de proposta', texto:`Olá, {nome}! Tudo bem?

Conforme conversamos, segue a proposta de serviços de BPO Financeiro para a {empresa}:

[LINK DA PROPOSTA]

Investimento: R$ {valor}/mês

Qualquer dúvida, estou à disposição. O que acha?` },
  ],
  proposta: [
    { id:'followup_proposta', label:'🔔 Follow-up da proposta', texto:`Olá, {nome}! Tudo bem?

Passando para verificar se conseguiu analisar a proposta enviada para a {empresa}.

Caso tenha alguma dúvida ou queira discutir algum ponto específico, estou à disposição.` },
    { id:'followup_2', label:'⏰ Último contato', texto:`Olá, {nome}!

Tentei falar com você algumas vezes sobre a proposta para a {empresa}, mas não consegui retorno.

Vou encerrar o processo de contato por agora para não ser inconveniente. Se no futuro precisar de apoio no financeiro, estarei à disposição.

Sucesso nos projetos! 🤝` },
    { id:'cobranca_aprovacao', label:'✍️ Cobrar aprovação pendente', texto:`Olá, {nome}! Tudo bem?

Ainda aguardo sua confirmação para dar início aos serviços de BPO Financeiro na {empresa}.

Para começarmos, precisamos apenas da sua aprovação. Podemos avançar?` },
  ],
  fechado: [
    { id:'boas_vindas', label:'🎉 Boas-vindas e próximos passos', texto:`Olá, {nome}! Seja muito bem-vindo(a)!

Estamos felizes em ter a {empresa} como cliente da {minhaEmpresa}!

Nossos próximos passos:
1. Vou te enviar o contrato para assinatura
2. Precisarei de alguns acessos (internet banking, sistema)
3. Agendamos uma reunião de kickoff

Alguma dúvida antes de começarmos?` },
    { id:'solicitar_assinatura', label:'📝 Solicitar assinatura de contrato', texto:`Olá, {nome}!

Segue o contrato de prestação de serviços de BPO Financeiro para a {empresa}:

[LINK DO CONTRATO]

Assim que assinado, já posso dar início ao onboarding!` },
    { id:'solicitar_acesso', label:'🔑 Solicitar acessos', texto:`Olá, {nome}!

Para iniciarmos o trabalho na {empresa}, precisarei dos seguintes acessos:

• Internet banking (consulta ou operacional)
• Sistema financeiro ([OMIE / CONTA AZUL / OUTRO])
• Portal de emissão de NF (se aplicável)

Você consegue providenciar até [DATA]?` },
  ],
}

const TEMPLATES_GLOBAIS = [
  { categoria:'📚 Educação', templates: [
    { id:'bpo_curto', label:'O que é BPO? (WhatsApp)', texto:`Olá, {nome}!

O BPO Financeiro funciona como um departamento financeiro terceirizado para sua empresa.

Cuidamos da organização financeira, fluxo de caixa, contas a pagar, contas a receber e relatórios gerenciais — dando mais controle e previsibilidade sobre os números do negócio.

Quer entender como isso funcionaria para a {empresa}?` },
    { id:'bpo_completo', label:'O que é BPO? (e-mail completo)', texto:`Olá, {nome}!

O BPO Financeiro é um departamento financeiro terceirizado para a {empresa}.

O que fazemos:
• Organização do fluxo de caixa
• Gestão de contas a pagar e a receber
• Conciliação bancária
• Emissão de notas fiscais
• Relatórios gerenciais mensais
• Reunião estratégica mensal

O que você ganha:
• Clareza sobre o caixa
• Previsibilidade para decisões
• Tempo livre para focar no crescimento
• Financeiro profissional sem custo CLT

Posso te mandar uma proposta personalizada?` },
  ]},
  { categoria:'🔍 Diagnóstico', templates: [
    { id:'perguntas_diagnostico', label:'📋 Roteiro de diagnóstico', texto:`Olá, {nome}! Antes da nossa reunião, me ajuda com algumas informações sobre a {empresa}?

1. Quantas contas bancárias a empresa tem?
2. Quantas notas fiscais emitem por mês, em média?
3. Usam algum sistema financeiro ou ERP hoje?
4. Quem cuida do financeiro hoje?
5. Qual a maior dificuldade com o financeiro atualmente?

Com isso já consigo preparar uma proposta bem ajustada! 😊` },
    { id:'pre_reuniao', label:'📅 Pré-reunião (WhatsApp)', texto:`Olá, {nome}! Confirmando nossa conversa de hoje.

Para aproveitar bem o tempo, me conta rapidinho:

• Qual o maior desafio financeiro da {empresa} hoje?
• Vocês já usam algum sistema financeiro?

Te vejo em breve! 👋` },
  ]},
  { categoria:'🛡 Objeções', templates: [
    { id:'obj_contador', label:'"Já tenho contador"', texto:`Perfeito, {nome}!

Na verdade, contador e BPO Financeiro têm funções complementares.

O contador cuida das obrigações fiscais e contábeis. O BPO atua na operação financeira do dia a dia — fluxo de caixa, pagamentos, relatórios gerenciais.

A maioria dos nossos clientes já tinha contador quando nos contratou.

Faz sentido conversarmos?` },
    { id:'obj_caro', label:'"É caro"', texto:`Entendo, {nome}!

Um auxiliar financeiro CLT custa em média R$ 2.500 a R$ 3.500/mês (salário + encargos + benefícios).

Com o BPO, você tem um time especializado por uma fração desse custo — sem vínculo empregatício e com experiência em múltiplos negócios.

Posso te mostrar uma simulação?` },
    { id:'obj_momento', label:'"Não é o momento"', texto:`Compreendo, {nome}!

O momento de organizar o financeiro é justamente quando parece que não há tempo — porque a bagunça financeira consome energia que deveria ir para o crescimento.

Não precisa ser agora. Quando fizer sentido, estarei aqui.

Posso te mandar um material para avaliar com calma?` },
    { id:'obj_pensar', label:'"Deixa eu pensar"', texto:`Claro, {nome}! Leva o tempo que precisar.

Se surgir alguma dúvida sobre escopo, valores ou como funciona na prática, pode me chamar a qualquer momento.

Combinado?` },
  ]},
]


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

const TIPOS_INTERACAO = [
  { id:'ligacao',  icon:'📞', label:'Ligação' },
  { id:'whatsapp', icon:'💬', label:'WhatsApp' },
  { id:'email',    icon:'📧', label:'Email' },
  { id:'reuniao',  icon:'👥', label:'Reunião' },
  { id:'nota',     icon:'📝', label:'Nota' },
]

function LinhaDoTempo({ lead }) {
  const { data: interacoes = [], isLoading } = useLeadInteracoes(lead.id)
  const criar = useCreateLeadInteracao()
  const deletar = useDeleteLeadInteracao()
  const [form, setForm] = useState({ tipo:'whatsapp', nota:'', proximo_contato:'' })
  const [expandido, setExpandido] = useState(false)

  async function salvar() {
    if (!form.nota.trim()) return
    await criar.mutateAsync({ lead_id: lead.id, ...form })
    setForm({ tipo:'whatsapp', nota:'', proximo_contato:'' })
  }

  const fi = { width:'100%', padding:'6px 8px', border:'1px solid #E2E8F0', borderRadius:6, fontSize:11, fontFamily:'inherit', boxSizing:'border-box' }

  return (
    <div style={{ marginTop:8, borderTop:'1px solid #F1F5F9', paddingTop:8 }}>
      <button onClick={() => setExpandido(e => !e)}
        style={{ background:'none', border:'none', cursor:'pointer', fontSize:10, color:'#6366F1', fontWeight:700, padding:0 }}>
        {expandido ? '▲ Fechar histórico' : `▼ Histórico${interacoes.length > 0 ? ` (${interacoes.length})` : ''}`}
      </button>

      {expandido && (
        <div style={{ marginTop:8 }}>
          {/* Form novo registro */}
          <div style={{ background:'#F8FAFC', borderRadius:8, padding:'8px', marginBottom:10, border:'1px solid #E2E8F0' }}>
            <div style={{ display:'flex', gap:4, marginBottom:6, flexWrap:'wrap' }}>
              {TIPOS_INTERACAO.map(t => (
                <button key={t.id} onClick={() => setForm(f => ({...f, tipo:t.id}))}
                  style={{ padding:'3px 8px', borderRadius:99, fontSize:10, cursor:'pointer', border:'none', fontWeight:600,
                    background: form.tipo===t.id ? '#6366F1' : '#E2E8F0',
                    color: form.tipo===t.id ? '#fff' : '#64748B' }}>
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
            <textarea value={form.nota} onChange={e => setForm(f => ({...f, nota:e.target.value}))}
              placeholder="O que aconteceu? O que o cliente disse?"
              style={{ ...fi, height:56, resize:'none', marginBottom:6 }} />
            <div style={{ display:'flex', gap:6, alignItems:'center' }}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:9, color:'#94A3B8', marginBottom:2 }}>Próximo follow-up</div>
                <input type="date" value={form.proximo_contato} onChange={e => setForm(f => ({...f, proximo_contato:e.target.value}))} style={fi} />
              </div>
              <button onClick={salvar} disabled={!form.nota.trim() || criar.isPending}
                style={{ padding:'6px 12px', borderRadius:6, border:'none', background:'#6366F1', color:'#fff', fontSize:10, fontWeight:700, cursor:'pointer', flexShrink:0, alignSelf:'flex-end' }}>
                {criar.isPending ? '...' : '+ Registrar'}
              </button>
            </div>
          </div>

          {/* Timeline */}
          {isLoading ? (
            <div style={{ fontSize:10, color:'#94A3B8', textAlign:'center', padding:'8px 0' }}>Carregando...</div>
          ) : interacoes.length === 0 ? (
            <div style={{ fontSize:10, color:'#94A3B8', textAlign:'center', padding:'8px 0' }}>Nenhuma interação registrada ainda.</div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {interacoes.map(i => {
                const tipo = TIPOS_INTERACAO.find(t => t.id === i.tipo) || TIPOS_INTERACAO[4]
                const data = new Date(i.criado_em).toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })
                return (
                  <div key={i.id} style={{ display:'flex', gap:8, alignItems:'flex-start' }}>
                    <span style={{ fontSize:14, flexShrink:0, marginTop:1 }}>{tipo.icon}</span>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:11, color:'#0F172A', lineHeight:1.4 }}>{i.nota}</div>
                      <div style={{ fontSize:9, color:'#94A3B8', marginTop:2 }}>{data}</div>
                    </div>
                    <button onClick={() => deletar.mutate({ id:i.id, lead_id:lead.id })}
                      style={{ border:'none', background:'none', cursor:'pointer', color:'#CBD5E1', fontSize:12, padding:0, flexShrink:0 }}>×</button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function CRMPage() {
  const { data: leads = [], isLoading } = useLeads()
  const create  = useCreateLead()
  const update  = useUpdateLead()
  const convert = useConvertLeadToClient()
  const nav     = useNavigate()

  const importRef = useRef()

  async function exportarLeads() {
    const XLSX = await getXLSX()
    const rows = leads.map(l => ({
      'Nome / Razão Social': l.nome || '',
      'CNPJ': l.cnpj || '',
      'Nome do Contato': l.contato || '',
      'WhatsApp': l.whatsapp || '',
      'Segmento / Atividade': l.segmento || '',
      'Etapa do Funil': ETAPAS.find(e => e.id === l.etapa)?.label || l.etapa || '',
      'Valor Mensal Estimado (R$)': l.valor_estimado || 0,
      'Próximo Follow-up': l.proximo_contato ? new Date(l.proximo_contato+'T12:00:00').toLocaleDateString('pt-BR') : '',
      'Observações': l.obs || '',
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '📤 Exportar Leads')
    ws['!cols'] = [22,18,20,18,22,20,22,18,30].map(w => ({ wch: w }))
    XLSX.writeFile(wb, `Fluxe_Leads_${new Date().toLocaleDateString('pt-BR').replace(/\//g,'-')}.xlsx`)
  }

  async function importarLeads(e) {
    const file = e.target.files[0]
    if (!file) return
    const XLSX = await getXLSX()
    const reader = new FileReader()
    reader.onload = async (ev) => {
      try {
        const wb = XLSX.read(ev.target.result, { type: 'array' })
        // Pega a primeira aba que tiver dados (ignora abas de instrução)
        const wsName = wb.SheetNames.find(n => !n.includes('Instrução') && !n.includes('📋')) || wb.SheetNames[0]
        const ws = wb.Sheets[wsName]
        const rows = XLSX.utils.sheet_to_json(ws, { defval: '' })
        
        const etapaMap = {
          'lead novo':'novo','contato':'contato','diagnóstico':'diagnostico',
          'diagnostico':'diagnostico','proposta':'proposta','fechado':'fechado','perdido':'perdido'
        }
        
        let importados = 0, erros = 0
        for (const row of rows) {
          const nome = row['Nome / Razão Social'] || row['nome'] || row['Nome'] || ''
          if (!nome || nome.toString().startsWith('⬇') || nome.toString().startsWith('✅')) continue
          const etapaRaw = (row['Etapa do Funil'] || row['etapa'] || 'novo').toString().toLowerCase().trim()
          const etapa = etapaMap[etapaRaw] || 'novo'
          const valor = parseFloat(String(row['Valor Mensal Estimado (R$)'] || row['valor'] || '0').replace(/[^0-9.,]/g,'').replace(',','.')) || 0
          try {
            await create.mutateAsync({
              nome: nome.toString(),
              cnpj: row['CNPJ']?.toString().replace(/\D/g,'') || null,
              contato: row['Nome do Contato']?.toString() || '',
              whatsapp: row['WhatsApp']?.toString() || '',
              segmento: row['Segmento / Atividade']?.toString() || '',
              etapa,
              valor_estimado: valor,
              obs: row['Observações']?.toString() || null,
            })
            importados++
          } catch { erros++ }
        }
        alert(`✅ Importação concluída!\n${importados} leads importados${erros > 0 ? `\n⚠️ ${erros} linhas com erro (verifique os dados)` : ''}`)
      } catch (err) {
        alert('Erro ao ler o arquivo. Certifique-se de usar a planilha modelo do Fluxe.')
      }
    }
    reader.readAsArrayBuffer(file)
    e.target.value = ''
  }
  const { data: meusTemplates = [] } = useCrmTemplates()
  const createTemplate = useCreateCrmTemplate()
  const updateTemplate = useUpdateCrmTemplate()
  const deleteTemplate = useDeleteCrmTemplate()
  const [showTemplatesModal, setShowTemplatesModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState(null) // null = novo, {id,...} = editando
  const [templateForm, setTemplateForm] = useState({ titulo:'', etapa:'', texto:'' })

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

  function getTemplatesDaEtapa(etapa) {
    const fixosDaEtapa = (TEMPLATES_ETAPA[etapa] || []).map(t => ({ ...t, grupo: '📍 Desta etapa' }))
    const globais = TEMPLATES_GLOBAIS.flatMap(g =>
      g.templates.map(t => ({ ...t, grupo: g.categoria }))
    )
    const personalizados = meusTemplates
      .filter(t => !t.etapa || t.etapa === etapa)
      .map(t => ({ id: t.id, label: t.titulo, texto: t.texto, grupo: '✏️ Meus templates', customizado: true }))
    return [...fixosDaEtapa, ...globais, ...personalizados]
  }

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
    sessionStorage.setItem('crm_lead_precif', JSON.stringify({
      nome: lead.fantasia || lead.nome || '',
      segmento: lead.segmento || '',
      valor_estimado: lead.valor_estimado || 0,
    }))
    window.open('/precificacao', '_blank')
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
          { label:'Receita mensal fechada', value: fmtR(totalFech), sub:`${fechados.length} clientes`, color:'#22C55E' },
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
        <input ref={importRef} type="file" accept=".xlsx,.xls" style={{ display:'none' }} onChange={importarLeads} />
        <button onClick={() => importRef.current?.click()}
          style={{ padding:'6px 14px', borderRadius:8, border:'1px solid #E2E8F0', background:'#fff', cursor:'pointer', fontSize:11, fontWeight:600, color:'#475569' }}>
          ⬆ Importar
        </button>
        <button onClick={exportarLeads}
          style={{ padding:'6px 14px', borderRadius:8, border:'1px solid #E2E8F0', background:'#fff', cursor:'pointer', fontSize:11, fontWeight:600, color:'#475569' }}>
          ⬇ Exportar
        </button>
        <button onClick={() => { setEditingTemplate(null); setTemplateForm({ titulo:'', etapa:'', texto:'' }); setShowTemplatesModal(true) }}
          style={{ padding:'6px 14px', borderRadius:8, border:'1px solid #E2E8F0', background:'#fff', cursor:'pointer', fontSize:11, fontWeight:600, color:'#475569' }}>
          ✏️ Gerenciar templates
        </button>
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
                          {getTemplatesDaEtapa(l.etapa).length > 0 && (() => {
                            const todos = getTemplatesDaEtapa(l.etapa)
                            const grupos = [...new Set(todos.map(t => t.grupo))]
                            return (
                              <select
                                onChange={e => { if(e.target.value) { const t = todos.find(x=>x.id===e.target.value); if(t) abrirTemplate(l,t); e.target.value=''; } }}
                                style={{ fontSize:9, padding:'2px 6px', border:'1px solid #BBF7D0', borderRadius:5, cursor:'pointer', background:'#F0FDF4', color:'#15803D', fontWeight:600, appearance:'none' }}
                                defaultValue="">
                                <option value="" disabled>💬 Mensagem</option>
                                {grupos.map(grupo => (
                                  <optgroup key={grupo} label={grupo}>
                                    {todos.filter(t => t.grupo === grupo).map(t => (
                                      <option key={t.id} value={t.id}>{t.label}</option>
                                    ))}
                                  </optgroup>
                                ))}
                              </select>
                            )
                          })()}
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
                        <LinhaDoTempo lead={l} />
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
              <div key={l.id} style={{ display:'flex', flexDirection:'column', padding:'10px 14px',
                background:'#fff', border:`1px solid ${fuVencido ? '#FECACA' : '#E2E8F0'}`, borderRadius:10 }}>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
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
                <LinhaDoTempo lead={l} />
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
                  <label style={labelStyle}>Valor mensal estimado (R$)</label>
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

      {/* ══ MODAL GERENCIAR TEMPLATES ══ */}
      {showTemplatesModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1300, padding:16 }}>
          <div style={{ background:'#fff', borderRadius:16, width:'100%', maxWidth:600, maxHeight:'90vh', display:'flex', flexDirection:'column' }}>
            <div style={{ padding:'14px 18px', borderBottom:'1px solid #E2E8F0', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ fontWeight:700, fontSize:14 }}>✏️ Meus templates de mensagem</div>
              <button onClick={() => setShowTemplatesModal(false)} style={{ border:'none', background:'none', cursor:'pointer', fontSize:20, color:'#94A3B8' }}>×</button>
            </div>
            <div style={{ padding:'14px 18px', flex:1, overflowY:'auto' }}>
              <div style={{ background:'#F8FAFC', borderRadius:10, padding:14, marginBottom:16, border:'1px solid #E2E8F0' }}>
                <div style={{ fontWeight:700, fontSize:12, marginBottom:10, color:'#0F172A' }}>
                  {editingTemplate ? '✏️ Editar template' : '+ Novo template'}
                </div>
                {!editingTemplate && (
                  <div style={{ marginBottom:10, fontSize:11, color:'#6366F1' }}>
                    💡 Ou escolha um template fixo como base:
                    <select defaultValue="" onChange={e => {
                      if (!e.target.value) return
                      const [cat, idx] = e.target.value.split('|')
                      let t
                      if (cat === 'etapa') {
                        const todos = Object.values(TEMPLATES_ETAPA).flat()
                        t = todos[parseInt(idx)]
                      } else {
                        t = TEMPLATES_GLOBAIS.flatMap(g => g.templates)[parseInt(idx)]
                      }
                      if (t) setTemplateForm({ titulo: t.label.replace(/^[^\w]+/, ''), etapa:'', texto: t.texto })
                      e.target.value = ''
                    }} style={{ marginLeft:8, padding:'3px 8px', borderRadius:6, border:'1px solid #C7D2FE', fontSize:11, cursor:'pointer', background:'#EEF2FF', color:'#6366F1' }}>
                      <option value="">Selecionar...</option>
                      <optgroup label="📍 Por etapa">
                        {Object.values(TEMPLATES_ETAPA).flat().map((t, i) => (
                          <option key={i} value={`etapa|${i}`}>{t.label}</option>
                        ))}
                      </optgroup>
                      {TEMPLATES_GLOBAIS.map((g, gi) => (
                        <optgroup key={gi} label={g.categoria}>
                          {g.templates.map((t, ti) => {
                            const globalIdx = TEMPLATES_GLOBAIS.slice(0, gi).reduce((a, x) => a + x.templates.length, 0) + ti
                            return <option key={ti} value={`global|${globalIdx}`}>{t.label}</option>
                          })}
                        </optgroup>
                      ))}
                    </select>
                  </div>
                )}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:8 }}>
                  <div>
                    <label style={{ fontSize:10, fontWeight:700, color:'#94A3B8', display:'block', marginBottom:4, textTransform:'uppercase' }}>Título *</label>
                    <input value={templateForm.titulo} onChange={e => setTemplateForm(f => ({...f, titulo:e.target.value}))}
                      placeholder="Ex: Follow-up após reunião"
                      style={{ width:'100%', padding:'7px 10px', border:'1px solid #E2E8F0', borderRadius:8, fontSize:12, boxSizing:'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize:10, fontWeight:700, color:'#94A3B8', display:'block', marginBottom:4, textTransform:'uppercase' }}>Etapa (opcional)</label>
                    <select value={templateForm.etapa} onChange={e => setTemplateForm(f => ({...f, etapa:e.target.value}))}
                      style={{ width:'100%', padding:'7px 10px', border:'1px solid #E2E8F0', borderRadius:8, fontSize:12 }}>
                      <option value="">Todas as etapas</option>
                      {ETAPAS.map(e => <option key={e.id} value={e.id}>{e.icon} {e.label}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ marginBottom:8 }}>
                  <label style={{ fontSize:10, fontWeight:700, color:'#94A3B8', display:'block', marginBottom:4, textTransform:'uppercase' }}>Texto *</label>
                  <div style={{ fontSize:10, color:'#94A3B8', marginBottom:4 }}>Variáveis disponíveis: {'{nome}'} {'{empresa}'} {'{valor}'} {'{minhaNome}'} {'{minhaEmpresa}'}</div>
                  <textarea value={templateForm.texto} onChange={e => setTemplateForm(f => ({...f, texto:e.target.value}))}
                    placeholder="Olá, {nome}! Tudo bem?..."
                    style={{ width:'100%', height:120, padding:'8px 10px', border:'1px solid #E2E8F0', borderRadius:8, fontSize:12, fontFamily:'inherit', resize:'vertical', boxSizing:'border-box' }} />
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  <button onClick={async () => {
                    if (!templateForm.titulo || !templateForm.texto) return
                    if (editingTemplate) { await updateTemplate.mutateAsync({ id: editingTemplate.id, ...templateForm }) }
                    else { await createTemplate.mutateAsync(templateForm) }
                    setEditingTemplate(null); setTemplateForm({ titulo:'', etapa:'', texto:'' })
                  }} style={{ padding:'7px 16px', borderRadius:8, border:'none', background:'#6366F1', color:'#fff', fontWeight:700, fontSize:12, cursor:'pointer' }}>
                    {editingTemplate ? 'Salvar alterações' : 'Criar template'}
                  </button>
                  {editingTemplate && (
                    <button onClick={() => { setEditingTemplate(null); setTemplateForm({ titulo:'', etapa:'', texto:'' }) }}
                      style={{ padding:'7px 16px', borderRadius:8, border:'1px solid #E2E8F0', background:'#fff', fontSize:12, cursor:'pointer' }}>Cancelar</button>
                  )}
                </div>
              </div>
              {meusTemplates.length === 0 ? (
                <div style={{ textAlign:'center', color:'#94A3B8', fontSize:12, padding:'20px 0' }}>Nenhum template personalizado ainda. Crie o primeiro acima!</div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {meusTemplates.map(t => (
                    <div key={t.id} style={{ border:'1px solid #E2E8F0', borderRadius:10, padding:'10px 14px' }}>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8 }}>
                        <div>
                          <div style={{ fontWeight:600, fontSize:13 }}>{t.titulo}</div>
                          <div style={{ fontSize:10, color:'#94A3B8' }}>{t.etapa ? ETAPAS.find(e=>e.id===t.etapa)?.label : 'Todas as etapas'}</div>
                        </div>
                        <div style={{ display:'flex', gap:6 }}>
                          <button onClick={() => { setEditingTemplate(t); setTemplateForm({ titulo:t.titulo, etapa:t.etapa||'', texto:t.texto }) }}
                            style={{ padding:'4px 10px', borderRadius:6, border:'1px solid #E2E8F0', background:'#fff', fontSize:11, cursor:'pointer' }}>✎ Editar</button>
                          <button onClick={() => { if(confirm('Excluir este template?')) deleteTemplate.mutate(t.id) }}
                            style={{ padding:'4px 10px', borderRadius:6, border:'1px solid #FECDD3', background:'#FEF2F2', color:'#DC2626', fontSize:11, cursor:'pointer' }}>× Excluir</button>
                        </div>
                      </div>
                      <div style={{ fontSize:11, color:'#64748B', marginTop:6, whiteSpace:'pre-wrap', maxHeight:60, overflow:'hidden' }}>{t.texto}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
