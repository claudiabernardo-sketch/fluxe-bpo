import { useState, useCallback, useEffect, useRef } from 'react'
import { useAuthStore } from '../store/authStore'
import { supabase } from '../lib/supabase'
import { useCreateProposta, useUpdateProposta, usePropostas, useClients, useApontamentosMes, useUsuarios } from '../hooks/useData'
import { formatBRL } from '../utils/currency'
import { computeMargemPorCliente, CUSTO_HORA_PADRAO } from '../utils/radar'

const HORAS_MES_PADRAO = 160

// contratoDocx importa a lib 'docx' que é pesada — lazy pra não bloquear o carregamento
const getContratoDocx = () => import('../utils/contratoDocx')

// ─── ESTILOS ────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&family=DM+Mono:wght@400;500&display=swap');

.prec-root {
  font-family: 'DM Sans', sans-serif;
  font-size: 14px;
  line-height: 1.6;
  color: #181714;
  --pg: #1A4D3A;
  --pg-light: #EAF2ED;
  --pg-mid: #2D7A5A;
  --pborder: #E8E5DE;
  --psurface: #FFFFFF;
  --psurface2: #F9F8F5;
  --ptext2: #6A6760;
  --ptext3: #A09D96;
  --pred: #B91C1C;
  --pyellow: #92400E;
  --pblue: #1E40AF;
}
.prec-root * { box-sizing: border-box; }

/* PROGRESS */
.prec-progress { display:flex; gap:0; margin-bottom:32px; position:relative; }
.prec-progress::before { content:''; position:absolute; top:18px; left:0; right:0; height:1px; background:var(--pborder); z-index:0; }
.prec-pstep { flex:1; display:flex; flex-direction:column; align-items:center; gap:5px; position:relative; z-index:1; }
.prec-pdot { width:36px; height:36px; border-radius:50%; border:2px solid var(--pborder); background:#F5F4F0; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:600; color:var(--ptext3); transition:all .3s; font-family:'DM Mono',monospace; }
.prec-plabel { font-size:10px; font-weight:500; color:var(--ptext3); text-align:center; letter-spacing:.03em; text-transform:uppercase; max-width:72px; }
.prec-pstep.active .prec-pdot { border-color:var(--pg); background:var(--pg); color:#fff; }
.prec-pstep.active .prec-plabel { color:var(--pg); }
.prec-pstep.done .prec-pdot { border-color:var(--pg-mid); background:var(--pg-light); color:var(--pg); }
.prec-pstep.done .prec-plabel { color:var(--pg-mid); }

/* CARD */
.prec-card { background:var(--psurface); border:1px solid var(--pborder); border-radius:12px; padding:24px; margin-bottom:18px; }
.prec-card-num { font-size:10px; font-weight:600; color:var(--ptext3); letter-spacing:.1em; text-transform:uppercase; margin-bottom:4px; font-family:'DM Mono',monospace; }
.prec-card-title { font-size:18px; font-weight:600; letter-spacing:-.02em; color:#181714; }
.prec-card-desc { font-size:13px; color:var(--ptext2); margin-top:5px; line-height:1.6; }

/* SEC */
.prec-sec { font-size:11px; font-weight:600; color:var(--ptext3); letter-spacing:.06em; text-transform:uppercase; margin:22px 0 12px; padding-bottom:6px; border-bottom:1px solid var(--pborder); }

/* FIELDS */
.prec-fgrid { display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-bottom:16px; }
.prec-fgrid3 { display:grid; grid-template-columns:1fr 1fr 1fr; gap:14px; margin-bottom:16px; }
.prec-field { display:flex; flex-direction:column; gap:5px; }
.prec-field label { font-size:11px; font-weight:500; color:var(--ptext2); letter-spacing:.03em; }
.prec-field .prec-hint { font-size:10px; color:var(--ptext3); line-height:1.4; margin-top:1px; }
.prec-input, .prec-select { padding:9px 12px; border:1.5px solid var(--pborder); border-radius:8px; font-family:'DM Sans',sans-serif; font-size:13px; color:#181714; background:var(--psurface); outline:none; transition:border-color .15s; width:100%; }
.prec-input:focus, .prec-select:focus { border-color:var(--pg); }

/* RANGE */
.prec-range-wrap { display:flex; align-items:center; gap:10px; }
.prec-range-wrap input[type=range] { flex:1; height:4px; accent-color:var(--pg); cursor:pointer; border:none; padding:0; background:transparent; }
.prec-range-val { font-family:'DM Mono',monospace; font-size:12px; font-weight:500; color:var(--pg); min-width:40px; text-align:right; }

/* GAUGE */
.prec-gauge-track { height:8px; background:var(--pborder); border-radius:99px; overflow:hidden; margin-bottom:6px; }
.prec-gauge-fill { height:100%; border-radius:99px; transition:width .5s cubic-bezier(.4,0,.2,1); }
.prec-gauge-labels { display:flex; justify-content:space-between; font-size:10px; color:var(--ptext3); }

/* RESULT TRIO */
.prec-trio { display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px; margin-bottom:20px; }
.prec-res { border-radius:12px; padding:18px 16px; border:2px solid transparent; }
.prec-res-min { background:#FEF2F2; border-color:#FCA5A5; }
.prec-res-rec { background:#ECFDF5; border-color:#6EE7B7; }
.prec-res-pre { background:#FEF9C3; border-color:#FCD34D; }
.prec-res-label { font-size:10px; font-weight:600; text-transform:uppercase; letter-spacing:.06em; margin-bottom:8px; }
.prec-res-min .prec-res-label { color:var(--pred); }
.prec-res-rec .prec-res-label { color:var(--pg); }
.prec-res-pre .prec-res-label { color:var(--pyellow); }
.prec-res-value { font-family:'DM Mono',monospace; font-size:22px; font-weight:500; letter-spacing:-.02em; margin-bottom:4px; }
.prec-res-min .prec-res-value { color:var(--pred); }
.prec-res-rec .prec-res-value { color:var(--pg); }
.prec-res-pre .prec-res-value { color:var(--pyellow); }
.prec-res-desc { font-size:11px; color:var(--ptext2); line-height:1.4; }

/* STATS */
.prec-stats { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; margin-bottom:20px; }
.prec-stat { background:var(--psurface2); border:1px solid var(--pborder); border-radius:8px; padding:14px; }
.prec-stat-label { font-size:10px; color:var(--ptext3); text-transform:uppercase; letter-spacing:.05em; margin-bottom:4px; }
.prec-stat-value { font-family:'DM Mono',monospace; font-size:20px; font-weight:500; color:#181714; }
.prec-stat-sub { font-size:10px; color:var(--ptext3); margin-top:2px; }

/* REASONING */
.prec-reasoning { background:var(--psurface2); border:1px solid var(--pborder); border-radius:12px; padding:20px; margin-bottom:18px; }
.prec-reasoning-title { font-size:12px; font-weight:600; color:var(--ptext2); margin-bottom:14px; display:flex; align-items:center; gap:8px; }
.prec-reasoning-title::before { content:''; width:3px; height:14px; background:var(--pg); border-radius:2px; flex-shrink:0; }
.prec-ri { display:flex; align-items:center; gap:8px; padding:7px 0; border-bottom:1px solid var(--pborder); font-size:12px; color:var(--ptext2); }
.prec-ri:last-child { border-bottom:none; }
.prec-ri-label { color:#181714; font-weight:500; min-width:170px; }
.prec-ri-val { color:var(--pg); font-family:'DM Mono',monospace; font-size:12px; margin-left:auto; }
.prec-badge { font-size:10px; padding:2px 7px; border-radius:99px; font-weight:600; flex-shrink:0; }
.badge-alto { background:#FEE2E2; color:#991B1B; }
.badge-medio { background:#FEF9C3; color:#92400E; }
.badge-baixo { background:#DCFCE7; color:#166534; }

/* BREAKDOWN TABLE */
.prec-table { width:100%; border-collapse:collapse; font-size:12px; }
.prec-table th { text-align:left; font-size:10px; font-weight:600; color:var(--ptext3); text-transform:uppercase; letter-spacing:.05em; padding:0 0 8px; border-bottom:1px solid var(--pborder); }
.prec-table td { padding:8px 0; border-bottom:1px solid var(--pborder); color:var(--ptext2); vertical-align:middle; }
.prec-table td:nth-child(2) { color:#181714; font-weight:500; text-align:right; font-family:'DM Mono',monospace; }
.prec-table td:nth-child(3) { text-align:right; padding-left:12px; }
.prec-table tr.prec-total td { font-weight:600; color:#181714; border-bottom:none; border-top:2px solid var(--pborder); padding-top:12px; }
.prec-table tr.prec-total td:nth-child(2) { color:var(--pg); font-size:15px; }
.prec-cpill { font-size:9px; font-weight:600; padding:2px 7px; border-radius:99px; }

/* ALERT BOX */
.prec-alert { border-radius:8px; padding:12px 16px; font-size:12px; margin-bottom:14px; display:flex; gap:8px; align-items:flex-start; line-height:1.5; }
.prec-alert-info { background:var(--pg-light); border:1px solid #A7C5B5; color:#1A3A2C; }
.prec-alert-tip { background:#EFF6FF; border:1px solid #BFDBFE; color:var(--pblue); }

/* PROPOSTA INPUT */
.prec-proposta-input { width:100%; padding:16px 20px; font-family:'DM Mono',monospace; font-size:28px; font-weight:500; letter-spacing:-.02em; border:2px solid var(--pborder); border-radius:12px; color:#181714; background:var(--psurface); outline:none; transition:border-color .3s; text-align:center; }
.prec-proposta-input:focus { border-color:var(--pg); }

/* FEEDBACK */
.prec-fb { border-radius:8px; padding:14px 16px; font-size:13px; font-weight:500; display:flex; gap:10px; align-items:flex-start; line-height:1.5; margin-top:12px; }
.prec-fb-red { background:#FEF2F2; border:1px solid #FCA5A5; color:#991B1B; }
.prec-fb-yellow { background:#FFFBEB; border:1px solid #FCD34D; color:#92400E; }
.prec-fb-green { background:#ECFDF5; border:1px solid #6EE7B7; color:#166534; }
.prec-fb-blue { background:#EFF6FF; border:1px solid #BFDBFE; color:var(--pblue); }

/* ACADEMIA */
.prec-academia { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
.prec-acad-card { background:var(--psurface); border:1px solid var(--pborder); border-radius:12px; padding:18px; cursor:pointer; transition:border-color .15s; }
.prec-acad-card:hover { border-color:var(--pg); }
.prec-acad-icon { font-size:22px; margin-bottom:6px; }
.prec-acad-title { font-size:13px; font-weight:600; color:#181714; margin-bottom:3px; }
.prec-acad-desc { font-size:11px; color:var(--ptext2); line-height:1.5; }
.prec-acad-body { background:var(--pg-light); border:1px solid #A7C5B5; border-radius:8px; padding:14px; margin-top:12px; font-size:12px; color:#1A3A2C; line-height:1.7; }
.prec-acad-body h4 { font-size:12px; font-weight:600; margin-bottom:8px; color:var(--pg); }
.prec-acad-body ul { margin-left:16px; margin-top:4px; }
.prec-acad-body li { margin-bottom:4px; }

/* SCOPE */
.prec-scope-block { background:var(--psurface2); border:1px solid var(--pborder); border-radius:8px; padding:16px; margin-bottom:12px; }
.prec-scope-title { font-size:11px; font-weight:600; color:var(--ptext2); text-transform:uppercase; letter-spacing:.05em; margin-bottom:10px; display:flex; align-items:center; gap:6px; }
.prec-scope-item { font-size:12px; color:var(--ptext2); padding:4px 0; display:flex; gap:6px; }
.prec-scope-item::before { content:'→'; color:var(--pg); flex-shrink:0; }

/* BTNS */
.prec-btn-row { display:flex; gap:10px; justify-content:flex-end; margin-top:22px; }
.prec-btn { padding:10px 22px; border-radius:8px; font-family:'DM Sans',sans-serif; font-size:13px; font-weight:500; cursor:pointer; border:none; transition:all .15s; }
.prec-btn-ghost { background:transparent; border:1.5px solid var(--pborder); color:var(--ptext2); }
.prec-btn-ghost:hover { border-color:#CECABE; color:#181714; }
.prec-btn-primary { background:var(--pg); color:#fff; }
.prec-btn-primary:hover { background:#15402F; }
.prec-atalho { padding:8px 14px; border-radius:8px; font-size:12px; font-weight:500; cursor:pointer; font-family:'DM Sans',sans-serif; border:1.5px solid; transition:all .15s; }

@media (max-width:600px) {
  /* Container raiz */
  .prec-root { padding:0 4px; }

  /* Título da página */
  .prec-root > div:first-child h1 { font-size:19px !important; }

  /* Grids viram coluna única */
  .prec-fgrid, .prec-fgrid3, .prec-trio, .prec-stats, .prec-academia { grid-template-columns:1fr !important; }

  /* Progress dots menores */
  .prec-pdot { width:28px; height:28px; font-size:9px; }
  .prec-plabel { display:none; }

  /* Cartão principal sem padding lateral excessivo */
  .prec-card { padding:16px 14px !important; }

  /* Botões empilham e ocupam 100% */
  .prec-btn-row { flex-direction:column-reverse; gap:8px; }
  .prec-btn-row .prec-btn { width:100%; text-align:center; padding:12px; }

  /* Tabela de breakdown scrollável */
  .prec-table-wrap { overflow-x:auto; -webkit-overflow-scrolling:touch; }
  .prec-table { min-width:420px; }

  /* Input valor proposta menor */
  .prec-proposta-input { font-size:22px; padding:12px 14px; }

  /* Valores trio — tamanho menor */
  .prec-res-value { font-size:18px; }

  /* Stats: 2 colunas em vez de 4 */
  .prec-stats { grid-template-columns:1fr 1fr !important; }

  /* reasoning: label sem min-width */
  .prec-ri { flex-wrap:wrap; }
  .prec-ri-label { min-width:unset; width:100%; }
  .prec-ri-val { margin-left:0; }

  /* Contrato: esconde header completo, simplifica */
  .ctr { padding:16px 12px !important; font-size:12px !important; }
  .ctr-header { flex-direction:column; gap:6px; }
  .ctr-assin { grid-template-columns:1fr !important; gap:24px; }
  .ctr-tb { font-size:11px; }
  .ctr-tb th, .ctr-tb td { padding:6px 7px; }
  .ctr-val-num { font-size:22px !important; }
  .ctr-titulo { font-size:13px !important; }
}
`

// ─── UTILITÁRIOS ────────────────────────────────────────────
// ─── FORMATAÇÃO ───────────────────────────────────────────────
const fmt = v => (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 })

// Retorna valor por extenso para valores grandes (≥ 10.000)
function fmtExtensoParcial(v) {
  if (!v || v < 10000) return fmt(v)
  if (v >= 1000000) {
    const m = (v / 1000000)
    const mStr = m % 1 === 0 ? m.toFixed(0) : m.toLocaleString('pt-BR', { maximumFractionDigits: 2 })
    return `${fmt(v)} (${mStr} milhão${m >= 2 ? 'ões' : ''} de reais)`
  }
  if (v >= 100000) {
    const k = Math.round(v / 1000)
    return `${fmt(v)} (${k} mil reais)`
  }
  return fmt(v)
}

// Converte string no formato brasileiro (ex: "80.000,00" ou "80000") para número
function parseBRL(str) {
  if (!str && str !== 0) return 0
  const s = String(str).trim()
  // Remove R$, espaços, e pontos de milhar; substitui vírgula decimal por ponto
  const clean = s.replace(/R\$\s?/g, '').replace(/\./g, '').replace(',', '.')
  return parseFloat(clean) || 0
}
// Propostas salvas antes desse campo aceitar vírgula vieram de um <input
// type=number> — nunca tem vírgula, só ponto decimal (ex: "1997.5"). As
// novas sempre têm vírgula (ex: "1.997,50"). Detecta pela vírgula pra não
// interpretar "1997.5" como 199750 por engano.
function parseValorPropostaSalvo(v) {
  if (!v) return 0
  return String(v).includes(',') ? parseBRL(v) : (parseFloat(v) || 0)
}
const calcPeso = (h, max) => h / max < 0.3 ? 'baixo' : h / max < 0.6 ? 'médio' : 'alto'

// ─── MOTOR DE CÁLCULO ───────────────────────────────────────
function calcularMetodologia(d) {
  const items = []
  const add = (nome, horas, peso, motivo) => {
    if (horas > 0) items.push({ nome, horas: Math.round(horas * 10) / 10, peso, motivo })
  }

  const hConcBanc = d.bancos * 1.5 + d.mov * 0.003
  add('Conciliação bancária', hConcBanc, calcPeso(hConcBanc, 8),
    `${d.bancos} conta${d.bancos > 1 ? 's' : ''} × 1,5h + ${d.mov} movimentações`)

  if (d.capag > 0) add('Contas a pagar', 0.5 + d.capag * 0.05, calcPeso(0.5 + d.capag * 0.05, 5),
    `${d.capag} títulos/mês (base 0,5h + 3min por título)`)

  if (d.carec > 0) add('Cobranças manuais a receber', 0.5 + d.carec * 0.04, calcPeso(0.5 + d.carec * 0.04, 5),
    `${d.carec} cliente${d.carec > 1 ? 's' : ''} com cobrança individual/mês`)

  if (d.agend > 0) add('Agendamento bancário', 0.5 + d.capag * 0.033, calcPeso(0.5 + d.capag * 0.033, 5),
    `${d.capag} pagamento${d.capag !== 1 ? 's' : ''}/mês no banco (~2 min cada + 0,5h de gestão)`)

  if (d.nfs > 0) add('Emissão de notas fiscais', 0.3 + d.nfs * 0.07, calcPeso(0.3 + d.nfs * 0.07, 4),
    `${d.nfs} NFs/mês (~4min por nota)`)

  if (d.boletos > 0) add('Emissão de boletos', 0.3 + d.boletos * 0.05, calcPeso(0.3 + d.boletos * 0.05, 4),
    `${d.boletos} boletos/mês`)

  if (d.carec > 0) add('Cobrança de inadimplentes', 0.3 + d.carec * 0.02, 'baixo',
    `Follow-up sobre ${d.carec} cobranças manuais`)

  if (d.sistcob) add('Gestão sistema de cobrança', 0.5, 'baixo', 'Asaas, Iugu ou similar')
  if (d.cartao > 0) add('Conciliação de cartões de crédito', 0.3 + d.cartao * 1.0, calcPeso(0.3 + d.cartao * 1.0, 5),
    `${d.cartao} cartão${d.cartao > 1 ? 'ões' : ''} × 1h (fatura + classificação de despesas)`)

  if (d.plat > 0) add('Conciliação outras plataformas', d.plat * 1.2, 'médio',
    `${d.plat} plataforma${d.plat > 1 ? 's' : ''} (PagSeguro, Mercado Pago…)`)


  if (d.contab) add('Envio de documentos à contabilidade', 0.5, 'baixo', 'Organização e envio mensal')

  if (d.relat > 0) add('Relatórios gerenciais', d.relat === 1 ? 1.5 : 3.0, d.relat === 2 ? 'alto' : 'médio',
    d.relat === 1 ? 'DRE + fluxo de caixa' : 'DRE + fluxo + indicadores + análises')

  if (d.reuniao > 0) add('Reunião mensal', 1.0 + d.reuniao, 'médio',
    d.reuniao === 1 ? '1h online + preparação' : '1h presencial + deslocamento + preparação')

  if (d.consult > 0) add('Consultoria e planejamento', d.consult === 1 ? 2.0 : 4.0, 'alto',
    d.consult === 1 ? 'Análises estratégicas mensais' : 'Planejamento completo (budget, metas, DRE projetado)')

  if (d.lembrete) add('Lembrete de vencimento (WhatsApp)', 0.3, 'baixo', 'Avisos automáticos')

  // Nenhuma atividade real configurada (ex: cliente só de licença/repasse,
  // sem nenhuma hora de BPO) — verifica antes da linha fixa abaixo, que
  // senão mascara esse caso e deixa parecer que o cálculo é válido.
  const semAtividadeReal = items.length === 0

  add('Gestão de documentos', 0.5, 'baixo', 'Organização e arquivamento')

  if (d.cnpjs > 1) {
    const hBase = items.reduce((s, i) => s + i.horas, 0)
    const hExtra = hBase * (d.cnpjs - 1) * 0.3
    add('Complexidade multi-CNPJ', hExtra, 'alto',
      `+30% por CNPJ adicional (${d.cnpjs - 1} adicional${d.cnpjs > 2 ? 'is' : ''})`)
  }

  let fatorFat = 1.0
  if (d.fat > 1000000) fatorFat = 1.40
  else if (d.fat > 500000) fatorFat = 1.25
  else if (d.fat > 200000) fatorFat = 1.15
  else if (d.fat > 80000) fatorFat = 1.08

  const totalBase = items.reduce((s, i) => s + i.horas, 0)
  const totalHoras = Math.round(totalBase * fatorFat * 10) / 10

  if (fatorFat > 1.0) {
    items.push({
      nome: 'Ajuste de porte (faturamento)',
      horas: Math.round((totalHoras - totalBase) * 10) / 10,
      peso: 'médio',
      motivo: `Fator ${fatorFat}× por faturamento de ${fmtExtensoParcial(d.fat)}/mês`
    })
  }

  const complexidade = Math.min(Math.round((totalHoras / 40) * 100), 100)
  const complexLabel = complexidade < 25 ? 'Baixa' : complexidade < 50 ? 'Média' : complexidade < 75 ? 'Média alta' : 'Alta'
  const complexColor = complexidade < 25 ? '#16A34A' : complexidade < 50 ? '#D97706' : complexidade < 75 ? '#EA580C' : '#DC2626'

  let risco = 0
  if (d.agend) risco += 20
  if (d.nfs > 50) risco += 10
  if (d.cnpjs > 2) risco += 15
  if (d.consult > 0) risco += 10
  const riscoLabel = risco < 20 ? 'Baixo' : risco < 40 ? 'Moderado' : 'Alto'

  const percCap = Math.min(totalHoras / 160, 1)
  const overheadCliente = d.overhead * percCap

  // Licença do ERP: só entra no custo se for paga pelo BPO e embutida no preço.
  // Repasse NÃO é custo nem receita — é reembolso, exibido separadamente.
  const licencaValor = d.licencaValor || 0
  const licencaEmbutida = d.licencaModalidade === 'bpo_embutida' ? licencaValor : 0
  const licencaRepasse  = d.licencaModalidade === 'repasse' ? licencaValor : 0

  const custoReal = totalHoras * d.custoHora + overheadCliente + licencaEmbutida

  const vMinimo = custoReal / (1 - d.aliquota)
  const vRecomendado = custoReal / ((1 - d.aliquota) * (1 - d.margem))
  const vPremium = vRecomendado * 1.30

  return { items, totalHoras, complexidade, complexLabel, complexColor, riscoLabel, risco, custoReal, overheadCliente, licencaEmbutida, licencaRepasse, vMinimo, vRecomendado, vPremium, semAtividadeReal, d }
}

// ─── ACADEMIA ───────────────────────────────────────────────
const ACADEMIA = [
  {
    icon: '💰', titulo: 'Por que a maioria dos BPOs precifica errado', desc: 'Erros mais comuns e como evitá-los',
    body: <><h4>Os 4 erros mais comuns</h4><ul><li><strong>Precificar por feeling</strong> — sem custo real, você não sabe se lucra ou perde.</li><li><strong>Ignorar horas reais</strong> — 3 CNPJs com 500 movimentações ≠ 1 CNPJ com 50.</li><li><strong>Não incluir overhead</strong> — softwares, internet e tempo de gestão têm custo.</li><li><strong>Medo de cobrar o valor justo</strong> — clientes que não valorizam raramente se tornam bons clientes.</li></ul><br/><strong>Regra de ouro:</strong> Nunca aceite fechar abaixo do mínimo sustentável.</>
  },
  {
    icon: '📊', titulo: 'Como calcular seu custo-hora corretamente', desc: 'A base de toda precificação saudável',
    body: <><h4>Fórmula do custo-hora real</h4><ul><li>Salário / pró-labore desejado: ex. R$ 5.000</li><li>Encargos e benefícios (30%): + R$ 1.500</li><li>Overhead (ferramentas, internet): + R$ 800</li><li>Total mensal: R$ 7.300</li><li>Horas produtivas (160h × 70%): 112h</li><li><strong>Custo-hora: R$ 7.300 ÷ 112 = R$ 65/h</strong></li></ul><br/><strong>Importante:</strong> Reserve 20–30% das horas para gestão, vendas e imprevistos.</>
  },
  {
    icon: '📈', titulo: 'A relação com o faturamento do cliente', desc: 'Benchmarks de mercado para BPO',
    body: <><h4>Benchmarks de mercado</h4><ul><li><strong>1% a 2%</strong> — faixa saudável. Fácil aprovação.</li><li><strong>2% a 3%</strong> — ainda aceitável. Justifique com entregáveis claros.</li><li><strong>Acima de 3%</strong> — prepare argumentação de ROI sólida.</li><li><strong>Abaixo de 1%</strong> — verifique se o escopo é sustentável.</li></ul><br/><strong>Argumento:</strong> Um BPO bem feito evita multas e perdas por inadimplência. O custo do descontrole é sempre maior.</>
  },
  {
    icon: '🎯', titulo: 'Como apresentar o preço sem perder a venda', desc: 'Técnicas de apresentação consultiva',
    body: <><h4>Sequência ideal na reunião</h4><ul><li><strong>1. Diagnóstico primeiro</strong> — antes de falar em preço, mostre que entendeu a operação.</li><li><strong>2. Apresente o escopo</strong> — quanto mais detalhado, mais o cliente percebe valor.</li><li><strong>3. Fale em horas</strong> — "14 horas/mês dedicadas" é mais poderoso que um número sozinho.</li><li><strong>4. Compare alternativas</strong> — auxiliar CLT custa R$ 3.000–5.000/mês sem especialidade.</li><li><strong>5. Apresente os 3 cenários</strong> — deixe o cliente escolher o nível.</li></ul></>
  },
  {
    icon: '⚖️', titulo: 'Quando e como negociar', desc: 'Critérios para concessões sem comprometer rentabilidade',
    body: <><h4>Regras para negociação saudável</h4><ul><li><strong>Nunca negocie abaixo do mínimo</strong> — se não pode pagar o mínimo, não é o cliente certo agora.</li><li><strong>Se der desconto, retire escopo</strong> — "posso reduzir, mas retiramos a reunião mensal."</li><li><strong>Desconto por volume</strong> — 2+ empresas do mesmo grupo: 10–15% na segunda.</li><li><strong>Contrato anual</strong> — 5–10% de desconto para 12 meses.</li></ul></>
  },
  {
    icon: '🚨', titulo: 'Sinais de que um cliente não é rentável', desc: 'Identifique antes de fechar',
    body: <><h4>Red flags na precificação</h4><ul><li>Questiona muito o preço antes de entender o serviço</li><li>Faturamento baixo para o escopo solicitado</li><li>Alta complexidade com orçamento limitado</li><li>Prazo de pagamento muito longo (60–90 dias)</li><li>Histórico de troca frequente de prestadores</li></ul><br/><strong>Princípio Fluxe:</strong> 10 clientes rentáveis &gt; 20 clientes que drenam energia e margem.</>
  },
]

// ─── COMPONENTES MENORES ─────────────────────────────────────
function Campo({ label, hint, children }) {
  return (
    <div className="prec-field">
      <label>{label}</label>
      {children}
      {hint && <div className="prec-hint">{hint}</div>}
    </div>
  )
}

function Trio({ c, mini = false }) {
  const sz = mini ? '18px' : '22px'
  return (
    <div className="prec-trio">
      <div className="prec-res prec-res-min">
        <div className="prec-res-label">⚠ Mínimo sustentável</div>
        <div className="prec-res-value" style={{ fontSize: sz }}>{fmt(c.vMinimo)}</div>
        {!mini && <div className="prec-res-desc">Cobre custo + impostos. Abaixo disso é prejuízo.</div>}
      </div>
      <div className="prec-res prec-res-rec">
        <div className="prec-res-label">✓ Recomendado Fluxe</div>
        <div className="prec-res-value" style={{ fontSize: sz }}>{fmt(c.vRecomendado)}</div>
        {!mini && <div className="prec-res-desc">Equilíbrio ideal entre competitividade e rentabilidade.</div>}
      </div>
      <div className="prec-res prec-res-pre">
        <div className="prec-res-label">⭐ Premium</div>
        <div className="prec-res-value" style={{ fontSize: sz }}>{fmt(c.vPremium)}</div>
        {!mini && <div className="prec-res-desc">Para alta complexidade ou posicionamento consultivo.</div>}
      </div>
    </div>
  )
}

// ─── COMPONENTE PRINCIPAL ────────────────────────────────────
export default function PrecificacaoPage() {
  const [etapa, setEtapa] = useState(1)
  const [calc, setCalc] = useState(null)
  const [valorProposta, setValorProposta] = useState('')
  const [acadAberto, setAcadAberto] = useState(null)
  const [contratoGerado, setContratoGerado] = useState(false)
  const [baixandoDocx, setBaixandoDocx] = useState(false)
  const [enviandoAssinatura, setEnviandoAssinatura] = useState(false)
  const [assinaturaEnviada, setAssinaturaEnviada] = useState(null) // { link_bpo, link_cliente }
  const [emailCliente, setEmailCliente] = useState('')
  const [setupModal, setSetupModal] = useState(false)
  const [setupToken, setSetupToken] = useState('')
  const [setupStep, setSetupStep] = useState(1)
  const [setupTesting, setSetupTesting] = useState(false)
  const [setupStatus, setSetupStatus] = useState(null) // { ok, msg }
  const [contratoForm, setContratoForm] = useState({
    indiceReajuste: 'IGPM/FGV',
    diaVencimento: '05',
    formaPagamento: 'boleto bancário',
    vigencia: '12',
    dataInicio: new Date().toISOString().split('T')[0],
  })
  const { empresa, profile } = useAuthStore()

  // Impacto na capacidade da equipe + margem do book — mesma fonte que
  // Capacidade e Rentabilidade já usam (horas do mês corrente).
  const { data: clientesAtivos = [] } = useClients()
  const { data: apontEquipeMes = [] } = useApontamentosMes()
  const { data: usuariosEquipe = [] } = useUsuarios()

  // Proposta persistida
  const createProposta   = useCreateProposta()
  const updateProposta   = useUpdateProposta()
  const { data: todasPropostas = [] } = usePropostas()
  const propostaIdRef    = useRef(null)  // id da proposta salva nesta sessão
  const leadIdRef        = useRef(null)  // lead_id vindo do CRM

  // Modal de importação de proposta existente
  const [importModal, setImportModal]     = useState(false)
  const [importSearch, setImportSearch]   = useState('')
  const [importStatus, setImportStatus]   = useState('')

  // FORM STATE
  const [d, setD] = useState(() => {
    // Se veio do CRM (botão Proposta), pré-preenche com dados do lead
    try {
      const lead = JSON.parse(localStorage.getItem('crm_lead_precif') || sessionStorage.getItem('crm_lead_precif') || 'null')
      // Só usa se for recente (2 min). NÃO remove aqui — o componente pode remontar
      // durante o fluxo de auth e a segunda montagem precisa encontrar o item.
      // A limpeza acontece 15s depois, num effect.
      if (lead && (!lead.ts || Date.now() - lead.ts < 120000)) {
        // Captura lead_id para vincular a proposta
        if (lead.id) leadIdRef.current = lead.id
        return {
          nome: lead.nome || lead.fantasia || '', fat: '', cnpjs: 1, funcs: 0,
          bancos: 1, capag: 0, carec: 0, mov: 0, nfs: 0, boletos: 0,
          sistcob: 0, cartao: 0, plat: 0, agend: 0,
          contab: 0, relat: 0, reuniao: 0, consult: 0, lembrete: 0,
          erp: '', erpOutro: '', licencaModalidade: 'cliente_direto', licencaValor: '',
          custoHora: '50', margem: 35, overhead: '600', regime: 6,
          // Dados do cliente pré-preenchidos
          _clienteNome: lead.nome || lead.fantasia || '',
          _clienteCnpj: lead.cnpj || '',
          _clienteContato: lead.contato || '',
          _clienteEmail: lead.email || '',
          _clienteWhatsapp: lead.whatsapp || '',
          _clienteSegmento: lead.segmento || '',
        }
      }
    } catch {}
    return {
      nome: '', fat: '', cnpjs: 1, funcs: 0,
      bancos: 1, capag: 0, carec: 0, mov: 0, nfs: 0, boletos: 0,
      sistcob: 0, cartao: 0, plat: 0, agend: 0,
      contab: 0, relat: 0, reuniao: 0, consult: 0, lembrete: 0,
      erp: '', erpOutro: '', licencaModalidade: 'cliente_direto', licencaValor: '',
      custoHora: '50', margem: 35, overhead: '600', regime: 6,
    }
  })
  const [custoHoraFonte, setCustoHoraFonte] = useState(null) // null | 'equipe' | 'propria'
  const propostaStatusRef = useRef(null) // status da proposta importada (evita rebaixar 'aprovada' para 'enviada')

  // Limpa o lead vindo do CRM 15s após a montagem (depois que remontagens do fluxo de auth já passaram)
  useEffect(() => {
    const t = setTimeout(() => {
      localStorage.removeItem('crm_lead_precif')
      sessionStorage.removeItem('crm_lead_precif')
    }, 15000)
    return () => clearTimeout(t)
  }, [])

  // Vindo do CRM com proposta APROVADA → restaura snapshot congelado e abre direto na etapa de contrato
  useEffect(() => {
    try {
      const p = JSON.parse(sessionStorage.getItem('proposta_gerar_contrato') || 'null')
      if (!p) return
      sessionStorage.removeItem('proposta_gerar_contrato')
      const dc = p.dados_calculo || {}
      if (dc.d) setD(dc.d)
      if (dc.calc) setCalc(dc.calc)
      if (dc.valorProposta) setValorProposta(formatBRL(parseValorPropostaSalvo(dc.valorProposta)))
      if (dc.escopo) setEscopo(dc.escopo)
      const cli = p.dados_cliente || {}
      setContratoForm(f => ({
        ...f,
        ...(p.contrato_dados && Object.keys(p.contrato_dados).length ? p.contrato_dados : {}),
        clienteNome: p.contrato_dados?.clienteNome || cli.nome || '',
        clienteCnpj: p.contrato_dados?.clienteCnpj || cli.cnpj || '',
        clienteRep:  p.contrato_dados?.clienteRep  || cli.contato || '',
        clienteEmail: p.contrato_dados?.clienteEmail || cli.email || '',
      }))
      propostaIdRef.current = p.id
      propostaStatusRef.current = p.status
      if (p.lead_id) leadIdRef.current = p.lead_id
      if (dc.calc) setEtapa(6)
    } catch {}
  }, [])

  // Carrega custo-hora automaticamente da calculadora (Config)
  useEffect(() => {
    if (!profile?.empresa_id) return
    supabase
      .from('usuarios')
      .select('custo_hora, nome')
      .eq('empresa_id', profile.empresa_id)
      .not('custo_hora', 'is', null)
      .then(({ data }) => {
        if (!data || data.length === 0) return
        const media = Math.round(data.reduce((s, u) => s + (u.custo_hora || 0), 0) / data.length)
        if (media > 0) {
          setD(prev => ({ ...prev, custoHora: String(media) }))
          setCustoHoraFonte(data.length === 1 ? 'propria' : 'equipe')
        }
      })
  }, [profile?.empresa_id])

  // Carrega overhead por cliente calculado em Config → Custo da Operação
  useEffect(() => {
    const oh = empresa?.config?.custosOperacao?.overheadPorCliente
    if (oh > 0) setD(prev => ({ ...prev, overhead: String(Math.round(oh)) }))
  }, [empresa?.config?.custosOperacao?.overheadPorCliente])

  const set = (k, v) => setD(prev => ({ ...prev, [k]: v }))
  const num = (k) => (e) => set(k, parseFloat(e.target.value) || 0)
  const sel = (k) => (e) => set(k, parseFloat(e.target.value) || 0)

  const irPara = (n) => { setEtapa(n); if (n < 6) setContratoGerado(false); window.scrollTo({ top: 0, behavior: 'smooth' }) }

  const irParaAnalise = useCallback(() => {
    const diag = {
      ...d,
      fat: parseBRL(d.fat),
      custoHora: parseBRL(d.custoHora),
      overhead: parseBRL(d.overhead),
      licencaValor: parseBRL(d.licencaValor),
      aliquota: parseFloat(d.regime) / 100,
      margem: parseFloat(d.margem) / 100,
    }
    const resultado = calcularMetodologia(diag)
    setCalc(resultado)
    irPara(2)
  }, [d])

  // Escopo editável (Responsabilidades / Limites / SLA) — padrão da empresa + edição por proposta
  const [escopo, setEscopo] = useState(null)
  const [escopoEdit, setEscopoEdit] = useState(null) // bloco em edição: 'resp' | 'limites' | 'sla'

  const montarEscopoPadrao = (c) => {
    const padrao = empresa?.config?.escopoPadrao
    if (padrao?.resp?.length || padrao?.limites?.length || padrao?.sla?.length) {
      return { resp: padrao.resp || [], limites: padrao.limites || [], sla: padrao.sla || [] }
    }
    return {
      resp: [
        'Enviar documentos até o dia 5 de cada mês',
        'Responder solicitações em até 48h úteis',
        'Manter acessos bancários e sistemas atualizados',
        'Confirmar informações para conciliação quando solicitado',
        c.d.agend ? 'Manter saldo suficiente para agendamentos' : null,
        c.d.nfs > 0 ? 'Fornecer dados completos para emissão de NFs' : null,
      ].filter(Boolean),
      limites: [
        'Serviços limitados ao escopo descrito acima',
        'Inclusão de novos CNPJs requer revisão de contrato',
        c.d.capag > 0 ? `Volume de contas a pagar: até ${Math.ceil(c.d.capag * 1.5)} títulos/mês` : null,
        c.d.nfs > 0 ? `Volume de NFs: até ${Math.ceil(c.d.nfs * 1.5)} notas/mês` : null,
        c.d.boletos > 0 ? `Volume de boletos: até ${Math.ceil(c.d.boletos * 1.5)}/mês` : null,
        c.d.cartao > 0 ? `Cartões de crédito conciliados: ${c.d.cartao}` : null,
        'Horas adicionais ao escopo serão orçadas separadamente',
      ].filter(Boolean),
      sla: [
        'Relatórios entregues até o dia 10 de cada mês',
        'Atendimento via WhatsApp em horário comercial (resposta em até 24h úteis)',
        'Urgências tratadas com prioridade',
        c.d.reuniao > 0 ? 'Reunião mensal agendada até o dia 20 de cada mês' : null,
      ].filter(Boolean),
    }
  }

  const salvarEscopoComoPadrao = async () => {
    if (!empresa || !escopo) return
    try {
      const novoConfig = { ...(empresa.config || {}), escopoPadrao: escopo }
      const { error } = await supabase.from('empresas').update({ config: novoConfig }).eq('id', empresa.id)
      if (error) throw error
      useAuthStore.getState().updateEmpresa?.({ config: novoConfig })
      alert('✓ Escopo salvo como padrão da sua empresa. As próximas propostas já nascem com ele.')
    } catch (e) { alert('Erro ao salvar padrão: ' + e.message) }
  }

  const irParaEscopo = async () => {
    if (!valorProposta || parseBRL(valorProposta) <= 0) {
      alert('Informe o valor da proposta antes de gerar o escopo.')
      return
    }
    if (!escopo) setEscopo(montarEscopoPadrao(calc))
    // Salva proposta no banco na primeira vez que chega no passo 5
    if (!propostaIdRef.current) {
      try {
        const proposta = await createProposta.mutateAsync({
          lead_id: leadIdRef.current || undefined,
          status: 'rascunho',
          valor_mensal: parseBRL(valorProposta),
          dados_cliente: {
            nome: d._clienteNome || d.nome || '',
            cnpj: d._clienteCnpj || '',
            contato: d._clienteContato || '',
            email: d._clienteEmail || '',
            whatsapp: d._clienteWhatsapp || '',
            segmento: d._clienteSegmento || '',
          },
          dados_calculo: { d, calc, valorProposta, escopo: escopo || montarEscopoPadrao(calc) },
        })
        propostaIdRef.current = proposta.id
      } catch (e) {
        console.error('Erro ao salvar proposta:', e)
        // Não bloqueia o fluxo — continua mesmo sem salvar
      }
    }
    irPara(5)
  }

  // Importa dados de uma proposta existente → restaura form e vai pro passo 4
  const importarDeProposta = (proposta) => {
    const dc = proposta.dados_calculo || {}
    if (dc.d) setD(dc.d)
    if (dc.calc) setCalc(dc.calc)
    if (dc.valorProposta) setValorProposta(formatBRL(parseValorPropostaSalvo(dc.valorProposta)))
    setEscopo(dc.escopo || null)
    propostaIdRef.current = null  // cria nova proposta ao salvar (não sobrescreve)
    if (proposta.dados_calculo?.d?._clienteEmail) setEmailCliente(proposta.dados_calculo.d._clienteEmail)
    setImportModal(false)
    setImportSearch('')
    setImportStatus('')
    irPara(dc.calc ? 4 : 1)  // pula para Decisão se já tiver cálculo
  }

  const avaliarProposta = (v) => {
    if (!v || !calc) return null
    const val = parseBRL(v)
    // custoReal (e por consequência vMinimo/vRecomendado/vPremium, todos
    // derivados dele) só chega a zero quando nenhuma atividade de BPO foi
    // configurada — ex: cliente só de licença/repasse. Sem essa checagem, as
    // divisões abaixo geram "Infinity%"/"NaN%" na tela em vez de uma mensagem.
    if (calc.custoReal <= 0) return { cls: 'prec-fb-yellow', icon: '⚠️', titulo: 'Sem atividade de BPO configurada', texto: 'Nenhuma hora de trabalho foi configurada pra esse cliente, então não há custo real pra calcular margem. Se for um cliente só de licença/repasse (sem serviço de BPO), essa calculadora não se aplica — cobre um valor fixo à parte.' }
    if (val < calc.vMinimo) return { cls: 'prec-fb-red', icon: '🔴', titulo: 'Abaixo do mínimo sustentável', texto: `Você está ${fmt(calc.vMinimo - val)} abaixo do custo real. Com essa precificação, cada mês gera prejuízo. O mínimo é ${fmt(calc.vMinimo)}.` }
    if (val < calc.vRecomendado * 0.85) {
      const m = Math.round(((val - calc.custoReal) / val) * 100)
      return { cls: 'prec-fb-yellow', icon: '🟡', titulo: 'Margem reduzida — operar com cautela', texto: `Operação viável com margem de apenas ${m}%. Pouco espaço para imprevistos e crescimento. Recomendado: ${fmt(calc.vRecomendado)}.` }
    }
    if (val <= calc.vPremium) {
      const m = Math.round(((val - calc.custoReal) / val) * 100)
      return { cls: 'prec-fb-green', icon: '🟢', titulo: 'Valor alinhado à Metodologia Fluxe', texto: `Margem estimada de ${m}%. Precificação equilibrada: competitiva para o cliente e rentável para você.` }
    }
    const pct = Math.round(((val - calc.vPremium) / calc.vPremium) * 100)
    return { cls: 'prec-fb-blue', icon: '🔵', titulo: 'Acima da faixa premium', texto: `${pct}% acima do premium calculado. Certifique-se de que o escopo justifica claramente: entregáveis exclusivos e resultado comprovado.` }
  }

  const fb = avaliarProposta(valorProposta)
  const pesoCls = { 'baixo': 'badge-baixo', 'médio': 'badge-medio', 'alto': 'badge-alto' }

  // ── Impacto na capacidade da equipe + margem do book, se fechar esse cliente ──
  const capacidade = (() => {
    if (!calc) return null
    const ativos = clientesAtivos.filter(c => c.status === 'ativo')
    const horasDisponiveis = usuariosEquipe.reduce((a, u) => a + (u.horas_mes || HORAS_MES_PADRAO), 0)
    const horasUsadas = apontEquipeMes.reduce((a, ap) => a + (ap.segundos || 0), 0) / 3600
    const ocupacaoAtual = horasDisponiveis > 0 ? (horasUsadas / horasDisponiveis) * 100 : 0
    const ocupacaoProjetada = horasDisponiveis > 0 ? ((horasUsadas + calc.totalHoras) / horasDisponiveis) * 100 : 0

    const custoHoraMedio = usuariosEquipe.length > 0
      ? usuariosEquipe.reduce((a, u) => a + (u.custo_hora || CUSTO_HORA_PADRAO), 0) / usuariosEquipe.length
      : CUSTO_HORA_PADRAO
    const margens = computeMargemPorCliente(ativos, apontEquipeMes, custoHoraMedio)
    const mrrBook = ativos.reduce((a, c) => a + (c.valor_mrr || 0), 0)
    const margemBook = mrrBook > 0 ? (margens.reduce((a, m) => a + m.margem, 0) / mrrBook) * 100 : 0

    let nivel
    if (ocupacaoProjetada > 100) nivel = 'critico'
    else if (ocupacaoProjetada > 85) nivel = 'atencao'
    else nivel = 'ok'

    return { horasDisponiveis, ocupacaoAtual, ocupacaoProjetada, margemBook, nivel, semEquipe: usuariosEquipe.length === 0 }
  })()

  const hoje = new Date().toLocaleDateString('pt-BR')

  // Salvar token do Autentique direto do modal
  async function salvarTokenAutentique() {
    if (!setupToken.trim()) return
    setSetupTesting(true)
    setSetupStatus(null)
    try {
      const { error } = await supabase.from('empresas').update({ autentique_token: setupToken.trim() }).eq('id', empresa.id)
      if (error) throw error
      const { data: { session: sess } } = await supabase.auth.getSession()
      const testFetch = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/autentique-sign`,
        { method: 'POST', headers: { 'Authorization': `Bearer ${sess.access_token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'test' }) }
      )
      const resp = { data: await testFetch.json(), error: testFetch.ok ? null : { message: 'Erro ' + testFetch.status } }
      if (resp.data?.error) throw new Error(resp.data.error)
      setSetupStatus({ ok: true, msg: `✅ Conectado! Conta: ${resp.data?.conta || 'OK'}` })
      setTimeout(() => { setSetupModal(false); window.location.reload() }, 1800)
    } catch(e) {
      setSetupStatus({ ok: false, msg: '❌ ' + e.message })
    } finally {
      setSetupTesting(false)
    }
  }

  // ── RENDER ──────────────────────────────────────────────────
  return (
    <>
      <style>{CSS}</style>

      {/* Modal de setup do Autentique */}
      {setupModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div style={{ background:'#fff', borderRadius:16, padding:28, maxWidth:480, width:'100%', boxShadow:'0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <div>
                <div style={{ fontWeight:800, fontSize:16 }}>✍️ Configurar Assinatura Digital</div>
                <div style={{ fontSize:12, color:'#64748B', marginTop:2 }}>Autentique — gratuito até 5 contratos/mês</div>
              </div>
              <button onClick={() => setSetupModal(false)} style={{ background:'none', border:'none', fontSize:18, cursor:'pointer', color:'#94A3B8' }}>✕</button>
            </div>
            <div style={{ display:'flex', gap:6, marginBottom:20 }}>
              {[1,2,3].map(s => (
                <div key={s} style={{ flex:1, height:4, borderRadius:4, background: s <= setupStep ? '#6366F1' : '#E2E8F0', cursor:'pointer', transition:'background .2s' }} onClick={() => setSetupStep(s)} />
              ))}
            </div>
            {setupStep === 1 && (
              <div>
                <div style={{ fontWeight:700, marginBottom:8 }}>Passo 1 — Crie sua conta</div>
                <div style={{ fontSize:13, color:'#475569', lineHeight:1.7, marginBottom:16 }}>
                  Acesse <strong>autentique.com.br</strong> e crie uma conta gratuita com o e-mail da sua empresa.
                </div>
                <a href="https://autentique.com.br" target="_blank" rel="noopener noreferrer"
                  style={{ display:'block', textAlign:'center', padding:'10px', background:'#6366F1', color:'#fff', borderRadius:8, fontWeight:700, fontSize:13, textDecoration:'none', marginBottom:12 }}>
                  Abrir Autentique →
                </a>
                <button onClick={() => setSetupStep(2)} style={{ width:'100%', padding:'10px', background:'#F1F5F9', border:'none', borderRadius:8, fontWeight:600, fontSize:13, cursor:'pointer' }}>
                  Já tenho conta → Próximo
                </button>
              </div>
            )}
            {setupStep === 2 && (
              <div>
                <div style={{ fontWeight:700, marginBottom:8 }}>Passo 2 — Copie seu token</div>
                <div style={{ fontSize:13, color:'#475569', lineHeight:1.7, marginBottom:12 }}>
                  No painel do Autentique:<br/>
                  <strong>Configurações → Desenvolvedor → Acesso a API</strong><br/><br/>
                  Copie o token que aparece na tela.
                </div>
                <div style={{ background:'#F8FAFC', borderRadius:8, padding:'10px 14px', fontSize:12, color:'#64748B', marginBottom:16, border:'1px solid #E2E8F0' }}>
                  💡 O token tem cerca de 64 caracteres.
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  <button onClick={() => setSetupStep(1)} style={{ flex:1, padding:'10px', background:'#F1F5F9', border:'none', borderRadius:8, fontWeight:600, fontSize:13, cursor:'pointer' }}>← Voltar</button>
                  <button onClick={() => setSetupStep(3)} style={{ flex:2, padding:'10px', background:'#6366F1', color:'#fff', border:'none', borderRadius:8, fontWeight:700, fontSize:13, cursor:'pointer' }}>Tenho o token →</button>
                </div>
              </div>
            )}
            {setupStep === 3 && (
              <div>
                <div style={{ fontWeight:700, marginBottom:8 }}>Passo 3 — Cole e ative</div>
                <div style={{ fontSize:13, color:'#475569', marginBottom:10 }}>Cole o token do Autentique abaixo:</div>
                <input type="text" value={setupToken} onChange={e => { setSetupToken(e.target.value); setSetupStatus(null) }}
                  placeholder="Cole aqui o token..."
                  style={{ width:'100%', padding:'10px 12px', border:'1px solid #E2E8F0', borderRadius:8, fontSize:12, fontFamily:'monospace', marginBottom:10, boxSizing:'border-box' }}
                />
                {setupStatus && (
                  <div style={{ padding:'8px 12px', borderRadius:8, fontSize:12, marginBottom:10, background: setupStatus.ok ? '#F0FDF4' : '#FEF2F2', color: setupStatus.ok ? '#16A34A' : '#DC2626' }}>
                    {setupStatus.msg}
                  </div>
                )}
                <div style={{ display:'flex', gap:8 }}>
                  <button onClick={() => setSetupStep(2)} style={{ flex:1, padding:'10px', background:'#F1F5F9', border:'none', borderRadius:8, fontWeight:600, fontSize:13, cursor:'pointer' }}>← Voltar</button>
                  <button onClick={salvarTokenAutentique} disabled={setupTesting || !setupToken.trim()}
                    style={{ flex:2, padding:'10px', background: setupToken.trim() ? '#6366F1' : '#E2E8F0', color: setupToken.trim() ? '#fff' : '#94A3B8', border:'none', borderRadius:8, fontWeight:700, fontSize:13, cursor: setupToken.trim() ? 'pointer' : 'not-allowed' }}>
                    {setupTesting ? '⏳ Verificando...' : '✅ Salvar e ativar'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="prec-root">

        {/* PAGE TITLE */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-.02em', marginBottom: 5 }}>Precificação consultiva</h1>
          <p style={{ fontSize: 13, color: 'var(--ptext2)', lineHeight: 1.5 }}>
            O sistema recomenda com base na <em style={{ fontStyle: 'italic', color: 'var(--pg)' }}>Metodologia Fluxe</em>. Você decide. Cada decisão vem acompanhada de orientação estratégica.
          </p>
        </div>

        {/* PROGRESS */}
        <div className="prec-progress">
          {[['01','Diagnóstico'],['02','Análise'],['03','Recomendação'],['04','Decisão'],['05','Proposta'],['06','Contrato']].map(([n, label], i) => (
            <div key={n} className={`prec-pstep ${etapa === i+1 ? 'active' : etapa > i+1 ? 'done' : ''}`}>
              <div className="prec-pdot">{etapa > i+1 ? '✓' : n}</div>
              <div className="prec-plabel">{label}</div>
            </div>
          ))}
        </div>

        {/* ══ ETAPA 1: DIAGNÓSTICO ══ */}
        {etapa === 1 && (
          <div>
            {/* Banner: importar proposta existente */}
            {todasPropostas.length > 0 && (
              <div style={{ background:'#EEF2FF', border:'1px solid #C7D2FE', borderRadius:10, padding:'10px 16px', marginBottom:16, display:'flex', alignItems:'center', gap:12 }}>
                <span style={{ fontSize:13 }}>📋</span>
                <div style={{ flex:1, fontSize:12, color:'#3730A3' }}>
                  Você tem <strong>{todasPropostas.length}</strong> proposta{todasPropostas.length > 1 ? 's' : ''} salva{todasPropostas.length > 1 ? 's' : ''}. Quer reutilizar dados de uma existente?
                </div>
                <button onClick={() => setImportModal(true)}
                  style={{ padding:'5px 14px', border:'1px solid #6366F1', borderRadius:7, background:'#6366F1', color:'#fff', fontSize:11, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap' }}>
                  Importar proposta
                </button>
              </div>
            )}

            <div className="prec-card">
              <div className="prec-card-num">Etapa 01</div>
              <div className="prec-card-title">Diagnóstico do cliente</div>
              <div className="prec-card-desc">Preencha com o que você já sabe do cliente. Quanto mais preciso, mais precisa a recomendação de preço.</div>

              {/* BLOCO 1: O CLIENTE */}
              <div className="prec-sec">🏢 O cliente</div>
              <div className="prec-fgrid">
                <Campo label="Nome do cliente / empresa">
                  <input className="prec-input" value={d.nome} onChange={e => set('nome', e.target.value)} placeholder="Ex: Comércio Silva Ltda" />
                </Campo>
                <Campo label="Faturamento mensal (R$)" hint="Receita bruta média do cliente. Se não souber exato, use uma estimativa. Impacta o nível de complexidade.">
                  <input className="prec-input" type="text" inputMode="decimal"
                    value={d.fat} onChange={e => set('fat', e.target.value)}
                    placeholder="Ex: 80.000,00" />
                  {parseBRL(d.fat) >= 10000 && (
                    <div style={{ fontSize:10, color:'#6366F1', marginTop:4 }}>
                      {fmtExtensoParcial(parseBRL(d.fat))}/mês
                    </div>
                  )}
                </Campo>
                <Campo label="Quantos CNPJs você vai gerenciar?" hint="Cada CNPJ = um conjunto completo de contas e obrigações.">
                  <input className="prec-input" type="number" value={d.cnpjs} onChange={num('cnpjs')} min="1" />
                </Campo>
              </div>

              {/* BLOCO 2: O QUE VOCÊ VAI FAZER */}
              <div className="prec-sec">📋 O que você vai fazer por esse cliente</div>
              <div className="prec-fgrid3">
                <Campo label="Contas bancárias para conciliar" hint="Cada conta bancária precisa de conciliação mensal separada.">
                  <input className="prec-input" type="number" value={d.bancos} onChange={num('bancos')} min="0" />
                  {d.bancos > 0 && <div style={{ fontSize:10, color:'#6366F1', marginTop:4 }}>≈ {(d.bancos * 1.5 + (d.mov||0) * 0.003).toFixed(1)}h/mês de conciliação</div>}
                </Campo>
                <Campo label="Pagamentos (contas a pagar) / mês" hint="Quantas contas você vai pagar por ele todo mês — fornecedores, aluguel, luz, internet, etc. Ex: 5 fornecedores + 3 fixas = 8. Raramente passa de 100 num cliente pequeno.">
                  <input className="prec-input" type="number" value={d.capag} onChange={num('capag')} min="0" />
                  {d.capag > 0 && <div style={{ fontSize:10, color:'#6366F1', marginTop:4 }}>≈ {(0.5 + d.capag * 0.05).toFixed(1)}h/mês de gestão CP</div>}
                  {d.capag > 200 && <div style={{ fontSize:10, color:'#EF4444', marginTop:2 }}>⚠ Mais de 200 pagamentos/mês é incomum. Confira se preencheu certo.</div>}
                </Campo>
                <Campo label="Clientes que pagam manualmente / mês" hint="Quantos clientes do seu cliente pagam por boleto ou PIX avulso, e você precisa conferir um por um. NÃO inclua vendas por maquininha, Mercado Pago ou outras plataformas — essas vão no campo 'Outras plataformas' abaixo.">
                  <input className="prec-input" type="number" value={d.carec} onChange={num('carec')} min="0" />
                  {d.carec > 0 && <div style={{ fontSize:10, color:'#6366F1', marginTop:4 }}>≈ {(0.5 + d.carec * 0.04).toFixed(1)}h/mês de gestão CR</div>}
                  {d.carec > 500 && <div style={{ fontSize:10, color:'#EF4444', marginTop:2 }}>⚠ Mais de 500 cobranças individuais é muito alto. Vendas por plataforma (Mercado Pago, cartão) não entram aqui.</div>}
                </Campo>
                <Campo label="Movimentações no extrato / mês" hint="Quantidade de linhas no extrato bancário por mês. Se não souber: some pagamentos + recebimentos e multiplique por 1,3. Ex: 50 pagamentos + 30 recebimentos = 80 × 1,3 = ~100 movimentações. Raramente passa de 500 num cliente pequeno.">
                  <input className="prec-input" type="number" value={d.mov} onChange={num('mov')} min="0" />
                  {d.mov > 0 && d.bancos > 0 && <div style={{ fontSize:10, color:'#6366F1', marginTop:4 }}>impacta conciliação: +{(d.mov * 0.003).toFixed(1)}h</div>}
                  {d.mov > 2000 && <div style={{ fontSize:10, color:'#EF4444', marginTop:2 }}>⚠ Mais de 2.000 movimentações é muito alto para um único CNPJ. Confira se preencheu certo.</div>}
                </Campo>
                <Campo label="Notas fiscais a emitir / mês" hint="NFS-e de serviço ou NF-e de produto. Zero se não for emitir.">
                  <input className="prec-input" type="number" value={d.nfs} onChange={num('nfs')} min="0" />
                  {d.nfs > 0 && <div style={{ fontSize:10, color:'#6366F1', marginTop:4 }}>≈ {(0.3 + d.nfs * 0.07).toFixed(1)}h/mês (~4 min por NF)</div>}
                </Campo>
                <Campo label="Boletos a emitir / mês" hint="Boletos de cobrança emitidos em nome do cliente.">
                  <input className="prec-input" type="number" value={d.boletos} onChange={num('boletos')} min="0" />
                  {d.boletos > 0 && <div style={{ fontSize:10, color:'#6366F1', marginTop:4 }}>≈ {(0.3 + d.boletos * 0.05).toFixed(1)}h/mês de emissão</div>}
                </Campo>
              </div>

              <div className="prec-fgrid">
                <Campo label="Você vai executar os pagamentos no banco?" hint="Agendamento bancário = você entra no internet banking e agenda/paga os boletos. É um serviço extra que exige acesso ao banco.">
                  <select className="prec-select" value={d.agend} onChange={sel('agend')}>
                    <option value="0">Não — o cliente paga sozinho</option>
                    <option value="1">Sim — eu faço os agendamentos</option>
                  </select>
                  {d.agend > 0 && d.capag > 0 && (
                    <div style={{ fontSize:10, color:'#6366F1', marginTop:4 }}>
                      ≈ {(0.5 + d.capag * 0.033).toFixed(1)}h/mês para agendar {d.capag} pagamentos (~2 min cada)
                    </div>
                  )}
                  {d.agend > 0 && d.capag === 0 && (
                    <div style={{ fontSize:10, color:'#F59E0B', marginTop:4 }}>
                      ⚠ Preencha "Pagamentos / mês" acima para estimar o tempo.
                    </div>
                  )}
                </Campo>
                <Campo label="Cartões de crédito a pagar (faturas) / mês" hint="Quantos cartões de crédito o cliente usa para pagar despesas. Cada cartão = fatura para conciliar e despesas para classificar todo mês. Vendas por maquininha NÃO entram aqui — vão em 'Plataformas digitais' abaixo.">
                  <input className="prec-input" type="number" value={d.cartao} onChange={num('cartao')} min="0" />
                  {d.cartao > 0 && <div style={{ fontSize:10, color:'#6366F1', marginTop:4 }}>≈ {(0.3 + d.cartao * 1.0).toFixed(1)}h/mês (fatura + classificação)</div>}
                </Campo>
                <Campo label="Usa sistema de cobrança automática?" hint="Ex: Asaas, Iugu, Receba Fácil. Gera boletos automaticamente e precisa de conciliação.">
                  <select className="prec-select" value={d.sistcob} onChange={sel('sistcob')}>
                    <option value="0">Não usa</option>
                    <option value="1">Sim — Asaas, Iugu, Receba Fácil…</option>
                  </select>
                </Campo>
                <Campo label="Vende por plataformas digitais ou maquininha?" hint="Ex: Mercado Livre, Shopee, iFood, PagSeguro, Mercado Pago, cartão de crédito. Cada plataforma faz repasses em lote e precisa de conciliação separada. Se recebe via Pix avulso de muitos clientes, marque também.">
                  <select className="prec-select" value={d.plat} onChange={sel('plat')}>
                    <option value="0">Não — recebe só por boleto/TED avulso</option>
                    <option value="1">Sim — 1 plataforma ou maquininha</option>
                    <option value="2">Sim — 2 ou mais plataformas</option>
                  </select>
                </Campo>
                <Campo label="Envia documentos para contabilidade?">
                  <select className="prec-select" value={d.contab} onChange={sel('contab')}>
                    <option value="0">Não</option>
                    <option value="1">Sim — organizo e envio</option>
                  </select>
                </Campo>
                <Campo label="Vai gerar relatórios gerenciais?">
                  <select className="prec-select" value={d.relat} onChange={sel('relat')}>
                    <option value="0">Não</option>
                    <option value="1">Básico — DRE e fluxo de caixa</option>
                    <option value="2">Completo — DRE, fluxo, indicadores e análises</option>
                  </select>
                </Campo>
                <Campo label="Vai ter reunião estratégica mensal?">
                  <select className="prec-select" value={d.reuniao} onChange={sel('reuniao')}>
                    <option value="0">Não</option>
                    <option value="1">Sim — 1 hora online</option>
                    <option value="1.5">Sim — 1 hora presencial</option>
                  </select>
                </Campo>
                <Campo label="Vai oferecer consultoria ou planejamento?">
                  <select className="prec-select" value={d.consult} onChange={sel('consult')}>
                    <option value="0">Não</option>
                    <option value="1">Sim — análises estratégicas mensais</option>
                    <option value="2">Sim — planejamento completo (budget, metas, DRE projetado)</option>
                  </select>
                </Campo>
                <Campo label="Vai enviar lembretes de vencimento pelo WhatsApp?">
                  <select className="prec-select" value={d.lembrete} onChange={sel('lembrete')}>
                    <option value="0">Não</option>
                    <option value="1">Sim</option>
                  </select>
                </Campo>
              </div>

              {/* BLOCO: SISTEMA FINANCEIRO (ERP) */}
              <div className="prec-sec">🖥️ Sistema financeiro (ERP)</div>
              <div className="prec-fgrid">
                <Campo label="Qual sistema será usado?" hint="ERP financeiro onde a gestão do cliente será feita.">
                  <select className="prec-select" value={d.erp || ''} onChange={e => set('erp', e.target.value)}>
                    <option value="">Ainda não definido</option>
                    <option value="Conta Azul">Conta Azul</option>
                    <option value="Omie">Omie</option>
                    <option value="Nibo">Nibo</option>
                    <option value="Outro">Outro</option>
                  </select>
                  {d.erp === 'Outro' && (
                    <input className="prec-input" style={{ marginTop:6 }} value={d.erpOutro || ''} onChange={e => set('erpOutro', e.target.value)} placeholder="Nome do sistema" />
                  )}
                </Campo>
                {d.erp && (
                  <Campo label="Quem paga a licença do sistema?" hint="Define como a licença entra na conta. Repasse = você recebe do cliente e paga a plataforma (não é receita sua). Embutida = você paga e o custo entra no preço.">
                    <select className="prec-select" value={d.licencaModalidade || 'cliente_direto'} onChange={e => set('licencaModalidade', e.target.value)}>
                      <option value="cliente_direto">Cliente contrata e paga direto</option>
                      <option value="bpo_embutida">Eu pago — embutida na mensalidade</option>
                      <option value="repasse">Repasse — recebo do cliente e pago</option>
                      <option value="contabilidade">Contabilidade paga a licença</option>
                    </select>
                    {d.licencaModalidade === 'contabilidade' && (
                      <div style={{ fontSize:10, color:'#D97706', marginTop:4 }}>
                        ⚠ Atenção: se o cliente trocar de contador, a licença pode ser cancelada e você perde o acesso. Considere esse risco.
                      </div>
                    )}
                  </Campo>
                )}
                {d.erp && (d.licencaModalidade === 'bpo_embutida' || d.licencaModalidade === 'repasse') && (
                  <Campo label="Valor mensal da licença (R$)" hint={d.licencaModalidade === 'repasse' ? 'Será exibido separadamente na proposta e no contrato como repasse — não entra na sua margem.' : 'Entra como custo deste cliente no cálculo do preço.'}>
                    <input className="prec-input" type="text" inputMode="decimal" value={d.licencaValor || ''} onChange={e => set('licencaValor', e.target.value)} placeholder="Ex: 189,90" />
                  </Campo>
                )}
              </div>

              {/* BLOCO 3: SEUS NÚMEROS */}
              <div className="prec-sec">💰 Seus custos (base do cálculo)</div>
              <div className="prec-alert prec-alert-info">
                <span>💡</span>
                <span>Configure uma vez na aba <strong>Config → Custo/Hora</strong> e o sistema preenche automaticamente em todas as precificações.</span>
              </div>
              <div className="prec-fgrid">
                <Campo label="Seu custo-hora (R$/h)" hint="Quanto custa 1 hora do seu trabalho, considerando salário, encargos e overhead. Configure em Config → Custo/Hora para calcular automaticamente.">
                  {custoHoraFonte && (
                    <div style={{ fontSize:10, color:'#6366F1', fontWeight:700, marginBottom:5, display:'flex', alignItems:'center', gap:4 }}>
                      ✓ {custoHoraFonte === 'equipe' ? 'Média da equipe (Config)' : 'Sua hora calculada (Config)'}
                      <span style={{ fontWeight:400, color:'#94A3B8' }}>— você pode ajustar</span>
                    </div>
                  )}
                  <input className="prec-input" type="text" inputMode="decimal" value={d.custoHora}
                    onChange={e => { set('custoHora', e.target.value); setCustoHoraFonte(null) }} placeholder="Ex: 50,00" />
                </Campo>
                <Campo label="Margem de lucro desejada" hint="BPOs saudáveis operam com 30–45% de margem. Abaixo de 20% o negócio fica frágil.">
                  <div className="prec-range-wrap">
                    <input type="range" min="10" max="60" value={d.margem} onChange={e => set('margem', e.target.value)} />
                    <span className="prec-range-val">{d.margem}%</span>
                  </div>
                </Campo>
                <Campo label="Overhead mensal (R$)" hint="Custos fixos da sua operação divididos pelo número de clientes. Calcule com precisão em Config → Custo da Operação e o valor será preenchido automaticamente.">
                  {empresa?.config?.custosOperacao?.overheadPorCliente > 0 && (
                    <div style={{ fontSize:10, color:'#6366F1', fontWeight:700, marginBottom:5 }}>
                      ✓ Calculado em Config → Custo da Operação <span style={{ fontWeight:400, color:'#94A3B8' }}>— você pode ajustar</span>
                    </div>
                  )}
                  <input className="prec-input" type="text" inputMode="decimal" value={d.overhead} onChange={e => set('overhead', e.target.value)} placeholder="Ex: 600,00" />
                </Campo>
                <Campo label="Regime tributário do seu BPO" hint="Alíquota de impostos sobre o seu faturamento como prestador de serviços.">
                  <select className="prec-select" value={d.regime} onChange={sel('regime')}>
                    <option value="0">MEI (isento de IR/CSLL)</option>
                    <option value="6">Simples Nacional — Anexo III (6%)</option>
                    <option value="8.8">Simples Nacional — Anexo V (8,8%)</option>
                    <option value="13.5">Lucro Presumido (~13,5%)</option>
                  </select>
                </Campo>
              </div>
            </div>

            <div className="prec-btn-row">
              <button className="prec-btn prec-btn-primary" onClick={irParaAnalise}>Analisar →</button>
            </div>
          </div>
        )}

        {/* ══ ETAPA 2: ANÁLISE ══ */}
        {etapa === 2 && calc && (
          <div>
            <div className="prec-card">
              <div className="prec-card-num">Etapa 02</div>
              <div className="prec-card-title">Análise da Metodologia Fluxe</div>
              <div className="prec-card-desc">O sistema calculou a complexidade e as horas estimadas. Veja o raciocínio antes de ver a recomendação.</div>

              {calc.semAtividadeReal && (
                <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 8, background: '#FFFBEB', border: '1px solid #FDE68A', color: '#92400E', fontSize: 12 }}>
                  ⚠️ Nenhuma atividade de BPO foi marcada na Etapa 01 — esse cliente parece ser só de licença/repasse, sem serviço de BPO.
                  Essa calculadora foi feita pra estimar horas de trabalho; pra esse tipo de cliente, ela não se aplica — cobre um valor fixo à parte.
                </div>
              )}

              <div className="prec-stats">
                <div className="prec-stat"><div className="prec-stat-label">Horas estimadas</div><div className="prec-stat-value">{calc.totalHoras}h</div><div className="prec-stat-sub">por mês</div></div>
                <div className="prec-stat"><div className="prec-stat-label">Custo real</div><div className="prec-stat-value">{fmt(calc.custoReal)}</div><div className="prec-stat-sub">seu custo mensal</div></div>
                <div className="prec-stat"><div className="prec-stat-label">Risco operacional</div><div className="prec-stat-value">{calc.riscoLabel}</div><div className="prec-stat-sub">responsabilidade</div></div>
                <div className="prec-stat"><div className="prec-stat-label">Complexidade</div><div className="prec-stat-value">{calc.complexidade}%</div><div className="prec-stat-sub">{calc.complexLabel}</div></div>
              </div>

              <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--ptext2)', marginBottom: 6 }}>
                  <span style={{ fontWeight: 500 }}>Complexidade operacional</span>
                  <span style={{ fontWeight: 600, color: calc.complexColor }}>{calc.complexLabel}</span>
                </div>
                <div className="prec-gauge-track">
                  <div className="prec-gauge-fill" style={{ width: calc.complexidade + '%', background: calc.complexColor }} />
                </div>
                <div className="prec-gauge-labels"><span>Baixa</span><span>Média</span><span>Alta</span><span>Muito alta</span></div>
              </div>

              <div className="prec-sec">Detalhamento de horas estimadas</div>
              <div className="prec-table-wrap">
              <table className="prec-table">
                <thead><tr><th style={{ width: '55%' }}>Serviço</th><th>h/mês</th><th>Peso</th></tr></thead>
                <tbody>
                  {calc.items.map((it, i) => (
                    <tr key={i}>
                      <td>{it.nome}<div style={{ fontSize: 10, color: 'var(--ptext3)', marginTop: 1 }}>{it.motivo}</div></td>
                      <td>{it.horas}h</td>
                      <td><span className={`prec-cpill ${pesoCls[it.peso] || 'badge-baixo'}`}>{it.peso}</span></td>
                    </tr>
                  ))}
                  <tr className="prec-total"><td>Total mensal</td><td>{calc.totalHoras}h</td><td></td></tr>
                </tbody>
              </table>
              </div>
            </div>

            <div className="prec-reasoning">
              <div className="prec-reasoning-title">Como a Metodologia Fluxe chegou a esses números</div>
              {[
                ['Cliente', calc.d.nome],
                ['Faturamento mensal', calc.d.fat > 0 ? fmtExtensoParcial(calc.d.fat) : 'Não informado'],
                ['Contas bancárias', calc.d.bancos, calc.d.bancos >= 4 ? 'alto' : calc.d.bancos >= 2 ? 'médio' : 'baixo'],
                ['Movimentações / mês', calc.d.mov, calc.d.mov > 500 ? 'alto' : calc.d.mov > 150 ? 'médio' : 'baixo'],
                ['Contas a pagar', `${calc.d.capag} títulos/mês`],
                ['Cobranças manuais a receber', `${calc.d.carec} cliente${calc.d.carec > 1 ? 's' : ''} com cobrança individual`],
                ['NFs / boletos', `${calc.d.nfs} NFs · ${calc.d.boletos} boletos`],
                ['Complexidade operacional', calc.complexLabel, calc.complexidade < 40 ? 'baixo' : calc.complexidade < 70 ? 'médio' : 'alto'],
                ['Risco operacional', calc.riscoLabel, calc.risco < 20 ? 'baixo' : calc.risco < 40 ? 'médio' : 'alto'],
                ['Custo-hora', `R$ ${calc.d.custoHora}/h`],
                ['Overhead proporcional', fmt(calc.overheadCliente) + '/mês'],
                ['Custo real total', fmt(calc.custoReal)],
              ].map(([label, val, badge], i) => (
                <div key={i} className="prec-ri">
                  <span className="prec-ri-label">{label}</span>
                  <span className="prec-ri-val">{val}</span>
                  {badge && <span className={`prec-badge ${pesoCls[badge] || 'badge-baixo'}`}>{badge}</span>}
                </div>
              ))}
            </div>

            <div className="prec-btn-row">
              <button className="prec-btn prec-btn-ghost" onClick={() => irPara(1)}>← Voltar</button>
              <button className="prec-btn prec-btn-primary" onClick={() => irPara(3)}>Ver recomendação →</button>
            </div>
          </div>
        )}

        {/* ══ ETAPA 3: RECOMENDAÇÃO ══ */}
        {etapa === 3 && calc && (
          <div>
            <div className="prec-card">
              <div className="prec-card-num">Etapa 03</div>
              <div className="prec-card-title">Recomendação da Metodologia Fluxe</div>
              <div className="prec-card-desc">Três cenários calculados com base no diagnóstico. Cada um serve um propósito estratégico diferente.</div>
              <Trio c={calc} />
              {[
                { icon: '📌', titulo: 'Mínimo sustentável', texto: 'Cobre custo real + impostos. Abaixo deste valor a operação gera prejuízo. Use apenas em negociações extremas e por tempo limitado.', cls: 'prec-alert-info' },
                { icon: '✅', titulo: 'Recomendado Fluxe', texto: 'Equilíbrio entre competitividade e rentabilidade. Permite crescer, contratar e absorver imprevistos. Este é o padrão de operação saudável.', cls: 'prec-alert-info' },
                { icon: '⭐', titulo: 'Premium', texto: 'Para clientes de alta complexidade, dedicação diferenciada ou posicionamento consultivo. Justificado por entregáveis de alto valor percebido.', cls: 'prec-alert-tip' },
              ].map((a, i) => (
                <div key={i} className={`prec-alert ${a.cls}`} style={{ marginBottom: 8 }}>
                  <span>{a.icon}</span>
                  <div><strong style={{ display: 'block', marginBottom: 3 }}>{a.titulo}</strong>{a.texto}</div>
                </div>
              ))}
            </div>

            {calc.d.fat > 0 && (
              <div className="prec-card">
                <div className="prec-card-num">Referência de mercado</div>
                <div className="prec-card-title" style={{ fontSize: 16 }}>Relação com o faturamento do cliente</div>
                <div style={{ height: 10 }} />
                {(() => {
                  const pRec = ((calc.vRecomendado / calc.d.fat) * 100).toFixed(1)
                  const cor = pRec <= 1 ? '#166534' : pRec <= 3 ? '#0369A1' : pRec <= 5 ? '#92400E' : '#991B1B'
                  const msg = pRec <= 1 ? 'Muito acessível. Argumento forte para fechar.' :
                    pRec <= 3 ? 'Dentro da faixa saudável. Mercado pratica 1% a 3%.' :
                    pRec <= 5 ? 'Acima de 3%. Prepare justificativas claras de valor.' : 'Acima de 5%. Avalie a capacidade do cliente.'
                  return (
                    <>
                      <p style={{ fontSize: 13, color: 'var(--ptext2)', marginBottom: 14 }}>
                        O recomendado representa <strong style={{ color: cor, fontSize: 16 }}>{pRec}%</strong> do faturamento. <span style={{ color: 'var(--ptext3)' }}>{msg}</span>
                      </p>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                        {[['Mínimo', calc.vMinimo], ['Recomendado', calc.vRecomendado], ['Premium', calc.vPremium]].map(([l, v]) => (
                          <div key={l} style={{ background: 'var(--psurface2)', border: '1px solid var(--pborder)', borderRadius: 8, padding: 10, textAlign: 'center' }}>
                            <div style={{ fontSize: 10, color: 'var(--ptext3)', marginBottom: 3 }}>{l}</div>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>{((v / calc.d.fat) * 100).toFixed(1)}% do fat.</div>
                          </div>
                        ))}
                      </div>
                    </>
                  )
                })()}
              </div>
            )}

            <div className="prec-btn-row">
              <button className="prec-btn prec-btn-ghost" onClick={() => irPara(2)}>← Voltar</button>
              <button className="prec-btn prec-btn-primary" onClick={() => irPara(4)}>Definir meu preço →</button>
            </div>
          </div>
        )}

        {/* ══ ETAPA 4: DECISÃO ══ */}
        {etapa === 4 && calc && (
          <div>
            <div className="prec-card">
              <div className="prec-card-num">Etapa 04</div>
              <div className="prec-card-title">Qual valor você vai apresentar?</div>
              <div className="prec-card-desc">A decisão final é sua. O sistema orienta qualquer escolha que você fizer.</div>

              <Trio c={calc} mini />

              <div style={{ marginBottom: 8 }}>
                <label style={{ fontSize: 12, textAlign: 'center', display: 'block', marginBottom: 8, color: 'var(--ptext2)' }}>Valor da proposta (R$)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  className="prec-proposta-input"
                  value={valorProposta}
                  placeholder="0,00"
                  onChange={e => setValorProposta(e.target.value)}
                />
              </div>

              {fb && (
                <div className={`prec-fb ${fb.cls}`}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{fb.icon}</span>
                  <div>
                    <strong style={{ display: 'block', marginBottom: 3 }}>{fb.titulo}</strong>
                    <span style={{ fontSize: 12, opacity: .85 }}>{fb.texto}</span>
                  </div>
                </div>
              )}

              {capacidade && capacidade.semEquipe && (
                <div className="prec-fb prec-fb-blue">
                  <span style={{ fontSize: 18, flexShrink: 0 }}>👥</span>
                  <div>
                    <strong style={{ display: 'block', marginBottom: 3 }}>Cadastre sua equipe pra ver o impacto na capacidade</strong>
                    <span style={{ fontSize: 12, opacity: .85 }}>Configure horas/mês de cada analista em Config → Equipe, e esse aviso passa a mostrar se fechar esse cliente é seguro pra capacidade do time.</span>
                  </div>
                </div>
              )}
              {capacidade && !capacidade.semEquipe && (() => {
                const CFG = {
                  critico:  { cls: 'prec-fb-red',    icon: '🔴', titulo: 'Capacidade estourada' },
                  atencao:  { cls: 'prec-fb-yellow', icon: '🟠', titulo: 'Capacidade apertada' },
                  ok:       { cls: 'prec-fb-green',  icon: '🟢', titulo: 'Capacidade tranquila' },
                }[capacidade.nivel]
                const textos = {
                  critico: `Fechar esse cliente leva sua equipe de ${capacidade.ocupacaoAtual.toFixed(0)}% pra ${capacidade.ocupacaoProjetada.toFixed(0)}% de ocupação — passa da capacidade. Risco real de atraso e queda de qualidade pros clientes que já tem. Considere reforçar a equipe antes de fechar.`,
                  atencao: `Fechar esse cliente leva sua equipe de ${capacidade.ocupacaoAtual.toFixed(0)}% pra ${capacidade.ocupacaoProjetada.toFixed(0)}% de ocupação. Ainda dá pra atender, mas fique de olho — pouco espaço pra mais um cliente depois deste.`,
                  ok: `Fechar esse cliente leva sua equipe de ${capacidade.ocupacaoAtual.toFixed(0)}% pra ${capacidade.ocupacaoProjetada.toFixed(0)}% de ocupação. Espaço de sobra.`,
                }
                return (
                  <div className={`prec-fb ${CFG.cls}`}>
                    <span style={{ fontSize: 18, flexShrink: 0 }}>{CFG.icon}</span>
                    <div>
                      <strong style={{ display: 'block', marginBottom: 3 }}>{CFG.titulo}</strong>
                      <span style={{ fontSize: 12, opacity: .85 }}>{textos[capacidade.nivel]} Margem média da carteira atual: {capacidade.margemBook.toFixed(0)}%.</span>
                    </div>
                  </div>
                )
              })()}

              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16, flexWrap: 'wrap' }}>
                {[
                  ['Mínimo', calc.vMinimo, '#FEF2F2', '#991B1B', '#FCA5A5'],
                  ['Recomendado', calc.vRecomendado, '#ECFDF5', '#166534', '#6EE7B7'],
                  ['Premium', calc.vPremium, '#FEF9C3', '#92400E', '#FCD34D'],
                ].map(([l, v, bg, color, border]) => (
                  <button key={l} className="prec-atalho" onClick={() => setValorProposta(formatBRL(Math.round(v)))}
                    style={{ background: bg, color, borderColor: border }}>
                    Usar {l}: {fmt(v)}
                  </button>
                ))}
              </div>
            </div>

            {/* ACADEMIA */}
            <div className="prec-card">
              <div className="prec-card-num">Academia de Precificação Fluxe</div>
              <div className="prec-card-title" style={{ fontSize: 16 }}>Aprenda enquanto decide</div>
              <div className="prec-card-desc">Conceitos que todo profissional de BPO precisa dominar para precificar com confiança.</div>
              <div style={{ height: 14 }} />
              <div className="prec-academia">
                {ACADEMIA.map((a, i) => (
                  <div key={i} className="prec-acad-card" onClick={() => setAcadAberto(acadAberto === i ? null : i)}>
                    <div className="prec-acad-icon">{a.icon}</div>
                    <div className="prec-acad-title">{a.titulo}</div>
                    <div className="prec-acad-desc">{a.desc}</div>
                    {acadAberto === i && <div className="prec-acad-body">{a.body}</div>}
                  </div>
                ))}
              </div>
            </div>

            <div className="prec-btn-row">
              <button className="prec-btn prec-btn-ghost" onClick={() => irPara(3)}>← Voltar</button>
              <button className="prec-btn prec-btn-primary" onClick={irParaEscopo}>Gerar escopo →</button>
            </div>
          </div>
        )}

        {/* ══ ETAPA 5: ESCOPO E PROPOSTA ══ */}
        {etapa === 5 && calc && (
          <div>
            <div className="prec-card">
              <div className="prec-card-num">Etapa 05</div>
              <div className="prec-card-title">Escopo do serviço</div>
              <div className="prec-card-desc">Gerado automaticamente com base no diagnóstico. Revise antes de apresentar ao cliente.</div>

              {/* Serviços incluídos */}
              <div className="prec-scope-block">
                <div className="prec-scope-title"><span>📋</span> Serviços incluídos</div>
                {calc.items.map((it, i) => {
                  // Monta descrição com quantidades em vez de horas
                  const d = calc.d
                  const qtd = {
                    'Conciliação bancária':          d.bancos > 0 ? `${d.bancos} conta${d.bancos>1?'s':''} bancária${d.bancos>1?'s':''}` : null,
                    'Contas a pagar':                d.capag > 0 ? `até ${d.capag} pagamentos/mês` : null,
                    'Cobranças manuais a receber':   d.carec > 0 ? `até ${d.carec} cobranças/mês` : null,
                    'Agendamento bancário':          d.agend > 0 && d.capag > 0 ? `${d.capag} agendamentos/mês` : null,
                    'Emissão de notas fiscais':      d.nfs > 0 ? `até ${d.nfs} NFs/mês` : null,
                    'Emissão de boletos':            d.boletos > 0 ? `até ${d.boletos} boletos/mês` : null,
                    'Conciliação sistema de cobrança': d.sistcob > 0 ? 'Asaas / Iugu ou similar' : null,
                    'Conciliação de cartões de crédito': d.cartao > 0 ? `${d.cartao} cartão${d.cartao>1?'ões':''} de crédito` : null,
                    'Conciliação outras plataformas': d.plat > 0 ? `${d.plat} plataforma${d.plat>1?'s':''}` : null,
                    'Envio de documentos à contabilidade': 'organização e envio mensal',
                    'Relatórios gerenciais': d.relat == 2 ? 'DRE + Fluxo de Caixa + Indicadores' : 'DRE + Fluxo de Caixa',
                    'Reunião estratégica mensal': d.reuniao >= 1.5 ? '1h presencial/mês' : '1h online/mês',
                    'Consultoria e planejamento': d.consult == 2 ? 'planejamento completo mensal' : 'análises estratégicas mensais',
                    'Lembretes de vencimento': 'via WhatsApp',
                  }
                  const desc = qtd[it.nome]
                  return (
                    <div key={i} className="prec-scope-item">
                      {it.nome}{desc ? ` — ${desc}` : ''}
                    </div>
                  )
                })}
                {calc.d.erp && (
                  <div className="prec-scope-item">
                    Sistema financeiro: {calc.d.erp === 'Outro' ? (calc.d.erpOutro || 'Outro') : calc.d.erp} — licença {{
                      cliente_direto: 'contratada e paga diretamente pelo cliente',
                      bpo_embutida: 'inclusa na mensalidade',
                      repasse: `repassada mensalmente (${fmt(calc.licencaRepasse || 0)}/mês, reajustada conforme a plataforma)`,
                      contabilidade: 'fornecida pela contabilidade do cliente',
                    }[calc.d.licencaModalidade] || ''}
                  </div>
                )}
              </div>

              {/* Blocos editáveis: Responsabilidades / Limites / SLA */}
              {(() => {
                const esc = escopo || montarEscopoPadrao(calc)
                const BLOCOS = [
                  ['resp',    '🤝', 'Responsabilidades do cliente'],
                  ['limites', '⚠️', 'Limites operacionais'],
                  ['sla',     '📅', 'SLA e entregáveis'],
                ]
                return (
                  <>
                    {BLOCOS.map(([key, icon, titulo]) => (
                      <div key={key} className="prec-scope-block">
                        <div className="prec-scope-title" style={{ display:'flex', alignItems:'center' }}>
                          <span>{icon}</span> {titulo}
                          <button
                            onClick={() => { if (!escopo) setEscopo(esc); setEscopoEdit(escopoEdit === key ? null : key) }}
                            style={{ marginLeft:'auto', border:'none', background:'transparent', color:'#6366F1', fontSize:11, fontWeight:700, cursor:'pointer' }}
                          >{escopoEdit === key ? '✓ Concluir' : '✏️ Editar'}</button>
                        </div>
                        {escopoEdit === key ? (
                          <textarea
                            value={(escopo?.[key] || esc[key]).join('\n')}
                            onChange={e => setEscopo(s => ({ ...(s || esc), [key]: e.target.value.split('\n') }))}
                            onBlur={e => setEscopo(s => ({ ...(s || esc), [key]: e.target.value.split('\n').map(l => l.trim()).filter(Boolean) }))}
                            style={{ width:'100%', minHeight:110, fontSize:12, fontFamily:'inherit', border:'1px solid #C7D2FE', borderRadius:8, padding:10, lineHeight:1.7 }}
                            placeholder="Um item por linha"
                          />
                        ) : (
                          esc[key].map((r, i) => <div key={i} className="prec-scope-item">{r}</div>)
                        )}
                      </div>
                    ))}
                    <div style={{ display:'flex', justifyContent:'flex-end', gap:8 }}>
                      <button onClick={() => setEscopo(null)} style={{ border:'1px solid #E2E8F0', background:'#fff', color:'#64748B', borderRadius:7, padding:'5px 12px', fontSize:11, fontWeight:600, cursor:'pointer' }}>↺ Restaurar padrão</button>
                      <button onClick={salvarEscopoComoPadrao} style={{ border:'1px solid #6366F1', background:'#EEF2FF', color:'#4338CA', borderRadius:7, padding:'5px 12px', fontSize:11, fontWeight:700, cursor:'pointer' }}>💾 Salvar como padrão da empresa</button>
                    </div>
                  </>
                )
              })()}
            </div>

            {/* PROPOSTA */}
            <div id="proposta-print" className="prec-card">
              <div className="prec-card-num">Proposta comercial</div>

              {/* Cabeçalho com identidade visual do BPO */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20, paddingBottom:16, borderBottom:`2px solid ${empresa?.cor_primaria||'#6366F1'}` }}>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  {empresa?.logo_url && (
                    <img src={empresa.logo_url} alt="Logo" style={{ height:48, objectFit:'contain' }} onError={e => e.target.style.display='none'} />
                  )}
                  <div>
                    <div style={{ fontSize:15, fontWeight:700, color: empresa?.cor_primaria||'#6366F1', fontFamily: empresa?.fonte||'inherit' }}>{empresa?.nome || 'Seu BPO'}</div>
                    {empresa?.slogan && <div style={{ fontSize:11, color:'var(--ptext3)', marginTop:2, fontStyle:'italic' }}>{empresa.slogan}</div>}
                    {empresa?.telefone && <div style={{ fontSize:11, color:'var(--ptext2)', marginTop:1 }}>{empresa.telefone}</div>}
                  </div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontSize:10, color:'var(--ptext3)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:4 }}>Proposta para</div>
                  <div style={{ fontSize:15, fontWeight:700, color:'var(--ptext)' }}>{calc.d.nome || 'Cliente'}</div>
                  <div style={{ fontSize:11, color:'var(--ptext2)', marginTop:2 }}>Data: {hoje}</div>
                  <div style={{ fontSize:10, color:'var(--ptext3)', marginTop:2 }}>Válida por 15 dias úteis</div>
                </div>
              </div>

              <div style={{ background: (empresa?.cor_primaria||'#6366F1')+'18', border:`1px solid ${empresa?.cor_primaria||'#6366F1'}44`, borderRadius:10, padding:20, textAlign:'center', marginBottom:20 }}>
                <div style={{ fontSize:11, color:empresa?.cor_primaria||'#6366F1', fontWeight:600, textTransform:'uppercase', letterSpacing:'.06em', marginBottom:6 }}>Investimento mensal</div>
                <div style={{ fontFamily:"'DM Mono',monospace", fontSize:40, fontWeight:500, color:empresa?.cor_primaria||'#6366F1', letterSpacing:'-.02em' }}>{fmt(parseBRL(valorProposta))}</div>
                <div style={{ fontSize:11, color:'var(--ptext3)', marginTop:4 }}>por mês · primeiro pagamento no fechamento desta proposta</div>
                {calc.licencaRepasse > 0 && (
                  <div style={{ fontSize:12, color:'var(--ptext2)', marginTop:8, paddingTop:8, borderTop:'1px dashed '+(empresa?.cor_primaria||'#6366F1')+'44' }}>
                    + {fmt(calc.licencaRepasse)}/mês — licença {calc.d.erp === 'Outro' ? (calc.d.erpOutro || 'do sistema') : calc.d.erp} (repasse, reajustado conforme a plataforma)
                  </div>
                )}
                {calc.d.licencaModalidade === 'bpo_embutida' && calc.licencaEmbutida > 0 && (
                  <div style={{ fontSize:12, color:'var(--ptext2)', marginTop:8, paddingTop:8, borderTop:'1px dashed '+(empresa?.cor_primaria||'#6366F1')+'44' }}>
                    Inclui {fmt(calc.licencaEmbutida)}/mês de licença {calc.d.erp === 'Outro' ? (calc.d.erpOutro || 'do sistema') : calc.d.erp} + {fmt(Math.max(0, parseBRL(valorProposta) - calc.licencaEmbutida))}/mês de serviços BPO
                  </div>
                )}
              </div>

              <div style={{ marginBottom:20 }}>
                <div style={{ fontSize:12, fontWeight:600, color:'var(--ptext2)', marginBottom:10 }}>Serviços incluídos:</div>
                {calc.items.map((it, i) => {
                  const d = calc.d
                  const qtd = {
                    'Conciliação bancária':          d.bancos > 0 ? `${d.bancos} conta${d.bancos>1?'s':''}` : null,
                    'Contas a pagar':                d.capag > 0 ? `até ${d.capag}/mês` : null,
                    'Cobranças manuais a receber':   d.carec > 0 ? `até ${d.carec}/mês` : null,
                    'Agendamento bancário':          d.agend > 0 && d.capag > 0 ? `${d.capag} pagamentos/mês` : null,
                    'Emissão de notas fiscais':      d.nfs > 0 ? `até ${d.nfs} NFs/mês` : null,
                    'Emissão de boletos':            d.boletos > 0 ? `até ${d.boletos}/mês` : null,
                    'Relatórios gerenciais':         d.relat == 2 ? 'DRE + Fluxo + Indicadores' : 'DRE + Fluxo de Caixa',
                    'Reunião estratégica mensal':    d.reuniao >= 1.5 ? '1h presencial/mês' : '1h online/mês',
                    'Conciliação outras plataformas': d.plat > 0 ? `${d.plat} plataforma${d.plat>1?'s':''}` : null,
                  }
                  const desc = qtd[it.nome]
                  return (
                    <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:'1px solid var(--pborder)', fontSize:12 }}>
                      <span>{it.nome}</span>
                      <span style={{ color:'var(--ptext3)', fontStyle: desc ? 'normal' : 'italic' }}>{desc || 'incluso'}</span>
                    </div>
                  )
                })}
              </div>

              <div style={{ background: 'var(--psurface2)', borderRadius: 8, padding: 14, fontSize: 12, color: 'var(--ptext2)', lineHeight: 1.6 }}>
                <strong style={{ color: '#181714', display: 'block', marginBottom: 4 }}>Por que este valor?</strong>
                Esta proposta foi calculada considerando {calc.totalHoras} horas mensais de trabalho especializado,{' '}
                {calc.d.bancos} conta{calc.d.bancos > 1 ? 's' : ''} bancária{calc.d.bancos > 1 ? 's' : ''} para conciliação,{' '}
                {calc.d.capag + calc.d.carec} títulos entre contas a pagar e a receber, e complexidade operacional classificada como{' '}
                <strong>{calc.complexLabel}</strong>.{' '}
                {calc.d.fat > 0 && `O investimento representa ${((parseBRL(valorProposta) / calc.d.fat) * 100).toFixed(1)}% do faturamento mensal — dentro da faixa de mercado de 1% a 3%.`}
              </div>
            </div>

                        <div className="prec-btn-row">
              <button className="prec-btn prec-btn-ghost" onClick={() => irPara(4)}>← Ajustar valor</button>
              <button className="prec-btn prec-btn-ghost" onClick={() => {
                const w = window.open('', '_blank', 'width=900,height=700')
                const el = document.getElementById('proposta-print')
                w.document.write('<html><head><title>Proposta</title><style>body{font-family:DM Sans,sans-serif;margin:0;padding:32px;color:#1a1a1a;font-size:13px;line-height:1.7}@page{margin:1.5cm}*{box-sizing:border-box}.prec-scope-block{background:#F9F8F5;border:1px solid #E8E5DE;border-radius:8px;padding:16px;margin-bottom:12px}.prec-scope-title{font-size:11px;font-weight:600;color:#6A6760;text-transform:uppercase;letter-spacing:.05em;margin-bottom:10px;display:flex;align-items:center;gap:6px}.prec-scope-item{font-size:12px;color:#6A6760;padding:4px 0;display:flex;gap:6px}.prec-scope-item::before{content:"→";color:#1A4D3A;flex-shrink:0}</style></head><body>' + el.innerHTML + '</body></html>')
                w.document.close()
                setTimeout(() => { w.print() }, 500)
              }}>🖨 Imprimir proposta</button>
              <button className="prec-btn" style={{ background:'#00C4CC', borderColor:'#00C4CC', color:'#fff' }} onClick={() => {
                window.open('https://canva.link/e0kovr95i9qfsza', '_blank')
                const dados = [
                  `CLIENTE: ${calc.d.nome || '—'}`,
                  `DATA: ${new Date().toLocaleDateString('pt-BR')}`,
                  ``,
                  `INVESTIMENTO MENSAL: ${fmt(parseBRL(valorProposta))}`,
                  ``,
                  `SERVIÇOS INCLUÍDOS:`,
                  ...calc.items.map(it => `• ${it.nome}`),
                  ``,
                  `APRESENTADA POR: ${empresa?.nome || 'Seu BPO'}`,
                  empresa?.slogan ? `"${empresa.slogan}"` : '',
                ].filter(l => l !== undefined).join('\n')
                navigator.clipboard.writeText(dados).then(() => alert('✓ Dados copiados! Cole no seu template do Canva.'))
              }}>🎨 Abrir no Canva</button>
              <button className="prec-btn prec-btn-primary" onClick={() => {
                // Pré-preenche dados do cliente no formulário de contrato
                setContratoForm(f => ({
                  ...f,
                  clienteNome: f.clienteNome || d._clienteNome || calc.d.nome || '',
                  clienteCnpj: f.clienteCnpj || d._clienteCnpj || '',
                  clienteRep: f.clienteRep || d._clienteContato || '',
                }))
                irPara(6)
              }}>Gerar contrato →</button>
            </div>
          </div>
        )}

        {/* ETAPA 6: CONTRATO */}
        {etapa === 6 && calc && (() => {
          const emp = empresa || {}
          const prop = emp.config?.proposta || {}
          const nomeEmp = emp.nome || 'SUA EMPRESA'
          const cnpjEmp = emp.cnpj || '00.000.000/0001-00'
          const emailEmp = emp.email || 'contato@suaempresa.com.br'
          const telEmp = emp.telefone || ''
          const repEmp = prop.representante || emp.representante || 'Representante Legal'
          const cargoRep = prop.cargo || 'Sócio(a) Administrador(a)'
          const cpfRep = prop.cpf_rep || '___.___.___-__'
          const enderecoEmp = prop.endereco || ''
          const cidadeEmp = prop.cidade || emp.cidade || 'Sua Cidade/UF'
          const foro = prop.foro || emp.foro || cidadeEmp
          const dadosIncompletos = !prop.representante || !emp.cnpj || !prop.cidade
          const dataHoje = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
          const val = parseBRL(valorProposta)
          const fmt2 = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 })
          const servicos = calc.items.filter(it => !it.nome.includes('Ajuste de porte'))

          const vigenciaTexto = {
            '6': '6 (seis) meses',
            '12': '12 (doze) meses',
            '24': '24 (vinte e quatro) meses',
            'indeterminado': 'prazo indeterminado',
          }[contratoForm.vigencia] || '12 (doze) meses'

          const dataInicioFmt = contratoForm.dataInicio
            ? new Date(contratoForm.dataInicio + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
            : '___/___/______'

          const setCF = (k) => (e) => setContratoForm(f => ({ ...f, [k]: e.target.value }))

          if (!contratoGerado) {
            return (
              <div>
                <div className="prec-card">
                  <div className="prec-card-num">Etapa 06</div>
                  <div className="prec-card-title">Configurar contrato</div>
                  <div className="prec-card-desc">Revise as condições contratuais antes de gerar o documento. Os campos já estão preenchidos com os valores padrão — edite conforme necessário.</div>

                  <div className="prec-sec" style={{ marginTop:16 }}>Dados do contratante (cliente)</div>
                  <div className="prec-fgrid">
                    <Campo label="Razão Social *">
                      <input className="prec-input" value={contratoForm.clienteNome || calc.d.nome || ''} onChange={setCF('clienteNome')} placeholder="Razão Social do cliente" />
                    </Campo>
                    <Campo label="CNPJ / CPF *">
                      <input className="prec-input" value={contratoForm.clienteCnpj || ''} onChange={setCF('clienteCnpj')} placeholder="00.000.000/0001-00" />
                    </Campo>
                    <Campo label="Representante legal *">
                      <input className="prec-input" value={contratoForm.clienteRep || ''} onChange={setCF('clienteRep')} placeholder="Nome completo" />
                    </Campo>
                    <Campo label="CPF do representante *">
                      <input className="prec-input" value={contratoForm.clienteCpf || ''} onChange={setCF('clienteCpf')} placeholder="000.000.000-00" />
                    </Campo>
                    <Campo label="E-mail do cliente">
                      <input className="prec-input" type="email" value={contratoForm.clienteEmail || d._clienteEmail || ''} onChange={setCF('clienteEmail')} placeholder="email@cliente.com.br" />
                    </Campo>
                    <Campo label="Endereço completo *" hint="Rua, número, cidade/UF">
                      <input className="prec-input" value={contratoForm.clienteEndereco || ''} onChange={setCF('clienteEndereco')} placeholder="Rua X, 123 — São Paulo/SP" />
                    </Campo>
                  </div>

                  <div className="prec-sec" style={{ marginTop:16 }}>Condições contratuais</div>
                  <div className="prec-fgrid">
                    <Campo label="Índice de reajuste anual">
                      <select className="prec-select" value={contratoForm.indiceReajuste} onChange={setCF('indiceReajuste')}>
                        <option>IGPM/FGV</option>
                        <option>IPCA</option>
                        <option>INPC</option>
                        <option>Salário Mínimo Federal</option>
                        <option>Fixo (sem reajuste)</option>
                        <option>A combinar</option>
                      </select>
                    </Campo>
                    <Campo label="Dia de vencimento" hint="Dia do mês para pagamento (1 a 28)">
                      <input className="prec-input" type="number" min="1" max="28" value={contratoForm.diaVencimento} onChange={setCF('diaVencimento')} />
                    </Campo>
                    <Campo label="Forma de pagamento">
                      <select className="prec-select" value={contratoForm.formaPagamento} onChange={setCF('formaPagamento')}>
                        <option>boleto bancário</option>
                        <option>PIX</option>
                        <option>transferência bancária (TED/DOC)</option>
                        <option>cartão de crédito</option>
                      </select>
                    </Campo>
                    <Campo label="Vigência do contrato">
                      <select className="prec-select" value={contratoForm.vigencia} onChange={setCF('vigencia')}>
                        <option value="6">6 meses</option>
                        <option value="12">12 meses</option>
                        <option value="24">24 meses</option>
                        <option value="indeterminado">Prazo indeterminado</option>
                      </select>
                    </Campo>
                    <Campo label="Data de início" hint="Data a partir da qual o contrato entra em vigor">
                      <input className="prec-input" type="date" value={contratoForm.dataInicio} onChange={setCF('dataInicio')} />
                    </Campo>
                  </div>

                  <div className={`prec-alert ${dadosIncompletos ? 'prec-alert-tip' : 'prec-alert-info'}`} style={{ marginTop: 4 }}>
                    <span>{dadosIncompletos ? '⚠️' : '🏢'}</span>
                    <div>
                      <strong style={{ display: 'block', marginBottom: 4 }}>Dados da CONTRATADA (das Configurações)</strong>
                      <div style={{ fontSize: 12, lineHeight: 1.6 }}>
                        <span><strong>{nomeEmp}</strong> · CNPJ: {cnpjEmp}</span><br />
                        {enderecoEmp && <><span>{enderecoEmp}</span><br /></>}
                        <span>{emailEmp}{telEmp ? ` · ${telEmp}` : ''}</span><br />
                        <span>Rep.: <strong>{repEmp}</strong> · {cargoRep} · CPF: {cpfRep}</span>
                      </div>
                      {dadosIncompletos && (
                        <div style={{ marginTop: 6, fontWeight: 600, fontSize: 11 }}>
                          Dados incompletos — complete em Configurações → abas Empresa e Proposta antes de imprimir.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="prec-btn-row">
                  <button className="prec-btn prec-btn-ghost" onClick={() => irPara(5)}>← Voltar</button>
                  <button className="prec-btn prec-btn-primary" onClick={async () => {
                    // Validação: contrato não pode sair com campos em branco
                    const faltando = []
                    if (!(contratoForm.clienteNome || calc.d.nome)) faltando.push('Razão Social do cliente')
                    if (!contratoForm.clienteCnpj) faltando.push('CNPJ/CPF do cliente')
                    if (!contratoForm.clienteRep) faltando.push('Representante legal do cliente')
                    if (!contratoForm.clienteCpf) faltando.push('CPF do representante')
                    if (!contratoForm.clienteEndereco) faltando.push('Endereço do cliente')
                    if (faltando.length > 0) {
                      alert('Complete os dados do contratante antes de gerar o contrato:\n\n• ' + faltando.join('\n• '))
                      return
                    }
                    if (dadosIncompletos) {
                      alert('Complete os dados da sua empresa (CONTRATADA) em Configurações → abas Empresa e Proposta.\nO contrato não pode sair com campos em branco para o cliente assinar.')
                      return
                    }
                    setContratoGerado(true)
                    // Persiste dados do contrato na proposta salva
                    if (propostaIdRef.current) {
                      try {
                        const upd = { id: propostaIdRef.current, contrato_dados: contratoForm }
                        // Não rebaixa proposta já aprovada para 'enviada'
                        if (propostaStatusRef.current !== 'aprovada') upd.status = 'enviada'
                        // Persiste o escopo editado no snapshot
                        if (escopo) upd.dados_calculo = { d, calc, valorProposta, escopo }
                        await updateProposta.mutateAsync(upd)
                      } catch (e) {
                        console.error('Erro ao atualizar proposta com contrato:', e)
                      }
                    }
                    // Salva os dados no cadastro do lead — o contrato consome dados, o cadastro é o dono deles
                    if (leadIdRef.current) {
                      try {
                        await supabase.from('leads').update({
                          cnpj: contratoForm.clienteCnpj || undefined,
                          contato: contratoForm.clienteRep || undefined,
                          email: contratoForm.clienteEmail || undefined,
                        }).eq('id', leadIdRef.current)
                      } catch (e) { console.error('Erro ao atualizar lead:', e) }
                    }
                  }}>Gerar contrato →</button>
                </div>
              </div>
            )
          }

          return (
            <div className="print-only">
              <style>{`
                @media print { .prec-btn-row, .prec-progress { display:none!important; } }
                .ctr { background:#fff; max-width:760px; margin:0 auto; padding:40px; border:1px solid #E8E5DE; border-radius:12px; font-size:13px; line-height:1.7; color:#1a1a1a; }
                .ctr-header { border-bottom:3px solid #1A4D3A; padding-bottom:20px; margin-bottom:24px; display:flex; justify-content:space-between; }
                .ctr-emp { font-size:20px; font-weight:700; color:#1A4D3A; }
                .ctr-titulo { text-align:center; font-size:15px; font-weight:700; color:#1A4D3A; text-transform:uppercase; margin:24px 0 4px; }
                .ctr-subtit { text-align:center; font-size:11px; color:#6A6760; font-style:italic; margin-bottom:24px; }
                .ctr-sec { font-size:11px; font-weight:700; color:#1A4D3A; letter-spacing:.08em; text-transform:uppercase; margin:24px 0 10px; padding-bottom:5px; border-bottom:2px solid #1A4D3A; }
                .ctr-cl { font-weight:700; font-size:13px; margin:16px 0 4px; }
                .ctr-p { margin:6px 0; text-align:justify; }
                .ctr-li { margin:4px 0 4px 20px; }
                .ctr-li::before { content:'• '; color:#1A4D3A; font-weight:700; }
                .ctr-tb { width:100%; border-collapse:collapse; margin:12px 0; font-size:12px; }
                .ctr-tb th { background:#1A4D3A; color:#fff; padding:8px 10px; text-align:left; font-size:11px; }
                .ctr-tb td { padding:7px 10px; border-bottom:1px solid #E8E5DE; }
                .ctr-tb tr:nth-child(even) td { background:#F9F8F5; }
                .ctr-val { background:#EAF2ED; border:2px solid #2D7A5A; border-radius:10px; padding:18px; text-align:center; margin:16px 0; }
                .ctr-val-num { font-size:32px; font-weight:700; color:#1A4D3A; font-family:'DM Mono',monospace; }
                .ctr-assin { display:grid; grid-template-columns:1fr 1fr; gap:40px; margin-top:40px; }
                .ctr-assin-bl { text-align:center; border-top:1px solid #1a1a1a; padding-top:8px; }
                .ctr-tb-wrap { overflow-x:auto; -webkit-overflow-scrolling:touch; margin:12px 0; }
                .ctr-tb-wrap .ctr-tb { min-width:360px; margin:0; }
                @media (max-width:600px) {
                  .ctr { padding:14px 10px; }
                  .ctr-header { flex-direction:column; gap:6px; }
                  .ctr-titulo { font-size:13px; }
                  .ctr-val-num { font-size:22px; }
                  .ctr-assin { grid-template-columns:1fr; gap:28px; }
                  .ctr-p { text-align:left; }
                }
              `}</style>
              <div className="ctr">
                <div className="ctr-header">
                  <div>
                    <div className="ctr-emp">{nomeEmp}</div>
                    <div style={{fontSize:11,color:'#6A6760'}}>CNPJ: {cnpjEmp} | {emailEmp}{telEmp ? ` | ${telEmp}` : ''}</div>
                  </div>
                  <div style={{textAlign:'right',fontSize:11,color:'#6A6760'}}><div>{dataHoje}</div></div>
                </div>
                <div className="ctr-titulo">Contrato de Prestação de Serviços de Apoio Administrativo Financeiro</div>
                <div className="ctr-subtit">Instrumento Particular com Força Executiva</div>

                <div className="ctr-sec">I — Das Partes</div>
                <p className="ctr-p"><strong>CONTRATANTE:</strong></p>
                <p className="ctr-p">Razão Social: <strong>{contratoForm.clienteNome || calc.d.nome}</strong></p>
                <p className="ctr-p">CNPJ/CPF: <strong>{contratoForm.clienteCnpj}</strong>{contratoForm.clienteEmail ? <> | E-mail: {contratoForm.clienteEmail}</> : null}</p>
                <p className="ctr-p">Endereço: {contratoForm.clienteEndereco}</p>
                <p className="ctr-p">Representada por: <strong>{contratoForm.clienteRep}</strong> · CPF: {contratoForm.clienteCpf}</p>
                <p className="ctr-p" style={{marginTop:12}}><strong>CONTRATADA:</strong></p>
                <p className="ctr-p">Razão Social: <strong>{nomeEmp}</strong> | CNPJ: {cnpjEmp}</p>
                {enderecoEmp && <p className="ctr-p">Endereço: {enderecoEmp}</p>}
                <p className="ctr-p">E-mail: {emailEmp}{telEmp ? ` | WhatsApp/Tel.: ${telEmp}` : ''}</p>
                <p className="ctr-p">Representada por: <strong>{repEmp}</strong> | Cargo: {cargoRep} | CPF: {cpfRep}</p>

                <div className="ctr-sec">II — Do Objeto</div>
                <p className="ctr-cl">CLÁUSULA 1ª — Do Objeto</p>
                <p className="ctr-p">O presente contrato tem por objeto a prestação de serviços especializados de apoio administrativo financeiro, compreendendo:</p>
                <div className="ctr-tb-wrap">
                <table className="ctr-tb">
                  <thead><tr><th>Serviço</th><th>Descrição / Escopo</th></tr></thead>
                  <tbody>{servicos.map((it,i)=><tr key={i}><td><strong>{it.nome}</strong></td><td style={{fontSize:11,color:'#6A6760'}}>{it.motivo}</td></tr>)}</tbody>
                </table>
                </div>
                <p className="ctr-p"><strong>Parágrafo Único:</strong> A disponibilização de funcionalidades específicas está condicionada ao plano do sistema de gestão operacional contratado pela CONTRATANTE.</p>

                <div className="ctr-sec">III — Das Condições de Execução</div>
                <p className="ctr-cl">CLÁUSULA 2ª — Do Horário e Entregas</p>
                <p className="ctr-p">Os serviços serão prestados remotamente, de segunda a sexta-feira, das 09h00 às 17h00 (horário de Brasília). Os relatórios mensais serão entregues até o 10º dia útil do mês subsequente, desde que a CONTRATANTE envie os documentos até o dia 5.</p>
                <p className="ctr-cl">CLÁUSULA 3ª — Das Responsabilidades da CONTRATANTE</p>
                {(escopo?.resp?.length ? escopo.resp : [
                  'Fornecer documentos e acessos até o dia 5 de cada mês',
                  'Responder às solicitações em até 48 horas úteis',
                  'Manter atualizados os acessos às plataformas utilizadas',
                  calc.d.agend > 0 && 'Manter saldo bancário suficiente para os agendamentos',
                  calc.d.nfs > 0 && 'Fornecer dados completos para emissão de notas fiscais',
                ].filter(Boolean)).map((r, i) => <div key={i} className="ctr-li">{r}</div>)}
                <p className="ctr-cl">CLÁUSULA 4ª — Das Vedações à CONTRATADA</p>
                <p className="ctr-p">Não integram o escopo: negociação com terceiros em nome da CONTRATANTE; tomada de decisões gerenciais; cobranças a clientes; controle de caixa físico; obrigações fiscais acessórias (SPED, EFD, DCTF), salvo se expressamente previsto.</p>

                <div className="ctr-sec">IV — Dos Valores e Reajuste</div>
                <p className="ctr-cl">CLÁUSULA 5ª — Dos Honorários</p>
                <div className="ctr-val">
                  <div style={{fontSize:11,fontWeight:600,color:'#1A4D3A',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:4}}>Mensalidade contratada</div>
                  <div className="ctr-val-num">{fmt2(val)}</div>
                  <div style={{fontSize:11,color:'#2D7A5A',marginTop:4}}>Pagamento até o dia {contratoForm.diaVencimento} de cada mês via {contratoForm.formaPagamento}</div>
                </div>
                <p className="ctr-p">O primeiro honorário será pago no ato da assinatura. Os demais serão pagos até o dia {contratoForm.diaVencimento} de cada mês via {contratoForm.formaPagamento}.</p>
                {calc.licencaRepasse > 0 && (
                  <p className="ctr-p"><strong>Parágrafo Primeiro:</strong> Além da mensalidade, a CONTRATANTE reembolsará mensalmente à CONTRATADA o valor de {fmt2(calc.licencaRepasse)} referente à licença do sistema {calc.d.erp === 'Outro' ? (calc.d.erpOutro || 'de gestão financeira') : calc.d.erp}, a título de repasse. Eventuais reajustes de preço praticados pela plataforma serão automaticamente repassados à CONTRATANTE, mediante comunicação prévia.</p>
                )}
                {calc.licencaEmbutida > 0 && (
                  <p className="ctr-p"><strong>Parágrafo Primeiro:</strong> A mensalidade contratada inclui a licença do sistema {calc.d.erp === 'Outro' ? (calc.d.erpOutro || 'de gestão financeira') : calc.d.erp}, no valor de {fmt2(calc.licencaEmbutida)}/mês, contratada e mantida pela CONTRATADA.</p>
                )}
                {calc.d.licencaModalidade === 'contabilidade' && calc.d.erp && (
                  <p className="ctr-p"><strong>Parágrafo Primeiro:</strong> A licença do sistema {calc.d.erp === 'Outro' ? (calc.d.erpOutro || 'de gestão financeira') : calc.d.erp} é fornecida pela contabilidade da CONTRATANTE. A eventual descontinuidade desse fornecimento não é de responsabilidade da CONTRATADA, e a nova contratação da licença deverá ser acordada entre as partes.</p>
                )}
                <p className="ctr-cl">CLÁUSULA 6ª — Do Volume de Serviços</p>
                <div className="ctr-tb-wrap">
                <table className="ctr-tb">
                  <thead><tr><th>Serviço</th><th>Limite Mensal</th></tr></thead>
                  <tbody>
                    {calc.d.bancos > 0 && <tr><td>Contas bancárias monitoradas</td><td>Até {calc.d.bancos} conta{calc.d.bancos>1?'s':''}</td></tr>}
                    {calc.d.capag > 0 && <tr><td>Contas a pagar / agendamentos</td><td>Até {Math.ceil(calc.d.capag*1.5)} títulos/mês</td></tr>}
                    {calc.d.nfs > 0 && <tr><td>Notas fiscais</td><td>Até {Math.ceil(calc.d.nfs*1.5)} NFs/mês</td></tr>}
                    {calc.d.boletos > 0 && <tr><td>Boletos emitidos</td><td>Até {Math.ceil(calc.d.boletos*1.5)}/mês</td></tr>}
                    {calc.d.reuniao > 0 && <tr><td>Reunião estratégica</td><td>1 reunião/mês</td></tr>}
                  </tbody>
                </table>
                </div>
                <p className="ctr-cl">CLÁUSULA 7ª — Da Mora e Reajuste</p>
                <p className="ctr-p">Pagamento em atraso: multa de 2% + juros de 1% ao mês + correção pelo IPCA. Atraso superior a 30 dias faculta à CONTRATADA suspender os serviços.</p>
                <p className="ctr-p">Reajuste anual a partir do 13º mês de vigência, com base na variação acumulada {contratoForm.indiceReajuste === 'Salário Mínimo Federal' ? 'do Salário Mínimo Federal' : contratoForm.indiceReajuste === 'Fixo (sem reajuste)' ? '— sem reajuste automático' : `do índice ${contratoForm.indiceReajuste}`} no período.</p>

                <div className="ctr-sec">V — Da Vigência e Rescisão</div>
                <p className="ctr-cl">CLÁUSULA 8ª — Da Vigência</p>
                <p className="ctr-p">Vigência de {vigenciaTexto} a partir de {dataInicioFmt}, com renovação automática, salvo aviso prévio por escrito de 30 (trinta) dias. O descumprimento do aviso implica multa de 1 (um) honorário mensal.</p>

                <div className="ctr-sec">VI — Confidencialidade e LGPD</div>
                <p className="ctr-cl">CLÁUSULA 9ª — Da Confidencialidade e LGPD (Lei 13.709/2018)</p>
                <p className="ctr-p">As partes mantêm sigilo absoluto por 5 anos após o término. A CONTRATANTE é Controladora e a CONTRATADA é Operadora dos dados. Em caso de incidente, a CONTRATADA notificará em até 72 horas.</p>

                <div className="ctr-sec">VII — Do Foro</div>
                <p className="ctr-cl">CLÁUSULA 10ª — Do Foro</p>
                <p className="ctr-p">Fica eleito o Foro da Comarca de <strong>{foro}</strong>, com expressa renúncia a qualquer outro.</p>

                <p style={{textAlign:'center',marginTop:32,marginBottom:24,fontSize:12,color:'#6A6760'}}>{cidadeEmp}, {dataHoje}.</p>
                <div className="ctr-assin">
                  <div className="ctr-assin-bl">
                    <div style={{fontWeight:600,fontSize:12}}>{repEmp}</div>
                    <div style={{fontSize:11,color:'#6A6760'}}>{cargoRep} · CPF: {cpfRep}</div>
                    <div style={{fontSize:11,color:'#6A6760'}}>{nomeEmp} — CONTRATADA</div>
                  </div>
                  <div className="ctr-assin-bl">
                    <div style={{fontWeight:600,fontSize:12}}>{contratoForm.clienteNome || calc.d.nome || '___________________________'}</div>
                    <div style={{fontSize:11,color:'#6A6760'}}>Nome / CPF: {contratoForm.clienteRep ? `${contratoForm.clienteRep} · ${contratoForm.clienteCpf||''}` : '_______________________ '} — CONTRATANTE</div>
                  </div>
                </div>
              </div>
              <div className="prec-btn-row" style={{marginTop:16}}>
                <button className="prec-btn prec-btn-ghost" onClick={() => setContratoGerado(false)}>← Editar condições</button>
                <button className="prec-btn prec-btn-ghost" onClick={() => { irPara(1); setCalc(null); setValorProposta('') }}>Novo cliente</button>
                <button
                  className="prec-btn prec-btn-ghost"
                  disabled={baixandoDocx}
                  onClick={async () => {
                    setBaixandoDocx(true)
                    try {
                      const { gerarContratoDocx, downloadContratoDocx } = await getContratoDocx()
                      const blob = await gerarContratoDocx({ calc, contratoForm, empresa, valorProposta, escopo })
                      downloadContratoDocx(blob, calc?.d?.nome)
                    } catch (e) {
                      alert('Erro ao gerar Word: ' + e.message)
                    } finally {
                      setBaixandoDocx(false)
                    }
                  }}
                >{baixandoDocx ? '⏳ Gerando...' : '⬇ Baixar Word'}</button>

                {/* Botão Autentique */}
                {!assinaturaEnviada ? (
                  <div style={{ display:'flex', flexDirection:'column', gap:6, minWidth:240 }}>
                    <input
                      type="email"
                      value={emailCliente}
                      onChange={e => setEmailCliente(e.target.value)}
                      placeholder="E-mail do cliente para assinar..."
                      style={{ padding:'7px 10px', border:'1px solid #E2E8F0', borderRadius:8, fontSize:12, fontFamily:'inherit' }}
                    />
                    <button
                      className="prec-btn prec-btn-primary"
                      disabled={enviandoAssinatura || !emailCliente}
                      onClick={async () => {
                        if (!emailCliente) return alert('Informe o e-mail do cliente.')
                        // Verifica se token está configurado
                        if (!empresa?.autentique_token) {
                          setSetupModal(true)
                          setSetupStep(1)
                          setSetupStatus(null)
                          return
                        }
                        setEnviandoAssinatura(true)
                        try {
                          const { gerarContratoDocx } = await getContratoDocx()
                          const blob = await gerarContratoDocx({ calc, contratoForm, empresa, valorProposta })
                          const arrayBuffer = await blob.arrayBuffer()
                          // btoa seguro para arquivos grandes (spread quebra acima de ~250KB)
                          const bytes = new Uint8Array(arrayBuffer)
                          let binary = ''
                          for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i])
                          const base64Safe = btoa(binary)

                          const nomeCliente = contratoForm.clienteNome || calc?.d?.nome || ''
                          if (!base64Safe) throw new Error('Falha ao gerar o arquivo do contrato. Tente novamente.')
                          if (!nomeCliente) throw new Error('Nome do cliente não encontrado. Volte ao passo 1 e preencha o nome do cliente.')
                          if (!emailCliente) throw new Error('E-mail do cliente é obrigatório.')

                          const { data: { session } } = await supabase.auth.getSession()
                          const fnResp = await fetch(
                            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/autentique-sign`,
                            {
                              method: 'POST',
                              headers: {
                                'Authorization': `Bearer ${session.access_token}`,
                                'Content-Type': 'application/json',
                              },
                              body: JSON.stringify({
                                docx_base64: base64Safe,
                                filename: `Contrato_${nomeCliente}.docx`,
                                cliente_nome: nomeCliente,
                                cliente_email: emailCliente,
                                proposta_id: propostaIdRef.current || null,
                              }),
                            }
                          )
                          const respData = await fnResp.json()
                          if (!fnResp.ok || respData.error) throw new Error(respData.error || `Erro ${fnResp.status}`)
                          setAssinaturaEnviada(respData)
                        } catch (e) {
                          alert('Erro ao enviar: ' + e.message)
                        } finally {
                          setEnviandoAssinatura(false)
                        }
                      }}
                    >{enviandoAssinatura ? '⏳ Enviando...' : '✍️ Enviar para assinatura'}</button>
                  </div>
                ) : (
                  <div style={{ background:'#F0FDF4', border:'1px solid #86EFAC', borderRadius:8, padding:'10px 14px', fontSize:12 }}>
                    <div style={{ fontWeight:700, color:'#16A34A', marginBottom:6 }}>✅ Enviado para assinatura!</div>
                    <div style={{ color:'#166534', marginBottom:4 }}>Você receberá um e-mail para assinar.</div>
                    {assinaturaEnviada.link_cliente && (
                      <div style={{ color:'#166534' }}>
                        Link do cliente: <a href={assinaturaEnviada.link_cliente} target="_blank" rel="noopener noreferrer" style={{ color:'#6366F1', wordBreak:'break-all' }}>{assinaturaEnviada.link_cliente}</a>
                      </div>
                    )}
                  </div>
                )}

                <button className="prec-btn prec-btn-primary" onClick={() => window.print()}>🖨 Imprimir / PDF</button>
                <button className="prec-btn" onClick={() => {
                  window.open('https://canva.link/e0kovr95i9qfsza', '_blank')
                  const dados = [
                    `CLIENTE: ${calc.d.nome || '—'}`,
                    `DATA: ${new Date().toLocaleDateString('pt-BR')}`,
                    ``,
                    `INVESTIMENTO MENSAL: ${fmt(parseBRL(valorProposta))}`,
                    ``,
                    `SERVIÇOS INCLUÍDOS:`,
                    ...calc.items.map(it => {
                      const d = calc.d
                      const qtdMap = {
                        'Conciliação bancária': d.bancos > 0 ? `${d.bancos} conta${d.bancos>1?'s':''}` : null,
                        'Contas a pagar': d.capag > 0 ? `até ${d.capag}/mês` : null,
                        'Cobranças manuais a receber': d.carec > 0 ? `até ${d.carec}/mês` : null,
                        'Agendamento bancário': d.agend > 0 && d.capag > 0 ? `${d.capag} pagamentos/mês` : null,
                        'Emissão de notas fiscais': d.nfs > 0 ? `até ${d.nfs} NFs/mês` : null,
                        'Emissão de boletos': d.boletos > 0 ? `até ${d.boletos}/mês` : null,
                        'Relatórios gerenciais': d.relat == 2 ? 'DRE + Fluxo + Indicadores' : 'DRE + Fluxo de Caixa',
                        'Reunião estratégica mensal': d.reuniao >= 1.5 ? '1h presencial/mês' : '1h online/mês',
                      }
                      const qtd = qtdMap[it.nome]
                      return `• ${it.nome}${qtd ? ` — ${qtd}` : ''}`
                    }),
                    ``,
                    `APRESENTADA POR: ${empresa?.nome || 'Seu BPO'}`,
                    empresa?.slogan ? `"${empresa.slogan}"` : '',
                    empresa?.telefone || '',
                    `Válida por 15 dias úteis`,
                  ].filter(l => l !== undefined).join('\n')
                  navigator.clipboard.writeText(dados).then(() => alert('✓ Dados copiados! Cole no seu template do Canva.'))
                }}
                  style={{ background:'#00C4CC', borderColor:'#00C4CC', color:'#fff' }}>
                  🎨 Abrir no Canva
                </button>
              </div>
            </div>
          )
        })()}

      </div>

      {/* ══ MODAL: IMPORTAR PROPOSTA EXISTENTE ══ */}
      {importModal && (() => {
        const fmtV = (v) => v != null ? Number(v).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}) : '—'
        const fmtD = (d) => d ? new Date(d).toLocaleDateString('pt-BR') : '—'
        const STATUS_LABEL = {
          rascunho:'Rascunho', enviada:'Enviada', em_negociacao:'Em negociação',
          aprovada:'Aprovada', rejeitada:'Rejeitada', expirada:'Expirada', cancelada:'Cancelada'
        }
        const filtradas = todasPropostas.filter(p => {
          const s = importSearch.toLowerCase()
          const matchBusca = !s ||
            (p.dados_cliente?.nome || '').toLowerCase().includes(s) ||
            (p.dados_cliente?.cnpj || '').includes(s) ||
            String(p.numero).includes(s)
          const matchStatus = !importStatus || p.status === importStatus
          return matchBusca && matchStatus
        })
        return (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.55)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2000, padding:16 }}>
            <div style={{ background:'#fff', borderRadius:16, width:'100%', maxWidth:580, maxHeight:'85vh', display:'flex', flexDirection:'column', padding:24 }}>
              <div style={{ display:'flex', alignItems:'center', marginBottom:16 }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:15 }}>Importar proposta existente</div>
                  <div style={{ fontSize:11, color:'var(--ptext3)', marginTop:2 }}>Selecione uma proposta para pré-carregar os dados no formulário.</div>
                </div>
                <button onClick={() => setImportModal(false)} style={{ border:'none', background:'none', cursor:'pointer', fontSize:18, color:'var(--ptext3)', padding:4 }}>✕</button>
              </div>
              <div style={{ display:'flex', gap:8, marginBottom:14 }}>
                <input value={importSearch} onChange={e => setImportSearch(e.target.value)}
                  placeholder="Buscar por empresa, CNPJ ou número..." className="prec-input" style={{ flex:1 }} />
                <select value={importStatus} onChange={e => setImportStatus(e.target.value)} className="prec-select" style={{ width:150 }}>
                  <option value="">Todos os status</option>
                  {Object.entries(STATUS_LABEL).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:8 }}>
                {filtradas.length === 0 && (
                  <div style={{ textAlign:'center', padding:'32px 0', color:'var(--ptext3)', fontSize:13 }}>Nenhuma proposta encontrada.</div>
                )}
                {filtradas.map(p => {
                  const st = { rascunho:'#94A3B8', enviada:'#6366F1', em_negociacao:'#F59E0B', aprovada:'#22C55E', rejeitada:'#EF4444', expirada:'#94A3B8', cancelada:'#DC2626' }[p.status] || '#94A3B8'
                  return (
                    <div key={p.id} style={{ border:'1px solid var(--pborder)', borderRadius:10, padding:'12px 14px', display:'flex', flexWrap:'wrap', alignItems:'center', gap:10 }}>
                      <span style={{ fontFamily:'DM Mono,monospace', fontSize:10, color:'var(--ptext3)', flexShrink:0 }}>#{String(p.numero).padStart(6,'0')}</span>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontWeight:600, fontSize:13, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                          {p.dados_cliente?.nome || '(sem nome)'}
                        </div>
                        <div style={{ fontSize:11, color:'var(--ptext3)' }}>{fmtD(p.criado_em)} · {fmtV(p.valor_mensal)}/mês</div>
                      </div>
                      <span style={{ padding:'2px 8px', borderRadius:99, fontSize:10, fontWeight:700, background:st+'22', color:st, flexShrink:0 }}>
                        {STATUS_LABEL[p.status] || p.status}
                      </span>
                      <button onClick={() => importarDeProposta(p)}
                        style={{ padding:'5px 14px', border:'none', borderRadius:7, background:'var(--pg)', color:'#fff', fontSize:11, fontWeight:700, cursor:'pointer', flexShrink:0 }}>
                        Selecionar
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )
      })()}

    </>
  )
}
