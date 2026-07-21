// ── excelMappings.js ────────────────────────────────────────────────
// Constantes e funções de mapeamento puro (sem dependência de xlsx/xlsx-js-style).
// Mantidas separadas de excel.js de propósito: essas duas libs de planilha
// pesam ~800KB juntas e não devem ser carregadas só pra exibir colunas
// de prévia ou mapear uma linha. As páginas devem importar DAQUI para
// tudo que não precisa gerar/ler um arquivo .xlsx de verdade — o resto
// (exportToXlsx, importFromXlsx, downloadClienteTemplate, downloadTarefaTemplate)
// continua em excel.js e deve ser carregado via import() dinâmico.

// ── TEMPLATE DE IMPORTAÇÃO — CLIENTES ────────────────────────────────
// "Telefone"/"WhatsApp" mapeiam pra whatsapp — não existe coluna "telefone"
// nem "software_contabil" na tabela clientes (só em empresas). Essas duas
// colunas quebravam a importação/exportação com "column not found".
export const CLIENTES_IMPORT_COLS = [
  { label: 'Razão Social *',   key: 'razao_social',      required: true },
  { label: 'Fantasia',          key: 'fantasia',           required: false },
  { label: 'CNPJ',              key: 'cnpj',               required: false },
  { label: 'Email',             key: 'email',              required: false },
  { label: 'WhatsApp',          key: 'whatsapp',           required: false },
  { label: 'Status',            key: 'status',             required: false, default: 'ativo' },
  { label: 'Etapa',             key: 'etapa',              required: false, default: 'operacional' },
  { label: 'MRR (R$)',          key: 'valor_mrr',          required: false, type: 'number' },
  { label: 'Segmento',          key: 'segmento',           required: false },
  { label: 'Responsável',       key: 'responsavel_nome',   required: false },
]

export const CLIENTES_EXPORT_COLS = [
  { label: 'Razão Social',      get: r => r.razao_social },
  { label: 'Fantasia',          get: r => r.fantasia },
  { label: 'CNPJ',              get: r => r.cnpj },
  { label: 'Email',             get: r => r.email },
  { label: 'WhatsApp',          get: r => r.whatsapp },
  { label: 'Status',            get: r => r.status },
  { label: 'Etapa',             get: r => r.etapa },
  { label: 'MRR (R$)',          get: r => r.valor_mrr || 0 },
  { label: 'Segmento',          get: r => r.segmento },
  { label: 'Responsável',       get: r => r.usuarios?.nome || '' },
]

// ── TEMPLATE DE IMPORTAÇÃO — TAREFAS ─────────────────────────────────
export const TAREFAS_IMPORT_COLS = [
  { label: 'Título *',      key: 'titulo',       required: true },
  { label: 'Categoria',     key: 'categoria',    required: false },
  { label: 'Status',        key: 'status',       required: false, default: 'aberta' },
  { label: 'Prioridade',    key: 'prioridade',   required: false, default: 'media' },
  { label: 'Prazo',         key: 'prazo',        required: false },
  { label: 'Recorrência',   key: 'recorrencia',  required: false },
  { label: 'Observações',   key: 'obs',          required: false },
]

export const TAREFAS_EXPORT_COLS = [
  { label: 'Título',        get: r => r.titulo },
  { label: 'Categoria',     get: r => r.categoria },
  { label: 'Status',        get: r => r.status },
  { label: 'Prioridade',    get: r => r.prioridade },
  { label: 'Prazo',         get: r => r.prazo ? r.prazo.split('-').reverse().join('/') : '' },
  { label: 'Cliente',       get: r => r.clientes?.razao_social || r.clientes?.fantasia || '' },
  { label: 'Responsável',   get: r => r['usuarios!tarefas_responsavel_id_fkey']?.nome || '' },
  { label: 'Observações',   get: r => r.obs },
]

// ── DETECTAR LINHA DE CABEÇALHO ──────────────────────────────────────
// As planilhas modelo (clientes, tarefas, leads) têm 1-2 linhas de título/
// instrução antes da linha real de cabeçalhos (célula mesclada = só a
// primeira coluna preenchida). Sem isso, sheet_to_json usa a linha de
// título como cabeçalho e nenhuma linha real é lida — toda importação
// falha em silêncio. Acha a primeira linha com 2+ células preenchidas.
export function findHeaderRowIndex(rows2D, maxScan = 6) {
  for (let i = 0; i < Math.min(maxScan, rows2D.length); i++) {
    const filled = (rows2D[i] || []).filter(c => String(c ?? '').trim() !== '').length
    if (filled >= 2) return i
  }
  return 0
}

// ── MAPEAR LINHA IMPORTADA → OBJETO DO SISTEMA ────────────────────────
export function mapRowToCliente(row) {
  const mrr = parseFloat(String(row['MRR (R$)'] || '0').replace(/[^\d.,]/g, '').replace(',', '.')) || 0
  return {
    razao_social:     String(row['Razão Social *'] || row['Razao Social'] || '').trim(),
    fantasia:         String(row['Fantasia'] || '').trim(),
    cnpj:             String(row['CNPJ'] || '').replace(/\D/g, ''),
    email:            String(row['Email'] || '').trim(),
    whatsapp:         String(row['WhatsApp'] || row['Telefone'] || '').trim(),
    status:           String(row['Status'] || 'ativo').toLowerCase(),
    etapa:            String(row['Etapa'] || 'operacional').toLowerCase(),
    valor_mrr:        mrr,
    segmento:         String(row['Segmento'] || '').trim(),
  }
}

export function mapRowToTarefa(row) {
  const titulo = String(row['Título *'] || row['Titulo'] || '').trim()
  if (!titulo || titulo.startsWith('#')) return null

  let prazo = null
  const rawPrazo = row['Prazo']
  if (rawPrazo instanceof Date) {
    prazo = rawPrazo.toISOString().slice(0, 10)
  } else if (rawPrazo) {
    const s = String(rawPrazo).trim()
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) {
      const [d, m, y] = s.split('/')
      prazo = `${y}-${m}-${d}`
    } else {
      prazo = s.slice(0, 10)
    }
  }

  const statusValidos    = ['aberta','andamento','aguardando','concluida']
  const prioridadeValida = ['baixa','media','alta']
  const status    = String(row['Status']    || 'aberta').toLowerCase()
  const prioridade = String(row['Prioridade'] || 'media').toLowerCase()

  const rec = String(row['Recorrência'] || row['Recorrencia'] || '').trim().toLowerCase()
  const recValidos = ['diária','diaria','semanal','quinzenal','mensal']
  const obsBase = String(row['Observações'] || row['Observacoes'] || '').trim()
  const obs = (recValidos.includes(rec) ? `[Recorrência: ${rec}]${obsBase ? ' ' + obsBase : ''}` : obsBase) || null

  return {
    titulo,
    categoria:  String(row['Categoria'] || '').trim() || null,
    status:     statusValidos.includes(status) ? status : 'aberta',
    prioridade: prioridadeValida.includes(prioridade) ? prioridade : 'media',
    prazo,
    obs,
  }
}
