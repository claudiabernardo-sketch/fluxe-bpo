// ══════════════════════════════════════════════════════════════════════════════
// Teste da biblioteca de modelos que todo cliente novo importa em 1 clique.
// Rode:  node src/data/teste_biblioteca.mjs
//
// Existe porque um único registro com "recorrencia": null derrubou o insert dos
// 50 modelos de uma vez — nenhuma empresa nova conseguia importar a biblioteca,
// e o usuário só via o erro cru do Postgres. Usa a MESMA validarModeloBiblioteca
// que o app usa no import.
// ══════════════════════════════════════════════════════════════════════════════
import { BIBLIOTECA_BPO } from './bibliotecaBpo.js'
import { validarModeloBiblioteca, RECORRENCIAS_VALIDAS, PRIORIDADES_VALIDAS } from './validarModelo.js'

let ok = 0, fail = 0
const erro = (msg) => { fail++; console.log('  ✗ ' + msg) }
const passa = () => { ok++ }

// ── 1. Nenhum modelo pode ser recusado pelo banco ou nascer morto ───────────
for (const m of BIBLIOTECA_BPO) {
  const motivo = validarModeloBiblioteca(m)
  motivo ? erro(`"${m.titulo}" — ${motivo}`) : passa()
}

// ── 2. Coerência dos campos que dependem da recorrência ────────────────────
for (const m of BIBLIOTECA_BPO) {
  if (m.dia_mes != null && (m.dia_mes < 1 || m.dia_mes > 31)) erro(`"${m.titulo}" — dia_mes fora de 1-31 (${m.dia_mes})`)
  else passa()
  if (m.dias_semana?.some(d => d < 0 || d > 6)) erro(`"${m.titulo}" — dias_semana fora de 0-6`)
  else passa()
  if (!Array.isArray(m.checklist_items)) erro(`"${m.titulo}" — checklist_items não é lista`)
  else passa()
}

// ── 3. Título duplicado vira tarefa duplicada na operação do cliente ───────
const vistos = new Set()
for (const m of BIBLIOTECA_BPO) {
  const k = m.titulo.trim().toLowerCase()
  if (vistos.has(k)) erro(`título duplicado: "${m.titulo}"`)
  else { vistos.add(k); passa() }
}

// ── 4. A própria validação precisa pegar o caso que quebrou a Be Solution ──
const casos = [
  [{ titulo:'x', recorrencia:null,        prioridade:'alta' },  'sem recorrência'],
  [{ titulo:'x', recorrencia:'mensal',    prioridade:'mensal' },'prioridade inválida'],
  [{ titulo:'x', recorrencia:'semanal',   prioridade:'alta' },  'semanal sem'],
  [{ titulo:'x', recorrencia:'quinzenaI', prioridade:'alta' },  'recorrência inválida'],
  [{ titulo:' ', recorrencia:'mensal',    prioridade:'alta' },  'sem título'],
]
for (const [modelo, esperado] of casos) {
  const motivo = validarModeloBiblioteca(modelo) || ''
  motivo.includes(esperado) ? passa() : erro(`validação não pegou "${esperado}" (devolveu "${motivo}")`)
}
// e não pode reprovar um modelo bom
validarModeloBiblioteca({ titulo:'ok', recorrencia:'semanal', prioridade:'alta', dias_semana:[1] }) === null
  ? passa() : erro('validação reprovou um modelo válido')

console.log(`\nbiblioteca: ${BIBLIOTECA_BPO.length} modelos`)
console.log(`recorrências usadas: ${[...new Set(BIBLIOTECA_BPO.map(m => m.recorrencia))].join(', ')}`)
console.log(`(válidas: ${RECORRENCIAS_VALIDAS.join(', ')} | prioridades: ${PRIORIDADES_VALIDAS.join(', ')})`)
console.log(`\n${fail === 0 ? '✅' : '❌'} ${ok} checagens passaram, ${fail} falharam\n`)
process.exit(fail ? 1 : 0)
