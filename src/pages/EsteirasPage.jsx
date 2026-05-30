import { useState } from 'react'
import { useClients, useCreateTask } from '../hooks/useData'
import { Card, CardHeader, Btn, Loader } from '../components/ui'
import { supabase } from '../lib/supabase'
import { useQueryClient } from '@tanstack/react-query'

// ── ESTEIRAS COM TAREFAS E CHECKLISTS COMPLETOS ────────────────
const ESTEIRAS = [
  { id:'comercial', name:'Jornada Comercial', icon:'🤝', color:'#8B5CF6',
    etapas:[
      { titulo:'Prospecção & Diagnóstico', tasks:[
        { titulo:'Identificar empresa-alvo e pesquisar porte e segmento', categoria:'Relacionamento', checklist:['Verificar faturamento estimado','Identificar segmento de atuação','Pesquisar concorrentes que atendem'] },
        { titulo:'Primeiro contato — WhatsApp ou LinkedIn', categoria:'Relacionamento', checklist:['Preparar mensagem de abordagem','Enviar mensagem','Registrar resposta'] },
        { titulo:'Agendar reunião de diagnóstico', categoria:'Relacionamento', checklist:['Confirmar data e horário','Enviar convite','Preparar pauta da reunião'] },
        { titulo:'Levantar processos financeiros atuais', categoria:'Estratégico', checklist:['Quem faz o financeiro hoje?','Qual sistema usa?','Quais dores principais?','Volume de NFs por mês','Volume de pagamentos por mês'] },
      ]},
      { titulo:'Proposta & Fechamento', tasks:[
        { titulo:'Elaborar proposta personalizada', categoria:'Estratégico', checklist:['Definir escopo dos serviços','Calcular precificação','Preparar apresentação'] },
        { titulo:'Enviar proposta ao decisor', categoria:'Relacionamento', checklist:['Enviar por WhatsApp','Enviar por e-mail','Agendar follow-up em 48h'] },
        { titulo:'Follow-up da proposta', categoria:'Relacionamento', checklist:['Ligar para o decisor','Tratar objeções','Ajustar escopo se necessário'] },
        { titulo:'Assinar contrato de prestação de serviços', categoria:'Relacionamento', checklist:['Enviar contrato para assinatura','Confirmar assinatura','Arquivar contrato assinado'] },
      ]},
    ]
  },
  { id:'pre_ob', name:'Pré-Onboarding', icon:'📋', color:'#F59E0B',
    etapas:[
      { titulo:'Documentos necessários', tasks:[
        { titulo:'Enviar e-mail de boas-vindas com apresentação da equipe', categoria:'Relacionamento', checklist:['Preparar e-mail personalizado','Incluir foto da equipe','Apresentar metodologia resumida'] },
        { titulo:'Solicitar documentação da empresa', categoria:'Relacionamento', checklist:['CNPJ e contrato social','RG/CPF do sócio responsável','Comprovante de endereço','Certificado digital (se tiver)','Senha e-CAC (Receita Federal)'] },
        { titulo:'Verificar regime tributário', categoria:'Estratégico', checklist:['Simples Nacional?','Lucro Presumido?','Lucro Real?','Verificar pendências na Receita'] },
      ]},
      { titulo:'Acessos ao sistema financeiro', tasks:[
        { titulo:'Solicitar acesso ao internet banking', categoria:'Relacionamento', checklist:['Definir nível de acesso (consulta ou operacional)','Cadastrar IP se necessário','Testar acesso'] },
        { titulo:'Solicitar acesso ao ERP ou sistema de gestão', categoria:'Implantação', checklist:['Omie?','Conta Azul?','Meu Dinheiro Web?','Nibo?','Bom Controle?','Outro sistema?'] },
        { titulo:'Solicitar acesso à plataforma de emissão de NF', categoria:'Implantação', checklist:['Prefeitura (NFS-e)?','Dentro do ERP?','Testar emissão'] },
        { titulo:'Verificar maquininha e marketplaces', categoria:'Relacionamento', checklist:['Tem maquininha? Qual operadora?','Solicitar acesso ao painel','Tem marketplace? (Mercado Livre, etc)','Solicitar relatório de repasses'] },
      ]},
      { titulo:'Alinhamento de expectativas', tasks:[
        { titulo:'Definir canal principal de comunicação', categoria:'Relacionamento', checklist:['WhatsApp comercial?','E-mail?','Definir horário de atendimento'] },
        { titulo:'Confirmar agenda mensal', categoria:'Relacionamento', checklist:['Dia do fechamento','Dia da reunião mensal','Dia de emissão das NFs','Dia dos pagamentos'] },
        { titulo:'Definir responsável do cliente por área', categoria:'Relacionamento', checklist:['Responsável por NFs','Responsável por aprovações de pagamento','Responsável por documentos'] },
      ]},
    ]
  },
  { id:'onboarding', name:'Onboarding', icon:'🚀', color:'#1A56DB',
    etapas:[
      { titulo:'Kick-off Meeting', tasks:[
        { titulo:'Realizar reunião de kick-off', categoria:'Relacionamento', checklist:['Enviar convite com pauta','Apresentar equipe responsável','Apresentar metodologia BPO','Alinhar escopo exato','Confirmar sistema financeiro','Definir calendário mensal','Registrar decisões da reunião'] },
        { titulo:'Apresentar sistema financeiro ao cliente', categoria:'Implantação', checklist:['Mostrar como acessar','Mostrar onde ver relatórios','Mostrar como aprovar pagamentos','Tirar dúvidas'] },
      ]},
      { titulo:'Diagnóstico financeiro inicial', tasks:[
        { titulo:'Mapear todas as contas bancárias', categoria:'Conciliação Bancária', checklist:['Listar todos os bancos','Confirmar agência e conta de cada um','Verificar saldo atual','Cadastrar no sistema'] },
        { titulo:'Levantar recebíveis e despesas fixas', categoria:'Fluxo de Caixa', checklist:['Listar clientes que pagam mensalmente','Listar despesas fixas (aluguel, folha, etc)','Identificar vencimentos','Lançar no sistema'] },
        { titulo:'Verificar inadimplentes em aberto', categoria:'Cobrança / Inadimplência', checklist:['Listar todos os devedores','Classificar por faixa de atraso','Definir estratégia de cobrança','Registrar no sistema'] },
        { titulo:'Entregar panorama financeiro inicial ao cliente', categoria:'Estratégico', checklist:['Montar resumo da situação atual','Identificar os 3 principais problemas','Apresentar ao cliente'] },
      ]},
      { titulo:'Configuração no sistema', tasks:[
        { titulo:'Configurar plano de contas no ERP', categoria:'Implantação', checklist:['Definir categorias de CP','Definir categorias de CR','Criar centros de custo se necessário','Validar com o cliente'] },
        { titulo:'Cadastrar contas bancárias no sistema', categoria:'Implantação', checklist:['Cadastrar todas as contas','Conectar via OFX se possível','Lançar saldo inicial','Testar importação de extrato'] },
        { titulo:'Registrar todos os acessos no cadastro do cliente', categoria:'Implantação', checklist:['Internet banking','ERP/sistema','Plataforma de NF','Maquininha','Outros acessos relevantes'] },
      ]},
    ]
  },
  { id:'implantacao', name:'Implantação', icon:'⚙️', color:'#F97316',
    etapas:[
      { titulo:'Configuração do software', tasks:[
        { titulo:'Configurar empresa no Omie ERP', categoria:'Implantação', checklist:['Criar conta / acessar empresa','Configurar CNPJ e regime tributário','Cadastrar contas bancárias com OFX','Configurar plano de contas','Cadastrar fornecedores recorrentes','Ativar módulo de NF-e / NFS-e','Testar emissão de primeira NF'] },
        { titulo:'Configurar empresa no Conta Azul', categoria:'Implantação', checklist:['Criar conta / acessar empresa','Conectar via Open Finance','Configurar plano de contas','Cadastrar produtos/serviços','Configurar integrações (maquininha)','Testar boleto e NF'] },
        { titulo:'Configurar empresa no Meu Dinheiro Web', categoria:'Implantação', checklist:['Acessar empresa','Cadastrar contas bancárias','Definir categorias','Lançar saldo inicial'] },
        { titulo:'Configurar empresa no Nibo', categoria:'Implantação', checklist:['Acessar empresa','Conectar contas via OFX','Configurar plano de contas gerencial','Ativar módulo DRE','Testar importação de extrato'] },
        { titulo:'Configurar empresa no Bom Controle', categoria:'Implantação', checklist:['Acessar empresa','Cadastrar contas bancárias','Definir categorias de CP e CR'] },
      ]},
      { titulo:'Primeiros lançamentos', tasks:[
        { titulo:'Lançar saldo inicial de todas as contas bancárias', categoria:'Conciliação Bancária', checklist:['Confirmar saldo com extrato','Lançar no sistema','Validar com o cliente'] },
        { titulo:'Importar ou lançar contas a pagar do mês', categoria:'Contas a Pagar', checklist:['Listar todos os compromissos do mês','Lançar com data de vencimento','Verificar se há duplicatas'] },
        { titulo:'Importar ou lançar contas a receber do mês', categoria:'Contas a Receber', checklist:['Listar todos os recebimentos previstos','Lançar com data prevista','Verificar inadimplentes'] },
        { titulo:'Conciliar primeiros extratos bancários', categoria:'Conciliação Bancária', checklist:['Baixar extrato do banco','Importar no sistema','Conciliar lançamento por lançamento','Verificar diferenças'] },
        { titulo:'Validar todos os lançamentos com o cliente', categoria:'Estratégico', checklist:['Agendar call de validação','Apresentar o que foi lançado','Ajustar conforme feedback'] },
      ]},
      { titulo:'Go-live & Validação', tasks:[
        { titulo:'Testar fluxo completo de operação', categoria:'Implantação', checklist:['Lançar → conciliar → gerar DRE','Testar aprovação de pagamento','Testar emissão de NF','Confirmar que todos os acessos funcionam'] },
        { titulo:'Aplicar pesquisa de satisfação pós-implantação', categoria:'Relacionamento', checklist:['Enviar formulário de satisfação','Registrar nota recebida','Registrar feedback e melhorias'] },
      ]},
    ]
  },
  { id:'operacional', name:'Rotina Operacional', icon:'🔄', color:'#22C55E',
    etapas:[
      { titulo:'Rotina Diária', tasks:[
        { titulo:'Verificar contas a pagar com vencimento hoje', categoria:'Contas a Pagar', checklist:['Acessar lista de CP do dia','Verificar se há saldo para pagamento','Comunicar cliente se necessário'] },
        { titulo:'Verificar recebimentos previstos para hoje', categoria:'Contas a Receber', checklist:['Verificar pagamentos confirmados','Baixar no sistema','Comunicar cliente sobre recebidos'] },
        { titulo:'Conferência bancária matinal', categoria:'Conciliação Bancária', checklist:['Verificar saldo atual','Conferir lançamentos do dia anterior','Identificar movimentações não reconhecidas'] },
        { titulo:'Registrar pagamentos realizados e comprovantes', categoria:'Contas a Pagar', checklist:['Confirmar pagamentos no banco','Anexar comprovantes no sistema','Baixar os títulos pagos'] },
        { titulo:'Checar NFs a emitir hoje', categoria:'Emissão de NF', checklist:['Verificar contratos com recorrência','Emitir NFs pendentes','Enviar para os clientes'] },
      ]},
      { titulo:'Rotina Semanal', tasks:[
        { titulo:'Conciliação de plataformas — cartão, boleto e PIX', categoria:'Conciliação Bancária', checklist:['Baixar relatório da maquininha','Baixar relatório de boletos','Conciliar com lançamentos no sistema','Verificar divergências'] },
        { titulo:'Agendamento bancário da semana', categoria:'Pagamentos', checklist:['Listar pagamentos a vencer nos próximos 7 dias','Separar por banco','Agendar no internet banking','Confirmar com o cliente os que precisam de aprovação'] },
        { titulo:'Verificar aprovações de pagamento pendentes', categoria:'Pagamentos', checklist:['Listar pagamentos aguardando aprovação','Enviar lembrete ao cliente','Registrar aprovações recebidas'] },
        { titulo:'Emissão de NFs de serviço recorrentes', categoria:'Emissão de NF', checklist:['Verificar contratos com emissão semanal','Emitir NFs','Enviar para destinatários'] },
        { titulo:'Conferir inadimplência da semana', categoria:'Cobrança / Inadimplência', checklist:['Listar títulos vencidos','Classificar por faixa de atraso','Enviar cobranças conforme régua'] },
      ]},
      { titulo:'Fechamento Mensal', tasks:[
        { titulo:'Cobrar extrato bancário e documentos do cliente', categoria:'Conciliação Bancária', checklist:['Solicitar extrato de todas as contas','Solicitar faturas de cartão','Solicitar comprovantes de despesas','Solicitar NFs de compras em falta'] },
        { titulo:'Conciliar extrato bancário conta a conta', categoria:'Conciliação Bancária', checklist:['Conciliar conta corrente principal','Conciliar demais contas','Conciliar cartão corporativo','Verificar lançamentos duplicados'] },
        { titulo:'Conciliar plataformas digitais', categoria:'Conciliação Bancária', checklist:['Conciliar boletos emitidos','Conciliar PIX recebidos','Conciliar maquininha','Conciliar marketplaces'] },
        { titulo:'Fechar período no ERP', categoria:'DRE / Relatórios', checklist:['Verificar se todos os lançamentos estão corretos','Fechar mês no sistema','Gerar backup dos dados'] },
        { titulo:'Gerar DRE Gerencial do mês', categoria:'DRE / Relatórios', checklist:['Gerar DRE no sistema','Revisar valores','Calcular margens','Comparar com mês anterior'] },
        { titulo:'Gerar Fluxo de Caixa projetado para o próximo mês', categoria:'Fluxo de Caixa', checklist:['Projetar receitas do próximo mês','Projetar despesas fixas','Identificar gap de caixa','Apresentar ao cliente'] },
        { titulo:'Preparar e enviar relatório executivo ao cliente', categoria:'DRE / Relatórios', checklist:['Montar resumo executivo','Incluir DRE','Incluir fluxo de caixa','Incluir indicadores principais','Enviar ao cliente 24h antes da reunião'] },
        { titulo:'Realizar reunião mensal de resultados', categoria:'Estratégico', checklist:['Abrir com resultado do mês','Apresentar top 3 vazamentos','Apresentar posição de caixa','Definir top 3 prioridades do próximo mês','Registrar ata da reunião'] },
      ]},
    ]
  },
  { id:'estrategico', name:'BPO Estratégico', icon:'📈', color:'#06B6D4',
    etapas:[
      { titulo:'Análise & Indicadores', tasks:[
        { titulo:'Calcular indicadores financeiros do mês', categoria:'DRE / Relatórios', checklist:['Margem Bruta','Margem Líquida','Ponto de Equilíbrio','Ticket médio','Taxa de inadimplência','Comparar com mês anterior e meta'] },
        { titulo:'Identificar os 3 maiores vazamentos de caixa', categoria:'Estratégico', checklist:['Analisar top 10 despesas','Comparar com mês anterior','Identificar oportunidades de corte','Preparar recomendações'] },
      ]},
      { titulo:'Reunião de Decisão', tasks:[
        { titulo:'Enviar relatório ao cliente 24h antes da reunião', categoria:'Estratégico', checklist:['DRE do mês','Fluxo de caixa projetado','Indicadores','Análise dos vazamentos'] },
        { titulo:'Conduzir reunião estratégica mensal', categoria:'Estratégico', checklist:['Resultado do mês em 2 minutos','Top 3 vazamentos identificados','Posição de caixa atual','Projeção próximos 30 dias','Definir top 3 prioridades','Registrar plano de ação'] },
        { titulo:'Enviar ata da reunião ao cliente', categoria:'Estratégico', checklist:['Registrar decisões tomadas','Definir responsáveis e prazos','Enviar em até 24h após a reunião'] },
      ]},
    ]
  },
  { id:'cobranca', name:'Cobrança & Inadimplência', icon:'💰', color:'#EF4444',
    etapas:[
      { titulo:'Identificação & Triagem', tasks:[
        { titulo:'Listar e classificar todos os títulos vencidos', categoria:'Cobrança / Inadimplência', checklist:['1 a 7 dias de atraso','8 a 30 dias de atraso','31 a 60 dias de atraso','Acima de 60 dias','Ordenar por valor (maiores primeiro)'] },
      ]},
      { titulo:'Régua de Comunicação', tasks:[
        { titulo:'D+1: Lembrete amigável via WhatsApp', categoria:'Cobrança / Inadimplência', checklist:['Enviar mensagem amigável','Reenviar boleto','Registrar tentativa no sistema'] },
        { titulo:'D+5: Cobrança formal', categoria:'Cobrança / Inadimplência', checklist:['Enviar mensagem formal por WhatsApp','Enviar e-mail com boleto','Registrar no sistema'] },
        { titulo:'D+10: Tentativa de ligação ao decisor', categoria:'Cobrança / Inadimplência', checklist:['Ligar para o financeiro','Ligar para o sócio se necessário','Oferecer parcelamento','Registrar resultado'] },
        { titulo:'D+15: Oferecer acordo de parcelamento', categoria:'Cobrança / Inadimplência', checklist:['Propor parcelamento','Definir número de parcelas','Emitir novo boleto','Registrar acordo no sistema'] },
      ]},
      { titulo:'Negociação & Baixa', tasks:[
        { titulo:'Registrar acordo e emitir novo boleto', categoria:'Cobrança / Inadimplência', checklist:['Registrar condições do acordo','Emitir boleto com novo vencimento','Enviar ao cliente'] },
        { titulo:'Confirmar recebimento e dar baixa', categoria:'Cobrança / Inadimplência', checklist:['Confirmar no banco','Dar baixa no título','Arquivar comprovante','Comunicar ao cliente do BPO'] },
      ]},
    ]
  },
]

export default function EsteirasPage() {
  const { data: clients = [] } = useClients()
  const createTask = useCreateTask()
  const qc = useQueryClient()
  const [selected, setSelected] = useState(null)
  const [checked, setChecked] = useState({})
  const [applyModal, setApplyModal] = useState(null) // { esteira, etapa } or { esteira, all }
  const [applyClient, setApplyClient] = useState('')
  const [applying, setApplying] = useState(false)
  const [applied, setApplied] = useState(false)

  const est = ESTEIRAS.find(e => e.id === selected)

  function toggleCheck(etIdx, tIdx, ckIdx) {
    const key = `${selected}-${etIdx}-${tIdx}-${ckIdx}`
    setChecked(p => ({ ...p, [key]: !p[key] }))
  }

  function getTaskProgress(etIdx, tIdx, checklist) {
    const done = checklist.filter((_, i) => checked[`${selected}-${etIdx}-${tIdx}-${i}`]).length
    return { done, total: checklist.length }
  }

  async function aplicarTarefas(clienteId, tasks) {
    setApplying(true)
    for (const task of tasks) {
      const created = await createTask.mutateAsync({
        titulo: task.titulo,
        categoria: task.categoria,
        prioridade: 'media',
        status: 'aberta',
        cliente_id: clienteId,
      })
      if (task.checklist?.length && created?.id) {
        const items = task.checklist.map((texto, ordem) => ({ tarefa_id: created.id, texto, ordem }))
        await supabase.from('tarefa_checklists').insert(items)
      }
    }
    setApplying(false)
    setApplied(true)
    setApplyModal(null)
    qc.invalidateQueries({ queryKey: ['tasks'] })
    setTimeout(() => setApplied(false), 3000)
  }

  if (selected && est) {
    const totalTasks = est.etapas.reduce((a, e) => a + e.tasks.length, 0)
    return (
      <div>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
          <button onClick={() => setSelected(null)} style={{ border:'1px solid #E2E8F0', background:'#fff', borderRadius:8, padding:'6px 12px', cursor:'pointer', fontSize:12 }}>← Voltar</button>
          <span style={{ fontSize:16, fontWeight:700, color:'#0F172A', flex:1 }}>{est.icon} {est.name}</span>
          <Btn variant="primary" onClick={() => setApplyModal({ esteira: est, all: true })}>
            ⚡ Aplicar todas ao cliente ({totalTasks} tarefas)
          </Btn>
        </div>

        {applied && (
          <div style={{ background:'#F0FDF4', border:'1px solid #BBF7D0', borderRadius:10, padding:'10px 16px', marginBottom:14, color:'#15803D', fontWeight:600, fontSize:13 }}>
            ✓ Tarefas criadas com sucesso! Veja na página de Tarefas.
          </div>
        )}

        {est.etapas.map((et, etIdx) => (
          <Card key={etIdx} style={{ marginBottom:14 }}>
            <CardHeader title={et.titulo} right={
              <Btn small variant="primary" onClick={() => setApplyModal({ esteira: est, etapa: et, etIdx })}>
                + Aplicar ao cliente ({et.tasks.length} tarefas)
              </Btn>
            } />
            <div style={{ padding:'8px 0' }}>
              {et.tasks.map((task, tIdx) => (
                <div key={tIdx} style={{ borderBottom:'1px solid #F8FAFC' }}>
                  {/* Task header */}
                  <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 16px', background:'#FAFAFA' }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:12, fontWeight:600, color:'#0F172A' }}>{task.titulo}</div>
                      <div style={{ fontSize:10, color:'#94A3B8', marginTop:2 }}>📂 {task.categoria} · {task.checklist.length} itens de checklist</div>
                    </div>
                    <div style={{ fontSize:10, color:'#64748B' }}>
                      {getTaskProgress(etIdx, tIdx, task.checklist).done}/{task.checklist.length}
                    </div>
                  </div>
                  {/* Checklist preview */}
                  <div style={{ padding:'4px 16px 8px 32px' }}>
                    {task.checklist.map((ck, ckIdx) => (
                      <div key={ckIdx} onClick={() => toggleCheck(etIdx, tIdx, ckIdx)}
                        style={{ display:'flex', alignItems:'center', gap:8, padding:'4px 0', cursor:'pointer' }}>
                        <div style={{ width:14, height:14, borderRadius:3, border:`2px solid ${checked[`${selected}-${etIdx}-${tIdx}-${ckIdx}`]?'#22C55E':'#CBD5E1'}`, background: checked[`${selected}-${etIdx}-${tIdx}-${ckIdx}`]?'#22C55E':'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                          {checked[`${selected}-${etIdx}-${tIdx}-${ckIdx}`] && <span style={{ color:'#fff', fontSize:8 }}>✓</span>}
                        </div>
                        <span style={{ fontSize:11, color: checked[`${selected}-${etIdx}-${tIdx}-${ckIdx}`]?'#94A3B8':'#475569', textDecoration: checked[`${selected}-${etIdx}-${tIdx}-${ckIdx}`]?'line-through':'none' }}>{ck}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ))}

        {/* Modal aplicar */}
        {applyModal && (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
            <div style={{ background:'#fff', borderRadius:16, padding:24, width:400 }}>
              <div style={{ fontWeight:700, fontSize:15, marginBottom:8 }}>
                {applyModal.all ? `Aplicar toda a esteira "${est.name}"` : `Aplicar etapa "${applyModal.etapa.titulo}"`}
              </div>
              <div style={{ fontSize:12, color:'#64748B', marginBottom:16 }}>
                {applyModal.all ? totalTasks : applyModal.etapa.tasks.length} tarefas serão criadas com checklists completos, vinculadas ao cliente selecionado.
              </div>
              <div style={{ marginBottom:16 }}>
                <label style={{ fontSize:10, fontWeight:700, color:'#94A3B8', display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:'.07em' }}>Selecionar cliente *</label>
                <select value={applyClient} onChange={e=>setApplyClient(e.target.value)}
                  style={{ width:'100%', padding:'8px 10px', border:'1px solid #E2E8F0', borderRadius:8, fontSize:12, background:'#fff' }}>
                  <option value="">— Selecione o cliente —</option>
                  {clients.map(c=><option key={c.id} value={c.id}>{c.razao_social}</option>)}
                </select>
              </div>
              <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
                <Btn onClick={() => { setApplyModal(null); setApplyClient('') }}>Cancelar</Btn>
                <Btn variant="primary" disabled={!applyClient || applying} onClick={() => {
                  const tasks = applyModal.all
                    ? est.etapas.flatMap(e => e.tasks)
                    : applyModal.etapa.tasks
                  aplicarTarefas(applyClient, tasks)
                }}>
                  {applying ? 'Criando tarefas...' : '⚡ Criar tarefas'}
                </Btn>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      <div style={{ fontSize:13, color:'#64748B', marginBottom:16 }}>
        Selecione uma esteira para ver as tarefas e checklists. Use <strong>"Aplicar ao cliente"</strong> para criar todas as tarefas automaticamente.
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:14 }}>
        {ESTEIRAS.map(est => {
          const totalTasks = est.etapas.reduce((a,e) => a + e.tasks.length, 0)
          const totalChecks = est.etapas.reduce((a,e) => a + e.tasks.reduce((b,t) => b + t.checklist.length, 0), 0)
          return (
            <div key={est.id} onClick={() => setSelected(est.id)}
              style={{ background:'#fff', border:'1px solid #E2E8F0', borderRadius:12, padding:16, cursor:'pointer', transition:'all .15s', borderLeft:`4px solid ${est.color}` }}
              onMouseEnter={e=>{ e.currentTarget.style.boxShadow='0 4px 20px rgba(0,0,0,.08)'; e.currentTarget.style.transform='translateY(-2px)' }}
              onMouseLeave={e=>{ e.currentTarget.style.boxShadow=''; e.currentTarget.style.transform='' }}>
              <div style={{ fontSize:24, marginBottom:8 }}>{est.icon}</div>
              <div style={{ fontSize:14, fontWeight:700, color:'#0F172A', marginBottom:4 }}>{est.name}</div>
              <div style={{ fontSize:11, color:'#64748B', marginBottom:12 }}>{est.etapas.length} etapas</div>
              <div style={{ display:'flex', gap:10, fontSize:11, color:'#94A3B8' }}>
                <span>✓ {totalTasks} tarefas</span>
                <span>📋 {totalChecks} itens</span>
              </div>
              <div style={{ marginTop:10 }}>
                <span style={{ fontSize:10, background:'#EEF2FF', color:'#4338CA', padding:'3px 8px', borderRadius:99, fontWeight:600 }}>
                  Clique para ver e aplicar
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
