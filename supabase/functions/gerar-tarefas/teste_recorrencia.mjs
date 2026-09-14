// ══════════════════════════════════════════════════════════════════════════════
// Teste da lógica de recorrência do gerar-tarefas.
// Rode:  node supabase/functions/gerar-tarefas/teste_recorrencia.mjs
//
// Não reimplementa nada: recorta as funções puras do próprio index.ts que vai
// pra produção, transpila com esbuild (via npx, não precisa instalar nada) e
// testa. Se alguém mexer na recorrência e quebrar um caso, isso acusa aqui em
// vez de virar "cliente sem tarefa nenhuma no mês" três semanas depois.
// ══════════════════════════════════════════════════════════════════════════════
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const aqui = dirname(fileURLToPath(import.meta.url))
const src  = readFileSync(join(aqui, 'index.ts'), 'utf8')
const ini  = src.indexOf('// ── Dia do mês pedido')
const fim  = src.indexOf('// ── Tipo para detalhe de auditoria')
if (ini < 0 || fim < 0) throw new Error('Marcadores não encontrados no index.ts — o teste precisa ser reapontado.')

const dir = mkdtempSync(join(tmpdir(), 'fluxe-rec-'))
writeFileSync(join(dir, 'rec.ts'),
  src.slice(ini, fim) + '\nexport { deveGerarNaData, diaEfetivo, mesBateNaSerie, ultimoDiaDoMes }\n')
execFileSync('npx', ['--yes', 'esbuild@0.23.1', join(dir, 'rec.ts'),
  '--format=esm', `--outfile=${join(dir, 'rec.mjs')}`, '--log-level=warning'], { stdio: 'inherit' })

const { deveGerarNaData, diaEfetivo, mesBateNaSerie } = await import(pathToFileURL(join(dir, 'rec.mjs')).href)

const SEM_FERIADO = new Set()
let ok = 0, fail = 0
function t(nome, real, esperado) {
  if (JSON.stringify(real) === JSON.stringify(esperado)) { ok++; return }
  fail++
  console.log(`  ✗ ${nome}\n      esperado ${JSON.stringify(esperado)}\n      recebido ${JSON.stringify(real)}`)
}
function dias(modelo, de, ate, feriados = SEM_FERIADO) {
  const out = [], d = new Date(de + 'T12:00:00'), f = new Date(ate + 'T12:00:00')
  while (d <= f) {
    const s = d.toISOString().slice(0, 10)
    if (deveGerarNaData(modelo, s, feriados).deve) out.push(s)
    d.setDate(d.getDate() + 1)
  }
  return out
}
const conta = (...a) => dias(...a).length

// 2027 não é bissexto (fev = 28 dias); 2028 é (fev = 29).
console.log('\n── Dia 29/30/31 em mês curto: cai no último dia, não some ──')
t('mensal dia 31 → fevereiro no dia 28', dias({recorrencia:'mensal',dia_mes:31},'2027-02-01','2027-02-28'), ['2027-02-28'])
t('mensal dia 31 → gera nos 12 meses',   conta({recorrencia:'mensal',dia_mes:31},'2027-01-01','2027-12-31'), 12)
t('mensal dia 31 → 1x em fevereiro, sem duplicar', conta({recorrencia:'mensal',dia_mes:31},'2027-02-01','2027-02-28'), 1)
t('mensal dia 30 → abril no dia 30',     dias({recorrencia:'mensal',dia_mes:30},'2027-04-01','2027-04-30'), ['2027-04-30'])
t('mensal dia 29 → fev bissexto no 29',  dias({recorrencia:'mensal',dia_mes:29},'2028-02-01','2028-02-29'), ['2028-02-29'])
t('mensal dia 5 → segue no dia 5',       dias({recorrencia:'mensal',dia_mes:5},'2027-01-01','2027-03-31'), ['2027-01-05','2027-02-05','2027-03-05'])

console.log('── Mês configurável nas recorrências longas ──')
t('anual mês 4 (IRPF 30/abr)',  dias({recorrencia:'anual',dia_mes:30,mes:4},'2027-01-01','2027-12-31'), ['2027-04-30'])
t('anual mês 12 dia 31',        dias({recorrencia:'anual',dia_mes:31,mes:12},'2027-01-01','2027-12-31'), ['2027-12-31'])
t('trimestral mês 2 → fev/mai/ago/nov', dias({recorrencia:'trimestral',dia_mes:10,mes:2},'2027-01-01','2027-12-31'),
  ['2027-02-10','2027-05-10','2027-08-10','2027-11-10'])
t('semestral mês 3 → mar/set',  dias({recorrencia:'semestral',dia_mes:15,mes:3},'2027-01-01','2027-12-31'), ['2027-03-15','2027-09-15'])
t('bimestral mês 2 → 6x no ano', conta({recorrencia:'bimestral',dia_mes:8,mes:2},'2027-01-01','2027-12-31'), 6)
t('série que começa em dezembro atravessa o ano',
  dias({recorrencia:'bimestral',dia_mes:5,mes:12},'2027-01-01','2027-06-30'), ['2027-02-05','2027-04-05','2027-06-05'])

console.log('── Compatibilidade: sem `mes`, vale o comportamento antigo (janeiro) ──')
t('anual sem mes → janeiro',      dias({recorrencia:'anual',dia_mes:10,mes:null},'2027-01-01','2027-12-31'), ['2027-01-10'])
t('trimestral mes=1 → jan/abr/jul/out', dias({recorrencia:'trimestral',dia_mes:10,mes:1},'2027-01-01','2027-12-31'),
  ['2027-01-10','2027-04-10','2027-07-10','2027-10-10'])
t('semestral mes=1 → jan/jul',    dias({recorrencia:'semestral',dia_mes:15,mes:1},'2027-01-01','2027-12-31'), ['2027-01-15','2027-07-15'])
t('bimestral mes=1 → meses ímpares', dias({recorrencia:'bimestral',dia_mes:8,mes:1},'2027-01-01','2027-06-30'),
  ['2027-01-08','2027-03-08','2027-05-08'])

console.log('── Rotina sem configuração: não gera, mas diz por quê ──')
const semDia = deveGerarNaData({recorrencia:'semanal',dias_semana:[]}, '2027-03-10', SEM_FERIADO)
t('semanal sem dia marcado → não gera', semDia.deve, false)
t('semanal sem dia marcado → motivo aponta o cadastro', /nunca vai gerar/.test(semDia.motivo), true)
t('semanal com dias_semana null → mesmo motivo',
  /nunca vai gerar/.test(deveGerarNaData({recorrencia:'semanal',dias_semana:null},'2027-03-10',SEM_FERIADO).motivo), true)
t('dias_especificos vazio → motivo aponta o cadastro',
  /nunca vai gerar/.test(deveGerarNaData({recorrencia:'dias_especificos',dias_mes:[]},'2027-03-10',SEM_FERIADO).motivo), true)

console.log('── Não regrediu ──')
t('diaria → 31 dias em março',    conta({recorrencia:'diaria'},'2027-03-01','2027-03-31'), 31)
t('dias_uteis março/2027 → 23',   conta({recorrencia:'dias_uteis'},'2027-03-01','2027-03-31'), 23)
t('dias_uteis pula feriado',      conta({recorrencia:'dias_uteis'},'2027-03-01','2027-03-31',new Set(['2027-03-10'])), 22)
t('semanal quarta → 5x em março', conta({recorrencia:'semanal',dias_semana:[3]},'2027-03-01','2027-03-31'), 5)
t('quinzenal dia 5 → 5 e 20',     dias({recorrencia:'quinzenal',dia_mes:5},'2027-03-01','2027-03-31'), ['2027-03-05','2027-03-20'])
t('quinzenal dia 28 em fev → 1 só', dias({recorrencia:'quinzenal',dia_mes:28},'2027-02-01','2027-02-28'), ['2027-02-28'])
t('dias_especificos [1,15]',      dias({recorrencia:'dias_especificos',dias_mes:[1,15]},'2027-03-01','2027-03-31'), ['2027-03-01','2027-03-15'])
t('recorrência desconhecida → não gera', deveGerarNaData({recorrencia:'xpto'},'2027-03-10',SEM_FERIADO).deve, false)

console.log('── Helpers ──')
t('diaEfetivo(31, fev/2027) = 28', diaEfetivo(31, 2027, 1), 28)
t('diaEfetivo(31, fev/2028) = 29', diaEfetivo(31, 2028, 1), 29)
t('diaEfetivo(0, ...) = 1',        diaEfetivo(0, 2027, 2), 1)
t('mesBateNaSerie(dez, início fev, passo 2)', mesBateNaSerie(11, 2, 2), true)
t('mesBateNaSerie(jan, início fev, passo 2)', mesBateNaSerie(0, 2, 2), false)

console.log(`\n${fail === 0 ? '✅' : '❌'} ${ok} passaram, ${fail} falharam\n`)
process.exit(fail ? 1 : 0)
