import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, BorderStyle, WidthType, ShadingType, HeadingLevel,
  Header, Footer, PageNumber, VerticalAlign, LevelFormat,
} from 'docx'

const C = '#1A4D3A'  // verde Fluxe
const BORDER = { style: BorderStyle.SINGLE, size: 1, color: 'D0D0D0' }
const BORDERS = { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER }
const NO_BORDER = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }
const NO_BORDERS = { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER }

const R = (text, opts = {}) => new TextRun({ text: String(text || ''), font: 'Arial', size: 22, ...opts })
const B = (text, opts = {}) => R(text, { bold: true, ...opts })

function spacer(before = 120, after = 0) {
  return new Paragraph({ children: [], spacing: { before, after } })
}

function titulo(text) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 160, after: 80 },
    children: [new TextRun({ text, font: 'Arial', size: 26, bold: true, color: C })]
  })
}

function subtitulo(text) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 200 },
    children: [new TextRun({ text, font: 'Arial', size: 20, italics: true, color: '6A6760' })]
  })
}

function secao(numeral, texto) {
  return new Paragraph({
    spacing: { before: 280, after: 100 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: C } },
    children: [new TextRun({ text: `${numeral} — ${texto}`, font: 'Arial', size: 22, bold: true, color: C })]
  })
}

function clausula(num, texto) {
  return new Paragraph({
    spacing: { before: 160, after: 60 },
    children: [B(`CLÁUSULA ${num}ª — ${texto}`)]
  })
}

function paragrafo(children, opts = {}) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { before: 60, after: 60 },
    ...opts,
    children: Array.isArray(children) ? children : [R(children)]
  })
}

function item(text) {
  return new Paragraph({
    numbering: { reference: 'bullets', level: 0 },
    spacing: { before: 40, after: 40 },
    children: [R(text)]
  })
}

function tabelaServicos(servicos) {
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [4680, 4680],
    rows: [
      new TableRow({
        tableHeader: true,
        children: [
          new TableCell({
            borders: BORDERS, width: { size: 4680, type: WidthType.DXA },
            shading: { fill: C, type: ShadingType.CLEAR },
            margins: { top: 80, bottom: 80, left: 140, right: 140 },
            children: [new Paragraph({ children: [new TextRun({ text: 'Serviço', font: 'Arial', size: 20, bold: true, color: 'FFFFFF' })] })]
          }),
          new TableCell({
            borders: BORDERS, width: { size: 4680, type: WidthType.DXA },
            shading: { fill: C, type: ShadingType.CLEAR },
            margins: { top: 80, bottom: 80, left: 140, right: 140 },
            children: [new Paragraph({ children: [new TextRun({ text: 'Descrição / Escopo', font: 'Arial', size: 20, bold: true, color: 'FFFFFF' })] })]
          }),
        ]
      }),
      ...servicos.map((it, idx) =>
        new TableRow({
          children: [
            new TableCell({
              borders: BORDERS, width: { size: 4680, type: WidthType.DXA },
              shading: { fill: idx % 2 === 0 ? 'FFFFFF' : 'F9F8F5', type: ShadingType.CLEAR },
              margins: { top: 80, bottom: 80, left: 140, right: 140 },
              children: [new Paragraph({ children: [B(it.nome)] })]
            }),
            new TableCell({
              borders: BORDERS, width: { size: 4680, type: WidthType.DXA },
              shading: { fill: idx % 2 === 0 ? 'FFFFFF' : 'F9F8F5', type: ShadingType.CLEAR },
              margins: { top: 80, bottom: 80, left: 140, right: 140 },
              children: [new Paragraph({ children: [R(it.motivo || '')] })]
            }),
          ]
        })
      )
    ]
  })
}

function tabelaVolume(rows) {
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [5760, 3600],
    rows: [
      new TableRow({
        tableHeader: true,
        children: [
          new TableCell({
            borders: BORDERS, width: { size: 5760, type: WidthType.DXA },
            shading: { fill: C, type: ShadingType.CLEAR },
            margins: { top: 80, bottom: 80, left: 140, right: 140 },
            children: [new Paragraph({ children: [new TextRun({ text: 'Serviço', font: 'Arial', size: 20, bold: true, color: 'FFFFFF' })] })]
          }),
          new TableCell({
            borders: BORDERS, width: { size: 3600, type: WidthType.DXA },
            shading: { fill: C, type: ShadingType.CLEAR },
            margins: { top: 80, bottom: 80, left: 140, right: 140 },
            children: [new Paragraph({ children: [new TextRun({ text: 'Limite Mensal', font: 'Arial', size: 20, bold: true, color: 'FFFFFF' })] })]
          }),
        ]
      }),
      ...rows.map(([servico, limite], idx) =>
        new TableRow({
          children: [
            new TableCell({
              borders: BORDERS, width: { size: 5760, type: WidthType.DXA },
              shading: { fill: idx % 2 === 0 ? 'FFFFFF' : 'F9F8F5', type: ShadingType.CLEAR },
              margins: { top: 80, bottom: 80, left: 140, right: 140 },
              children: [new Paragraph({ children: [R(servico)] })]
            }),
            new TableCell({
              borders: BORDERS, width: { size: 3600, type: WidthType.DXA },
              shading: { fill: idx % 2 === 0 ? 'FFFFFF' : 'F9F8F5', type: ShadingType.CLEAR },
              margins: { top: 80, bottom: 80, left: 140, right: 140 },
              children: [new Paragraph({ children: [B(limite)] })]
            }),
          ]
        })
      )
    ]
  })
}

function blocoValor(valor, diaVenc, formaPag) {
  const fmtVal = valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 })
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [9360],
    rows: [new TableRow({ children: [new TableCell({
      borders: BORDERS, width: { size: 9360, type: WidthType.DXA },
      shading: { fill: 'EAF2ED', type: ShadingType.CLEAR },
      margins: { top: 200, bottom: 200, left: 200, right: 200 },
      verticalAlign: VerticalAlign.CENTER,
      children: [
        new Paragraph({ alignment: AlignmentType.CENTER, children: [
          new TextRun({ text: 'MENSALIDADE CONTRATADA', font: 'Arial', size: 18, bold: true, color: C })
        ]}),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [
          new TextRun({ text: fmtVal, font: 'Arial', size: 48, bold: true, color: C })
        ]}),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [
          new TextRun({ text: `Pagamento até o dia ${diaVenc} de cada mês via ${formaPag}`, font: 'Arial', size: 20, color: '2D7A5A' })
        ]}),
      ]
    })]})],
  })
}

function assinaturas(nomeEmp, repEmp, cargoRep, nomeCliente, cidadeEmp, dataFmt) {
  const linha = (nome, cargo) => new TableCell({
    borders: NO_BORDERS, width: { size: 4080, type: WidthType.DXA },
    margins: { top: 80, bottom: 80, left: 0, right: 0 },
    children: [
      new Paragraph({ alignment: AlignmentType.CENTER, border: { top: { style: BorderStyle.SINGLE, size: 4, color: '1a1a1a' } },
        children: [R(nome, { bold: true })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [R(cargo, { color: '6A6760', size: 20 })] }),
    ]
  })

  return [
    spacer(400),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [R(`${cidadeEmp}, ${dataFmt}`)] }),
    spacer(200),
    new Table({
      width: { size: 9360, type: WidthType.DXA },
      columnWidths: [4080, 1200, 4080],
      rows: [new TableRow({ children: [
        linha(nomeEmp, `${repEmp} | ${cargoRep} | CONTRATADA`),
        new TableCell({ borders: NO_BORDERS, width: { size: 1200, type: WidthType.DXA }, children: [new Paragraph({})] }),
        linha(nomeCliente || 'CONTRATANTE', 'Representante Legal | CONTRATANTE'),
      ]})]
    })
  ]
}

export async function gerarContratoDocx({ calc, contratoForm, empresa, valorProposta }) {
  const emp = empresa || {}
  const prop = emp.config?.proposta || {}

  const nomeEmp   = emp.nome        || 'SUA EMPRESA'
  const cnpjEmp   = emp.cnpj        || '00.000.000/0001-00'
  const emailEmp  = emp.email       || 'contato@suaempresa.com.br'
  const telEmp    = emp.telefone    || ''
  const repEmp    = prop.representante || emp.representante || 'Representante Legal'
  const cargoRep  = prop.cargo      || 'Sócio(a) Administrador(a)'
  const cpfRep    = prop.cpf_rep    || '___.___.___-__'
  const enderecoEmp = prop.endereco || emp.endereco || ''
  const cidadeEmp = prop.cidade     || emp.cidade   || 'Sua Cidade/UF'
  const foro      = prop.foro       || cidadeEmp

  const val = parseFloat(valorProposta) || 0
  const fmtVal = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 })

  const dataHoje = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
  const dataInicioFmt = contratoForm.dataInicio
    ? new Date(contratoForm.dataInicio + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
    : '___/___/______'

  const vigenciaTexto = {
    '6': '6 (seis) meses', '12': '12 (doze) meses',
    '24': '24 (vinte e quatro) meses', 'indeterminado': 'prazo indeterminado',
  }[contratoForm.vigencia] || '12 (doze) meses'

  const servicos = (calc.items || []).filter(it => !it.nome.includes('Ajuste de porte'))

  const volumeRows = [
    calc.d.bancos > 0 && [`Contas bancárias monitoradas`, `Até ${calc.d.bancos} conta${calc.d.bancos > 1 ? 's' : ''}`],
    calc.d.capag  > 0 && [`Contas a pagar`, `Até ${Math.ceil(calc.d.capag * 1.5)} títulos/mês`],
    calc.d.carec  > 0 && [`Contas a receber`, `Até ${Math.ceil(calc.d.carec * 1.5)} recebíveis/mês`],
    calc.d.nfs    > 0 && [`Emissão de notas fiscais`, `Até ${Math.ceil(calc.d.nfs * 1.5)} NFs/mês`],
    calc.d.boletos > 0 && [`Emissão de boletos`, `Até ${Math.ceil(calc.d.boletos * 1.5)} boletos/mês`],
  ].filter(Boolean)

  const doc = new Document({
    numbering: {
      config: [{
        reference: 'bullets',
        levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 }, spacing: { before: 40, after: 40 } },
            run: { font: 'Arial', size: 22, color: C } } }]
      }]
    },
    styles: {
      default: { document: { run: { font: 'Arial', size: 22 } } }
    },
    sections: [{
      properties: {
        page: {
          size: { width: 11906, height: 16838 }, // A4
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1800 }
        }
      },
      headers: {
        default: new Header({ children: [
          new Paragraph({
            border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: C } },
            spacing: { after: 80 },
            children: [
              new TextRun({ text: nomeEmp, font: 'Arial', size: 20, bold: true, color: C }),
              new TextRun({ text: `  |  CNPJ: ${cnpjEmp}  |  ${emailEmp}${telEmp ? '  |  ' + telEmp : ''}`, font: 'Arial', size: 18, color: '6A6760' }),
            ]
          })
        ]})
      },
      footers: {
        default: new Footer({ children: [
          new Paragraph({
            border: { top: { style: BorderStyle.SINGLE, size: 4, color: 'D0D0D0' } },
            spacing: { before: 80 },
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: 'Página ', font: 'Arial', size: 18, color: '6A6760' }),
              new TextRun({ children: [PageNumber.CURRENT], font: 'Arial', size: 18, color: '6A6760' }),
              new TextRun({ text: ' de ', font: 'Arial', size: 18, color: '6A6760' }),
              new TextRun({ children: [PageNumber.TOTAL_PAGES], font: 'Arial', size: 18, color: '6A6760' }),
              new TextRun({ text: `  —  ${nomeEmp}  —  Contrato de Prestação de Serviços`, font: 'Arial', size: 18, color: '6A6760' }),
            ]
          })
        ]})
      },
      children: [
        spacer(80),
        titulo('CONTRATO DE PRESTAÇÃO DE SERVIÇOS'),
        titulo('DE APOIO ADMINISTRATIVO FINANCEIRO'),
        subtitulo('Instrumento Particular com Força Executiva'),

        // I — DAS PARTES
        secao('I', 'DAS PARTES'),
        paragrafo([B('CONTRATANTE:')]),
        paragrafo([B('Razão Social: '), R(calc.d.nome || '___________________________')]),
        paragrafo([B('CNPJ: '), R('___________________________  '), B('E-mail: '), R('___________________________')]),
        paragrafo([B('Endereço: '), R('___________________________________________________________________')]),
        paragrafo([B('Representado(a) por: '), R('_________________________________  '), B('CPF: '), R('_______________')]),
        spacer(120),
        paragrafo([B('CONTRATADA:')]),
        paragrafo([B('Razão Social: '), B(nomeEmp), R('  |  '), B('CNPJ: '), R(cnpjEmp)]),
        enderecoEmp ? paragrafo([B('Endereço: '), R(enderecoEmp)]) : null,
        paragrafo([B('E-mail: '), R(emailEmp), telEmp ? R(`  |  WhatsApp/Tel.: ${telEmp}`) : R('')]),
        paragrafo([B('Representada por: '), B(repEmp), R(`  |  Cargo: ${cargoRep}  |  CPF: ${cpfRep}`)]),

        // II — DO OBJETO
        secao('II', 'DO OBJETO'),
        clausula('1', 'Do Objeto'),
        paragrafo('O presente contrato tem por objeto a prestação de serviços especializados de apoio administrativo financeiro, compreendendo:'),
        spacer(80),
        tabelaServicos(servicos),
        spacer(80),
        paragrafo([B('Parágrafo Único: '), R('A disponibilização de funcionalidades específicas está condicionada ao plano do sistema de gestão operacional contratado pela CONTRATANTE.')]),

        // III — CONDIÇÕES DE EXECUÇÃO
        secao('III', 'DAS CONDIÇÕES DE EXECUÇÃO'),
        clausula('2', 'Do Horário e Entregas'),
        paragrafo('Os serviços serão prestados remotamente, de segunda a sexta-feira, das 09h00 às 17h00 (horário de Brasília). Os relatórios mensais serão entregues até o 10º dia útil do mês subsequente, desde que a CONTRATANTE envie os documentos até o dia 5.'),

        clausula('3', 'Das Responsabilidades da CONTRATANTE'),
        item('Fornecer documentos e acessos até o dia 5 de cada mês'),
        item('Responder às solicitações em até 48 horas úteis'),
        item('Manter atualizados os acessos às plataformas utilizadas'),
        calc.d.agend > 0 ? item('Manter saldo bancário suficiente para os agendamentos de pagamentos') : null,
        calc.d.nfs > 0 ? item('Fornecer dados completos para emissão de notas fiscais') : null,

        clausula('4', 'Das Vedações à CONTRATADA'),
        paragrafo('Não integram o escopo: negociação com terceiros em nome da CONTRATANTE; tomada de decisões gerenciais; cobranças a clientes; controle de caixa físico; obrigações fiscais acessórias (SPED, EFD, DCTF), salvo se expressamente previsto em aditivo contratual.'),

        // IV — VALORES
        secao('IV', 'DOS VALORES E REAJUSTE'),
        clausula('5', 'Dos Honorários'),
        spacer(80),
        blocoValor(val, contratoForm.diaVencimento, contratoForm.formaPagamento),
        spacer(80),
        paragrafo(`O primeiro honorário será pago no ato da assinatura deste instrumento. Os demais serão pagos até o dia ${contratoForm.diaVencimento} de cada mês via ${contratoForm.formaPagamento}.`),

        clausula('6', 'Do Volume de Serviços'),
        paragrafo('Os serviços estão limitados aos volumes abaixo. Ultrapassados estes limites, horas adicionais serão orçadas separadamente.'),
        spacer(80),
        volumeRows.length > 0 ? tabelaVolume(volumeRows) : null,
        spacer(80),

        clausula('7', 'Do Reajuste'),
        paragrafo(`O valor dos honorários será reajustado anualmente, a partir do 13º mês de vigência, com base na variação acumulada ${
          contratoForm.indiceReajuste === 'Salário Mínimo Federal' ? 'do Salário Mínimo Federal' :
          contratoForm.indiceReajuste === 'Fixo (sem reajuste)' ? '— sem reajuste automático previsto' :
          `do índice ${contratoForm.indiceReajuste}`
        } no período.`),

        clausula('8', 'Da Inadimplência'),
        paragrafo('O não pagamento até o vencimento implicará multa de 2% sobre o valor devido, acrescida de juros de 1% ao mês e correção monetária pelo IPCA. Após 30 dias de inadimplência, a CONTRATADA poderá suspender os serviços mediante notificação por e-mail.'),

        // V — VIGÊNCIA E RESCISÃO
        secao('V', 'DA VIGÊNCIA E RESCISÃO'),
        clausula('9', 'Da Vigência'),
        paragrafo(`O presente contrato entra em vigor na data de ${dataInicioFmt} e tem vigência de ${vigenciaTexto}, renovando-se automaticamente por iguais períodos, salvo manifestação contrária de qualquer das partes com antecedência mínima de 30 dias.`),

        clausula('10', 'Da Rescisão'),
        paragrafo('Qualquer das partes poderá rescindir o presente contrato mediante notificação por escrito com antecedência mínima de 30 (trinta) dias corridos. A rescisão imotivada pela CONTRATANTE antes do término da vigência implica multa de 20% sobre o saldo remanescente do contrato.'),

        clausula('11', 'Das Causas Imediatas de Rescisão'),
        item('Descumprimento reiterado de obrigações contratuais por qualquer das partes'),
        item('Inadimplência superior a 30 dias não regularizada'),
        item('Prática de atos ilícitos ou contrários à ética profissional'),
        item('Encerramento das atividades de qualquer das partes'),

        // VI — CONFIDENCIALIDADE
        secao('VI', 'DA CONFIDENCIALIDADE E PROTEÇÃO DE DADOS'),
        clausula('12', 'Da Confidencialidade'),
        paragrafo('A CONTRATADA compromete-se a manter sigilo absoluto sobre todas as informações financeiras, operacionais e estratégicas da CONTRATANTE, durante a vigência do contrato e por 5 (cinco) anos após o seu encerramento.'),

        clausula('13', 'Da Lei Geral de Proteção de Dados — LGPD'),
        paragrafo('As partes comprometem-se a tratar os dados pessoais a que tiverem acesso em estrita conformidade com a Lei nº 13.709/2018 (LGPD), adotando medidas técnicas e organizacionais adequadas para garantir a segurança e confidencialidade dos dados.'),

        // VII — DISPOSIÇÕES GERAIS
        secao('VII', 'DAS DISPOSIÇÕES GERAIS'),
        clausula('14', 'Da Natureza do Vínculo'),
        paragrafo('Este contrato não estabelece entre as partes qualquer vínculo empregatício, societário ou de representação comercial. A CONTRATADA é prestadora autônoma de serviços.'),

        clausula('15', 'Do Foro'),
        paragrafo(`As partes elegem o foro da comarca de ${foro} para dirimir quaisquer controvérsias decorrentes deste instrumento, com exclusão de qualquer outro, por mais privilegiado que seja.`),

        clausula('16', 'Da Integralidade'),
        paragrafo('Este instrumento constitui o acordo integral entre as partes, substituindo toda e qualquer negociação anterior, verbal ou escrita. Qualquer alteração somente terá validade se realizada por escrito e assinada por ambas as partes.'),

        spacer(80),
        paragrafo(`E, por estarem assim justas e contratadas, as partes assinam o presente instrumento em 2 (duas) vias de igual teor e forma.`),

        ...assinaturas(nomeEmp, repEmp, cargoRep, calc.d.nome, cidadeEmp, dataHoje),
      ].filter(Boolean)
    }]
  })

  const blob = await Packer.toBlob(doc)
  return blob
}

export function downloadContratoDocx(blob, nomeCliente) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `Contrato_${(nomeCliente || 'Cliente').replace(/\s+/g, '_')}_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.docx`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
