// Lista única de bancos — usada em ClientePage.jsx e ClientsPage.jsx. Antes
// existiam duas listas separadas que foram divergindo (uma tinha "Inter",
// a outra "Banco Inter"; uma "Caixa", a outra "Caixa Econômica Federal" etc.),
// e um cliente editado pelas duas telas acumulava valores "fantasma" que não
// batiam com nenhuma caixinha — sem poder ser desmarcados, e contados em
// dobro na geração de tarefas de conciliação bancária.
export const BANCOS_LIST = [
  'Banco do Brasil','Bradesco','Itaú','Santander','Caixa',
  'Nubank','Inter','Sicoob','Sicredi','BTG','C6 Bank','XP','Safra',
  'BV','Banrisul','Original','Neon','PicPay','Mercado Pago','CPJ Conta Azul',
  'PagBank','Stone','Cora','Asaas','Outros',
]

// Mapeia nomes antigos/completos salvos antes da lista ser unificada pro
// valor atual das caixinhas — sem isso, o valor antigo vira um item que
// nunca aparece marcado e nunca pode ser removido pela tela.
const ALIASES = {
  'caixa econômica federal': 'Caixa',
  'banco original': 'Original',
  'btg pactual': 'BTG',
  'outro': 'Outros',
}

export function normalizarBanco(nome) {
  if (BANCOS_LIST.includes(nome)) return nome
  const semPrefixo = nome.replace(/^Banco\s+/i, '').trim()
  if (BANCOS_LIST.includes(semPrefixo)) return semPrefixo
  const alias = ALIASES[nome.trim().toLowerCase()]
  return alias || nome
}

export function normalizarBancos(lista) {
  return [...new Set((lista || []).map(normalizarBanco))]
}
