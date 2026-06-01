import { useState, useCallback } from 'react'

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
.prec-btn-ghost:hover { border-color:#CECA BE; color:#181714; }
.prec-btn-primary { background:var(--pg); color:#fff; }
.prec-btn-primary:hover { background:#15402F; }
.prec-atalho { padding:8px 14px; border-radius:8px; font-size:12px; font-weight:500; cursor:pointer; font-family:'DM Sans',sans-serif; border:1.5px solid; transition:all .15s; }

@media (max-width:600px) {
  .prec-fgrid, .prec-fgrid3, .prec-trio, .prec-stats, .prec-academia { grid-template-columns:1fr !important; }
  .prec-pdot { width:28px; height:28px; font-size:9px; }
  .prec-plabel { display:none; }
}
`

// ─── UTILITÁRIOS ────────────────────────────────────────────
const fmt = v => (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 })
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

  if (d.agend) add('Agendamento bancário', 0.5 + d.capag * 0.04, calcPeso(0.5 + d.capag * 0.04, 5),
    `Execução de ${d.capag} pagamentos`)

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

  const SISTEMAS = { erp_avancado:{fator:0.70,label:'ERP avan�ado com API',desc:'Integra��o automatiza etapas'}, omie_totvs:{fator:0.80,label:'Omie / Totvs / Bling',desc:'Sistema organiza bem'}, intermediario:{fator:1.00,label:'Conta Azul / Nibo',desc:'Base padr�o'}, basico:{fator:1.20,label:'Sistema b�sico',desc:'Mais trabalho manual'}, excel:{fator:1.40,label:'Excel / planilha',desc:'Tudo manual � mais horas'}, nenhum:{fator:1.55,label:'Sem sistema',desc:'M�ximo esfor�o'} }; const sistemaInfo = SISTEMAS[d.sistema]||SISTEMAS.intermediario; const fatorSistema = sistemaInfo.fator; const fatorOrg = d.organizacao==='otima'?0.90:d.organizacao==='ruim'?1.15:d.organizacao==='caotica'?1.30:1.00; const fatorExc = d.excecoes==='muitos'?1.20:d.excecoes==='moderado'?1.10:1.00; let fatorFat = 1.0
  if (d.fat > 1000000) fatorFat = 1.40
  else if (d.fat > 500000) fatorFat = 1.25
  else if (d.fat > 200000) fatorFat = 1.15
  else if (d.fat > 80000) fatorFat = 1.08

  const totalBase = items.reduce((s, i) => s + i.horas, 0); const totalHoras = Math.round(totalBase * fatorFat * fatorSistema * fatorOrg * fatorExc * 10) / 10

  if (fatorFat > 1.0) {
    items.push({
      nome: 'Ajuste de porte (faturamento)',
      horas: Math.round((totalHoras - totalBase) * 10) / 10,
      peso: 'médio',
      motivo: `Fator ${fatorFat}× por faturamento de ${fmt(d.fat)}/mês`
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
    icon: '📈', titulo: 'A relação com o faturamento do cliente', desc: 'Benchmarks de mercado para BPO financeiro',
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

  // FORM STATE
  const [d, setD] = useState({
    nome: '', fat: '', cnpjs: 1, funcs: 0,
    bancos: 1, capag: 0, carec: 0, mov: 0, nfs: 0, boletos: 0,
    sistcob: 0, cartao: 0, plat: 0, agend: 0, folha: 0,
    contab: 0, relat: 0, reuniao: 0, consult: 0, lembrete: 0,
    custoHora: 50, margem: 35, overhead: 600, regime: 6, sistema: 'intermediario', organizacao: 'regular', excecoes: 'poucos',
  })

  const set = (k, v) => setD(prev => ({ ...prev, [k]: v }))
  const num = (k) => (e) => set(k, parseFloat(e.target.value) || 0)
  const sel = (k) => (e) => set(k, parseFloat(e.target.value) || 0)

  const irPara = (n) => { setEtapa(n); window.scrollTo({ top: 0, behavior: 'smooth' }) }

  const irParaAnalise = useCallback(() => {
    const diag = {
      ...d,
      fat: parseFloat(d.fat) || 0,
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
          {[['01','Diagnóstico'],['02','Análise'],['03','Recomendação'],['04','Decisão'],['05','Escopo']].map(([n, label], i) => (
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
              <div className="prec-card-desc">Quanto mais preciso o diagnóstico, mais precisa a recomendação. Estas informações alimentam o cálculo da complexidade operacional.</div>

              <div className="prec-sec">Identificação e porte</div>
              <div className="prec-fgrid">
                <Campo label="Nome do cliente / empresa">
                  <input className="prec-input" value={d.nome} onChange={e => set('nome', e.target.value)} placeholder="Ex: Comércio Silva Ltda" />
                </Campo>
                <Campo label="Faturamento mensal estimado (R$)" hint="Receita bruta média. Impacta o nível de exigência e complexidade.">
                  <input className="prec-input" type="number" value={d.fat} onChange={num('fat')} placeholder="Ex: 80000" />
                </Campo>
                <Campo label="Número de CNPJs / empresas" hint="Cada CNPJ adicional representa um conjunto completo de obrigações.">
                  <input className="prec-input" type="number" value={d.cnpjs} onChange={num('cnpjs')} min="1" />
                </Campo>
                <Campo label="Número de funcionários" hint="Inclui sócios que recebem pró-labore.">
                  <input className="prec-input" type="number" value={d.funcs} onChange={num('funcs')} min="0" />
                </Campo>
              </div>

              <div className="prec-sec">Movimentação financeira</div>
              <div className="prec-fgrid3">
                <Campo label="Contas bancárias" hint="Cada conta = conciliação mensal">
                  <input className="prec-input" type="number" value={d.bancos} onChange={num('bancos')} min="0" />
                </Campo>
                <Campo label="Contas a pagar / mês" hint="Média de títulos pagos">
                  <input className="prec-input" type="number" value={d.capag} onChange={num('capag')} min="0" />
                </Campo>
                <Campo label="Contas a receber / mês" hint="Clientes que geram cobrança">
                  <input className="prec-input" type="number" value={d.carec} onChange={num('carec')} min="0" />
                </Campo>
                <Campo label="Movimentações bancárias / mês" hint="Entradas + saídas no extrato">
                  <input className="prec-input" type="number" value={d.mov} onChange={num('mov')} min="0" />
                </Campo>
                <Campo label="NFs emitidas / mês" hint="Notas de serviço ou produto">
                  <input className="prec-input" type="number" value={d.nfs} onChange={num('nfs')} min="0" />
                </Campo>
                <Campo label="Boletos emitidos / mês">
                  <input className="prec-input" type="number" value={d.boletos} onChange={num('boletos')} min="0" />
                </Campo>
              </div>

              <div className="prec-sec">Serviços e necessidades</div>
              <div className="prec-fgrid">
                <Campo label="Usa sistema de cobrança?">
                  <select className="prec-select" value={d.sistcob} onChange={sel('sistcob')}>
                    <option value="0">Não usa</option>
                    <option value="1">Sim — Asaas, Iugu, Receba Fácil…</option>
                  </select>
                </Campo>
                <Campo label="Usa maquininha / cartão?">
                  <select className="prec-select" value={d.cartao} onChange={sel('cartao')}>
                    <option value="0">Não</option>
                    <option value="1">Sim — precisa conciliação</option>
                  </select>
                </Campo>
                <Campo label="Outras plataformas (PagSeguro, MP…)">
                  <select className="prec-select" value={d.plat} onChange={sel('plat')}>
                    <option value="0">Não</option>
                    <option value="1">Sim — 1 plataforma</option>
                    <option value="2">Sim — 2 ou mais</option>
                  </select>
                </Campo>
                <Campo label="Precisa de agendamento bancário?">
                  <select className="prec-select" value={d.agend} onChange={sel('agend')}>
                    <option value="0">Não</option>
                    <option value="1">Sim — executo os pagamentos</option>
                  </select>
                </Campo>
                <Campo label="Precisa de folha de pagamento / DP?">
                  <select className="prec-select" value={d.folha} onChange={sel('folha')}>
                    <option value="0">Não</option>
                    <option value="1">Sim</option>
                  </select>
                </Campo>
                <Campo label="Envia documentos para contabilidade?">
                  <select className="prec-select" value={d.contab} onChange={sel('contab')}>
                    <option value="0">Não</option>
                    <option value="1">Sim — organizo e envio</option>
                  </select>
                </Campo>
                <Campo label="Relatórios gerenciais mensais?">
                  <select className="prec-select" value={d.relat} onChange={sel('relat')}>
                    <option value="0">Não</option>
                    <option value="1">Básico (DRE e fluxo de caixa)</option>
                    <option value="2">Completo (+ indicadores, análises)</option>
                  </select>
                </Campo>
                <Campo label="Reunião estratégica mensal?">
                  <select className="prec-select" value={d.reuniao} onChange={sel('reuniao')}>
                    <option value="0">Não</option>
                    <option value="1">Sim — 1h online</option>
                    <option value="1.5">Sim — 1h presencial</option>
                  </select>
                </Campo>
                <Campo label="Consultoria e planejamento?">
                  <select className="prec-select" value={d.consult} onChange={sel('consult')}>
                    <option value="0">Não</option>
                    <option value="1">Sim — análises estratégicas</option>
                    <option value="2">Sim — planejamento completo</option>
                  </select>
                </Campo>
                <Campo label="Lembrete de vencimento (WhatsApp)?">
                  <select className="prec-select" value={d.lembrete} onChange={sel('lembrete')}>
                    <option value="0">Não</option>
                    <option value="1">Sim</option>
                  </select>
                </Campo>
              </div>

              <div className="prec-sec">Seus parâmetros (base de custo)</div>
              <div className="prec-alert prec-alert-info">
                <span>💡</span>
                <span>Esses valores são seus dados operacionais. Configure uma vez — o sistema usa em todos os cálculos.</span>
              </div>
              <div className="prec-fgrid">
                <Campo label="Seu custo-hora (R$)" hint="Salário mínimo 2024 = R$ 1.412 → ~R$ 9/h. BPO sênior: R$ 40–80/h.">
                  <input className="prec-input" type="number" value={d.custoHora} onChange={num('custoHora')} step="5" />
                </Campo>
                <Campo label="Margem de lucro desejada" hint="BPOs sustentáveis: 30–45% de margem sobre custo.">
                  <div className="prec-range-wrap">
                    <input type="range" min="10" max="60" value={d.margem} onChange={e => set('margem', e.target.value)} />
                    <span className="prec-range-val">{d.margem}%</span>
                  </div>
                </Campo>
                <Campo label="Overhead mensal do BPO (R$)" hint="Rateio de ferramentas, internet, softwares.">
                  <input className="prec-input" type="number" value={d.overhead} onChange={num('overhead')} step="50" />
                </Campo>
                <Campo label="Regime tributário">
                  <select className="prec-select" value={d.regime} onChange={sel('regime')}>
                    <option value="6">Simples Nacional (6%)</option>
                    <option value="8.8">Simples Nacional (8,8%)</option>
                    <option value="13.5">Lucro Presumido (~13,5%)</option>
                    <option value="0">MEI (isento)</option>
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

            <div className="prec-reasoning">
              <div className="prec-reasoning-title">Como a Metodologia Fluxe chegou a esses números</div>
              {[
                ['Cliente', calc.d.nome],
                ['Faturamento mensal', calc.d.fat > 0 ? fmt(calc.d.fat) : 'Não informado'],
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
              <div className="prec-card-desc">Conceitos que todo profissional de BPO financeiro precisa dominar para precificar com confiança.</div>
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
            <div className="prec-card">
              <div className="prec-card-num">Proposta comercial</div>
              <div className="prec-card-title" style={{ fontSize: 16 }}>
                Proposta · {calc.d.nome || 'Cliente'} · {hoje}
              </div>
              <div style={{ height: 16 }} />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--ptext3)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4 }}>Cliente</div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{calc.d.nome || '—'}</div>
                  {calc.d.fat > 0 && <div style={{ fontSize: 11, color: 'var(--ptext2)' }}>Faturamento: {fmt(calc.d.fat)}/mês</div>}
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
              <button className="prec-btn prec-btn-ghost" onClick={() => { irPara(1); setCalc(null); setValorProposta('') }}>Novo cliente</button>
              <button className="prec-btn prec-btn-primary" onClick={() => window.print()}>🖨 Imprimir / PDF</button>
            </div>
          </div>
        )}

      </div>
    </>
  )
}



