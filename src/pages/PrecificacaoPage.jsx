import { useState, useCallback, useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { supabase } from '../lib/supabase'
import { gerarContratoDocx, downloadContratoDocx } from '../utils/contratoDocx'

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

  if (d.carec > 0) add('Contas a receber', 0.5 + d.carec * 0.04, calcPeso(0.5 + d.carec * 0.04, 5),
    `${d.carec} recebíveis/mês`)

  if (d.agend > 0) add('Agendamento bancário', 0.5 + d.capag * 0.033, calcPeso(0.5 + d.capag * 0.033, 5),
    `${d.capag} pagamento${d.capag !== 1 ? 's' : ''}/mês no banco (~2 min cada + 0,5h de gestão)`)

  if (d.nfs > 0) add('Emissão de notas fiscais', 0.3 + d.nfs * 0.07, calcPeso(0.3 + d.nfs * 0.07, 4),
    `${d.nfs} NFs/mês (~4min por nota)`)

  if (d.boletos > 0) add('Emissão de boletos', 0.3 + d.boletos * 0.05, calcPeso(0.3 + d.boletos * 0.05, 4),
    `${d.boletos} boletos/mês`)

  if (d.carec > 0) add('Controle de inadimplentes', 0.3 + d.carec * 0.02, 'baixo',
    `Follow-up sobre ${d.carec} recebíveis`)

  if (d.sistcob) add('Gestão sistema de cobrança', 0.5, 'baixo', 'Asaas, Iugu ou similar')
  if (d.cartao) add('Conciliação cartão de crédito', 1.0, 'médio', 'Conciliação fatura + classificação')

  if (d.plat > 0) add('Conciliação outras plataformas', d.plat * 1.2, 'médio',
    `${d.plat} plataforma${d.plat > 1 ? 's' : ''} (PagSeguro, Mercado Pago…)`)

  if (d.folha && d.funcs > 0) add('Folha de pagamento / DP', 1.0 + d.funcs * 0.25, calcPeso(1.0 + d.funcs * 0.25, 8),
    `${d.funcs} funcionário${d.funcs > 1 ? 's' : ''} + pró-labore`)

  if (d.contab) add('Envio de documentos à contabilidade', 0.5, 'baixo', 'Organização e envio mensal')

  if (d.relat > 0) add('Relatórios gerenciais', d.relat === 1 ? 1.5 : 3.0, d.relat === 2 ? 'alto' : 'médio',
    d.relat === 1 ? 'DRE + fluxo de caixa' : 'DRE + fluxo + indicadores + análises')

  if (d.reuniao > 0) add('Reunião mensal', 1.0 + d.reuniao, 'médio',
    d.reuniao === 1 ? '1h online + preparação' : '1h presencial + deslocamento + preparação')

  if (d.consult > 0) add('Consultoria e planejamento', d.consult === 1 ? 2.0 : 4.0, 'alto',
    d.consult === 1 ? 'Análises estratégicas mensais' : 'Planejamento completo (budget, metas, DRE projetado)')

  if (d.lembrete) add('Lembrete de vencimento (WhatsApp)', 0.3, 'baixo', 'Avisos automáticos')

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
  if (d.folha) risco += 15
  if (d.nfs > 50) risco += 10
  if (d.cnpjs > 2) risco += 15
  if (d.consult > 0) risco += 10
  const riscoLabel = risco < 20 ? 'Baixo' : risco < 40 ? 'Moderado' : 'Alto'

  const percCap = Math.min(totalHoras / 160, 1)
  const overheadCliente = d.overhead * percCap
  const custoReal = totalHoras * d.custoHora + overheadCliente

  const vMinimo = custoReal / (1 - d.aliquota)
  const vRecomendado = custoReal / ((1 - d.aliquota) * (1 - d.margem))
  const vPremium = vRecomendado * 1.30

  return { items, totalHoras, complexidade, complexLabel, complexColor, riscoLabel, risco, custoReal, overheadCliente, vMinimo, vRecomendado, vPremium, d }
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
  const [contratoForm, setContratoForm] = useState({
    indiceReajuste: 'IGPM/FGV',
    diaVencimento: '05',
    formaPagamento: 'boleto bancário',
    vigencia: '12',
    dataInicio: new Date().toISOString().split('T')[0],
  })
  const { empresa, profile } = useAuthStore()

  // FORM STATE
  const [d, setD] = useState({
    nome: '', fat: '', cnpjs: 1, funcs: 0,
    bancos: 1, capag: 0, carec: 0, mov: 0, nfs: 0, boletos: 0,
    sistcob: 0, cartao: 0, plat: 0, agend: 0, folha: 0,
    contab: 0, relat: 0, reuniao: 0, consult: 0, lembrete: 0,
    custoHora: 50, margem: 35, overhead: 600, regime: 6,
  })
  const [custoHoraFonte, setCustoHoraFonte] = useState(null) // null | 'equipe' | 'propria'

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
          setD(prev => ({ ...prev, custoHora: media }))
          setCustoHoraFonte(data.length === 1 ? 'propria' : 'equipe')
        }
      })
  }, [profile?.empresa_id])

  const set = (k, v) => setD(prev => ({ ...prev, [k]: v }))
  const num = (k) => (e) => set(k, parseFloat(e.target.value) || 0)
  const sel = (k) => (e) => set(k, parseFloat(e.target.value) || 0)

  const irPara = (n) => { setEtapa(n); if (n < 6) setContratoGerado(false); window.scrollTo({ top: 0, behavior: 'smooth' }) }

  const irParaAnalise = useCallback(() => {
    const diag = {
      ...d,
      fat: parseBRL(d.fat),
      aliquota: parseFloat(d.regime) / 100,
      margem: parseFloat(d.margem) / 100,
    }
    const resultado = calcularMetodologia(diag)
    setCalc(resultado)
    irPara(2)
  }, [d])

  const irParaEscopo = () => {
    if (!valorProposta || parseFloat(valorProposta) <= 0) {
      alert('Informe o valor da proposta antes de gerar o escopo.')
      return
    }
    irPara(5)
  }

  const avaliarProposta = (v) => {
    if (!v || !calc) return null
    const val = parseFloat(v)
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

  const hoje = new Date().toLocaleDateString('pt-BR')

  // ── RENDER ──────────────────────────────────────────────────
  return (
    <>
      <style>{CSS}</style>
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
                  <input className="prec-input" type="text" inputMode="numeric"
                    value={d.fat} onChange={e => set('fat', e.target.value)}
                    placeholder="Ex: 80.000" />
                  {parseBRL(d.fat) >= 10000 && (
                    <div style={{ fontSize:10, color:'#6366F1', marginTop:4 }}>
                      {fmtExtensoParcial(parseBRL(d.fat))}/mês
                    </div>
                  )}
                </Campo>
                <Campo label="Quantos CNPJs você vai gerenciar?" hint="Cada CNPJ = um conjunto completo de contas e obrigações.">
                  <input className="prec-input" type="number" value={d.cnpjs} onChange={num('cnpjs')} min="1" />
                </Campo>
                <Campo label="Funcionários (incluindo sócios com pró-labore)" hint="Só preencha se você for cuidar da folha de pagamento.">
                  <input className="prec-input" type="number" value={d.funcs} onChange={num('funcs')} min="0" />
                </Campo>
              </div>

              {/* BLOCO 2: O QUE VOCÊ VAI FAZER */}
              <div className="prec-sec">📋 O que você vai fazer por esse cliente</div>
              <div className="prec-fgrid3">
                <Campo label="Contas bancárias para conciliar" hint="Cada conta bancária precisa de conciliação mensal separada.">
                  <input className="prec-input" type="number" value={d.bancos} onChange={num('bancos')} min="0" />
                  {d.bancos > 0 && <div style={{ fontSize:10, color:'#6366F1', marginTop:4 }}>≈ {(d.bancos * 1.5 + (d.mov||0) * 0.003).toFixed(1)}h/mês de conciliação</div>}
                </Campo>
                <Campo label="Pagamentos (contas a pagar) / mês" hint="Quantos boletos, fornecedores ou despesas fixas são pagas por mês. Ex: 30 fornecedores + 10 fixas = 40.">
                  <input className="prec-input" type="number" value={d.capag} onChange={num('capag')} min="0" />
                  {d.capag > 0 && <div style={{ fontSize:10, color:'#6366F1', marginTop:4 }}>≈ {(0.5 + d.capag * 0.05).toFixed(1)}h/mês de gestão CP</div>}
                </Campo>
                <Campo label="Cobranças a receber / mês" hint="Número de clientes que pagam ao seu cliente mensalmente.">
                  <input className="prec-input" type="number" value={d.carec} onChange={num('carec')} min="0" />
                  {d.carec > 0 && <div style={{ fontSize:10, color:'#6366F1', marginTop:4 }}>≈ {(0.5 + d.carec * 0.04).toFixed(1)}h/mês de gestão CR</div>}
                </Campo>
                <Campo label="Movimentações no extrato / mês" hint="Se não souber, some contas a pagar + contas a receber e multiplique por 1,3.">
                  <input className="prec-input" type="number" value={d.mov} onChange={num('mov')} min="0" />
                  {d.mov > 0 && d.bancos > 0 && <div style={{ fontSize:10, color:'#6366F1', marginTop:4 }}>impacta conciliação: +{(d.mov * 0.003).toFixed(1)}h</div>}
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
                <Campo label="Usa maquininha / cartão de crédito?" hint="Se o cliente recebe por maquininha, você precisará conciliar as vendas com o banco.">
                  <select className="prec-select" value={d.cartao} onChange={sel('cartao')}>
                    <option value="0">Não</option>
                    <option value="1">Sim — precisa de conciliação</option>
                  </select>
                </Campo>
                <Campo label="Usa sistema de cobrança automática?" hint="Ex: Asaas, Iugu, Receba Fácil. Gera boletos automaticamente e precisa de conciliação.">
                  <select className="prec-select" value={d.sistcob} onChange={sel('sistcob')}>
                    <option value="0">Não usa</option>
                    <option value="1">Sim — Asaas, Iugu, Receba Fácil…</option>
                  </select>
                </Campo>
                <Campo label="Usa outras plataformas de venda?" hint="Ex: Mercado Livre, Shopee, PagSeguro, Mercado Pago. Cada plataforma precisa de conciliação separada.">
                  <select className="prec-select" value={d.plat} onChange={sel('plat')}>
                    <option value="0">Não</option>
                    <option value="1">Sim — 1 plataforma</option>
                    <option value="2">Sim — 2 ou mais</option>
                  </select>
                </Campo>
                <Campo label="Precisa de folha de pagamento?">
                  <select className="prec-select" value={d.folha} onChange={sel('folha')}>
                    <option value="0">Não</option>
                    <option value="1">Sim — eu processo a folha</option>
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
                  <input className="prec-input" type="number" value={d.custoHora}
                    onChange={e => { num('custoHora')(e); setCustoHoraFonte(null) }} step="5" />
                </Campo>
                <Campo label="Margem de lucro desejada" hint="BPOs saudáveis operam com 30–45% de margem. Abaixo de 20% o negócio fica frágil.">
                  <div className="prec-range-wrap">
                    <input type="range" min="10" max="60" value={d.margem} onChange={e => set('margem', e.target.value)} />
                    <span className="prec-range-val">{d.margem}%</span>
                  </div>
                </Campo>
                <Campo label="Overhead mensal (R$)" hint="Soma dos seus custos fixos mensais divididos pelo número de clientes. Ex: softwares (R$ 300) + internet (R$ 100) + escritório (R$ 400) = R$ 800 ÷ 10 clientes = R$ 80/cliente.">
                  <input className="prec-input" type="number" value={d.overhead} onChange={num('overhead')} step="50" />
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
                ['Contas a receber', `${calc.d.carec} recebíveis/mês`],
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
                  type="number"
                  className="prec-proposta-input"
                  value={valorProposta}
                  placeholder="0"
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

              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16, flexWrap: 'wrap' }}>
                {[
                  ['Mínimo', calc.vMinimo, '#FEF2F2', '#991B1B', '#FCA5A5'],
                  ['Recomendado', calc.vRecomendado, '#ECFDF5', '#166534', '#6EE7B7'],
                  ['Premium', calc.vPremium, '#FEF9C3', '#92400E', '#FCD34D'],
                ].map(([l, v, bg, color, border]) => (
                  <button key={l} className="prec-atalho" onClick={() => setValorProposta(Math.round(v))}
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
                {calc.items.map((it, i) => (
                  <div key={i} className="prec-scope-item">{it.nome} — {it.horas}h/mês</div>
                ))}
              </div>

              {/* Responsabilidades */}
              <div className="prec-scope-block">
                <div className="prec-scope-title"><span>🤝</span> Responsabilidades do cliente</div>
                {[
                  'Enviar documentos até o dia 5 de cada mês',
                  'Responder solicitações em até 48h úteis',
                  'Manter acessos bancários e sistemas atualizados',
                  'Confirmar informações para conciliação quando solicitado',
                  calc.d.agend && 'Manter saldo suficiente para agendamentos',
                  calc.d.nfs > 0 && 'Fornecer dados completos para emissão de NFs',
                ].filter(Boolean).map((r, i) => <div key={i} className="prec-scope-item">{r}</div>)}
              </div>

              {/* Limites */}
              <div className="prec-scope-block">
                <div className="prec-scope-title"><span>⚠️</span> Limites operacionais</div>
                {[
                  'Serviços limitados ao escopo descrito acima',
                  'Inclusão de novos CNPJs requer revisão de contrato',
                  calc.d.capag > 0 && `Volume de contas a pagar: até ${Math.ceil(calc.d.capag * 1.5)} títulos/mês`,
                  calc.d.nfs > 0 && `Volume de NFs: até ${Math.ceil(calc.d.nfs * 1.5)} notas/mês`,
                  calc.d.boletos > 0 && `Volume de boletos: até ${Math.ceil(calc.d.boletos * 1.5)}/mês`,
                  'Horas adicionais ao escopo serão orçadas separadamente',
                ].filter(Boolean).map((l, i) => <div key={i} className="prec-scope-item">{l}</div>)}
              </div>

              {/* SLA */}
              <div className="prec-scope-block">
                <div className="prec-scope-title"><span>📅</span> SLA e entregáveis</div>
                <div className="prec-scope-item">Relatórios entregues até o dia 10 de cada mês</div>
                <div className="prec-scope-item">Atendimento via WhatsApp em horário comercial (resposta em até 4h)</div>
                <div className="prec-scope-item">Urgências com resposta em até 24h úteis</div>
                {calc.d.reuniao > 0 && <div className="prec-scope-item">Reunião mensal agendada até o dia 20 de cada mês</div>}
              </div>
            </div>

            {/* PROPOSTA */}
            <div id="proposta-print" className="prec-card">
              <div className="prec-card-num">Proposta comercial</div>
              <div className="prec-card-title" style={{ fontSize: 16 }}>
                Proposta · {calc.d.nome || 'Cliente'} · {hoje}
              </div>
              <div style={{ height: 16 }} />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--ptext3)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4 }}>Cliente</div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{calc.d.nome || '—'}</div>
                  {calc.d.fat > 0 && <div style={{ fontSize: 11, color: 'var(--ptext2)' }}>Faturamento: {fmtExtensoParcial(calc.d.fat)}/mês</div>}
                </div>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--ptext3)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4 }}>Data</div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{hoje}</div>
                </div>
              </div>

              <div style={{ background: 'var(--pg-light)', border: '1px solid #A7C5B5', borderRadius: 10, padding: 20, textAlign: 'center', marginBottom: 20 }}>
                <div style={{ fontSize: 11, color: 'var(--pg)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>Investimento mensal</div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 40, fontWeight: 500, color: 'var(--pg)', letterSpacing: '-.02em' }}>{fmt(parseFloat(valorProposta))}</div>
                <div style={{ fontSize: 11, color: 'var(--pg-mid)', marginTop: 4 }}>{calc.totalHoras}h/mês dedicadas</div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ptext2)', marginBottom: 10 }}>O que está incluído:</div>
                {calc.items.map((it, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--pborder)', fontSize: 12 }}>
                    <span>{it.nome}</span>
                    <span style={{ color: 'var(--ptext3)', fontFamily: "'DM Mono',monospace" }}>{it.horas}h</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontSize: 13, fontWeight: 600 }}>
                  <span>Total de horas mensais dedicadas</span>
                  <span style={{ color: 'var(--pg)' }}>{calc.totalHoras}h</span>
                </div>
              </div>

              <div style={{ background: 'var(--psurface2)', borderRadius: 8, padding: 14, fontSize: 12, color: 'var(--ptext2)', lineHeight: 1.6 }}>
                <strong style={{ color: '#181714', display: 'block', marginBottom: 4 }}>Por que este valor?</strong>
                Esta proposta foi calculada considerando {calc.totalHoras} horas mensais de trabalho especializado,{' '}
                {calc.d.bancos} conta{calc.d.bancos > 1 ? 's' : ''} bancária{calc.d.bancos > 1 ? 's' : ''} para conciliação,{' '}
                {calc.d.capag + calc.d.carec} títulos entre contas a pagar e a receber, e complexidade operacional classificada como{' '}
                <strong>{calc.complexLabel}</strong>.{' '}
                {calc.d.fat > 0 && `O investimento representa ${((parseFloat(valorProposta) / calc.d.fat) * 100).toFixed(1)}% do faturamento mensal — dentro da faixa de mercado de 1% a 3%.`}
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
              <button className="prec-btn prec-btn-primary" onClick={() => irPara(6)}>Gerar contrato →</button>
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
          const val = parseFloat(valorProposta)
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

                  <div className="prec-sec">Condições contratuais</div>
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
                  <button className="prec-btn prec-btn-primary" onClick={() => setContratoGerado(true)}>Gerar contrato →</button>
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
                <p className="ctr-p">Razão Social: <strong>{calc.d.nome || '___________________________'}</strong></p>
                <p className="ctr-p">CNPJ: ___________________________ | E-mail: ___________________________</p>
                <p className="ctr-p">Endereço: ___________________________________________________________________</p>
                <p className="ctr-p">Representado(a) por: ___________________________________ CPF: _______________</p>
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
                <div className="ctr-li">Fornecer documentos e acessos até o dia 5 de cada mês</div>
                <div className="ctr-li">Responder às solicitações em até 48 horas úteis</div>
                <div className="ctr-li">Manter atualizados os acessos às plataformas utilizadas</div>
                {calc.d.agend > 0 && <div className="ctr-li">Manter saldo bancário suficiente para os agendamentos</div>}
                {calc.d.nfs > 0 && <div className="ctr-li">Fornecer dados completos para emissão de notas fiscais</div>}
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
                    <div style={{fontSize:11,color:'#6A6760'}}>{cargoRep} — CPF: {cpfRep}</div>
                    <div style={{fontSize:11,color:'#6A6760'}}>{nomeEmp} — CONTRATADA</div>
                  </div>
                  <div className="ctr-assin-bl">
                    <div style={{fontWeight:600,fontSize:12}}>{calc.d.nome || '___________________________'}</div>
                    <div style={{fontSize:11,color:'#6A6760'}}>Nome / CPF: _______________________ — CONTRATANTE</div>
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
                      const blob = await gerarContratoDocx({ calc, contratoForm, empresa, valorProposta })
                      downloadContratoDocx(blob, calc?.d?.nome)
                    } catch (e) {
                      alert('Erro ao gerar Word: ' + e.message)
                    } finally {
                      setBaixandoDocx(false)
                    }
                  }}
                >{baixandoDocx ? '⏳ Gerando...' : '⬇ Baixar Word'}</button>
                <button className="prec-btn prec-btn-primary" onClick={() => window.print()}>🖨 Imprimir / PDF</button>
              </div>
            </div>
          )
        })()}

      </div>
    </>
  )
}