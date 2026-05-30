import { useState } from 'react'
import { Card, CardHeader, Btn, EmptyState } from '../components/ui'

const ESTEIRAS = [
  { id:'comercial', name:'Jornada Comercial', icon:'🤝', color:'#8B5CF6', desc:'Do lead novo ao contrato assinado.',
    etapas:[
      { titulo:'Prospecção & Diagnóstico', sla:5, tasks:['Identificar empresa-alvo e pesquisar porte e segmento','Verificar se já tem BPO financeiro ou contador CLT','Primeiro contato — WhatsApp ou LinkedIn','Qualificar: tem faturamento acima de R$30k/mês?','Agendar reunião de diagnóstico','Levantar processos financeiros atuais','Identificar dores: inadimplência, fluxo de caixa, NF atrasada','Definir escopo preliminar dos serviços'] },
      { titulo:'Proposta & Fechamento', sla:5, tasks:['Calcular precificação','Elaborar proposta personalizada','Enviar proposta ao decisor','Follow-up 48h após envio','Tratar objeções: preço, prazo, confiança','Ajustar escopo conforme negociação','Assinar contrato de prestação de serviços','Agendar kick-off de onboarding'] },
    ]
  },
  { id:'pre_ob', name:'Pré-Onboarding', icon:'📋', color:'#F59E0B', desc:'Checklist completo antes do kick-off.',
    etapas:[
      { titulo:'Documentos necessários', sla:5, tasks:['Enviar e-mail de boas-vindas','Solicitar CNPJ, contrato social','Solicitar RG/CPF do sócio responsável','Coletar comprovante de endereço','Solicitar certificado digital (se tiver)','Solicitar senha e-CAC','Verificar regime tributário'] },
      { titulo:'Acessos ao sistema financeiro', sla:3, tasks:['Solicitar acesso ao internet banking','Cadastrar credenciais bancárias no sistema','Solicitar acesso ao ERP ou sistema de gestão','Solicitar acesso à plataforma de emissão de NF','Verificar se há maquininha','Confirmar quem aprova pagamentos','Confirmar canal de envio de documentos'] },
      { titulo:'Alinhamento de expectativas', sla:2, tasks:['Apresentar metodologia BPO','Alinhar SLA de retorno','Definir canal principal de comunicação','Confirmar dia e horário da reunião mensal','Confirmar formato do relatório mensal','Confirmar agenda de vencimentos fixos'] },
    ]
  },
  { id:'onboarding', name:'Onboarding', icon:'🚀', color:'#1A56DB', desc:'Kick-off e ativação financeira.',
    etapas:[
      { titulo:'Kick-off Meeting', sla:2, tasks:['Enviar convite com pauta','Apresentar equipe responsável','Apresentar metodologia BPO','Alinhar escopo exato','Confirmar sistema financeiro','Definir calendário mensal','Esclarecer dúvidas e registrar'] },
      { titulo:'Diagnóstico financeiro inicial', sla:7, tasks:['Mapear todas as contas bancárias','Listar recebíveis fixos e variáveis','Listar despesas fixas mensais','Levantar dívidas ativas','Verificar inadimplentes em aberto','Identificar fornecedores recorrentes','Verificar NFs emitidas e pendentes','Entregar panorama financeiro inicial'] },
      { titulo:'Configuração no sistema', sla:3, tasks:['Parametrizar plano de contas no ERP','Cadastrar contas bancárias','Cadastrar fornecedores recorrentes','Importar histórico (últimos 3 meses)','Configurar aprovação de pagamentos','Registrar todos os acessos no cadastro'] },
    ]
  },
  { id:'implantacao', name:'Implantação', icon:'⚙️', color:'#F97316', desc:'Parametrização e go-live operacional.',
    etapas:[
      { titulo:'Configuração do software', sla:3, tasks:['Confirmar sistema financeiro escolhido','Verificar plano contratado','Criar credenciais de acesso para o BPO','— OMIE ERP —','Criar conta / acessar empresa no Omie','Configurar dados da empresa no Omie','Cadastrar contas bancárias com integração OFX','Configurar plano de contas gerencial','— CONTA AZUL —','Criar conta / acessar empresa no Conta Azul','Conectar contas bancárias via Open Finance','Configurar integrações (bancos, maquininha)','— MEU DINHEIRO WEB —','Configurar empresa e parâmetros iniciais','Cadastrar contas bancárias manualmente','— NIBO —','Cadastrar contas bancárias e conectar via OFX','Ativar módulo de relatórios e DRE','— BOM CONTROLE —','Cadastrar contas bancárias','Configurar contas a pagar e receber','— OUTRO SOFTWARE —','Acessar sistema indicado pelo cliente','Mapear funcionalidades equivalentes'] },
      { titulo:'Parametrização financeira', sla:7, tasks:['Definir plano de contas definitivo','Cadastrar todos os centros de custo','Configurar categorias de CP','Configurar categorias de CR','Cadastrar fornecedores recorrentes','Configurar régua de cobrança automática','Configurar limite de aprovação de pagamentos','Definir modelo de relatório mensal'] },
      { titulo:'Primeiros lançamentos', sla:5, tasks:['Lançar saldo inicial de todas as contas','Importar ou lançar CP do mês vigente','Importar ou lançar CR do mês vigente','Conciliar primeiros extratos bancários','Emitir primeiras NFs de serviço','Validar lançamentos com o cliente'] },
      { titulo:'Go-live & Validação', sla:3, tasks:['Confirmar que todos os acessos estão funcionando','Testar fluxo completo: lançar → conciliar → DRE','Testar fluxo de aprovação de pagamento','Apresentar dashboard financeiro ao cliente','Aplicar pesquisa de satisfação pós-implantação'] },
    ]
  },
  { id:'operacional', name:'Rotina Operacional', icon:'🔄', color:'#22C55E', desc:'Diária, semanal e fechamento mensal.',
    etapas:[
      { titulo:'Rotina Diária', sla:1, tasks:['Verificar contas a pagar com vencimento hoje','Verificar recebimentos previstos para hoje','Conferência bancária matinal','Registrar pagamentos realizados e comprovantes','Registrar recebimentos confirmados','Atualizar fluxo de caixa do dia','Checar NFs a emitir hoje','Registrar pendências ao cliente'] },
      { titulo:'Rotina Semanal', sla:1, tasks:['Conciliação de plataformas — cartão, boleto e PIX','Verificar boletos recebidos e baixar no sistema','Agendamento bancário da semana','Verificar aprovações de pagamento pendentes','Emissão de NFs de serviço recorrentes','Conferir inadimplência','Organizar e arquivar documentos recebidos','Atualizar status de pendências do cliente'] },
      { titulo:'Fechamento Mensal', sla:5, tasks:['— COBRANÇAS AO CLIENTE —','Cobrar extrato bancário de todas as contas','Cobrar faturas de cartão','Cobrar comprovantes de despesas não lançadas','Cobrar NFs de compras e serviços em falta','— CONCILIAÇÃO —','Conciliar extrato bancário conta a conta','Conciliar fatura de cartão corporativo','Conciliar plataformas digitais','Verificar lançamentos duplicados','— ENCERRAMENTO —','Fechar período no ERP','Gerar DRE gerencial do mês','Gerar Fluxo de Caixa projetado','Calcular indicadores financeiros','Preparar relatório executivo','Enviar relatório ao cliente antes da reunião','Realizar reunião mensal de resultados','Registrar ações acordadas na reunião'] },
    ]
  },
  { id:'estrategico', name:'BPO Estratégico', icon:'📈', color:'#06B6D4', desc:'DRE, indicadores e reunião de decisão.',
    etapas:[
      { titulo:'Análise & Indicadores', sla:5, tasks:['Gerar DRE gerencial do período','Calcular Margem Bruta','Calcular Margem Líquida','Calcular Ponto de Equilíbrio','Analisar top 10 despesas do mês','Identificar despesas acima do orçado','Calcular ticket médio','Analisar inadimplência','Comparar resultado com meta mensal','Identificar os 3 maiores vazamentos de caixa','Preparar interpretação executiva'] },
      { titulo:'Reunião de Decisão', sla:2, tasks:['Enviar relatório ao cliente 24h antes','Abrir com resultado do mês em 2 minutos','Apresentar top 3 vazamentos identificados','Apresentar posição de caixa','Apresentar projeção dos próximos 30 dias','Definir top 3 prioridades do próximo período','Definir plano de ação com responsável e prazo','Registrar decisões no sistema','Enviar ata da reunião ao cliente em até 24h'] },
    ]
  },
  { id:'cobranca', name:'Cobrança & Inadimplência', icon:'💰', color:'#EF4444', desc:'Régua completa de cobrança.',
    etapas:[
      { titulo:'Identificação & Triagem', sla:1, tasks:['Listar todos os títulos vencidos','Classificar por faixa: 1–7, 8–30, 31–60, +60 dias','Verificar histórico de pagamento','Verificar se há acordo anterior','Priorizar por valor','Registrar lista de cobrança do dia'] },
      { titulo:'Régua de Comunicação', sla:5, tasks:['D+1: Lembrete amigável via WhatsApp','D+3: Reenvio do boleto por e-mail','D+5: Cobrança formal por WhatsApp','D+7: Tentativa de ligação ao decisor','D+10: E-mail formal com aviso','D+15: Segunda ligação — oferecer acordo','D+20: Notificação escrita','Registrar cada tentativa no sistema'] },
      { titulo:'Negociação & Baixa', sla:5, tasks:['Apresentar proposta de parcelamento','Registrar acordo no sistema','Emitir novo boleto com valor negociado','Confirmar recebimento do pagamento','Dar baixa no título após confirmação bancária','Arquivar comprovante no histórico','Comunicar resultado da cobrança ao cliente'] },
    ]
  },
]

export default function EsteirasPage() {
  const [selected, setSelected] = useState(null)
  const [checked, setChecked] = useState({})

  const est = ESTEIRAS.find(e => e.id === selected)

  function toggleCheck(etIdx, tIdx) {
    const key = `${selected}-${etIdx}-${tIdx}`
    setChecked(p => ({ ...p, [key]: !p[key] }))
  }

  function getProgress(etIdx, tasks) {
    const done = tasks.filter((_, i) => checked[`${selected}-${etIdx}-${i}`]).length
    return { done, total: tasks.length, pct: Math.round(done/tasks.length*100) }
  }

  if (selected && est) return (
    <div>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
        <button onClick={() => setSelected(null)} style={{ border:'1px solid #E2E8F0', background:'#fff', borderRadius:8, padding:'6px 12px', cursor:'pointer', fontSize:12 }}>← Voltar</button>
        <span style={{ fontSize:16, fontWeight:700, color:'#0F172A' }}>{est.icon} {est.name}</span>
      </div>
      {est.etapas.map((et, etIdx) => {
        const prog = getProgress(etIdx, et.tasks)
        return (
          <Card key={etIdx} style={{ marginBottom:14 }}>
            <CardHeader title={et.titulo} right={
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <div style={{ fontSize:11, color:'#64748B' }}>{prog.done}/{prog.total}</div>
                <div style={{ width:80, height:6, background:'#F1F5F9', borderRadius:99, overflow:'hidden' }}>
                  <div style={{ height:'100%', background: prog.pct===100?'#22C55E':'#6366F1', borderRadius:99, width:`${prog.pct}%`, transition:'width .3s' }} />
                </div>
                <span style={{ fontSize:10, fontWeight:700, color: prog.pct===100?'#15803D':'#6366F1' }}>{prog.pct}%</span>
              </div>
            } />
            <div style={{ padding:'8px 0' }}>
              {et.tasks.map((task, tIdx) => {
                const key = `${selected}-${etIdx}-${tIdx}`
                const isDone = checked[key]
                const isHeader = task.startsWith('—')
                if (isHeader) return (
                  <div key={tIdx} style={{ padding:'6px 16px 2px', fontSize:10, fontWeight:700, color:'#F97316', textTransform:'uppercase', letterSpacing:'.05em' }}>{task}</div>
                )
                return (
                  <div key={tIdx} onClick={() => toggleCheck(etIdx, tIdx)}
                    style={{ display:'flex', alignItems:'center', gap:10, padding:'7px 16px', cursor:'pointer', background: isDone?'#F0FDF4':'' }}
                    onMouseEnter={e => { if(!isDone) e.currentTarget.style.background='#F8FAFC' }}
                    onMouseLeave={e => { if(!isDone) e.currentTarget.style.background='' }}>
                    <div style={{ width:18, height:18, borderRadius:4, border:`2px solid ${isDone?'#22C55E':'#CBD5E1'}`, background: isDone?'#22C55E':'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all .15s' }}>
                      {isDone && <span style={{ color:'#fff', fontSize:10, lineHeight:1 }}>✓</span>}
                    </div>
                    <span style={{ fontSize:12, color: isDone?'#94A3B8':'#334155', textDecoration: isDone?'line-through':'none' }}>{task}</span>
                  </div>
                )
              })}
            </div>
          </Card>
        )
      })}
    </div>
  )

  return (
    <div>
      <div style={{ fontSize:13, color:'#64748B', marginBottom:16 }}>Selecione uma esteira para ver o checklist completo</div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:14 }}>
        {ESTEIRAS.map(est => {
          const totalTasks = est.etapas.reduce((a,e) => a + e.tasks.filter(t=>!t.startsWith('—')).length, 0)
          const doneTasks = est.etapas.reduce((a,e,etIdx) => a + e.tasks.filter((t,tIdx) => !t.startsWith('—') && checked[`${est.id}-${etIdx}-${tIdx}`]).length, 0)
          const pct = totalTasks > 0 ? Math.round(doneTasks/totalTasks*100) : 0
          return (
            <div key={est.id} onClick={() => setSelected(est.id)}
              style={{ background:'#fff', border:'1px solid #E2E8F0', borderRadius:12, padding:16, cursor:'pointer', transition:'all .15s', borderLeft:`4px solid ${est.color}` }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow='0 4px 20px rgba(0,0,0,.08)'; e.currentTarget.style.transform='translateY(-1px)' }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow=''; e.currentTarget.style.transform='' }}>
              <div style={{ fontSize:22, marginBottom:8 }}>{est.icon}</div>
              <div style={{ fontSize:14, fontWeight:700, color:'#0F172A', marginBottom:4 }}>{est.name}</div>
              <div style={{ fontSize:11, color:'#64748B', marginBottom:12 }}>{est.desc}</div>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                <div style={{ flex:1, height:6, background:'#F1F5F9', borderRadius:99, overflow:'hidden' }}>
                  <div style={{ height:'100%', background:est.color, borderRadius:99, width:`${pct}%` }} />
                </div>
                <span style={{ fontSize:10, fontWeight:700, color:'#64748B' }}>{pct}%</span>
              </div>
              <div style={{ fontSize:10, color:'#94A3B8' }}>{est.etapas.length} etapas · {totalTasks} tarefas</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
