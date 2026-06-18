// xlsx-js-style é um drop-in replacement do xlsx com suporte a estilos de célula
// Importa como default export (diferente do xlsx que usa namespace import)
import XLSXStyle from 'xlsx-js-style'
import * as XLSX from 'xlsx'

// XLSXStyle para arquivos estilizados (templates), XLSX para export/import genérico

// ── EXPORTAR ─────────────────────────────────────────────────────────
// columns: [{ label: 'Nome da Coluna', get: (row) => row.campo }]
export function exportToXlsx(rows, columns, filename = 'exportacao.xlsx') {
  const X = XLSXStyle.utils.encode_cell
  const ws = {}
  const numCols = columns.length
  const numRows = rows.length

  // Linha 0: título mesclado
  const { cell: tCell, merge: tMerge } = titleCell('Fluxe BPO — Exportação', numCols)
  ws[X({ r: 0, c: 0 })] = tCell

  // Linha 1: cabeçalhos
  columns.forEach((col, ci) => {
    ws[X({ r: 1, c: ci })] = headerCell(col.label)
  })

  // Linhas de dados (a partir da linha 2)
  rows.forEach((row, ri) => {
    columns.forEach((col, ci) => {
      const value = col.get(row) ?? ''
      const type = typeof value === 'number' ? 'n' : 's'
      const isAlt = ri % 2 === 0
      ws[X({ r: 2 + ri, c: ci })] = styledCell(
        value === null || value === undefined ? '' : value,
        type,
        {
          fill: { fgColor: { rgb: isAlt ? C.BRAND_LIGHT : C.WHITE } },
          font: { color: { rgb: C.GRAY_TEXT }, sz: 10 },
          alignment: { vertical: 'center' },
          border: {
            bottom: { style: 'hair', color: { rgb: 'E2E8F0' } },
            right:  { style: 'hair', color: { rgb: 'E2E8F0' } },
          },
        }
      )
    })
  })

  // Auto-largura baseada no conteúdo real
  const colWidths = columns.map((col, ci) => {
    const maxLen = rows.reduce((max, row) => {
      const val = col.get(row) ?? ''
      return Math.max(max, String(val).length)
    }, col.label.length)
    return { wch: Math.min(Math.max(maxLen + 2, 10), 50) }
  })

  ws['!ref'] = XLSXStyle.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: 1 + numRows, c: numCols - 1 } })
  ws['!merges'] = [tMerge]
  ws['!cols'] = colWidths
  ws['!rows'] = [{ hpt: 28 }, { hpt: 32 }]

  const sheetName = filename.replace('.xlsx', '').replace('clientes', '📋 Clientes').replace('tarefas', '📋 Tarefas')
  const wb = XLSXStyle.utils.book_new()
  XLSXStyle.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31))
  XLSXStyle.writeFile(wb, filename)
}

// ── IMPORTAR ─────────────────────────────────────────────────────────
// Retorna array de objetos com chaves = cabeçalhos da planilha
export function importFromXlsx(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: 'array', cellDates: true })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json(ws, { defval: '' })
        resolve(rows)
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'))
    reader.readAsArrayBuffer(file)
  })
}

// ── TEMPLATE DE IMPORTAÇÃO — CLIENTES ────────────────────────────────
export const CLIENTES_IMPORT_COLS = [
  { label: 'Razão Social *',   key: 'razao_social',      required: true },
  { label: 'Fantasia',          key: 'fantasia',           required: false },
  { label: 'CNPJ',              key: 'cnpj',               required: false },
  { label: 'Email',             key: 'email',              required: false },
  { label: 'Telefone',          key: 'telefone',           required: false },
  { label: 'Status',            key: 'status',             required: false, default: 'ativo' },  // ativo | inativo
  { label: 'Etapa',             key: 'etapa',              required: false, default: 'operacional' }, // operacional | onboarding | etc
  { label: 'MRR (R$)',          key: 'valor_mrr',          required: false, type: 'number' },
  { label: 'Segmento',          key: 'segmento',           required: false },
  { label: 'Software Contábil', key: 'software_contabil',  required: false },
  { label: 'Responsável',       key: 'responsavel_nome',   required: false }, // apenas info
]

export const CLIENTES_EXPORT_COLS = [
  { label: 'Razão Social',      get: r => r.razao_social },
  { label: 'Fantasia',          get: r => r.fantasia },
  { label: 'CNPJ',              get: r => r.cnpj },
  { label: 'Email',             get: r => r.email },
  { label: 'Telefone',          get: r => r.telefone },
  { label: 'Status',            get: r => r.status },
  { label: 'Etapa',             get: r => r.etapa },
  { label: 'MRR (R$)',          get: r => r.valor_mrr || 0 },
  { label: 'Segmento',          get: r => r.segmento },
  { label: 'Software Contábil', get: r => r.software_contabil },
  { label: 'Responsável',       get: r => r.usuarios?.nome || '' },
]

// ── Paleta Fluxe BPO ─────────────────────────────────────────────────
const C = {
  BRAND_DARK:  '3730A3', // indigo-800 — linha de título
  BRAND:       '4F46E5', // indigo-600 — cabeçalho das colunas
  BRAND_LIGHT: 'EEF2FF', // indigo-50  — fundo alternado
  WHITE:       'FFFFFF',
  GRAY_TEXT:   '475569', // slate-600
  RED:         'DC2626', // obrigatório
  YELLOW_BG:   'FFFBEB', // aviso
  YELLOW_BD:   'FCD34D',
  YELLOW_TX:   '92400E',
}

function styledCell(value, type = 's', style = {}) {
  return { v: value, t: type, s: style }
}

function headerCell(label) {
  return styledCell(label, 's', {
    fill: { fgColor: { rgb: C.BRAND } },
    font: { bold: true, color: { rgb: C.WHITE }, sz: 10 },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: {
      top:    { style: 'thin', color: { rgb: '6366F1' } },
      bottom: { style: 'thin', color: { rgb: '6366F1' } },
      left:   { style: 'thin', color: { rgb: '6366F1' } },
      right:  { style: 'thin', color: { rgb: '6366F1' } },
    },
  })
}

function titleCell(label, cols) {
  // Célula de título mesclada — retorna a célula e a config de merge
  const cell = styledCell(label, 's', {
    fill: { fgColor: { rgb: C.BRAND_DARK } },
    font: { bold: true, color: { rgb: C.WHITE }, sz: 13, name: 'Calibri' },
    alignment: { horizontal: 'center', vertical: 'center' },
  })
  const merge = { s: { r: 0, c: 0 }, e: { r: 0, c: cols - 1 } }
  return { cell, merge }
}

function dataCell(value, type = 's', rowIndex = 0, required = false) {
  const isAlt = rowIndex % 2 === 0
  return styledCell(value, type, {
    fill: { fgColor: { rgb: isAlt ? C.BRAND_LIGHT : C.WHITE } },
    font: { color: { rgb: required ? C.RED : C.GRAY_TEXT }, sz: 10, bold: required },
    alignment: { vertical: 'center' },
    border: {
      bottom: { style: 'hair', color: { rgb: 'E2E8F0' } },
      right:  { style: 'hair', color: { rgb: 'E2E8F0' } },
    },
  })
}

function buildSheet(headers, rows, colWidths) {
  // headers: [{ label, required }]
  // rows: [[valor, tipo, obrigatorio], ...]
  const X = XLSXStyle.utils.encode_cell
  const ws = {}
  const numCols = headers.length

  // Linha 0: título mesclado
  const { cell: tCell, merge: tMerge } = titleCell('Fluxe BPO', numCols)
  ws[X({ r: 0, c: 0 })] = tCell

  // Linha 1: cabeçalhos
  headers.forEach((h, ci) => {
    ws[X({ r: 1, c: ci })] = headerCell(h.label)
  })

  // Linhas de dados (a partir da linha 2)
  rows.forEach((row, ri) => {
    row.forEach((cell, ci) => {
      const [value, type, req] = Array.isArray(cell) ? cell : [cell, 's', false]
      ws[X({ r: 2 + ri, c: ci })] = dataCell(value, type ?? 's', ri, req)
    })
  })

  // Range e merges
  ws['!ref'] = XLSXStyle.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: 1 + rows.length, c: numCols - 1 } })
  ws['!merges'] = [tMerge]
  ws['!cols'] = colWidths
  ws['!rows'] = [{ hpt: 28 }, { hpt: 36 }] // título 28pt, cabeçalho 36pt

  return ws
}

export function downloadClienteTemplate() {
  const headers = [
    { label: 'Razão Social *',   required: true },
    { label: 'Fantasia',          required: false },
    { label: 'CNPJ',              required: false },
    { label: 'Email',             required: false },
    { label: 'Telefone',          required: false },
    { label: 'Status',            required: false },
    { label: 'Etapa',             required: false },
    { label: 'MRR (R$)',          required: false },
    { label: 'Segmento',          required: false },
    { label: 'Software Contábil', required: false },
  ]

  const rows = [
    [
      ['Exemplo Ltda', 's', true],
      ['Exemplo', 's', false],
      ['00.000.000/0001-00', 's', false],
      ['financeiro@exemplo.com.br', 's', false],
      ['(11) 99999-9999', 's', false],
      ['ativo', 's', false],
      ['operacional', 's', false],
      [1500, 'n', false],
      ['Comércio', 's', false],
      ['Omie', 's', false],
    ],
    [
      ['Tech Solutions Ltda', 's', true],
      ['TechSol', 's', false],
      ['11.222.333/0001-44', 's', false],
      ['contato@techsol.com.br', 's', false],
      ['(11) 3333-4444', 's', false],
      ['ativo', 's', false],
      ['onboarding', 's', false],
      [2800, 'n', false],
      ['Tecnologia', 's', false],
      ['Conta Azul', 's', false],
    ],
  ]

  const colWidths = [
    { wch: 28 }, // Razão Social
    { wch: 18 }, // Fantasia
    { wch: 20 }, // CNPJ
    { wch: 28 }, // Email
    { wch: 16 }, // Telefone
    { wch: 12 }, // Status
    { wch: 14 }, // Etapa
    { wch: 12 }, // MRR
    { wch: 16 }, // Segmento
    { wch: 18 }, // Software
  ]

  const ws = buildSheet(headers, rows, colWidths)

  const wb = XLSXStyle.utils.book_new()
  XLSXStyle.utils.book_append_sheet(wb, ws, '📋 Clientes')
  XLSXStyle.writeFile(wb, 'modelo_importacao_clientes.xlsx')
}

// ── TEMPLATE DE IMPORTAÇÃO — TAREFAS ─────────────────────────────────
export const TAREFAS_IMPORT_COLS = [
  { label: 'Título *',      key: 'titulo',       required: true },
  { label: 'Categoria',     key: 'categoria',    required: false },
  { label: 'Status',        key: 'status',       required: false, default: 'aberta' },
  { label: 'Prioridade',    key: 'prioridade',   required: false, default: 'media' },
  { label: 'Prazo',         key: 'prazo',        required: false }, // DD/MM/AAAA
  { label: 'Recorrência',   key: 'recorrencia',  required: false }, // única | diária | semanal | quinzenal | mensal
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

export function downloadTarefaTemplate() {
  const wb = XLSXStyle.utils.book_new()

  // ── Aba 1: Tarefas ──────────────────────────────────────────────────
  const tarefaHeaders = [
    { label: 'Título *',    required: true },
    { label: 'Categoria',   required: false },
    { label: 'Status',      required: false },
    { label: 'Prioridade',  required: false },
    { label: 'Prazo',       required: false },
    { label: 'Recorrência', required: false },
    { label: 'Observações', required: false },
  ]

  // buildSheet coloca título na row 0, cabeçalho na row 1, dados a partir da row 2
  // Para as datas, precisamos injetar as células manualmente após buildSheet
  const tarefaRows = [
    [
      ['# ATENÇÃO: Preencha a partir desta linha. Linhas com # são ignoradas na importação.', 's', false],
      ['', 's', false], ['', 's', false], ['', 's', false],
      ['', 's', false], ['', 's', false], ['', 's', false],
    ],
    [
      ['Conciliação bancária — Junho/2026', 's', true],
      ['Conciliação Bancária', 's', false],
      ['aberta', 's', false],
      ['alta', 's', false],
      [new Date(2026, 5, 30), 'd', false],
      ['mensal', 's', false],
      ['Conta corrente BB + conta PJ Itaú', 's', false],
    ],
    [
      ['Emissão de NF — Cliente Alfa', 's', true],
      ['Emissão de NF', 's', false],
      ['aberta', 's', false],
      ['media', 's', false],
      [new Date(2026, 6, 5), 'd', false],
      ['mensal', 's', false],
      ['NF referente ao contrato mensal', 's', false],
    ],
    [
      ['Pagamento DAS MEI — Julho', 's', true],
      ['Pagamentos', 's', false],
      ['andamento', 's', false],
      ['alta', 's', false],
      [new Date(2026, 6, 20), 'd', false],
      ['mensal', 's', false],
      ['Guia gerada pelo cliente, só pagar', 's', false],
    ],
    [
      ['Relatório mensal de resultado — Cliente Beta', 's', true],
      ['DRE Gerencial / Relatórios', 's', false],
      ['aberta', 's', false],
      ['media', 's', false],
      [new Date(2026, 6, 10), 'd', false],
      ['mensal', 's', false],
      ['Enviar até o dia 10 por e-mail', 's', false],
    ],
  ]

  const tarefaColWidths = [
    { wch: 46 }, // Título
    { wch: 28 }, // Categoria
    { wch: 12 }, // Status
    { wch: 12 }, // Prioridade
    { wch: 14 }, // Prazo
    { wch: 14 }, // Recorrência
    { wch: 38 }, // Observações
  ]

  const wsTarefas = buildSheet(tarefaHeaders, tarefaRows, tarefaColWidths)

  // Formatar células de data como DD/MM/AAAA (rows 3-6, coluna E = índice 4)
  // buildSheet: título=row0, cabeç=row1, dica=row2, dados=rows3-6
  ;['E4','E5','E6','E7'].forEach(addr => {
    if (wsTarefas[addr]) wsTarefas[addr].z = 'DD/MM/YYYY'
  })

  XLSXStyle.utils.book_append_sheet(wb, wsTarefas, '📋 Tarefas')

  // ── Aba 2: Instruções (estilizada) ──────────────────────────────────
  const X = XLSXStyle.utils.encode_cell
  const wsInst = {}

  const instTitleStyle = {
    fill: { fgColor: { rgb: C.BRAND_DARK } },
    font: { bold: true, color: { rgb: C.WHITE }, sz: 12 },
    alignment: { horizontal: 'center', vertical: 'center' },
  }
  const instHeaderStyle = {
    fill: { fgColor: { rgb: C.BRAND } },
    font: { bold: true, color: { rgb: C.WHITE }, sz: 10 },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: { bottom: { style: 'thin', color: { rgb: '6366F1' } } },
  }
  const instSectionStyle = {
    fill: { fgColor: { rgb: 'EEF2FF' } },
    font: { bold: true, color: { rgb: '3730A3' }, sz: 10 },
    alignment: { vertical: 'center' },
  }
  const instDataStyle = {
    fill: { fgColor: { rgb: C.WHITE } },
    font: { color: { rgb: C.GRAY_TEXT }, sz: 10 },
    alignment: { vertical: 'center', wrapText: true },
  }
  const instReqStyle = {
    fill: { fgColor: { rgb: 'FEF2F2' } },
    font: { bold: true, color: { rgb: C.RED }, sz: 10 },
    alignment: { horizontal: 'center', vertical: 'center' },
  }
  const instWarnStyle = {
    fill: { fgColor: { rgb: C.YELLOW_BG } },
    font: { bold: true, color: { rgb: C.YELLOW_TX }, sz: 10 },
    alignment: { vertical: 'center', wrapText: true },
  }

  // Linha 0: título
  wsInst[X({ r: 0, c: 0 })] = styledCell('Fluxe BPO — Instruções de Importação de Tarefas', 's', instTitleStyle)

  // Linha 1: cabeçalhos
  ;['Campo', 'Obrigatório', 'Valores / Formato aceitos', 'Exemplo'].forEach((h, ci) => {
    wsInst[X({ r: 1, c: ci })] = styledCell(h, 's', instHeaderStyle)
  })

  const instRows = [
    // [campo, obrig, valores, exemplo, style]
    ['Título *', 'SIM', 'Texto livre. Descreva a tarefa com clareza.', 'Conciliação bancária — Junho/2026', 'req'],
    ['Categoria', 'Não', 'Contas a Pagar | Contas a Receber | Conciliação Bancária | Emissão de NF | Emissão de Boletos | Cobrança / Inadimplência | Pagamentos | Fluxo de Caixa | DRE Gerencial / Relatórios | Implantação | Onboarding | Estratégico | Relacionamento', 'Conciliação Bancária', 'data'],
    ['Status', 'Não', 'aberta | andamento | aguardando | concluida  (padrão: aberta)', 'aberta', 'data'],
    ['Prioridade', 'Não', 'baixa | media | alta  (padrão: media)', 'alta', 'data'],
    ['Prazo', 'Não', 'Data no formato DD/MM/AAAA', '31/07/2026', 'data'],
    ['Recorrência', 'Não', 'única | diária | semanal | quinzenal | mensal  (padrão: única)\nInformativa na importação. Para tarefas automáticas use Modelos no sistema.', 'mensal', 'data'],
    ['Observações', 'Não', 'Texto livre. Anotações sobre a tarefa.', 'Enviar ao cliente até as 18h', 'data'],
    ['⚠️ Atenção', '', 'Cliente e Responsável não são importados pela planilha. Atribua-os manualmente no sistema após a importação.', '', 'warn'],
  ]

  instRows.forEach(([campo, obrig, valores, exemplo, tipo], ri) => {
    const rowStyle = tipo === 'req' ? instReqStyle : tipo === 'warn' ? instWarnStyle : (ri % 2 === 0 ? { ...instDataStyle, fill: { fgColor: { rgb: 'F8FAFF' } } } : instDataStyle)
    wsInst[X({ r: 2 + ri, c: 0 })] = styledCell(campo, 's', rowStyle)
    wsInst[X({ r: 2 + ri, c: 1 })] = styledCell(obrig, 's', tipo === 'req' ? instReqStyle : instDataStyle)
    wsInst[X({ r: 2 + ri, c: 2 })] = styledCell(valores, 's', { ...instDataStyle, alignment: { wrapText: true, vertical: 'center' } })
    wsInst[X({ r: 2 + ri, c: 3 })] = styledCell(exemplo, 's', instDataStyle)
  })

  wsInst['!ref'] = XLSXStyle.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: 2 + instRows.length, c: 3 } })
  wsInst['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }]
  wsInst['!cols'] = [{ wch: 14 }, { wch: 12 }, { wch: 68 }, { wch: 36 }]
  wsInst['!rows'] = [{ hpt: 28 }, { hpt: 32 }, ...instRows.map(() => ({ hpt: 40 }))]

  XLSXStyle.utils.book_append_sheet(wb, wsInst, 'ℹ️ Instruções')

  XLSXStyle.writeFile(wb, 'modelo_importacao_tarefas.xlsx')
}

// ── MAPEAR LINHA IMPORTADA → OBJETO DO SISTEMA ────────────────────────
export function mapRowToCliente(row) {
  const mrr = parseFloat(String(row['MRR (R$)'] || '0').replace(/[^\d.,]/g, '').replace(',', '.')) || 0
  return {
    razao_social:     String(row['Razão Social *'] || row['Razao Social'] || '').trim(),
    fantasia:         String(row['Fantasia'] || '').trim(),
    cnpj:             String(row['CNPJ'] || '').replace(/\D/g, ''),
    email:            String(row['Email'] || '').trim(),
    telefone:         String(row['Telefone'] || '').trim(),
    status:           String(row['Status'] || 'ativo').toLowerCase(),
    etapa:            String(row['Etapa'] || 'operacional').toLowerCase(),
    valor_mrr:        mrr,
    segmento:         String(row['Segmento'] || '').trim(),
    software_contabil:String(row['Software Contábil'] || row['Software Contabil'] || '').trim(),
  }
}

export function mapRowToTarefa(row) {
  const titulo = String(row['Título *'] || row['Titulo'] || '').trim()

  // Ignora linhas de comentário (começam com #) e linhas sem título
  if (!titulo || titulo.startsWith('#')) return null

  // Normaliza data: Date object (cellDates:true), DD/MM/AAAA, AAAA-MM-DD ou serial
  let prazo = null
  const rawPrazo = row['Prazo']
  if (rawPrazo instanceof Date) {
    prazo = rawPrazo.toISOString().slice(0, 10)
  } else if (rawPrazo) {
    const s = String(rawPrazo).trim()
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) {
      // DD/MM/AAAA → AAAA-MM-DD
      const [d, m, y] = s.split('/')
      prazo = `${y}-${m}-${d}`
    } else {
      prazo = s.slice(0, 10) // assume AAAA-MM-DD
    }
  }

  const statusValidos    = ['aberta','andamento','aguardando','concluida']
  const prioridadeValida = ['baixa','media','alta']
  const status    = String(row['Status']    || 'aberta').toLowerCase()
  const prioridade = String(row['Prioridade'] || 'media').toLowerCase()

  // Recorrência como anotação no obs (campo informativo — tarefas recorrentes automáticas usam Modelos)
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
