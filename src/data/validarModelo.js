// Regras de um modelo de tarefa válido. Módulo separado de propósito: o app
// (useImportarBibliotecaModelos) e o teste da biblioteca usam exatamente esta
// função, senão a validação e o teste divergem e o teste passa a mentir.
export const RECORRENCIAS_VALIDAS = [
  'diaria','dias_uteis','semanal','quinzenal','mensal','dias_especificos',
  'bimestral','trimestral','semestral','anual',
]
export const PRIORIDADES_VALIDAS = ['baixa','media','alta']

// Devolve o motivo do problema (string) ou null se o modelo está ok.
export function validarModeloBiblioteca(m) {
  if (!m?.titulo?.trim()) return 'sem título'
  // recorrencia é NOT NULL na tabela: um null aqui derruba o insert inteiro.
  if (!m.recorrencia) return 'sem recorrência'
  if (!RECORRENCIAS_VALIDAS.includes(m.recorrencia)) return `recorrência inválida ("${m.recorrencia}")`
  if (!PRIORIDADES_VALIDAS.includes(m.prioridade)) return `prioridade inválida ("${m.prioridade}")`
  // Os dois abaixo não dão erro de banco — entram e nunca geram tarefa, que é
  // pior: ninguém descobre até faltar tarefa no mês.
  if (m.recorrencia === 'semanal' && !m.dias_semana?.length) return 'semanal sem nenhum dia da semana'
  if (m.recorrencia === 'dias_especificos' && !m.dias_mes?.length) return 'dias específicos sem nenhum dia'
  return null
}
