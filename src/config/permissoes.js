// Controle de acesso por perfil de usuário.
//
// `null` em ROTAS_POR_PERFIL significa acesso total (usado só pelo admin).
// Qualquer perfil fora da lista abaixo (ou não reconhecido) cai no fallback
// mais restritivo — ver `podeAcessarRota`.
//
// Critério usado pra montar as listas: cada perfil só vê o que precisa pro
// próprio trabalho. Dado financeiro/estratégico (Precificação, Executivo,
// Rentabilidade, custo/hora da equipe, Cofre, Config) fica restrito a quem
// gerencia o negócio (admin/gestor). Ajuda, Meu Painel e a Central
// Operacional ficam liberados pra todo mundo — não têm dado sensível e são
// necessários no dia a dia de qualquer perfil.

const ROTAS_COMUNS = ['/', '/meu-painel', '/ajuda', '/agenda']

export const ROTAS_POR_PERFIL = {
  admin: null,

  // Quase tudo — só fica de fora o que é da conta em si (Config), que tem
  // aba própria já restrita a admin dentro do ConfigPage.
  gestor: [
    ...ROTAS_COMUNS,
    '/tasks', '/modelos', '/pendencias', '/avulsas',
    '/crm', '/precificacao',
    '/clientes', '/esteiras',
    '/exec', '/rent', '/cap', '/cofre',
    '/mensagens', '/relatorios', '/mentoria', '/plano-negocio',
    '/config',
  ],

  // Operação do dia a dia, sem números estratégicos da empresa.
  supervisor: [
    ...ROTAS_COMUNS,
    '/tasks', '/modelos', '/pendencias', '/avulsas',
    '/clientes', '/esteiras',
    '/mensagens',
  ],

  // Só o necessário pra executar tarefas.
  operador: [
    ...ROTAS_COMUNS,
    '/tasks', '/avulsas',
    '/clientes',
  ],

  // Foco em captação e proposta — sem acesso à operação nem à configuração.
  comercial: [
    ...ROTAS_COMUNS,
    '/crm', '/precificacao',
    '/clientes',
  ],
}

// Prefixos: '/clientes' também libera '/clientes/:id'.
export function podeAcessarRota(perfil, path) {
  if (perfil === 'admin' || perfil == null) return true
  const permitidas = ROTAS_POR_PERFIL[perfil]
  if (permitidas == null) return true // perfil sem lista definida = tratado como admin (não deveria acontecer)
  return permitidas.some(rota => path === rota || path.startsWith(rota + '/'))
}

// Abas de ClientePage.jsx com dado financeiro/sensível — só quem já tem
// acesso a Precificação/Executivo/Cofre no menu principal (admin/gestor)
// vê essas abas dentro do cliente também.
const ABAS_CLIENTE_RESTRITAS = new Set(['financeiro', 'radar', 'relatorio360', 'cofre'])
export function podeVerAbaCliente(perfil, abaId) {
  if (!ABAS_CLIENTE_RESTRITAS.has(abaId)) return true
  return perfil === 'admin' || perfil === 'gestor'
}
