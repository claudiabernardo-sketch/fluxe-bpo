import { useState } from 'react'

const CATS = [
  {
    id:'inicio', icon:'fa-solid fa-rocket', cor:'#6366F1', bg:'#EEF2FF',
    titulo:'Primeiros Passos', artigos:[
      { titulo:'Visão geral do Fluxe BPO', tempo:'3 min', conteudo:'O Fluxe é uma plataforma de gestão operacional para escritórios de BPO. Aqui você gerencia clientes, esteiras de processos, tarefas recorrentes, equipe e resultados em um só lugar. Acesse a Central Operacional (ícone de foguete) para ver o painel em tempo real.' },
      { titulo:'Cadastrar empresa e equipe', tempo:'5 min', conteudo:'Vá em Configurações > Empresa para preencher os dados do seu BPO. Em seguida, acesse Configurações > Equipe para convidar colaboradores por e-mail e definir seus perfis: Admin, Gestor, Supervisor ou Operador.' },
      { titulo:'Criar o primeiro cliente', tempo:'2 min', conteudo:'Acesse o módulo Clientes e clique em "Novo Cliente". Preencha nome, CNPJ e contato. Depois, associe as esteiras de serviço contratadas — isso fará com que as tarefas recorrentes sejam geradas automaticamente.' },
      { titulo:'Entendendo os perfis de acesso', tempo:'4 min', conteudo:'Admin: acesso total. Gestor: gerencia equipe, tarefas e relatórios. Operador: executa tarefas e vê apenas suas próprias atribuições. Supervisor: visão ampla sem acesso a configurações.' },
    ]
  },
  {
    id:'clientes', icon:'fa-solid fa-building', cor:'#0EA5E9', bg:'#F0F9FF',
    titulo:'Clientes', artigos:[
      { titulo:'Cadastrar e editar clientes', tempo:'3 min', conteudo:'No módulo Clientes, clique em "Novo Cliente". Após salvar, associe esteiras operacionais ao cliente para que as tarefas recorrentes sejam geradas automaticamente a cada período.' },
      { titulo:'Associar esteiras a um cliente', tempo:'2 min', conteudo:'Dentro do cadastro do cliente, acesse a aba "Esteiras". Escolha as esteiras contratadas. Isso determina quais rotinas serão criadas automaticamente para esse cliente.' },
      { titulo:'Score de saúde do cliente', tempo:'3 min', conteudo:'O score (0–100) reflete a situação operacional de cada cliente. É calculado pela quantidade de tarefas em atraso e pendências sem justificativa. Verde ≥ 80, amarelo ≥ 60, vermelho < 60.' },
      { titulo:'Arquivar e reativar clientes', tempo:'2 min', conteudo:'Clientes inativos podem ser arquivados para não poluir a lista. O histórico de tarefas é preservado. Para reativar, acesse Clientes > Arquivados.' },
    ]
  },
  {
    id:'esteiras', icon:'fa-solid fa-sitemap', cor:'#8B5CF6', bg:'#F5F3FF',
    titulo:'Esteiras', artigos:[
      { titulo:'O que é uma esteira operacional', tempo:'3 min', conteudo:'Uma esteira é um template de processo que agrupa rotinas recorrentes de BPO financeiro. Por exemplo: "Rotina Mensal de Contas a Pagar" pode conter 6 subtarefas que se repetem todo mês para cada cliente vinculado — verificar vencimentos, obter autorização, efetuar pagamento, salvar comprovante, entre outros.' },
      { titulo:'Criar uma nova esteira', tempo:'5 min', conteudo:'Acesse o módulo Esteiras e clique em "Nova Esteira". Dê um nome, defina a periodicidade e adicione as tarefas do processo. Cada tarefa pode ter prazo relativo (ex: "dia 5 do mês").' },
      { titulo:'Associar esteiras a clientes', tempo:'2 min', conteudo:'Após criar a esteira, vá ao cadastro de cada cliente e associe as esteiras contratadas. A geração de tarefas ocorre automaticamente conforme a periodicidade.' },
    ]
  },
  {
    id:'tarefas', icon:'fa-solid fa-list-check', cor:'#10B981', bg:'#ECFDF5',
    titulo:'Tarefas', artigos:[
      { titulo:'Tipos de tarefas no Fluxe', tempo:'3 min', conteudo:'Existem dois tipos: Rotinas (geradas automaticamente pelas esteiras) e Avulsas (criadas manualmente para atividades eventuais). Ambas aparecem na Central Operacional e podem ser atribuídas a operadores.' },
      { titulo:'Status de uma tarefa', tempo:'2 min', conteudo:'A Fazer → Em Andamento → Aguardando Cliente → Concluída. Também existe "Impedimento" para tarefas travadas por bloqueio externo. O status pode ser alterado pelo Kanban (arrastar) ou no detalhe da tarefa.' },
      { titulo:'Registrar uma pendência', tempo:'2 min', conteudo:'Quando uma tarefa não pode ser concluída, registre o motivo no campo "Motivo da pendência". Isso alimenta o relatório de pendências e o score de saúde do cliente.' },
      { titulo:'Apontamento de horas', tempo:'3 min', conteudo:'Use o Timer na barra superior para registrar o tempo dedicado a cada tarefa. O apontamento é vinculado à tarefa e ao operador, alimentando relatórios de horas e rentabilidade.' },
      { titulo:'Tarefas Avulsas', tempo:'2 min', conteudo:'Para atividades eventuais que não pertencem a uma esteira, use o módulo Avulsas. Crie a tarefa, atribua um responsável e defina o prazo. Ela aparecerá normalmente na Central Operacional.' },
    ]
  },
  {
    id:'rotinas', icon:'fa-solid fa-rotate', cor:'#F59E0B', bg:'#FFFBEB',
    titulo:'Rotinas', artigos:[
      { titulo:'Como funcionam as rotinas', tempo:'3 min', conteudo:'Rotinas são modelos de tarefas recorrentes vinculadas a esteiras. Quando um período começa, o sistema gera automaticamente as tarefas para todos os clientes com aquela esteira ativa.' },
      { titulo:'Criar e editar modelos', tempo:'4 min', conteudo:'No módulo Rotinas, crie modelos que definem título, descrição, prazo relativo e periodicidade. Cada modelo pode ser vinculado a uma ou mais esteiras.' },
      { titulo:'Geração automática de tarefas', tempo:'2 min', conteudo:'A geração ocorre ao visitar o módulo Tarefas. O sistema verifica se já foram criadas as tarefas do período atual e, se não, cria automaticamente — garantindo que o backlog esteja sempre populado.' },
    ]
  },
  {
    id:'central', icon:'fa-solid fa-rocket', cor:'#EF4444', bg:'#FEF2F2',
    titulo:'Central Operacional', artigos:[
      { titulo:'Entendendo a Central Operacional', tempo:'4 min', conteudo:'A Central Operacional é o coração do Fluxe. Ela exibe em tempo real: prioridades do dia, tarefas atrasadas, score de saúde dos clientes e o planejamento operacional da equipe.' },
      { titulo:'Usando o Kanban', tempo:'3 min', conteudo:'Na aba Kanban, visualize tarefas em colunas por status. Arraste e solte para mudar o status. Use os filtros por período e cliente para focar no que importa.' },
      { titulo:'Calendário operacional', tempo:'2 min', conteudo:'A aba Calendário mostra as tarefas distribuídas por data. Visualize por mês, semana ou dia. Tarefas em vermelho estão atrasadas.' },
    ]
  },
  {
    id:'relatorios', icon:'fa-solid fa-chart-column', cor:'#64748B', bg:'#F1F5F9',
    titulo:'Relatórios', artigos:[
      { titulo:'Relatório de desempenho mensal', tempo:'3 min', conteudo:'Selecione o mês e visualize: taxa de conclusão, tarefas por operador, distribuição por status e por cliente. Todos os dados podem ser exportados para Excel.' },
      { titulo:'Exportar para Excel', tempo:'2 min', conteudo:'Clique em "Exportar Excel" no módulo Relatórios. O arquivo contém 5 abas: Resumo, Tarefas, Pendências, Por Operador e Horas.' },
      { titulo:'Relatório de pendências', tempo:'3 min', conteudo:'A tabela de pendências lista todas as tarefas em atraso com motivo registrado, dias de atraso e responsável. Ideal para reuniões de checkpoint com clientes.' },
    ]
  },
  {
    id:'config', icon:'fa-solid fa-gear', cor:'#6366F1', bg:'#EEF2FF',
    titulo:'Configurações', artigos:[
      { titulo:'Configurar dados da empresa', tempo:'2 min', conteudo:'Acesse Configurações > Empresa para atualizar nome, CNPJ e dados de contato do seu BPO.' },
      { titulo:'Gerenciar a equipe', tempo:'3 min', conteudo:'Em Configurações > Equipe, convide novos colaboradores por e-mail, defina o perfil de acesso e gerencie quem está ativo ou inativo.' },
      { titulo:'Modo escuro', tempo:'1 min', conteudo:'Clique no ícone de lua/sol na topbar para alternar entre modo claro e escuro. A preferência é salva automaticamente.' },
    ]
  },
]

const Btn = ({ children, onClick, style = {} }) => {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ background:'none', border:'none', cursor:'pointer', fontFamily:'var(--fn)', ...style,
        ...(hov ? style['&:hover'] || {} : {}) }}
    >{children}</button>
  )
}

export default function AjudaPage() {
  const [busca, setBusca]           = useState('')
  const [catAtiva, setCatAtiva]     = useState(null)
  const [artigo, setArtigo]         = useState(null)

  const todoArtigos = CATS.flatMap(c => c.artigos.map(a => ({ ...a, cat: c })))
  const resultados  = busca.trim().length > 1
    ? todoArtigos.filter(a =>
        a.titulo.toLowerCase().includes(busca.toLowerCase()) ||
        a.conteudo.toLowerCase().includes(busca.toLowerCase()))
    : []

  const catSel = CATS.find(c => c.id === catAtiva)

  // ── Artigo aberto ───────────────────────────────
  if (artigo) {
    return (
      <div style={{ maxWidth:700, margin:'0 auto', paddingTop:8 }}>
        <button
          onClick={() => setArtigo(null)}
          style={{ display:'flex', alignItems:'center', gap:6, background:'none', border:'none', cursor:'pointer', color:'var(--tx3)', fontSize:12, marginBottom:16, fontFamily:'var(--fn)', padding:0 }}
        >
          <i className="fa-solid fa-arrow-left"></i>
          {catSel ? catSel.titulo : 'Resultados'}
        </button>
        <div style={{ background:'var(--sur)', border:'1px solid var(--bo)', borderRadius:'var(--rx)', padding:'24px 28px', boxShadow:'var(--sh)' }}>
          <div style={{ fontSize:10, fontWeight:700, color:'var(--br)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:8 }}>
            {artigo.cat?.titulo} · {artigo.tempo} de leitura
          </div>
          <h1 style={{ fontSize:18, fontWeight:800, color:'var(--tx)', letterSpacing:'-.4px', marginBottom:16 }}>{artigo.titulo}</h1>
          <p style={{ fontSize:13, color:'var(--tx2)', lineHeight:1.75 }}>{artigo.conteudo}</p>
        </div>
      </div>
    )
  }

  // ── Lista de artigos de uma categoria ───────────
  if (catAtiva && catSel) {
    return (
      <div style={{ maxWidth:700, margin:'0 auto', paddingTop:8 }}>
        <button
          onClick={() => setCatAtiva(null)}
          style={{ display:'flex', alignItems:'center', gap:6, background:'none', border:'none', cursor:'pointer', color:'var(--tx3)', fontSize:12, marginBottom:16, fontFamily:'var(--fn)', padding:0 }}
        >
          <i className="fa-solid fa-arrow-left"></i> Categorias
        </button>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:18 }}>
          <div style={{ width:40, height:40, borderRadius:12, background:catSel.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, color:catSel.cor }}>
            <i className={catSel.icon}></i>
          </div>
          <div>
            <div style={{ fontSize:16, fontWeight:800, color:'var(--tx)' }}>{catSel.titulo}</div>
            <div style={{ fontSize:11, color:'var(--tx3)' }}>{catSel.artigos.length} artigos</div>
          </div>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          {catSel.artigos.map((a, i) => (
            <ArtigoItem key={i} artigo={{ ...a, cat: catSel }} onClick={() => setArtigo({ ...a, cat: catSel })} />
          ))}
        </div>
      </div>
    )
  }

  // ── Home ─────────────────────────────────────────
  return (
    <div style={{ maxWidth:860, margin:'0 auto', paddingTop:8 }}>

      {/* Header + busca */}
      <div style={{ textAlign:'center', marginBottom:28 }}>
        <div style={{ fontSize:22, fontWeight:800, color:'var(--tx)', letterSpacing:'-.5px', marginBottom:5 }}>Central de Ajuda</div>
        <div style={{ fontSize:13, color:'var(--tx3)', marginBottom:18 }}>Encontre respostas ou fale com o suporte</div>
        <div style={{ position:'relative', maxWidth:440, margin:'0 auto' }}>
          <i className="fa-solid fa-magnifying-glass" style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', color:'var(--tx3)', fontSize:13 }}></i>
          <input
            type="text" className="fi"
            placeholder="Pesquisar artigos..."
            value={busca} onChange={e => setBusca(e.target.value)}
            style={{ paddingLeft:36, fontSize:13 }}
          />
        </div>
      </div>

      {/* Resultados de busca */}
      {busca.trim().length > 1 && (
        <div style={{ marginBottom:24 }}>
          {resultados.length === 0
            ? <div style={{ textAlign:'center', color:'var(--tx3)', fontSize:13, padding:'20px 0' }}>Nenhum resultado para "{busca}"</div>
            : (
              <>
                <div style={{ fontSize:11, fontWeight:700, color:'var(--tx3)', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:8 }}>
                  {resultados.length} resultado{resultados.length !== 1 ? 's' : ''}
                </div>
                {resultados.map((a, i) => (
                  <ArtigoItem key={i} artigo={a} onClick={() => { setCatAtiva(a.cat.id); setArtigo(a) }} withCat />
                ))}
              </>
            )
          }
        </div>
      )}

      {/* Grid de categorias */}
      {!busca && (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(195px,1fr))', gap:10, marginBottom:28 }}>
            {CATS.map(c => <CatCard key={c.id} cat={c} onClick={() => setCatAtiva(c.id)} />)}
          </div>

          {/* Suporte */}
          <div style={{ background:'var(--s2)', border:'1px solid var(--bo)', borderRadius:'var(--rl)', padding:'18px 20px' }}>
            <div style={{ fontSize:13, fontWeight:700, color:'var(--tx)', marginBottom:4 }}>Precisa de mais ajuda?</div>
            <div style={{ fontSize:12, color:'var(--tx3)', marginBottom:14 }}>Nossa equipe atende de segunda a sexta, das 8h às 18h.</div>
            <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
              <a href="https://wa.me/5511999999999?text=Ol%C3%A1%2C+preciso+de+ajuda+com+o+Fluxe+BPO"
                target="_blank" rel="noopener noreferrer"
                style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 16px', background:'#25D366', color:'#fff', borderRadius:'var(--r)', fontSize:12, fontWeight:700, textDecoration:'none' }}
              >
                <i className="fa-brands fa-whatsapp"></i> WhatsApp
              </a>
              <a href="mailto:suporte@fluxebpo.com.br"
                style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 16px', background:'var(--br)', color:'#fff', borderRadius:'var(--r)', fontSize:12, fontWeight:700, textDecoration:'none' }}
              >
                <i className="fa-solid fa-envelope"></i> E-mail
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ── Sub-componentes ─────────────────────────────────

function CatCard({ cat, onClick }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display:'flex', flexDirection:'column', gap:6, padding:'16px',
        background:'var(--sur)', border:`1px solid ${hov ? cat.cor : 'var(--bo)'}`,
        borderRadius:'var(--rl)', cursor:'pointer', textAlign:'left',
        fontFamily:'var(--fn)', transition:'all .2s',
        transform: hov ? 'translateY(-2px)' : 'none',
        boxShadow: hov ? 'var(--sh2)' : 'none',
      }}
    >
      <div style={{ width:36, height:36, borderRadius:10, background:cat.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, color:cat.cor }}>
        <i className={cat.icon}></i>
      </div>
      <div style={{ fontSize:12, fontWeight:700, color:'var(--tx)' }}>{cat.titulo}</div>
      <div style={{ fontSize:10, color:'var(--tx3)' }}>{cat.artigos.length} artigos</div>
    </button>
  )
}

function ArtigoItem({ artigo, onClick, withCat }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display:'flex', alignItems:'center', gap:12,
        padding:'12px 14px', background:'var(--sur)',
        border:`1px solid ${hov ? 'var(--brm)' : 'var(--bo)'}`,
        borderRadius:'var(--rl)', cursor:'pointer', textAlign:'left',
        width:'100%', fontFamily:'var(--fn)', transition:'border-color .15s',
        marginBottom:6,
      }}
    >
      {withCat && (
        <div style={{ width:32, height:32, borderRadius:8, background:artigo.cat.bg, display:'flex', alignItems:'center', justifyContent:'center', color:artigo.cat.cor, fontSize:12, flexShrink:0 }}>
          <i className={artigo.cat.icon}></i>
        </div>
      )}
      {!withCat && <div style={{ width:8, height:8, borderRadius:'50%', background:artigo.cat?.cor || 'var(--br)', flexShrink:0 }}></div>}
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:12, fontWeight:600, color:'var(--tx)' }}>{artigo.titulo}</div>
        <div style={{ fontSize:10, color:'var(--tx3)', marginTop:1 }}>
          {withCat && <>{artigo.cat.titulo} · </>}{artigo.tempo} de leitura
        </div>
      </div>
      <i className="fa-solid fa-chevron-right" style={{ color:'var(--tx3)', fontSize:10, flexShrink:0 }}></i>
    </button>
  )
}
